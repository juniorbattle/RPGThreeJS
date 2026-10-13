# Alistair — modern tactical pixel-art contract

Status: MASTER_CANDIDATES_READY_FOR_OPERATOR_REVIEW

## 1. Legacy semantic reference

- Runtime ID: warrior
- Class and combat kind: Guerrier / knight
- Legacy reference source: public/assets/characters/pixel/full/alistair.png
- Legacy reference size: 640×768 RGBA
- Legacy reference SHA-256: 7e16df524ba10c6f42b08843eecafe5456425ba1e22f39567cd933fe23857942
- Weapon family: greatsword
- Signature key-pose truth: w_whirl / Tourbillon d’Acier
- Role: heavy melee frontline

Extracted semantic invariants: heavy frontline authority, broad stable silhouette, fully enclosed helmet/visor with concealed face, dark neutral steel, restrained deep-red cape or tabard identity element, oversized two-handed greatsword, no shield, and no exposed face or skin.

Legacy-specific plume shape, spikes, torn-cloth pattern, harness layout, emblem, exact armor arrangement, pose geometry, and painterly proportions are not identity invariants and must not be reconstructed.

The legacy PNG is not a visual generation input. It must not be attached, traced, repainted, or used as an edit target. The new master must implement these semantic signals from scratch.

## 2. Refined style brief

Alistair is a broad, grounded knight built from a few large graphic masses. His authority comes from width, low center of gravity, and the diagonal greatsword—not from dense armor engraving.

Simplify the canonical design into:

- one original helmet mass with a readable closed visor;
- one broad, animation-ready shoulder system;
- a compact chest plate and cross-body harness;
- two clear gauntlet blocks;
- large thigh, knee, greave, and boot modules;
- one restrained deep-red cape, surcoat, sash, or tabard system;
- one straight, broad greatsword with a dark center channel and bright edges.

Keep the character adult and imposing, never chibi or boss-scaled. Surface decoration is subordinate to the silhouette.

## 3. Silhouette and readability breakdown

| Read order | Required shape | Failure signal |
| --- | --- | --- |
| 1 | broad armored torso over a low stance | narrow or generic swordsman |
| 2 | enormous two-handed greatsword | one-handed sword or blade lost in body |
| 3 | original closed helmet/visor | visible face, hair, or direct copying of a reference helmet |
| 4 | restrained deep-red cape or tabard identity mass | many thin strips creating visual noise |
| 5 | heavy boots on one ground plane | tiny feet, floating stance, or uneven baseline |

At 96 px, the viewer must identify “heavy knight with greatsword” before noticing any ornament.

Value grouping:

- darkest: body cavities, mail, eye slit, cape underside;
- middle: blackened armor planes and burgundy cloth;
- light: blade edges, helmet/pauldron planes, sparse metal accents;
- accent: restrained old gold and the pale tabard emblem.

## 4. Proportion and scale contract

All measurements use the 128×128 logical authoring grid. Delivery values are exactly 4×.

| Measurement | Logical target | Delivery target |
| --- | --- | --- |
| Pivot X | 64 | 256 |
| Foot baseline | 116 | 464 |
| Upright anatomical body height | 84 nominal (82–86) | 336 nominal (328–344) |
| Helmet height | 12–14 | 48–56 |
| Shoulder span excluding cape | 40–44 | 160–176 |
| Torso-to-pelvis length | 27–30 | 108–120 |
| Grounded stance width | 46–56 | 184–224 |
| Greatsword total length | 78–86 | 312–344 |
| Blade width | 6–8 | 24–32 |

Continuity limits:

- Helmet, shoulders, torso, hands, boots, and sword dimensions stay within the global ±3 to ±5 percent limits.
- The sword remains approximately the same length as the armored body.
- Heavy mass comes from width and planar blocks, not head enlargement.
- The cape may change direction but not total apparent material volume by more than 10 percent.
- All poses use the same source-to-frame scale. Translation only is allowed during normalization.

## 5. Key-pose target pack

| Pose | Target | Body-span expectation | Forbidden drift |
| --- | --- | --- | --- |
| Idle | guarded three-quarter stance; sword controlled in both hands across the body; weight centered | 80–82 logical px | oversized head, narrow torso, sword becoming a prop |
| Dash | running lunge toward travel direction; about 20-degree torso lean; long readable thigh and shin; cape trails as one broad wedge | 72–77 logical px through visible joint bending | deep squat, foreshortened short legs, camera zoom, speed lines |
| Attack | strong anticipation or committed diagonal strike; both hands mechanically connected to grip; blade path unobstructed | 74–84 logical px | duplicated hands/blade, random sword enlargement, torso collapse |
| Skill | rotational anticipation or follow-through for Tourbillon d’Acier; wide planted base; circular intent comes from body and sword | 72–80 logical px | baked arc/VFX, airborne spin, unreadable feet, shield |

Planned animation envelopes after key-pose approval:

- Idle: 6 frames, restrained breathing and one cape-weight shift.
- Dash: 6 frames, push, travel, plant, recovery.
- Attack: 8 frames, anticipation, acceleration, contact, follow-through, recovery.
- Skill: 8 frames, coil, rotational release, follow-through, grounded recovery.

These counts are targets for later animation work, not authorization to generate them now.

## 6. Animation consistency checklist

- Same helmet size and angle family in every frame.
- No visible face, skin, or hair.
- Same shoulder and chest modules; no frame invents extra plate layers.
- Both hands remain present and grip the sword whenever the action requires it.
- Greatsword length, blade width, guard, grip, and pommel remain stable.
- Feet share baseline y=116 unless an airborne frame declares a virtual anchor.
- Dash compression is traceable to knees and hips, not scaling.
- Cape is limited to one primary and one secondary mass.
- No more than three principal values per armor material.
- Silhouette passes at 96 px on light and dark backgrounds.
- No frame-specific camera zoom, perspective shift, or fractional resize.
- No baked impact, trail, dust, floor mark, or aura.

## 7. Prompt wording guidance

Execution lock for later generation:

- Model: gpt-image-2.5-sunburst-2026-09-08
- Quality: max
- Fallback: none
- Initial master request: text plus Reference V1 and selected Seed B only; no legacy character image input
- Pose requests: the accepted fresh Alistair master is the only character-image authority
- Generate one master, inspect it, then generate one key pose at a time.

Prompt core:

> Create from scratch a native modern tactical pixel-art sprite of Alistair, an adult heavy frontline knight. Use Reference V1 only for artistic quality and selected Seed B only for production feasibility; do not copy their exact Knight designs and do not derive from any legacy character image. Reconstruct on a 128×128 logical pixel grid for exact 4× nearest-neighbor export to 512×512. Use deliberate connected pixel clusters, bold planar dark-steel armor, restrained deep-red cloth, controlled colored outlines, premium material separation, and strong tactical readability. Identity signals: broad stable authority, fully enclosed original helmet/visor, concealed face, deep-red cape or tabard element, and oversized two-handed heavy greatsword. Keep adult proportions, stable head/body ratio, stable weapon scale, common pivot x=64, baseline y=116, and nominal body height 84 logical pixels. Solid flat #FF00FF background. No legacy rendering inheritance, copied reference costume, painterly texture, micro-noise, smooth 3D rendering, shield, exposed face, extra weapon, baked VFX, text, UI, crop, or edge contact.

Pose suffixes:

- Idle: guarded grounded three-quarter stance, both hands controlling the sword, clear heavy silhouette.
- Dash: orthographic running lunge, moderate lean, long visible legs, no squat distortion or perspective enlargement.
- Attack: readable two-handed anticipation or strike line, mechanically plausible grip, clean blade corridor.
- Skill: grounded rotational Tourbillon d’Acier body mechanics, no baked arc or particles.

## 8. Explicit rejection criteria

Reject immediately if any of the following is true:

- reads as a painted illustration reduced to 512×512;
- shows close visual derivation, tracing, or repainting of a legacy character sprite;
- lacks visible cluster construction on the 128×128 logical grid;
- helmet or torso changes size between poses;
- legs shorten or thicken without a clear joint explanation;
- sword length or width changes by more than 3 percent;
- face, hair, skin, shield, or second weapon appears;
- armor contains dense engraving, rivet noise, or glossy 3D gradients;
- cape becomes many thin strands or obscures the weapon/feet;
- role is not readable at 96 px in monochrome;
- any pose uses independent normalization scale;
- alpha edge, crop, baseline, pivot, or background validation fails.

## 9. Surface acceptance

- Tableau: helmet, grip, tabard, and sword read at 320 px without illustration-level noise.
- Strategic: heavy frontline role reads at 96 px under HUD pressure.
- Combat Stage: sword action line and both feet remain readable; center impact corridor stays clear.

Passing the document contract does not approve a generated asset. Human visual review remains required.

## 10. Current operator gate

Three from-scratch candidates A/B/C now have status `MASTER_CANDIDATE`. Candidate B is recommended for its balance of production feasibility, tactical clarity, material read, and animation-ready simplicity. `ALISTAIR_CHARACTER_MASTER_SELECTED=NO`; no pose generation is authorized until the operator selects A, B, or C.

See [ALISTAIR_MASTER_CANDIDATE_REPORT.md](alistair-master/ALISTAIR_MASTER_CANDIDATE_REPORT.md) and the [A/B/C comparison board](../../../../public/assets/dev/option-c/character-masters/alistair/reviews/alistair-master-abc-comparison.png).
