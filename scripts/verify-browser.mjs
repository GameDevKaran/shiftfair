import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
const base = process.env.SHIFTFAIR_BASE_URL ?? 'http://127.0.0.1:8785';
const publicTarget = !['localhost','127.0.0.1'].includes(new URL(base).hostname);
const out = path.resolve(publicTarget ? '.local/live-browser' : '.local/browser');
await fs.mkdir(out,{recursive:true});
let server;
if (!process.env.SHIFTFAIR_BASE_URL && !process.env.SHIFTFAIR_USE_RUNNING) {
  server=spawn(process.execPath,['scripts/serve.mjs'],{stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Preview did not start')),10000);server.stdout.once('data',()=>{clearTimeout(timer);resolve();});server.once('exit',code=>{clearTimeout(timer);reject(Error(`Preview exited ${code}`));});});
}
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:1050},recordVideo:{dir:path.join(out,'video'),size:{width:1440,height:1050}}});
const page=await context.newPage();
const report={application:'ShiftFair',base,environment:publicTarget?'public':'local',passed:false,checks:[],browserErrors:[],consoleErrors:[]};
page.on('pageerror',error=>report.browserErrors.push(error.message));
page.on('console',message=>{if(message.type()==='error')report.consoleErrors.push(message.text());});
let acceptDialog=true;
page.on('dialog',async dialog=>{if(dialog.type()==='beforeunload'||acceptDialog)await dialog.accept();else await dialog.dismiss();});
async function generate(){await page.locator('#generate').click();await expect(page.locator('#cancel-solve')).toBeHidden({timeout:10000});await expect(page.locator('#results')).toBeVisible();}
async function sample(){acceptDialog=true;await page.locator('#load-example').click();}
function parseCsv(text){const rows=[];let row=[],value='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(value);value='';}else if(c==='\n'&&!quoted){row.push(value.replace(/\r$/,''));rows.push(row);row=[];value='';}else value+=c;}if(value||row.length){row.push(value);rows.push(row);}return rows;}
try {
  const response=await page.goto(base);if(response.status()!==200)throw Error('HTTP response not successful');
  const headers=response.headers();if(!headers['content-security-policy']?.includes("worker-src 'self'")||headers['x-content-type-options']!=='nosniff')throw Error('Required security headers missing');
  await expect(page.locator('#volunteer-count')).toContainText('4 of 12');await expect(page.locator('#shift-count')).toContainText('4 of 8');await expect(page.locator('#status')).toContainText('Synthetic example');
  report.checks.push('HTTP success, restricted worker/content policy, MIME protection and labeled synthetic example');
  await generate();await expect(page.locator('#status')).toContainText('Feasible schedule verified');await expect(page.locator('#proof-state')).toHaveText('Exhaustive search complete');
  await expect(page.locator('#result-explanation')).toContainText('8 → 2');await expect(page.locator('#schedule-table tbody tr')).toHaveCount(4);await expect(page.locator('#burden-table tbody tr')).toHaveCount(4);
  const burden=await page.locator('#burden-table tbody tr').evaluateAll(rows=>rows.map(row=>[...row.cells].map(c=>c.textContent)));
  if(burden.some(row=>row[5]!=='2'))throw Error('Candidate individual burden not two');
  report.checks.push('real browser worker, fully covered baseline8/candidate2, individual scores and exhaustive label');
  await page.screenshot({path:path.join(out,'shiftfair-workspace.png'),fullPage:true});
  await page.locator('#select-baseline').click();await expect(page.locator('#result-footnote')).toContainText('not optimized');
  const baselinePeople=await page.locator('#schedule-table tbody tr').evaluateAll(rows=>rows.map(row=>row.dataset.volunteer));if(new Set(baselinePeople).size!==1)throw Error('Baseline selection did not change assignments');
  await page.locator('#select-candidate').click();report.checks.push('review selection changes actual assignments and baseline never claims the candidate optimum');
  await page.locator('#weight-alex-welcome').fill('10');await expect(page.locator('#results')).toBeHidden();await expect(page.locator('#export-csv')).toBeDisabled();await generate();
  await expect(page.locator('#schedule-table tr[data-volunteer="alex"][data-shift="welcome"]')).toHaveCount(0);report.checks.push('editing weights invalidates stale exports and changes the optimized assignment');
  const first=page.locator('#schedule-table tbody tr').first();const locked=await first.evaluate(row=>({v:row.dataset.volunteer,s:row.dataset.shift}));
  await first.locator('button').click();await expect(page.locator(`#lock-${locked.v}-${locked.s}`)).toBeChecked();await generate();
  await expect(page.locator(`#schedule-table tr[data-volunteer="${locked.v}"][data-shift="${locked.s}"] button`)).toContainText('Locked');report.checks.push('reviewed assignment locks survive genuine recomputation');
  await page.locator(`#available-${locked.v}-${locked.s}`).uncheck();await generate();await expect(page.locator('#proof-state')).toHaveText('Proven infeasible');await expect(page.locator('#status')).toContainText('marked unavailable');await expect(page.locator('#export-csv')).toBeDisabled();
  await page.screenshot({path:path.join(out,'shiftfair-conflict.png'),fullPage:true});
  await page.locator(`#available-${locked.v}-${locked.s}`).check();await page.locator(`#max-${locked.v}`).fill('0');await generate();await expect(page.locator('#status')).toContainText('locked shifts require');
  await page.locator(`#max-${locked.v}`).fill('8');await generate();report.checks.push('unavailable and over-hours locks give real proofs, no exports or silent constraint relaxation');
  await page.locator('#name-alex').fill('Alex <img src=x onerror=alert(1)>');await page.locator('#name-alex').press('Tab');await page.locator('#plan-title').fill('Community day / verified rota');await page.locator('#save-plan').click();await expect(page.locator('#status')).toContainText('Saved in this browser');
  const saved=await page.evaluate(()=>localStorage.getItem('shiftfair.plan.v1'));await page.reload();await expect(page.locator('#results')).toBeHidden();await expect(page.locator('#plan-title')).toHaveValue('Community day / verified rota');await expect(page.locator(`#lock-${locked.v}-${locked.s}`)).toBeChecked();await expect(page.locator('img')).toHaveCount(0);
  if(await page.evaluate(()=>localStorage.getItem('shiftfair.plan.v1'))!==saved)throw Error('Reload altered saved inputs');await generate();report.checks.push('exact local persistence and locks; fresh solving on reload; labels rendered as text');
  const expected=await page.locator('#schedule-table tbody tr').evaluateAll(rows=>rows.map(row=>[...row.cells].slice(0,6).map(c=>c.textContent)));
  const downloadPromise=page.waitForEvent('download');await page.locator('#export-csv').click();const download=await downloadPromise;const csvPath=path.join(out,'shiftfair-schedule.csv');await download.saveAs(csvPath);
  const records=parseCsv(await fs.readFile(csvPath,'utf8'));if(JSON.stringify(records.slice(1).map(r=>r.slice(0,6)))!==JSON.stringify(expected))throw Error('CSV differs from reviewed schedule');report.checks.push('actual CSV download exactly matches all reviewed assignment fields');
  await page.evaluate(()=>{window.print=()=>{window.__printed=true;};});await page.locator('#print-plan').click();if(!await page.evaluate(()=>window.__printed))throw Error('Native print not invoked');
  const printed=await page.locator('#print-sheet tbody tr').evaluateAll(rows=>rows.map(row=>[...row.cells].slice(0,6).map(c=>c.textContent)));if(JSON.stringify(printed)!==JSON.stringify(expected))throw Error('Print differs from reviewed schedule');
  await page.emulateMedia({media:'print'});await expect(page.locator('#app')).toBeHidden();await expect(page.locator('#print-sheet')).toBeVisible();await page.pdf({path:path.join(out,'shiftfair-schedule.pdf'),format:'A4',landscape:true,printBackground:true});await page.emulateMedia({media:'screen'});report.checks.push('native print invocation, exact assignment rows, print styles and PDF evidence');
  await page.locator('#plan-title').fill('Unsaved plan');acceptDialog=false;await page.locator('#reload-plan').click();await expect(page.locator('#plan-title')).toHaveValue('Unsaved plan');acceptDialog=true;await page.locator('#reload-plan').click();await expect(page.locator('#plan-title')).toHaveValue('Community day / verified rota');
  await page.evaluate(()=>localStorage.setItem('shiftfair.plan.v1','{broken'));await page.locator('#reload-plan').click();await expect(page.locator('#status')).toContainText('not valid JSON');await expect(page.locator('#plan-title')).toHaveValue('Community day / verified rota');if(await page.evaluate(()=>localStorage.getItem('shiftfair.plan.v1'))!=='{broken')throw Error('Corrupt evidence overwritten');report.checks.push('unsaved replacement cancellation and corrupt saved data preserve current inputs');
  await page.locator('#start-blank').focus();await page.keyboard.press('Enter');await page.locator('#generate').focus();await page.keyboard.press('Enter');await expect(page.locator('#proof-state')).toHaveText('Correct the inputs');
  await page.locator('#add-volunteer').focus();await page.keyboard.press('Enter');await expect(page.locator('#name-v1')).toBeFocused();await page.keyboard.type('Keyboard helper');await page.keyboard.press('Tab');await expect(page.locator('#max-v1')).toBeFocused();
  await page.locator('#add-shift').focus();await page.keyboard.press('Enter');await expect(page.locator('#shift-name-s1')).toBeFocused();await page.locator('#generate').focus();await page.keyboard.press('Enter');await expect(page.locator('#status')).toContainText('Feasible schedule verified');await expect(page.locator('#schedule-table tbody tr')).toHaveCount(1);report.checks.push('keyboard add/edit/generate flow and truthful empty-plan validation');
  acceptDialog=false;await page.locator('#remove-v1').click();await expect(page.locator('#volunteer-count')).toContainText('1 of 12');acceptDialog=true;await page.locator('#remove-v1').click();await expect(page.locator('#volunteer-count')).toContainText('0 of 12');await expect(page.locator('#results')).toBeHidden();report.checks.push('confirmed deletion clears dependent assignments and stale results');
  await sample();for(let i=0;i<8;i++)await page.locator('#add-volunteer').click();for(let i=0;i<4;i++)await page.locator('#add-shift').click();await expect(page.locator('#add-volunteer')).toBeDisabled();await expect(page.locator('#add-shift')).toBeDisabled();await expect(page.locator('#preferences-table input[type=checkbox]')).toHaveCount(192);
  await page.evaluate(()=>{document.querySelector('#generate').click();document.querySelector('#cancel-solve').click();});await expect(page.locator('#status')).toContainText('Search cancelled');await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await expect(page.locator('#results')).toBeHidden();report.checks.push('maximum12×8 editor bounds and cancel discards worker results without false proof');
  await sample();await generate();await page.setViewportSize({width:390,height:844});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Mobile body overflow');await page.screenshot({path:path.join(out,'shiftfair-mobile.png'),fullPage:true});report.checks.push('390px mobile layout keeps tables contained and the complete workflow visible');
  const isolated=await browser.newContext();await isolated.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('test storage denied');};Storage.prototype.setItem=()=>{throw new Error('test storage denied');};});const denied=await isolated.newPage();await denied.goto(base);await expect(denied.locator('#status')).toContainText('storage is unavailable');await denied.locator('#save-plan').click();await expect(denied.locator('#status')).toContainText('could not save');await denied.locator('#generate').click();await expect(denied.locator('#status')).toContainText('Feasible schedule verified');await isolated.close();report.checks.push('denied storage is labeled and does not prevent actual in-memory solving');
  if(report.browserErrors.length||report.consoleErrors.length)throw Error('Unexpected browser or console error');report.passed=true;
}catch(error){report.error=String(error?.stack??error);await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});process.exitCode=1;}
finally{await context.close();await browser.close();server?.kill();await fs.writeFile(path.join(out,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
