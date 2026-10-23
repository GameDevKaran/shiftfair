import { LIMITS } from './model.js';
import type { Assignment, Plan, Preference, Schedule, Shift, SolveOptions, SolveResult } from './model.js';

const idPattern = /^[A-Za-z][A-Za-z0-9_-]{0,39}$/;
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const numberIn = (value: unknown, min: number, max: number, step = 1): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max && Number.isInteger(value / step);
const validLabel = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= LIMITS.label && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value);
const validId = (value: unknown): value is string => typeof value === 'string' && idPattern.test(value);
const pair = (volunteerId: string, shiftId: string) => `${volunteerId}\u0000${shiftId}`;
const overlaps = (a: Shift, b: Shift) => a.start < b.start + b.duration && b.start < a.start + a.duration;

function exactKeys(value: Record<string, unknown>, expected: string[], location: string, errors: string[]): void {
  const wanted = new Set(expected);
  if (Object.keys(value).some(key => !wanted.has(key)) || expected.some(key => !Object.hasOwn(value, key))) {
    errors.push(`${location} has missing or unsupported fields.`);
  }
}

/** Validate untrusted JSON before the solver or renderer dereferences it. */
export function validatePlan(value: unknown): string[] {
  const errors: string[] = [];
  try {
    if (!record(value)) return ['The plan must be an object.'];
    exactKeys(value, ['version', 'title', 'volunteers', 'shifts', 'preferences'], 'Plan', errors);
    if (value.version !== 1) errors.push('Unsupported plan version; expected version 1.');
    if (!validLabel(value.title)) errors.push('Event title must contain 1–80 characters.');
    if (!Array.isArray(value.volunteers) || value.volunteers.length < 1 || value.volunteers.length > LIMITS.volunteers) errors.push('Add between 1 and 12 volunteers.');
    if (!Array.isArray(value.shifts) || value.shifts.length < 1 || value.shifts.length > LIMITS.shifts) errors.push('Add between 1 and 8 shifts.');
    if (!Array.isArray(value.preferences) || value.preferences.length > LIMITS.volunteers * LIMITS.shifts) errors.push('Preferences must be a bounded availability matrix.');
    if (!Array.isArray(value.volunteers) || !Array.isArray(value.shifts) || !Array.isArray(value.preferences) || value.volunteers.length > 12 || value.shifts.length > 8 || value.preferences.length > 96) return errors;
    const volunteerIds = new Set<string>();
    const shiftIds = new Set<string>();
    value.volunteers.forEach((person, index) => {
      const location = `Volunteer ${index + 1}`;
      if (!record(person)) { errors.push(`${location} must be an object.`); return; }
      exactKeys(person, ['id', 'name', 'maxHours'], location, errors);
      if (!validId(person.id)) errors.push(`${location} has an invalid identifier.`);
      else if (volunteerIds.has(person.id)) errors.push(`${location} duplicates volunteer identifier ${person.id}.`);
      else volunteerIds.add(person.id);
      if (!validLabel(person.name)) errors.push(`${location} name must contain 1–80 characters.`);
      if (!numberIn(person.maxHours, 0, 168, 0.5)) errors.push(`${location} maximum hours must be 0–168 in half-hour increments.`);
    });
    value.shifts.forEach((shift, index) => {
      const location = `Shift ${index + 1}`;
      if (!record(shift)) { errors.push(`${location} must be an object.`); return; }
      exactKeys(shift, ['id', 'name', 'start', 'duration', 'minimum'], location, errors);
      if (!validId(shift.id)) errors.push(`${location} has an invalid identifier.`);
      else if (shiftIds.has(shift.id)) errors.push(`${location} duplicates shift identifier ${shift.id}.`);
      else shiftIds.add(shift.id);
      if (!validLabel(shift.name)) errors.push(`${location} name must contain 1–80 characters.`);
      if (!numberIn(shift.start, 0, 10050, 30)) errors.push(`${location} start must be a half-hour within the seven-day week.`);
      if (!numberIn(shift.duration, 30, 720, 30)) errors.push(`${location} duration must be 0.5–12 hours in half-hour increments.`);
      if (typeof shift.start === 'number' && typeof shift.duration === 'number' && shift.start + shift.duration > 10080) errors.push(`${location} ends outside the seven-day week.`);
      if (!numberIn(shift.minimum, 1, 12)) errors.push(`${location} minimum staffing must be an integer from 1 to 12.`);
    });
    const seen = new Set<string>();
    value.preferences.forEach((preference, index) => {
      const location = `Availability entry ${index + 1}`;
      if (!record(preference)) { errors.push(`${location} must be an object.`); return; }
      exactKeys(preference, ['volunteerId', 'shiftId', 'available', 'weight', 'locked'], location, errors);
      if (!validId(preference.volunteerId) || !volunteerIds.has(preference.volunteerId)) errors.push(`${location} refers to an unknown volunteer.`);
      if (!validId(preference.shiftId) || !shiftIds.has(preference.shiftId)) errors.push(`${location} refers to an unknown shift.`);
      if (typeof preference.available !== 'boolean' || typeof preference.locked !== 'boolean') errors.push(`${location} availability and lock must be true or false.`);
      if (!numberIn(preference.weight, 0, 10)) errors.push(`${location} inconvenience weight must be an integer from 0 to 10.`);
      if (typeof preference.volunteerId === 'string' && typeof preference.shiftId === 'string') {
        const key = pair(preference.volunteerId, preference.shiftId);
        if (seen.has(key)) errors.push(`${location} duplicates an availability entry.`);
        seen.add(key);
      }
    });
    for (const volunteerId of volunteerIds) for (const shiftId of shiftIds) {
      if (!seen.has(pair(volunteerId, shiftId))) errors.push(`Missing availability for ${volunteerId} on ${shiftId}.`);
    }
    return errors;
  } catch {
    return ['The plan contains unreadable or malformed fields.'];
  }
}

/** Independently check all hard constraints, including complete coverage. */
export function validateSchedule(plan: Plan, assignments: Assignment[]): string[] {
  const planErrors = validatePlan(plan);
  if (planErrors.length) return planErrors;
  if (!Array.isArray(assignments) || assignments.length > 96) return ['Schedule assignments must be a bounded array.'];
  const errors: string[] = [];
  const people = new Map(plan.volunteers.map(person => [person.id, person]));
  const shifts = new Map(plan.shifts.map(shift => [shift.id, shift]));
  const preferences = new Map(plan.preferences.map(preference => [pair(preference.volunteerId, preference.shiftId), preference]));
  const seen = new Set<string>();
  const personal = new Map(plan.volunteers.map(person => [person.id, [] as Shift[]]));
  const counts = new Map(plan.shifts.map(shift => [shift.id, 0]));
  assignments.forEach((assignment, index) => {
    if (!record(assignment)) { errors.push(`Assignment ${index + 1} is malformed.`); return; }
    exactKeys(assignment, ['volunteerId', 'shiftId'], `Assignment ${index + 1}`, errors);
    const person = people.get(assignment.volunteerId as string);
    const shift = shifts.get(assignment.shiftId as string);
    if (!person || !shift) { errors.push(`Assignment ${index + 1} references an unknown person or shift.`); return; }
    const key = pair(person.id, shift.id);
    if (seen.has(key)) { errors.push(`${person.name} is assigned twice to ${shift.name}.`); return; }
    seen.add(key);
    const preference = preferences.get(key)!;
    if (!preference.available) errors.push(`${person.name} is unavailable for ${shift.name}.`);
    personal.get(person.id)!.push(shift);
    counts.set(shift.id, counts.get(shift.id)! + 1);
  });
  for (const shift of plan.shifts) {
    const count = counts.get(shift.id)!;
    if (count < shift.minimum) errors.push(`${shift.name} needs ${shift.minimum} volunteers; only ${count} assigned.`);
  }
  for (const person of plan.volunteers) {
    const assigned = personal.get(person.id)!;
    const hours = assigned.reduce((sum, shift) => sum + shift.duration / 60, 0);
    if (hours > person.maxHours) errors.push(`${person.name} has ${hours} hours, above the ${person.maxHours}-hour maximum.`);
    for (let a = 0; a < assigned.length; a++) for (let b = a + 1; b < assigned.length; b++) {
      if (overlaps(assigned[a]!, assigned[b]!)) errors.push(`${person.name} has overlapping shifts: ${assigned[a]!.name} and ${assigned[b]!.name}.`);
    }
  }
  for (const preference of plan.preferences) {
    if (preference.locked && !seen.has(pair(preference.volunteerId, preference.shiftId))) {
      errors.push(`Locked assignment missing: ${people.get(preference.volunteerId)!.name} on ${shifts.get(preference.shiftId)!.name}.`);
    }
  }
  return errors;
}

function scoreValid(plan: Plan, assignments: Assignment[]): Schedule {
  const shifts = new Map(plan.shifts.map(shift => [shift.id, shift]));
  const preferences = new Map(plan.preferences.map(preference => [pair(preference.volunteerId, preference.shiftId), preference]));
  const people = plan.volunteers.map(person => ({ volunteerId: person.id, hours: 0, burden: 0 }));
  const byId = new Map(people.map(person => [person.volunteerId, person]));
  for (const assignment of assignments) {
    const hours = shifts.get(assignment.shiftId)!.duration / 60;
    const person = byId.get(assignment.volunteerId)!;
    person.hours += hours;
    person.burden += hours * (1 + preferences.get(pair(assignment.volunteerId, assignment.shiftId))!.weight);
  }
  return {
    assignments: assignments.map(assignment => ({ ...assignment })), people,
    required: plan.shifts.reduce((sum, shift) => sum + shift.minimum, 0), assigned: assignments.length,
    maxBurden: Math.max(...people.map(person => person.burden)),
    sumSquares: people.reduce((sum, person) => sum + person.burden ** 2, 0),
    totalBurden: people.reduce((sum, person) => sum + person.burden, 0),
  };
}

export function scoreSchedule(plan: Plan, assignments: Assignment[]): Schedule {
  const errors = validateSchedule(plan, assignments);
  if (errors.length) throw new Error(`Cannot score an invalid schedule: ${errors.join(' ')}`);
  return scoreValid(plan, assignments);
}

function directConflicts(plan: Plan): string[] {
  const reasons: string[] = [];
  const pref = new Map(plan.preferences.map(value => [pair(value.volunteerId, value.shiftId), value]));
  for (const person of plan.volunteers) {
    const locked = plan.shifts.filter(shift => pref.get(pair(person.id, shift.id))!.locked);
    for (const shift of locked) if (!pref.get(pair(person.id, shift.id))!.available) reasons.push(`${person.name} is locked to ${shift.name} but marked unavailable.`);
    const hours = locked.reduce((sum, shift) => sum + shift.duration / 60, 0);
    if (hours > person.maxHours) reasons.push(`${person.name}'s locked shifts require ${hours} hours, above the ${person.maxHours}-hour maximum.`);
    for (let a = 0; a < locked.length; a++) for (let b = a + 1; b < locked.length; b++) {
      if (overlaps(locked[a]!, locked[b]!)) reasons.push(`${person.name}'s locked shifts overlap: ${locked[a]!.name} and ${locked[b]!.name}.`);
    }
  }
  for (const shift of plan.shifts) {
    const eligible = plan.volunteers.filter(person => pref.get(pair(person.id, shift.id))!.available && person.maxHours >= shift.duration / 60).length;
    if (eligible < shift.minimum) reasons.push(`${shift.name} needs ${shift.minimum} volunteers, but only ${eligible} are available with enough maximum hours for this shift.`);
  }
  const minimumHours = plan.shifts.reduce((sum, shift) => sum + shift.duration / 60 * Math.max(shift.minimum, plan.preferences.filter(value => value.shiftId === shift.id && value.locked).length), 0);
  const totalCapacity = plan.volunteers.reduce((sum, person) => sum + person.maxHours, 0);
  if (minimumHours > totalCapacity) reasons.push(`Required staffing and locks need at least ${minimumHours} hours, but all maximum-hour limits total ${totalCapacity}.`);
  return reasons;
}

const better = (left: Schedule, right: Schedule) => left.maxBurden < right.maxBurden ||
  (left.maxBurden === right.maxBurden && (left.sumSquares < right.sumSquares ||
    (left.sumSquares === right.sumSquares && left.totalBurden < right.totalBurden)));

/** Bounded complete search when exhausted; no timeout can establish infeasibility. */
export function solve(plan: Plan, options: SolveOptions = {}): SolveResult {
  const started = performance.now();
  let nodes = 0;
  const finish = (status: SolveResult['status'], reasons: string[], exhausted: boolean, optimal = false, baseline?: Schedule, candidate?: Schedule): SolveResult => ({
    status, reasons, nodes, elapsedMs: Math.max(0, performance.now() - started), exhausted, optimal,
    ...(baseline ? { baseline } : {}), ...(candidate ? { candidate } : {}),
  });
  const inputErrors = validatePlan(plan);
  if (inputErrors.length) return finish('invalid', inputErrors, false);
  const maxNodes = options.maxNodes ?? 200000;
  const maxMs = options.maxMs ?? 1500;
  if (!numberIn(maxNodes, 0, 2000000) || !numberIn(maxMs, 0, 30000, 0.001)) return finish('invalid', ['Search limits must be finite: 0–2,000,000 nodes and 0–30,000 milliseconds.'], false);
  const conflicts = directConflicts(plan);
  if (conflicts.length) return finish('infeasible', conflicts, true);

  const preferences = new Map(plan.preferences.map(value => [pair(value.volunteerId, value.shiftId), value]));
  const hours = new Array<number>(plan.volunteers.length).fill(0);
  const assignedShifts = plan.volunteers.map(() => [] as Shift[]);
  const assignments: Assignment[] = [];
  let baseline: Schedule | undefined;
  let candidate: Schedule | undefined;
  let limited = false;
  const step = (): boolean => {
    if (nodes >= maxNodes || performance.now() - started >= maxMs) { limited = true; return false; }
    nodes++;
    return true;
  };
  // Tightest availability first reduces dead branches; ties keep the authored order.
  const ordered = plan.shifts.map((shift, index) => ({ shift, index, eligible: plan.volunteers.reduce((sum, person) => sum + Number(preferences.get(pair(person.id, shift.id))!.available && person.maxHours >= shift.duration / 60), 0) }))
    .sort((a, b) => (a.eligible - a.shift.minimum) - (b.eligible - b.shift.minimum) || a.index - b.index)
    .map(entry => entry.shift);

  const search = (shiftIndex: number): void => {
    if (!step()) return;
    if (shiftIndex === ordered.length) {
      const schedule = scoreValid(plan, assignments);
      if (!baseline) baseline = schedule;
      if (!candidate || better(schedule, candidate)) candidate = schedule;
      return;
    }
    const shift = ordered[shiftIndex]!;
    const durationHours = shift.duration / 60;
    const locked: number[] = [];
    const available: number[] = [];
    for (let personIndex = 0; personIndex < plan.volunteers.length; personIndex++) {
      const person = plan.volunteers[personIndex]!;
      const preference = preferences.get(pair(person.id, shift.id))!;
      const eligible = preference.available && hours[personIndex]! + durationHours <= person.maxHours && !assignedShifts[personIndex]!.some(previous => overlaps(previous, shift));
      if (preference.locked) {
        if (!eligible) return;
        locked.push(personIndex);
      } else if (eligible) available.push(personIndex);
    }
    const remaining = Math.max(0, shift.minimum - locked.length);
    if (available.length < remaining) return;
    const chosen = [...locked];
    const visit = (from: number, needed: number): void => {
      if (!step()) return;
      if (needed === 0) {
        for (const index of chosen) {
          hours[index] = hours[index]! + durationHours;
          assignedShifts[index]!.push(shift);
          assignments.push({ volunteerId: plan.volunteers[index]!.id, shiftId: shift.id });
        }
        search(shiftIndex + 1);
        for (let i = chosen.length - 1; i >= 0; i--) {
          const index = chosen[i]!;
          hours[index] = hours[index]! - durationHours;
          assignedShifts[index]!.pop();
          assignments.pop();
        }
        return;
      }
      for (let index = from; index <= available.length - needed && !limited; index++) {
        chosen.push(available[index]!);
        visit(index + 1, needed - 1);
        chosen.pop();
      }
    };
    visit(0, remaining);
  };
  search(0);
  if (candidate && baseline) {
    const finalErrors = [...validateSchedule(plan, baseline.assignments), ...validateSchedule(plan, candidate.assignments)];
    if (finalErrors.length) throw new Error(`Internal schedule invariant failed: ${finalErrors.join(' ')}`);
    const reasons = limited
      ? ['A valid full-coverage schedule was found. Search reached its limit; the best candidate found is not proven optimal.']
      : ['All relevant assignment combinations were exhausted. The candidate is optimal for the displayed burden objective while respecting every hard constraint.'];
    return finish('feasible', reasons, !limited, !limited, baseline, candidate);
  }
  if (limited) return finish('incomplete', ['Search reached its limit before finding a complete schedule. Feasibility is unknown; this is not proof of infeasibility.'], false);
  return finish('infeasible', ['Exhaustive search found no schedule satisfying availability, minimum staffing, maximum hours, overlaps and all locked assignments together. No constraint was relaxed.'], true);
}
