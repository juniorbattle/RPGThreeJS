# CIN-6.7.1 Dialogue Staging Audit

## Scope and authority

The audit is derived from canonical `DialogueSequence` entries plus their real campaign references in RunSystem nodes, combat pre/post hooks, post-node ATE rules, reputation events, and new-game flow. The registry contains 71 reachable dialogue sequences and is treated as a safe exhaustive campaign superset. Presentation data never copies dialogue links, effects, choice meaning, requirements, or outcome previews.

The structured output is `tools/cinematics/specs/narrative_dialogue_staging.json`. Regenerate and validate it with:

```powershell
npm.cmd run cinematics:validate-narrative-staging -- --write
```

## Result

| Measure | Result |
|---|---:|
| Reachable dialogues | 71 |
| Staged dialogues | 71 |
| Unmapped dialogues | 0 |
| Canonical dialogue steps | 247 |
| Staged dialogue steps | 247 |
| Unmapped steps | 0 |
| Per-step staging records | 247 |
| Distinct visual compositions | 75 |
| Used layout profiles | 9 |
| Explicit intentional offscreen steps | 12 |
| Unresolved media/speaker conflicts | 0 |

Every staging entry records reachable contexts, tableau family, speakers, canonical step order, visual composition, step-to-composition mapping, still and video presentation strategies, still and video cast ownership, layout, choice count, presentation segment count, effect-owner count, offscreen reason when applicable, and future media need.

## STATIC CAST OWNERSHIP

Every step resolves one explicit ownership mode. `VIDEO_OWNS_CAST` suppresses runtime full-body actors on healthy moving or held video. `STAGE_OWNS_CAST` supplies canonical full-body assets for still scenes and same-tableau video fallback. `ENVIRONMENT_ONLY` keeps cast absent where the authored beat requires no visible character. The video and fallback paths retain identical dialogue, choices, effects, and card layout.

## OPENING CLAN INTRO

The opening `acte_ouverture` tableau stages Séraphine, Maelor, Alistair, Marian, Kestrel, and Elara as one stable six-member company composition. One speaker is `ACTIVE`; the other five remain `LISTENING`. Speaker changes update emphasis on the existing actor elements and do not rebuild or reposition the tableau.

## VISUAL PHASE GRANULARITY

The audit now separates 247 per-step staging records from 75 distinct visual compositions. A generic exchange shares one composition while its location, camera, cast, and authority relationship remain stable. A step may still select its declared card lane and speaker emphasis without manufacturing a new scene composition. Bespoke phase changes remain for material changes in camera, group, authority, agency, or geography.

## Layout profiles

The audited profiles are drawn from a small reusable vocabulary:

- `DIALOGUE_CARD_LEFT` / `DIALOGUE_CARD_RIGHT`
- `DIPLOMATIC_DIALOGUE_LEFT` / `DIPLOMATIC_DIALOGUE_RIGHT`
- `ADVISER_DUAL_CHOICE`
- `GROUP_DIALOGUE_LEFT` / `GROUP_DIALOGUE_RIGHT`
- `STATIC_EVENT_DIALOGUE`
- `THREAT_SUBTITLE`

Boundary-only profiles add `SINGLE_ROUTE_RIGHT_CUE` and `TWO_PATH_SPATIAL_CHOICE`. `FALLBACK_DIALOGUE` exists as a named recovery profile and does not act as an arbitrary centred normal mode.

## Director invariants

The validator and focused tests enforce:

- each reachable sequence and step has one staging decision;
- each step has an explicit layout profile while related steps may share one stable visual composition;
- every speaker uses `IN_SCENE`, `SPEAKER_FOCUS`, `OFFSCREEN_CONTEXTUAL`, or `STATIC_RESTAGE`;
- each choice remains attached to its canonical step;
- each canonical step owns its effects exactly once;
- presentation segments join back to the exact canonical text;
- still and video plans retain identical step, choice, effect, layout, and segment semantics;
- moving and held video do not acquire full-body sprite overlays;
- contextual Cedric and Garen steps are staged only after their recruitment flags resolve them into the canonical sequence.

## Bespoke staging

The Audience declares five stable phases: Alaric authority, company response, adviser exchange, player agency, and response. It stages the four canonical speakers and keeps both adviser perspectives visible for the political choice.

Camp departure, forest threat, forest aftermath, and Valmir fork also retain bespoke composition. Every other sequence receives a coherent generic tableau derived from its canonical scene art, stable actor set, family, step sides, and choice ownership. Generic staging remains scene-first, holds its actors and camera across the exchange, and uses explicit left/right safe zones rather than a full-width or accidental centre fallback.

## Canonical truth checks

No file containing DialogueSequence content, RunSystem campaign truth, rewards, reputation, recruitment rules, save schema, or finale logic was changed. Dialogue pagination occurs inside `DialogueView` presentation state; effects apply through the existing step guard and choices through the existing latch. The full campaign browser run confirms route commitment, combat entry, post-combat dialogue, and contextual ATE handoff remain singular.
