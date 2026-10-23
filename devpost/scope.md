---
doc: scope
status: approved
---

# ShiftFair

Plan a small volunteer rota and inspect the tradeoff between covering shifts and distributing an explicitly defined burden.

This scope carries forward `core-research/project-briefs/BAI-02-shiftfair.md` from the finalized portfolio. The concept was agent-proposed. On 23 October 2026 the owner explicitly approved this displayed scope and instructed implementation, preserving the six requirements recorded below. Personal motivation and learning are not invented.

## The Unique Kernel

Compare a coverage baseline with a burden-balanced candidate, showing the actual assignments, coverage, and chosen burden measure. When availability or a locked assignment prevents a complete rota, explain the conflicting requirements instead of quietly dropping one. A better metric is not a claim that a schedule is universally or socially fair.

## Who It's For

A volunteer coordinator arranging a small event from an availability sheet. They need to cover the event while seeing whether the same volunteers repeatedly receive the shifts they have explicitly marked as inconvenient.

## The Core Loop

Enter or import locally authored volunteers and availability; define shifts, minimum staffing and maximum hours; set visible, user-editable inconvenience weights; generate and compare schedules; lock an assignment or change availability; recompute; review the result; save locally and export CSV or a printable rota. The coordinator chooses whether to adopt a result; the app sends nothing to volunteers.

## Inspiration & Identity

The portfolio proposes a transparent local planning tool, rather than another signup sheet. Its identity comes from visible constraints and factual explanations. No specific visual style, layout, or product reference has been supplied by the owner for ShiftFair; routine presentation choices can follow the established preference for engineering autonomy without a new design questionnaire.

## Why This Matters to the Learner

The owner wants the eight urgent applications functional, publicly accessible and technically verified by October 24 IST. A ShiftFair-specific personal stake or learning intention has not been supplied. Those remain the owner's words to provide, not content the agent should manufacture.

## What "Working" Looks Like

In a clean browser, use a small synthetic example whose valid assignments can be checked by hand. Generate a feasible rota that respects availability, maximum hours, minimum staffing and locked assignments. Compare its stated burden with the baseline; change availability to expose a real conflict; explicitly change a constraint or preference and recompute. Save/reload the plan, then export exactly the assignments that were reviewed.

Every accepted schedule must satisfy the hard constraints. The application distinguishes a feasible result, proven infeasibility, and an inconclusive search limit. It must not call a search timeout infeasible or call a candidate optimal without proof. Example names, weights and scenarios are clearly labeled synthetic, not inferred facts about real volunteers.

## The POC Boundary

- At most 12 volunteers and eight shifts, with explicit availability, maximum hours, minimum staffing and inconvenience weights.
- Deterministic coverage/burden comparison, locked assignments, recomputation and factual constraint explanations.
- Local input and persistence, CSV export and print output matching the reviewed schedule.
- A browser-based TypeScript implementation; no runtime AI, account, external calendar, database or provider credential is necessary for local development.
- Keyboard and small-screen usability, a reproducible demonstration, and independent static HTTPS delivery under the owner's authorized infrastructure and spending boundaries.

The burden definition and sample weights must be visible and editable. The agent must not infer health, religion, family duties or protected characteristics. Coverage requirements cannot be silently weakened to improve a fairness metric.

## Later

Larger schedules and more scheduling preferences can follow only after the bounded demonstration works. They are not requirements for this proof of concept.

## Explicitly Cut

Employment-law compliance and payroll need a different domain and evidence. Automatic notifications, external calendars and multi-user collaboration add accounts and external effects without proving the kernel. Production personnel records and sensitive-attribute inference are outside the intended synthetic/local demonstration. No automatic publication or sending of a rota.

## Review Status

Approved on 23 October 2026. Actual owner response: "Yes, this matches the intended ShiftFair MVP. Keep the scope focused and proceed with implementation." The owner emphasized hard availability/staffing/hour/lock constraints; visible individual burden and editable weights; preserved locks on recomputation; proof versus incomplete-search accuracy; persistence/CSV/print/conflict explanations; and genuine Skill Pack participation with verifiable evidence. They excluded notifications, payroll, employment-law compliance and enterprise expansion, and prioritized a complete tested deployed demonstration. Later document review, hands-on feedback and personally written submission content remain separate evidence. No second scope approval is needed.
