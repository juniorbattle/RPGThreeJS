# Autonomous work state

Current authority: docs/autonomy/AUTONOMY_EFFICIENCY_OPERATOR_DECISION_2026-10-02.md. DEMO-QA-POLISH remains active; items 1–8 are complete.

| Field | Value |
| --- | --- |
| `status` | IN_PROGRESS |
| `runId` | rpgthreejs-auto-dev-90m-20261002T1952 |
| `agent` | codex |
| `runStartedAt` | 2026-10-02T19:52:37Z |
| `runEndedAt` | 2026-10-02T21:04:30.549Z |
| `activeTask` | DEMO-QA-POLISH: continuous earned campaign beyond first refuge |
| `activePhase` | Native earned defeat recovery QA |
| `activeSubtask` | Diagnose native campaign pilot targeting/preparation; 620recovery and Champion ending remain unaccepted |
| `workingBranch` | dev |
| `lastKnownGoodCommit` | c05ba67bd2823db16d80638d4aff3d1ba74b0052 |
| `lastPushedCommit` | b26b7f8889bca7a7ecd735881cd14780a269ebc3 |
| `creditStatus` | CODEX_AVAILABLE; this run authorized; automation settings unchanged |
| `contractComplianceStatus` | PRODUCTION-CONTRACTS-LOCK-1/v1: scoped combat keyboard,1366normal/390OS-only native V6 recovery PASS independently reviewed. 620recovery, Champion/full demo NOT_ACCEPTED. No LOCKED/canon/schema/media/main changes. |

## Live run

```json
{
  "runId": "rpgthreejs-auto-dev-90m-20261002T1952",
  "agent": "codex",
  "lastHeartbeat": "2026-10-02T21:04:30.579Z",
  "wip": {
    "status": "RETIRED",
    "branch": "wip/rpgthreejs-auto-dev-90m-20261002T1952",
    "sha": "6151d271c5cfbad3f6c217416b1918ddc1585b50",
    "integratedImplementation": "c05ba67bd2823db16d80638d4aff3d1ba74b0052",
    "integratedProof": "b26b7f8889bca7a7ecd735881cd14780a269ebc3",
    "retiredAt": "2026-10-02T21:04:30.549Z",
    "reason": "Identical source/capture payload verified on dev; terminal state/report supersede snapshot metadata; older WIP refs retained"
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
    }
  ],
  "status": "CHECKPOINT_COMPLETE",
  "implementationCommit": "c05ba67bd2823db16d80638d4aff3d1ba74b0052",
  "reviews": {
    "ui": 1,
    "contractsReviewer": 1,
    "contractsPasses": 3,
    "scope": "Native source/keyboard; new mobile V6 boundary; new desktop width proof",
    "quotaGainClaimed": false
  },
  "qaProcessesStopped": true,
  "ownedPortsClosed": [
    5258,
    5259,
    5260,
    5261,
    5262
  ]
}
```

## completedThisRun

- Exclusive clean preflight; dev remote parity387dd73 verified; no inherited QA process
- Diagnosed legacy trial:25minute harness limit at round8, Champion74/520HP, party alive; no deadlock observed
- Recorded validated bounded QA timeout and explicit OS/game motion evidence; three new instrumented production jobs launched
- Reproduced global Enter ending turn on focused Attack; minimal native-control shortcut guard implemented after all previous owned workers stopped
- Harness false failures corrected: CSS uppercase label uses textContent; receipt compares persisted JSON values
- Scoped contracts-guardian PASS: six native combat keyboard cases, source/receipt/input ownership preserved
- Scoped mobile native recovery PASS: marais victory43actions6rounds; Bois-Clair defeat15Wait8rounds; exactV6 owner/reload,105temporarygold/materials cleared,T1removed,T0preserved,T3alreadyabsent,17savedfields retained
- Eight explicitly selected/inspected captures and compact hashed machine proof prepared
- 81/81 focused tests,16/16 receipt tests,6/6 built-production native keyboard cases and desktop/mobile exact V6 recovery accepted; final types/8contracts/LOCKED/whitespace gates PASS
- Final desktop: SUCCEEDED; requested acceptance requires review; see immutable receipt
- Final intermediate: FAILED; requested acceptance withheld; AssertionError [ERR_ASSERTION]: Defeat occurred before the requested native recovery boundary
- Final trial: FAILED; requested acceptance withheld; AssertionError [ERR_ASSERTION]: Battle did not finish before bounded deadline
- Desktop1366normal exact native recovery independently accepted:33marais actions4rounds,17Bois-Clair Wait8rounds; scoped owner/save/focus proof PASS
- Champion35minute limit: round15,19/520HP, Kestrel90HP alive, other3KO; ending NOT_ACCEPTED
- Implementationc05ba67 pushed/remote verified; reviewed file blob hashes equal committed payload; no worker active
- Implementationc05ba67 and proofb26b7f8 verified on origin/dev; all owned QA workers/ports closed; ownedWIP retired after payload/path checks; final state-only commit follows

## filesChanged

- docs/autonomy/AUTONOMOUS_WORK_STATE.json
- docs/autonomy/AUTONOMOUS_WORK_STATE.md
- docs/autonomy/QA_JOB_CONTINUITY.md
- docs/project/CURRENT_STATUS.md
- docs/reports/INDEX.md
- src/combat/combatKeyboard.test.ts
- src/combat/combatKeyboard.ts
- src/combat/legacyCombatRuntime.js
- tools/demo-continuous-production-qa.mjs
- tools/qa/qa-job.mjs
- tools/qa/qa-job.test.mjs
- tools/combat-keyboard-production-qa.mjs
- docs/reports/combat-keyboard-native-activation-1.md
- docs/reports/combat-keyboard-native-activation-1/checks.json
- eight explicitly selected PNGs
- docs/autonomy/handoffs/2026-10-02T1952Z-codex-native-keyboard-checkpoint.md

## testsRun

- node node_modules/vitest/vitest.mjs run src/combat/combatKeyboard.test.ts src/combat/legacyCombatRuntime.hotfix.test.ts src/combat/combatShellPresentation.test.ts src/game/runSystem.test.ts src/game/campaignPresentationMigration.test.ts --maxWorkers=4 --minWorkers=1
- node --test tools/qa/qa-job.test.mjs
- node node_modules/typescript/bin/tsc --noEmit
- node tools/contracts/validate-contracts.mjs
- node node_modules/vite/bin/vite.js build
- node tools/combat-keyboard-production-qa.mjs:6 cases
- node tools/demo-continuous-production-qa.mjs:4 corrected35minute cases; exact parameters/inputs/build/receipts in live.qaJobs
- git diff --check and both LOCKED gates

## testsPassed

- 81/81focused tests across5suites;16/16receipt tests;TypeScript/build/8contracts8slots/syntax PASS

## testsRemaining

- Native defeat recovery620x780 after native targeting/preparation diagnosis;1366normal and390OS-only accepted
- Champion earned ending from successful1323second-refuge lineage; failed ending results cannot certify a seed
- Sacrifice branch, campaign-native Salvation use, settled authored VFX, full grid keyboard/fallback/accessibility and balance

## blockers

- 620native marais loss before requested Bois-Clair boundary; recovery at620not accepted
- Champion did not finish35minute bound; ending not accepted (no deadlock/game balance conclusion)

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

Resume item9. Read terminal1952-final-desktop/intermediate/trial receipts/results/progress before any relaunch. Desktop1366normal/mobile390OS-only exact V6 recovery and six standalone keyboard cases are ACCEPTED_SCOPED; do not repeat unchanged accepted work. Investigate native pilot failed-target/Marian action retries and 620marais attrition using captured progress/action inputs; distinguish harness targeting/camera hit-testing from gameplay without changing truth or forcing victory. Fix verified harness/runtime defect, then rerun620 recovery from successful1153first-refuge seed/proof and Champion from successful1323second-refuge seed/proof in separate fresh output dirs. Preserve exact owner recovery/reload assertions, OS/game motion evidence and receipt provenance. A failed/interrupted result cannot seed certified continuation. Then sacrifice/full keyboard grid/VFX/balance; demo IN_PROGRESS.

## Continuity and limits

- Current handoff: docs/autonomy/handoffs/2026-10-02T1952Z-codex-native-keyboard-checkpoint.md.
- Legacy results with old assertions remain NOT_ACCEPTED; receipts require provenance plus assertion/capture review.
- Exactly eight videos remain; artistic remaster external/manual, audio DEFERRED, canon and V6 IDs preserved.
- Implementation hashes name the preceding verified checkpoint; use HEAD/origin/dev for final state commit.
