# ShiftFair: architecture

Proposed design; no components have been implemented.

Import locally authored people/availability → define eight shifts and minimum staffing → select explicit maximum hours and inconvenience weights → solve → display coverage, burden and infeasibility reasons → manually lock an assignment → recompute → export CSV and print view. Use a browser-based TypeScript solver or a pinned compatible constraint library; local storage and synthetic names suffice. No runtime AI required; the Devpost Learn Skill Pack governs AI-assisted creation.

MVP maximum 12 volunteers and eight shifts; compare schedules with deterministic scoring, never infer health, religion, family duties or protected characteristics. Exclude employment-law compliance, payroll, automatic notifications, production staff records and external calendars. An infeasible request must display the conflicting constraints rather than silently dropping a coverage requirement.

## Failure handling and data boundaries

Preserve original inputs and make unavailable evidence explicit. Provider failures must return a visible unresolved state. Decisions that change user or provider state need the confirmation specified above. Record source versions and operation identifiers without exposing credentials.

## Implementation record

Add pinned dependencies, actual component boundaries and operational instructions when the first working slice exists. Document departures from this design with their reason; do not describe planned integrations as verified.
