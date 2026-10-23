# ShiftFair: architecture

Implemented browser-only TypeScript architecture, 23 October 2026. See devpost/spec.md for the blueprint and docs/VERIFICATION.md for measured evidence.

src/app.ts edits one bounded Plan, invalidates stale results and passes a structured copy to src/worker.ts. src/solver.ts validates input, reports direct contradictions or enumerates eligible assignment combinations within 200,000 nodes/1.5 seconds. The first feasible schedule is the coverage baseline; a lexicographic burden objective selects the candidate. Independent hard-constraint validation runs again before either result reaches the screen or export.

src/storage.ts validates and stores inputs only under shiftfair.plan.v1. src/export.ts produces the exact selected assignment rows for CSV and safe print DOM. No server stores data; module scripts and worker are same-origin static files. No runtime AI is used; the actual AI-assisted development workflow is documented in SKILL_PACK_PROVENANCE.md.

MVP maximum 12 volunteers and eight shifts; compare schedules with deterministic scoring, never infer health, religion, family duties or protected characteristics. Exclude employment-law compliance, payroll, automatic notifications, production staff records and external calendars. An infeasible request must display the conflicting constraints rather than silently dropping a coverage requirement.

## Failure handling and data boundaries

Incomplete search does not imply infeasibility; an unproven feasible candidate does not imply optimality. Contradictory locks are preserved and explained. Worker failure/cancellation and storage errors preserve inputs. Deletion/replacement requires a browser confirmation. Strict shape/size validation, text-only labels, CSV formula protection, same-origin content policy and no credentials in assets cover the static app's relevant boundaries.

## Implementation record

Pinned TypeScript5.9.3, Node24, Playwright1.64.1. npm ci → npm test → npm start. Public release is complete at https://shiftfair-564976398462.web.app with15 actual browser checks; details: docs/STATIC_RELEASE.md. Firebase only serves static files; the solver and persistence run in the browser. Baseline is first feasible instead of the older proposed greedy baseline, and full coverage is mandatory rather than a tradeoff that may be relaxed. The original 12+12 held-out evaluation target remains unmeasured; independent enumeration and actual tests are the evidence.
