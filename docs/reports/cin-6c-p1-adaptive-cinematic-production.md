# CIN-6C P1 adaptive cinematic production

## 1. Status, baseline, and scope

| Gate | Result |
|---|---|
| Status | PASS |
| Branch | `main` |
| Required baseline | `3470b749c47c04a39092f5beb2974ab09c0ff63c` |
| Local `HEAD` | exact match |
| `origin/main` | exact match |
| Initial worktree | clean |
| Census | `tools/cinematics/specs/campaign_cinematic_census.json` |
| Census SHA-256 | `b3ee675cccf87630c004ce00ba3c168ac64e8a50d92b6dbf07ed0ab625021c82` |
| Production default | `TravelView`, unchanged |
| Journey presentation | DEV-selected, unchanged |
| Runtime AI | none |
| Commit / push | none |

The task adds the eleven ordered P1 adaptive Journey cinematics from the accepted census. It does not change campaign truth, `RunSystem`, the save schema, combat rules, VFX, static NarrativeStage styling, choice IDs, or route consequences. Existing CIN-6A/CIN-6B/P0 media remain byte-for-byte untouched.

## 2. Produced runtime IDs

| Order | Runtime ID | Kind | Seconds | Runtime content |
|---:|---|---|---:|---|
| 1 | `cedric_encounter` | MICRO | 5 | `mystery_recruit` |
| 2 | `garen_encounter` | MICRO | 5 | `mystery_lancer_recruit` |
| 3 | `serpent_road_tension` | ADAPTIVE family | 8 | Serpent road combat family |
| 4 | `shrine_reveal_context` | ADAPTIVE family | 5 | `old_shrine_event`, `mystery_shrine` |
| 5 | `injured_merchant_encounter` | MICRO | 5 | `mystery_help` |
| 6 | `abandoned_cart_reveal` | MICRO | 5 | `mystery_treasure` |
| 7 | `spider_nest_reveal` | MICRO | 5 | `spider_nest` |
| 8 | `troll_crossing_reveal` | MICRO | 5 | `troll_crossing` |
| 9 | `serpent_duelist_reveal` | MICRO unique | 5 | `serpent_duelist_trial` |
| 10 | `young_dragon_encounter` | MICRO | 5 | `mystery_dragon_roost` |
| 11 | `serpent_informant_encounter` | MICRO | 5 | `serpent_informant` |

All eleven shot specs passed `validate_shot_spec.mjs --require-sources` with no errors or warnings. Source frames were composed at 1920x1080 from the canonical environment and full-character assets, then inspected before the first provider request. Canonical character art remains unchanged.

The abandoned-cart source deliberately uses the current `mystery_help.webp` chariot/provisions geography. The census suggestion showed a treasure chest and conflicted with the current cart event. This is a presentation-source correction to current game truth; no content ID or event logic changed.

## 3. Adaptive selection and game-truth safety

The resolver consumes the content ID selected by the authoritative Journey system. It applies this precedence:

1. exact unique content mapping;
2. approved Serpent-road or shrine family reuse;
3. no cinematic.

| Hook | Authoritative content ID | Cinematic |
|---|---|---|
| before dialogue | `mystery_recruit` | `cedric_encounter` |
| before dialogue | `mystery_lancer_recruit` | `garen_encounter` |
| before dialogue | `mystery_help` | `injured_merchant_encounter` |
| before dialogue | `mystery_treasure` | `abandoned_cart_reveal` |
| before dialogue | `old_shrine_event` | `shrine_reveal_context` |
| before dialogue | `mystery_shrine` | `shrine_reveal_context` |
| before dialogue | `mystery_dragon_roost` | `young_dragon_encounter` |
| before dialogue | `serpent_informant` | `serpent_informant_encounter` |
| before combat | `spider_nest` | `spider_nest_reveal` |
| before combat | `troll_crossing` | `troll_crossing_reveal` |
| before combat | `serpent_duelist_trial` | `serpent_duelist_reveal` |
| before combat | `forest_patrol` | `serpent_road_tension` |
| before combat | `serpent_reprisals` | `serpent_road_tension` |
| before combat | `serpent_checkpoint` | `serpent_road_tension` |
| before combat | `serpent_hunters` | `serpent_road_tension` |

Already-resolved dialogue outcomes fail closed through existing historical flags. Resolved combat boundaries fail closed through `resolvedNodeIds`. The resolver reads those facts and never mutates them. `serpent_duelist_trial` receives its unique reveal before the existing pre-combat dialogue; the same held NarrativeStage owns the video and dialogue, so there is no duplicate standalone cinematic.

Candidate preloading resolves only content IDs on the immediately offered Journey nodes, deduplicates shared families, and never preloads the whole manifest.

## 4. Required adaptive matrices

| Matrix | Cases | Result |
|---|---|---|
| First adaptive matrix | injured merchant, abandoned cart, spider nest, forest patrol Serpent-family reuse | PASS |
| Second adaptive matrix | old shrine, troll crossing, unique Serpent duelist, further Serpent-family reuse | PASS |
| Final adaptive matrix | young dragon, Serpent informant, mystery shrine reuse, existing ruins behavior, `serpent_hunters` family reuse | PASS |
| Unique-over-family precedence | `serpent_duelist_trial` never resolves to `serpent_road_tension` | PASS |
| No double cinematic | one NarrativeStage/media owner per boundary | PASS |
| Cedric real dialogue path | `mystery_recruit` opens `cedric_encounter`, holds, then reaches its real choices | PASS |
| Garen real dialogue path | `mystery_lancer_recruit` opens `garen_encounter`, holds, then reaches its real choices | PASS |

`ruins_guardians` continues to use the accepted existing P0 `ruins_approach_context`; it was not remapped or regenerated.

## 5. Sequential MiniMax production

The provider was MiniMax Open Platform Direct API with `MiniMax-H3`, image-to-video first-frame conditioning, and requested 2K generation. Calls were issued one at a time. The run produced eleven selected shots from fifteen attempts: four targeted retries and four rejected candidates. No shot exceeded the three-attempt ceiling.

| Runtime ID | Attempts | Selected attempt | Decision |
|---|---:|---:|---|
| `cedric_encounter` | 1 | 1 | PASS |
| `garen_encounter` | 3 | 3 | attempts 1-2 rejected for lance rotation/drop |
| `serpent_road_tension` | 1 | 1 | PASS |
| `shrine_reveal_context` | 1 | 1 | PASS |
| `injured_merchant_encounter` | 1 | 1 | PASS |
| `abandoned_cart_reveal` | 1 | 1 | PASS |
| `spider_nest_reveal` | 1 | 1 | PASS |
| `troll_crossing_reveal` | 1 | 1 | PASS |
| `serpent_duelist_reveal` | 1 | 1 | PASS |
| `young_dragon_encounter` | 1 | 1 | PASS |
| `serpent_informant_encounter` | 3 | 2 | attempts 1 and 3 rejected for excessive background-patrol motion |

The provider reported 4,257,384 tokens and 78 generated seconds across all attempts. Exact source, prompt, task, raw-candidate, and master hashes are recorded in `docs/reports/cin-6c-video-generation-log.md`.

## 6. Final media

| Runtime ID | Seconds | Bytes | SHA-256 |
|---|---:|---:|---|
| `cedric_encounter` | 5 | 3,519,379 | `aa41a28e8b8829eb9c1c4122184ace9756f01676c2bbc903899e2f366e819a82` |
| `garen_encounter` | 5 | 3,497,854 | `2d9bb62eba5bc8c17a84beebe81ffd916d805a9063398054d424865fff5646a7` |
| `serpent_road_tension` | 8 | 11,761,479 | `33be67338637de8413738789b8a0fa067007ff65bae06081b229870817f56412` |
| `shrine_reveal_context` | 5 | 2,380,010 | `e28a9ceb996e16291594f99e2905b25da35b316b0aafe1c058dfe5818d09f48c` |
| `injured_merchant_encounter` | 5 | 3,199,828 | `a1e6de8c63d1d83d5ee51c5de6548a62b068392fdcd746a948f231d253405892` |
| `abandoned_cart_reveal` | 5 | 5,125,482 | `535b70307fa5aebadd846dc91f1bbcebbc8ad8f845c7c4d61823808def7a57f8` |
| `spider_nest_reveal` | 5 | 7,437,452 | `7f98991ba6ae91f7904355736875d822c70b5af48ebeeef64598730405e57b0b` |
| `troll_crossing_reveal` | 5 | 6,689,991 | `6ddb0044b5259870bbad78d31a57ab77dc7d47268310514ef8d7e00a2a6d3281` |
| `serpent_duelist_reveal` | 5 | 7,880,492 | `9bf2e927a0940b5b0b3d116a7dbb692bf00c1371b19fa985f154bf08527c2560` |
| `young_dragon_encounter` | 5 | 7,945,209 | `a9cf74c8372981aeb7afdde9efa2a8e5222284fe098b6be5f03223d2d22bdc91` |
| `serpent_informant_encounter` | 5 | 2,183,944 | `5a1a79ed2c9c07f1da13aa2ed872be8823de7223324dba6faa2c7dc60507c069` |

- New CIN-6C media: 58 seconds and 61,621,120 bytes.
- Cumulative production media: 332 seconds and 372,958,596 bytes.
- Manifest before: 21 IDs, comprising 20 production IDs and one QA placeholder.
- Manifest after: 32 IDs, comprising 31 production IDs and one QA placeholder.
- Manifest SHA-256 after integration: `38f42de056077aa2a46fd8bf1542c6cee3c97f7e15307e65ddea959415b596e0`.

Every new master is local MP4, H.264 High, yuv420p, 1920x1080, square-pixel 16:9, 24 fps, silent, zero rotation, and valid for its declared duration. Final production-file hashes match the selected mastered outputs.

## 7. Visual QA

All eleven selected videos were inspected at multiple frames, including the exact final frame.

| Criterion | Result |
|---|---|
| Identity | PASS |
| Facing and screen direction | PASS |
| Anatomy | PASS |
| Character scale consistency | PASS |
| Intra-shot scale continuity | PASS |
| Ground-plane alignment | PASS |
| Perspective scale | PASS |
| Environment continuity | PASS |
| Final-frame stability | PASS |
| No text, watermark, generated speech, music, or vocals | PASS |
| Game-truth visual safety | PASS |

The selected Serpent informant attempt is the least intrusive of the three allowed candidates. It preserves the Oracle and neutral pre-choice state. A subtle background-patrol continuity change remains visible; later attempts created clearer and more misleading approach motion, so attempt 2 was retained at the retry ceiling.

## 8. Real Chromium runtime QA

The browser matrix exercised all eleven targets at 1920x1080: seven real dialogue IDs and four representative combat IDs.

For every target, the exact manifest URL loaded, the video clock advanced by at least 0.706 seconds, `mediaMode=VIDEO`, `surfaceKind=VIDEO`, `VIDEO_OWNS_CAST`, zero static cast, zero automatic portraits, exactly one overlay, and a live video-frame pump were observed. Skip produced `HELD_VIDEO` with one canvas freeze surface and no premature choice. Dialogue targets then reached their real choices. Combat targets reached their existing pre-combat dialogue and handed off to exactly one combat iframe with zero NarrativeStages and zero cinematic overlays.

| Runtime behavior | Result |
|---|---|
| Unique reuse precedence | PASS |
| No double cinematic | PASS |
| Moving video | PASS |
| Held final frame | PASS; 1920x1080 canvas, stopped pump, zero residue |
| Skip | PASS |
| Reduced motion | PASS; downstream action preserved and overlay cleaned |
| Media failure | PASS; dialogue resumed with zero overlay |
| Console errors | none |
| Page errors | none |
| Request failures | none |

## 9. NarrativeStage and Audience regression gates

The existing CIN-6.7.x presentation was rerun at 1920x1080 and 1366x768 with no new CSS changes.

| Gate | 1920x1080 evidence | Result |
|---|---|---|
| Six-character body framing | 61.20% canonical body height; far-right transparent trim 59.69% | PASS |
| Four-character Audience framing | 64.80% for all four actors | PASS |
| Intentional bottom crop | opening 14.36-14.57%; Audience 16.36% | PASS |
| Speaker/listener emphasis | active 1.0; listeners 0.50 | PASS |
| Static dialogue card | 42.00 vw; top 14.00% | PASS |
| Under-character labels | 0 | PASS |
| Maelor card geography | `LEFT_UPPER`, aligned with Maelor | PASS |
| Alaric card geography | `RIGHT_UPPER`, aligned with Alaric | PASS |
| Audience choice semantics | “Accepter la mission d’Alaric.” RIGHT; advance alternative LEFT | PASS |
| Choice geometry | 18/18 exact; maximum observed horizontal delta 0 px | PASS |
| Moving/held video cast ownership | zero static actors and zero automatic portraits | PASS |

Alaric and Maelor use the same four-character tableau geometry. Speaker handoff changes opacity and card lane without changing actor scale or composition. Choice IDs, ordering in game truth, and route consequences are unchanged; only the accepted semantic lane mapping remains in presentation.

## 10. Automated validation

| Validation | Result |
|---|---|
| Focused CIN-6C/Journey/NarrativeStage/media matrix | PASS: 40 files, 420 tests |
| Full Vitest suite | 2,261 passed; 11 failed |
| Known full-suite exception | exactly 11 unchanged failures in `src/combat/vfx/CasterMotionBackCompat.test.ts` |
| New regressions | 0 |
| Campaign cinematic census | PASS: 64 entries, 11 ordered P1 targets |
| Required-source shot specs | PASS: 11/11, no warnings |
| Character scale validator | PASS: 52 canonical profiles unchanged |
| Continuity bible | PASS |
| Dialogue cast audit | PASS |
| Journey grammar | PASS |
| Visual polish audit | PASS: 31 masters, 0 blockers |
| Static dialogue browser QA | PASS at both required viewports |
| Video regression browser QA | PASS at both required viewports |
| Choice geometry comparator | PASS: 18/18, 0 px maximum delta |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS: 123 modules transformed |
| `git diff --check` | PASS |
| Secret audit | PASS: 32 changed text files scanned, zero secret-like assignments |

One first full-suite run transiently failed a PNG alpha check in the external CartoonCoffee VFX library. The same test passed in isolation, and the immediate full-suite rerun returned only the exact 11 known `CasterMotionBackCompat` failures. No VFX file is present in the task diff.

## 11. Protected scope and release readiness

The task diff does not include `src/game/runSystem.ts`, save code or schema, combat rules, VFX, canonical sprites, or static NarrativeStage CSS. All previously accepted production masters remain immutable. `TravelView` remains the production default; no runtime AI, remote media dependency, or whole-manifest preload was added.

No secret value, authorization header, bearer token, provider download URL, response dump, or credential file is tracked. Raw candidates, contact sheets, review frames, and provider intermediates remain ignored.

The working tree is ready for operator review and CIN-7 planning. No commit or push was performed.
