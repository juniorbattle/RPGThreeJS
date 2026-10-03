# Autonomous work state

Current highest priority: docs/autonomy/MANUAL_PLAYTEST_OPERATOR_DECISION_2026-10-03.md. Contract set1.1.0 is locked at d7ca28aed5c377ffedb03202f6364b7a947d1096; runtime corrections are unaccepted. Integration is complete. Scheduler remains ACTIVE.

| Field | Value |
| --- | --- |
| `status` | IN_PROGRESS |
| `runId` | codex-manual-playtest-20261003T0735 |
| `agent` | codex |
| `runStartedAt` | 2026-10-03T07:35:50.593674Z |
| `runEndedAt` | 2026-10-03T07:58:05.429Z |
| `activeTask` | TRAVERSAL-VISUAL-CONVERGENCE |
| `activePhase` | Ground/checkpoint/cast/shadow remediation under amended set1.1.0 |
| `activeSubtask` | Inventory exact route/checkpoint ground and clan/hostile world actors for T0/T1/T3 |
| `workingBranch` | dev |
| `lastKnownGoodCommit` | d7ca28aed5c377ffedb03202f6364b7a947d1096 |
| `lastPushedCommit` | d7ca28aed5c377ffedb03202f6364b7a947d1096 |
| `creditStatus` | CODEX_AVAILABLE_IN_INTERACTIVE_RUN; prior0520/0650quota failures retained; scheduler ACTIVE/model/high/90m preserved |
| `contractComplianceStatus` | PRODUCTION-CONTRACTS-LOCK-1/set1.1.0: dedicated approved amendment OD-2026-10-03-A documentary PASS; baselined7ca28aed5c377ffedb03202f6364b7a947d1096; runtime remediation/visual acceptance IN_PROGRESS. No silent LOCKED change. |

## Live run

```json
{
  "runId": "codex-manual-playtest-20261003T0735",
  "agent": "codex",
  "lastHeartbeat": "2026-10-03T07:58:05.429Z",
  "status": "CHECKPOINT",
  "qaJobs": [
    {
      "schemaVersion": 1,
      "jobId": "legacy-1453-defeat-native",
      "runId": "rpgthreejs-auto-dev-90m-20261002T1453",
      "legacy": true,
      "status": "FINISHED_LEGACY",
      "reportedPass": true,
      "startedAt": "2026-10-02T14:59:47.038Z",
      "endedAt": "2026-10-02T15:24:25.803Z",
      "pid": null,
      "port": null,
      "exitCode": null,
      "output": "tmp/demo/continuous-1453-defeat-native",
      "resultPath": "tmp/demo/continuous-1453-defeat-native/results.json",
      "resultSha256": "7d73d390ba2a8f1e3a064c84fe49459ddddfae7b0186b830614bd6ebde6e0105",
      "receiptPath": "tmp/demo/continuous-1453-defeat-native/qa-job.json",
      "parameters": {
        "target": "defeat-recovery",
        "routePlan": "rescue",
        "finalePlan": "serpent",
        "viewport": {
          "width": 1366,
          "height": 768
        },
        "osReducedMotion": false
      },
      "provenance": {
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": null
        },
        "build": [
          {
            "path": "dist/assets/combat-DDZeDf1A.js",
            "sha256": "6334ff1f59575addd2a89128490a6f584631eba84198b07e967797f616451d3c"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          }
        ],
        "gitHead": null,
        "sourceTree": null
      },
      "acceptance": "NOT_ACCEPTED",
      "eligibleForReview": false,
      "limitation": "Old assertions; expected/visible-T1 departure fields absent; strengthened V6/agency checks unproven"
    },
    {
      "schemaVersion": 1,
      "jobId": "legacy-1453-trial",
      "runId": "rpgthreejs-auto-dev-90m-20261002T1453",
      "legacy": true,
      "status": "FINISHED_LEGACY",
      "reportedPass": false,
      "startedAt": "2026-10-02T14:59:46.717Z",
      "endedAt": "2026-10-02T15:24:51.542Z",
      "pid": null,
      "port": null,
      "exitCode": null,
      "output": "tmp/demo/continuous-1453-trial",
      "resultPath": "tmp/demo/continuous-1453-trial/results.json",
      "resultSha256": "9d218c13c3924b7cc6c9141906405c0814a73f1cde08cc39cbd73735bd2c741d",
      "receiptPath": "tmp/demo/continuous-1453-trial/qa-job.json",
      "parameters": {
        "target": "ending",
        "routePlan": "rescue",
        "finalePlan": "trial",
        "viewport": {
          "width": 1366,
          "height": 768
        },
        "osReducedMotion": false
      },
      "provenance": {
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": null
        },
        "build": [
          {
            "path": "dist/assets/combat-DDZeDf1A.js",
            "sha256": "6334ff1f59575addd2a89128490a6f584631eba84198b07e967797f616451d3c"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          }
        ],
        "gitHead": null,
        "sourceTree": null
      },
      "acceptance": "NOT_ACCEPTED",
      "eligibleForReview": false,
      "limitation": "Bounded combat timeout; cannot seed certified continuation"
    },
    {
      "schemaVersion": 1,
      "jobId": "1952-desktop",
      "runId": "rpgthreejs-auto-dev-90m-20261002T1952",
      "status": "ABORTED_HARNESS_DEFECT",
      "registeredAt": "2026-10-02T19:57:51.764Z",
      "pid": 50700,
      "port": 5258,
      "command": [
        "node",
        "tools/demo-continuous-production-qa.mjs"
      ],
      "parameters": {
        "target": "defeat-recovery",
        "routePlan": "rescue",
        "timeoutMinutes": 35,
        "finalePlan": "serpent",
        "defeatNodeId": "lion-village-choice",
        "nativeDefeatWait": true,
        "viewport": [
          1366,
          768
        ],
        "osReducedMotion": false,
        "earnedSavePath": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
        "priorProofPath": "tmp/demo/continuous-1153-fresh-final/results.json",
        "verifySalvation": false
      },
      "requiredAssertions": [
        "EXACT_V6_CHECKPOINT_RECOVERY",
        "VISIBLE_T1_DEPARTURE",
        "EXACT_RELOAD"
      ],
      "output": "tmp/demo/1952-desktop",
      "receiptPath": "tmp/demo/1952-desktop/qa-job.json",
      "provenance": {
        "gitHead": "387dd732b3578b3e0ff620ff7e6c3cf5c01a8fe8",
        "sourceTree": "a217d771f09008d7e07f0a15236317376000bbc9",
        "sourceDiffSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": "6a91bd526f3607af7f9b4e0b44a7508e4dbc9ff61e124a10238000d81b6b9b20"
        },
        "inputs": [
          {
            "role": "earnedSavePath",
            "path": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
            "sha256": "d8b0deb62c66fc2fd3d01ec8c513fafb697021e8f9c808869277b90a250e8267"
          },
          {
            "role": "priorProofPath",
            "path": "tmp/demo/continuous-1153-fresh-final/results.json",
            "sha256": "896b9a96a534428b85d6c4f4b17b4402e085334b077d2b22875f884661f5d265"
          }
        ],
        "receiptToolSha256": "7ba3ac2b82b431403f18e84f12484f2894a51a9058025133744ce68f4f70f2b1",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-D77u3W0i.css",
            "sha256": "0a129bc6287a9a8bfb62aa0d19fc65482032b89d26634d9736afc29cb54bda04"
          },
          {
            "path": "dist/assets/combat-DDZeDf1A.js",
            "sha256": "6334ff1f59575addd2a89128490a6f584631eba84198b07e967797f616451d3c"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "NOT_ACCEPTED",
      "startedAt": "2026-10-02T19:57:52.587Z",
      "endedAt": null,
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": false,
      "eligibleForReview": false,
      "workerReceiptStatus": "RUNNING",
      "ownerDisposition": "tmp/demo/1952-desktop/owner-interruption.json",
      "processConfirmedStopped": true,
      "matchesExecutionAtReview": false,
      "eligibleForReviewAtReview": false,
      "provenanceRepresentation": "Reviewed before unchanged source commit; HEAD:src and diff representation changed at commit, raw provenance retained"
    },
    {
      "schemaVersion": 1,
      "jobId": "1952-mobile",
      "runId": "rpgthreejs-auto-dev-90m-20261002T1952",
      "status": "FAILED",
      "registeredAt": "2026-10-02T19:57:52.748Z",
      "pid": 17584,
      "port": 5259,
      "command": [
        "node",
        "tools/demo-continuous-production-qa.mjs"
      ],
      "parameters": {
        "target": "defeat-recovery",
        "routePlan": "rescue",
        "timeoutMinutes": 35,
        "finalePlan": "serpent",
        "defeatNodeId": "lion-village-choice",
        "nativeDefeatWait": true,
        "viewport": [
          390,
          844
        ],
        "osReducedMotion": true,
        "earnedSavePath": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
        "priorProofPath": "tmp/demo/continuous-1153-fresh-final/results.json",
        "verifySalvation": false
      },
      "requiredAssertions": [
        "EXACT_V6_CHECKPOINT_RECOVERY",
        "VISIBLE_T1_DEPARTURE",
        "EXACT_RELOAD"
      ],
      "output": "tmp/demo/1952-mobile",
      "receiptPath": "tmp/demo/1952-mobile/qa-job.json",
      "provenance": {
        "gitHead": "387dd732b3578b3e0ff620ff7e6c3cf5c01a8fe8",
        "sourceTree": "a217d771f09008d7e07f0a15236317376000bbc9",
        "sourceDiffSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": "6a91bd526f3607af7f9b4e0b44a7508e4dbc9ff61e124a10238000d81b6b9b20"
        },
        "inputs": [
          {
            "role": "earnedSavePath",
            "path": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
            "sha256": "d8b0deb62c66fc2fd3d01ec8c513fafb697021e8f9c808869277b90a250e8267"
          },
          {
            "role": "priorProofPath",
            "path": "tmp/demo/continuous-1153-fresh-final/results.json",
            "sha256": "896b9a96a534428b85d6c4f4b17b4402e085334b077d2b22875f884661f5d265"
          }
        ],
        "receiptToolSha256": "7ba3ac2b82b431403f18e84f12484f2894a51a9058025133744ce68f4f70f2b1",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-D77u3W0i.css",
            "sha256": "0a129bc6287a9a8bfb62aa0d19fc65482032b89d26634d9736afc29cb54bda04"
          },
          {
            "path": "dist/assets/combat-DDZeDf1A.js",
            "sha256": "6334ff1f59575addd2a89128490a6f584631eba84198b07e967797f616451d3c"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "NOT_ACCEPTED",
      "startedAt": "2026-10-02T19:57:53.611Z",
      "endedAt": "2026-10-02T20:13:45.653Z",
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": false,
      "eligibleForReview": false,
      "exitCode": 1,
      "provenanceStable": true,
      "processConfirmedStopped": true,
      "matchesExecutionAtReview": false,
      "eligibleForReviewAtReview": false,
      "provenanceRepresentation": "Reviewed before unchanged source commit; HEAD:src and diff representation changed at commit, raw provenance retained"
    },
    {
      "schemaVersion": 1,
      "jobId": "1952-trial",
      "runId": "rpgthreejs-auto-dev-90m-20261002T1952",
      "status": "ABORTED_HARNESS_DEFECT",
      "registeredAt": "2026-10-02T19:57:53.79Z",
      "pid": 54404,
      "port": 5261,
      "command": [
        "node",
        "tools/demo-continuous-production-qa.mjs"
      ],
      "parameters": {
        "target": "ending",
        "routePlan": "rescue",
        "timeoutMinutes": 35,
        "finalePlan": "trial",
        "defeatNodeId": "lion-village-choice",
        "nativeDefeatWait": false,
        "viewport": [
          1366,
          768
        ],
        "osReducedMotion": false,
        "earnedSavePath": "tmp/demo/continuous-1323-salvation-baseline/earned-lion-second-refuge-v6.json",
        "priorProofPath": "tmp/demo/continuous-1323-salvation-baseline/results.json",
        "verifySalvation": false
      },
      "requiredAssertions": [
        "EARNED_LINEAGE",
        "NATIVE_INPUTS",
        "EXACT_RELOAD"
      ],
      "output": "tmp/demo/1952-trial",
      "receiptPath": "tmp/demo/1952-trial/qa-job.json",
      "provenance": {
        "gitHead": "387dd732b3578b3e0ff620ff7e6c3cf5c01a8fe8",
        "sourceTree": "a217d771f09008d7e07f0a15236317376000bbc9",
        "sourceDiffSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": "6a91bd526f3607af7f9b4e0b44a7508e4dbc9ff61e124a10238000d81b6b9b20"
        },
        "inputs": [
          {
            "role": "earnedSavePath",
            "path": "tmp/demo/continuous-1323-salvation-baseline/earned-lion-second-refuge-v6.json",
            "sha256": "224d1796a1a0b92f98dcce27ba0652eb98fa7471b2c84653321c7470c0c83d50"
          },
          {
            "role": "priorProofPath",
            "path": "tmp/demo/continuous-1323-salvation-baseline/results.json",
            "sha256": "1399e4268dff72b77519fd3e874c7542bcd4a2fc207003b1494e32d2500c5e2a"
          }
        ],
        "receiptToolSha256": "7ba3ac2b82b431403f18e84f12484f2894a51a9058025133744ce68f4f70f2b1",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-D77u3W0i.css",
            "sha256": "0a129bc6287a9a8bfb62aa0d19fc65482032b89d26634d9736afc29cb54bda04"
          },
          {
            "path": "dist/assets/combat-DDZeDf1A.js",
            "sha256": "6334ff1f59575addd2a89128490a6f584631eba84198b07e967797f616451d3c"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "NOT_ACCEPTED",
      "startedAt": "2026-10-02T19:57:54.698Z",
      "endedAt": null,
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": false,
      "eligibleForReview": false,
      "workerReceiptStatus": "RUNNING",
      "ownerDisposition": "tmp/demo/1952-trial/owner-interruption.json",
      "processConfirmedStopped": true,
      "matchesExecutionAtReview": false,
      "eligibleForReviewAtReview": false,
      "provenanceRepresentation": "Reviewed before unchanged source commit; HEAD:src and diff representation changed at commit, raw provenance retained"
    },
    {
      "schemaVersion": 1,
      "jobId": "1952-intermediate",
      "runId": "rpgthreejs-auto-dev-90m-20261002T1952",
      "status": "ABORTED_HARNESS_DEFECT",
      "registeredAt": "2026-10-02T20:03:03.233Z",
      "pid": 25412,
      "port": 5260,
      "command": [
        "node",
        "tools/demo-continuous-production-qa.mjs"
      ],
      "parameters": {
        "target": "defeat-recovery",
        "routePlan": "rescue",
        "timeoutMinutes": 35,
        "finalePlan": "serpent",
        "defeatNodeId": "lion-village-choice",
        "nativeDefeatWait": true,
        "viewport": [
          620,
          780
        ],
        "osReducedMotion": false,
        "earnedSavePath": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
        "priorProofPath": "tmp/demo/continuous-1153-fresh-final/results.json",
        "verifySalvation": false
      },
      "requiredAssertions": [
        "EXACT_V6_CHECKPOINT_RECOVERY",
        "VISIBLE_T1_DEPARTURE",
        "EXACT_RELOAD"
      ],
      "output": "tmp/demo/1952-intermediate",
      "receiptPath": "tmp/demo/1952-intermediate/qa-job.json",
      "provenance": {
        "gitHead": "387dd732b3578b3e0ff620ff7e6c3cf5c01a8fe8",
        "sourceTree": "a217d771f09008d7e07f0a15236317376000bbc9",
        "sourceDiffSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": "6a91bd526f3607af7f9b4e0b44a7508e4dbc9ff61e124a10238000d81b6b9b20"
        },
        "inputs": [
          {
            "role": "earnedSavePath",
            "path": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
            "sha256": "d8b0deb62c66fc2fd3d01ec8c513fafb697021e8f9c808869277b90a250e8267"
          },
          {
            "role": "priorProofPath",
            "path": "tmp/demo/continuous-1153-fresh-final/results.json",
            "sha256": "896b9a96a534428b85d6c4f4b17b4402e085334b077d2b22875f884661f5d265"
          }
        ],
        "receiptToolSha256": "7ba3ac2b82b431403f18e84f12484f2894a51a9058025133744ce68f4f70f2b1",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-D77u3W0i.css",
            "sha256": "0a129bc6287a9a8bfb62aa0d19fc65482032b89d26634d9736afc29cb54bda04"
          },
          {
            "path": "dist/assets/combat-DDZeDf1A.js",
            "sha256": "6334ff1f59575addd2a89128490a6f584631eba84198b07e967797f616451d3c"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "NOT_ACCEPTED",
      "startedAt": "2026-10-02T20:03:07.716Z",
      "endedAt": null,
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": false,
      "eligibleForReview": false,
      "workerReceiptStatus": "RUNNING",
      "ownerDisposition": "tmp/demo/1952-intermediate/owner-interruption.json",
      "processConfirmedStopped": true,
      "matchesExecutionAtReview": false,
      "eligibleForReviewAtReview": false,
      "provenanceRepresentation": "Reviewed before unchanged source commit; HEAD:src and diff representation changed at commit, raw provenance retained"
    },
    {
      "schemaVersion": 1,
      "jobId": "1952-keyboard-final",
      "runId": "rpgthreejs-auto-dev-90m-20261002T1952",
      "status": "SUCCEEDED",
      "registeredAt": "2026-10-02T20:23:25.312Z",
      "pid": 32820,
      "port": 5262,
      "command": [
        "node",
        "tools/combat-keyboard-production-qa.mjs"
      ],
      "parameters": {
        "viewports": [
          [
            1366,
            768
          ],
          [
            620,
            780
          ],
          [
            390,
            844
          ]
        ],
        "motionModes": [
          "no-preference",
          "reduce"
        ]
      },
      "requiredAssertions": [
        "FOCUSED_NATIVE_ACTIVATION",
        "NO_PARASITIC_END_TURN",
        "BATTLEFIELD_SHORTCUTS"
      ],
      "output": "tmp/demo/1952-keyboard-final",
      "receiptPath": "tmp/demo/1952-keyboard-final/qa-job.json",
      "provenance": {
        "gitHead": "387dd732b3578b3e0ff620ff7e6c3cf5c01a8fe8",
        "sourceTree": "a217d771f09008d7e07f0a15236317376000bbc9",
        "sourceDiffSha256": "6a9d0d99de50c0170942550df93088ffcc83723168f9b3366fb23d996805c220",
        "driver": {
          "path": "tools/combat-keyboard-production-qa.mjs",
          "sha256": "e5b0675210c37fc9b2520c1b93716c45646dd30abd2fa3c618511a46cac27014"
        },
        "inputs": [],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-D77u3W0i.css",
            "sha256": "0a129bc6287a9a8bfb62aa0d19fc65482032b89d26634d9736afc29cb54bda04"
          },
          {
            "path": "dist/assets/combat-DWj918UO.js",
            "sha256": "efdb2aede6bc709a6fb8f3f30ce516df93d4a00dae15c58f9bb2c21d2f131539"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "ACCEPTED_SCOPED",
      "startedAt": "2026-10-02T20:23:26.064Z",
      "endedAt": "2026-10-02T20:34:46.49Z",
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": true,
      "eligibleForReview": false,
      "exitCode": 0,
      "resultPath": "tmp/demo/1952-keyboard-final/results.json",
      "resultSha256": "7c807510638a4a2b73f8c310a806c832b2520ff84d4f7e079b3ac4fcee6defcb",
      "provenanceStable": true,
      "reviewedAt": "2026-10-02T21:01:29.978Z",
      "matchesExecutionAtReview": true,
      "acceptedScope": "Standalone6 native-control cases at3widths x2motion modes; campaignAcceptance=false",
      "contractsReview": "contracts-guardian verified relevant boundary",
      "processConfirmedStopped": true,
      "eligibleForReviewAtReview": true,
      "provenanceRepresentation": "Reviewed before unchanged source commit; HEAD:src and diff representation changed at commit, raw provenance retained",
      "acceptanceLinkedImplementationCommit": "c05ba67bd2823db16d80638d4aff3d1ba74b0052",
      "reviewedPayloadMatchesCommittedBlobs": true
    },
    {
      "schemaVersion": 1,
      "jobId": "1952-final-desktop",
      "runId": "rpgthreejs-auto-dev-90m-20261002T1952",
      "status": "SUCCEEDED",
      "registeredAt": "2026-10-02T20:25:42.033Z",
      "pid": 23032,
      "port": 5258,
      "command": [
        "node",
        "tools/demo-continuous-production-qa.mjs"
      ],
      "parameters": {
        "target": "defeat-recovery",
        "routePlan": "rescue",
        "timeoutMinutes": 35,
        "finalePlan": "serpent",
        "defeatNodeId": "lion-village-choice",
        "nativeDefeatWait": true,
        "viewport": [
          1366,
          768
        ],
        "osReducedMotion": false,
        "earnedSavePath": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
        "priorProofPath": "tmp/demo/continuous-1153-fresh-final/results.json",
        "verifySalvation": false
      },
      "requiredAssertions": [
        "EXACT_V6_CHECKPOINT_RECOVERY",
        "VISIBLE_T1_DEPARTURE",
        "EXACT_RELOAD"
      ],
      "output": "tmp/demo/1952-final-desktop",
      "receiptPath": "tmp/demo/1952-final-desktop/qa-job.json",
      "provenance": {
        "gitHead": "387dd732b3578b3e0ff620ff7e6c3cf5c01a8fe8",
        "sourceTree": "a217d771f09008d7e07f0a15236317376000bbc9",
        "sourceDiffSha256": "6a9d0d99de50c0170942550df93088ffcc83723168f9b3366fb23d996805c220",
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": "558df230a943da57ec0bccc583ee1b8fd76aaab709e80e746b106aa3bcbe195c"
        },
        "inputs": [
          {
            "role": "earnedSavePath",
            "path": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
            "sha256": "d8b0deb62c66fc2fd3d01ec8c513fafb697021e8f9c808869277b90a250e8267"
          },
          {
            "role": "priorProofPath",
            "path": "tmp/demo/continuous-1153-fresh-final/results.json",
            "sha256": "896b9a96a534428b85d6c4f4b17b4402e085334b077d2b22875f884661f5d265"
          }
        ],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-D77u3W0i.css",
            "sha256": "0a129bc6287a9a8bfb62aa0d19fc65482032b89d26634d9736afc29cb54bda04"
          },
          {
            "path": "dist/assets/combat-DWj918UO.js",
            "sha256": "efdb2aede6bc709a6fb8f3f30ce516df93d4a00dae15c58f9bb2c21d2f131539"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "ACCEPTED_SCOPED",
      "startedAt": "2026-10-02T20:25:43.258Z",
      "endedAt": "2026-10-02T20:57:00.318Z",
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": true,
      "eligibleForReview": false,
      "exitCode": 0,
      "resultPath": "tmp/demo/1952-final-desktop/results.json",
      "resultSha256": "0c97f1658d5b65035be11e78800f00f69841fd6dae352d9e7309435c76e89819",
      "provenanceStable": true,
      "reviewedAt": "2026-10-02T21:01:29.978Z",
      "matchesExecutionAtReview": true,
      "acceptedScope": "Native exact V6 recovery/reload;1366normal or390OS-only as exact job params; T3 absent beforehand",
      "contractsReview": "contracts-guardian verified relevant boundary",
      "processConfirmedStopped": true,
      "eligibleForReviewAtReview": true,
      "provenanceRepresentation": "Reviewed before unchanged source commit; HEAD:src and diff representation changed at commit, raw provenance retained",
      "acceptanceLinkedImplementationCommit": "c05ba67bd2823db16d80638d4aff3d1ba74b0052",
      "reviewedPayloadMatchesCommittedBlobs": true
    },
    {
      "schemaVersion": 1,
      "jobId": "1952-final-mobile",
      "runId": "rpgthreejs-auto-dev-90m-20261002T1952",
      "status": "SUCCEEDED",
      "registeredAt": "2026-10-02T20:25:43.57Z",
      "pid": 36772,
      "port": 5259,
      "command": [
        "node",
        "tools/demo-continuous-production-qa.mjs"
      ],
      "parameters": {
        "target": "defeat-recovery",
        "routePlan": "rescue",
        "timeoutMinutes": 35,
        "finalePlan": "serpent",
        "defeatNodeId": "lion-village-choice",
        "nativeDefeatWait": true,
        "viewport": [
          390,
          844
        ],
        "osReducedMotion": true,
        "earnedSavePath": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
        "priorProofPath": "tmp/demo/continuous-1153-fresh-final/results.json",
        "verifySalvation": false
      },
      "requiredAssertions": [
        "EXACT_V6_CHECKPOINT_RECOVERY",
        "VISIBLE_T1_DEPARTURE",
        "EXACT_RELOAD"
      ],
      "output": "tmp/demo/1952-final-mobile",
      "receiptPath": "tmp/demo/1952-final-mobile/qa-job.json",
      "provenance": {
        "gitHead": "387dd732b3578b3e0ff620ff7e6c3cf5c01a8fe8",
        "sourceTree": "a217d771f09008d7e07f0a15236317376000bbc9",
        "sourceDiffSha256": "6a9d0d99de50c0170942550df93088ffcc83723168f9b3366fb23d996805c220",
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": "558df230a943da57ec0bccc583ee1b8fd76aaab709e80e746b106aa3bcbe195c"
        },
        "inputs": [
          {
            "role": "earnedSavePath",
            "path": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
            "sha256": "d8b0deb62c66fc2fd3d01ec8c513fafb697021e8f9c808869277b90a250e8267"
          },
          {
            "role": "priorProofPath",
            "path": "tmp/demo/continuous-1153-fresh-final/results.json",
            "sha256": "896b9a96a534428b85d6c4f4b17b4402e085334b077d2b22875f884661f5d265"
          }
        ],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-D77u3W0i.css",
            "sha256": "0a129bc6287a9a8bfb62aa0d19fc65482032b89d26634d9736afc29cb54bda04"
          },
          {
            "path": "dist/assets/combat-DWj918UO.js",
            "sha256": "efdb2aede6bc709a6fb8f3f30ce516df93d4a00dae15c58f9bb2c21d2f131539"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "ACCEPTED_SCOPED",
      "startedAt": "2026-10-02T20:25:45.067Z",
      "endedAt": "2026-10-02T20:45:02.091Z",
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": true,
      "eligibleForReview": false,
      "exitCode": 0,
      "resultPath": "tmp/demo/1952-final-mobile/results.json",
      "resultSha256": "ad0ba70b3f9cdedbb8ad6a46b75acb78aac2c7b9f8f19e5bb0b45a9b9a727561",
      "provenanceStable": true,
      "reviewedAt": "2026-10-02T21:01:29.978Z",
      "matchesExecutionAtReview": true,
      "acceptedScope": "Native exact V6 recovery/reload;1366normal or390OS-only as exact job params; T3 absent beforehand",
      "contractsReview": "contracts-guardian verified relevant boundary",
      "processConfirmedStopped": true,
      "eligibleForReviewAtReview": true,
      "provenanceRepresentation": "Reviewed before unchanged source commit; HEAD:src and diff representation changed at commit, raw provenance retained",
      "acceptanceLinkedImplementationCommit": "c05ba67bd2823db16d80638d4aff3d1ba74b0052",
      "reviewedPayloadMatchesCommittedBlobs": true
    },
    {
      "schemaVersion": 1,
      "jobId": "1952-final-intermediate",
      "runId": "rpgthreejs-auto-dev-90m-20261002T1952",
      "status": "FAILED",
      "registeredAt": "2026-10-02T20:25:45.321Z",
      "pid": 33220,
      "port": 5260,
      "command": [
        "node",
        "tools/demo-continuous-production-qa.mjs"
      ],
      "parameters": {
        "target": "defeat-recovery",
        "routePlan": "rescue",
        "timeoutMinutes": 35,
        "finalePlan": "serpent",
        "defeatNodeId": "lion-village-choice",
        "nativeDefeatWait": true,
        "viewport": [
          620,
          780
        ],
        "osReducedMotion": false,
        "earnedSavePath": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
        "priorProofPath": "tmp/demo/continuous-1153-fresh-final/results.json",
        "verifySalvation": false
      },
      "requiredAssertions": [
        "EXACT_V6_CHECKPOINT_RECOVERY",
        "VISIBLE_T1_DEPARTURE",
        "EXACT_RELOAD"
      ],
      "output": "tmp/demo/1952-final-intermediate",
      "receiptPath": "tmp/demo/1952-final-intermediate/qa-job.json",
      "provenance": {
        "gitHead": "387dd732b3578b3e0ff620ff7e6c3cf5c01a8fe8",
        "sourceTree": "a217d771f09008d7e07f0a15236317376000bbc9",
        "sourceDiffSha256": "6a9d0d99de50c0170942550df93088ffcc83723168f9b3366fb23d996805c220",
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": "558df230a943da57ec0bccc583ee1b8fd76aaab709e80e746b106aa3bcbe195c"
        },
        "inputs": [
          {
            "role": "earnedSavePath",
            "path": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
            "sha256": "d8b0deb62c66fc2fd3d01ec8c513fafb697021e8f9c808869277b90a250e8267"
          },
          {
            "role": "priorProofPath",
            "path": "tmp/demo/continuous-1153-fresh-final/results.json",
            "sha256": "896b9a96a534428b85d6c4f4b17b4402e085334b077d2b22875f884661f5d265"
          }
        ],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-D77u3W0i.css",
            "sha256": "0a129bc6287a9a8bfb62aa0d19fc65482032b89d26634d9736afc29cb54bda04"
          },
          {
            "path": "dist/assets/combat-DWj918UO.js",
            "sha256": "efdb2aede6bc709a6fb8f3f30ce516df93d4a00dae15c58f9bb2c21d2f131539"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "NOT_ACCEPTED",
      "startedAt": "2026-10-02T20:25:46.855Z",
      "endedAt": "2026-10-02T20:52:22.438Z",
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": true,
      "eligibleForReview": false,
      "exitCode": 1,
      "resultPath": "tmp/demo/1952-final-intermediate/results.json",
      "resultSha256": "feaba095048511c64fa233a1cbf00cea5bd80d63a3420fa87cd5a461201c78e0",
      "provenanceStable": true,
      "processConfirmedStopped": true,
      "matchesExecutionAtReview": true,
      "eligibleForReviewAtReview": false,
      "provenanceRepresentation": "Reviewed before unchanged source commit; HEAD:src and diff representation changed at commit, raw provenance retained"
    },
    {
      "schemaVersion": 1,
      "jobId": "1952-final-trial",
      "runId": "rpgthreejs-auto-dev-90m-20261002T1952",
      "status": "FAILED",
      "registeredAt": "2026-10-02T20:25:47.137Z",
      "pid": 25720,
      "port": 5261,
      "command": [
        "node",
        "tools/demo-continuous-production-qa.mjs"
      ],
      "parameters": {
        "target": "ending",
        "routePlan": "rescue",
        "timeoutMinutes": 35,
        "finalePlan": "trial",
        "defeatNodeId": "lion-village-choice",
        "nativeDefeatWait": false,
        "viewport": [
          1366,
          768
        ],
        "osReducedMotion": false,
        "earnedSavePath": "tmp/demo/continuous-1323-salvation-baseline/earned-lion-second-refuge-v6.json",
        "priorProofPath": "tmp/demo/continuous-1323-salvation-baseline/results.json",
        "verifySalvation": false
      },
      "requiredAssertions": [
        "EARNED_LINEAGE",
        "NATIVE_INPUTS",
        "EXACT_RELOAD"
      ],
      "output": "tmp/demo/1952-final-trial",
      "receiptPath": "tmp/demo/1952-final-trial/qa-job.json",
      "provenance": {
        "gitHead": "387dd732b3578b3e0ff620ff7e6c3cf5c01a8fe8",
        "sourceTree": "a217d771f09008d7e07f0a15236317376000bbc9",
        "sourceDiffSha256": "6a9d0d99de50c0170942550df93088ffcc83723168f9b3366fb23d996805c220",
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": "558df230a943da57ec0bccc583ee1b8fd76aaab709e80e746b106aa3bcbe195c"
        },
        "inputs": [
          {
            "role": "earnedSavePath",
            "path": "tmp/demo/continuous-1323-salvation-baseline/earned-lion-second-refuge-v6.json",
            "sha256": "224d1796a1a0b92f98dcce27ba0652eb98fa7471b2c84653321c7470c0c83d50"
          },
          {
            "role": "priorProofPath",
            "path": "tmp/demo/continuous-1323-salvation-baseline/results.json",
            "sha256": "1399e4268dff72b77519fd3e874c7542bcd4a2fc207003b1494e32d2500c5e2a"
          }
        ],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-D77u3W0i.css",
            "sha256": "0a129bc6287a9a8bfb62aa0d19fc65482032b89d26634d9736afc29cb54bda04"
          },
          {
            "path": "dist/assets/combat-DWj918UO.js",
            "sha256": "efdb2aede6bc709a6fb8f3f30ce516df93d4a00dae15c58f9bb2c21d2f131539"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "NOT_ACCEPTED",
      "startedAt": "2026-10-02T20:25:48.838Z",
      "endedAt": "2026-10-02T21:01:03.775Z",
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": true,
      "eligibleForReview": false,
      "exitCode": 1,
      "resultPath": "tmp/demo/1952-final-trial/results.json",
      "resultSha256": "e7bf16509a154e0121f1a260fcfe3eeaa93eb7625597d8ed5493aca379e5c9e2",
      "provenanceStable": true,
      "processConfirmedStopped": true,
      "matchesExecutionAtReview": true,
      "eligibleForReviewAtReview": false,
      "provenanceRepresentation": "Reviewed before unchanged source commit; HEAD:src and diff representation changed at commit, raw provenance retained"
    },
    {
      "schemaVersion": 1,
      "jobId": "2122-grid-final",
      "runId": "rpgthreejs-auto-dev-90m-20261002T2122",
      "status": "ABORTED_HARNESS_DEFECT",
      "registeredAt": "2026-10-02T21:34:18.903Z",
      "pid": 42288,
      "port": 5264,
      "command": [
        "node",
        "tools/combat-grid-hit-production-qa.mjs"
      ],
      "parameters": {
        "viewports": [
          [
            1366,
            768
          ],
          [
            620,
            780
          ],
          [
            390,
            844
          ],
          [
            560,
            780
          ],
          [
            561,
            780
          ],
          [
            700,
            780
          ],
          [
            701,
            780
          ],
          [
            900,
            780
          ],
          [
            901,
            780
          ],
          [
            1240,
            780
          ],
          [
            1241,
            780
          ],
          [
            620,
            600
          ]
        ],
        "motion": [
          "no-preference",
          "reduce"
        ],
        "campaignAcceptance": false
      },
      "requiredAssertions": [
        "NATIVE_GRID_HIT_TARGETS",
        "NATIVE_MOVE_AND_UNDO",
        "HOVER_PRESERVES_TACTICAL_STATE"
      ],
      "output": "tmp/demo/2122-grid-final",
      "receiptPath": "tmp/demo/2122-grid-final/qa-job.json",
      "provenance": {
        "gitHead": "5455d067e45e8120c318453268ebc51143a46ad0",
        "sourceTree": "28f58798b141ef632c6f8c85597c8cc36f6a8a40",
        "sourceDiffSha256": "d67e945d7e17bd71eb962c19db31ac393bc46db22cb1adeef615a007f39ec197",
        "driver": {
          "path": "tools/combat-grid-hit-production-qa.mjs",
          "sha256": "ff3412232ab047ffd21c471184d6da83fd8800c7145bcc8634e10a3d5d6320f7"
        },
        "inputs": [],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-C-5wtmFI.css",
            "sha256": "ff5ff7792ba271760979fa24e4ccd3f37d3f475d52ef1d33fa32251ddd934ec0"
          },
          {
            "path": "dist/assets/combat-CPQk2mRq.js",
            "sha256": "efdb2aede6bc709a6fb8f3f30ce516df93d4a00dae15c58f9bb2c21d2f131539"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "NOT_ACCEPTED",
      "startedAt": "2026-10-02T21:34:19.634Z",
      "endedAt": null,
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": false,
      "eligibleForReview": false,
      "ownerInterruption": "tmp/demo/2122-grid-final/owner-interruption.json"
    },
    {
      "schemaVersion": 1,
      "jobId": "2122-trial-final",
      "runId": "rpgthreejs-auto-dev-90m-20261002T2122",
      "status": "ABORTED_SOURCE_CORRECTION",
      "registeredAt": "2026-10-02T21:35:24.027Z",
      "pid": 48956,
      "port": 5265,
      "command": [
        "node",
        "tools/demo-continuous-production-qa.mjs"
      ],
      "parameters": {
        "target": "ending",
        "routePlan": "rescue",
        "timeoutMinutes": 45,
        "finalePlan": "trial",
        "defeatNodeId": "lion-village-choice",
        "nativeDefeatWait": false,
        "viewport": [
          1366,
          768
        ],
        "osReducedMotion": false,
        "earnedSavePath": "tmp/demo/continuous-1323-salvation-baseline/earned-lion-second-refuge-v6.json",
        "priorProofPath": "tmp/demo/continuous-1323-salvation-baseline/results.json",
        "verifySalvation": false
      },
      "requiredAssertions": [
        "EARNED_LINEAGE",
        "NATIVE_INPUTS",
        "EXACT_RELOAD"
      ],
      "output": "tmp/demo/2122-trial-final",
      "receiptPath": "tmp/demo/2122-trial-final/qa-job.json",
      "provenance": {
        "gitHead": "5455d067e45e8120c318453268ebc51143a46ad0",
        "sourceTree": "28f58798b141ef632c6f8c85597c8cc36f6a8a40",
        "sourceDiffSha256": "d67e945d7e17bd71eb962c19db31ac393bc46db22cb1adeef615a007f39ec197",
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": "558df230a943da57ec0bccc583ee1b8fd76aaab709e80e746b106aa3bcbe195c"
        },
        "inputs": [
          {
            "role": "earnedSavePath",
            "path": "tmp/demo/continuous-1323-salvation-baseline/earned-lion-second-refuge-v6.json",
            "sha256": "224d1796a1a0b92f98dcce27ba0652eb98fa7471b2c84653321c7470c0c83d50"
          },
          {
            "role": "priorProofPath",
            "path": "tmp/demo/continuous-1323-salvation-baseline/results.json",
            "sha256": "1399e4268dff72b77519fd3e874c7542bcd4a2fc207003b1494e32d2500c5e2a"
          }
        ],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-C-5wtmFI.css",
            "sha256": "ff5ff7792ba271760979fa24e4ccd3f37d3f475d52ef1d33fa32251ddd934ec0"
          },
          {
            "path": "dist/assets/combat-CPQk2mRq.js",
            "sha256": "efdb2aede6bc709a6fb8f3f30ce516df93d4a00dae15c58f9bb2c21d2f131539"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "NOT_ACCEPTED",
      "startedAt": "2026-10-02T21:35:25.15Z",
      "endedAt": null,
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": false,
      "eligibleForReview": false,
      "ownerInterruption": "tmp/demo/2122-trial-final/owner-interruption.json"
    },
    {
      "schemaVersion": 1,
      "jobId": "2122-intermediate-final",
      "runId": "rpgthreejs-auto-dev-90m-20261002T2122",
      "status": "FAILED",
      "registeredAt": "2026-10-02T21:36:58.627Z",
      "pid": 61876,
      "port": 5266,
      "command": [
        "node",
        "tools/demo-continuous-production-qa.mjs"
      ],
      "parameters": {
        "target": "defeat-recovery",
        "routePlan": "rescue",
        "timeoutMinutes": 35,
        "finalePlan": "serpent",
        "defeatNodeId": "lion-village-choice",
        "nativeDefeatWait": true,
        "viewport": [
          620,
          780
        ],
        "osReducedMotion": false,
        "earnedSavePath": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
        "priorProofPath": "tmp/demo/continuous-1153-fresh-final/results.json",
        "verifySalvation": false
      },
      "requiredAssertions": [
        "EXACT_V6_CHECKPOINT_RECOVERY",
        "VISIBLE_T1_DEPARTURE",
        "EXACT_RELOAD"
      ],
      "output": "tmp/demo/2122-intermediate-final",
      "receiptPath": "tmp/demo/2122-intermediate-final/qa-job.json",
      "provenance": {
        "gitHead": "5455d067e45e8120c318453268ebc51143a46ad0",
        "sourceTree": "28f58798b141ef632c6f8c85597c8cc36f6a8a40",
        "sourceDiffSha256": "d67e945d7e17bd71eb962c19db31ac393bc46db22cb1adeef615a007f39ec197",
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": "558df230a943da57ec0bccc583ee1b8fd76aaab709e80e746b106aa3bcbe195c"
        },
        "inputs": [
          {
            "role": "earnedSavePath",
            "path": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
            "sha256": "d8b0deb62c66fc2fd3d01ec8c513fafb697021e8f9c808869277b90a250e8267"
          },
          {
            "role": "priorProofPath",
            "path": "tmp/demo/continuous-1153-fresh-final/results.json",
            "sha256": "896b9a96a534428b85d6c4f4b17b4402e085334b077d2b22875f884661f5d265"
          }
        ],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-C-5wtmFI.css",
            "sha256": "ff5ff7792ba271760979fa24e4ccd3f37d3f475d52ef1d33fa32251ddd934ec0"
          },
          {
            "path": "dist/assets/combat-CPQk2mRq.js",
            "sha256": "efdb2aede6bc709a6fb8f3f30ce516df93d4a00dae15c58f9bb2c21d2f131539"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "NOT_ACCEPTED",
      "startedAt": "2026-10-02T21:36:59.954Z",
      "endedAt": "2026-10-02T21:49:54.861Z",
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": true,
      "eligibleForReview": false,
      "exitCode": 1,
      "resultPath": "tmp/demo/2122-intermediate-final/results.json",
      "resultSha256": "52c0584b8f849c37bf0c860a578369d176429d0dd86e066e8c8dd88fdf3f56ab",
      "provenanceStable": true
    },
    {
      "schemaVersion": 1,
      "jobId": "2122-grid-bounded",
      "runId": "rpgthreejs-auto-dev-90m-20261002T2122",
      "status": "ABORTED_HARNESS_COST",
      "registeredAt": "2026-10-02T21:40:25.115Z",
      "pid": 26404,
      "port": 5264,
      "command": [
        "node",
        "tools/combat-grid-hit-production-qa.mjs"
      ],
      "parameters": {
        "viewports": [
          [
            1366,
            768
          ],
          [
            620,
            780
          ],
          [
            390,
            844
          ],
          [
            560,
            780
          ],
          [
            561,
            780
          ],
          [
            700,
            780
          ],
          [
            701,
            780
          ],
          [
            900,
            780
          ],
          [
            901,
            780
          ],
          [
            1240,
            780
          ],
          [
            1241,
            780
          ],
          [
            620,
            600
          ]
        ],
        "motion": [
          "no-preference",
          "reduce"
        ],
        "campaignAcceptance": false
      },
      "requiredAssertions": [
        "NATIVE_GRID_HIT_TARGETS",
        "NATIVE_MOVE_AND_UNDO",
        "HOVER_PRESERVES_TACTICAL_STATE"
      ],
      "output": "tmp/demo/2122-grid-bounded",
      "receiptPath": "tmp/demo/2122-grid-bounded/qa-job.json",
      "provenance": {
        "gitHead": "5455d067e45e8120c318453268ebc51143a46ad0",
        "sourceTree": "28f58798b141ef632c6f8c85597c8cc36f6a8a40",
        "sourceDiffSha256": "d67e945d7e17bd71eb962c19db31ac393bc46db22cb1adeef615a007f39ec197",
        "driver": {
          "path": "tools/combat-grid-hit-production-qa.mjs",
          "sha256": "483dd77aa3212545ebf961a9242e31cad9993eaed256c810a6d27e1d9903fb4d"
        },
        "inputs": [],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-C-5wtmFI.css",
            "sha256": "ff5ff7792ba271760979fa24e4ccd3f37d3f475d52ef1d33fa32251ddd934ec0"
          },
          {
            "path": "dist/assets/combat-CPQk2mRq.js",
            "sha256": "efdb2aede6bc709a6fb8f3f30ce516df93d4a00dae15c58f9bb2c21d2f131539"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "NOT_ACCEPTED",
      "startedAt": "2026-10-02T21:40:26.971Z",
      "endedAt": null,
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": false,
      "eligibleForReview": false,
      "ownerInterruption": "tmp/demo/2122-grid-bounded/owner-interruption.json"
    },
    {
      "schemaVersion": 1,
      "jobId": "2122-grid-sampled",
      "runId": "rpgthreejs-auto-dev-90m-20261002T2122",
      "status": "ABORTED_SOURCE_CORRECTION",
      "registeredAt": "2026-10-02T21:47:08.793Z",
      "pid": 46904,
      "port": 5264,
      "command": [
        "node",
        "tools/combat-grid-hit-production-qa.mjs"
      ],
      "parameters": {
        "viewports": [
          [
            1366,
            768
          ],
          [
            620,
            780
          ],
          [
            390,
            844
          ],
          [
            560,
            780
          ],
          [
            561,
            780
          ],
          [
            700,
            780
          ],
          [
            701,
            780
          ],
          [
            1240,
            780
          ],
          [
            1241,
            780
          ],
          [
            620,
            600
          ]
        ],
        "motion": [
          "no-preference",
          "reduce"
        ],
        "boundaryMotion": "no-preference",
        "campaignAcceptance": false
      },
      "requiredAssertions": [
        "NATIVE_GRID_HIT_TARGETS",
        "NATIVE_MOVE_AND_UNDO",
        "HOVER_PRESERVES_TACTICAL_STATE"
      ],
      "output": "tmp/demo/2122-grid-sampled",
      "receiptPath": "tmp/demo/2122-grid-sampled/qa-job.json",
      "provenance": {
        "gitHead": "5455d067e45e8120c318453268ebc51143a46ad0",
        "sourceTree": "28f58798b141ef632c6f8c85597c8cc36f6a8a40",
        "sourceDiffSha256": "d67e945d7e17bd71eb962c19db31ac393bc46db22cb1adeef615a007f39ec197",
        "driver": {
          "path": "tools/combat-grid-hit-production-qa.mjs",
          "sha256": "fb0380a7ae44e87b449799a652a02a6c9f1c05bce34e694d3ff280a13c8985b0"
        },
        "inputs": [],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-C-5wtmFI.css",
            "sha256": "ff5ff7792ba271760979fa24e4ccd3f37d3f475d52ef1d33fa32251ddd934ec0"
          },
          {
            "path": "dist/assets/combat-CPQk2mRq.js",
            "sha256": "efdb2aede6bc709a6fb8f3f30ce516df93d4a00dae15c58f9bb2c21d2f131539"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "NOT_ACCEPTED",
      "startedAt": "2026-10-02T21:47:10.622Z",
      "endedAt": null,
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": false,
      "eligibleForReview": false,
      "ownerInterruption": "tmp/demo/2122-grid-sampled/owner-interruption.json"
    },
    {
      "schemaVersion": 1,
      "jobId": "2122-grid-fixed",
      "runId": "rpgthreejs-auto-dev-90m-20261002T2122",
      "status": "ABORTED_SOURCE_CORRECTION",
      "registeredAt": "2026-10-02T21:57:42.013Z",
      "pid": 19668,
      "port": 5264,
      "command": [
        "node",
        "tools/combat-grid-hit-production-qa.mjs"
      ],
      "parameters": {
        "viewports": [
          [
            620,
            780
          ],
          [
            1366,
            768
          ],
          [
            390,
            844
          ],
          [
            560,
            780
          ],
          [
            561,
            780
          ],
          [
            700,
            780
          ],
          [
            701,
            780
          ],
          [
            1240,
            780
          ],
          [
            1241,
            780
          ],
          [
            620,
            600
          ]
        ],
        "motion": [
          "no-preference",
          "reduce"
        ],
        "boundaryMotion": "no-preference",
        "campaignAcceptance": false
      },
      "requiredAssertions": [
        "NATIVE_GRID_HIT_TARGETS",
        "NATIVE_MOVE_AND_UNDO",
        "HOVER_PRESERVES_TACTICAL_STATE"
      ],
      "output": "tmp/demo/2122-grid-fixed",
      "receiptPath": "tmp/demo/2122-grid-fixed/qa-job.json",
      "provenance": {
        "gitHead": "5455d067e45e8120c318453268ebc51143a46ad0",
        "sourceTree": "28f58798b141ef632c6f8c85597c8cc36f6a8a40",
        "sourceDiffSha256": "b9041380fd67cc7b8fdda96f25df2f09b237b0b06dde2f5f9fd810062c080014",
        "driver": {
          "path": "tools/combat-grid-hit-production-qa.mjs",
          "sha256": "276c91cf7da11d89b582c3315dfb54c39232821b9550824f91b80b6814d60b8d"
        },
        "inputs": [],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-Bxgecf57.js",
            "sha256": "efdb2aede6bc709a6fb8f3f30ce516df93d4a00dae15c58f9bb2c21d2f131539"
          },
          {
            "path": "dist/assets/combat-CVSHPmTa.css",
            "sha256": "9af7a139b176c9980188c4d01d126241144d0b6d5327bf1e202591302cf243b7"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "NOT_ACCEPTED",
      "startedAt": "2026-10-02T21:57:42.75Z",
      "endedAt": null,
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": false,
      "eligibleForReview": false,
      "ownerInterruption": "tmp/demo/2122-grid-fixed/owner-interruption.json"
    },
    {
      "schemaVersion": 1,
      "jobId": "2122-intermediate-fixed",
      "runId": "rpgthreejs-auto-dev-90m-20261002T2122",
      "status": "ABORTED_SOURCE_CORRECTION",
      "registeredAt": "2026-10-02T21:59:10.912Z",
      "pid": 58780,
      "port": 5266,
      "command": [
        "node",
        "tools/demo-continuous-production-qa.mjs"
      ],
      "parameters": {
        "target": "defeat-recovery",
        "routePlan": "rescue",
        "timeoutMinutes": 25,
        "finalePlan": "serpent",
        "defeatNodeId": "lion-village-choice",
        "nativeDefeatWait": true,
        "viewport": [
          620,
          780
        ],
        "osReducedMotion": false,
        "earnedSavePath": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
        "priorProofPath": "tmp/demo/continuous-1153-fresh-final/results.json",
        "verifySalvation": false
      },
      "requiredAssertions": [
        "EXACT_V6_CHECKPOINT_RECOVERY",
        "VISIBLE_T1_DEPARTURE",
        "EXACT_RELOAD"
      ],
      "output": "tmp/demo/2122-intermediate-fixed",
      "receiptPath": "tmp/demo/2122-intermediate-fixed/qa-job.json",
      "provenance": {
        "gitHead": "5455d067e45e8120c318453268ebc51143a46ad0",
        "sourceTree": "28f58798b141ef632c6f8c85597c8cc36f6a8a40",
        "sourceDiffSha256": "b9041380fd67cc7b8fdda96f25df2f09b237b0b06dde2f5f9fd810062c080014",
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": "b2e7fced636db5aee7da3552e0b2c0590c289dcc7b2a2018a021290a80f967dd"
        },
        "inputs": [
          {
            "role": "earnedSavePath",
            "path": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
            "sha256": "d8b0deb62c66fc2fd3d01ec8c513fafb697021e8f9c808869277b90a250e8267"
          },
          {
            "role": "priorProofPath",
            "path": "tmp/demo/continuous-1153-fresh-final/results.json",
            "sha256": "896b9a96a534428b85d6c4f4b17b4402e085334b077d2b22875f884661f5d265"
          }
        ],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-Bxgecf57.js",
            "sha256": "efdb2aede6bc709a6fb8f3f30ce516df93d4a00dae15c58f9bb2c21d2f131539"
          },
          {
            "path": "dist/assets/combat-CVSHPmTa.css",
            "sha256": "9af7a139b176c9980188c4d01d126241144d0b6d5327bf1e202591302cf243b7"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "NOT_ACCEPTED",
      "startedAt": "2026-10-02T21:59:11.947Z",
      "endedAt": null,
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": false,
      "eligibleForReview": false,
      "ownerInterruption": "tmp/demo/2122-intermediate-fixed/owner-interruption.json"
    },
    {
      "schemaVersion": 1,
      "jobId": "2122-trial-conserve",
      "runId": "rpgthreejs-auto-dev-90m-20261002T2122",
      "status": "ABORTED_SOURCE_CORRECTION",
      "registeredAt": "2026-10-02T21:59:25.788Z",
      "pid": 4192,
      "port": 5265,
      "command": [
        "node",
        "tools/demo-continuous-production-qa.mjs"
      ],
      "parameters": {
        "target": "ending",
        "routePlan": "rescue",
        "timeoutMinutes": 30,
        "finalePlan": "trial",
        "defeatNodeId": "lion-village-choice",
        "nativeDefeatWait": false,
        "viewport": [
          1366,
          768
        ],
        "osReducedMotion": false,
        "earnedSavePath": "tmp/demo/continuous-1323-salvation-baseline/earned-lion-second-refuge-v6.json",
        "priorProofPath": "tmp/demo/continuous-1323-salvation-baseline/results.json",
        "verifySalvation": false
      },
      "requiredAssertions": [
        "EARNED_LINEAGE",
        "NATIVE_INPUTS",
        "EXACT_RELOAD"
      ],
      "output": "tmp/demo/2122-trial-conserve",
      "receiptPath": "tmp/demo/2122-trial-conserve/qa-job.json",
      "provenance": {
        "gitHead": "5455d067e45e8120c318453268ebc51143a46ad0",
        "sourceTree": "28f58798b141ef632c6f8c85597c8cc36f6a8a40",
        "sourceDiffSha256": "b9041380fd67cc7b8fdda96f25df2f09b237b0b06dde2f5f9fd810062c080014",
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": "b2e7fced636db5aee7da3552e0b2c0590c289dcc7b2a2018a021290a80f967dd"
        },
        "inputs": [
          {
            "role": "earnedSavePath",
            "path": "tmp/demo/continuous-1323-salvation-baseline/earned-lion-second-refuge-v6.json",
            "sha256": "224d1796a1a0b92f98dcce27ba0652eb98fa7471b2c84653321c7470c0c83d50"
          },
          {
            "role": "priorProofPath",
            "path": "tmp/demo/continuous-1323-salvation-baseline/results.json",
            "sha256": "1399e4268dff72b77519fd3e874c7542bcd4a2fc207003b1494e32d2500c5e2a"
          }
        ],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-Bxgecf57.js",
            "sha256": "efdb2aede6bc709a6fb8f3f30ce516df93d4a00dae15c58f9bb2c21d2f131539"
          },
          {
            "path": "dist/assets/combat-CVSHPmTa.css",
            "sha256": "9af7a139b176c9980188c4d01d126241144d0b6d5327bf1e202591302cf243b7"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "NOT_ACCEPTED",
      "startedAt": "2026-10-02T21:59:26.927Z",
      "endedAt": null,
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": false,
      "eligibleForReview": false,
      "ownerInterruption": "tmp/demo/2122-trial-conserve/owner-interruption.json"
    },
    {
      "schemaVersion": 1,
      "jobId": "2122-card-scroll",
      "runId": "rpgthreejs-auto-dev-90m-20261002T2122",
      "status": "FAILED",
      "registeredAt": "2026-10-02T22:03:44.227Z",
      "pid": 8784,
      "port": 5267,
      "command": [
        "node",
        "tools/combat-card-scroll-production-qa.mjs"
      ],
      "parameters": {
        "cases": [
          [
            390,
            844,
            "no-preference"
          ],
          [
            390,
            844,
            "reduce"
          ],
          [
            390,
            600,
            "no-preference"
          ],
          [
            560,
            780,
            "no-preference"
          ]
        ],
        "campaignAcceptance": false
      },
      "requiredAssertions": [
        "NATIVE_CARD_SCROLL",
        "FOCUSED_TOGGLE_VISIBLE",
        "CARD_PREVIEW_PRESERVES_TACTICAL_TRUTH"
      ],
      "output": "tmp/demo/2122-card-scroll",
      "receiptPath": "tmp/demo/2122-card-scroll/qa-job.json",
      "provenance": {
        "gitHead": "5455d067e45e8120c318453268ebc51143a46ad0",
        "sourceTree": "28f58798b141ef632c6f8c85597c8cc36f6a8a40",
        "sourceDiffSha256": "b9041380fd67cc7b8fdda96f25df2f09b237b0b06dde2f5f9fd810062c080014",
        "driver": {
          "path": "tools/combat-card-scroll-production-qa.mjs",
          "sha256": "6bad64468d30a895e821a03fbef270757e513d60c7d6bd87b0e715a9876c6381"
        },
        "inputs": [],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-Bxgecf57.js",
            "sha256": "efdb2aede6bc709a6fb8f3f30ce516df93d4a00dae15c58f9bb2c21d2f131539"
          },
          {
            "path": "dist/assets/combat-CVSHPmTa.css",
            "sha256": "9af7a139b176c9980188c4d01d126241144d0b6d5327bf1e202591302cf243b7"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "NOT_ACCEPTED",
      "startedAt": "2026-10-02T22:03:48.383Z",
      "endedAt": "2026-10-02T22:04:07.882Z",
      "exitCode": 1,
      "resultPath": "tmp/demo/2122-card-scroll/results.json",
      "resultSha256": "e4f678dc843340358c7ef231dccdfcc03323e70849ccdcbd97f5a86659a95a83",
      "provenanceMatches": true,
      "provenanceStable": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": true,
      "eligibleForReview": false
    },
    {
      "schemaVersion": 1,
      "jobId": "2122-grid-final-wheel",
      "runId": "rpgthreejs-auto-dev-90m-20261002T2122",
      "status": "SUCCEEDED",
      "registeredAt": "2026-10-02T22:13:36.86Z",
      "pid": 22272,
      "port": 5264,
      "command": [
        "node",
        "tools/combat-grid-hit-production-qa.mjs"
      ],
      "parameters": {
        "viewports": [
          [
            620,
            780
          ],
          [
            1366,
            768
          ],
          [
            390,
            844
          ],
          [
            560,
            780
          ],
          [
            561,
            780
          ],
          [
            700,
            780
          ],
          [
            701,
            780
          ],
          [
            1240,
            780
          ],
          [
            1241,
            780
          ],
          [
            620,
            600
          ]
        ],
        "motion": [
          "no-preference",
          "reduce"
        ],
        "boundaryMotion": "no-preference",
        "campaignAcceptance": false
      },
      "requiredAssertions": [
        "NATIVE_GRID_HIT_TARGETS",
        "NATIVE_MOVE_AND_UNDO",
        "HOVER_PRESERVES_TACTICAL_STATE"
      ],
      "output": "tmp/demo/2122-grid-final-wheel",
      "receiptPath": "tmp/demo/2122-grid-final-wheel/qa-job.json",
      "provenance": {
        "gitHead": "5455d067e45e8120c318453268ebc51143a46ad0",
        "sourceTree": "28f58798b141ef632c6f8c85597c8cc36f6a8a40",
        "sourceDiffSha256": "c034b0ba98a42708891ba0cf0fa1fd92875e6b9df034baa1573d13de20133017",
        "driver": {
          "path": "tools/combat-grid-hit-production-qa.mjs",
          "sha256": "276c91cf7da11d89b582c3315dfb54c39232821b9550824f91b80b6814d60b8d"
        },
        "inputs": [],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-BS3C8hF9.js",
            "sha256": "cf1398a5a6f34078de1fa98b77f554c3a3241df45ac1c4e641d814522b1e6ff4"
          },
          {
            "path": "dist/assets/combat-CVSHPmTa.css",
            "sha256": "9af7a139b176c9980188c4d01d126241144d0b6d5327bf1e202591302cf243b7"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "ACCEPTED_SCOPED",
      "startedAt": "2026-10-02T22:13:42.318Z",
      "endedAt": "2026-10-02T22:31:47.778Z",
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": true,
      "resultDigestMatches": true,
      "eligibleForReview": true,
      "exitCode": 0,
      "resultPath": "tmp/demo/2122-grid-final-wheel/results.json",
      "resultSha256": "4e95082353997a37f7d8cb2bbdf7bd1c9f9b74df193d72dd647f2ad17e8dd0b4",
      "provenanceStable": true,
      "eligibleForReviewAtReview": true,
      "acceptedScope": "Standalone native32cell center raycasts,DOM margins,move/Undo/attack;13cases; campaignAcceptance=false",
      "contractsReview": "Scoped source/proof independently reviewed",
      "provenanceRepresentation": "Reviewed precommit sourceTree/diff; verify unchanged code blobs at implementation commit",
      "processConfirmedStopped": true,
      "acceptanceLinkedImplementationCommit": "790dc26ad18bf1f6def706f91543298515a33d85",
      "reviewedPayloadMatchesCommittedBlobs": true
    },
    {
      "schemaVersion": 1,
      "jobId": "2122-card-final-wheel",
      "runId": "rpgthreejs-auto-dev-90m-20261002T2122",
      "status": "SUCCEEDED",
      "registeredAt": "2026-10-02T22:13:36.986Z",
      "pid": 31540,
      "port": 5267,
      "command": [
        "node",
        "tools/combat-card-scroll-production-qa.mjs"
      ],
      "parameters": {
        "cases": [
          [
            390,
            844,
            "no-preference"
          ],
          [
            390,
            844,
            "reduce"
          ],
          [
            390,
            600,
            "no-preference"
          ],
          [
            560,
            780,
            "no-preference"
          ]
        ],
        "campaignAcceptance": false
      },
      "requiredAssertions": [
        "NATIVE_CARD_SCROLL",
        "FOCUSED_TOGGLE_VISIBLE",
        "CARD_PREVIEW_PRESERVES_TACTICAL_TRUTH"
      ],
      "output": "tmp/demo/2122-card-final-wheel",
      "receiptPath": "tmp/demo/2122-card-final-wheel/qa-job.json",
      "provenance": {
        "gitHead": "5455d067e45e8120c318453268ebc51143a46ad0",
        "sourceTree": "28f58798b141ef632c6f8c85597c8cc36f6a8a40",
        "sourceDiffSha256": "c034b0ba98a42708891ba0cf0fa1fd92875e6b9df034baa1573d13de20133017",
        "driver": {
          "path": "tools/combat-card-scroll-production-qa.mjs",
          "sha256": "6bad64468d30a895e821a03fbef270757e513d60c7d6bd87b0e715a9876c6381"
        },
        "inputs": [],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-BS3C8hF9.js",
            "sha256": "cf1398a5a6f34078de1fa98b77f554c3a3241df45ac1c4e641d814522b1e6ff4"
          },
          {
            "path": "dist/assets/combat-CVSHPmTa.css",
            "sha256": "9af7a139b176c9980188c4d01d126241144d0b6d5327bf1e202591302cf243b7"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "ACCEPTED_SCOPED",
      "startedAt": "2026-10-02T22:13:56.941Z",
      "endedAt": "2026-10-02T22:14:33.067Z",
      "exitCode": 0,
      "resultPath": "tmp/demo/2122-card-final-wheel/results.json",
      "resultSha256": "3c3ce6a3584da74fed9a240e77101feec4b9f6ffd69c3dbecae3045d4aff8326",
      "provenanceMatches": true,
      "provenanceStable": true,
      "requestMatches": true,
      "matchesCurrentExecution": true,
      "resultDigestMatches": true,
      "eligibleForReview": true,
      "eligibleForReviewAtReview": true,
      "acceptedScope": "Native card scroll4cases,refocused toggle visibility;focusRetentionAccepted=false;campaignAcceptance=false",
      "contractsReview": "Scoped source/proof independently reviewed",
      "provenanceRepresentation": "Reviewed precommit sourceTree/diff; verify unchanged code blobs at implementation commit",
      "processConfirmedStopped": true,
      "acceptanceLinkedImplementationCommit": "790dc26ad18bf1f6def706f91543298515a33d85",
      "reviewedPayloadMatchesCommittedBlobs": true
    },
    {
      "schemaVersion": 1,
      "jobId": "2122-intermediate-final-wheel",
      "runId": "rpgthreejs-auto-dev-90m-20261002T2122",
      "status": "FAILED",
      "registeredAt": "2026-10-02T22:14:11.915Z",
      "pid": 5000,
      "port": 5266,
      "command": [
        "node",
        "tools/demo-continuous-production-qa.mjs"
      ],
      "parameters": {
        "target": "defeat-recovery",
        "routePlan": "rescue",
        "timeoutMinutes": 17,
        "finalePlan": "serpent",
        "defeatNodeId": "lion-village-choice",
        "nativeDefeatWait": true,
        "viewport": [
          620,
          780
        ],
        "osReducedMotion": false,
        "earnedSavePath": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
        "priorProofPath": "tmp/demo/continuous-1153-fresh-final/results.json",
        "verifySalvation": false
      },
      "requiredAssertions": [
        "EXACT_V6_CHECKPOINT_RECOVERY",
        "VISIBLE_T1_DEPARTURE",
        "EXACT_RELOAD"
      ],
      "output": "tmp/demo/2122-intermediate-final-wheel",
      "receiptPath": "tmp/demo/2122-intermediate-final-wheel/qa-job.json",
      "provenance": {
        "gitHead": "5455d067e45e8120c318453268ebc51143a46ad0",
        "sourceTree": "28f58798b141ef632c6f8c85597c8cc36f6a8a40",
        "sourceDiffSha256": "c034b0ba98a42708891ba0cf0fa1fd92875e6b9df034baa1573d13de20133017",
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": "b2e7fced636db5aee7da3552e0b2c0590c289dcc7b2a2018a021290a80f967dd"
        },
        "inputs": [
          {
            "role": "earnedSavePath",
            "path": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
            "sha256": "d8b0deb62c66fc2fd3d01ec8c513fafb697021e8f9c808869277b90a250e8267"
          },
          {
            "role": "priorProofPath",
            "path": "tmp/demo/continuous-1153-fresh-final/results.json",
            "sha256": "896b9a96a534428b85d6c4f4b17b4402e085334b077d2b22875f884661f5d265"
          }
        ],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-BS3C8hF9.js",
            "sha256": "cf1398a5a6f34078de1fa98b77f554c3a3241df45ac1c4e641d814522b1e6ff4"
          },
          {
            "path": "dist/assets/combat-CVSHPmTa.css",
            "sha256": "9af7a139b176c9980188c4d01d126241144d0b6d5327bf1e202591302cf243b7"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "NOT_ACCEPTED",
      "startedAt": "2026-10-02T22:14:14.146Z",
      "endedAt": "2026-10-02T22:31:30.216Z",
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": true,
      "resultDigestMatches": true,
      "eligibleForReview": false,
      "exitCode": 1,
      "resultPath": "tmp/demo/2122-intermediate-final-wheel/results.json",
      "resultSha256": "1fbfa5a9e677936f6f3140a3792bc8ba4b49bf91cf9d6933a940c2680c7c994e",
      "provenanceStable": true,
      "eligibleForReviewAtReview": false,
      "processConfirmedStopped": true
    },
    {
      "schemaVersion": 1,
      "jobId": "2122-trial-final-wheel",
      "runId": "rpgthreejs-auto-dev-90m-20261002T2122",
      "status": "FAILED",
      "registeredAt": "2026-10-02T22:14:27.679Z",
      "pid": 25888,
      "port": 5265,
      "command": [
        "node",
        "tools/demo-continuous-production-qa.mjs"
      ],
      "parameters": {
        "target": "ending",
        "routePlan": "rescue",
        "timeoutMinutes": 17,
        "finalePlan": "trial",
        "defeatNodeId": "lion-village-choice",
        "nativeDefeatWait": false,
        "viewport": [
          1366,
          768
        ],
        "osReducedMotion": false,
        "earnedSavePath": "tmp/demo/continuous-1323-salvation-baseline/earned-lion-second-refuge-v6.json",
        "priorProofPath": "tmp/demo/continuous-1323-salvation-baseline/results.json",
        "verifySalvation": false
      },
      "requiredAssertions": [
        "EARNED_LINEAGE",
        "NATIVE_INPUTS",
        "EXACT_RELOAD"
      ],
      "output": "tmp/demo/2122-trial-final-wheel",
      "receiptPath": "tmp/demo/2122-trial-final-wheel/qa-job.json",
      "provenance": {
        "gitHead": "5455d067e45e8120c318453268ebc51143a46ad0",
        "sourceTree": "28f58798b141ef632c6f8c85597c8cc36f6a8a40",
        "sourceDiffSha256": "c034b0ba98a42708891ba0cf0fa1fd92875e6b9df034baa1573d13de20133017",
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": "b2e7fced636db5aee7da3552e0b2c0590c289dcc7b2a2018a021290a80f967dd"
        },
        "inputs": [
          {
            "role": "earnedSavePath",
            "path": "tmp/demo/continuous-1323-salvation-baseline/earned-lion-second-refuge-v6.json",
            "sha256": "224d1796a1a0b92f98dcce27ba0652eb98fa7471b2c84653321c7470c0c83d50"
          },
          {
            "role": "priorProofPath",
            "path": "tmp/demo/continuous-1323-salvation-baseline/results.json",
            "sha256": "1399e4268dff72b77519fd3e874c7542bcd4a2fc207003b1494e32d2500c5e2a"
          }
        ],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-BS3C8hF9.js",
            "sha256": "cf1398a5a6f34078de1fa98b77f554c3a3241df45ac1c4e641d814522b1e6ff4"
          },
          {
            "path": "dist/assets/combat-CVSHPmTa.css",
            "sha256": "9af7a139b176c9980188c4d01d126241144d0b6d5327bf1e202591302cf243b7"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "NOT_ACCEPTED",
      "startedAt": "2026-10-02T22:14:30.052Z",
      "endedAt": "2026-10-02T22:31:54.521Z",
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": true,
      "resultDigestMatches": true,
      "eligibleForReview": false,
      "exitCode": 1,
      "resultPath": "tmp/demo/2122-trial-final-wheel/results.json",
      "resultSha256": "bf44045d4bd602f8aa378004d4b29a9dc01507d730beee1d3da7a46a0c748166",
      "provenanceStable": true,
      "eligibleForReviewAtReview": false,
      "processConfirmedStopped": true
    },
    {
      "schemaVersion": 1,
      "jobId": "2252-card-focus",
      "runId": "rpgthreejs-auto-dev-90m-20261002T2252",
      "status": "FAILED",
      "registeredAt": "2026-10-02T22:59:23.759Z",
      "pid": 21708,
      "port": 5268,
      "command": [
        "node",
        "tools/combat-card-scroll-production-qa.mjs"
      ],
      "parameters": {
        "cases": [
          [
            390,
            844,
            "no-preference"
          ],
          [
            390,
            844,
            "reduce"
          ],
          [
            390,
            600,
            "no-preference"
          ],
          [
            560,
            780,
            "no-preference"
          ],
          [
            620,
            780,
            "no-preference"
          ],
          [
            620,
            780,
            "reduce"
          ],
          [
            1366,
            768,
            "no-preference"
          ],
          [
            1366,
            768,
            "reduce"
          ]
        ],
        "campaignAcceptance": false
      },
      "requiredAssertions": [
        "NATIVE_CARD_SCROLL",
        "NATIVE_TOGGLE_FOCUS_RETENTION",
        "FOCUSED_TOGGLE_VISIBLE",
        "CARD_PREVIEW_PRESERVES_TACTICAL_TRUTH",
        "NATIVE_STATUS_AND_APTITUDE_CONTENT"
      ],
      "output": "tmp/demo/2252-card-focus",
      "receiptPath": "tmp/demo/2252-card-focus/qa-job.json",
      "provenance": {
        "gitHead": "122ffe6feffd3d6ae4df678bbd13e6421596e4ea",
        "sourceTree": "87d808e01f7834248e795bbc5276d5eb7389121b",
        "sourceDiffSha256": "3487bf9cdd153d2066b6325ddd0d65fb44cfda1c53ebbb37de34d3ee6b99b514",
        "driver": {
          "path": "tools/combat-card-scroll-production-qa.mjs",
          "sha256": "5d56e051332d2d7fc65dccf16f0c9a104999cfe0297c23098548282904febe59"
        },
        "inputs": [],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-CRVF3Hlw.js",
            "sha256": "5d4855b52058f35243501afbe6c6c6c8b00b8629a841d5f451e40e43f1369de3"
          },
          {
            "path": "dist/assets/combat-CVSHPmTa.css",
            "sha256": "9af7a139b176c9980188c4d01d126241144d0b6d5327bf1e202591302cf243b7"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "NOT_ACCEPTED",
      "startedAt": "2026-10-02T22:59:24.419Z",
      "endedAt": "2026-10-02T22:59:36.646Z",
      "exitCode": 1,
      "resultPath": "tmp/demo/2252-card-focus/results.json",
      "resultSha256": "d3ba6d8ab311e1f0f5e6cf9555b513f5c69cad995569e5f0e2efd9bd98bc4d49",
      "provenanceMatches": true,
      "provenanceStable": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": true,
      "eligibleForReview": false,
      "limitation": "Driver initially expected visible status text; runtime uses accessible icon label. Corrected label assertion in final labels job; no runtime status change.",
      "matchesExecutionAtReview": false,
      "eligibleForReviewAtReview": false,
      "postCommitProvenance": {
        "implementationCommit": "e6f1a03568d14875db7a8c72f8dadc089b021072",
        "representationChanged": true,
        "rawProvenancePreserved": true,
        "note": "Git HEAD/tree/diff representation changed on commit; execution identity and reviewed scope retained. Current relevant code/build bytes verified separately; failed executions remain NOT_ACCEPTED."
      }
    },
    {
      "schemaVersion": 1,
      "jobId": "2252-card-focus-labels",
      "runId": "rpgthreejs-auto-dev-90m-20261002T2252",
      "status": "SUCCEEDED",
      "registeredAt": "2026-10-02T23:01:07.653Z",
      "pid": 29220,
      "port": 5268,
      "command": [
        "node",
        "tools/combat-card-scroll-production-qa.mjs"
      ],
      "parameters": {
        "cases": [
          [
            390,
            844,
            "no-preference"
          ],
          [
            390,
            844,
            "reduce"
          ],
          [
            390,
            600,
            "no-preference"
          ],
          [
            560,
            780,
            "no-preference"
          ],
          [
            620,
            780,
            "no-preference"
          ],
          [
            620,
            780,
            "reduce"
          ],
          [
            1366,
            768,
            "no-preference"
          ],
          [
            1366,
            768,
            "reduce"
          ]
        ],
        "campaignAcceptance": false
      },
      "requiredAssertions": [
        "NATIVE_CARD_SCROLL",
        "NATIVE_TOGGLE_FOCUS_RETENTION",
        "FOCUSED_TOGGLE_VISIBLE",
        "CARD_PREVIEW_PRESERVES_TACTICAL_TRUTH",
        "NATIVE_STATUS_AND_APTITUDE_CONTENT"
      ],
      "output": "tmp/demo/2252-card-focus-labels",
      "receiptPath": "tmp/demo/2252-card-focus-labels/qa-job.json",
      "provenance": {
        "gitHead": "122ffe6feffd3d6ae4df678bbd13e6421596e4ea",
        "sourceTree": "87d808e01f7834248e795bbc5276d5eb7389121b",
        "sourceDiffSha256": "3487bf9cdd153d2066b6325ddd0d65fb44cfda1c53ebbb37de34d3ee6b99b514",
        "driver": {
          "path": "tools/combat-card-scroll-production-qa.mjs",
          "sha256": "6befdf9d5054c8532b6d9ce50b8cfad390b767d7942cd22d4aef529fb3328bc4"
        },
        "inputs": [],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-CRVF3Hlw.js",
            "sha256": "5d4855b52058f35243501afbe6c6c6c8b00b8629a841d5f451e40e43f1369de3"
          },
          {
            "path": "dist/assets/combat-CVSHPmTa.css",
            "sha256": "9af7a139b176c9980188c4d01d126241144d0b6d5327bf1e202591302cf243b7"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "ACCEPTED_SCOPED",
      "startedAt": "2026-10-02T23:01:08.332Z",
      "endedAt": "2026-10-02T23:04:09.345Z",
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": true,
      "eligibleForReview": false,
      "exitCode": 0,
      "resultPath": "tmp/demo/2252-card-focus-labels/results.json",
      "resultSha256": "53483b0d5b65cd27d4a4f3fdb58cee8cf894e1dca124bce1660ce5f4cf45a940",
      "provenanceStable": true,
      "reviewedAt": "2026-10-02T23:41:21.719Z",
      "scope": "Native stats focus retention, scrolling, exhausted indicator and innate aptitude in standalone production; no full campaign/grid keyboard claim",
      "matchesExecutionAtReview": true,
      "eligibleForReviewAtReview": true,
      "postCommitProvenance": {
        "implementationCommit": "e6f1a03568d14875db7a8c72f8dadc089b021072",
        "representationChanged": true,
        "rawProvenancePreserved": true,
        "note": "Git HEAD/tree/diff representation changed on commit; execution identity and reviewed scope retained. Current relevant code/build bytes verified separately; failed executions remain NOT_ACCEPTED."
      }
    },
    {
      "schemaVersion": 1,
      "jobId": "2252-recovery-620",
      "runId": "rpgthreejs-auto-dev-90m-20261002T2252",
      "status": "FAILED",
      "registeredAt": "2026-10-02T23:01:39.09Z",
      "pid": 11700,
      "port": 5269,
      "command": [
        "node",
        "tools/demo-continuous-production-qa.mjs"
      ],
      "parameters": {
        "target": "defeat-recovery",
        "routePlan": "rescue",
        "timeoutMinutes": 25,
        "finalePlan": "serpent",
        "defeatNodeId": "lion-village-choice",
        "nativeDefeatWait": true,
        "viewport": [
          620,
          780
        ],
        "osReducedMotion": false,
        "earnedSavePath": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
        "priorProofPath": "tmp/demo/continuous-1153-fresh-final/results.json",
        "verifySalvation": false
      },
      "requiredAssertions": [
        "EXACT_V6_CHECKPOINT_RECOVERY",
        "VISIBLE_T1_DEPARTURE",
        "EXACT_RELOAD"
      ],
      "output": "tmp/demo/2252-recovery-620",
      "receiptPath": "tmp/demo/2252-recovery-620/qa-job.json",
      "provenance": {
        "gitHead": "122ffe6feffd3d6ae4df678bbd13e6421596e4ea",
        "sourceTree": "87d808e01f7834248e795bbc5276d5eb7389121b",
        "sourceDiffSha256": "3487bf9cdd153d2066b6325ddd0d65fb44cfda1c53ebbb37de34d3ee6b99b514",
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": "97ffed606c26ee8d3d2ec3a3cee4fa8b4559e62d8e50ecffc3cc137521f90128"
        },
        "inputs": [
          {
            "role": "earnedSavePath",
            "path": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
            "sha256": "d8b0deb62c66fc2fd3d01ec8c513fafb697021e8f9c808869277b90a250e8267"
          },
          {
            "role": "priorProofPath",
            "path": "tmp/demo/continuous-1153-fresh-final/results.json",
            "sha256": "896b9a96a534428b85d6c4f4b17b4402e085334b077d2b22875f884661f5d265"
          }
        ],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-CRVF3Hlw.js",
            "sha256": "5d4855b52058f35243501afbe6c6c6c8b00b8629a841d5f451e40e43f1369de3"
          },
          {
            "path": "dist/assets/combat-CVSHPmTa.css",
            "sha256": "9af7a139b176c9980188c4d01d126241144d0b6d5327bf1e202591302cf243b7"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "NOT_ACCEPTED",
      "startedAt": "2026-10-02T23:01:40.22Z",
      "endedAt": "2026-10-02T23:09:17.242Z",
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": true,
      "eligibleForReview": false,
      "exitCode": 1,
      "resultPath": "tmp/demo/2252-recovery-620/results.json",
      "resultSha256": "5c13f91ee6d369e6354c0eed09601dd4429113c1a336efdceba89e3a701b96f7",
      "provenanceStable": true,
      "limitation": "Actual native marsh defeat after50actions (14attack,11move,4potion,1revive,20wait); remaining foes40and1HP. Requested village recovery boundary never reached. Not evidence of recovery or balance/deadlock.",
      "matchesExecutionAtReview": false,
      "eligibleForReviewAtReview": false,
      "postCommitProvenance": {
        "implementationCommit": "e6f1a03568d14875db7a8c72f8dadc089b021072",
        "representationChanged": true,
        "rawProvenancePreserved": true,
        "note": "Git HEAD/tree/diff representation changed on commit; execution identity and reviewed scope retained. Current relevant code/build bytes verified separately; failed executions remain NOT_ACCEPTED."
      }
    },
    {
      "schemaVersion": 1,
      "jobId": "2252-trial-native-skills",
      "runId": "rpgthreejs-auto-dev-90m-20261002T2252",
      "status": "ABORTED_PILOT_POLICY_DEFECT",
      "registeredAt": "2026-10-02T23:10:28.062Z",
      "pid": 25540,
      "port": 5270,
      "command": [
        "node",
        "tools/demo-continuous-production-qa.mjs"
      ],
      "parameters": {
        "target": "ending",
        "routePlan": "rescue",
        "timeoutMinutes": 35,
        "finalePlan": "trial",
        "defeatNodeId": "lion-village-choice",
        "nativeDefeatWait": false,
        "viewport": [
          1366,
          768
        ],
        "osReducedMotion": false,
        "earnedSavePath": "tmp/demo/continuous-1323-salvation-baseline/earned-lion-second-refuge-v6.json",
        "priorProofPath": "tmp/demo/continuous-1323-salvation-baseline/results.json",
        "verifySalvation": false
      },
      "requiredAssertions": [
        "EARNED_LINEAGE",
        "NATIVE_INPUTS",
        "EXACT_RELOAD"
      ],
      "output": "tmp/demo/2252-trial-native-skills",
      "receiptPath": "tmp/demo/2252-trial-native-skills/qa-job.json",
      "provenance": {
        "gitHead": "122ffe6feffd3d6ae4df678bbd13e6421596e4ea",
        "sourceTree": "87d808e01f7834248e795bbc5276d5eb7389121b",
        "sourceDiffSha256": "3487bf9cdd153d2066b6325ddd0d65fb44cfda1c53ebbb37de34d3ee6b99b514",
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": "97ffed606c26ee8d3d2ec3a3cee4fa8b4559e62d8e50ecffc3cc137521f90128"
        },
        "inputs": [
          {
            "role": "earnedSavePath",
            "path": "tmp/demo/continuous-1323-salvation-baseline/earned-lion-second-refuge-v6.json",
            "sha256": "224d1796a1a0b92f98dcce27ba0652eb98fa7471b2c84653321c7470c0c83d50"
          },
          {
            "role": "priorProofPath",
            "path": "tmp/demo/continuous-1323-salvation-baseline/results.json",
            "sha256": "1399e4268dff72b77519fd3e874c7542bcd4a2fc207003b1494e32d2500c5e2a"
          }
        ],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-CRVF3Hlw.js",
            "sha256": "5d4855b52058f35243501afbe6c6c6c8b00b8629a841d5f451e40e43f1369de3"
          },
          {
            "path": "dist/assets/combat-CVSHPmTa.css",
            "sha256": "9af7a139b176c9980188c4d01d126241144d0b6d5327bf1e202591302cf243b7"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "NOT_ACCEPTED",
      "startedAt": "2026-10-02T23:10:28.789Z",
      "endedAt": null,
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": false,
      "eligibleForReview": false,
      "workerReceiptStatus": "RUNNING",
      "ownerDisposition": "tmp/demo/2252-trial-native-skills/owner-interruption.json",
      "processConfirmedStopped": true,
      "matchesExecutionAtReview": false,
      "eligibleForReviewAtReview": false,
      "postCommitProvenance": {
        "implementationCommit": "e6f1a03568d14875db7a8c72f8dadc089b021072",
        "representationChanged": true,
        "rawProvenancePreserved": true,
        "note": "Git HEAD/tree/diff representation changed on commit; execution identity and reviewed scope retained. Current relevant code/build bytes verified separately; failed executions remain NOT_ACCEPTED."
      }
    },
    {
      "schemaVersion": 1,
      "jobId": "2252-trial-unlocked",
      "runId": "rpgthreejs-auto-dev-90m-20261002T2252",
      "status": "FAILED",
      "registeredAt": "2026-10-02T23:19:28.025Z",
      "pid": 54872,
      "port": 5270,
      "command": [
        "node",
        "tools/demo-continuous-production-qa.mjs"
      ],
      "parameters": {
        "target": "ending",
        "routePlan": "rescue",
        "timeoutMinutes": 35,
        "finalePlan": "trial",
        "defeatNodeId": "lion-village-choice",
        "nativeDefeatWait": false,
        "viewport": [
          1366,
          768
        ],
        "osReducedMotion": false,
        "earnedSavePath": "tmp/demo/continuous-1323-salvation-baseline/earned-lion-second-refuge-v6.json",
        "priorProofPath": "tmp/demo/continuous-1323-salvation-baseline/results.json",
        "verifySalvation": false
      },
      "requiredAssertions": [
        "EARNED_LINEAGE",
        "NATIVE_INPUTS",
        "EXACT_RELOAD"
      ],
      "output": "tmp/demo/2252-trial-unlocked",
      "receiptPath": "tmp/demo/2252-trial-unlocked/qa-job.json",
      "provenance": {
        "gitHead": "122ffe6feffd3d6ae4df678bbd13e6421596e4ea",
        "sourceTree": "87d808e01f7834248e795bbc5276d5eb7389121b",
        "sourceDiffSha256": "3487bf9cdd153d2066b6325ddd0d65fb44cfda1c53ebbb37de34d3ee6b99b514",
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": "9448069f6a3ec6282c50eef4cdce8c283ae362db6156bf2ad1ceed1381dea541"
        },
        "inputs": [
          {
            "role": "earnedSavePath",
            "path": "tmp/demo/continuous-1323-salvation-baseline/earned-lion-second-refuge-v6.json",
            "sha256": "224d1796a1a0b92f98dcce27ba0652eb98fa7471b2c84653321c7470c0c83d50"
          },
          {
            "role": "priorProofPath",
            "path": "tmp/demo/continuous-1323-salvation-baseline/results.json",
            "sha256": "1399e4268dff72b77519fd3e874c7542bcd4a2fc207003b1494e32d2500c5e2a"
          }
        ],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-CRVF3Hlw.js",
            "sha256": "5d4855b52058f35243501afbe6c6c6c8b00b8629a841d5f451e40e43f1369de3"
          },
          {
            "path": "dist/assets/combat-CVSHPmTa.css",
            "sha256": "9af7a139b176c9980188c4d01d126241144d0b6d5327bf1e202591302cf243b7"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "NOT_ACCEPTED",
      "startedAt": "2026-10-02T23:19:28.794Z",
      "endedAt": "2026-10-02T23:36:50.209Z",
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": true,
      "eligibleForReview": false,
      "exitCode": 1,
      "resultPath": "tmp/demo/2252-trial-unlocked/results.json",
      "resultSha256": "809adaecba576ac2a86fb3e8c37ff62dcd73359961178fdd4bc093035339f555",
      "provenanceStable": true,
      "matchesExecutionAtReview": true,
      "eligibleForReviewAtReview": false,
      "postCommitProvenance": {
        "implementationCommit": "e6f1a03568d14875db7a8c72f8dadc089b021072",
        "representationChanged": true,
        "rawProvenancePreserved": true,
        "note": "Git HEAD/tree/diff representation changed on commit; execution identity and reviewed scope retained. Current relevant code/build bytes verified separately; failed executions remain NOT_ACCEPTED."
      }
    },
    {
      "schemaVersion": 1,
      "jobId": "0228-trial-support",
      "runId": "rpgthreejs-auto-dev-90m-20261003T0228",
      "status": "SUCCEEDED",
      "registeredAt": "2026-10-03T02:35:02.346Z",
      "pid": 35608,
      "port": 5271,
      "command": [
        "node",
        "tools/demo-continuous-production-qa.mjs"
      ],
      "parameters": {
        "target": "ending",
        "routePlan": "rescue",
        "timeoutMinutes": 35,
        "finalePlan": "trial",
        "defeatNodeId": "lion-village-choice",
        "nativeDefeatWait": false,
        "viewport": [
          1366,
          768
        ],
        "osReducedMotion": false,
        "earnedSavePath": "tmp/demo/continuous-1323-salvation-baseline/earned-lion-second-refuge-v6.json",
        "priorProofPath": "tmp/demo/continuous-1323-salvation-baseline/results.json",
        "verifySalvation": true
      },
      "requiredAssertions": [
        "EARNED_LINEAGE",
        "NATIVE_INPUTS",
        "EXACT_RELOAD"
      ],
      "output": "tmp/demo/0228-trial-support",
      "receiptPath": "tmp/demo/0228-trial-support/qa-job.json",
      "provenance": {
        "gitHead": "b9aa73e5bbd598e6d79eae89876831d9c84ce7a6",
        "sourceTree": "7f7b49e9c657b24e25c105b96f3b8186ebcbef8b",
        "sourceDiffSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": "acfda8ec859ae62fcc8cd642a208d8e0b92ee7b96a40fd5135b5ca425fa91dae"
        },
        "inputs": [
          {
            "role": "earnedSavePath",
            "path": "tmp/demo/continuous-1323-salvation-baseline/earned-lion-second-refuge-v6.json",
            "sha256": "224d1796a1a0b92f98dcce27ba0652eb98fa7471b2c84653321c7470c0c83d50"
          },
          {
            "role": "priorProofPath",
            "path": "tmp/demo/continuous-1323-salvation-baseline/results.json",
            "sha256": "1399e4268dff72b77519fd3e874c7542bcd4a2fc207003b1494e32d2500c5e2a"
          }
        ],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-CRVF3Hlw.js",
            "sha256": "5d4855b52058f35243501afbe6c6c6c8b00b8629a841d5f451e40e43f1369de3"
          },
          {
            "path": "dist/assets/combat-CVSHPmTa.css",
            "sha256": "9af7a139b176c9980188c4d01d126241144d0b6d5327bf1e202591302cf243b7"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "startedAt": "2026-10-03T02:35:04.309Z",
      "endedAt": "2026-10-03T03:07:05.755Z",
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": false,
      "resultDigestMatches": true,
      "eligibleForReview": false,
      "exitCode": 0,
      "resultPath": "tmp/demo/0228-trial-support/results.json",
      "resultSha256": "51ab857632fa6692bea752b7c5cd7a4b46e0ad3119ce59f86569f5a242d5e1b5",
      "provenanceStable": true,
      "acceptance": "ACCEPTED_SCOPED",
      "ownerReview": {
        "at": "2026-10-03T03:11:10.5631806Z",
        "reviewer": "contracts-guardian",
        "scope": "1366normal second-refuge native Champion victory13casts/trial ending/exactV6reload; mixed-build ancestry retained",
        "driverSha256": "acfda8ec859ae62fcc8cd642a208d8e0b92ee7b96a40fd5135b5ca425fa91dae",
        "driverGitBlob": "cd384cd606fa5e4e91c7cf55eb0cf0a2f18a448c",
        "implementationCommit": "726bb751cf4a90cff088c4fda3af73f8de14702b",
        "exactTwoApStart": "STATIC_ONLY; actual casts start3or5AP"
      },
      "acceptanceAtReview": {
        "provenanceMatches": true,
        "requestMatches": true,
        "matchesCurrentExecution": true,
        "resultDigestMatches": true,
        "eligibleForReview": true
      }
    },
    {
      "schemaVersion": 1,
      "jobId": "0228-recovery-stock",
      "runId": "rpgthreejs-auto-dev-90m-20261003T0228",
      "status": "FAILED",
      "registeredAt": "2026-10-03T03:12:09.818Z",
      "pid": 9992,
      "port": 5272,
      "command": [
        "node",
        "tools/demo-continuous-production-qa.mjs"
      ],
      "parameters": {
        "target": "defeat-recovery",
        "routePlan": "rescue",
        "timeoutMinutes": 25,
        "finalePlan": "serpent",
        "defeatNodeId": "lion-village-choice",
        "nativeDefeatWait": true,
        "viewport": [
          620,
          780
        ],
        "osReducedMotion": false,
        "earnedSavePath": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
        "priorProofPath": "tmp/demo/continuous-1153-fresh-final/results.json",
        "verifySalvation": false
      },
      "requiredAssertions": [
        "EXACT_V6_CHECKPOINT_RECOVERY",
        "VISIBLE_T1_DEPARTURE",
        "EXACT_RELOAD"
      ],
      "output": "tmp/demo/0228-recovery-stock",
      "receiptPath": "tmp/demo/0228-recovery-stock/qa-job.json",
      "provenance": {
        "gitHead": "726bb751cf4a90cff088c4fda3af73f8de14702b",
        "sourceTree": "7f7b49e9c657b24e25c105b96f3b8186ebcbef8b",
        "sourceDiffSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": "ae3d8b7b62cdf05d9f133ffa942f7617929f13cfd34a6892f2cc90d8629ebe50"
        },
        "inputs": [
          {
            "role": "earnedSavePath",
            "path": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
            "sha256": "d8b0deb62c66fc2fd3d01ec8c513fafb697021e8f9c808869277b90a250e8267"
          },
          {
            "role": "priorProofPath",
            "path": "tmp/demo/continuous-1153-fresh-final/results.json",
            "sha256": "896b9a96a534428b85d6c4f4b17b4402e085334b077d2b22875f884661f5d265"
          }
        ],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-CRVF3Hlw.js",
            "sha256": "5d4855b52058f35243501afbe6c6c6c8b00b8629a841d5f451e40e43f1369de3"
          },
          {
            "path": "dist/assets/combat-CVSHPmTa.css",
            "sha256": "9af7a139b176c9980188c4d01d126241144d0b6d5327bf1e202591302cf243b7"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "FAILED_NOT_ACCEPTED",
      "startedAt": "2026-10-03T03:12:10.577Z",
      "endedAt": "2026-10-03T03:24:09.072Z",
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": true,
      "resultDigestMatches": true,
      "eligibleForReview": false,
      "exitCode": 1,
      "resultPath": "tmp/demo/0228-recovery-stock/results.json",
      "resultSha256": "4703eba85a7adcd2de65c900ff39e3a23910f24f5298202da607caac0e1e8b67",
      "provenanceStable": true,
      "ownerReview": {
        "at": "2026-10-03T03:28:43.852Z",
        "reviewer": "orchestrator and contracts_review",
        "scope": "Native preparation executed; requested village recovery NOT reached",
        "failure": "Native marais defeat round18/59actions; one surviving Sanglier32HP",
        "continuationSeedAllowed": false
      },
      "acceptanceAtReview": {
        "provenanceMatches": true,
        "requestMatches": true,
        "matchesCurrentExecution": true,
        "resultDigestMatches": true,
        "eligibleForReview": false,
        "disposition": "FAILED_NOT_ACCEPTED"
      }
    },
    {
      "schemaVersion": 1,
      "jobId": "0350-recovery-crosier",
      "runId": "rpgthreejs-auto-dev-90m-20261003T0350",
      "status": "SUCCEEDED",
      "registeredAt": "2026-10-03T03:58:18.548Z",
      "pid": 11028,
      "port": 5273,
      "command": [
        "node",
        "tools/demo-continuous-production-qa.mjs"
      ],
      "parameters": {
        "target": "defeat-recovery",
        "routePlan": "rescue",
        "timeoutMinutes": 25,
        "finalePlan": "serpent",
        "defeatNodeId": "lion-village-choice",
        "nativeDefeatWait": true,
        "viewport": [
          620,
          780
        ],
        "osReducedMotion": false,
        "earnedSavePath": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
        "priorProofPath": "tmp/demo/continuous-1153-fresh-final/results.json",
        "verifySalvation": false
      },
      "requiredAssertions": [
        "EXACT_V6_CHECKPOINT_RECOVERY",
        "VISIBLE_T1_DEPARTURE",
        "EXACT_RELOAD"
      ],
      "output": "tmp/demo/0350-recovery-crosier",
      "receiptPath": "tmp/demo/0350-recovery-crosier/qa-job.json",
      "provenance": {
        "gitHead": "e547e316a79e08f37a4d1987cb7506ba889acc7e",
        "sourceTree": "7f7b49e9c657b24e25c105b96f3b8186ebcbef8b",
        "sourceDiffSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": "510c54422335f72e9234525d0c1ba8c04e7d24c7a8f328ffe50780b38b05f069"
        },
        "inputs": [
          {
            "role": "earnedSavePath",
            "path": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
            "sha256": "d8b0deb62c66fc2fd3d01ec8c513fafb697021e8f9c808869277b90a250e8267"
          },
          {
            "role": "priorProofPath",
            "path": "tmp/demo/continuous-1153-fresh-final/results.json",
            "sha256": "896b9a96a534428b85d6c4f4b17b4402e085334b077d2b22875f884661f5d265"
          }
        ],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-CRVF3Hlw.js",
            "sha256": "5d4855b52058f35243501afbe6c6c6c8b00b8629a841d5f451e40e43f1369de3"
          },
          {
            "path": "dist/assets/combat-CVSHPmTa.css",
            "sha256": "9af7a139b176c9980188c4d01d126241144d0b6d5327bf1e202591302cf243b7"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "ACCEPTED_SCOPED",
      "startedAt": "2026-10-03T03:58:19.322Z",
      "endedAt": "2026-10-03T04:12:44.910Z",
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": true,
      "resultDigestMatches": true,
      "eligibleForReview": true,
      "exitCode": 0,
      "resultPath": "tmp/demo/0350-recovery-crosier/results.json",
      "resultSha256": "78e51a9e707cda929bc36fd658ab578ebc0ec0982e1846e0cf8d0ce9717b9600",
      "provenanceStable": true,
      "ownerReview": {
        "at": "2026-10-03T04:17:40.022Z",
        "reviewer": "orchestrator and reused contracts-guardian",
        "scope": "620x780normal native marais victory/village defeat/full ownerV6cleanup/focused departure/exact reload",
        "driverSha256": "510c54422335f72e9234525d0c1ba8c04e7d24c7a8f328ffe50780b38b05f069",
        "pilotCommit": "770ec706fd5ffb9b2cb49cfa9259a6f41b9d783f",
        "limitations": "Historical1153seed ancestry; no balance, full keyboard, settledVFX or single-build full campaign acceptance"
      },
      "acceptanceAtReview": {
        "provenanceMatches": true,
        "requestMatches": true,
        "matchesCurrentExecution": true,
        "resultDigestMatches": true,
        "eligibleForReview": true
      }
    },
    {
      "schemaVersion": 1,
      "jobId": "0350-recovery-mobile-os",
      "runId": "rpgthreejs-auto-dev-90m-20261003T0350",
      "status": "SUCCEEDED",
      "registeredAt": "2026-10-03T04:14:52.343Z",
      "pid": 37092,
      "port": 5274,
      "command": [
        "node",
        "tools/demo-continuous-production-qa.mjs"
      ],
      "parameters": {
        "target": "defeat-recovery",
        "routePlan": "rescue",
        "timeoutMinutes": 25,
        "finalePlan": "serpent",
        "defeatNodeId": "lion-village-choice",
        "nativeDefeatWait": true,
        "viewport": [
          390,
          844
        ],
        "osReducedMotion": true,
        "earnedSavePath": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
        "priorProofPath": "tmp/demo/continuous-1153-fresh-final/results.json",
        "verifySalvation": false
      },
      "requiredAssertions": [
        "EXACT_V6_CHECKPOINT_RECOVERY",
        "VISIBLE_T1_DEPARTURE",
        "EXACT_RELOAD"
      ],
      "output": "tmp/demo/0350-recovery-mobile-os",
      "receiptPath": "tmp/demo/0350-recovery-mobile-os/qa-job.json",
      "provenance": {
        "gitHead": "770ec706fd5ffb9b2cb49cfa9259a6f41b9d783f",
        "sourceTree": "7f7b49e9c657b24e25c105b96f3b8186ebcbef8b",
        "sourceDiffSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "driver": {
          "path": "tools/demo-continuous-production-qa.mjs",
          "sha256": "510c54422335f72e9234525d0c1ba8c04e7d24c7a8f328ffe50780b38b05f069"
        },
        "inputs": [
          {
            "role": "earnedSavePath",
            "path": "tmp/demo/continuous-1153-fresh-final/earned-first-refuge-v6.json",
            "sha256": "d8b0deb62c66fc2fd3d01ec8c513fafb697021e8f9c808869277b90a250e8267"
          },
          {
            "role": "priorProofPath",
            "path": "tmp/demo/continuous-1153-fresh-final/results.json",
            "sha256": "896b9a96a534428b85d6c4f4b17b4402e085334b077d2b22875f884661f5d265"
          }
        ],
        "receiptToolSha256": "a3130e26d0b3eb9b4322f34ca514c7805e1fbe87882dfeb122f5ae08fbc5013f",
        "build": [
          {
            "path": "dist/assets/assetManifest-Bffm0Y2y.js",
            "sha256": "0a67746c1a17ac9b92d9646097913f5ff1dde452617184aa1eeb9791b6d53554"
          },
          {
            "path": "dist/assets/combat-CRVF3Hlw.js",
            "sha256": "5d4855b52058f35243501afbe6c6c6c8b00b8629a841d5f451e40e43f1369de3"
          },
          {
            "path": "dist/assets/combat-CVSHPmTa.css",
            "sha256": "9af7a139b176c9980188c4d01d126241144d0b6d5327bf1e202591302cf243b7"
          },
          {
            "path": "dist/assets/game-DNVJsSmX.js",
            "sha256": "0d84dc2913176f54a2f3209865211da0ceead4d389a173ad3138dfc8636ffa69"
          },
          {
            "path": "dist/assets/game-Z5tVqu3k.css",
            "sha256": "ff17df7f056304ca1c29dbf47e7b8c2821311a645dc30e83a92a564d51a9926e"
          },
          {
            "path": "dist/assets/three-core-f0ajj1rG.js",
            "sha256": "872d2ba78a736c13c1a47069a6530c897398162c69060b7b6052577d73cbff49"
          },
          {
            "path": "dist/assets/three-postprocessing-DldD4cu8.js",
            "sha256": "e112a4e9e75ba3e25ecfbe4bd548361d1e3bf9d1a3790e622bd81d1ea5cd2f63"
          },
          {
            "path": "dist/assets/validation-mSkvzYyn.js",
            "sha256": "f63db7aee2c59717a7a82ecfa4d6a7dc0ac2c07d06c7d7d435b0367d65cf3a10"
          },
          {
            "path": "dist/index.html",
            "sha256": "f7e71881a1d178a7f793a64f477c1c9e899a0077aa962e05f67c2fb2f871c361"
          }
        ]
      },
      "acceptance": "ACCEPTED_SCOPED",
      "startedAt": "2026-10-03T04:14:54.197Z",
      "endedAt": "2026-10-03T04:24:29.368Z",
      "provenanceMatches": true,
      "requestMatches": true,
      "matchesCurrentExecution": true,
      "resultDigestMatches": true,
      "eligibleForReview": true,
      "exitCode": 0,
      "resultPath": "tmp/demo/0350-recovery-mobile-os/results.json",
      "resultSha256": "c4bf812331b219612c40ac8b3246f1d204d78085d067a749b6dd245fe1c5f208",
      "provenanceStable": true,
      "ownerReview": {
        "at": "2026-10-03T04:29:51.230Z",
        "reviewer": "orchestrator and reused contracts-guardian",
        "scope": "390x844OS reduced motion native marais victory/village defeat/full ownerV6cleanup/focused departure/exact reload",
        "driverSha256": "510c54422335f72e9234525d0c1ba8c04e7d24c7a8f328ffe50780b38b05f069",
        "pilotCommit": "770ec706fd5ffb9b2cb49cfa9259a6f41b9d783f",
        "limitations": "Historical1153seed ancestry; no balance, full keyboard, settledVFX or single-build full campaign acceptance"
      },
      "acceptanceAtReview": {
        "provenanceMatches": true,
        "requestMatches": true,
        "matchesCurrentExecution": true,
        "resultDigestMatches": true,
        "eligibleForReview": true
      }
    }
  ],
  "wip": {
    "sha": "5f89ea4179b36eca001decef92cfa4ff83fc5575",
    "dirtyFiles": [
      "docs/autonomy/AUTONOMOUS_WORK_STATE.json",
      "docs/autonomy/AUTONOMOUS_WORK_STATE.md",
      "legacy-combat.html",
      "src/combat/combatKeyboard.test.ts",
      "src/combat/combatKeyboard.ts",
      "src/combat/legacyCombatRuntime.js",
      "src/styles/combat-shell.css",
      "tools/combat-battlefield-keyboard-production-qa.mjs"
    ],
    "lastGreenCheck": "Prior0520reported81focused/types/build; full production keyboard acceptance incomplete; preserved without certifying",
    "status": "UNKNOWN",
    "branch": "wip/codex-manual-playtest-20261003T0735"
  },
  "nextAction": "Under owned lock read OD-2026-10-03-A/current1.1.0 contracts and preserved deferredDemoTask; verify its six keyboard source blobs without modifying them. Resume TRAVERSAL-VISUAL-CONVERGENCE: inspect TraversalRoadScene/Presentation, WorldModel/WorldRenderer, T0/T1/T3World and CheckpointRoute/Authoring plus current referenced ground assets; map Route/Checkpoint/Return Route ground palette/scale/perspective/lane geometry. Classify clan membership from existing campaign facts; remove clan sprites only from Traversal world, retaining authored STATIC_TABLEAU cast, valid external subjects and stops without NPC. Reduce hostile world formation to one approved Shadow marker matching Pursuit. Apply the smallest coherent shared-source correction, obtain a scoped traversal-engineer review or use its skill when profile is unavailable, then focused tests/types/build and native production sequence/captures across T0/T1/T3 and motion/viewports. No invented assets/canon. Continue the ordered remediation queue; retain exact deferred battlefield keyboard QA nextAction until item11.",
  "runMetrics": {
    "registeredNativeJobs": 2,
    "scopedRecoveriesAccepted": 2,
    "failedRequestedScenarios": 0,
    "readOnlyReviewerPasses": 3,
    "distinctReviewers": 1,
    "unchangedAcceptedProofReruns": 0,
    "failedOutputsUsedAsSeeds": 0,
    "creditSavings": "Not measured; no quota-gain claim"
  },
  "closeout": {
    "implementationCommit": "66608d2fd526d88d866c57e9f29b7b985333c316",
    "trialDriverCommit": "726bb751cf4a90cff088c4fda3af73f8de14702b",
    "finalStateCommit": "HEAD/origin/dev after state-only closeout; exact SHA in automation memory",
    "wipPayloadPreserved": true,
    "ownedWipRetired": true,
    "olderWipsRetained": true,
    "ownedWorkersExited": [
      35608,
      9992
    ],
    "portsClosed": [
      5271,
      5272
    ],
    "demoAcceptance": "IN_PROGRESS",
    "lockRelease": "After verified final push and memory write"
  },
  "checkpointPaths": [
    "docs/autonomy/AUTONOMOUS_WORK_STATE.json",
    "docs/autonomy/AUTONOMOUS_WORK_STATE.md"
  ]
}
```

## completedThisRun

- Read-only stopped-turn/process preflight; abandoned0520lock archived; exclusive takeover after105minutes
- Eight interrupted files preserved in explicit-path snapshot5f89ea4179b36eca001decef92cfa4ff83fc5575 without real-index mutation
- OD-2026-10-03-A recorded; dedicated contract set1.1.0 amendment reviewed PASS and pushed atd7ca28aed5c377ffedb03202f6364b7a947d1096
- New immutable LOCKED baseline and manual-playtest priority routing installed; existing keyboard/combat work deferred, not accepted or removed
- Read-only traversal-engineer profile/skill created; narrative/UI/Journey/guardian responsibilities aligned
- Saved automation prompt verified exactly; all other fields preserved ACTIVE/GPT-6.1Sol/high/90m/local project/environment/preferences
- Operational guardian PASS: immutable baseline,11item priority,33historical QA dispositions and6source blobs preserved; protocol baseline reference completed
- Seven Codex profiles parse; existing model/sandbox fields unchanged; new traversal skill strict-format check PASS

## filesChanged

- docs/autonomy/MANUAL_PLAYTEST_OPERATOR_DECISION_2026-10-03.md
- docs/autonomy/OPERATOR_DECISIONS.md
- docs/contracts/TRAVERSAL.md
- docs/contracts/CAMPAIGN_AND_STATE.md
- docs/contracts/PRESENTATION_AND_MEDIA.md
- docs/contracts/WORLD_AND_CHARACTERS.md
- docs/contracts/UI_AND_ACCESSIBILITY.md
- docs/contracts/AUTHORING_AND_QA.md
- docs/contracts/README.md
- docs/contracts/contracts.manifest.json
- docs/traversal/T0_PRODUCTION_CONTRACT.md
- AGENTS.md
- .agents/skills/autonomy-handoff/SKILL.md
- .agents/skills/contracts-compliance/SKILL.md
- .agents/skills/narrative-tableau/SKILL.md
- .agents/skills/ui-accessibility/SKILL.md
- .agents/skills/cinematics-journey/SKILL.md
- .agents/skills/traversal-engineer/SKILL.md
- .agents/agents/contracts-guardian.md
- .codex/agents/contracts-guardian.toml
- .agents/agents/narrative-tableau.md
- .codex/agents/narrative-tableau.toml
- .agents/agents/ui-accessibility.md
- .codex/agents/ui-accessibility.toml
- .agents/agents/cinematics-journey.md
- .codex/agents/cinematics-journey.toml
- .agents/agents/traversal-engineer.md
- .codex/agents/traversal-engineer.toml
- docs/autonomy/MULTI_AGENT_PROTOCOL.md
- docs/autonomy/RECURRING_RUN_PROMPT.md
- docs/autonomy/AUTONOMOUS_WORK_STATE.json
- docs/autonomy/AUTONOMOUS_WORK_STATE.md
- docs/reports/manual-playtest-contracts-1.md
- docs/reports/manual-playtest-contracts-1/checks.json
- docs/autonomy/handoffs/2026-10-03T0735Z-codex-manual-playtest-priority.md
- docs/reports/INDEX.md

## testsRun

- node tools/contracts/validate-contracts.mjs:8contracts/8slots PASS
- Independent contracts-guardian pre-review and real-diff documentary review PASS
- Git diff --check; approved amendment path review; snapshot file hashes/real-index preservation
- Python tomllib:7profiles and exact parsed before/after automation comparison
- Strict new skill frontmatter/name/description/body checks (official quick_validate unavailable: bundled Python lacks PyYAML)
- Python historicalQA/deferredNextAction/snapshot6source preservation assertions
- Independent contracts-guardian operational baseline/priority/WIP review PASS

## testsPassed

- 8LOCKED contracts and8video slots
- Independent scoped contract documentary review PASS
- Explicit amendment only; constitution/COMBAT_AND_VFX/AUTONOMOUS_WORK_PROTOCOL unchanged
- Inherited8snapshot blobs match files and real index unchanged
- Automation exact prompt and all other configuration fields PASS
- 7Codex TOML profiles, strict new skill format,6source blobs and33QA dispositions PASS
- Current LOCKED baseline gates empty; protocol/AGENTS/skills share approved SHA

## testsRemaining

- New T0/T1/T3 ground/checkpoint/clan/shadow visual acceptance
- Departure/final-exit motion and pursuit canonical charge/collision/miss acceptance
- Road rock/reward spawn lifetime/depth/spacing and owner-boundary checks
- Pre-judgement campfire/save-resume/agency and fact-consistent dialogue
- Relational tableau/cast/facing/ATE/contextual environments with desktop/intermediate/narrow OS-motion variants
- Deferred battlefield keyboard and original DEMO-QA-POLISH acceptance (exact details in deferredDemoTask)

## blockers

- None recorded.

## remainingWork

- PENDING: TRAVERSAL-VISUAL-CONVERGENCE
- PENDING: TRAVERSAL-MOTION-POLISH
- PENDING: TRAVERSAL-PURSUIT-THREAT
- PENDING: TRAVERSAL-ROAD-ELEMENTS
- PENDING: PRE-JUDGEMENT-CAMPFIRE
- PENDING: NARRATIVE-CONTEXT-COHERENCE
- PENDING: STATIC-TABLEAU-STAGING-POLISH
- PENDING: SCENE-TRANSITION-COPY
- PENDING: ENVIRONMENT-NARRATIVE-COHERENCE
- PENDING: Resume deferred DEMO-QA-POLISH

## taskQueue

- PRODUCTION-CONTRACTS-MANUAL-PLAYTEST-1: COMPLETE_DOCUMENTARY_ONLY
- TRAVERSAL-VISUAL-CONVERGENCE: ACTIVE
- TRAVERSAL-MOTION-POLISH: PENDING
- TRAVERSAL-PURSUIT-THREAT: PENDING
- TRAVERSAL-ROAD-ELEMENTS: PENDING
- PRE-JUDGEMENT-CAMPFIRE: PENDING
- NARRATIVE-CONTEXT-COHERENCE: PENDING
- STATIC-TABLEAU-STAGING-POLISH: PENDING
- SCENE-TRANSITION-COPY: PENDING
- ENVIRONMENT-NARRATIVE-COHERENCE: PENDING
- Resume deferred DEMO-QA-POLISH: PENDING

## Next action

Under owned lock read OD-2026-10-03-A/current1.1.0 contracts and preserved deferredDemoTask; verify its six keyboard source blobs without modifying them. Resume TRAVERSAL-VISUAL-CONVERGENCE: inspect TraversalRoadScene/Presentation, WorldModel/WorldRenderer, T0/T1/T3World and CheckpointRoute/Authoring plus current referenced ground assets; map Route/Checkpoint/Return Route ground palette/scale/perspective/lane geometry. Classify clan membership from existing campaign facts; remove clan sprites only from Traversal world, retaining authored STATIC_TABLEAU cast, valid external subjects and stops without NPC. Reduce hostile world formation to one approved Shadow marker matching Pursuit. Apply the smallest coherent shared-source correction, obtain a scoped traversal-engineer review or use its skill when profile is unavailable, then focused tests/types/build and native production sequence/captures across T0/T1/T3 and motion/viewports. No invented assets/canon. Continue the ordered remediation queue; retain exact deferred battlefield keyboard QA nextAction until item11.

## Deferred battlefield keyboard/combat

Finish exact battlefield production driver: real Tab entry, cursor bounds/announcement/no truth mutation, invalid/legal movement and native target execution, Escape/Retour focus, native controls and pointer regression in1366/620/390 OS on/off. Build new sources, review exact activation/assertion diff with guardian, register job and freeze tested inputs. Add actual fresh campaign iframe keyboard entry/return if budget permits; incomplete acceptance stays explicit. Preserve historical0350recovery and original726trial proofs. No media/audio work.

## Deliberately uncommitted inherited work

Six inherited battlefield keyboard implementation/driver files remain deliberately unstaged: interrupted before full production acceptance; operator defers them behind manual-playtest remediation. Dedicated contract/integration commits do not silently ship or discard them. Exact six blobs preserved on remote WIP snapshot; fresh owners must preserve them.

- legacy-combat.html @ 1a49cd0e44116fd215d34bb448e89943736908c6
- src/combat/combatKeyboard.test.ts @ ea17c82429b377811937c3e226fd8cafcf706922
- src/combat/combatKeyboard.ts @ c8c41388618805fc92baee138aec17d5c94112df
- src/combat/legacyCombatRuntime.js @ e4c8dfe9c1ce0caf2f0f1a9d2cb08d93034707f2
- src/styles/combat-shell.css @ ae9d24d6f1dea23c99dff938235ba6fcca458f16
- tools/combat-battlefield-keyboard-production-qa.mjs @ bfd2cd6a3f81e4d67645dabf29cc7c93ddd50321

- Snapshot: wip/codex-manual-playtest-20261003T0735 @ 5f89ea4179b36eca001decef92cfa4ff83fc5575.
- All33historic QA job dispositions remain unchanged in JSON.live.qaJobs.
- Original items1–8 retain historical completion; affected Traversal/narrative acceptance is reopened.
- No runtime correction, new art or full playtest acceptance is claimed by this contract/integration checkpoint.
- lastKnownGoodCommit/lastPushedCommit identify the verified dedicated contract checkpoint; HEAD/origin/dev identify the later operational state/doc commit without circular self-reference.
- Current handoff: docs/autonomy/handoffs/2026-10-03T0735Z-codex-manual-playtest-priority.md.
