# Musique propre à chaque plateau — esquisses complètes, verdict et amendement proposé (2026-11-13)

| Champ | Valeur |
| --- | --- |
| TASK | `PLATEAU-MUSIC-1` (run `claude-plateau-music-20261113T0730Z`) |
| DOMAIN | media (music, synthesized by code) |
| BASELINE | `3be080ab`, `dev` |
| BRANCH | `claude/confident-noether-c84d79`, published to `origin/dev` |
| HEAD | the commit that records this evidence (after `ae22c173`) |
| STATUS | delivered in game: the operator validated the draft as is on 2026-11-13 (« J’écoute et je valide »); the dedicated task applied amendment 1.23.0 (`6228a34f`, baseline recorded in `052bc2ca`) and turned the switch on (`252cc189`), browser-checked; artistic acceptance by ear stays with the operator |
| MERGED_IN | `dev` |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Since 2026-11-13 the Bear, the Dragon, the Scorpion and the final act play their own map, refuge, tension, drama, combat and boss tracks in game, chiefs their entries and the Tournament its arena (`PLATEAU_MUSIC_IN_GAME = true`). The Lion, the title and the fanfares are asked exactly as before. Presentation only: no saved field, no game truth. Dev builds keep the « Esquisses » section of the listening lab. |
| CANONICAL_DOCS_UPDATED | `docs/content/drafts/PLATEAU_MUSIC_DRAFT_2026-11-13.md` (draft, VALIDÉ); contracts set 1.23.0 (`PRESENTATION_AND_MEDIA`, `AUTHORING_AND_QA`, `README`, manifest) by the dedicated task, decision `docs/autonomy/PLATEAU_MUSIC_OPERATOR_DECISION_2026-11-13.md`. |
| EVIDENCE | vitest, tsc, contracts validator, build, offline renders and their analysis; see below. Listening acceptance is the operator's alone. |

## What was asked

The operator wants each part of the game to have its own sound and musical identity. This task covers the music: a contract verdict, identities for the Bear, the Dragon, the Scorpion and the final act, audible sketches, then building once validated. The operator then asked to work without stopping until done; the build was carried as far as it goes without the operator: every track is written and playable in the lab, the game wiring is in place behind one switch that stays off until the amendment is approved.

## Contract verdict

`CURRENT FACT` Set 1.20.0 (« Post-demo moments », « Music ») says « The plateaux and the final act reuse the nine music contexts ». Set 1.12.0 lists the context sources exhaustively: the presentation surface, the combat payload's scene id and boss flag, the mood table keyed by authored scene id, and the encounter outcome for fanfares.

`CURRENT FACT` Combat and boss could pick a plateau's track from the scene id, an allowed source; each post-demo chief fights on a scene of its own. The map and refuge have no explicit plateau source. « Reuse the nine music contexts » reads either as « no tenth context » or as « the Lion's tracks ». The closed cue table holds 158 of its 160 identities, so six bosses' charge, blow and wave (18) do not fit.

`PROPOSED FUTURE DESIGN` Amendment set 1.23.0, `PRODUCTION-CONTRACTS-PLATEAU-MUSIC-1`, worded in the draft: own tracks per part for map, refuge, tension, drama, combat and boss; title, victory and defeat shared; the part read only from the durable id prefix of the presented POI, dialogue or combat scene; the Lion unchanged; option B for 18 boss signature cues and a 176-identity table.

## What was built

- `src/audio/music/plateaux/{bear,dragon,scorpion,finale}.ts`: 24 tracks (six per part) and 7 scene tracks (the entries of Borin, Kaelen, the Grand Inquisitor, the Shadow prophet and Maelor; the Tournament's arena combat and final).
- `src/audio/music/plateauTracks.ts` (track for a context, a part and a scene) and `parts.ts` (part of an id prefix, `PLATEAU_MUSIC_IN_GAME`).
- Additive engine growth: four voices (`lowChoir`, `airChoir`, `ney`, `glass`), five computed instruments (`bell`, `dulcimer`, `anvil`, `goblet`, `zill`), five rooms (`cave`, `sky`, `dune`, `city`, `void`), two modes (`phrygianDominant`, `octatonic`), four chord qualities. The director computes a part's instruments and room on its first track only; the Lion's start-up bank is unchanged.
- `UiSoundPlayer` passes the part; without one it calls `setContext(id)` exactly as before. `GameApp.setMode` and `CombatBridge.start` read the prefix, inert while the switch is off.
- Listening lab: « Esquisses » section, 31 rows; its acts are named apart so the Lion's rows keep their counts.
- `src/audio/postDemoSignatureSketches.ts`: six bosses' signature sketches outside the table, rendered offline by `tools/audio/render-signature-sketches.mjs` (`synthCues.ts` gained `scheduleDesign` and `cueNoise`).
- `tools/audio/capture.mjs`: `BASE_URL`, `JOBS=plateaux`, recording through the final limiter (`mix`).

## Evidence

Machine results on the operator's host (Windows, Chromium via Playwright, dev server on 5178). They prove the scenario measured, not the music: only the operator's ear accepts it.

| Check | Result |
| --- | --- |
| Lion byte-identical | `plateauMusic.test.ts`: tracks, two rounds of generated passes, voices, every computed sample and every room equal their digests at `3be080ab`; the ambience session's `lionAudioUnchanged.test.ts` also passes after the merge |
| Plateau tracks under the existing rules | whole bars, the Seals motif in every track, a bridge that changes tempo, key or metre and a return on the dominant (or the lowered second), map and combat loops of 60–120 s with a passage without melody, both levels in combat and boss only, every boss entry ≤ 6 s (5.0–5.7 s), reproducible passes, pitches inside each instrument |
| Parts and wiring | prefixes `bear-`/`bear_` … read as their part, every demo id as the Lion; scene tracks for the five chiefs and the Tournament; with the switch off the game calls `setMusicContext(id)` exactly as before (existing wiring tests unchanged) |
| Loudness (integrated LUFS, default volume, engine recorded) | every plateau track within 0.8 LU of the Lion's same context: map -23.0 (Lion -22.9), refuge -26.7 to -26.9 (-26.8), tension -25.4 to -25.9 (-25.7), drama -26.0 to -26.3 (-26.1), combat reflection -26.2 to -27.5 (-26.7), combat action -22.4 to -23.2 (-22.5), boss -22.0 to -22.2 (-22.1). The first render was 5–8 dB low for the Bear and the Dragon's reflection sat above its action; gains and reflection voices were corrected and re-rendered |
| Limiter | each part's boss at action, music volume 1, through `createMix`: sample peak -1.4 (Bear), -3.0 (Dragon), -2.4 (Scorpion), -3.4 dBFS (final act), under the -1 dBFS ceiling |
| Main thread | `tools/audio/plateau-check.mjs`: 31 tracks played in turn, levels moved, each part's bank and room computed on first need: no long task; three cold starts: no long task |
| Boss signature sketches | charge 1.35–1.72 s, blow 0.85–2.05 s, wave 1.65–2.30 s, all ≤ 2.5 s; cue table unchanged at 158 identities |
| Contracts | LOCKED gate prints nothing; `contracts:validate` passes |

Renders (ignored path, worktree): `tmp/plateau-music/wav` (45 files), `tmp/plateau-music/lion` (7 Lion references), `tmp/plateau-music/signatures` (6), `tmp/plateau-music/ecoute` (one listening tour per part, the boss entries, the signatures).

Validation after merging `origin/dev` (the post-demo combat ambiences and plateau poses; one conflict in `AudioListeningLab.ts`, resolved by keeping both the music sketches and the plateau ambiences):
- LOCKED gate: prints nothing. `npm run -s contracts:validate`: passes.
- `npx tsc --noEmit`: clean.
- `npx vitest run`: 3429 passed, 10 failed in 4 files, all the known missing Git-ignored media of a fresh worktree (`spritesheetPng.test.ts` megapack PNGs, `cin6c_p1_production`, `cin6ea3_pilot_e_regate`, `minimax_task_checkpoint`); no audio, UI or wiring test fails.
- `node --test tools/qa/qa-job.test.mjs`, alone: 26 passed.
- `npm run -s build`: passes. The lazily loaded music chunk (`MusicDirector-*.js`) is 122 kB, 31.5 kB gzip, the plateaux's tracks included; it still loads only on the first real gesture.
- `git diff --check`: clean.

No browser check of the game itself at that stage: nothing in play changed while the switch was off. The lab section was driven by its unit test and the engine by the offline renders above. The game check follows in « In game since set 1.23.0 ».

## In game since set 1.23.0 (2026-11-13)

Dedicated task `PRODUCTION-CONTRACTS-PLATEAU-MUSIC-1`, run `claude-plateau-music-amend-20261113T1524Z`, branch `claude/plateau-music-amend` from `origin/dev` `c89df86f`.

- **Decision**: OD-2026-11-13-E, `docs/autonomy/PLATEAU_MUSIC_OPERATOR_DECISION_2026-11-13.md` (`0f61a39e`), with the operator's words.
- **Review**: contracts-guardian on the actual diff before the commit: PASS WITH WARNINGS, nothing substantive. The approved English text is applied word for word; the only correction taken is the manifest's `supersededRule`, which now names the 1.20.0 sentence it replaces.
- **Amendment**: `6228a34f`, set 1.23.0. It changes four files: PRESENTATION_AND_MEDIA (the « Music. » bullet), AUTHORING_AND_QA (« Plateau music evidence »), README and the manifest. There is no COMBAT_AND_VFX bullet and no option B, and the cue table stays at 158/160.
- **Baseline**: `052bc2ca` records `6228a34fd69a01406ecf0fb7168a53f92a267d7b` in AGENTS.md (set line and gate), MULTI_AGENT_PROTOCOL, RECURRING_RUN_PROMPT, the four skills that carried it, CURRENT_STATUS and the state.
- **Switch**: `252cc189` sets `PLATEAU_MUSIC_IN_GAME = true` and corrects the comments and the lab heading that still said « non branchées au jeu ». The two wiring tests now see the second argument: a Lion id gives `{ part: 'lion' }`, which `UiSoundPlayer` strips before calling the host exactly as before. They gained a Bear dialogue, a final-act dialogue, Borin's scene and the Tournament's arena.

Browser check with real clicks (dev server on 5179, the app's built-in browser, pane hidden; the first click on « QA rencontres » unlocks audio). The track is read from the dev probe `__rpgMusic()`. Each part was entered from the QA lab's « depuis une fin… » buttons and walked by clicks to its map and its chief's audience; its fights were launched from the lab on the real CombatBridge, and the Tournament's first bout from its board.

| Part | Map | Dialogue | Combat | Boss |
| --- | --- | --- | --- | --- |
| Lion | `map` (chapter end) | `refuge` (chapter end), `tension` (« Patrouille en vue ») | `combat`, `forest_route` | `boss`, entry then loop, `lion_sanctum` |
| Bear | `bear/map` (campaign map) | `bear/refuge` (arrival), `bear/tension` (Borin's audience) | `bear/combat`, `bear_mountain_pass`, ambience `bear_mountains` | `bear/boss@borin`, entry then loop |
| Dragon | `dragon/map` | `dragon/refuge` (arrival), `dragon/tension` (audience) | `dragon/combat`, `dragon_peak_trail`, ambience `dragon_peaks` | `dragon/boss@kaelen`, entry then loop |
| Scorpion | `scorpion/map` | `scorpion/refuge` (arrival), `scorpion/tension` (audience) | `scorpion/combat`, `scorpion_dune_track`, ambience `scorpion_desert` | `scorpion/boss@inquisitor`, entry then loop |
| Final act | `finale/map` (capital and Tournament board) | `finale/refuge` (Tournament opening) | `finale/combat@tournament` (real bout, ambience `tournament_arena`); `finale/combat`, `finale_burning_streets` | `finale/boss@tournament` (final); `finale/boss@maelor` (breach), entry then loop |

Also seen:
- the lab's title music stays the shared `title`, including when it reopens after a Bear fight;
- a test victory in the Bear plays the shared `victory`;
- each chapter-end screen keeps the part it ends (`bear/refuge` before the Dragon, for example);
- no console error and no server error.

Not verified:
- the sound on the operator's machine, or by ear: no listening was done in this task;
- the Action level in a plateau fight, which needs a played turn (the level path is unchanged and unit-tested);
- the Shadow prophet's entry in game (unit-tested);
- a resumed save.

Validation:
- LOCKED gate against `6228a34f`: prints nothing. `npm run -s contracts:validate`: passes.
- `npx tsc --noEmit`: clean.
- `npm test`: vitest 3430 passed, with the same 10 known failures of a fresh worktree. They come from Git-ignored media: `spritesheetPng.test.ts` and three historical `tools/cinematics` tests.
- `node --test tools/qa/qa-job.test.mjs`: 26/26.
- `npm run -s build`: passes.
- `git diff --check`: clean.
- The Lion fingerprint in `plateauMusic.test.ts` stays green.

## Limits and next steps

- `APPROVED DECISION` (2026-11-13, the draft validated as is) Every question takes its recommendation: amendment 1.23.0 as worded without option B; the four identities as written; odd metres kept in combat; shared fanfares and title; the Tournament for the arena's fights only; boss signatures as musical entries only, the cue table untouched; the entity's motif in the breach's bridge; secondary bosses on their part's entry; shared map and refuge ambiences; timbres as they are. The parent session records the operator decision.
- Done on 2026-11-13 (see « In game since set 1.23.0 »): set 1.23.0 applied without the COMBAT_AND_VFX bullet, its baseline recorded, the switch on, the two wiring tests updated, the browser check run. Next: the operator listens to each part in game and in the lab; Claude retouches on request.
- Option B of the signatures, not retained, would also need, on the FX side, a recipe variant per boss: a mark's identity is fixed by its recipe, and the post-demo bosses share their signature skills.
- The ambiences of the six new biomes belong to the parallel session; `ambience.ts` and `arenaThemes.ts` were not touched.
