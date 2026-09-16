# Elara — modern tactical pixel-art contract

Status: STYLE_AND_GENERATION_CONTRACT_LOCKED

## 1. Legacy semantic reference

- Runtime ID: dark_mage
- Class and combat kind: Mage Noir / mage
- Legacy reference source: public/assets/characters/pixel/full/elara.png
- Legacy reference size: 640×768 RGBA
- Legacy reference SHA-256: fc9a38e614b466c2258becac7b0f39618058b02a9b4ebdcaced541d2ebe99b74
- Weapon family: grimoire
- Representative attack language: n_dark_bolt / Éclair Noir
- Role: ranged arcane offense and occult control

Extracted identity invariants: tall pointed navy hat, face hidden in shadow with two cyan eyes, deep navy/indigo layered robes, restrained gold linework, cyan diamond accents, open grimoire, free casting hand, armored boots, no staff.

Repository weapon truth and the legacy identity record—not older draft text mentioning a glowing staff—establish that Elara's weapon is the grimoire.

The legacy PNG is a semantic reference only. It must not be attached, traced, repainted, or used as an edit target. The new master must implement Elara's identity signals from scratch.

## 2. Refined style brief

Elara is a compact, asymmetric arcane caster. Her readability comes from the pointed hat, black face void with cyan eyes, open book rectangle, and one extended casting hand. She must not become Marian recolored blue.

Simplify the canonical design into:

- one pointed hat triangle with a broad readable brim;
- one dark face cavity with exactly two cyan eye pixels or clusters;
- one compact torso beneath a high collar;
- one open grimoire block with two readable pages;
- one extended hand and forearm forming the attack direction;
- one primary robe wedge and one secondary cape wedge;
- two separated armored boots;
- a small number of cyan diamond accents and restrained gold seams.

Arcane light is focal punctuation. It must not dissolve the silhouette or replace body construction.

## 3. Silhouette and readability breakdown

| Read order | Required shape | Failure signal |
| --- | --- | --- |
| 1 | tall pointed hat and broad brim | generic hood, crown, or Marian-like veil |
| 2 | open grimoire rectangle | book disappears into robes or becomes a staff |
| 3 | asymmetric extended casting hand | symmetrical priest pose |
| 4 | compact layered dark robe | wide white-mage triangle or shapeless smoke |
| 5 | two grounded boots | floating void with no anatomy |

At 96 px, the viewer must identify “occult grimoire mage” from hat, book, and hand even if all cyan glow is removed.

Value grouping:

- darkest: face void, inner robe, book cover;
- middle: navy and indigo cloth planes;
- light: selected blue edges and page planes;
- accent: sparse cyan eyes/runes and restrained old-gold seams.

Do not fill every seam with gold or every edge with cyan.

## 4. Proportion and scale contract

All measurements use the 128×128 logical authoring grid. Delivery values are exactly 4×.

| Measurement | Logical target | Delivery target |
| --- | --- | --- |
| Pivot X | 64 | 256 |
| Foot baseline | 116 | 464 |
| Anatomical body height excluding hat tip | 78 ±2 | 312 ±8 |
| Hat tip extension above head | 13–18 | 52–72 |
| Hat brim width | 30–36 | 120–144 |
| Shoulder span excluding cape | 26–31 | 104–124 |
| Robe width at lower third | 34–42 | 136–168 |
| Open grimoire width | 18–23 | 72–92 |
| Visible boot separation | 15–23 | 60–92 |

Continuity limits:

- Hat brim, face cavity, eyes, hands, boots, and grimoire follow the global ±3 to ±5 percent limits.
- The pointed hat is an external silhouette feature and does not drive anatomical scaling.
- The grimoire remains the same physical book in all poses.
- Spell intensity never changes body or book scale.
- Robe width may compress during dash but may not become smoke or erase legs.
- All poses use the same source-to-frame scale. Translation only is allowed during normalization.

## 5. Key-pose target pack

| Pose | Target | Body-span expectation | Forbidden drift |
| --- | --- | --- | --- |
| Idle | compact three-quarter stance; open grimoire supported in one hand; other hand ready; hat and boots clearly separated | 76–79 logical px excluding hat tip | floating book, staff, oversized hat |
| Dash | quick grounded occult step; book secured close to torso; hat and one robe wedge trail without changing size | 70–75 logical px excluding hat tip | teleport disappearance, smoke body, missing feet |
| Attack | free hand aims a tight Dark Bolt line while grimoire remains open and readable | 73–80 logical px excluding hat tip | baked projectile, giant orb covering anatomy |
| Cast | upward or outward two-part gesture with grimoire as source authority; silhouette supports larger later VFX | 76–81 logical px excluding hat tip | meteor or flame asset baked into character, Marian prayer pose |

Planned animation envelopes after key-pose approval:

- Idle: 6 frames, restrained hat/robe settling and small page pulse.
- Dash: 6 frames, gather, grounded occult step, travel, plant, recovery.
- Attack: 8 frames, book focus, hand aim, release gesture, settle.
- Cast: 8 frames, page gather, body coil, elevated gesture, clean recovery.

These counts are targets for later animation work, not authorization to generate them now.

## 6. Animation consistency checklist

- Hat tip, brim, and crown volume remain stable.
- Face stays a dark cavity with exactly two cyan eyes; no skin or hair appears.
- Grimoire size, cover, page split, spine, and hand relationship remain stable.
- No staff, wand, sword, or second book appears.
- Casting hand remains anatomically readable before VFX compositing.
- Gold and cyan accents stay sparse and do not multiply between frames.
- Robe motion uses one primary and one secondary mass.
- Both boots remain readable and share baseline y=116 on grounded frames.
- Dash is visible locomotion, not the n_teleport effect.
- Attack remains readable with projectile and glow hidden.
- Silhouette passes at 96 px on light and dark backgrounds.
- No frame-specific camera zoom, perspective shift, or fractional resize.

## 7. Prompt wording guidance

Execution lock for later generation:

- Model: gpt-image-2.5-sunburst-2026-09-08
- Quality: max
- Fallback: none
- Initial master request: text-only generation; no legacy character image input
- Pose requests: the accepted fresh Elara master is the only character-image authority
- Generate one master, inspect it, then generate one key pose at a time.

Prompt core:

> Create from scratch a native modern tactical pixel-art sprite of Elara, an adult occult grimoire mage. Use only this written semantic contract and the approved fresh roster style seed; do not trace or derive from any legacy character image. Design directly on a 128×128 logical pixel grid for exact 4× nearest-neighbor export to 512×512. Use deliberate connected pixel clusters, compact asymmetric shapes, simplified medium detail, controlled colored outlines, and strong readability at 96 pixels. Identity signals: tall pointed navy hat and broad brim, shadowed face with two cyan eyes, deep navy and indigo robes, restrained old-gold seams, sparse cyan diamond accents, open grimoire, free casting hand, and armored boots. Keep stable adult proportions, stable hat/body relationship, stable book scale, common foot baseline, and the exact same body model across poses. Solid flat #FF00FF background. No legacy rendering inheritance, painterly cloth, rune micro-noise, soft brushwork, smooth 3D rendering, exposed face, hair, staff, wand, sword, second book, baked VFX, text, UI, crop, or edge contact.

Pose suffixes:

- Idle: compact grounded stance, open grimoire readable, free hand prepared, clear hat and boot separation.
- Dash: quick grounded occult step, book secured near torso, one broad trailing robe wedge, no teleport effect.
- Attack: precise Dark Bolt aiming gesture from the free hand, no orb or projectile baked in.
- Cast: grimoire-led larger spell gesture with open silhouette and empty VFX space, no meteor, flame, or floor sigil baked in.

## 8. Explicit rejection criteria

Reject immediately if any of the following is true:

- reads as a painted wizard illustration rather than native pixel art;
- shows close visual derivation, tracing, or repainting of a legacy character sprite;
- Elara is merely Marian recolored blue;
- hat size, brim, face cavity, eyes, or book changes between poses;
- face, skin, hair, staff, wand, sword, or second book appears;
- cyan glow covers the hand, grimoire, boots, or body silhouette;
- gold trim becomes dense decorative lace;
- dash becomes teleport smoke or loses grounded anatomy;
- role is not readable at 96 px in monochrome;
- attack requires a baked projectile to read;
- any pose uses independent normalization scale;
- alpha edge, crop, baseline, pivot, or background validation fails.

## 9. Surface acceptance

- Tableau: eyes, hat brim, book pages, and hand gesture read at 320 px without painterly noise.
- Strategic: hat-plus-book silhouette identifies Elara at 96 px and remains distinct from Marian.
- Combat Stage: cast direction and book source remain legible under VFX; feet and target line stay visible.

Passing the document contract does not approve a generated asset. Human visual review remains required.
