import test from 'node:test';
import assert from 'node:assert/strict';
import { createSample } from '../src/sample.js';
import { solve } from '../src/solver.js';
import { loadPlan, savePlan, parsePlan, STORAGE_KEY } from '../src/storage.js';
import { scheduleCsv, scheduleRows, formatShiftTime } from '../src/export.js';
test('valid local snapshot roundtrips exactly without trusting saved results', () => {
  let raw: string | null = null; const store = { getItem: (_key:string)=>raw, setItem:(key:string,value:string)=>{assert.equal(key,STORAGE_KEY);raw=value;} };
  const plan=createSample(); assert.equal(savePlan(plan,store),undefined); assert.deepEqual(loadPlan(store).plan,plan);
  assert.ok(parsePlan(JSON.stringify({...plan,candidate:{}})).error);
});
test('corrupt, oversized and unavailable storage are explicit, non-destructive failures', () => {
  assert.ok(parsePlan('{').error); assert.ok(parsePlan(' '.repeat(150001)).error);
  const denied={getItem:()=>{throw Error('denied');},setItem:()=>{throw Error('denied');}};
  assert.match(loadPlan(denied).error!,/unavailable/); assert.match(savePlan(createSample(),denied)!,/could not save/);
  let writes=0; const invalid=createSample(); invalid.volunteers[0]!.maxHours=-1;
  assert.ok(savePlan(invalid,{getItem:()=>null,setItem:()=>{writes++;}})); assert.equal(writes,0);
});
test('CSV contains exactly reviewed assignments and rejects stale invalid results', () => {
  const plan=createSample(); const result=solve(plan,{maxMs:10000}); assert.equal(result.status,'feasible');
  const schedule=result.candidate!; const rows=scheduleRows(plan,schedule);
  assert.equal(rows.length,schedule.assignments.length); assert.equal(scheduleCsv(plan,schedule).trim().split('\r\n').length,rows.length+1);
  const assignment=schedule.assignments[0]!; plan.preferences.find(p=>p.shiftId===assignment.shiftId&&p.volunteerId===assignment.volunteerId)!.available=false;
  assert.throws(()=>scheduleCsv(plan,schedule),/invalid schedule/);
});
test('CSV protects formula-like labels, quotes and embedded delimiters', () => {
  const plan=createSample(); for (const v of plan.volunteers) v.name=' =HYPERLINK("x"),name';
  const schedule=solve(plan,{maxMs:10000}).candidate!;
  assert.ok(scheduleCsv(plan,schedule).includes('"\' =HYPERLINK(""x""),name"'));
  assert.equal(formatShiftTime({...plan.shifts[0]!,start:1410,duration:60}),'Monday 23:30 – Tuesday 00:30');
});
