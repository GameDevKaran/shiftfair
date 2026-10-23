import type { Plan, Preference, Schedule, Shift, SolveResult, Volunteer } from './model.js';
import { LIMITS } from './model.js';
import { createSample } from './sample.js';
import { validatePlan, validateSchedule, scoreSchedule } from './solver.js';
import { loadPlan, savePlan } from './storage.js';
import { scheduleCsv, printSchedule, formatShiftTime } from './export.js';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const saved = loadPlan();
let plan: Plan = saved.plan ?? createSample();
let dirty = false;
let savedHere = Boolean(saved.plan);
let result: SolveResult | undefined;
let selected: 'baseline' | 'candidate' = 'candidate';
let worker: Worker | undefined;
let job = 0;

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, className?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function button(text: string, id: string, action: () => void, className = '') {
  const node = element('button', text, className); node.id = id; node.type = 'button'; node.addEventListener('click', action); return node;
}
function field(label: string, input: HTMLElement, className = '') {
  const wrapper = element('label', undefined, className); wrapper.htmlFor = input.id; wrapper.append(element('span', label), input); return wrapper;
}
function textInput(id: string, value: string, update: (value: string) => void, accessibleName?: string) {
  const input = element('input'); input.id = id; input.value = value; input.maxLength = LIMITS.label; input.autocomplete = 'off';
  if (accessibleName) input.setAttribute('aria-label', accessibleName);
  input.addEventListener('input', () => { update(input.value); invalidate(); });
  input.addEventListener('change', () => { renderPreferences(); });
  return input;
}
function numberInput(id: string, value: number, min: number, max: number, step: number, update: (value: number) => void, accessibleName?: string) {
  const input = element('input'); input.type = 'number'; input.id = id; input.value = String(value); input.min = String(min); input.max = String(max); input.step = String(step);
  if (accessibleName) input.setAttribute('aria-label', accessibleName);
  input.addEventListener('input', () => { update(input.value === '' ? NaN : Number(input.value)); invalidate(); });
  return input;
}
function checkInput(id: string, checked: boolean, label: string, update: (checked: boolean) => void) {
  const input = element('input'); input.type = 'checkbox'; input.id = id; input.checked = checked; input.setAttribute('aria-label', label);
  input.addEventListener('change', () => { update(input.checked); invalidate(); input.closest('td')?.classList.toggle('locked-cell', findPreferenceFromInput(id)?.locked ?? false); });
  return input;
}
function findPreferenceFromInput(id: string) { return plan.preferences.find(p => id === `lock-${p.volunteerId}-${p.shiftId}` || id === `available-${p.volunteerId}-${p.shiftId}`); }
function announce(message: string, tone: 'neutral' | 'success' | 'warning' = 'neutral') {
  $('status').textContent = message; $('status').dataset.tone = tone;
}
function stopWorker() {
  worker?.terminate(); worker = undefined; job += 1;
  $('generate').removeAttribute('disabled'); $('cancel-solve').hidden = true;
}
function updateSaveState() {
  $('save-state').textContent = dirty ? 'Unsaved changes · save explicitly in this browser.' : savedHere ? 'Saved inputs loaded · results are generated fresh.' : 'Synthetic example or new plan · not saved yet.';
  $('save-state').dataset.dirty = String(dirty);
}
function invalidate(message = 'Inputs changed. Generate again to review a current schedule.') {
  stopWorker(); dirty = true; result = undefined;
  $('results').hidden = true; $('export-csv').setAttribute('disabled', ''); $('print-plan').setAttribute('disabled', '');
  $('print-root').replaceChildren(); updateSaveState(); announce(message);
}
function preserveFocus(render: () => void) {
  const current = document.activeElement as HTMLInputElement | null;
  const id = current?.id; render();
  if (id) document.getElementById(id)?.focus({ preventScroll: true });
}
function nextId(prefix: string, existing: string[]) { let counter = 1; while (existing.includes(`${prefix}${counter}`)) counter += 1; return `${prefix}${counter}`; }
function preference(person: string, shift: string): Preference { return plan.preferences.find(p => p.volunteerId === person && p.shiftId === shift)!; }
function rebuildPreferences() {
  const old = plan.preferences;
  plan.preferences = plan.volunteers.flatMap(v => plan.shifts.map(s => old.find(p => p.volunteerId === v.id && p.shiftId === s.id) ?? { volunteerId: v.id, shiftId: s.id, available: true, weight: 0, locked: false }));
}
function table(headers: string[], id?: string) {
  const wrapper = element('div', undefined, 'table-scroll'); wrapper.tabIndex = 0; wrapper.setAttribute('role', 'region'); wrapper.setAttribute('aria-label', `${headers[0]} table; scroll horizontally if needed`);
  const grid = element('table'); if (id) grid.id = id;
  const thead = element('thead'); const row = element('tr');
  headers.forEach(text => { const th = element('th', text); th.scope = 'col'; row.append(th); });
  thead.append(row); const tbody = element('tbody'); grid.append(thead, tbody); wrapper.append(grid); return { wrapper, grid, tbody };
}
function cell(row: HTMLTableRowElement, value: string | HTMLElement, header = false) {
  const item = header ? element('th') : element('td'); if (header) (item as HTMLTableCellElement).scope = 'row';
  if (typeof value === 'string') item.textContent = value; else item.append(value); row.append(item); return item;
}
function renderVolunteers() {
  const root = $('volunteer-editor'); root.replaceChildren();
  if (!plan.volunteers.length) root.append(element('p', 'Add your first volunteer to start the worksheet.', 'empty-state'));
  for (const volunteer of plan.volunteers) {
    const row = element('div', undefined, 'volunteer-row');
    row.append(field('Name', textInput(`name-${volunteer.id}`, volunteer.name, value => { volunteer.name = value; }, `Name for ${volunteer.name || 'volunteer'}`)), field('Max hours', numberInput(`max-${volunteer.id}`, volunteer.maxHours, 0, 168, 0.5, value => { volunteer.maxHours = value; }, `Maximum hours for ${volunteer.name || 'volunteer'}`)));
    const remove = button('Remove', `remove-${volunteer.id}`, () => {
      if (!confirm(`Remove ${volunteer.name || 'this volunteer'} and their availability and locks?`)) return;
      plan.volunteers = plan.volunteers.filter(v => v.id !== volunteer.id); rebuildPreferences(); invalidate(); renderInputs(); $('add-volunteer').focus();
    }, 'remove-button'); remove.setAttribute('aria-label', `Remove volunteer ${volunteer.name || volunteer.id}`); row.append(remove); root.append(row);
  }
  $('volunteer-count').textContent = `${plan.volunteers.length} of ${LIMITS.volunteers} volunteers`;
  ($('add-volunteer') as HTMLButtonElement).disabled = plan.volunteers.length >= LIMITS.volunteers;
}
function renderShifts() {
  const root = $('shift-editor'); root.replaceChildren();
  if (!plan.shifts.length) root.append(element('p', 'Add the first shift and its required staffing.', 'empty-state'));
  for (const shift of plan.shifts) {
    const row = element('div', undefined, 'shift-card');
    const top = element('div', undefined, 'shift-title-row');
    top.append(field('Shift', textInput(`shift-name-${shift.id}`, shift.name, value => { shift.name = value; })));
    top.append(button('Remove', `remove-${shift.id}`, () => {
      if (!confirm(`Remove ${shift.name || 'this shift'} and all of its availability and locks?`)) return;
      plan.shifts = plan.shifts.filter(s => s.id !== shift.id); rebuildPreferences(); invalidate(); renderInputs(); $('add-shift').focus();
    }, 'remove-button'));
    const details = element('div', undefined, 'shift-fields');
    const day = element('select'); day.id = `day-${shift.id}`; day.setAttribute('aria-label', `Day for ${shift.name}`);
    days.forEach((label, i) => { const option = element('option', label); option.value = String(i); day.append(option); }); day.value = String(Math.floor(shift.start / 1440));
    day.addEventListener('change', () => { shift.start = Number(day.value) * 1440 + (shift.start % 1440); invalidate(); });
    const time = element('input'); time.type = 'time'; time.id = `time-${shift.id}`; time.step = '1800';
    const minutes = shift.start % 1440; time.value = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    time.setAttribute('aria-label', `Start time for ${shift.name}`);
    time.addEventListener('input', () => { const [hours = NaN, mins = NaN] = time.value.split(':').map(Number); shift.start = Number(day.value) * 1440 + hours * 60 + mins; invalidate(); });
    details.append(field('Day', day), field('Starts', time), field('Hours', numberInput(`duration-${shift.id}`, shift.duration / 60, 0.5, 12, 0.5, value => { shift.duration = value * 60; }, `Duration in hours for ${shift.name}`)), field('Min people', numberInput(`minimum-${shift.id}`, shift.minimum, 1, LIMITS.volunteers, 1, value => { shift.minimum = value; }, `Minimum staffing for ${shift.name}`)));
    row.append(top, details); root.append(row);
  }
  $('shift-count').textContent = `${plan.shifts.length} of ${LIMITS.shifts} shifts`;
  ($('add-shift') as HTMLButtonElement).disabled = plan.shifts.length >= LIMITS.shifts;
}
function renderPreferences() {
  preserveFocus(() => {
    const root = $('preference-editor'); root.replaceChildren();
    if (!plan.volunteers.length || !plan.shifts.length) { root.append(element('p', 'Add at least one volunteer and one shift to set availability.', 'empty-state')); return; }
    const grid = table(['Volunteer', ...plan.shifts.map(s => s.name || 'Unnamed shift')], 'preferences-table');
    for (const volunteer of plan.volunteers) {
      const row = element('tr'); cell(row, volunteer.name || 'Unnamed volunteer', true);
      for (const shift of plan.shifts) {
        const pref = preference(volunteer.id, shift.id); const group = element('div', undefined, 'preference-cell');
        const available = checkInput(`available-${volunteer.id}-${shift.id}`, pref.available, `Available: ${volunteer.name}, ${shift.name}`, checked => { pref.available = checked; });
        const weight = numberInput(`weight-${volunteer.id}-${shift.id}`, pref.weight, 0, 10, 1, value => { pref.weight = value; }, `Inconvenience weight: ${volunteer.name}, ${shift.name}`);
        const locked = checkInput(`lock-${volunteer.id}-${shift.id}`, pref.locked, `Lock assignment: ${volunteer.name}, ${shift.name}`, checked => { pref.locked = checked; });
        group.append(field('Available', available, 'check-field'), field('Weight 0–10', weight, 'weight-field'), field('Lock assignment', locked, 'check-field lock-field'));
        const td = cell(row, group); td.classList.toggle('locked-cell', pref.locked);
      }
      grid.tbody.append(row);
    }
    root.append(grid.wrapper);
  });
}
function renderInputs() {
  $('plan-title').setAttribute('aria-label', 'Plan name'); ($('plan-title') as HTMLInputElement).value = plan.title;
  renderVolunteers(); renderShifts(); renderPreferences(); updateSaveState();
}
function number(value: number) { return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''); }
function activeSchedule(): Schedule | undefined { return selected === 'baseline' ? result?.baseline : result?.candidate; }
function proofText() { return selected === 'baseline' ? 'First feasible baseline · not optimized' : result?.optimal ? 'Exhaustive optimum for the stated metric' : 'Feasible candidate · optimality not proven'; }
function metric(label: string, value: string) { const item = element('div', undefined, 'metric'); item.append(element('span', label), element('strong', value)); return item; }
function renderComparison() {
  const region = $('comparison'); region.replaceChildren(); if (!result?.baseline || !result.candidate) return;
  for (const which of ['baseline', 'candidate'] as const) {
    const schedule = result[which]!; const card = element('div', undefined, `comparison-card${selected === which ? ' selected' : ''}`);
    card.append(element('p', which === 'baseline' ? 'FIRST FEASIBLE' : 'BURDEN CANDIDATE', 'eyebrow'), element('h3', which === 'baseline' ? 'Coverage baseline' : 'Best found for these weights'));
    const metrics = element('div', undefined, 'metrics'); metrics.append(metric('Required coverage', `${schedule.required} / ${schedule.required}`), metric('Highest burden', number(schedule.maxBurden)), metric('Squared burdens', number(schedule.sumSquares)), metric('Total burden', number(schedule.totalBurden))); card.append(metrics);
    const choose = button(selected === which ? '✓ Reviewing this schedule' : 'Review this schedule', `select-${which}`, () => { selected = which; renderResult(); }, selected === which ? 'selected-button' : '');
    choose.setAttribute('aria-pressed', String(selected === which)); card.append(choose); region.append(card);
  }
}
function renderBurden() {
  const root = $('burden-region'); root.replaceChildren(); if (!result?.baseline || !result.candidate) return;
  root.append(element('h3', 'Who carries the burden?'));
  const grid = table(['Volunteer', 'Max hours', 'Baseline hours', 'Baseline burden', 'Candidate hours', 'Candidate burden'], 'burden-table');
  for (const v of plan.volunteers) {
    const before = result.baseline.people.find(p => p.volunteerId === v.id)!; const after = result.candidate.people.find(p => p.volunteerId === v.id)!;
    const row = element('tr'); cell(row, v.name, true); [v.maxHours, before.hours, before.burden, after.hours, after.burden].forEach(value => cell(row, number(value))); grid.tbody.append(row);
  }
  root.append(grid.wrapper);
}
function renderSchedule() {
  const root = $('schedule-region'); root.replaceChildren(); const schedule = activeSchedule(); if (!schedule) return;
  $('selected-title').textContent = selected === 'baseline' ? 'Reviewed schedule · coverage baseline' : 'Reviewed schedule · burden candidate';
  const grid = table(['Shift', 'When', 'Volunteer', 'Hours', 'Weight', 'Burden', 'Decision'], 'schedule-table');
  const ordered = [...schedule.assignments].sort((a, b) => plan.shifts.findIndex(s => s.id === a.shiftId) - plan.shifts.findIndex(s => s.id === b.shiftId) || plan.volunteers.findIndex(v => v.id === a.volunteerId) - plan.volunteers.findIndex(v => v.id === b.volunteerId));
  for (const assignment of ordered) {
    const shift = plan.shifts.find(s => s.id === assignment.shiftId)!; const volunteer = plan.volunteers.find(v => v.id === assignment.volunteerId)!; const pref = preference(volunteer.id, shift.id);
    const row = element('tr'); row.dataset.volunteer = volunteer.id; row.dataset.shift = shift.id;
    cell(row, shift.name, true); cell(row, formatShiftTime(shift)); cell(row, volunteer.name); cell(row, number(shift.duration / 60)); cell(row, number(pref.weight)); cell(row, number(shift.duration / 60 * (1 + pref.weight)));
    const lock = button(pref.locked ? 'Locked · unlock' : 'Lock assignment', `review-lock-${volunteer.id}-${shift.id}`, () => {
      pref.locked = !pref.locked; invalidate(`Assignment ${pref.locked ? 'locked' : 'unlocked'} for ${volunteer.name} on ${shift.name}. Generate again; other locks remain unchanged.`); renderPreferences(); $(`lock-${volunteer.id}-${shift.id}`).focus({ preventScroll: true });
    }, pref.locked ? 'lock-button locked' : 'lock-button');
    lock.setAttribute('aria-label', `${pref.locked ? 'Unlock' : 'Lock'} reviewed assignment for ${volunteer.name} on ${shift.name}`); cell(row, lock); grid.tbody.append(row);
  }
  root.append(grid.wrapper);
  $('result-footnote').textContent = `${schedule.assignments.length} assignments · ${proofText()}. Required coverage is never traded away. This is a comparison of your explicit weights, not a universal fairness assessment.`;
}
function renderResult() {
  if (!result) { $('results').hidden = true; return; }
  $('results').hidden = false; const explanation = $('result-explanation'); explanation.replaceChildren();
  const list = element('ul', undefined, 'result-reasons'); result.reasons.forEach(reason => list.append(element('li', reason))); explanation.append(list);
  if (result.status !== 'feasible' || !result.baseline || !result.candidate) {
    $('proof-state').textContent = result.status === 'infeasible' ? 'Proven infeasible' : result.status === 'incomplete' ? 'Search incomplete · no proof' : 'Correct the inputs';
    $('comparison').replaceChildren(); $('burden-region').replaceChildren(); $('schedule-region').replaceChildren(); $('selected-title').textContent = 'No current schedule to export'; $('result-footnote').textContent = 'No hard constraint was relaxed. Change the stated inputs explicitly, then generate again.';
    $('export-csv').setAttribute('disabled', ''); $('print-plan').setAttribute('disabled', ''); return;
  }
  $('proof-state').textContent = result.optimal ? 'Exhaustive search complete' : 'Search limit reached';
  const improvement = result.baseline.maxBurden - result.candidate.maxBurden;
  explanation.prepend(element('p', improvement > 0 ? `Highest individual burden: ${number(result.baseline.maxBurden)} → ${number(result.candidate.maxBurden)}, with full required coverage in both schedules.` : 'No reduction in the highest burden was found. Both schedules still satisfy every hard constraint; compare the individual totals and secondary scores.'));
  explanation.append(element('p', `${number(result.nodes)} search nodes · ${Math.round(result.elapsedMs)} ms. ${proofText()}.`, 'fine-print'));
  renderComparison(); renderBurden(); renderSchedule(); $('export-csv').removeAttribute('disabled'); $('print-plan').removeAttribute('disabled');
}
function generate() {
  stopWorker(); result = undefined; $('results').hidden = true; $('export-csv').setAttribute('disabled', ''); $('print-plan').setAttribute('disabled', ''); $('print-root').replaceChildren();
  const errors = validatePlan(plan);
  if (errors.length) {
    result = { status: 'invalid', reasons: errors, nodes: 0, elapsedMs: 0, exhausted: false, optimal: false }; renderResult(); announce(`Correct the inputs. ${errors.join(' ')}`, 'warning'); return;
  }
  const id = ++job;
  try {
    worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    ($('generate') as HTMLButtonElement).disabled = true; $('cancel-solve').hidden = false;
    announce('Searching while preserving availability, staffing, hour limits and locks…');
    worker.onmessage = (event: MessageEvent<{ id: number; result?: SolveResult; error?: string }>) => {
      if (event.data.id !== id || id !== job) return;
      const received = event.data.result; stopWorker();
      if (!received || event.data.error) { announce(`Search could not finish: ${event.data.error ?? 'no result returned'}. Inputs are unchanged.`, 'warning'); return; }
      if (received.status === 'feasible') {
        if (!received.baseline || !received.candidate) { announce('Search returned an incomplete schedule. No result was accepted.', 'warning'); return; }
        const violations = [...validateSchedule(plan, received.baseline.assignments), ...validateSchedule(plan, received.candidate.assignments)];
        if (violations.length) { announce(`Schedule verification rejected the result: ${violations.join(' ')}`, 'warning'); return; }
        received.baseline = scoreSchedule(plan, received.baseline.assignments); received.candidate = scoreSchedule(plan, received.candidate.assignments);
      }
      result = received; selected = 'candidate'; renderResult();
      announce(received.status === 'feasible' ? `Feasible schedule verified. ${proofText()}.` : received.status === 'infeasible' ? `Proven infeasible. ${received.reasons.join(' ')}` : received.status === 'incomplete' ? `Search incomplete. No feasible schedule found within the limit; infeasibility is not proven. ${received.reasons.join(' ')}` : `Correct the inputs. ${received.reasons.join(' ')}`, received.status === 'feasible' ? 'success' : 'warning');
    };
    worker.onerror = event => { event.preventDefault(); if (job !== id) return; stopWorker(); announce('The search worker failed. Inputs are preserved; try generating again in a browser with module-worker support.', 'warning'); };
    worker.postMessage({ id, plan: structuredClone(plan) });
  } catch { stopWorker(); announce('This browser could not start the search worker. Your inputs are preserved; try a current browser with module-worker support.', 'warning'); }
}
function replacePlan(next: Plan, message: string, isSaved: boolean) {
  if (dirty && !confirm('Replace the unsaved inputs in this worksheet? Your saved snapshot will not be changed.')) return false;
  stopWorker(); plan = next; result = undefined; dirty = false; savedHere = isSaved;
  $('results').hidden = true; $('export-csv').setAttribute('disabled', ''); $('print-plan').setAttribute('disabled', ''); $('print-root').replaceChildren();
  renderInputs(); announce(message); return true;
}
function verifiedActive(): Schedule | undefined {
  const schedule = activeSchedule(); if (!schedule || !result || result.status !== 'feasible') { announce('Generate and review a current feasible schedule first.', 'warning'); return; }
  const errors = [...validatePlan(plan), ...validateSchedule(plan, schedule.assignments)];
  if (errors.length) { invalidate(`Export stopped: ${errors.join(' ')}`); return; }
  return scoreSchedule(plan, schedule.assignments);
}

$('plan-title').addEventListener('input', () => { plan.title = ($('plan-title') as HTMLInputElement).value; invalidate(); });
$('add-volunteer').addEventListener('click', () => {
  if (plan.volunteers.length >= LIMITS.volunteers) return;
  const id = nextId('v', plan.volunteers.map(v => v.id)); plan.volunteers.push({ id, name: `Volunteer ${plan.volunteers.length + 1}`, maxHours: 8 }); rebuildPreferences(); invalidate(); renderInputs(); $(`name-${id}`).focus();
});
$('add-shift').addEventListener('click', () => {
  if (plan.shifts.length >= LIMITS.shifts) return;
  const id = nextId('s', plan.shifts.map(s => s.id)); plan.shifts.push({ id, name: `Shift ${plan.shifts.length + 1}`, start: 540 + plan.shifts.length * 120, duration: 120, minimum: 1 }); rebuildPreferences(); invalidate(); renderInputs(); $(`shift-name-${id}`).focus();
});
$('generate').addEventListener('click', generate);
$('cancel-solve').addEventListener('click', () => { stopWorker(); result = undefined; $('results').hidden = true; announce('Search cancelled. No claim about feasibility or optimality was made. Inputs and locks are unchanged.'); });
$('save-plan').addEventListener('click', () => {
  const errors = validatePlan(plan); if (errors.length) { announce(`Save stopped: ${errors.join(' ')}`, 'warning'); return; }
  const error = savePlan(plan); if (error) { announce(error, 'warning'); return; }
  dirty = false; savedHere = true; updateSaveState(); announce('Saved in this browser. Inputs and locks are stored; schedules are recomputed on reload.', 'success');
});
$('reload-plan').addEventListener('click', () => {
  const loaded = loadPlan(); if (loaded.error) { announce(loaded.error, 'warning'); return; }
  if (!loaded.plan) { announce('No saved plan exists in this browser. Current inputs are unchanged.'); return; }
  replacePlan(loaded.plan, 'Saved inputs and locks restored. Generate to produce a fresh schedule.', true);
});
$('load-example').addEventListener('click', () => replacePlan(createSample(), 'Synthetic example loaded. These names, shifts and weights are demonstration data.', false));
$('start-blank').addEventListener('click', () => replacePlan({ version: 1, title: 'My volunteer week', volunteers: [], shifts: [], preferences: [] }, 'New plan. Add volunteers and shifts, then set availability and weights.', false));
$('export-csv').addEventListener('click', () => {
  const schedule = verifiedActive(); if (!schedule) return;
  try {
    const url = URL.createObjectURL(new Blob([scheduleCsv(plan, schedule)], { type: 'text/csv;charset=utf-8' }));
    const link = element('a'); link.href = url; link.download = 'shiftfair-schedule.csv'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce(`CSV exported for the reviewed ${selected === 'baseline' ? 'baseline' : 'burden candidate'}: ${schedule.assignments.length} assignments.`, 'success');
  } catch { announce('CSV export failed. The reviewed schedule remains available.', 'warning'); }
});
$('print-plan').addEventListener('click', () => {
  const schedule = verifiedActive(); if (!schedule) return;
  try { $('print-root').replaceChildren(printSchedule(plan, schedule, `${selected === 'baseline' ? 'Coverage baseline' : 'Burden candidate'} · ${proofText()}`)); window.print(); }
  catch { announce('Printing could not start. The reviewed schedule remains available.', 'warning'); }
});
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
renderInputs();
announce(saved.error ?? (saved.plan ? 'Saved inputs restored. Generate to review a fresh schedule.' : 'Synthetic example ready: four volunteers, four shifts. Generate to compare full coverage and individual burden.'), saved.error ? 'warning' : 'neutral');
