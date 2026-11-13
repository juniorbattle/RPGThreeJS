# Musique propre à chaque plateau — esquisses complètes, verdict et amendement proposé (2026-11-13)

| Champ | Valeur |
| --- | --- |
| TASK | `PLATEAU-MUSIC-1` (run `claude-plateau-music-20261113T0730Z`) |
| DOMAIN | media (music, synthesized by code) |
| BASELINE | `3be080ab`, `dev` |
| BRANCH | `claude/confident-noether-c84d79`, published to `origin/dev` |
| HEAD | the commit that adds this report |
| STATUS | review: awaiting the operator's listening and the approval of the drafted amendment |
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

MEASURES_PLACEHOLDER

## Limits and next steps

- `UNDECIDED` Every question of the draft (amendment, identities by ear, odd metres in combat, fanfares, the final act's two faces, boss signatures A/B/C, the entity, other bosses' entries, per-plateau map and refuge ambience, timbres).
- After approval: a dedicated amendment task applies set 1.23.0 and records its baseline; then `PLATEAU_MUSIC_IN_GAME = true`, the two wiring tests updated if they then see a second argument, and one browser check with a real gesture through one map, one dialogue, one combat and one boss of each part.
- Option B of the signatures also needs, on the FX side, a recipe variant per boss: a mark's identity is fixed by its recipe, and the post-demo bosses share their signature skills.
- The ambiences of the six new biomes belong to the parallel session; `ambience.ts` and `arenaThemes.ts` were not touched.
