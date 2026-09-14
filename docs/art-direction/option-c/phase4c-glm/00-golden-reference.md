# 00 — Golden Reference (Kestrel + Forest Road)

## Kestrel — GOLD_REFERENCE character

- **Character ID:** `archer`
- **Canonical source:** `/assets/characters/pixel/full/kestrel.png`
- **Phase 4B root:** `/assets/dev/option-c/phase4b/kestrel/`
- **Animation states:** idle, dash, attack, skill (8 frames each)
- **Timing:** idle=190ms loop, dash=82ms oneShot→idle, attack=105ms oneShot→idle, skill=125ms oneShot→idle
- **Anchor:** footCenter=(256,460), bodyCenter=(256,256), headReference=(256,120)
- **Scale:** tableau=0.92, strategic=1, combatStage=1 (not draft)
- **Mirror:** runtime

## Forest Road — GOLD_REFERENCE environment

- **Family ID:** `forest-road`
- **Surfaces:** travel, tableau, strategic, combat-stage
- **Root:** `/assets/dev/option-c/phase4b/environment/forest-road-{surface}.png`
- **Art status:** GOLD_REFERENCE

## Phase 4B manifest

- **Path:** `public/assets/dev/option-c/phase4b/runtime-assets.json`
- **Schema version:** 1
- **Source pilot:** APPROVED_DEV_PILOT
- **Asset count:** 36 (4 environment + 32 Kestrel frames)
- **All derivatives are byte-identical to approved Phase 4A sources**

## Compatibility contract

Phase 4C must NOT:
- modify Kestrel canonical production asset
- modify Phase 4B runtime derivatives
- modify Phase 4B manifest
- change Phase 4B proof entry route
- break Phase 4B integration tests

Phase 4C DOES:
- reference Phase 4B assets via semantic resolver
- reuse the SpriteFrameAnimationController unchanged
- register Kestrel as GOLD_REFERENCE in the new registry
- preserve all Phase 4B timing/anchor/scale values exactly
