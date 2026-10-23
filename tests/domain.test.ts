import test from 'node:test';
import assert from 'node:assert/strict';
import type { Assignment, Plan } from '../src/model.js';
import { createSample } from '../src/sample.js';
import { scoreSchedule, solve, validatePlan, validateSchedule } from '../src/solver.js';

function fixture(people = 3, shifts = 3): Plan {
  const volunteers = Array.from({ length: people }, (_, i) => ({ id: `v${i}`, name: `Volunteer ${i + 1}`, maxHours: 3 }));
  const rota = Array.from({ length: shifts }, (_, i) => ({ id: `s${i}`, name: `Shift ${i + 1}`, start: 480 + i * 60, duration: 60, minimum: 1 }));
  return {
    version: 1, title: 'Synthetic oracle fixture', volunteers, shifts: rota,
    preferences: volunteers.flatMap(v => rota.map(s => ({ volunteerId: v.id, shiftId: s.id, available: true, weight: 0, locked: false }))),
  };
}

function preference(plan: Plan, volunteer: number, shift: number) {
  return plan.preferences.find(p => p.volunteerId === plan.volunteers[volunteer]!.id && p.shiftId === plan.shifts[shift]!.id)!;
}

// Deliberately independent of production validation/scoring/search: enumerate every
// binary assignment matrix, including overstaffed solutions, then check each rule.
function oracleScore(plan: Plan, assignments: Assignment[]): [number, number, number] | undefined {
  const occupied = new Set<string>();
  const hours = Array(plan.volunteers.length).fill(0) as number[];
  const burden = Array(plan.volunteers.length).fill(0) as number[];
  const staffing = Array(plan.shifts.length).fill(0) as number[];
  const intervals: Array<Array<[number, number]>> = plan.volunteers.map(() => []);
  for (const assignment of assignments) {
    const vi = plan.volunteers.findIndex(v => v.id === assignment.volunteerId);
    const si = plan.shifts.findIndex(s => s.id === assignment.shiftId);
    if (vi < 0 || si < 0) return undefined;
    const key = `${vi}/${si}`;
    if (occupied.has(key)) return undefined;
    occupied.add(key);
    const p = preference(plan, vi, si);
    const shift = plan.shifts[si]!;
    if (!p.available) return undefined;
    if (intervals[vi]!.some(([start, end]) => shift.start < end && start < shift.start + shift.duration)) return undefined;
    intervals[vi]!.push([shift.start, shift.start + shift.duration]);
    hours[vi]! += shift.duration / 60;
    burden[vi]! += shift.duration / 60 * (1 + p.weight);
    staffing[si]!++;
  }
  if (plan.volunteers.some((v, i) => hours[i]! > v.maxHours)) return undefined;
  if (plan.shifts.some((s, i) => staffing[i]! < s.minimum)) return undefined;
  if (plan.preferences.some(p => p.locked && !assignments.some(a => a.volunteerId === p.volunteerId && a.shiftId === p.shiftId))) return undefined;
  return [Math.max(...burden), burden.reduce((sum, x) => sum + x * x, 0), burden.reduce((sum, x) => sum + x, 0)];
}

function less(a: readonly number[], b: readonly number[]) {
  for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return a[i]! < b[i]!; }
  return false;
}

function exhaustiveOracle(plan: Plan) {
  const slots = plan.volunteers.flatMap(v => plan.shifts.map(s => ({ volunteerId: v.id, shiftId: s.id })));
  assert.ok(slots.length <= 12, 'Oracle intentionally only supports tiny independent cases');
  let optimum: [number, number, number] | undefined;
  for (let mask = 0; mask < 2 ** slots.length; mask++) {
    const assignments = slots.filter((_, i) => (mask & (1 << i)) !== 0);
    const score = oracleScore(plan, assignments);
    if (score && (!optimum || less(score, optimum))) optimum = score;
  }
  return optimum;
}

const cases: Array<{ name: string; feasible: boolean; plan: Plan }> = [];
function add(name: string, feasible: boolean, edit: (p: Plan) => void = () => {}, people = 3, shifts = 3) {
  const plan = fixture(people, shifts); edit(plan); cases.push({ name, feasible, plan });
}
add('equal inconvenience distributes complete coverage', true);
add('different inconvenience weights change the optimum', true, p => {
  preference(p, 0, 0).weight = 10; preference(p, 1, 1).weight = 4; preference(p, 2, 2).weight = 2;
});
add('maximum hours force three distinct people', true, p => { p.volunteers.forEach(v => { v.maxHours = 1; }); });
add('a locked assignment survives optimization', true, p => { preference(p, 0, 0).locked = true; preference(p, 0, 0).weight = 8; });
add('overlapping shifts use separate people', true, p => { p.shifts.forEach(s => { s.start = 480; }); });
add('surplus locked assignments remain despite minimum of one', true, p => {
  preference(p, 0, 0).locked = true; preference(p, 1, 0).locked = true;
}, 3, 2);
add('insufficient available staff is impossible', false, p => {
  p.shifts[0]!.minimum = 2; preference(p, 1, 0).available = false; preference(p, 2, 0).available = false;
});
add('insufficient total maximum hours is impossible', false, p => { p.volunteers.forEach(v => { v.maxHours = 0.5; }); });
add('unavailable locked person is impossible', false, p => { preference(p, 0, 0).locked = true; preference(p, 0, 0).available = false; });
add('overlapping locked shifts are impossible', false, p => {
  p.shifts[1]!.start = p.shifts[0]!.start;
  preference(p, 0, 0).locked = true; preference(p, 0, 1).locked = true;
});
add('locked hours beyond maximum are impossible', false, p => {
  p.volunteers[0]!.maxHours = 1; preference(p, 0, 0).locked = true; preference(p, 0, 1).locked = true;
});
add('overlap bottleneck is impossible despite individual shift eligibility', false, p => {
  p.shifts.forEach(s => { s.start = 480; });
  p.preferences.filter(x => x.volunteerId === p.volunteers[2]!.id).forEach(x => { x.available = false; });
});

for (const entry of cases) {
  test(`independent exhaustive oracle: ${entry.name}`, () => {
    assert.deepEqual(validatePlan(entry.plan), []);
    const oracle = exhaustiveOracle(entry.plan);
    assert.equal(Boolean(oracle), entry.feasible, 'The hand-authored expectation must agree with the independent oracle');
    const result = solve(entry.plan, { maxNodes: 200000, maxMs: 10000 });
    if (!oracle) {
      assert.equal(result.status, 'infeasible');
      assert.ok(result.reasons.length > 0);
      assert.equal(result.candidate, undefined);
      return;
    }
    assert.equal(result.status, 'feasible');
    assert.equal(result.exhausted, true);
    assert.equal(result.optimal, true);
    assert.ok(result.candidate); assert.ok(result.baseline);
    assert.deepEqual(oracleScore(entry.plan, result.candidate.assignments), oracle);
    assert.deepEqual([result.candidate.maxBurden, result.candidate.sumSquares, result.candidate.totalBurden], oracle);
    assert.ok(oracleScore(entry.plan, result.baseline.assignments));
    assert.deepEqual(validateSchedule(entry.plan, result.candidate.assignments), []);
    assert.deepEqual(validateSchedule(entry.plan, result.baseline.assignments), []);
    assert.ok(!less([result.baseline.maxBurden, result.baseline.sumSquares, result.baseline.totalBurden], oracle));
  });
}

test('synthetic demonstration improves maximum burden from eight to two without sacrificing coverage', () => {
  const result = solve(createSample());
  assert.equal(result.status, 'feasible'); assert.equal(result.optimal, true);
  assert.equal(result.baseline?.maxBurden, 8); assert.equal(result.candidate?.maxBurden, 2);
  assert.equal(result.baseline?.assigned, 4); assert.equal(result.candidate?.assigned, 4);
  assert.equal(result.candidate?.required, 4);
  assert.deepEqual(result.candidate?.people.map(p => p.burden), [2, 2, 2, 2]);
});

test('zero node and zero time budgets remain inconclusive rather than infeasible', () => {
  for (const options of [{ maxNodes: 0 }, { maxMs: 0 }]) {
    const result = solve(createSample(), options);
    assert.equal(result.status, 'incomplete'); assert.equal(result.exhausted, false); assert.equal(result.optimal, false);
    assert.equal(result.candidate, undefined); assert.ok(result.reasons.length > 0);
  }
});

test('a limited search can return a valid candidate without asserting optimality', () => {
  const plan = createSample(); const result = solve(plan, { maxNodes: 100, maxMs: 10000 });
  assert.equal(result.status, 'feasible'); assert.equal(result.exhausted, false); assert.equal(result.optimal, false);
  assert.ok(result.candidate); assert.ok(result.baseline); assert.ok(result.nodes <= 100);
  assert.ok(oracleScore(plan, result.candidate.assignments)); assert.ok(oracleScore(plan, result.baseline.assignments));
});

test('unmodified inputs produce deterministic assignments and scores', () => {
  const plan = createSample(); const before = JSON.stringify(plan);
  const first = solve(plan); const second = solve(plan);
  assert.deepEqual(second.baseline, first.baseline); assert.deepEqual(second.candidate, first.candidate);
  assert.equal(JSON.stringify(plan), before, 'Search must not change inputs, locks, weights or availability');
});

test('half-hour burden values are scored exactly, including idle volunteers', () => {
  const p = fixture(2, 1); p.shifts[0]!.duration = 30; preference(p, 0, 0).weight = 2;
  const result = scoreSchedule(p, [{ volunteerId: 'v0', shiftId: 's0' }]);
  assert.equal(result.people[0]?.hours, 0.5); assert.equal(result.people[0]?.burden, 1.5);
  assert.equal(result.people[1]?.burden, 0); assert.equal(result.sumSquares, 2.25);
});

test('schedule validator rejects undercoverage, duplicate, unknown and unavailable assignments', () => {
  const p = fixture(2, 1); const a = { volunteerId: 'v0', shiftId: 's0' };
  assert.ok(validateSchedule(p, []).length > 0);
  assert.ok(validateSchedule(p, [a, a]).length > 0);
  assert.ok(validateSchedule(p, [{ volunteerId: 'unknown', shiftId: 's0' }]).length > 0);
  preference(p, 0, 0).available = false;
  assert.ok(validateSchedule(p, [a]).length > 0);
});

test('schedule validator rejects dropped locks, excessive hours and overlapping assignments', () => {
  const p = fixture(2, 2);
  const both = [{ volunteerId: 'v0', shiftId: 's0' }, { volunteerId: 'v0', shiftId: 's1' }];
  preference(p, 1, 0).locked = true;
  assert.ok(validateSchedule(p, both).length > 0);
  preference(p, 1, 0).locked = false; p.volunteers[0]!.maxHours = 1;
  assert.ok(validateSchedule(p, both).length > 0);
  p.volunteers[0]!.maxHours = 3; p.shifts[1]!.start = p.shifts[0]!.start;
  assert.ok(validateSchedule(p, both).length > 0);
});

test('adjacent intervals are compatible and week boundary is supported', () => {
  const p = fixture(1, 2); p.shifts[0]!.start = 9960; p.shifts[1]!.start = 10020;
  const result = solve(p); assert.equal(result.status, 'feasible');
  assert.equal(result.candidate?.people[0]?.hours, 2);
});

test('malformed inputs are rejected without throwing or claiming mathematical infeasibility', () => {
  const invalid: unknown[] = [null, undefined, 42, [], {}, { version: 2 }, { ...fixture(), volunteers: null }];
  for (const mutate of [
    (p: Plan) => { p.volunteers[0]!.maxHours = -1; },
    (p: Plan) => { p.volunteers[0]!.maxHours = 0.25; },
    (p: Plan) => { p.volunteers[0]!.name = ' '; },
    (p: Plan) => { p.volunteers[0]!.name = 'x'.repeat(81); },
    (p: Plan) => { p.volunteers[1]!.id = p.volunteers[0]!.id; },
    (p: Plan) => { p.shifts[0]!.start = 31; },
    (p: Plan) => { p.shifts[0]!.duration = 0; },
    (p: Plan) => { p.shifts[0]!.start = 10050; },
    (p: Plan) => { p.shifts[0]!.minimum = 0; },
    (p: Plan) => { p.preferences.pop(); },
    (p: Plan) => { p.preferences[0]!.volunteerId = 'missing'; },
    (p: Plan) => { p.preferences[0]!.weight = 11; },
    (p: Plan) => { p.preferences[0]!.weight = 0.5; },
  ]) { const p = fixture(); mutate(p); invalid.push(p); }
  for (const value of invalid) {
    assert.ok(validatePlan(value).length > 0);
    const result = solve(value as Plan); assert.equal(result.status, 'invalid'); assert.equal(result.optimal, false);
  }
});

test('full supported size parses; exceeding either dimension is rejected', () => {
  const p = fixture(12, 8); assert.deepEqual(validatePlan(p), []);
  assert.ok(validatePlan(fixture(13, 8)).length > 0);
  assert.ok(validatePlan(fixture(12, 9)).length > 0);
});

test('changes to a locked schedule preserve that decision in the new result', () => {
  const p = createSample(); const first = solve(p); assert.ok(first.candidate);
  const locked = first.candidate.assignments[0]!;
  p.preferences.find(x => x.volunteerId === locked.volunteerId && x.shiftId === locked.shiftId)!.locked = true;
  p.preferences.find(x => x.volunteerId === locked.volunteerId && x.shiftId === locked.shiftId)!.weight = 10;
  const next = solve(p); assert.equal(next.status, 'feasible'); assert.ok(next.candidate);
  assert.ok(next.candidate.assignments.some(a => a.shiftId === locked.shiftId && a.volunteerId === locked.volunteerId));
  assert.deepEqual(validateSchedule(p, next.candidate.assignments), []);
});
