# CIN-6.6 Production Media Re-audit

## Method

All 20 production masters were re-inspected under the finalized doctrine: narrative clarity, dialogue/cast alignment, player-group presence, travel grammar, integrated scene, no-collage look, camera distance, scale, grounding, locomotion, environment motion, parallax, world integration, safe zone, final frame, and cross-video continuity.

The machine-readable result is `tools/cinematics/specs/cinematic_visual_polish_audit.json`. Its validator proves exact one-time coverage of every current production ID, all 16 criteria per entry, exact summary counts, and zero CIN-6C blockers.

## Classification

| Classification | Count | Runtime IDs |
| --- | ---: | --- |
| `KEEP` | 3 | `camp_departure`, `alaric_audience_arrival`, `valmir_route_fork` |
| `RUNTIME_POLISH` | 0 | none |
| `REMASTER` | 12 | `lion_judgement`, `serpent_general_reveal`, `lion_champion_reveal`, `refugees_approach`, `bois_clair_arrival`, `bois_clair_saved`, `bois_clair_sacrificed`, `witnesses_encounter`, `shadow_signs`, `final_refuge_dossier`, `serpent_route_ending`, `lion_trial_route_ending` |
| `REPLACE_WITH_FAMILY` | 5 | `forest_journey_tension`, `first_refuge_arrival`, `first_refuge_departure`, `second_refuge_departure`, `ruins_approach_context` |

The 17-item future queue is planning only. This mission did not produce or replace any of those items.

## Exact queue rationale

### Remaster

- `lion_judgement`: dialogue/cast alignment and player-group presence.
- `serpent_general_reveal`: older isolated presentation under the new integrated-scene standard.
- `lion_champion_reveal`: older isolated reveal under the new integrated-scene standard.
- `refugees_approach`: player group/travel staging and unified world integration.
- `bois_clair_arrival`: choice-scene actor coverage, two-adviser representation, and integrated progression.
- `bois_clair_saved`: consequence staging and stronger integrated continuity.
- `bois_clair_sacrificed`: consequence staging and stronger integrated continuity.
- `witnesses_encounter`: route-agency setup and guaranteed-group presence.
- `shadow_signs`: deeper integrated investigation/reaction staging.
- `final_refuge_dossier`: Marian coverage and dossier-scene continuity.
- `serpent_route_ending`: integrated company aftermath and route-ending continuity.
- `lion_trial_route_ending`: integrated company aftermath and route-ending continuity.

### Replace with reusable Journey family

- `forest_journey_tension`: replace isolated generic travel with a coherent forest-threat family.
- `first_refuge_arrival`: fold into a reusable refuge-approach/arrival family.
- `first_refuge_departure`: fold into a reusable departure/single-route family.
- `second_refuge_departure`: fold into a reusable neutral departure family.
- `ruins_approach_context`: replace isolated context with a ruins-approach family.

## Technical census

All 20 production MP4s pass ffprobe as H.264 High, yuv420p, 1920x1080, 24 fps, silent, positive duration, and zero unexpected rotation. The manifest remains 21 unique IDs including the QA placeholder. Current production bytes total 311,337,476.

The three V3 files are the only changed masters. Their final-frame samples are nonblack/nonblank and their exact hashes are:

- `alaric_audience_arrival`: `b823180582228dc2dd08592926efeb8ec58bc40bc102e238577361eac1dcb629`
- `camp_departure`: `a56678969bfb319d503be1f3f406ca2a3bef1a11bebc07db78c6fb22e6b9c0f3`
- `valmir_route_fork`: `63a4a0c3793d6e29ce8fd94b1478dfab59e40f856d53a01915e47fb9a6343261`

Operator visual acceptance remains the release gate. The re-audit itself does not authorize CIN-6C production.
