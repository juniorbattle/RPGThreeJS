# CIN-6A P0 vertical cinematic production

## 1. Baseline and preflight

| Gate | Result |
|---|---|
| Branch | `main` |
| Required HEAD | `9aad61dffe55d785f20e9b6c8fd081f210d7faf2` |
| Local HEAD | exact match |
| `origin/main` | exact match |
| Worktree before production | clean |
| Census | `tools/cinematics/specs/campaign_cinematic_census.json` |
| Census SHA-256 | `b3ee675cccf87630c004ce00ba3c168ac64e8a50d92b6dbf07ed0ab625021c82` |
| Census validator | PASS |
| Canonical character root | `public/assets/characters/pixel/full/` |
| Canonical facing | `SCREEN_RIGHT` |
| MiniMax key | present, ignored, untracked; value never printed |
| Provider/toolchain | direct MiniMax H3 client, shot compositor, shot/staging validator, exact last-frame extractor, sequence assembler, mastering and media validator present |
| ffmpeg / ffprobe | PASS from ignored local toolchain |
| Production presentation default | `TravelView` |
| Journey availability | DEV-selected |

The pre-production focused cinematic regression passed before provider work. No baseline, census, key, asset, provider-tooling, or runtime-architecture stop condition was encountered.

## 2. Priority accounting clarification

The census is not internally inconsistent and production planning was not changed.

| Accounting concept | P0 | P1 | P2 |
|---|---:|---:|---:|
| Prioritized primary media entries (`UNIQUE`, `STATE_VARIANT`, `APPROVED_EXISTING`) | 17 | 9 | 0 |
| Ordered targets including reuse | 20 | 11 | 0 |

P0 expands from 17 primary entries to 20 ordered targets because the single `STATE_VARIANT` primary entry expands into two concrete Bois-Clair variant targets (+1), and two `REUSE_FAMILY` targets are ordered (+2). P1 expands from 9 to 11 only through two `REUSE_FAMILY` targets. A reuse family means one shared video, never one video per consumer. The validator and tests independently assert the coverage class of every ordered target and exclude reuse families from unique-media counts.

## 3. Authoritative CIN-6A target extraction

The exact committed `productionBatches[id="CIN-6A"]` order was used.

| # | Target | Kind | Action | Runtime media |
|---:|---|---|---|---|
| 1 | `family:forest_journey_tension` | `REUSE_FAMILY` | `PRODUCE` | `forest_journey_tension` |
| 2 | `node:lion-camp:departure` | `UNIQUE` | `PRODUCE` | `camp_departure` |
| 3 | `node:lion-audience:arrival` | `UNIQUE` | `PRODUCE` | `alaric_audience_arrival` |
| 4 | `node:lion-refugees:approach` | `UNIQUE` | `PRODUCE` | `refugees_approach` |
| 5 | `node:lion-first-refuge:arrival` | `UNIQUE` | `PRODUCE` | `first_refuge_arrival` |
| 6 | `edge:lion-first-refuge>lion-reserve-trail` | `UNIQUE` | `PRODUCE` | `first_refuge_departure` |
| 7 | `node:lion-valmir-road:route-choice-freeze` | `UNIQUE` | `PRODUCE` | `valmir_route_fork` |
| 8 | `node:lion-village-choice:arrival` | `UNIQUE` | `QUALITY_GATE_PRODUCE` | `bois_clair_arrival` |
| 9 | `state:bois_clair:saved` | `STATE_VARIANT` | `PRODUCE` | `bois_clair_saved` |
| 10 | `edge:lion-second-refuge>lion-lancer-recruit` | `UNIQUE` | `PRODUCE` | `second_refuge_departure` |
| 11 | `node:lion-witnesses:encounter` | `UNIQUE` | `PRODUCE` | `witnesses_encounter` |
| 12 | `family:ruins_approach_context` | `REUSE_FAMILY` | `PRODUCE` | `ruins_approach_context` |
| 13 | `node:lion-shadow-signs:arrival` | `UNIQUE` | `QUALITY_GATE_PRODUCE` | `shadow_signs` |
| 14 | `node:lion-final-refuge:dossier` | `UNIQUE` | `PRODUCE` | `final_refuge_dossier` |
| 15 | `node:lion-final-judgement:judgement` | `APPROVED_EXISTING` | `VERIFY_ONLY` | `lion_judgement` |
| 16 | `content:serpent_captain:reveal` | `APPROVED_EXISTING` | `VERIFY_ONLY` | `serpent_general_reveal` |
| 17 | `state:serpent_pursuit:ending` | `UNIQUE` | `PRODUCE` | `serpent_route_ending` |

Accounting: exactly 17 targets, 15 production actions (including two quality gates), and 2 verify-only actions. `bois_clair_sacrificed`, `lion_trial_route_ending`, and all P1/P2 content remain unproduced.

## 4. Sequential sub-batch execution

| Sub-batch | Targets | New seconds | New bytes | Cumulative result |
|---|---|---:|---:|---|
| 6A.1 | forest tension, camp departure, Alaric audience, refugees approach | 42 | 48,234,502 | PASS; 42 s / 48,234,502 B |
| 6A.2 | first refuge arrival/departure, Valmir fork | 32 | 27,490,188 | PASS; 74 s / 75,724,690 B |
| 6A.3 | Bois-Clair arrival gate, then saved aftermath | 38 | 47,092,808 | PASS; 112 s / 122,817,498 B |
| 6A.4 | second refuge departure, witnesses | 22 | 23,357,281 | PASS; 134 s / 146,174,779 B |
| 6A.5 | ruins context, Shadow Signs gate, final dossier | 48 | 54,328,919 | PASS; 182 s / 200,503,698 B |
| 6A.6 | verify two existing assets, then Serpent ending | 18 new | 16,058,120 new | PASS; 200 s / 216,561,818 B new |

Generation paused for review at every required boundary. No unresolved major defect was carried into a later batch.

## 5. Generation attempts

| Runtime ID | Shots / attempts | Decision |
|---|---:|---|
| `forest_journey_tension` | 2 / 2 | selected first attempt for both |
| `camp_departure` | 2 / 3 | one facing retry |
| `alaric_audience_arrival` | 2 / 2 | selected first attempt for both |
| `refugees_approach` | 3 / 3 | selected first attempt for all |
| `first_refuge_arrival` | 2 / 2 | selected first attempt for both |
| `first_refuge_departure` | 3 / 5 | one facing retry and one camera retry |
| `valmir_route_fork` | 2 / 2 | selected first attempt for both |
| `bois_clair_arrival` | 4 / 4 | selected first attempt for all; quality gate PASS |
| `bois_clair_saved` | 3 / 3 | selected first attempt for all |
| `second_refuge_departure` | 2 / 3 | one staging/separation retry |
| `witnesses_encounter` | 3 / 3 | selected first attempt for all |
| `ruins_approach_context` | 2 / 2 | selected first attempt for both |
| `shadow_signs` | 4 / 5 | one camera retry; quality gate PASS |
| `final_refuge_dossier` | 3 / 4 | one crop/composition retry |
| `serpent_route_ending` | 3 / 5 | two defeated-posture/continuity retries |

Total: 40 shots, 48 provider attempts, 8 targeted retries, 13,227,836 provider tokens. Exact task IDs, source hashes, prompt hashes, usage, selection decisions, rejection reasons, last-frame hashes, chain provenance, and final hashes are in `docs/reports/cin-6a-video-generation-log.md`.

## 6. Source, identity, facing, and continuity QA

All 15 specs passed the CIN-4 shot/staging validator with required sources. Every important known character uses a canonical `public/assets/characters/pixel/full/` asset. Every character placement explicitly authors position, facing, look target, role, depth, and action. `SCREEN_LEFT` instances are compositor mirrors; canonical files were never overwritten.

The source compositor gained one deterministic `SEALED_ARTEFACT` overlay used by the ending because the census requires a recovered object and no canonical prop asset exists. It is deterministic presentation only and creates no game fact.

| Runtime ID | Identity | Facing | Staging | Anatomy | Weapon | Environment | Camera | Action | Continuity | No text | No watermark | Final frame | Purpose | Game-truth safe |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `forest_journey_tension` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `camp_departure` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `alaric_audience_arrival` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `refugees_approach` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `first_refuge_arrival` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `first_refuge_departure` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `valmir_route_fork` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `bois_clair_arrival` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `bois_clair_saved` | PASS | PASS | PASS | PASS | N/A | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `second_refuge_departure` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `witnesses_encounter` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `ruins_approach_context` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `shadow_signs` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `final_refuge_dossier` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `serpent_route_ending` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

Every new shot was inspected at first, 25%, 50%, 75%, and last frames. Every chain used an exact reviewed last-frame hash. CUT was retained where identity preservation was safer than propagation. All final transitions were inspected; no nearly-identical-three-zoom substitute was accepted.

## 7. Quality gates

### Bois-Clair

`BOIS_CLAIR_SOURCE_QA`, identity, facing, staging, narrative progression, camera, continuity, final frame, and no-game-truth-leak all PASS. The four-shot HERO progresses through geographical approach, smoke/fire, company reaction, visible Serpent pressure and civilians, then a stable choice handoff. It never selects village defense, supplies, raid, greed, or success. Only after this gate passed was `bois_clair_saved` produced. The saved sequence remains damaged-but-surviving and is selected only from `missionSuccess === true` with `missionGreed !== true`.

### Shadow Signs

`SHADOW_SOURCE_QA`, identity, facing, environment, mystery readability, no-disclosure-leak, continuity, and final frame all PASS. The four-shot HERO progresses from wide investigation to sign detail, reaction, and stable settle. It establishes a Serpent/ancient-threat connection without claiming whether Alaric knows or whether evidence is revealed or concealed. Only after this gate passed was the final refuge dossier produced.

### Serpent ending

The three-shot HERO establishes an already-defeated General, a recovered sealed artefact, and a restrained chapter-ending pullback. Rejected upright poses were not propagated. The final never shows an Alaric transfer, disclosure choice, Lion Trial outcome, execution, resurrection, or further combat.

## 8. Final media metadata

All 15 new masters and all 3 existing production masters pass ffprobe and the relevant CIN-3/CIN-4 validators: MP4, H.264 High, yuv420p, 1920x1080, 24 fps, valid duration, silent, no unexpected rotation, and Chromium-decodable.

| Runtime ID | Seconds | Bytes | SHA-256 |
|---|---:|---:|---|
| `forest_journey_tension` | 9 | 17,508,957 | `385f5f9b99b22d9710ef1ef7a89fd21a8b59e392664a51a2480eab6167511fac` |
| `camp_departure` | 12 | 11,262,128 | `fd9ec9efee8e127eed25a6ee680f875ab3f670eabcfae37e02970950e9fa35d4` |
| `alaric_audience_arrival` | 9 | 9,749,877 | `b844b273dd955c34364d041b54baf385bd89b9a367db16bc29050685a186951f` |
| `refugees_approach` | 12 | 9,713,540 | `5f1d76f8686c2bf2f9775576da6d50649cb33e1c5157b46e6d3f9d5b719e5a28` |
| `first_refuge_arrival` | 10 | 10,231,757 | `31b4a50f678d6d7431a855d7056bbcee66f44f8a623081be972b79986a55c56e` |
| `first_refuge_departure` | 12 | 11,142,441 | `a3078c6e149c02f78be58063d9f884004a7d3b0265ba29481506fe138d194425` |
| `valmir_route_fork` | 10 | 6,115,990 | `1a2f0a5f5eb02cec0fd12ce660b7ecfcb94bef9da264d4682880649b6f76438c` |
| `bois_clair_arrival` | 20 | 25,714,244 | `a37d397665960f8f6749d8f1ece69eaf91c7160cec68fc581ed26ea78042a699` |
| `bois_clair_saved` | 18 | 21,378,564 | `a57d9ef8ff2fbb26084066b057f89948bdfe59de22dc7f7770d6576900223b1f` |
| `second_refuge_departure` | 10 | 11,299,422 | `a7d4210b8223a6ef3946fc63bdb138310ed61168f6d902bfc0eb4f74dbe9be3d` |
| `witnesses_encounter` | 12 | 12,057,859 | `de8f577bb18dc4ce30e0ec3d902fe7f27c4778154ade2e6e1a14eeec99ac4b98` |
| `ruins_approach_context` | 10 | 17,438,390 | `adf235b6d84889cf80059ae314e7472f2c07e9dcd2f7e9cf99cf7f936bebe525` |
| `shadow_signs` | 20 | 20,631,945 | `141d5e04d3573a1827cff7dbdc9efacb024d8a3ecab32a985b700da75a56f4c2` |
| `final_refuge_dossier` | 18 | 16,258,584 | `fa821768883d1afd897216c60c81f979c998db0b1437e1c7eb74f098b58f5ca2` |
| `serpent_route_ending` | 18 | 16,058,120 | `f1de1f29ccc98ca66f97da94c21060d100687e4fef39b2d0378bcdea36db395c` |
| `lion_judgement` (verified) | 17 | 21,565,194 | `6ea5b12bb8c97deadbea2177725d7e3eb958ab7971361d34064729acf776e5f9` |
| `serpent_general_reveal` (verified) | 8 | 9,331,600 | `e8c918d292693e4bc7f612fc6f4fbcdb283c6d2f8095c805db287692e561a682` |
| `lion_champion_reveal` (untouched safety asset) | 8 | 10,692,772 | `2d581e76e5cc0a37d4633fd6d7166210780da55475f54abadfd90aedaf30b04c` |

Audio was stripped from every new master. No generated speech, vocal, soundtrack, or random per-shot music remains.

## 9. Media footprint

- New CIN-6A: 200 seconds, 216,561,818 bytes.
- Existing three production assets: 33 seconds, 41,589,566 bytes.
- Cumulative production media: 233 seconds, 258,151,384 bytes.
- Actual complete Serpent vertical route: 225 seconds (15 new plus Lion Judgement and Serpent General reveal).
- Census golden estimate: 216 seconds; actual route delta: +9 seconds / +4.17%.
- Duration-normalized expected bytes for 200 new seconds at the census empirical rate: 252,057,976.
- Actual size delta: -35,496,158 bytes / -14.08%; no +30% stop gate was approached.

The census full-P0 projection remains 239 new seconds / 301,209,281 projected new bytes because it also includes CIN-6B P0 media that this mission intentionally did not produce.

## 10. Manifest, mappings, and preload behavior

The manifest contains exactly 19 descriptors: one QA placeholder, three prior production assets, and fifteen CIN-6A masters. Every duration is the ffprobe-backed mastered duration. There are no duplicates, remote URLs, rejected candidates, or `placeholderOnly` production entries.

Reviewed Journey boundary mappings:

- `node:lion-camp:arrival` → `camp_departure`
- `node:lion-refugees:arrival` → `refugees_approach`
- `node:lion-valmir-road:arrival` → `valmir_route_fork`
- `node:lion-witnesses:arrival` → `witnesses_encounter`

Journey-only lifecycle mappings:

- before dialogue: `lion_briefing` → `alaric_audience_arrival`; `village_choice` → `bois_clair_arrival`; `shadow_signs` → `shadow_signs`; `final_refuge` → `final_refuge_dossier`
- before combat: `forest_ambush` and `wolf_pack` → one shared `forest_journey_tension`; `ruins_guardians` → `ruins_approach_context`
- first-refuge arrival → `first_refuge_arrival`
- first-refuge Continue → `first_refuge_departure`
- second-refuge Continue → `second_refuge_departure`
- village-defense victory with saved truth → `bois_clair_saved`
- Serpent-captain victory with `serpentGeneralDefeated === true` → `serpent_route_ending`

The three global production mappings remain unchanged: `lion_finale_judgement` → `lion_judgement`, `serpent_captain` → `serpent_general_reveal`, and `lion_chief` → `lion_champion_reveal`.

Preloading remains conservative: the existing preloader receives only immediately mapped candidate edge/arrival IDs, deduplicates them, and clears them on commit/disposal. It never scans or preloads the complete manifest. Census groups remain guidance for `opening_departure`, the three forks, refuges, Bois-Clair state, witnesses, Shadow/finale, and Serpent ending; no remote preload was added.

## 11. Deterministic progression and alternate-path safety

- All three route-choice freezes present real `RunNode` candidates and use the single `commitRunNodeChoice()` path.
- The route mutex protects only the authoritative `enterRunNode` mutation and releases before downstream presentation awaits another choice. This fixed a live Journey deadlock/rejection without changing RunSystem.
- Secondary actions cannot commit a route, and a mapped clip is not replayed after a secondary-action return.
- First and second refuges retain rest, shop, clan, skills, loot, and Continue. The final refuge remains a story node and exposes no refuge management.
- `bois_clair_saved` requires village-defense victory, `missionSuccess === true`, and `missionGreed !== true`; greed/raid states resolve no CIN-6A aftermath and fall back safely.
- `serpent_route_ending` requires Serpent-captain victory plus `serpentGeneralDefeated === true`; Lion Trial resolves no Serpent ending.
- Skip, reduced motion, missing media, decode/playback failure, and timeout alter presentation only. Dialogue, route choice, refuge, combat, rewards, state effects, and ending continue.
- No runtime MiniMax, runtime provider API, runtime AI, API key, generated truth, video parsing, filename-derived state, or media-authored outcome was added.

## 12. Real Chromium QA

All 15 local masters loaded and decoded in real Chromium at 1920x1080 with ready state 4 and no media error. Each was also exercised through a real Skip and cleaned its overlay. Representative natural-end tests covered:

- JOURNEY: `forest_journey_tension`, 9 seconds
- ROUTE_FREEZE: `valmir_route_fork`, 10 seconds, readable held final frame
- HERO: `bois_clair_arrival`, 20 seconds
- REFUGE: `first_refuge_arrival`, 10 seconds
- ENDING: `serpent_route_ending`, 18 seconds

The Journey QA lab proved real local-video Skip, unavailable-media fallback, and reduced-motion bypass all reach agency with zero cinematic/Journey residue. The Skip trace was `IDLE → PLAYING → FREEZE → AGENCY → TRANSITIONING → DISPOSED`.

The actual DEV golden path ran from camp to terminal completion with seed/profile 42. It exercised camp departure, Alaric audience, shared forest tension, refugee fork, first refuge arrival and departure, Valmir fork, Bois-Clair arrival, real village-defense combat, saved aftermath, real second refuge, witnesses and third fork, ruins context, real ruins combat, Shadow Signs, final dossier, Lion Judgement, Serpent General reveal, real Serpent combat, post-combat dialogue, natural Serpent ending, and epilogue. The three real route choices selected spider nest, old shrine, and ruins; the saved clip appeared only after authoritative victory. `lion_champion_reveal` and `lion_trial_route_ending` did not appear. Each combat started once and the ending occurred once. The run ended at `Jugement du Sceau — Aucune route ne poursuit cette chronique.`

The browser state-selection probe loaded the actual TypeScript module and returned:

- saved defense → `bois_clair_saved`
- greed defense → no clip
- village raid/sacrificed-compatible state → no clip
- Shadow reveal-compatible and conceal-compatible pre-dialogue profiles → the same neutral `shadow_signs`
- Serpent victory → `serpent_route_ending`
- Lion Trial → no Serpent ending

The temporary browser probe page was removed after the check. Chromium emitted Vite debug connection messages only: no warnings or errors.

## 13. Validation results

| Validation | Result |
|---|---|
| Focused CIN-6A/census/Journey/shot/media tests | 10 files, 164 tests PASS |
| Full `npm test` | 89 files, 2,032 tests PASS |
| `npx tsc --noEmit` | PASS, no diagnostics |
| `npm run build` | PASS, 110 modules transformed |
| CIN-5 census validator | PASS, 64 entries, 21 route nodes, 3 forks |
| CIN-4 shot/staging validators | 15/15 specs PASS, 40 shots |
| CIN-4 media validators | 15/15 new sequences PASS |
| Existing-media validators | 3/3 PASS |
| ffprobe | 18/18 production videos PASS |
| `git diff --check` | PASS |
| Secret audit | PASS |

The build retains its pre-existing large-chunk advisory; it is not a CIN-6A failure.

## 14. Secret, scope, and game-truth audit

`.env.local` is present, ignored, and untracked. The tracked diff has zero secret-pattern hits. Raw candidates, task metadata, provider responses, review frames, contact sheets, chain frames, temporary URLs, and ffmpeg intermediates are ignored. No authorization header or secret was added.

Unchanged truth/runtime domains were checked directly: `src/game/runSystem.ts`, `src/game/types.ts`, `src/game/store.ts`, `src/game/lionVerdict.ts`, `src/game/lionFinale.ts`, `src/game/content.ts`, and all `src/combat/` files have no diff. Campaign topology, Conduct, reputation, dialogue choices/effects, combat configs/IDs, damage, skills, AI, rewards, save schema, CombatStage, CasterMotion, and VFX are unchanged.

## 15. Exact CIN-6A files changed

- 15 new specs under `tools/cinematics/specs/cin6a/`.
- 15 new MP4 masters under `public/assets/cinematics/`.
- `public/assets/cinematics/manifest.json`.
- `src/cinematics/Cin6aPresentation.ts` and its test.
- `src/cinematics/CinematicPlayer.ts` and its test.
- `src/cinematics/CinematicRegistry.test.ts`.
- `src/cinematics/JourneyQaScenarios.ts` and its test.
- `src/game/GameApp.ts`, `src/game/cin2CampaignBridge.test.ts`, and `src/game/cin6aVerticalIntegration.test.ts`.
- `src/journey/JourneyCampaignBoundary.ts` and its test.
- `src/journey/JourneyPresentationResolver.ts` and its test.
- `tools/cinematics/assemble_sequence.mjs`.
- `tools/cinematics/campaign_cinematic_census.test.mjs`.
- `tools/cinematics/cin4_media.test.mjs`.
- `tools/cinematics/cin4_shot_spec.mjs` and its test.
- `tools/cinematics/compose_shot.py` and its test.
- `tools/cinematics/validate_campaign_cinematic_census.mjs`.
- `docs/reports/cin-6a-video-generation-log.md` and this report.

Concurrent out-of-scope untracked pose artifacts (`tmp_pose_focus/`, `tmp_pose_metrics.txt`, `tmp_pose_montage/`, and `tools/combat-poses/`) were not edited, deleted, or included in CIN-6A accounting.

## 16. Known limitations and readiness

- All new masters are intentionally silent; final score/ambience architecture is deferred.
- `bois_clair_sacrificed` and `lion_trial_route_ending` are intentionally deferred to CIN-6B. Their paths remain semantically safe through no-clip fallback plus the existing `lion_champion_reveal` where applicable.
- Browser combat was completed with the explicit DEV-only golden-path QA victory controls after loading each real tactical encounter; tactical combat mechanics were not changed or requalified by CIN-6A.
- TravelView remains the normal production default. Journey still requires DEV selection; CIN-7 owns any default switch.

All CIN-6A hard gates pass. The representative Serpent golden path is cinematically complete from opening through ending and is safe for the deferred alternate P0 route.

`READY_FOR_CIN_6B: YES`

`COMMIT: NO`

`PUSH: NO`
