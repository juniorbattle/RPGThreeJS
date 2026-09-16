# Alistair canonical identity ledger

Status: `PRE-GENERATION AUTHORITY`

This ledger records only facts visible in the canonical PNG or supported by current repository truth. The canonical PNG overrides every conflicting document, preview label, historical GLM field, or prompt.

## Authority inspected

- Canonical image: `public/assets/characters/pixel/full/alistair.png`
- Canonical dimensions: `640x768` RGBA
- Canonical SHA-256: `7e16df524ba10c6f42b08843eecafe5456425ba1e22f39567cd933fe23857942`
- Canonical alpha bounding box: `(57, 84, 581, 735)` in source pixels
- Game identity: `warrior`, Alistair, `Guerrier`, `knight`, core recruit
- Game weapon family: `greatsword`, range 1
- Option C role: `heavy_frontline`, heavy body class
- Faction support: `lion`
- Motion/rendering-only reference: `docs/art-direction/option-c/references/motion-armored-vanguard-reference.png`
- Motion reference SHA-256: `949e2b2901af3ce1da69d43721c627979da4bcba879db1aeaf372a013aca4cfd`

## Canonical visual facts

| Attribute | Canonical reading |
| --- | --- |
| Silhouette | Broad, heavy, fully armored frontline knight in a low, wide, grounded combat stance. The enormous diagonal greatsword and long torn cloth masses are the dominant silhouette cues. |
| Body proportions | Adult human proportions with broad shoulders, thick armored torso and limbs, large articulated gauntlets and boots, and no exposed anatomy. Not chibi and not giant/boss-scaled. |
| Helmet / head profile | Fully enclosed dark-steel helmet with an angular brow, narrow dark eye slit, vertically vented lower face plate, pale metal edge highlights, and a large swept burgundy-red plume. |
| Face visibility | No face, eyes, hair, or skin are visible. The helmet opening remains dark and anonymous. |
| Hair | None visible. The red mass above the helmet is a plume, not hair. |
| Armor pieces | Dark riveted plate helmet, neck protection, layered pauldrons, segmented arm defenses, articulated gauntlets, torso plate and dark mail/scale underlayers, hip and thigh plates, decorated poleyns, greaves, and articulated sabatons. The viewer-left pauldron has a pronounced layered/spiked edge. |
| Primary palette | Gunmetal, blackened steel, charcoal, and pale silver edge highlights. |
| Secondary palette | Deep burgundy/crimson cloth, dark brown leather, and restrained brass/old-gold fasteners and ornaments. |
| Weapon type | Two-handed greatsword. Repository weapon truth also identifies Alistair's allowed weapon family as `greatsword`. |
| Weapon geometry | Very long, broad, straight, double-edged blade with a strong central dark-steel channel/ridge, bright silver edges, tapered point, angular crossguard, long wrapped grip, and metal pommel. It is held with both gauntleted hands. |
| Secondary equipment | No shield and no separate secondary weapon are present. |
| Boots | Full articulated dark-steel sabatons with pale edge highlights and warm metal fasteners. |
| Gloves | Full articulated plate gauntlets; both hands visibly control the sword grip. |
| Cape / cloth | Deep red scarf or mantle at the neck, long split/torn cape behind the body, and a long torn front tabard. The cloth has restrained old-gold edging and a pale-gold lower emblem. |
| Faction motifs | Repository truth assigns Alistair to the Lion faction. Visually, restrained radial metal ornaments appear at the chest, hip, and sword fittings, while a pale-gold heraldic mark appears on the front tabard. Do not reinterpret these into a new emblem. |
| Unique ornaments | Swept red helmet plume, cross-body brown leather harness, round radial chest clasp, repeated radial metal fittings, asymmetrical layered/spiked pauldron, and heavily torn red cloth. |
| Relative weapon/body scale | The complete greatsword is close to the character's full standing body height and must remain an oversized primary silhouette element. It must not be shortened into a one-handed sword. |

## Gameplay-informed pose authority

- Basic attack: a committed two-handed greatsword melee strike at range 1; hands and weapon must remain mechanically plausible.
- Representative Phase A skill pose: `w_whirl`, **Tourbillon d'Acier** — Alistair spins and strikes enemies around him. The pose should communicate rotational anticipation or follow-through without baked VFX.
- `w_charge` remains the gameplay authority for committed forward drive, but the requested DASH key pose is a locomotion authority rather than a separate spell or jump.
- `w_lion_surge` is real game truth but is not selected for this representative Phase A skill pose.

## Confirmed conflicts

| Conflicting source claim | Canonical resolution |
| --- | --- |
| `OptionCCharacterDefinitions.ts` says `Open-faced helm, no mask`. | Rejected. The canonical face is fully enclosed by a vented helmet; no face or skin is visible. |
| `OptionCCharacterDefinitions.ts` says `tower shield` and requests a shield-block pose. | Rejected. The canonical PNG has no shield; both hands hold the greatsword. No shield may be generated. |
| `OptionCCharacterDefinitions.ts`, `assetManifest.ts`, and Phase 4C draft documentation list `emerald, steel, gold`. | Rejected for visual production. No emerald is visibly supported by the canonical PNG. Use blackened steel, silver highlights, burgundy/crimson cloth, dark brown leather, and restrained brass/old gold. |
| Historical armored-vanguard board is titled `Marian`. | Label rejected. The board is motion/rendering reference only; canonical Alistair identity comes from `alistair.png`. |
| Historical board includes glowing red attack/cast effects and ground scenery. | Do not carry them into production key poses. Phase A assets require transparent delivery and no baked gameplay VFX or environment. |
| Phase 4C draft foot baseline is `470`, and Kestrel's approved baseline is `466`. | Neither is final authority for Alistair. Derive Alistair's normalized baseline and body height from the accepted master. |

## Hard preservation checklist

- One Alistair only; same helmet, armor construction, proportions, palette, ornaments, and sword across every accepted pose.
- Full helmet plume, sword, hands, cloth, and feet remain uncropped.
- No shield, exposed face, visible hair, extra weapon, duplicated limb, baked VFX, background, text, UI, or checkerboard pixels.
- Transparent edges must remain clean and free of white/black matte fringe.
- Production derivatives remain DEV-only until operator promotion.
