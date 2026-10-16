# ShiftFair: verification plan

No tests or evaluations have run. The following are prospective acceptance targets, not results.

## Fixtures and acceptance

12 development and 12 held-out schedules, six intentionally infeasible. Zero hard-constraint violations in accepted solutions; every infeasible case marked as such; exported assignments identical to the reviewed solution. For tiny cases enumerate solutions independently to check the stated objective. Compare against first-available greedy assignment; report coverage and burden differences, including cases where fairness costs coverage or has no benefit. Do not claim the schedule is socially fair merely because a metric improves.

## Demonstration to verify

show an uneven baseline, enter one availability change, expose a genuine conflict, relax a stated preference and export a feasible reviewed rota.

## Result record

For each run, record the source commit, fixture version, runtime/provider versions, actual pass and failure counts, latency, cost where relevant, and limitations. Keep development and held-out inputs separate. Report negative findings; freeze the protocol before inspecting held-out results.

A release requires a functioning end-to-end workflow and a clean-session replay. Documentation, repository creation and HTTP availability alone do not establish application correctness.
