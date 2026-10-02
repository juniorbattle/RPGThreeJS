# Autonomous work state

Current authority: docs/autonomy/AUTONOMY_EFFICIENCY_OPERATOR_DECISION_2026-10-02.md. DEMO-QA-POLISH remains active; items 1–8 are complete.

| Field | Value |
| --- | --- |
| `status` | IN_PROGRESS |
| `runId` | rpgthreejs-auto-dev-90m-20261002T2122 |
| `agent` | codex |
| `runStartedAt` | 2026-10-02T21:24:23.4164153Z |
| `runEndedAt` | RUNNING |
| `activeTask` | DEMO-QA-POLISH: continuous earned campaign beyond first refuge |
| `activePhase` | Final production grid/card and campaign proof |
| `activeSubtask` | Native stats-toggle focus retention and remaining earned campaign acceptance |
| `workingBranch` | dev |
| `lastKnownGoodCommit` | c05ba67bd2823db16d80638d4aff3d1ba74b0052 |
| `lastPushedCommit` | b26b7f8889bca7a7ecd735881cd14780a269ebc3 |
| `creditStatus` | CODEX_AVAILABLE; this run authorized; automation settings unchanged |
| `contractComplianceStatus` | PRODUCTION-CONTRACTS-LOCK-1/v1: scoped wheel/card/grid per terminal ledger; no LOCKED changes. Full item9 IN_PROGRESS; unresolved focus/campaign criteria excluded. |

## Live run

```json
{
  "runId": "rpgthreejs-auto-dev-90m-20261002T2122",
  "agent": "codex",
  "lastHeartbeat": "2026-10-02T22:33:59.429Z",
  "wip": {
    "branch": "wip/rpgthreejs-auto-dev-90m-20261002T2122",
    "sha": "72c958c5761ac3a9fc74fa9c81c10f4f8df86f36",
    "status": "GREEN",
    "dirtyFiles": [
      "src/styles/combat-hud.css",
      "src/combat/combatKeyboard.ts",
      "src/combat/combatKeyboard.test.ts",
      "src/combat/legacyCombatRuntime.js",
      "tools/demo-continuous-production-qa.mjs",
      "tools/combat-grid-hit-production-qa.mjs",
      "tools/combat-card-scroll-production-qa.mjs",
      "docs/reports/combat-grid-hit-reachability-1.md",
      "docs/autonomy/AUTONOMOUS_WORK_STATE.md",
      "docs/autonomy/AUTONOMOUS_WORK_STATE.json"
    ],
    "lastGreenCheck": "95focused tests/types/contracts/build PASS; browser final proofs pending"
  },
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
      "endedAt": "2026-10-02T20:34:46.490Z",
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
      "startedAt": "2026-10-02T21:35:25.150Z",
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
      "startedAt": "2026-10-02T21:57:42.750Z",
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
      "provenanceRepresentation": "Reviewed precommit sourceTree/diff; verify unchanged code blobs at implementation commit"
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
      "provenanceRepresentation": "Reviewed precommit sourceTree/diff; verify unchanged code blobs at implementation commit"
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
      "eligibleForReviewAtReview": false
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
      "eligibleForReviewAtReview": false
    }
  ],
  "status": "PRODUCTION_QA_RUNNING",
  "implementationCommit": "c05ba67bd2823db16d80638d4aff3d1ba74b0052",
  "reviews": {
    "ui": 1,
    "contractsReviewer": 1,
    "scope": "Scoped CSS/input assertions; terminal browser acceptance pending",
    "quotaGainClaimed": false,
    "contractsPasses": 1
  },
  "qaProcessesStopped": false,
  "ownedPortsClosed": []
}
```

## completedThisRun

- Clean lockless preflight;5455d067dev parity; no project QA; resumed exact item9
- Native baseline620grid has6intercepted centers; CSS card reflow retains camera/art/truth
- Generic sync observations reconciled with5455historical accepted/terminal jobs; no proof revoked
- First grid harness aborted with owned tree closure; native Undo button/bounded waits/unique captures corrected
- 95focused+16unchanged-receipt tests, types,8contracts,build,syntax and LOCKED/whitespace PASS
- Final wheel/card source and95tests verified; scoped terminal proof recorded without accepting interrupted work

## filesChanged

- src/styles/combat-hud.css
- src/combat/combatKeyboard.ts
- src/combat/combatKeyboard.test.ts
- src/combat/legacyCombatRuntime.js
- tools/demo-continuous-production-qa.mjs
- tools/combat-grid-hit-production-qa.mjs
- tools/combat-card-scroll-production-qa.mjs
- docs/reports/INDEX.md
- docs/reports/combat-grid-hit-reachability-1.md
- docs/autonomy/handoffs/2026-10-02T2122Z-codex-grid-scroll-checkpoint.md
- docs/autonomy/AUTONOMOUS_WORK_STATE.md
- docs/autonomy/AUTONOMOUS_WORK_STATE.json
- docs/reports/combat-grid-hit-reachability-1/proof.json
- docs/reports/combat-grid-hit-reachability-1/2122-grid-final-wheel-1366-768-no-preference-move.png
- docs/reports/combat-grid-hit-reachability-1/2122-grid-final-wheel-620-780-no-preference-move.png
- docs/reports/combat-grid-hit-reachability-1/2122-grid-final-wheel-620-780-no-preference-expanded.png
- docs/reports/combat-grid-hit-reachability-1/2122-grid-final-wheel-390-844-reduce-expanded.png
- docs/reports/combat-grid-hit-reachability-1/2122-grid-final-wheel-560-780-no-preference-expanded.png
- docs/reports/combat-grid-hit-reachability-1/2122-grid-final-wheel-620-600-no-preference-expanded.png
- docs/reports/combat-grid-hit-reachability-1/2122-card-final-wheel-390-600-no-preference-scrolled.png
- docs/reports/combat-grid-hit-reachability-1/2122-card-final-wheel-390-844-reduce-scrolled.png
- docs/reports/combat-grid-hit-reachability-1/2122-intermediate-final-wheel-combat-1-actual-impact.png

## testsRun

- 95 focused tests across5 suites after final wheel guard
- 16 receipt tests before unchanged receipt helper
- TypeScript --noEmit
- 8contract/8slot validator
- Vite production build after final source change
- syntax checks on3 drivers
- LOCKED gates and diff --check

## testsPassed

- 95 focused tests across5 suites after final wheel guard
- 16 receipt tests before unchanged receipt helper
- TypeScript --noEmit
- 8contract/8slot validator
- Vite production build after final source change
- syntax checks on3 drivers
- LOCKED gates and diff --check

## testsRemaining

- Full stats toggle focus retention and representative status/aptitude content
- Champion ending if not terminal accepted
- 620exact recovery if not terminal accepted
- Sacrifice branch,full keyboard grid/fallback,settled VFX and combat balance

## blockers

- Statistics toggle rebuild loses focus to BODY; full accessibility acceptance remains open
- 2122-intermediate-final-wheel: FAILED; no acceptance
- 2122-trial-final-wheel: FAILED; no acceptance

## remainingWork

- Item9 remains active: scoped healing/earned rescue second-refuge delivered; both full ending/branch, combat/VFX/mobile/defeat acceptance incomplete
- Artistic videos incomplete EXTERNAL_MANUAL_WORKSTREAM; recurring generation/polling/replacement excluded
- Prologue/refuge extra-slot and Alistair decisions remain dedicated; audio DEFERRED

## taskQueue

- PRODUCTION-CONTRACTS-LOCK-1: COMPLETE
- Contract drift audit: COMPLETE
- CINEMATIC-EIGHT-SLOT-ALIGNMENT: COMPLETE
- Retire T2/T4 playable runtime: COMPLETE
- TRAVERSAL-GENERALIZATION: COMPLETE
- TRAVERSAL-T1-PRODUCTION: COMPLETE
- TRAVERSAL-T3-PRODUCTION: COMPLETE
- CINEMATIC-STRUCTURE-READINESS: COMPLETE; artistic remaster incomplete EXTERNAL_MANUAL_WORKSTREAM
- Complete demo QA and polish: ACTIVE; refuge services/durability/earned first and rescue second refuge + Salvation adapter COMPLETE; both branch/endings/mobile/defeat/VFX acceptance continues
- Audio decision after structure lock: DEFERRED

## nextAction

Resume item9 from this checkpoint. Read2122-final-wheel terminal receipts first. Keep accepted card/grid scopes as ledger records; fix native stats-toggle focus retention in renderPanel without tactical writes, verify representative status/aptitude rows and focused native controls. 620deadline ended village round9Alistair2HP after22Wait and real marais54actions8rounds; rerun recovery solo with25minute bound from successful1153seed/proof. Champion ended round8HP312/520,Alistair72/Kestrel90alive;4conserve waits but no skill casts: inspect native skill selection/target eligibility before another35minute solo ending run from successful1323seed/proof. Preserve exact owner/reload assertions;1323mixed-build ancestry stays explicit. Then sacrifice/full keyboard grid/fallback/VFX/balance. Do not accept interrupted/failed continuations.

## Continuity and limits

- Current handoff: docs/autonomy/handoffs/2026-10-02T2122Z-codex-grid-scroll-checkpoint.md.
- Legacy results with old assertions remain NOT_ACCEPTED; receipts require provenance plus assertion/capture review.
- Exactly eight videos remain; artistic remaster external/manual, audio DEFERRED, canon and V6 IDs preserved.
- Implementation hashes name the preceding verified checkpoint; use HEAD/origin/dev for final state commit.
