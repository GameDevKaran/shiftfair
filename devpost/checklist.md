---
doc: checklist
status: draft
---
# ShiftFair build checklist

Execution: owner explicitly approved scope and instructed implementation on 23 October, preserving six requirements. Fast execution follows that instruction. PRD/spec/checklist remain draft until actually reviewed; do not invent formal sign-offs. Technical slice completion is not learner review completion.

## Slices
- [ ] **1. Generate a constraint-valid rota**
  - Becomes usable: synthetic inputs produce a validated full schedule with truthful search status.
  - Why now: hard-constraint and proof accuracy are the kernel.
  - PRD ref: Editable hard constraints; Solver outcomes and explanations.
  - Spec ref: Model and solver; Worker and UI.
  - Build: model, bounded solver, worker, initial editable worksheet.
  - Verify (mechanical): independent tiny-case enumeration, hard constraints, locked conflicts and budget tests; build and sample browser solve.
  - Learner check: generate the synthetic sample and inspect each volunteer's hours against the maximum.
  - Commit: save verified kernel and first workflow.
- [ ] **2. Compare burden and preserve decisions**
  - Becomes usable: view both schedules and individual scores, edit weights, lock assignments and regenerate.
  - Why now: it proves the distinctive behavior on top of valid coverage.
  - PRD ref: Transparent comparison; Locks and recomputation.
  - Spec ref: Model and solver; Worker and UI.
  - Build: comparison/selection, lock controls, stale-result protection, clear conflicts.
  - Verify (mechanical): metric comparison/oracle, lock preservation and browser conflict/edit flows.
  - Learner check: lock one reviewed assignment, change a weight, regenerate and inspect the same locked person.
  - Commit: save comparison workflow with evidence.
- [ ] **3. Save, export and release the complete workflow**
  - Becomes usable: reload inputs, export reviewed CSV/print, try keyboard/mobile and public HTTPS.
  - Why now: outputs must come from the valid reviewed schedule.
  - PRD ref: Persistence and exports; States and Boundaries.
  - Spec ref: Persistence and export; Where It Runs and How Someone Tries It.
  - Build: bounded storage, CSV/print, release configuration and documentation.
  - Verify (mechanical): invalid/denied storage, exact export rows, browser/mobile/security; public checks only after scoped release authorization.
  - Learner check: save/reload, regenerate, export and compare rows with the screen.
  - Commit: save tested release and actual deployment evidence separately.

## Hands-on Checkpoints
- [ ] Owner tries constraint/lock workflow; record only actual feedback.

## Final Review
- [ ] Owner tries final application and identifies any changes.
- [ ] Resolve actual requested changes and owner confirms readiness.

## Code Tour and App Map
- [ ] Prepare app map tracing input → worker result → validated export.
- [ ] Owner completes or declines a suitable investigation/reflection; no response is invented.

## Revisions
23 October: preserve the official workflow artifacts and attribution, while following the owner's explicit instruction to proceed with implementation without additional routine questionnaires. This departs from the pack's separate pre-build formal approval/pause sequence. Do not claim all stages complete or unconditional event compliance. Required personal answers and genuine hands-on review remain owner actions.
