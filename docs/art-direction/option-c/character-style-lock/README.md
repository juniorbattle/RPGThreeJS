# Option C — modern tactical pixel-art character lock

Status: ALISTAIR_MASTER_CANDIDATES_READY_FOR_OPERATOR_REVIEW

This directory is the current aesthetic and generation-contract authority for the active character batch. It does not approve production assets and does not authorize runtime integration.

## Final visual authority order

1. `CHARACTER_STYLE_REFERENCE_V1`: primary artistic-quality authority.
2. `CHARACTER_STYLE_SEED_V1=B`: production-feasibility and technical-construction authority, not the quality ceiling.
3. This locked character-style doctrine.
4. The character-specific semantic contract, checked against repository game truth for class, weapon, role, skills, and actor ID.
5. The generation prompt.

Legacy character PNGs remain semantic reference only: class, broad silhouette intent, palette intent, weapon/equipment family, role readability, and integration expectations. Kestrel Phase 4B remains structural surface/timing evidence only. Older Option C moodboards and generated candidates remain historical evidence or rejection examples only.

When an older document asks for high-density illustrative detail or direct canonical-image editing, this lock wins.

## Fresh-base generation doctrine

Every new sprite master is built from scratch in the locked modern tactical pixel-art language.

- Legacy character images must not be attached to image-generation or image-edit requests.
- Do not trace, upscale, repaint, inpaint, or closely derive new sprites from legacy character pixels.
- Preserve semantic identity, not legacy rendering, anatomy, pose geometry, or surface treatment.
- The common style-seed gate uses exactly one visual input: the operator-approved `CHARACTER_STYLE_REFERENCE_V1`; it is style authority only and may not supply identity, costume, or pose geometry.
- For a fresh hero master, the only visual inputs allowed are Reference V1 and the operator-selected Seed B; the first visual input allowed for a later hero pose is that hero's newly generated and operator-accepted fresh master.
- A shared newly generated roster style seed may guide Alistair, Marian, Elara, and a future Kestrel remaster.
- Legacy-derived generated candidates must not become parents of the fresh pipeline.

The legacy PNG path and hash remain documented only to protect the source and audit which broad identity signals were extracted.

## Scope

Active production-direction batch:

| Character | Runtime ID | Role | Contract |
| --- | --- | --- | --- |
| Alistair | warrior | heavy greatsword knight | [Alistair contract](alistair.md) |
| Marian | white_mage | masked sacred support caster | [Marian contract](marian.md) |
| Elara | dark_mage | arcane grimoire caster | [Elara contract](elara.md) |

Kestrel remains the structural benchmark and remaster anchor. See [Kestrel benchmark alignment](kestrel-benchmark.md).

Not in scope: other heroes, enemies, NPCs, environments, VFX production, gameplay logic, combat logic, save schema, routes, narrative truth, choice effects, or production media.

## Global sprite construction doctrine

The target is a sprite designed natively for a tactical RPG, not a reduced illustration.

| Property | Locked rule |
| --- | --- |
| Logical authoring canvas | 128×128 pixels |
| Delivery canvas | 512×512 RGBA |
| Export transform | exact nearest-neighbor 4×; no fractional resampling |
| Pivot | logical x=64; delivery x=256 |
| Ground baseline | logical y=116; delivery y=464 |
| Bottom clear margin | 12 logical pixels; 48 delivery pixels |
| Grounded-frame tolerance | baseline ±1 logical pixel; ±4 delivery pixels |
| Per-pose scale | exactly 1.000 relative to the approved character master |
| Body-height family | 82–86 logical pixels from foot plane to anatomical head or helmet crown; nominal target 84 |
| Tactical proof size | 96 px high preview, nearest-neighbor |
| Mid-size proof | 160 px high preview |
| Tableau/stage proof | 320 px high preview |
| Background during generation | solid #FF00FF for deterministic isolation |
| Final delivery | transparent RGBA, no matte fringe, no baked shadow, UI, text, or VFX |

Plumes, hats, staff heads, sword tips, cape tails, and spell props are excluded from anatomical body-height measurement. They are measured separately and must not drive normalization.

## Pixel language

- Build contours with deliberate one- and two-pixel logical steps.
- Use large connected value masses before internal detail.
- Keep three principal values per material; a fourth highlight is allowed only on focal metal or magic.
- Use one coherent dark outline philosophy across the roster: darkest on exterior separations, colored and lighter inside.
- Keep material separation readable through value and hue before texture.
- Reserve single-pixel accents for eyes, clasps, blade glints, and spell foci.
- Limit decorative trim to identity-bearing motifs that survive at 96 px.
- Use controlled cluster-level anti-aliasing only. No soft brush, blur, airbrush gradient, or high-frequency surface noise.
- Cloth motion uses one or two broad masses, not many hair-like strips.
- Metal reads through planar value blocks and sparse edge highlights, not dozens of rivets.
- Character contrast must be slightly stronger and simpler than the environment.

## Shared proportion and continuity rules

Every pose is a re-pose of one approved body model.

- Head or helmet apparent width and height: maximum ±3 percent from the master.
- Shoulder span, torso length, pelvis width, hand size, and boot size: maximum ±4 percent.
- Limb segment thickness: maximum ±5 percent.
- Weapon total length and blade/staff/book module dimensions: maximum ±3 percent.
- Palette-area balance: maximum ±8 percent per primary material group unless occlusion explains the difference.
- The normalizer may translate a pose to the common pivot and baseline. It may not independently rescale a pose.
- Pose compression must be explained by visible joint bending. Camera zoom, perspective enlargement, and anatomical shortening are failures.
- Mirroring occurs at runtime. Do not redraw a second-facing sprite unless a later contract explicitly requires it.
- Baked VFX are forbidden. A small identity focus such as Marian's catalyst gem or Elara's eye glow may remain, but projectiles, impact bursts, rings, trails, and floor sigils are separate assets.

## Silhouette hierarchy

The roster must remain readable in monochrome at 96 px:

1. Alistair: broad armored wedge plus oversized greatsword.
2. Marian: upright crosier plus clean white triangular robe mass.
3. Elara: pointed hat plus open grimoire and asymmetric casting hand.
4. Kestrel: compact hooded diagonal plus longbow and quiver.

No two characters may rely on color alone for differentiation.

## Surface proof matrix

| Surface | Required proof |
| --- | --- |
| Dialogue tableau | 320 px actor; face or mask, weapon, hands, and lower silhouette readable; no clash with rich background |
| Strategic combat | 96 px actor under representative UI pressure; class readable in under one second; no internal noise collapse |
| Combat Stage | 160–320 px actor; action line and attacker/target relationship readable; center impact corridor remains open |

Every selected master and key-pose pack requires transparent, dark, light, silhouette, 96 px, and three-surface review sheets.

## Production sequence

1. Lock the semantic character contracts.
2. Generate a fresh roster style seed from text plus exactly one approved style reference image, with no legacy character image input.
3. Record `CHARACTER_STYLE_SEED_V1=B` as the selected technical authority.
4. Generate fresh A/B/C character-master candidates from the semantic contract, Reference V1, and Seed B.
5. Review silhouette at 96 px before any action pose.
6. Produce idle, dash, attack, and cast/skill key poses using only the accepted fresh master.
7. Measure module proportions against the fresh master.
8. Reject or approve the key-pose pack.
9. Only after operator approval, generate full animation frames.
10. Validate the resulting animation on all three surfaces.

Blind mass generation is forbidden.

## Current candidate classification

The existing high-detail Alistair Sunburst pack remains preserved as historical process and rejection evidence only. It was derived with legacy character imagery in its generation lineage and therefore cannot be a visual base, identity parent, pose parent, or rendering benchmark for the fresh pipeline.

This classification does not delete or overwrite any legacy or DEV asset. It prevents accidental reuse of the current detailed candidate as the final roster style target.

Known state discrepancy: the existing DEV runtime definition still labels that Alistair pack FINAL_PRODUCTION_CANDIDATE from the earlier phase. This doctrine supersedes that aesthetic assessment and classifies the pack as LEGACY_DERIVED_REJECTED_FOR_NEW_PIPELINE. The runtime definition is intentionally untouched because this mission does not authorize deployment changes. Reconciliation belongs to a later operator-approved visual-production phase.

The new from-scratch Alistair A/B/C masters are `MASTER_CANDIDATE` only. B is recommended, but no candidate is selected. Their review gate is documented in [the Alistair master candidate report](alistair-master/ALISTAIR_MASTER_CANDIDATE_REPORT.md).

## Deliverables

- [Alistair contract](alistair.md)
- [Marian contract](marian.md)
- [Elara contract](elara.md)
- [Kestrel benchmark alignment](kestrel-benchmark.md)
- [Generation and review gate](generation-gate.md)
- [Selected style seed record](style-seed/README.md)
- [Alistair master candidate report](alistair-master/ALISTAIR_MASTER_CANDIDATE_REPORT.md)
- [Machine-readable roster contract](roster-contract.json)

## Promotion boundary

These documents do not set PRODUCTION_APPROVED, modify runtime definitions, or authorize canonical replacement. The operator must select `ALISTAIR_CHARACTER_MASTER_V1=A|B|C` before any pose work.
