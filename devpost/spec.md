---
doc: spec
status: draft
---
# ShiftFair — Technical specification

Derived from approved scope and explicit instruction to implement; this document has not received separate owner sign-off. Routine technical decisions are delegated. No learner understanding or later-stage approval is inferred.

## How This Works, In Plain Language
The browser holds one planning worksheet. A separate browser worker tries combinations of available volunteers while preserving locked assignments, time conflicts and hour limits. The first full solution is the baseline. Search continues for a lower maximum burden until all combinations are exhausted or a fixed limit is reached. The screen reports which happened. Saved data stays in this browser; CSV and print use the selected valid result.

## The Core Journey Through the System
`prd.md > The Core Journey`: edits update a bounded model and clear stale results → validation → worker search → independent schedule validation → comparison/selection → lock or export. Saving stores inputs, not trusted solver results; reload requires fresh solving.

## Stack
TypeScript 5.9.3, native browser DOM/CSS, module Worker, Node 24 build/test tools, Playwright 1.64.1 for browser verification. No runtime library. Reuse the proven static deployment/build pattern, not CableMap's domain model.
Documentation: https://www.typescriptlang.org/docs/ ; https://nodejs.org/api/test.html ; https://playwright.dev/docs/intro ; https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API ; https://firebase.google.com/docs/hosting . Dependency versions are pinned and will be verified by install/build.

## Where It Runs and How Someone Tries It
`npm ci`, `npm test`, `npm start`; open http://127.0.0.1:8785 . No provider keys. `npm run test:browser` verifies the local workflow; `SHIFTFAIR_BASE_URL` selects an actual public target. Build output only is eligible for Firebase Hosting at a separate site in tough-melody-508008-p8, after scoped cost approval. Source remains private until owner publication. Required submission media/public source are separate owner work.

## Components
### Model and solver
Implements `prd.md > Editable hard constraints`, `Transparent comparison`, `Solver outcomes and explanations`. Validate bounds, IDs, references, integer half-hour units. Shift start/duration are minutes; maximum hours and burden are represented without unstable fractions (half-hour increments). Enumerate combinations of exact minimum staff or required locked staff if higher; positive assignment costs mean unnecessary overstaffing cannot improve the stated objective. Prune impossible partial plans, preserve independent validators. Default cap 200,000 search nodes and 1.5 seconds, checked within recursion. Exhaustive completion alone supports optimality. A budget cap never proves infeasibility. Deterministic traversal and a synthetic hand-checkable fixture are included.
### Worker and UI
Implements `prd.md > Locks and recomputation`. Module worker isolates search; terminate on cancel/change. The UI ignores stale messages and independently checks accepted assignments. A synchronous fallback must not freeze the browser; prefer a clear unsupported-worker error if necessary. Text is assigned with textContent, not interpolated user HTML. All UI controls have labels; focus survives ordinary editing.
### Persistence and export
Implements `prd.md > Persistence and exports`. Single versioned input snapshot under shiftfair.plan.v1; 150 KB parsing bound; strict shape validation. Never trust stored results. CSV formula-prefix protection and conventional quote escaping. Print generated from the selected current schedule, with visible limitations.

## Data Model
Plan: version1, title, volunteers[{id,name,maxHours}], shifts[{id,name,start,duration,minimum}], preferences[{volunteerId,shiftId,available,weight,locked}]. Start is minute offset in a seven-day week; duration is positive half-hour increment, maximum12h. Maximum12 volunteers/8 shifts. A complete rectangular preference matrix is required. Schedule: assignments [{shiftId,volunteerId}], per-person hours/burden, required/assigned coverage, maxBurden/sumSquares/totalBurden. A result discriminates invalid, infeasible, incomplete or feasible; separate exhausted/optimal flags and proof/reason messages.

## File Structure
src/model.ts — shared contract; src/solver.ts — validation/search/scoring; src/worker.ts — worker entry; src/sample.ts — labeled synthetic fixture; src/app.ts — UI; src/storage.ts — persistence; src/export.ts — CSV/print data; public/index.html, styles.css, icon.svg; tests/domain.test.ts — independent invariants/oracle; scripts/build.mjs, serve.mjs, verify-browser.mjs; firebase.json — scoped static hosting; devpost/ — truthful workflow documents.

## External Services and Dependencies
None at runtime except static HTTPS hosting. No database, model, identity service or API credential. Firebase site must be isolated and deployment explicitly project-scoped. New spending is not covered by CableMap's allowance; approve only a concrete artifact/proposal.

## Important Failure Modes
- Contradictory locks → proven direct conflict with named constraints; no changed lock.
- Large combinatorial search → bounded incomplete/feasible-limited result; no false infeasibility/optimality.
- Corrupt storage or worker failure → preserve inputs, show actionable error and do not export stale results.

## Decisions and Open Issues
Owner explicitly prioritized solver truthfulness. Verify it using exhaustive enumeration of tiny schedules independently from the production traversal, plus search-limit and hard-constraint tests. This is a useful engineering investigation, not a claimed learner uncertainty. UI/stack decisions follow delegated autonomy. Hands-on learner feedback, final approval, source publication and hosting spending are not fabricated.
