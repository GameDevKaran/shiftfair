---
doc: prd
status: draft
---
# ShiftFair — Product requirements

Source: approved `scope.md > The Core Loop`, `What "Working" Looks Like`, `The POC Boundary`; owner's six explicit requirements on 23 October. Implementation is authorized by that response. This derived document has not separately been reviewed or approved by the owner.

## The Core Journey
1. Open a labeled synthetic volunteer event, or start a blank plan.
2. Edit up to 12 volunteers (names and maximum hours) and eight shifts (day, start, duration and minimum staffing).
3. Set each volunteer's availability and inconvenience weight for each shift; optionally require an assignment with a lock.
4. Generate. Review a first feasible coverage baseline and the best burden candidate found, each respecting every hard constraint. Compare coverage, maximum individual burden and the individual hours/burden table.
5. Choose the reviewed candidate, lock an assignment, alter an input, and regenerate. Locked decisions persist. Changed inputs invalidate previous results and exports until regenerated.
6. Save inputs locally; reload, regenerate, export the reviewed schedule as CSV or print it. Nothing is sent to volunteers.

## Screens and Layout
One planning worksheet: event heading/actions, volunteer and shift editors, a scrollable availability/weight/lock matrix, then results and a schedule. This arrangement is an agent implementation decision under the owner's engineering-autonomy instruction, not an invented learner preference.

## Look and Feel
Use a compact, legible worksheet with warm paper, dark navy text, teal feasible states and amber conflict notices. System fonts; no remote assets. Tables must scroll within their own region on small screens. Every control is labeled and usable by keyboard. Color is supplemental to text. These are delegated implementation choices.

## Features and Behavior
### Editable hard constraints
Availability, minimum staffing, maximum hours and locked assignments are mandatory. Overlapping shifts cannot be assigned to one person. Inputs use a seven-day planning week and half-hour increments; labels remain user-authored. Validation names missing/invalid fields. Deletion removes only that entity's availability/locks, after confirmation. No silent relaxation.
### Transparent comparison
Burden per assignment is duration in hours × (1 + inconvenience weight), where a weight is an explicit integer 0–10. Show the formula and individual totals. Optimize maximum individual burden, then sum of squared burdens, then total burden. Baseline means first feasible schedule in deterministic search order, not a claim of greedy or global optimum. Both candidates must cover all required slots; fairness never buys improvement by leaving a shift short. Record an equal/no-improvement outcome honestly.
### Locks and recomputation
Lock assigned people directly from the reviewed schedule or specify locks in the matrix. Each lock means that person must work that shift. Preserve it on every recomputation. Report unavailable, overlapping or over-hours locks as conflicts. A change invalidates results immediately. Users explicitly unlock or correct the constraint.
### Solver outcomes and explanations
Feasible: valid schedule found, with exhaustive-optimal or search-limited label. Proven infeasible: a direct necessary-condition contradiction or exhaustive search with no solution. Search incomplete: limit reached without a schedule, no infeasibility claim. Invalid inputs: no search performed. A cancel discards the worker result and makes no mathematical claim. Explain actual conflicts, never speculate about a person's circumstances.
### Persistence and exports
Explicit browser-only save/reload. Validate saved data; corrupt/denied storage must preserve the current plan and report the failure. Confirm replacement when there are unsaved changes. Export only a current, independently validated selected schedule. CSV rows identify shift/time/person/hours/weight/burden/lock; escape quoted values and spreadsheet formula prefixes. Print includes the same assignments and metric/proof caveats. No cross-device sync or hidden data upload.

## States and Boundaries
- First use: labeled synthetic fixture, no claim of real volunteer evidence.
- Empty: explain how to add volunteers/shifts; no bogus feasible empty result.
- Busy: worker, cancel and clear progress message; no blocking UI.
- Edited: prior schedule cleared; export disabled.
- Limited: a feasible candidate may be used, but no optimality claim; no candidate means inconclusive.
- Storage failure: memory stays intact and save failure is visible.

## Product Decisions
The owner supplied the hard constraints, transparency, lock behavior, accurate solver status, practical output requirements and truthful hackathon evidence. The numeric burden formula, exact visual layout and implementation mechanism are agent decisions within that approved boundary, visibly exposed rather than attributed to the owner.

## What We're Building
A bounded local scheduling app with a verifiable kernel and the complete edit → compare → lock → regenerate → save/export demonstration.

## Non-Goals
No notifications, payroll, employment-law advice, accounts, external calendars, runtime AI, sensitive-attribute inference or enterprise planning. No universal fairness or optimality claim without proof.

## Open Questions
No unresolved product question blocks authorized implementation. Separate ShiftFair hosting spending permission is required before a billed public release; final learner hands-on review and personal submission content remain owner actions.
