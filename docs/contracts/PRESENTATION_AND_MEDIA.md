# Narrative presentation, cinematics, Journey and audio

Status: **LOCKED**.

`STATIC_TABLEAU` is the normal interactive narrative language. Stage actors as actors: authored positions, facing, look target, depth, focus, and restaging when relational/dramatic readability requires it. A speaker change alone does not require a turn or restage. Favor clear compositions, currently up to four visible actors. Background and cast ownership must be explicit; do not duplicate integrated video actors with sprites. Preserve dialogue text except explicitly authorized factual corrections, choice agency, and canonical outcomes when changing staging.

Dedicated `PRODUCTION-CONTRACTS-POI-NAVIGATION-1` / [OD-2026-10-13-D](../autonomy/POI_NAVIGATION_OPERATOR_DECISION_2026-10-13.md), set 1.2.0: the illustrated POI map becomes principal navigation. Journey/NarrativeStage retain authored continuity and handoffs; TravelView/adapters may be reused without a second truth owner. POI activation opens existing tableau/combat/refuge; resolved revisits replay no one-shot narrative/cinematic presentation or effects. Unlocked refuge services remain reusable. Cinematic video is rare and reserved for these **exactly eight** production slots:

1. `camp_departure`
2. `alaric_audience_arrival`
3. `bois_clair_arrival`
4. `bois_clair_saved`
5. `bois_clair_sacrificed`
6. `lion_judgement`
7. `serpent_route_ending`
8. `lion_trial_route_ending`

These are major, grand events. `MAIN_EVENT => CINEMATIC_REQUIRED` is superseded. No default video for enemy reveals, recruits, merchants, routine travel, or minor beats. Older MP4s or slots have no production design authority; audit their references, convert the beat to the appropriate tableau/still/other authored surface, and retire media safely. Existing files or manifest entries outside the eight are **drift**, not ninth approved slots. A slot name does not certify that its current asset meets final art direction.

Use a hold only for the exact same moment established by its preceding video; release it when place, time, encounter, situation, or activity changes. Tableau and stills preserve visual-family continuity with their locations. Fallback must preserve player agency. Audio is **DEFERRED** until narrative, presentation, cinematics, and POI navigation structure are demonstrably LOCKED and stable. Prepare an audio-specific decision then; do not infer a final audio doctrine now.

## DIALOGUE_STAGING — manual-playtest amendment

OD-2026-10-03-A / `PRODUCTION-CONTRACTS-MANUAL-PLAYTEST-1`: positions carry relational meaning, not interchangeable free slots. Planner inputs include same side, opposing side, authority, subject and speaker relationship. Show Alaric/hero alliance against the General Serpent and a Bois-Clair civilian distinct from the hero group, using a framed subset/restaging within four visible actors. Express alliance, opposition, request, authority and target without inventing relationships or canon.

Facing is authored for readability, never automatically flipped at every speaker change. Turn for a changed visual relationship, new subject, important opposition or dramatic focus; otherwise maintain a stable pose. Cast changes use a short exit -> breathing interval -> entry/restage, with bounded duration and retained agency/focus. Reduced motion uses gentle fade, short pause and/or focus continuity without large displacements.

No visible production `...` transition placeholder: use relevant authored title/text or no text. Meaningful ATE captions such as “Pendant ce temps…”, “Au même moment…” and “De l’autre côté…” are selected by simultaneity, place/group change or temporal continuity, never randomly. They introduce no new plot facts. Legitimate authored punctuation is not placeholder copy.

The mandatory pre-judgement campfire is a Journey/narrative preparation boundary under CAMPAIGN_AND_STATE, never a ninth video. The eight slots above are structurally approved and their count/IDs remain closed; artistic media work remains external to recurring runs.


## Bounded UI FX exception — OD-2026-10-18-F

Dedicated `PRODUCTION-CONTRACTS-UI-FX-1`, set1.6.0, [operator execution approval](../autonomy/UI_FX_INTEGRATION_OPERATOR_DECISION_2026-10-18.md), supersedes the general audio deferral solely for the eight operator-accepted UI FX files and audited native events. No global narrative/cinematic/PC acceptance is implied. Music, voices, ambience, combat-iframe sounds and cinematic/video audio remain DEFERRED. Default disabled; explicit accessible enable/mute and volume, real gesture unlock, preferences separate from GameState/V6/video mute. No sound on load/reload/restored preference/programmatic focus. One bounded cue per actual native action with keyboard/pointer deduplication, bounded voices/rate and hidden/disposed cleanup. Optional audio failure never blocks agency or writes gameplay truth. Only actual node changes emit travel-start; autosaves, repeated reward renders and failed/no-op actions do not emit success.
