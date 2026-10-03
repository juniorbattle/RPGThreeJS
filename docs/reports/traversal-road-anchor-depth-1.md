# Physical road anchors and depth checkpoint

| Field | Value |
| --- | --- |
| TASK | TRAVERSAL-ROAD-ELEMENTS |
| DOMAIN | Traversal / UI / tooling |
| BASELINE | dev @ 8dccef3d13491d2c50db76fb6a60895d128e06ae |
| BRANCH | dev |
| HEAD | 91b4d2e1ba0f697dde1e703e8fc164ca49ec84ed source implementation checkpoint; final report/state publication recorded in automation memory |
| STATUS | Review; production acceptance remains open |
| MERGED_IN | NONE; direct authorized dev checkpoint |
| SUPERSEDES | NONE; rock-family report remains valid in its scope |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Shared Risk/Reward edge entry, retained contact/collection, full exit, camera alignment and ground depth |
| CANONICAL_DOCS_UPDATED | docs/autonomy/TRAVERSAL_ROAD_ELEMENTS.md |
| EVIDENCE | Registered road-1815 jobs under ignored tmp/traversal; [diagnostic checks and six selected captures](traversal-road-anchor-depth-1-browser/checks.json); terminal receipts and scope in paired JSON |

CURRENT FACT — Shared presentation anchors replace timer-gated spawning and contact-time popping. Anchors freeze when their full bounds first intersect the viewport, survive impact/collection and resize, and hide only after the complete trailing edge leaves. A shared world-distance scale starts the earliest authored mark at the edge. Camera reconciliation targets existing visible anchors without moving their positions or changing authored contacts. Guarded malformed targets fall back to existing speed; this guard is not a full acceptance of every long-frame or target-acquisition sequence.

Risk/Reward wrappers share the caravan actor plane. Ground depth and the vehicle's rendered foot use one transient presentation value. Normal lane motion interpolates over .38 seconds; OS/game reduction uses the existing reduction helper and immediate ground placement. Resize recomputes transforms without advancing the route clock; disposal removes its listener. Foreground, HUD and impact/collection feedback retain their owners.

GameApp temporary-loot callback, unique pickup IDs, authored hazard kinds/IDs/lanes/progress/severity, Risk/Reward resolution, campaign and V6 serialization remain unchanged. No media, contract, canon or combat owner was changed. The six deferred battlefield keyboard files remain exact inherited WIP and are excluded from this checkpoint's source commit.

The production build and complete physical-source inventory include that preserved deferred keyboard WIP, as prior runs did. Their digests identify this exact mixed working tree; they must not be treated as a clean-dev build or as keyboard acceptance.

## Verification and rejected evidence

The final source passes TypeScript, 32 focused anchor/scene/risk/reward tests and all 167 Traversal tests in 29 files after the final resize/CSS increment, the immutable and working-tree contract gates, validator 8 contracts/8 videos, production build and whitespace checks. Build is game-CQh_YGUA.js / game-DrzQVqcv.css. Registered receipts retain tracked-source/driver/build digests; the explicit 386-file frozen source inventory in tmp/run1815/identities.json also covers the new untracked anchors omitted by Git diff provenance. Verify both before reusing any proof.

Inherited road-1600-probe is historical, unaccepted proof. Early run1815 failures found natural-entry, stale-depth and resize/reduced-motion defects; they were corrected before the current build. Final-v1 failed native resize/OS ground assertions. V2 first-road cases passed but early-road assertions failed because they compared a post-contact sample to an exact authored instant: a 33.3 ms frame naturally overshot that instant. Native reset is the crossing frame's elapsed time. V3 instead brackets the authored instant with native frames under 40 ms, interpolates physical center within 3 px, and requires the reset to equal the actual owner crossing frame. V2 traces give under .01 px interpolated contact error; these diagnostics do not replace current v3 proof. All failed receipts are retained and never used as campaign seeds.

V3 scenarios cover selected first roads and early multi-mark roads (T0 route4, T1/T3 route3), native Arrow/Tab controls, contact/collection and first-road avoidance, responsive resize, actual ground ordering, natural entry, retained marks/full exit, positive shared speed, monotone distance, native collision/reset/slowdown and one temporary award per unique pickup with no secured-gold write. T1/T3 origins and prior canonical combat outcomes are explicitly fixtures. This is not earned campaign, defeat/refuge securing or V6 continuation acceptance.

V3 normal is terminal FAILED on its ninth T0 case: after the second rock fully exited, CSSOM serializes left as -1044.49px and the reconstructed world anchor differs by .0202904 reference units from its first visible reconstruction, narrowly outside the .02 guard. This is about .0054 screen pixels at390px. The current driver remains frozen for the other two jobs. Do not silently accept or relabel this failed receipt. Next correction must reconstruct the logical anchor from the full-precision predictedLeft/predictedRight datasets, while independently asserting that the actual CSS position stays within its serialization precision; then register new source-identical proof. Current v3 job dispositions remain in state.

OS v3 also terminated on the same guard in its eighteenth case. Neither failure is promoted to PASS. Six inspected non-black contact/collection stills are selected solely as diagnostic candidate evidence: normal T0 desktop/620, OS T0/390 and T1/620, game T0/390 and T1 desktop. Root observed retained rocks/pouch checkmark, coherent ground/foreground and unobstructed HUD. Traversal reviewer separately inspected T1 desktop OS early-road retained rock. One early-entry screenshot was fully black under the return cover and was excluded; next driver must wait for visible entry before capture. Stills cannot certify the complete motion sequence.

Game v3 completed its twenty-seventh scenario then failed the same post-exit precision guard. V3 totals are 8/9,17/18 and26/27 cases with complete assertions before each final failed case, not accepted matrix runs. All three jobs are terminal FAILED / NOT_ACCEPTED with stable execution provenance. Failed results and six diagnostic frames are preserved; there is no successful full matrix or accepted campaign seed.

## Orchestrator compliance matrix

| Row | Verdict / boundary |
| --- | --- |
| GAME_CONSTITUTION | PASS boundary: presentation state only |
| ART_DIRECTION / CHARACTERS / ENVIRONMENTS | PASS existing assets; broader narrative/environment acceptance not reopened here |
| NARRATIVE / CAMPAIGN | PASS boundary: authored content and truth owners unchanged |
| NARRATIVE_PRESENTATION | N/A; no dialogue/tableau/Journey/video edits |
| TRAVERSAL | OPEN production acceptance; shared anchors/depth implementation and focused checks pass |
| COMBAT | PASS boundary; earlier-result fixtures are disclosed, no combat acceptance claim |
| SAVE | PASS boundary; no transient serialization or earned V6 claim |
| UI / ACCESSIBILITY | OPEN complete acceptance; native matrix receipt dispositions in state |
| QA_EVIDENCE | OPEN overall; failed receipts quarantined, current assertions/provenance explicit |
| REPOSITORY_GOVERNANCE | PASS gates: owned lock, explicit snapshot/staging, historical ledger and deferred WIP preserved |

All eight current contracts, constitution and relevant skills were read; independent read-only contracts/traversal reviewers reused for exact source and assertion changes. Contract set1.1.0 baseline d7ca28aed5c377ffedb03202f6364b7a947d1096 remains immutable.

OPEN: remaining authored roads and constrained spacing/reaction audit; pause/document visibility, fallback, deliberately unaligned long-frame crossings, target-acquisition launch acceleration, compensation bounds, and a future pickup already visible before a speed reset. Current scaled early-road gold is offscreen at that reset and cannot certify the latter scenario. Earned V6/gold defeat/refuge/campaign proof remains outside these fixture runs. Pursuit collision remains blocked by ten missing authored canonical mappings. Keep this task active and the demo incomplete.
