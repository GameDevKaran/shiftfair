# ShiftFair: verification plan

Current measured evidence: docs/VERIFICATION.md — 27 Node tests and 15 local browser checks passed on 23 October. The historical prospective target below is preserved as unmeasured, not claimed completed.

## Fixtures and acceptance

Original target: 12 development and 12 held-out schedules, six intentionally infeasible. This target has not been run. Actual accelerated verification independently exhaustively enumerates twelve tiny cases (six feasible, six impossible), plus boundary/limit/lock tests. The implemented baseline is first feasible, not a greedy benchmark. Both schedules must satisfy full coverage; improving fairness never permits a coverage violation. No universal social-fairness claim follows from a metric improvement.

## Demonstration to verify

show an uneven baseline, enter one availability change, expose a genuine conflict, relax a stated preference and export a feasible reviewed rota.

## Result record

For each run, record the source commit, fixture version, runtime/provider versions, actual pass and failure counts, latency, cost where relevant, and limitations. Keep development and held-out inputs separate. Report negative findings; freeze the protocol before inspecting held-out results.

A release requires a functioning end-to-end workflow and a clean-session replay. Documentation, repository creation and HTTP availability alone do not establish application correctness.
