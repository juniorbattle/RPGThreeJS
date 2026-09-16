# Option C demo environment runtime — final proof closeout

This is an operator-review package only. The 44 approved environment PNGs remain byte-identical to the manifest. No plate or character asset was generated, edited, or replaced, and this candidate has not been promoted to production.

## Travel — real runtime context proof

The earlier repeated `CAMP DU LION / AUDIENCE D'ALARIC` content was review-harness behavior, not a production `TravelView` mapping defect. The old harness always supplied `createInitialState()` and changed only the environment CSS variable. The corrected harness positions that state on a validated edge from the production run graph; `TravelView` still derives the current heading and destination card itself.

| Transition | Environment mapping | Current runtime heading | Runtime destination | 1366x768 | 1920x1080 |
|---|---|---|---|---|---|
| Lion Camp / departure | `LION_CAMP / lion_camp_travel` | Camp du Lion | Audience d’Alaric | [proof](travel/1366x768/travel_lion-camp-departure.png) | [proof](travel/1920x1080/travel_lion-camp-departure.png) |
| Forest Road progression | `FOREST_ROAD / forest_road_travel` | Audience d’Alaric | Piste des bêtes | [proof](travel/1366x768/travel_forest-road-progression.png) | [proof](travel/1920x1080/travel_forest-road-progression.png) |
| Bois-Clair transition | `BOIS_CLAIR / bois_clair_travel` | Vieux sanctuaire | Bois-Clair assiégé | [proof](travel/1366x768/travel_bois-clair-transition.png) | [proof](travel/1920x1080/travel_bois-clair-transition.png) |
| Final Refuge to Judgement | `LION_JUDGEMENT / lion_judgement_travel_or_approach` | Refuge avant le Sceau | Jugement du Sceau | [proof](travel/1366x768/travel_final-refuge-to-judgement.png) | [proof](travel/1920x1080/travel_final-refuge-to-judgement.png) |

## Static Tableau — authored multi-actor proof

These captures use existing canonical actor images and the final authored dialogue-presentation plans. The proof harness does not create a synthetic cast layout.

| Case | Authored dialogue | Cast and geography | Speaker / listeners | 1366x768 | 1920x1080 |
|---|---|---|---|---|---|
| 1 actor | `lion_finale_judgement` | Alaric center | Alaric speaking | [proof](tableau/1366x768/tableau_1-actor.png) | [proof](tableau/1920x1080/tableau_1-actor.png) |
| 2 actors | `ate_alaric_reports` | Lion Champion left; Alaric right | Champion emphasized; Alaric dimmed listener | [proof](tableau/1366x768/tableau_2-actors-lion-court.png) | [proof](tableau/1920x1080/tableau_2-actors-lion-court.png) |
| 3 actors | `post_opening_trail` | Kestrel far left; Alistair center; Maelor far right | Kestrel emphasized; listeners dimmed | [proof](tableau/1366x768/tableau_3-actors-player-company.png) | [proof](tableau/1920x1080/tableau_3-actors-player-company.png) |
| 4 actors | `lion_briefing` | Alistair / Séraphine / Maelor left; Alaric far right | Alaric emphasized; player company dimmed | [proof](tableau/1366x768/tableau_4-actors-court-geography.png) | [proof](tableau/1920x1080/tableau_4-actors-court-geography.png) |

The actors remain bottom-anchored with the existing `BOTTOM_INTENTIONAL` crop doctrine, faces and speaking silhouettes remain clear, listener dimming is visible, cards avoid faces and critical gestures, and each composition retains lateral entry/exit room plus readable background landmarks.

## Combat Stage — grounding correction proof

The approved plates were not changed. The runtime now uses explicit per-plate fit metadata plus the existing contact-shadow meshes with reviewed opacity, scale, and pitch. Attacker-left / target-right and the center VFX lane are unchanged.

| Stage | 1366 comparison | 1366 overlay | 1920 comparison | 1920 overlay | Result |
|---|---|---|---|---|---|
| Forest Route | [before / after](combat-grounding/comparisons/1366x768/forest-route-before-after.png) | [annotated](combat-grounding/annotated/after/1366x768/forest-route-grounding-overlay.png) | [before / after](combat-grounding/comparisons/1920x1080/forest-route-before-after.png) | [annotated](combat-grounding/annotated/after/1920x1080/forest-route-grounding-overlay.png) | PASS |
| Bois-Clair Burning | [before / after](combat-grounding/comparisons/1366x768/bois-clair-burning-before-after.png) | [annotated](combat-grounding/annotated/after/1366x768/bois-clair-burning-grounding-overlay.png) | [before / after](combat-grounding/comparisons/1920x1080/bois-clair-burning-before-after.png) | [annotated](combat-grounding/annotated/after/1920x1080/bois-clair-burning-grounding-overlay.png) | PASS |
| Lion Sanctum | [before / after](combat-grounding/comparisons/1366x768/lion-sanctum-before-after.png) | [annotated](combat-grounding/annotated/after/1366x768/lion-sanctum-grounding-overlay.png) | [before / after](combat-grounding/comparisons/1920x1080/lion-sanctum-before-after.png) | [annotated](combat-grounding/annotated/after/1920x1080/lion-sanctum-grounding-overlay.png) | PASS |

See [grounding diagnosis](combat-grounding/README.md) for the six viewport-specific measurements and [machine-readable diagnosis](combat-grounding/grounding-diagnosis.json) for baselines, ground bands, safe lanes, crop findings, and contact-shadow results.

## Machine proof

- [Final closeout capture report](final-closeout-report.json): 22/22 captures passed; 8/8 Travel, 8/8 Tableau, 6/6 Combat Stage; zero failed requests and zero console errors.
- Environment manifest: 44/44 approved PNG hashes verified.
- Focused runtime tests: environment mapping/byte lock, production Travel edge state, authored tableau census, and Combat Stage contact-shadow metadata.

## Final decision fields

ENVIRONMENT_ART = OPERATOR_APPROVED

TRAVEL_REAL_CONTEXT_PROOF = PASS

TRAVEL_BACKGROUND_MAPPING = PASS

TRAVEL_CONTEXT_UI_MAPPING = PASS

TRAVEL_HARNESS_FIXED_CONTEXT = YES

TABLEAU_1_ACTOR = PASS

TABLEAU_2_ACTORS = PASS

TABLEAU_3_ACTORS = PASS

TABLEAU_4_ACTORS = PASS

PLAYER_COMPANY_LEFT = PASS

LION_COURT_RIGHT = PASS

STRATEGIC_RUNTIME = OPERATOR_APPROVED

COMBAT_STAGE_RUNTIME = OPERATOR_APPROVED

STRATEGIC_OPERATOR_VISUAL_REVIEW = PASS

COMBAT_STAGE_OPERATOR_VISUAL_REVIEW = PASS

BOIS_CLAIR_STRATEGIC_CONTRAST = PASS

BOIS_CLAIR_STAGE_CONTRAST = PASS

COMBAT_STAGE_FOREST_ROUTE_GROUNDING = PASS

COMBAT_STAGE_BOIS_CLAIR_GROUNDING = PASS

COMBAT_STAGE_LION_SANCTUM_GROUNDING = PASS

COMMON_GROUND_PLANE_READABILITY = PASS

ATTACKER_LEFT_TARGET_RIGHT = PASS

FLOATING_IMPRESSION_REMOVED = PASS

IMAGE_REGENERATION_USED = NO

ENVIRONMENT_REGENERATION = NO

RUNTIME_CHANGED = YES

GAMEPLAY_CHANGED = NO

COMBAT_LOGIC_CHANGED = NO

NEW_REGRESSIONS = 0

ENVIRONMENT_STATUS = FINAL_PRODUCTION_CANDIDATE

COMMIT = NO

PUSH = NO
