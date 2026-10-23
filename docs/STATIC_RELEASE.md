# ShiftFair static release

Live and verified on 24 October 2026 IST: https://shiftfair-564976398462.web.app . The owner approved a separate USD1 allowance through November30, reference `user-20261024-shiftfair-firebase-usd1`. No application credentials or new provider account were needed. The isolated site is inside `tough-melody-508008-p8`, number564976398462; the default Firebase site and CableMap were not changed.

Deployed source `8954527e0b5092d890f15ab02e885f425b0322b2`; version `d89caadd28661c8f`; live release `1792787758301000`; release time `2026-10-23T20:35:58.301Z`. All15 public browser checks and ten public-file hash comparisons passed. The following commands are the reproducible release procedure, not an instruction to repeat a completed deployment.

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

The URL above is confirmed by the actual release and browser workflow. Source commit, app hashes, version/release ID and time are saved in `.local/firebase-release.json`; public-file hashes are in `.local/public-artifact-verification.json`. Firebase may add its managed `/__/firebase/init.js` and `.json`; app code does not use them. The source repository stays PRIVATE.

## Security, cost and recovery
Content policy limits scripts/workers to the same origin; no inline/eval script, object embedding or forms. MIME protection, referrer and device-permission restrictions are configured. User labels are text; CSV guards spreadsheet formula prefixes; saved data is bounded and validated. No cloud secret belongs in this artifact.

Approved: USD1 ShiftFair-only allowance through November30. At10,000 uncached complete loads of the current artifact, transfer is0.70911GB. Conservative expected cost USD0–0.20 under that low-traffic assumption; project-level shared quota means zero charges cannot be guaranteed. This is an allowance, not a hard billing cap. Pricing checked23October: https://firebase.google.com/docs/hosting/usage-quotas-pricing . No other application spending is included.

Keep the last working release/version and rollback only this site's channel to a verified prior version if needed. A first release has no earlier version to restore; fix locally and publish a verified correction to this site. Do not delete resources, disable project billing or alter another app to control this app's costs. Record unexpected cost/access errors and stop only affected cloud steps.
