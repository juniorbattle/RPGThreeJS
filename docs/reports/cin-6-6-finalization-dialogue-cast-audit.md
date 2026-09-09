# CIN-6.6 Dialogue and Cast Audit

## Contract

Cast selection follows dialogue truth, event truth, player representation, guaranteed cast, then supporting cast. Sage Seraphine and Maelor are the two core advisers and normally represent the player company in high-stakes diplomacy.

The machine-readable source is `tools/cinematics/specs/cinematic_dialogue_cast_audit.json`. Its validator passes all six associations. No dialogue lines and no choice/effect semantics changed.

## Results

| Dialogue / cinematic | Classification | Cast result | Status |
| --- | --- | --- | --- |
| `camp_departure` / `camp_departure` | `CINEMATIC_DIALOGUE` | Maelor, Alistair, and Marian all visible in V3 | aligned |
| `lion_briefing` / `alaric_audience_arrival` | `CINEMATIC_DIALOGUE` | Alaric, Alistair, Seraphine, and Maelor visible; Lion Champion deliberately offscreen | aligned |
| `village_choice` / `bois_clair_arrival` | `AGENCY_DIALOGUE` | current media lacks Marian, Kestrel, Seraphine, and Maelor | future remaster proposal |
| `shadow_signs` / `shadow_signs` | `AGENCY_DIALOGUE` | Seraphine and Elara visible; branch-only Alistair/Maelor have explicit offscreen reasons | aligned |
| `final_refuge` / `final_refuge_dossier` | `CINEMATIC_DIALOGUE` | Marian missing from the current visual cast | future remaster proposal |
| `lion_finale_judgement` / `lion_judgement` | `AGENCY_DIALOGUE` | Alaric and Champion visible; both player advisers absent | future remaster proposal |

Summary: six linked dialogues, three aligned, three mismatches found, and two prior presentation mismatches corrected by the authorized V3 work. Audience V3 is the material correction in this pass: the early mandate now foregrounds both advisers without turning it into the final judgement tableau.

## Offscreen and optional-character safety

- Lion Champion is explicitly offscreen in `lion_briefing` because Alaric owns the early mandate and the scene must preserve adviser readability.
- Alistair and Maelor are explicitly offscreen for the unselected `shadow_signs` branch until their deterministic branch text is active.
- Cedric and the lancer are excluded from the reusable pre-recruitment V3 casts.
- No optional or conditional recruit is encoded into Camp, Audience, or Valmir Fork V3.

## Text review proposal

| Classification | Count | Proposal |
| --- | ---: | --- |
| `AGENCY_DIALOGUE` | 3 | Keep choice, intent, strategy, and consequence text. |
| `CINEMATIC_DIALOGUE` | 3 | Keep text connected to the held cinematic scene. |
| `VISUAL_REPLACEABLE` | 1 | Consider shortening `village_choice` spatial description only after a future remaster proves both directions visually. |
| `REDUNDANT_EXPOSITION` | 1 | Review two `final_refuge` steps for compression; retain all facts until narrative review. |

No text was deleted automatically. The structured audit records exact step IDs and proposals for later operator review.
