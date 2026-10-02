# QA job continuity

Status: operational implementation of OD-2026-10-02-C. This ledger belongs to development state, never to a game save.

## Ownership and acceptance

The lock holder registers a long job in `live.qaJobs` before launch and synchronizes the shared MD/JSON at heartbeat/checkpoint. The worker writes only its new ignored output directory: `qa-job.json`, `results.json` and ordinary captures. An orchestrator cutoff does not stop an already launched worker from writing its result. No worker writes the shared state.

The receipt records job/run identity, PID, port, public parameters, expected assertions, source/driver/receipt-helper/build identity and start/end times. `SUCCEEDED` means the driver completed with a clean result and stable provenance; it does **not** mean production acceptance. `sync` checks the persisted result hash and current provenance and leaves `acceptance = NOT_ACCEPTED`. The lock holder inspects assertions, exact save/proof lineage and selected captures before accepting a boundary.

The receipt source fingerprint includes the committed src tree plus tracked src diff; generated/untracked source needs explicit WIP and build provenance from the orchestrator. Do not mutate tested source, driver, helper or build while a job runs; if they change, invalidate or rerun the affected proof. State-only commits do not change execution identity. No quota-based change of schedule/scope.

## Campaign driver workflow

The campaign driver is integrated with `tools/qa/qa-job.mjs`. Register and launch using the same environment. `register-demo` derives the exact public parameters used by the worker, avoiding two handwritten copies.

Example after the lock/preflight, inspecting the successful 1153 seed and checking the port is free:

```powershell
$env:AUTONOMY_RUN_ID = '<owned-runId>'
$env:DEMO_QA_JOB_ID = 'defeat-desktop-' + (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmss')
$env:DEMO_QA_OUTPUT = 'tmp/demo/' + $env:DEMO_QA_JOB_ID
$env:DEMO_QA_PORT = '5258' # check listener ownership before use
$env:DEMO_QA_TARGET = 'defeat-recovery'
$env:DEMO_QA_ROUTE = 'rescue'
$env:DEMO_QA_FINALE = 'serpent'
$env:DEMO_QA_DEFEAT_NODE = 'lion-village-choice'
$env:DEMO_QA_DEFEAT_WAIT = '1'
$env:DEMO_QA_VIEWPORT = '1366x768'
$env:DEMO_QA_OS_MOTION = '0'
$env:DEMO_QA_EARNED_SAVE = 'tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json'
$env:DEMO_QA_PRIOR_PROOF = 'tmp/demo/continuous-1153-fresh-final/results.json'
Remove-Item Env:DEMO_QA_VERIFY_SALVATION -ErrorAction SilentlyContinue
node tools/qa/qa-job.mjs register-demo --run-id=$env:AUTONOMY_RUN_ID --job-id=$env:DEMO_QA_JOB_ID
if ($LASTEXITCODE -ne 0) { throw 'QA registration failed' }
node tools/demo-continuous-production-qa.mjs
# At the next owner heartbeat/checkpoint, even if the worker failed:
node tools/qa/qa-job.mjs sync --run-id=$env:AUTONOMY_RUN_ID
```

Set unique output/job names for each run. The worker refuses existing evidence. A mobile OS-only case uses `390x844` and `DEMO_QA_OS_MOTION=1` while the game setting remains false. Never reuse a failed prior proof as a certified earned seed. These scenarios test recovery; they do not by themselves accept campaign balance or the whole demo.

Generic `register` supports existing `tools/*.mjs` drivers with explicit public parameters and assertions. Such a driver must integrate `beginJob`/`finish` to produce a worker receipt. Other drivers remain uninstrumented until their integration is needed; record their paths/PIDs/ports/provenance manually in the owned ledger and keep unknown execution identity unaccepted. Do not copy all environment variables or secrets into a job.

## Restart after interruption

1. Perform read-only preflight, inspect the old turn terminal event, heartbeat and running QA/Git/build jobs. An error `usage_limit_exceeded` proves the turn stopped, not its child processes.
2. Apply the105-minute rule and all takeover conditions; acquire the exclusive lock before snapshot or shared-state edits.
3. Read receipts/progress/results before relaunching. Preserve completed output, distinguish timeout/assertion/environment failures and ensure ports are free.
4. Sync registered jobs as the new owner using its runId; old receipt runId must match its original job. Reconcile legacy jobs manually without fabricating missing provenance.
5. Review result hash, expected assertions, driver/helper/build/source identity, parameters, viewport/motion, earned input lineage and captures. Rerun only the boundary not proven by matching evidence.

Legacy1453jobs are recorded in the current state. Desktop defeat finished PASS at15:24:25Z using old assertions; it does not certify the current full V6 cleanup/visible T1 departure. Trial finished FAIL at15:24:51Z on a bounded combat timeout. Both remain `NOT_ACCEPTED`; nextAction specifies the corrected recovery and trial diagnosis.

## Verification and costs

`node --test tools/qa/qa-job.test.mjs` covers ownership, independent receipts, premature worker exit, stale/tampered evidence, parameter/source/build drift and output confinement. Read receipts/results selectively; never dump an entire campaign chronicle into a reviewer context without a specific need.

The first instrumented production recovery belongs to the next DEMO-QA-POLISH run. The infrastructure tests do not substitute for that browser acceptance.
