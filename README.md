# ShiftFair

Build feasible volunteer rotas with explicit fairness tradeoffs.

## Status

This repository contains the initial product documentation. Application development has not started. There is no runnable application, measured benchmark or deployed service yet.

## Intended use

A volunteer coordinator has availability and desired coverage but cannot see who repeatedly gets the least convenient shifts. ShiftFair builds a small feasible rota, explains unmet constraints and lets the coordinator compare a coverage-first schedule with a more evenly distributed one before publishing anything.

## Planned workflow

Import locally authored people/availability → define eight shifts and minimum staffing → select explicit maximum hours and inconvenience weights → solve → display coverage, burden and infeasibility reasons → manually lock an assignment → recompute → export CSV and print view. Use a browser-based TypeScript solver or a pinned compatible constraint library; local storage and synthetic names suffice. No runtime AI required; the Devpost Learn Skill Pack governs AI-assisted creation.

## Development

Start with the behavior and boundaries in [Architecture](docs/architecture.md), then establish the fixtures and acceptance checks in [Verification plan](docs/verification-plan.md). Runtime versions, dependency installation, commands and deployment instructions will be added alongside working code. No installation command is available at this stage.

Keep credentials in local ignored files or the deployment secret store. Do not commit user data, provider tokens or private evaluation records.

## License

Original application code and these documents use the [MIT license](LICENSE). Future dependencies, models, datasets and media retain their own licenses and must be reviewed before inclusion.
