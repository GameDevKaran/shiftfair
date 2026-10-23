# ShiftFair

Build feasible volunteer rotas with explicit fairness tradeoffs.

## Status

**Live app: https://shiftfair-564976398462.web.app** — deployed and publicly verified on 24 October 2026 IST. All 27 Node tests, 15 local browser checks and 15 public browser checks passed. All ten served application files match the tested artifact. The source repository remains private until explicit owner publication authorization. Actual evidence and limitations: [verification](docs/VERIFICATION.md).

## Intended use

A volunteer coordinator has availability and desired coverage but cannot see who repeatedly gets the least convenient shifts. ShiftFair builds a small feasible rota, explains unmet constraints and lets the coordinator compare a coverage-first schedule with a more evenly distributed one before publishing anything.

## Working workflow

Edit up to 12 volunteers and eight shifts → set availability, maximum hours, staffing and explicit inconvenience weights → compare a first feasible baseline with a burden candidate → lock assignments and regenerate → save locally or export the reviewed CSV/print schedule. The seven-day worksheet uses half-hour increments. No account, runtime AI or backend is involved.

Each assignment's burden is hours × (1 + weight), where weight is an editable integer 0–10. Search minimizes maximum individual burden, then squared burdens, then total burden. Both compared schedules satisfy minimum coverage, availability, hour limits, non-overlap and all locks. This is one chosen metric, not a universal definition of fairness. A search limit is never proof of infeasibility; only exhausted search supports optimality. The first feasible baseline is not advertised as optimized.

## Development

Node 24 or newer:

```text
npm ci
npm test
npm start
```

Open http://127.0.0.1:8785 . To run browser checks, install the matching test browser with `npx playwright install chromium`, then `npm run test:browser` (stop an existing preview first, or set SHIFTFAIR_USE_RUNNING=1). `npm run build` produces the static `build/` artifact. No secret or environment variable is required by the application. [Architecture](docs/architecture.md), [release runbook](docs/STATIC_RELEASE.md).

The synthetic example has four two-hour shifts. Its first feasible baseline gives one person eight hours; the optimized candidate gives each of four people two hours, preserving all four required slots. This is authored demonstration data, not a user study. Inputs save only in this browser; regenerating is required after loading or edits. Nothing is sent to volunteers. No notifications, payroll or employment-law compliance is provided.

The official Devpost Learn Skill Pack source, real owner scope approval and outstanding learner review are documented in [provenance](SKILL_PACK_PROVENANCE.md). Agent tests do not establish completed learner participation. Required personal submission answers and final media belong to the owner.

Keep credentials in local ignored files or the deployment secret store. Do not commit user data, provider tokens or private evaluation records.

## License

Original application code and these documents use the [MIT license](LICENSE). [Third-party notices](THIRD_PARTY_NOTICES.md) cover development tools. No third-party runtime code, model, dataset or remote font is bundled.
