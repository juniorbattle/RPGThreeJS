# Marian — modern tactical pixel-art contract

Status: STYLE_AND_GENERATION_CONTRACT_LOCKED

## 1. Legacy semantic reference

- Runtime ID: white_mage
- Class and combat kind: Mage Blanc / cleric
- Legacy reference source: public/assets/characters/pixel/full/marian.png
- Legacy reference size: 640×768 RGBA
- Legacy reference SHA-256: 152e6a17afbf99ae18aea2b14253db067fb76719beffd3809d9613b8ee6c8191
- Weapon family: crosier
- Representative cast language: w_sanctuary / Sanctuaire
- Role: sacred support, healing, purification, and revival

Extracted identity invariants: white hood, fully concealed gold-and-white faceplate, white and pale-blue robe masses, restrained gold trim, blue gems, full crosier, armored lower legs, no exposed face, no hair, no sword, no grimoire.

The legacy identity record—not older text claiming a visible serene expression—establishes the semantic fact that Marian is masked.

The legacy PNG is a semantic reference only. It must not be attached, traced, repainted, or used as an edit target. The new master must implement Marian's identity signals from scratch.

## 2. Refined style brief

Marian is a luminous support caster whose silhouette is calm, upright, and protective. Her premium quality comes from clean white masses, clear gold geometry, and a disciplined crosier line—not filigree density.

Simplify the canonical design into:

- one hood-and-mask head block;
- one clean shoulder mantle;
- one narrow upper torso over a broad triangular robe base;
- two large sleeve shapes with readable hands;
- one vertical crosier with a simple ring-and-gem head;
- two armored lower-leg shapes visible beneath the robe;
- one small blue focus hierarchy: staff gem, chest gem, belt gem.

White cloth must remain readable against bright backgrounds through cool shadow grouping and a restrained dark outline.

## 3. Silhouette and readability breakdown

| Read order | Required shape | Failure signal |
| --- | --- | --- |
| 1 | tall crosier beside an upright caster | staff cropped, hidden, or confused with a spear |
| 2 | white triangular robe and mantle | shapeless cloud of ribbons |
| 3 | masked hood | exposed face or generic cleric hair |
| 4 | open support hand | hand swallowed by glow or sleeve |
| 5 | two grounded armored feet | floating robe with no ground contact |

At 96 px, the viewer must identify “white sacred support caster” from staff, robe, and posture without relying on glow.

Value grouping:

- darkest: mask openings, robe folds, staff shaft, under-mantle;
- middle: cool white and pale blue cloth shadows;
- light: white cloth planes and silver armor;
- accent: restrained gold geometry and a few blue gems.

Gold is an accent, not a lace texture covering every edge.

## 4. Proportion and scale contract

All measurements use the 128×128 logical authoring grid. Delivery values are exactly 4×.

| Measurement | Logical target | Delivery target |
| --- | --- | --- |
| Pivot X | 64 | 256 |
| Foot baseline | 116 | 464 |
| Upright anatomical body height | 80 ±2 | 320 ±8 |
| Hood-and-mask height | 13–15 | 52–60 |
| Shoulder span | 30–34 | 120–136 |
| Robe width at lower third | 38–46 | 152–184 |
| Crosier total length | 84–94 | 336–376 |
| Crosier head diameter | 12–15 | 48–60 |
| Visible boot separation | 14–22 | 56–88 |

Continuity limits:

- Hood, mask, shoulder, hand, boot, and crosier modules follow the global ±3 to ±5 percent limits.
- Robe width may compress during dash but total cloth volume must remain recognizable.
- Staff thickness and ring size never change to signal power.
- Apparent radiance comes from palette contrast and separate VFX, not body enlargement.
- All poses use the same source-to-frame scale. Translation only is allowed during normalization.

## 5. Key-pose target pack

| Pose | Target | Body-span expectation | Forbidden drift |
| --- | --- | --- | --- |
| Idle | calm upright stance; crosier vertical; free hand open near chest; robe forms one stable triangle | 78–80 logical px | floating body, face reveal, staff changing length |
| Dash | controlled forward step or short glide with visible planted/pushing foot; crosier carried diagonally close to body; robe trails as one wedge | 72–76 logical px | teleport disappearance, ribbon explosion, tiny legs |
| Attack | crosier and free hand direct a compact sacred release toward target; torso remains readable | 74–81 logical px | melee pole strike, giant hand glow, baked projectile |
| Cast | protective upward-open gesture compatible with Sanctuaire; crosier anchors the vertical line; broad stable stance | 77–82 logical px | floor ring, healing burst, angel wings, body scale-up |

Planned animation envelopes after key-pose approval:

- Idle: 6 frames, restrained breath, one robe fold shift, stable staff.
- Dash: 6 frames, gather, step/glide, travel, plant, recovery.
- Attack: 8 frames, aim, channel, release gesture, settle.
- Cast: 8 frames, prayer gather, staff lift, open-hand peak, grounded recovery.

These counts are targets for later animation work, not authorization to generate them now.

## 6. Animation consistency checklist

- Mask remains closed and identical; no face or hair appears.
- Hood and shoulder mantle keep the same proportions.
- Crosier length, shaft thickness, ring, and gem remain stable.
- White/gold/blue area balance stays within the global palette tolerance.
- Free hand remains anatomically readable before any VFX is composited.
- Robe motion uses at most two broad secondary masses.
- Both feet remain inferable and share baseline y=116 on grounded frames.
- Dash is locomotion, not the Teleportation skill.
- Cast pose is readable with VFX hidden.
- No halos, wings, floor sigils, projectiles, or healing particles are baked into the sprite.
- Silhouette passes at 96 px on light and dark backgrounds.
- No frame-specific camera zoom, perspective shift, or fractional resize.

## 7. Prompt wording guidance

Execution lock for later generation:

- Model: gpt-image-2.5-sunburst-2026-09-08
- Quality: max
- Fallback: none
- Initial master request: text-only generation; no legacy character image input
- Pose requests: the accepted fresh Marian master is the only character-image authority
- Generate one master, inspect it, then generate one key pose at a time.

Prompt core:

> Create from scratch a native modern tactical pixel-art sprite of Marian, an adult masked white mage and sacred support caster. Use only this written semantic contract and the approved fresh roster style seed; do not trace or derive from any legacy character image. Design directly on a 128×128 logical pixel grid for exact 4× nearest-neighbor export to 512×512. Use deliberate connected pixel clusters, broad clean robe masses, simplified medium detail, controlled colored outlines, and strong readability at 96 pixels. Identity signals: white hood, fully concealed gold-and-white faceplate, white and pale-blue robes, restrained gold geometry, blue gems, armored lower legs, full crosier, and open support hand. Keep stable adult proportions, stable hood/body ratio, stable crosier scale, common foot baseline, and the exact same body model across poses. Solid flat #FF00FF background. No legacy rendering inheritance, painterly folds, lace-like trim noise, soft brushwork, smooth 3D rendering, exposed face, hair, sword, grimoire, wings, halo, baked VFX, text, UI, crop, or edge contact.

Pose suffixes:

- Idle: calm upright support stance, vertical crosier, open free hand, clear triangular robe.
- Dash: controlled forward step or short grounded glide, diagonal staff, one broad trailing robe mass.
- Attack: compact sacred release gesture aimed at the target, no projectile baked into the sprite.
- Cast: protective Sanctuaire-compatible gesture, staff lift and open hand, no floor sigil or aura baked in.

## 8. Explicit rejection criteria

Reject immediately if any of the following is true:

- reads as painted white-robed concept art rather than native pixel art;
- shows close visual derivation, tracing, or repainting of a legacy character sprite;
- face, skin, hair, or an expressive portrait appears beneath the mask;
- crosier becomes a spear, mace, wand, or randomly changes length;
- robe becomes many decorative ribbons or dense gold filigree;
- white cloth loses silhouette on a light background;
- Marian overlaps Elara's pointed-hat, dark-robe, or grimoire language;
- attack reads as a heavy melee staff strike;
- cast requires baked glow to understand the gesture;
- head, hand, boot, or staff modules drift between poses;
- role is not readable at 96 px in monochrome;
- any pose uses independent normalization scale;
- alpha edge, crop, baseline, pivot, or background validation fails.

## 9. Surface acceptance

- Tableau: mask, open hand, crosier head, and robe hierarchy remain elegant at 320 px.
- Strategic: white support role reads instantly at 96 px without becoming a bright blob.
- Combat Stage: cast hand and staff direction remain readable under holy VFX, with feet and target line unobscured.

Passing the document contract does not approve a generated asset. Human visual review remains required.
