# CIN-6E-A.4R — Final reconciliation

## Machine invariants

- DIALOGUES_ACCOUNTED = 71/71
- ORIGINAL_STEPS_ACCOUNTED = 247/247
- CHOICES_ACCOUNTED = 28/28
- HIDDEN_SPEAKER = 0
- NORMAL_DIALOGUE_DURING_VIDEO = 0
- DIALOGUE_STEPS_ON_VIDEO = 0
- DIALOGUE_STEPS_ON_HOLD = 0
- CHOICE_STEPS_ON_HOLD = 0
- WRONG_HOLD_CAST = 0
- STATIC_SPEAKER_NOT_VISIBLE = 0
- HEAD_OVERLAP = 0
- FACE_UI_COLLISION = 0
- EXCESSIVE_BODY_OVERLAP = 0
- UNINTENTIONAL_ALL_FACE_SAME_DIRECTION = 0
- UNJUSTIFIED_FACING_FLIPS = 0
- ACTOR_FACTION_SIDE_VIOLATIONS = 0
- UNJUSTIFIED_NARRATIVE_EXIT = 0
- TRANSITION_FLASHES = 0
- EFFECT_OWNER_LOSS = 0
- DUPLICATE_EFFECT_EXECUTION = 0
- CHOICE_GEOMETRY_DELTA = 0
- NARRATIVE_FACT_LOSS = 0
- CHARACTER_INTENT_BREAK = 0
- EMOTIONAL_FUNCTION_LOSS = 0
- CHOICE_CONTEXT_LOSS = 0
- ROUTE_CHANGE = 0
- CHOICE_EFFECT_CHANGE = 0
- RECRUITMENT_TRUTH_CHANGE = 0

## Dynamic facing

| Metric | Count |
| --- | --- |
| MIRRORED_ACTOR_STATES | 64 |
| TURN_TO_TARGET_COUNT | 198 |
| EXPLICIT_ADDRESSEE_COUNT | 8 |
| AUTHORED_CONVERSATION_TARGET_COUNT | 84 |
| PREVIOUS_SPEAKER_REACTION_COUNT | 76 |
| GROUP_TARGET_COUNT | 14 |
| DEFAULT_TARGET_COUNT | 65 |
| EXPLICIT_FACING_OVERRIDE_COUNT | 8 |

## Audience proof

- Audience cinematic ends before normal dialogue: PASS
- Dialogue step 1 begins in STATIC_TABLEAU: PASS
- Active cast: alistair, sage_seraphine, maelor, alaric
- PLAYER_COMPANY left: Alistair, Sage Seraphine, Maelor
- LION_COURT right: Alaric
- Maelor -> Alaric: CENTER_LEFT, LEFT, facing RIGHT toward alaric
- Maelor -> company: CENTER_LEFT, LEFT, facing LEFT toward sage_seraphine
- AUDIENCE_FACTION_GEOGRAPHY = PASS
- MAELOR_COMPANY_SIDE = PASS

## Revised CIN-6E-B planning handoff

- VIDEOS_BEFORE = 31
- VIDEOS_AFTER = 13
- Runtime video slots including combat-owned = 19
- STATIC_TABLEAU background contexts = 71
- HOLD scenic still conversions = 1
- TRAVEL still conversions = 4
- Reusable environment plates = acte_ouverture_tableau_bg, post_opening_trail_tableau_bg
- Existing production media deleted = 0
- GPT image attempts = 0
- MiniMax attempts = 0
