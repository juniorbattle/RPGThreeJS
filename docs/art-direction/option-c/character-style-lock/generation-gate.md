# Character generation and review gate

Status: PREPRODUCTION_GATE_LOCKED

This gate applies to Alistair, Marian, and Elara. It forbids blind batch generation.

## Model execution lock

| Field | Required value |
| --- | --- |
| Model | gpt-image-2.5-sunburst-2026-09-08 |
| Quality | max |
| Fallback | none |
| Background | opaque flat #FF00FF |
| Raw size | 2048×2048 or another explicitly approved high-resolution working canvas |
| Final construction proof | 128×128 logical pixels |
| Delivery | exact 4× nearest-neighbor 512×512 RGBA |

The model request must preserve request ID, prompt hash, input hashes, output hash, model requested, quality requested, response metadata, and fallback status.

## Source-material lock

- Legacy character PNGs and legacy animation frames are never model inputs.
- Legacy-derived generated candidates are never model inputs for the fresh pipeline.
- The fresh roster style seed was generated from text plus exactly one approved visual input: `CHARACTER_STYLE_REFERENCE_V1`.
- The operator selected `CHARACTER_STYLE_SEED_V1=B`; it is the production-feasibility authority, while Reference V1 remains the primary artistic-quality authority.
- The approved style reference is not identity authority, a direct design template, a pose template, or permission to copy exact costumes.
- Each fresh character master is generated from its written semantic contract plus Reference V1 and the approved fresh roster style seed. No legacy character image is allowed.
- Each key pose may use only the accepted fresh master and, when needed, a geometry-only layout guide.
- Tracing, repainting, upscaling, inpainting, image-to-image derivation, and close pose copying from legacy characters are forbidden.

## Ordered production gate

### Gate 0 — semantic authority intake

- Record the legacy source path, dimensions, SHA-256, alpha bounds, runtime ID, class, weapon family, faction/personality signals, and relevant skill IDs.
- Extract only broad semantic identity: class, silhouette intent, palette intent, equipment family, role readability, and integration expectations.
- Resolve contradictions in favor of repository game truth.
- Mark all legacy character imagery as REFERENCE_ONLY_NOT_A_MODEL_INPUT.

Pass condition: one signed semantic ledger with no unresolved contradiction and an explicit prohibition on using legacy pixels as visual source material.

### Gate 1 — fresh roster style seed

- Generate from the global written doctrine plus exactly one attached copy of `CHARACTER_STYLE_REFERENCE_V1`.
- Record the reference path and SHA-256, and prove that every request has one approved style-reference input and zero legacy-character image inputs.
- Do not attach any legacy character image, Phase 4B frame, legacy-derived candidate, rejected master, or screenshot containing legacy RPGThreeJS characters.
- Learn only pixel language, proportion family, concealment, material abstraction, class readability, and roster coherence; do not copy exact costume, identity, or pose geometry.
- Prove the 128×128 cluster language, outline philosophy, material simplification, adult proportion family, and 96 px readability.
- Treat the seed as style and construction authority, not as a game character.

Pass condition: operator accepts one from-scratch visual base for the roster.

### Gate 2 — fresh character master

- Generate A/B/C master candidates from the semantic character contract, Reference V1, and approved fresh roster style seed B.
- Do not attach any legacy character asset or legacy-derived candidate.
- Reduce it to the 128×128 logical grid before judging sprite authenticity.
- Review at 512, 320, 160, and 96 px.
- Reject painted detail that disappears or turns to noise at 96 px.

Pass condition: identity, silhouette, cluster construction, palette grouping, equipment, alpha, and 96 px readability all pass.

### Gate 3 — key poses

- Generate idle first.
- Generate dash only after idle passes.
- Generate attack only after dash passes.
- Generate cast/skill only after attack passes.
- Use the accepted fresh master as the sole character-image anatomy and module-size authority every time.
- Do not use legacy pose images or legacy-derived candidates as motion references.
- A geometry-only stick figure or layout guide may define direction and joint placement but may not contain character rendering.
- A rejected pose remains preserved with a defect reason; it is never silently overwritten.

Pass condition: four selected key poses pass their character contract.

### Gate 4 — measured continuity

For master plus all four key poses, report:

- exact source-to-frame scale;
- pivot and baseline;
- anatomical body height excluding external silhouette features;
- head or helmet box;
- shoulder span;
- torso length;
- hand and boot boxes;
- weapon module dimensions;
- palette-area ratios;
- alpha bounds and edge clearance.

Pass condition: scale deviation is zero and every module remains inside the locked tolerance unless a documented occlusion explains the measurement.

### Gate 5 — sprite-language review

Produce:

1. full-size contact sheet;
2. 128×128 logical-pixel sheet;
3. 96 px gameplay-readability sheet;
4. light-background sheet;
5. dark-background sheet;
6. monochrome silhouette sheet;
7. anatomy/module overlay;
8. baseline/pivot overlay;
9. palette and value-group sheet.

Pass condition: no reviewer must zoom in to identify class, weapon, facing, or action.

### Gate 6 — surface proof

Place the same selected assets without per-pose resizing in:

- dialogue tableau at 320 px;
- strategic combat at approximately 96 px under representative UI pressure;
- Combat Stage at 160–320 px with VFX hidden, then with representative VFX layered separately.

Pass condition: all three surfaces pass at 1920×1080 and 1366×768.

### Gate 7 — operator review

Codex may classify a complete pack as FINAL_PRODUCTION_CANDIDATE. Only the operator may authorize:

- full animation generation;
- runtime integration beyond DEV proof;
- canonical replacement;
- manifest promotion;
- PRODUCTION_APPROVED.

## Prompt construction rules

Every prompt must contain:

- native modern tactical pixel-art sprite;
- 128×128 logical pixel grid;
- exact 4× nearest-neighbor delivery intent;
- readable at 96 pixels;
- written semantic identity invariants;
- explicit from-scratch instruction and a ban on legacy image derivation;
- stable adult anatomy and named module-size locks;
- same body model and same scale across poses;
- one unambiguous action;
- solid flat #FF00FF background;
- no painterly texture, micro-noise, smooth 3D render, baked VFX, UI, text, crop, or edge contact.

Avoid vague phrases such as “highly detailed,” “cinematic character illustration,” “ultra-realistic armor,” or “intricate fabric.” They encourage the rejected cutout-art direction.

## Required failure statuses

Use explicit statuses:

- PASS
- REJECTED_IDENTITY
- REJECTED_PIXEL_LANGUAGE
- REJECTED_PROPORTIONS
- REJECTED_WEAPON
- REJECTED_ALPHA
- NEEDS_MANUAL_REVIEW
- FINAL_PRODUCTION_CANDIDATE

Never convert NEEDS_MANUAL_REVIEW into PASS merely because machine geometry passes.

## Global rejection checklist

Reject if:

- any legacy character image or legacy-derived candidate appears in request inputs;
- the result traces, repaints, or closely inherits legacy pose geometry or rendering;
- the asset reads as an illustration at 512 and collapses at 96 px;
- the 128×128 logical reduction does not retain intentional cluster shapes;
- anatomy, head, hands, feet, armor, cloth, book, staff, bow, or sword drifts between poses;
- a normalizer independently rescales frames;
- a pose depends on baked VFX for action readability;
- material detail overwhelms class silhouette;
- facing, action, weapon, or ground contact is ambiguous;
- any canonical identity invariant is lost;
- any protected system or production asset changes without explicit authorization.

## Current stop point

`CHARACTER_STYLE_REFERENCE_V1` is the primary artistic-quality authority and `CHARACTER_STYLE_SEED_V1=B` is the selected production-feasibility authority. The current gate authorizes only Alistair A/B/C master candidates. Stop before idle, dash, attack, skill/cast, animation batches, runtime integration, or canonical replacement, and wait for the operator to select `ALISTAIR_CHARACTER_MASTER_V1`.
