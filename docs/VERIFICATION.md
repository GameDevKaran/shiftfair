# ShiftFair verification — public release 24 October 2026 IST

Actual local and public release evidence. Learner review remains separate.

Public app: https://shiftfair-564976398462.web.app . Firebase Hosting version `d89caadd28661c8f`, live release `1792787758301000`, provider time `2026-10-23T20:35:58.301Z` (24 October IST). Deployment source: `8954527e0b5092d890f15ab02e885f425b0322b2`; application milestone: `8a0af7ff91c2478dbe3834c9aab0c081752f3ddb`. All ten public files matched the pre-release SHA-256 manifest, totaling 70,911 bytes.

**15 actual public Chromium workflow checks passed**, with zero page/console errors, using the same complete workflow as the local run below. Evidence: `.local/live-browser/verification.json`, screenshots, actual downloaded CSV, printed PDF and raw technical video. The initial public navigation timed out before any checks; that failed attempt is retained in `initial-navigation-failure.json`. A fresh browser diagnostic loaded every requested module with HTTP200 and successfully solved the sample; the unchanged full suite then passed. The specific cause of the first timeout was not established. No application change or redeployment was required.

- TypeScript 5.9.3 strict build passed on Node 24.8.0.
- **27 Node tests passed**, zero failures: 23 solver/domain and four storage/export tests. Twelve tiny schedules were independently exhaustively enumerated across every binary assignment matrix, including overstaffed possibilities; six feasible and six impossible cases agreed with the production solver. Other checks cover synthetic 8→2 burden improvement, zero node/time budgets, valid limited candidates without an optimum claim, deterministic input preservation, half-hours, schedule rejection, bounds and lock regeneration.
- **15 Chromium workflow checks passed** via scripts/verify-browser.mjs at http://127.0.0.1:8785. Real module worker, baseline/candidate selection and truthful labels; weights; stale export rejection; retained locks; unavailable/over-hours proof; exact save/reload; safe text; actual CSV download; exact print rows and PDF; corrupt/denied storage; keyboard and confirmed removal; 12×8 editor bound/cancel; 390px layout. Zero page/console errors.
- Desktop and mobile screenshots were visually inspected. Raw technical video, screenshots, PDF, CSV and report are under ignored `.local/browser/`. These are test artifacts, not the owner's final narrated submission media.

## Findings retained
The first combined build attempted before the UI files existed failed because public/ was not yet written; the compiled domain suite independently passed. The integrated TypeScript build then caught optional time-input destructuring; its empty-input handling was corrected. Review found that selecting a baseline could inherit the candidate's optimum label; this was corrected before browser verification and is explicitly checked there. No initial failures were presented as passing results.

## Limits
No final learner hands-on review, all-stage Skill Pack completion, independent accessibility audit, real volunteer study or actual submission is claimed. The original 12-development/12-held-out target is not a measured result; the verified evaluation is the independent tiny-case oracle and listed tests. The baseline is deterministic first feasible, not a greedy benchmark. Full coverage is mandatory in both schedules, so fairness cannot trade it away. Large problems may yield a feasible unproven candidate or an inconclusive result within the 200,000-node/1.5-second budget. No production employment or sensitive-personnel guarantees.

The public release and verification are complete. Preserve the release and reports; do not repeat passing suites without changes or a new concern.
