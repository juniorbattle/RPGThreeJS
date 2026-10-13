# Option C common character style seed — candidate report

DOCTRINE_STATUS: LOCKED

CHARACTER_STYLE_REFERENCE: V1

STYLE_REFERENCE_PATH: `docs/art-direction/option-c/character-style-lock/references/character-style-reference-v1.png`

STYLE_REFERENCE_SHA256: `e4470e9506df2f4c84af286060e85b69983c87cb5bba27d1bb576f50847b7bd7`

GENERATION_MODE: TEXT_PLUS_APPROVED_STYLE_REFERENCE

APPROVED_STYLE_REFERENCE_INPUTS: 1 per generation

LEGACY_CHARACTER_IMAGE_INPUTS: 0

MODEL: `gpt-image-2.5-sunburst-2026-09-08`

QUALITY: `max`

FALLBACK_USED: NO

## Candidate status

| Candidate | Status | Result | Total |
| --- | --- | --- | --- |
| STYLE_SEED_A | VALID_ALTERNATE_NOT_SELECTED | cleanest, strongest tactical read, easiest future animation | 55/60 |
| STYLE_SEED_B | SELECTED_STYLE_AUTHORITY | operator-selected production-feasibility authority | 56/60 |
| STYLE_SEED_C | VALID_ALTERNATE_NOT_SELECTED | richest material treatment; highest animation burden | 53/60 |

The initial 2048×2048 2×2 attempt for every family is preserved as `REJECTED_PROPORTIONS`: the lower row was visibly larger and crossed the intended grid boundary. The accepted attempt 2 uses a single 2048×1152 horizontal lineup with one common baseline. No failed image was silently overwritten.

## QA scorecard

Scores are out of 5. A score of 3 or higher is PASS. Every critical category passes for the normalized candidate; operator visual review remains authoritative.

| Category | A | B | C |
| --- | ---: | ---: | ---: |
| TRUE_PIXEL_ART_CONSTRUCTION | 5 PASS | 5 PASS | 4 PASS |
| MODERNITY | 4 PASS | 5 PASS | 5 PASS |
| TACTICAL_READABILITY | 5 PASS | 4 PASS | 4 PASS |
| SILHOUETTE_DIFFERENTIATION | 5 PASS | 5 PASS | 5 PASS |
| PROPORTION_COHERENCE | 4 PASS | 4 PASS | 4 PASS |
| FACE_CONCEALMENT | 5 PASS | 5 PASS | 5 PASS |
| PIXEL_CLUSTER_DISCIPLINE | 5 PASS | 4 PASS | 4 PASS |
| MATERIAL_READABILITY | 4 PASS | 5 PASS | 5 PASS |
| ANIMATION_FEASIBILITY | 5 PASS | 4 PASS | 3 PASS |
| HD2D_ENVIRONMENT_COMPATIBILITY | 4 PASS | 5 PASS | 5 PASS |
| ROSTER_COHERENCE | 4 PASS | 5 PASS | 5 PASS |
| NO_PAINTERLY_DRIFT | 5 PASS | 5 PASS | 4 PASS |

## Construction result

LOGICAL_CANVAS: 128x128

RUNTIME_CANVAS: 512x512

UPSCALE: NEAREST_NEIGHBOR_X4

PIVOT_LOGICAL: 64

PIVOT_RUNTIME: 256

FOOT_BASELINE_LOGICAL: 116

FOOT_BASELINE_RUNTIME: 464

TARGET_UPRIGHT_BODY_HEIGHT_LOGICAL: approximately 84px

All four classes in a candidate use the same source-to-logical scale. The normalizer translates class components to the shared pivot/baseline and never scales each class independently to fill its canvas. Runtime exports are verified as exact 4×4 repetitions of every logical pixel.

## Final operator selection

CHARACTER_STYLE_SEED_V1: B

Role: production feasibility and technical construction authority. Reference V1 remains the primary artistic-quality authority. B does not cap future hero quality. A and C remain preserved valid alternates.

FINAL_STYLE_SEED_SELECTED: YES

STYLE_SEED_A: VALID_ALTERNATE_NOT_SELECTED

STYLE_SEED_B: SELECTED_STYLE_AUTHORITY

STYLE_SEED_C: VALID_ALTERNATE_NOT_SELECTED

At the style-seed stage, no hero asset was generated. The later, separately authorized gate has now produced Alistair master candidates only; no idle, dash, attack, cast, skill, or animation sheet has been generated.

## Attempts and evidence

IMAGE_GENERATION_ATTEMPTS: 6

- Attempts 1–3: A/B/C 2×2, generated successfully then rejected for row-scale drift.
- Attempts 4–6: A/B/C horizontal lineup, generated successfully and selected for deterministic normalization.
- Every call used one input image with the V1 reference hash and zero legacy character images.
- Request IDs, prompt hashes, input hashes, output hashes, raw dimensions, requested model/quality, and reported model metadata are stored under `public/assets/dev/option-c/style-seed/provenance/`.

Review evidence for every candidate includes four-class lineup, dark background, light background, silhouette-only, grayscale/value, 400% nearest-neighbor inspection, material-detail crops, geometry overlay, baseline overlay, and body-scale comparison under `public/assets/dev/option-c/style-seed/reviews/`.

## Project-state boundary

FILES_CREATED:

- `docs/art-direction/option-c/character-style-lock/references/character-style-reference-v1.png` and its JSON classification;
- `docs/art-direction/option-c/character-style-lock/style-seed/` prompts and report;
- `public/assets/dev/option-c/style-seed/` raw, logical, runtime, review, provenance, and QA artifacts;
- `tools/option-c/build_style_seed_review_artifacts.py` and `tools/option-c/audit_style_seed.py`.

FILES_MODIFIED:

- `docs/art-direction/option-c/character-style-lock/README.md`;
- `docs/art-direction/option-c/character-style-lock/generation-gate.md`;
- `docs/art-direction/option-c/character-style-lock/roster-contract.json`;
- `docs/art-direction/option-c/character-style-lock/qa-report.json`;
- `tools/option-c/audit_character_style_lock.py`.

CANONICAL_ASSETS_CHANGED: NO

RUNTIME_CHANGED: NO

GAMEPLAY_CHANGED: NO

COMBAT_LOGIC_CHANGED: NO

VFX_CHANGED: NO

COMMIT: NO

PUSH: NO

SELECTION RECORDED. ALISTAIR MASTER PRODUCTION MAY PROCEED ONLY UNDER ITS SEPARATE OPERATOR GATE.
