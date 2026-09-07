# CIN-6B P0 alternate-state and Lion Trial production

## 1. Baseline and preflight

| Gate | Result |
|---|---|
| Branch | `main` |
| Original production baseline | `b1ba1e36d3b21b2b008808ea007445b3564fe3cb` |
| Local HEAD at preflight | exact match |
| `origin/main` at preflight | exact match after `git fetch origin main` |
| Final integration baseline | `47fab2ac8310e2c9b919b60ad184bf7619db845d` |
| Final `HEAD == origin/main` | PASS |
| Baseline drift | `ACCEPTED` by operator |
| Accepted merge base | `b1ba1e36d3b21b2b008808ea007445b3564fe3cb` |
| Accepted intervening commits | `6d543f5` Combat Pose + Unit Motion Phase B; `47fab2a` Playwright-profile ignore tidy |
| Initial worktree | clean |
| Census | `tools/cinematics/specs/campaign_cinematic_census.json` |
| Census SHA-256 | `b3ee675cccf87630c004ce00ba3c168ac64e8a50d92b6dbf07ed0ab625021c82` |
| Census validator | PASS: 64 entries, 17 prioritized P0 primary entries, 20 ordered P0 targets including reuse |
| Existing CIN-6A production media | present |
| Initial manifest | 19 descriptors |
| Approved Champion SHA-256 | `2d581e76e5cc0a37d4633fd6d7166210780da55475f54abadfd90aedaf30b04c` |
| Both requested masters before production | absent |
| Canonical character root | `public/assets/characters/pixel/full/` |
| Canonical facing | `SCREEN_RIGHT` |
| MiniMax key | present in ignored, untracked `.env.local`; value never printed |
| Production pipeline | CIN-4 compositor, shot validator, last-frame extractor, assembler, MiniMax client and media validator present |
| ffmpeg / ffprobe | PASS from ignored local toolchain |
| Production presentation default | `TravelView` unchanged |
| Journey | DEV-selected |

All original production preflight stop conditions passed. The existing global production triggers and CIN-6A Journey mappings were audited before integration and were not broadened or rewritten. The operator subsequently accepted `47fab2ac8310e2c9b919b60ad184bf7619db845d` as the final integration baseline. The original baseline is its exact merge base and ancestor; the two intervening commits are intact, and all integration validation was repeated against the accepted final baseline.

## 2. Exact scope and accounting

The committed `productionBatches[id="CIN-6B"]` contains three batch items:

| Order | Semantic target | Kind | Action | Runtime ID |
|---:|---|---|---|---|
| 1 | `state:bois_clair:sacrificed` | `STATE_VARIANT` | `PRODUCE` | `bois_clair_sacrificed` |
| 2 | `content:lion_chief:reveal` | `APPROVED_EXISTING` | `VERIFY_ONLY` | `lion_champion_reveal` |
| 3 | `state:lion_trial:ending` | `UNIQUE` | `PRODUCE` | `lion_trial_route_ending` |

Production accounting is exactly two new P0 masters and one verify-only batch item. No P1 adaptive content, new reveal, replacement CIN-6A asset, score version, or additional cosmetic take was generated.

## 3. Authoritative game-truth audit

### Bois-Clair

`village_choice` owns the objective. Village defense sets `missionSuccess=true` and launches `village_defense`; securing the stores sets `missionSuccess=false`, `missionGreed=true`, and launches `village_raid`. Cinematic selection remains downstream of the actual combat result.

The exact presentation resolver is:

- sacrificed: `victory === true && combatId === 'village_raid' && missionGreed === true`;
- saved, unchanged: `victory === true && combatId === 'village_defense' && missionSuccess === true && missionGreed !== true`;
- otherwise: no aftermath cinematic.

This prevents a flag-only or pre-combat trigger. Defense with contradictory saved/greed flags fails closed. A victorious raid with the historical greed flag selects only the sacrificed variant, matching the authoritative event/combat path. Post-combat dialogue, state effects, and second-refuge progression remain after the presentation seam and execute exactly once.

### Lion Trial

`resolveCompletedLionRoute` remains the authoritative completed-route resolver. The new ending is eligible only when all of these are true:

`victory === true && combatId === 'lion_chief' && lionTrialWon === true && resolveCompletedLionRoute(...) === 'lion_trial'`.

That condition works after either voluntary or route-required/non-voluntary Lion Trial because it encodes the shared completed truth rather than the cause of the trial. `lion_champion_reveal` remains a pre-combat presentation only and cannot enable the ending. The ending is inserted after the existing `lion_trial_aftermath` dialogue and before the existing epilogue.

Serpent and Lion ending selection use the same authoritative route precedence. `serpent_route_ending` additionally requires a victorious `serpent_captain`, `serpentGeneralDefeated=true`, and completed route `serpent_pursuit`. Contradictory legacy flags therefore follow current finale precedence rather than a new presentation-specific rule.

No flag, combat result, route, dialogue effect, save value, or epilogue fact is written by cinematic code.

## 4. Shot design and source QA

### Bois-Clair sacrificed

The three-shot, 18-second HERO uses `bois_clair_burning_stage.webp`, the same geography as the arrival and saved material. It progresses from an empty road and isolated resident, to secured stores contrasted with human cost, to a stable somber handoff. It does not add casualties, a massacre, a new landmark, rescue celebration, Serpent finale, or later-route outcome.

`bois_clair_arrival`, `bois_clair_saved`, and the new sacrificed sequence were compared for architecture, road/building geography, palette, lighting family, damage language, ground plane, and character scale. Smoke, population, and mood change legitimately with state. `BOIS_CLAIR_ENVIRONMENT_CONTINUITY: PASS`.

### Lion Trial route ending

The three-shot, 20-second HERO uses the canonical epilogue environment and canonical Alaric/Champion assets. It shows a living but defeated Champion yielding and Alaric acknowledging the lawful result. It does not show Alaric defeated, Champion killed, Serpent General defeated, a Serpent artefact, a disclosure choice, or a cause-specific trial setup.

`lion_judgement` and `lion_champion_reveal` were used as continuity references. Alaric identity, Champion identity, crown, staff, sword, Lion palette, left/right relationship, relative scale, and ceremonial tone remain coherent. `LION_FINALE_CROSS_VIDEO_CONTINUITY: PASS`.

### Character-scale doctrine

All relevant source canvases are 640x768, but transparent-trimmed visible bounds differ. The layout was derived from visible bodies, intended physical stature, ground plane, camera distance, and perspective—not source canvas height.

| Character | Trimmed visible bounds | Authored same-plane display |
|---|---|---|
| villageoise | 297x652 | 620 px wide shot; 680 px medium/chain |
| Maelor | 466x652 | 700 px medium/chain |
| Alaric | 491x651 | 680 px wide; 820 px medium/chain |
| Lion Champion | 510x651 | 620 px wide; 750 px medium/chain |

The Alaric/Champion height ratio changes only 0.32% across the deliberate framing change. Every multi-character frame shares an explicit ground plane and plausible relative stature. `CHARACTER_SCALE_CONSISTENCY`, `RELATIVE_CHARACTER_HEIGHT`, `GROUND_PLANE_ALIGNMENT`, `PERSPECTIVE_SCALE`, `CROSS_SHOT_SCALE_CONTINUITY`, `NO_OVERSIZED_CHARACTER`, `NO_UNDERSIZED_CHARACTER`, and `NO_COLLAGE_SCALE_DEFECT` all PASS.

Both committed specs passed `validate_shot_spec.mjs --require-sources` with zero warnings and zero errors. All source previews passed identity, facing, screen direction, weapon/prop, composition, grounding, environment, truth, and scale checks before paid generation.

## 5. Sequential production and retries

Bois-Clair was fully generated, reviewed, assembled, promoted, technically validated, and runtime-tested before Lion Trial generation began.

| Runtime ID | Selected shots | Attempts | Targeted retries | Result |
|---|---:|---:|---:|---|
| `bois_clair_sacrificed` | 3 | 4 | 1 | PASS |
| `lion_trial_route_ending` | 3 | 5 | 2 | PASS |
| Total | 6 | 9 | 3 | PASS |

The Bois-Clair retry corrected an attempt where Maelor reversed facing and camera/scale drifted. Lion Trial retries corrected only the Champion sword behavior: one upright lift and one horizontal rotation at the ending frame. No attempt exceeded the autonomous limit. Rejected candidates remained ignored and were not promoted.

Exact task IDs, source and prompt hashes, reported usage, raw/master hashes, chain evidence, and decisions are recorded in `docs/reports/cin-6b-video-generation-log.md`.

## 6. Visual acceptance

Every selected shot was inspected at first, 25%, 50%, 75%, and last frames. Each exact chain source passed nonblack, nonblank, identity, anatomy, facing, weapon, background, composition, scale, grounding, and motion-blur review before propagation. Sequence cuts and chain boundaries were inspected.

| Runtime ID | Canonical identity | Facing | Direction | Scale | Grounding | Anatomy | Weapon | Environment | Camera | Action | Continuity | No text/watermark | Final frame | Narrative/truth |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `bois_clair_sacrificed` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `lion_trial_route_ending` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

Bois-Clair chain boundary mean absolute difference is 5.7844; Lion Trial is 4.7154. Final frames are sharp, stable, readable, and suitable for their existing dialogue/epilogue handoffs.

## 7. Final media and budget

| Runtime ID | Seconds | Bytes | SHA-256 |
|---|---:|---:|---|
| `bois_clair_sacrificed` | 18 | 20,858,964 | `db07031a3105fb31280abe3aca026cb74e4612e2aa44f7023b5401847322f1a4` |
| `lion_trial_route_ending` | 20 | 19,773,930 | `34f023ac0313e622a82d53c955e63e1e56a62eb4bd3bfdef9580196fcff178b2` |

Both masters pass the CIN-4 media validator: MP4, H.264 High, yuv420p, 1920x1080, square pixels, 16:9, 24 fps, silent, zero rotation, valid duration, nonblack/nonblank last frame, and real Chromium decode.

- New CIN-6B: 38 seconds, 40,632,894 bytes, 1,069,286.68 bytes/second.
- Cumulative production library: 271 seconds, 298,784,278 bytes across 20 production masters.
- Cumulative rate: 1,102,525.01 bytes/second.
- Pre-CIN-6B empirical rate: 1,107,945.85 bytes/second.
- CIN-6B rate delta from the current empirical rate: -3.49%.
- CIN-5 full-P0 projection: 272 seconds, 342,798,847 bytes.
- Actual projection delta: -1 second and -44,014,569 bytes (-12.84%).

No arbitrary compression pass was applied. Both new masters are silent; generated speech, vocals, music, and random per-shot score were not retained.

## 8. Manifest, presentation mapping, and preloading

The manifest now contains exactly 21 descriptors: one `qa-placeholder` and 20 local production masters. It contains exactly one descriptor for each new runtime ID, ffprobe-backed durations of 18,000 and 20,000 ms, no remote URL, and no production placeholder. All production paths exist and decode.

The new presentation mappings are deliberately state/result-based rather than RunNode-wide:

- victorious `village_raid` + `missionGreed=true` → `bois_clair_sacrificed`;
- victorious `lion_chief` + `lionTrialWon=true` + completed route `lion_trial` → `lion_trial_route_ending`;
- victorious `serpent_captain` + `serpentGeneralDefeated=true` + completed route `serpent_pursuit` → existing `serpent_route_ending`.

Existing global pre-combat trigger `lion_chief` → `lion_champion_reveal` remains unchanged. No new generic trigger or duplicate Journey-node mapping was added. Existing preload behavior continues to load only plausible immediate mapped boundaries; neither state-specific post-victory ending is eagerly preloaded from a distant fork, and the whole manifest is never preloaded.

## 9. Real Chromium QA

Both new masters were exercised through the real local video player:

- decode and natural end: PASS;
- visible decoded final-frame hold: PASS;
- release and DOM cleanup: PASS, zero residual overlay nodes;
- Skip: PASS, presentation only;
- reduced motion: PASS, downstream action preserved;
- missing ID: PASS, `unavailable` and cleanup;
- broken media with a dialogue fixture: PASS, real dialogue opened after failure.

The DEV-only reduced-motion QA fixture was narrowed to the selected real runtime ID so each new master can be tested directly; this does not affect production presentation selection.

### Reachable Bois-Clair negative path

A full DEV Cinematic Journey run used all three real RunSystem forks and real tactical combat boundaries. At Bois-Clair the player chose “Sécuriser les réserves,” loading actual `village_raid` combat. The DEV victory control was used only after the tactical scene loaded. The result then played only `bois_clair_sacrificed` to natural completion, followed by the existing raid aftermath and the real interactive hostile second refuge. `bois_clair_saved` did not play, the aftermath did not duplicate, combat loaded once, victory resolved once, and state effects were unchanged.

### Reachable Lion Trial path

The same Journey run continued through Shadow Signs and the story-only Final Refuge, then took the current low-conduct rejected-claim route into non-voluntary Lion Trial. `lion_champion_reveal` played before the real `lion_chief` tactical combat. After one authoritative DEV victory, existing `lion_trial_aftermath` dialogue played first; only then did `lion_trial_route_ending` play to natural completion. The existing epilogue stated that the Seal was won under Lion law, Alaric accepted the result, and the Serpent General remained free. The route reached terminal completion exactly once.

Neither `serpent_general_reveal` nor `serpent_route_ending` played on the Lion route. Automated resolver coverage additionally proves the voluntary and non-voluntary shared ending condition, Serpent/Lion mutual exclusion, and current legacy-state precedence.

### Accepted-baseline Phase B repeat

After the operator accepted `47fab2ac8310e2c9b919b60ad184bf7619db845d`, the complete reachable negative-state/Lion Trial route above was repeated in real Chromium. It traversed three authoritative RunSystem forks, the interactive first and second refuges, the real `village_raid` battlefield, the real `lion_chief` battlefield, and the Phase B CombatStage runtime. `bois_clair_sacrificed`, `lion_champion_reveal`, and `lion_trial_route_ending` each appeared at the correct seam; both CIN-6B masters and the Champion reveal ended naturally. The trial victory produced `SCEAU GAGNÉ`, the epilogue resumed once, and the campaign terminated at `Aucune route ne poursuit cette chronique.` No saved-state or Serpent-route cinematic appeared.

## 10. Failure safety and Journey mutex regression

Cinematic playback remains awaitable presentation only. Missing media, decode failure, timeout, Skip, and reduced motion return control to the same downstream dialogue, refuge, epilogue, or chapter completion. No fallback reruns combat, commits a route, duplicates an ending, or mutates state.

The CIN-6A route-commit guard remains scoped only around authoritative `commitRunNodeChoice()` mutation. Focused and full integration tests prove that it releases before downstream dialogue, combat, cinematic, and Journey boundaries; a legitimate next boundary can commit immediately; and repeated stale clicks cannot mutate twice. No three-false-rejection fallback to TravelView was introduced.

## 11. Existing-media immutability

All five required continuity masters are byte-for-byte unchanged from HEAD:

| Runtime ID | SHA-256 |
|---|---|
| `lion_judgement` | `6ea5b12bb8c97deadbea2177725d7e3eb958ab7971361d34064729acf776e5f9` |
| `serpent_general_reveal` | `e8c918d292693e4bc7f612fc6f4fbcdb283c6d2f8095c805db287692e561a682` |
| `lion_champion_reveal` | `2d581e76e5cc0a37d4633fd6d7166210780da55475f54abadfd90aedaf30b04c` |
| `serpent_route_ending` | `f1de1f29ccc98ca66f97da94c21060d100687e4fef39b2d0378bcdea36db395c` |
| `bois_clair_saved` | `a57d9ef8ff2fbb26084066b057f89948bdfe59de22dc7f7770d6576900223b1f` |

## 12. Automated and build validation

| Validation | Result |
|---|---|
| Focused CIN-6B/Journey/finale/Bois-Clair/CombatStage/Unit Motion suite | PASS: 22 files, 333 tests |
| Full `npm test` on final current HEAD `47fab2ac8310e2c9b919b60ad184bf7619db845d` | PASS: 96 files, 2,096 tests |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS; 112 modules transformed |
| Campaign census validator | PASS |
| Both shot/staging specs with required sources | PASS; 2 specs, 6 shots, no warnings/errors |
| New sequence media validator | PASS: 2/2 |
| All production media ffprobe/hash validation | PASS: 20/20 via the manifest-backed CIN-6B production test |
| `git diff --check` | PASS |

The initially stale CIN-5 test that asserted the deferred CIN-6B files must not exist was updated to retain its real invariant: the two later targets remain outside the immutable CIN-6A batch. The committed census plan was not changed.

## 13. Diff scope, secrets, and invariants

This task's working-tree changes are limited to two specs, two local masters, manifest entries, the smallest presentation resolver/GameApp seam, focused tests, and these two reports. `src/game/runSystem.ts`, campaign topology, Lion verdict/finale semantics, conduct, reputation, dialogue choices/effects, combat configuration, damage, skills, AI, rewards, save schema, CombatStage, CasterMotion, and VFX have no task diff.

The operator accepted the forward-only integration from original production baseline `b1ba1e36d3b21b2b008808ea007445b3564fe3cb` through Phase B commit `6d543f5` to final integration baseline `47fab2ac8310e2c9b919b60ad184bf7619db845d`. `HEAD` and `origin/main` are identical at the accepted baseline. The CIN-6B working-tree diff contains no `src/combat`, CombatStage, Unit Motion, pose, CasterMotion, or VFX changes; Phase B is preserved intact. No reset, revert, partial restore, media regeneration, provider request, commit, or push was performed for synchronization.

Secret audit PASS:

- `.env.local` remains ignored, untracked, and unstaged;
- the actual key does not occur in the tracked diff or tracked files;
- no authorization header, bearer token, secret-bearing response dump, provider credential file, or temporary provider URL is tracked;
- raw/rejected candidates, review frames, contact sheets, chain sources, task response dumps, and FFmpeg intermediates remain ignored;
- no secret appears in either spec or report.

The local Vite QA server briefly rewrote the generated VFX registry to an empty DEV registry during browser execution. The exact file was restored from the verified clean baseline before final validation; no VFX diff remains.

## 14. Exact files changed

- `public/assets/cinematics/bois_clair_sacrificed.mp4`
- `public/assets/cinematics/lion_trial_route_ending.mp4`
- `public/assets/cinematics/manifest.json`
- `tools/cinematics/specs/cin6b/bois_clair_sacrificed.json`
- `tools/cinematics/specs/cin6b/lion_trial_route_ending.json`
- `tools/cinematics/cin6b_production.test.mjs`
- `tools/cinematics/campaign_cinematic_census.test.mjs`
- `src/cinematics/Cin6aPresentation.ts`
- `src/cinematics/Cin6aPresentation.test.ts`
- `src/cinematics/CinematicRegistry.test.ts`
- `src/game/GameApp.ts`
- `src/game/cin2CampaignBridge.test.ts`
- `src/game/cin6aVerticalIntegration.test.ts`
- `docs/reports/cin-6b-video-generation-log.md`
- `docs/reports/cin-6b-p0-alternate-state-production.md`

## 15. Known limitations and readiness

- Journey remains intentionally DEV-selected; CIN-7 owns the production-default switch.
- Both masters are intentionally silent; final score architecture remains deferred.
- Visual acceptance necessarily includes human frame/contact-sheet and real-browser review in addition to deterministic validators.
- P1 adaptive media remains unproduced by explicit scope.

All CIN-6B implementation, media, runtime, browser, integration, and regression gates pass on the operator-accepted final baseline. Both remaining P0 visible-state gaps are closed, both alternate truths have real browser QA, and the concurrent Phase B combat work is preserved and validated.

`ORIGINAL PRODUCTION BASELINE: b1ba1e36d3b21b2b008808ea007445b3564fe3cb`

`FINAL INTEGRATION BASELINE: 47fab2ac8310e2c9b919b60ad184bf7619db845d`

`BASELINE DRIFT: ACCEPTED`

`READY_FOR_CIN_6C: YES`

`BLOCKERS: NONE`

`COMMIT: NO`

`PUSH: NO`
