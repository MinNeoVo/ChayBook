# ChayBook Testing Dashboard

The Dashboard is a loopback-only React/Vite viewer. It displays two independent result sources and never adds their totals together:

- **Acceptance Cases:** the active reduced suite contains 74 IDs, each reported `PASS_FULL_ACCEPTANCE` by the current acceptance ledger.
- **JUnit CI Executions:** individual JUnit executions from a provenance-attested GitHub Actions Surefire artifact. An execution count is not a count of acceptance cases and does not establish full-project or production-equivalent acceptance.

The server reads artifacts only; it never starts tests, SQL, or product services.

## Run locally

```powershell
cd testing/dashboard
npm.cmd run build
npm.cmd run serve
```

Open `http://127.0.0.1:5190`. The server binds only to loopback. Dashboard tests can use an alternate loopback port with `CHAYBOOK_DASHBOARD_PORT` when 5190 is occupied.

## Verified JUnit CI evidence

The current verified source is GitHub Actions run `42486795409` on branch `ci/upload-surefire-artifact`, commit `af18f322833039f754571c1b8b663129f4551f13`:

- Run: <https://github.com/MinNeoVo/ChayBook/actions/runs/42486795409>
- Artifact: `junit-surefire-42486795409-backend`
- ZIP SHA-256: `239db06548f6128db22eccf5c4c95f07a407af1f3fbc183fd0cb26667997a714`
- Parsed XML: 19 suites, 127 executions, 0 failures, 0 errors, 0 skipped.

The retained XML, ZIP, GitHub API metadata, per-file SHA-256 values, and normalized snapshot are under `testing/reports/evidence/ci/`. PR #83 is retained only as a historical reference; this later push run is an independent artifact source.

`dashboard_data.py` accepts `junit-ci-verified.json` only when it validates all of the following:

1. GitHub run metadata matches repository, run ID, branch, commit, event, timestamp, URL, and successful Backend/Frontend jobs.
2. The named, non-expired Actions artifact has the same byte size and SHA-256 as the retained ZIP.
3. Every retained `TEST-*.xml` file has the expected SHA-256 and valid JUnit suite counters.
4. Aggregated XML counts equal the snapshot counts.

Any missing, corrupt, mismatched, or incomplete item produces `NOT VERIFIED`; local `target/surefire-reports` files are never used as a CI source.

## Update from a future CI artifact

Do not overwrite existing evidence. First obtain the run metadata from GitHub Actions API or an equivalent saved response, including successful job states and artifact metadata. Download the artifact ZIP and save the metadata JSON outside the evidence destination. Then run:

```powershell
python testing/tools/import_junit_ci_artifact.py `
  --zip <downloaded-artifact.zip> `
  --metadata <github-actions-run-metadata.json> `
  --run-id <run-id> `
  --historical-pr 83
```

The importer refuses unsafe ZIP paths, corrupt CRCs, oversized payloads, mismatched artifact metadata, failed required jobs, and existing evidence/snapshot paths. Review the generated evidence and run Dashboard pipeline tests before replacing a snapshot through an approved review.

The former 166 active testcase rows remain only in backups and historical reports, outside current Dashboard data.
