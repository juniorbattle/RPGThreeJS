# Forest Road v2 operator review

## Review verdict

`FAMILY_COHERENCE: PASS`

The road, left waystone/ruin, right stream, waterfall ridge, distant citadel direction, heraldic language, vegetation, and stone materials remain recognizable across all four presentation families. Lighting changes are surface/candidate exploration, not location changes.

`STRATEGIC_CAMERA_DOCTRINE: PASS`

All strategic candidates retain a slightly elevated/frontal battlefield with party lower-left/front, enemies lower-right/front, and a broad center engagement area. None introduces isometric, top-down, grid-board, or side-on strategic framing.

`TABLEAU_CHARACTER_FREE: YES`

All twelve final plates are character-free. No runtime actor, enemy, animal, selection ring, marker, UI panel, text, or guide is baked into any clean candidate.

## Candidate status

| Candidate | Status | Review note |
| --- | --- | --- |
| Travel A | PASS | Strong single-route read and warm journey tone; slightly brighter route values than B. |
| Travel B | PASS - RECOMMENDED | Best atmospheric journey identity, clean route, controlled moon/lantern hierarchy, and clear UI-safe corners. |
| Travel C | PASS | Strongest architectural emphasis and wet-dawn depth; lower-right road highlights are busier than B. |
| Tableau A | PASS | Clear five-anchor forecourt; warm shafts increase value variation behind some actors. |
| Tableau B | PASS - RECOMMENDED | Best actor silhouette separation, darkest dialogue-card region, clean entry/exit lanes, and even staging floor. |
| Tableau C | PASS WITH CAVEAT | Excellent ruin framing and character-free stage; bright sky makes the upper dialogue-card zone less forgiving. |
| Strategic A | PASS WITH CAVEAT | Camera and side zones are correct; center floor has stronger highlights and edge activity. |
| Strategic B | PASS - RECOMMENDED | Lowest front-zone contrast and edge density, even party/enemy values, clear center lane, and strongest unit readability. |
| Strategic C | PASS WITH CAVEAT | Strong authored architecture; bright center and denser rear arches may compete with units/VFX. |
| Combat Stage A | PASS WITH CAVEAT | Correct left/right stage semantics; sunset/citadel hotspot occupies part of the action backdrop. |
| Combat Stage B | PASS | Strongest dark VFX lane and silhouette contrast; overall values may be too dark for some unoutlined actors. |
| Combat Stage C | PASS - RECOMMENDED | Best balanced actor zones, broad horizontal action lane, outer-edge architecture, and mist-backed VFX clearance. |

## Required QA matrix

Legend: `P` pass, `W` pass with operator caveat. No candidate failed the requested review gate.

| Candidate | Art direction | Modern pixel quality | Depth | Landmarks | Location identity | Composition | UI compatibility | Gameplay readability | Layer separation | Lighting | No painterly drift | No generic AI look |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Travel A | P | P | P | P | P | P | P | P | P | P | P | P |
| Travel B | P | P | P | P | P | P | P | P | P | P | P | P |
| Travel C | P | P | P | P | P | P | W | P | P | P | P | P |
| Tableau A | P | P | P | P | P | P | W | P | P | P | P | P |
| Tableau B | P | P | P | P | P | P | P | P | P | P | P | P |
| Tableau C | P | P | P | P | P | P | W | P | P | P | P | P |
| Strategic A | P | P | P | P | P | P | P | W | P | W | P | P |
| Strategic B | P | P | P | P | P | P | P | P | P | P | P | P |
| Strategic C | P | P | P | P | P | P | P | W | P | W | P | P |
| Combat Stage A | P | P | P | P | P | P | P | W | P | W | P | P |
| Combat Stage B | P | P | P | P | P | P | P | P | P | P | P | P |
| Combat Stage C | P | P | P | P | P | P | P | P | P | P | P | P |

## Surface-specific QA

| Candidate | Character free | Actor staging | Dialogue UI safe | Left/right geography |
| --- | --- | --- | --- | --- |
| Tableau A | P | P | W | P |
| Tableau B | P | P | P | P |
| Tableau C | P | P | W | P |

| Candidate | Party zone | Enemy zone | Center lane | Unit silhouettes | Camera doctrine |
| --- | --- | --- | --- | --- | --- |
| Strategic A | P | P | W | W | P |
| Strategic B | P | P | P | P | P |
| Strategic C | P | P | W | W | P |

| Candidate | Attacker-left / target-right | VFX clearance | Action lane |
| --- | --- | --- | --- |
| Combat Stage A | P | W | P |
| Combat Stage B | P | P | P |
| Combat Stage C | P | P | P |

## Machine evidence

All twelve clean candidates are RGB PNG files at `1672x941`. The machine QA JSON records SHA-256 hashes, dimensions, modes, and luminance/edge metrics for tableau anchors, strategic party/center/enemy zones, combat-stage attacker/action/target zones, and representative UI-safe regions.

The measurements support the recommendations rather than replacing visual judgment:

- Tableau B has the lowest and most even staging-zone edge density and the calmest dialogue-safe region.
- Strategic B has materially lower front-zone contrast/edge activity than A or C, with closely matched party/enemy luminance.
- Combat Stage C balances a clean action-lane edge profile with brighter actor readability than B.

## Approval boundary

This review does not authorize production replacement or runtime integration. Stop after operator environment selection.

