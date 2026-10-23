# ShiftFair static release

Prepared; deployment pending a separate spending allowance. No application credentials or new provider account are needed. Preserve the existing authorized GCP project `tough-melody-508008-p8`, number564976398462, and every existing service/site. Do not change the default Firebase site or CableMap.

## Fixed artifact and isolation
`firebase.json` targets only site `shiftfair-564976398462` and the generated `build/` directory. Ten static app files; currently70,911 uncompressed bytes. Recompute the journal if code changes. No Cloud Run, database, Firebase Authentication, external API, runtime service account, cloud user-data storage or domain. The client holds inputs in its own HTTPS origin's localStorage, separate from other applications.

## Release after actual approval
Use the existing authenticated CLI, with process PATH deduplicated on this Windows machine. Never print a token or change the global project configuration. All commands run from this repository and carry the exact project/account.

```powershell
$env:PATH=(@($env:PATH -split ';' | Where-Object { $_ } | Select-Object -Unique) -join ';')
$env:GOOGLE_CLOUD_QUOTA_PROJECT='tough-melody-508008-p8'
firebase hosting:sites:list --project tough-melody-508008-p8 --account cgkaransahu@gmail.com --json --non-interactive
```

If this dedicated site does not exist, create only it. If it already exists after an interrupted operation, inspect its releases before continuing; do not duplicate or overwrite unrelated content.

```powershell
firebase hosting:sites:create shiftfair-564976398462 --project tough-melody-508008-p8 --account cgkaransahu@gmail.com --json --non-interactive
firebase deploy --only hosting --project tough-melody-508008-p8 --account cgkaransahu@gmail.com --json --non-interactive
$env:SHIFTFAIR_BASE_URL='https://shiftfair-564976398462.web.app'
node scripts/verify-browser.mjs
```

The URL is a proposed target until a successful release and actual checks confirm it. Record source commit, app file hashes, actual version/release ID and time in `.local/firebase-release.json`. Firebase may add its managed `/__/firebase/init.js` and `.json`; app code does not use them. Verify version inventory against the app artifact, then save real HTTPS evidence in the existing central submission reference and checkpoint. The source repository stays PRIVATE.

## Security, cost and recovery
Content policy limits scripts/workers to the same origin; no inline/eval script, object embedding or forms. MIME protection, referrer and device-permission restrictions are configured. User labels are text; CSV guards spreadsheet formula prefixes; saved data is bounded and validated. No cloud secret belongs in this artifact.

Proposal: USD1 ShiftFair-only allowance through November30. At10,000 uncached complete loads of the current artifact, transfer is0.70911GB. Conservative expected cost USD0–0.20 under that low-traffic assumption; project-level shared quota means zero charges cannot be guaranteed. This is an allowance, not a hard billing cap. Pricing checked23October: https://firebase.google.com/docs/hosting/usage-quotas-pricing . No approval is inferred from the proposal.

Keep the last working release/version and rollback only this site's channel to a verified prior version if needed. A first release has no earlier version to restore; fix locally and publish a verified correction to this site. Do not delete resources, disable project billing or alter another app to control this app's costs. Record unexpected cost/access errors and stop only affected cloud steps.
