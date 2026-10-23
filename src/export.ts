import type { Plan, Schedule, Shift } from './model.js';
import { validateSchedule, scoreSchedule } from './solver.js';
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
function moment(minutes: number): string {
  const day = Math.floor(minutes / 1440);
  const time = minutes % 1440;
  return `${days[day] ?? 'Next Monday'} ${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
}
export function formatShiftTime(shift: Shift): string { return `${moment(shift.start)} – ${moment(shift.start + shift.duration)}`; }
export interface ExportRow { shift: string; time: string; volunteer: string; hours: number; weight: number; burden: number; locked: boolean }
export function scheduleRows(plan: Plan, schedule: Schedule): ExportRow[] {
  const errors = validateSchedule(plan, schedule.assignments);
  if (errors.length) throw Error(`Cannot export an invalid schedule: ${errors.join(' ')}`);
  return [...schedule.assignments].sort((a,b) => plan.shifts.findIndex(s=>s.id===a.shiftId)-plan.shifts.findIndex(s=>s.id===b.shiftId) || plan.volunteers.findIndex(v=>v.id===a.volunteerId)-plan.volunteers.findIndex(v=>v.id===b.volunteerId)).map(a => {
    const shift = plan.shifts.find(s=>s.id===a.shiftId)!;
    const volunteer = plan.volunteers.find(v=>v.id===a.volunteerId)!;
    const preference = plan.preferences.find(p=>p.shiftId===a.shiftId && p.volunteerId===a.volunteerId)!;
    return { shift: shift.name, time: formatShiftTime(shift), volunteer: volunteer.name, hours: shift.duration/60, weight: preference.weight, burden: shift.duration/60*(1+preference.weight), locked: preference.locked };
  });
}
function csvCell(value: string | number): string {
  let text = String(value);
  if (/^[\s\uFEFF]*[=+@-]/u.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function scheduleCsv(plan: Plan, schedule: Schedule): string {
  const rows = scheduleRows(plan, schedule);
  return [['Shift', 'Time', 'Volunteer', 'Hours', 'Inconvenience weight', 'Burden', 'Locked'], ...rows.map(r=>[r.shift,r.time,r.volunteer,r.hours,r.weight,r.burden,r.locked?'yes':'no'])].map(r=>r.map(csvCell).join(',')).join('\r\n')+'\r\n';
}
export function printSchedule(plan: Plan, schedule: Schedule, context: string): HTMLElement {
  const rows = scheduleRows(plan, schedule);
  const scores = scoreSchedule(plan, schedule.assignments);
  const section = document.createElement('section'); section.id = 'print-sheet';
  const add = (tag: string, text: string) => { const element = document.createElement(tag); element.textContent = text; section.append(element); return element; };
  add('h1', plan.title); add('p', 'ShiftFair · reviewed volunteer schedule'); add('p', context);
  add('p', `Required slots: ${scores.required}; assigned slots: ${scores.assigned}. Maximum individual burden: ${scores.maxBurden}. Burden = hours × (1 + explicit inconvenience weight). A chosen measure, not a universal fairness claim.`);
  const table = document.createElement('table'); const head = table.createTHead().insertRow();
  for (const label of ['Shift', 'Time', 'Volunteer', 'Hours', 'Weight', 'Burden', 'Locked']) { const th = document.createElement('th'); th.textContent=label; th.scope='col'; head.append(th); }
  const body = table.createTBody();
  for (const r of rows) { const tr = body.insertRow(); for (const value of [r.shift,r.time,r.volunteer,r.hours,r.weight,r.burden,r.locked?'yes':'no']) tr.insertCell().textContent=String(value); }
  section.append(table); add('h2','Individual totals');
  for (const person of scores.people) add('p', `${plan.volunteers.find(v=>v.id===person.volunteerId)!.name}: ${person.hours} hours; burden ${person.burden}.`);
  add('p','Planning week only; no dates, notifications, payroll or employment-law validation. Confirm real-world details with participants before using a rota.');
  return section;
}
