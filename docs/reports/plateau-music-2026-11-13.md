# Musique propre à chaque plateau — esquisses complètes, verdict et amendement proposé (2026-11-13)

| Champ | Valeur |
| --- | --- |
| TASK | `PLATEAU-MUSIC-1` (run `claude-plateau-music-20261113T0730Z`) |
| DOMAIN | media (music, synthesized by code) |
| BASELINE | `3be080ab`, `dev` |
| BRANCH | `claude/confident-noether-c84d79`, published to `origin/dev` |
| HEAD | the commit that records this evidence (after `ae22c173`) |
| STATUS | validated: the operator validated the draft as is on 2026-11-13 (« J’écoute et je valide »); awaiting the dedicated task that applies amendment 1.23.0 |
| MERGED_IN | `dev` |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | NONE in play. The game still asks the Lion's tracks everywhere: `PLATEAU_MUSIC_IN_GAME = false`, and the owner calls the music host exactly as before when no part is named. Dev builds gain an « Esquisses » section in the listening lab. |
| CANONICAL_DOCS_UPDATED | `docs/content/drafts/PLATEAU_MUSIC_DRAFT_2026-11-13.md` (draft, À VALIDER). No contract touched. |
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

No browser check of the game itself: nothing in play changes while the switch is off. The lab section was driven by its unit test and the engine by the offline renders above.

## Limits and next steps

- `APPROVED DECISION` (2026-11-13, the draft validated as is) Every question takes its recommendation: amendment 1.23.0 as worded without option B; the four identities as written; odd metres kept in combat; shared fanfares and title; the Tournament for the arena's fights only; boss signatures as musical entries only, the cue table untouched; the entity's motif in the breach's bridge; secondary bosses on their part's entry; shared map and refuge ambiences; timbres as they are. The parent session records the operator decision.
- Next: a dedicated amendment task applies set 1.23.0 (PRESENTATION_AND_MEDIA, AUTHORING_AND_QA, README and manifest; no COMBAT_AND_VFX bullet) and records its baseline; then `PLATEAU_MUSIC_IN_GAME = true`, the two wiring tests updated if they then see a second argument, and one browser check with a real gesture through one map, one dialogue, one combat and one boss of each part.
- Option B of the signatures, not retained, would also need, on the FX side, a recipe variant per boss: a mark's identity is fixed by its recipe, and the post-demo bosses share their signature skills.
- The ambiences of the six new biomes belong to the parallel session; `ambience.ts` and `arenaThemes.ts` were not touched.
