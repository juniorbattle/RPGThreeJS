# Alistair from-scratch character master — operator report

CHARACTER_STYLE_REFERENCE: V1

CHARACTER_STYLE_REFERENCE_ROLE: PRIMARY_ARTISTIC_QUALITY_AUTHORITY

CHARACTER_STYLE_SEED_V1: B

CHARACTER_STYLE_SEED_ROLE: PRODUCTION_FEASIBILITY_AUTHORITY

FINAL_STYLE_SEED_SELECTED: YES

STYLE_SEED_A: VALID_ALTERNATE_NOT_SELECTED

STYLE_SEED_B: SELECTED_STYLE_AUTHORITY

STYLE_SEED_C: VALID_ALTERNATE_NOT_SELECTED

## Master status

ALISTAIR_MASTER_A_STATUS: MASTER_CANDIDATE

ALISTAIR_MASTER_B_STATUS: MASTER_CANDIDATE

ALISTAIR_MASTER_C_STATUS: MASTER_CANDIDATE

All three accepted masters are new interpretations built from Reference V1 and Seed B only. They do not use legacy RPGThreeJS character pixels, previous Alistair candidates, Kestrel art, screenshots containing legacy character art, or legacy pose sheets. The first generated version of each letter remains preserved as an explicit artistic rejection because it inherited too much of the anonymous V1 Knight's literal costume structure.

## Independent QA

Scores are out of 5. Every category is evaluated on the accepted logical 128×128 candidate, not on the high-resolution Sunburst raw.

| Category | A | B | C |
| --- | ---: | ---: | ---: |
| TRUE_PIXEL_ART_CONSTRUCTION | 5 PASS | 5 PASS | 5 PASS |
| MODERNITY | 5 PASS | 5 PASS | 5 PASS |
| REFERENCE_V1_VISUAL_MATCH | 5 PASS | 4 PASS | 5 PASS |
| SEED_B_TECHNICAL_COMPATIBILITY | 4 PASS | 5 PASS | 4 PASS |
| FACE_CONCEALMENT | 5 PASS | 5 PASS | 5 PASS |
| SILHOUETTE_READABILITY | 5 PASS | 4 PASS | 5 PASS |
| PROPORTION_COHERENCE | 4 PASS | 5 PASS | 5 PASS |
| ARMOR_READABILITY | 5 PASS | 5 PASS | 5 PASS |
| WEAPON_READABILITY | 5 PASS | 5 PASS | 5 PASS |
| PIXEL_CLUSTER_DISCIPLINE | 4 PASS | 5 PASS | 4 PASS |
| MATERIAL_READABILITY | 5 PASS | 5 PASS | 5 PASS |
| ANIMATION_FEASIBILITY | 4 PASS | 5 PASS | 4 PASS |
| TACTICAL_READABILITY | 4 PASS | 5 PASS | 5 PASS |
| HD2D_ENVIRONMENT_COMPATIBILITY | 5 PASS | 5 PASS | 5 PASS |
| NO_PAINTERLY_DRIFT | 5 PASS | 5 PASS | 5 PASS |
| Total | 70/75 | 73/75 | 72/75 |

### A — Fortress Vanguard

A has the broadest defensive mass, strongest cape identity, and clearest fortress-knight authority. Its short asymmetric half-cape, flat chamfered helmet, horizontal cuirass bands, and slab greatsword remain original. The added cloth volume and broad weapon silhouette make it slightly more expensive to animate than B.

### B — Balanced Tactical

B has the cleanest module separation, most restrained ornament, strongest Seed-B compatibility, and easiest future animation. The low domed sallet, fluted cuirass, short red surcoat panels, and low diagonal greatsword read clearly without reproducing V1's Knight costume. It is less visually rich than A/C, but retains premium material clarity at the logical scale.

### C — Segmented Vanguard

C has the most distinctive plate organization: flat barrel helm, chevron cuirass, hexagonal shoulder caps, four short red panels, and a broad leaf-taper greatsword. It is visually sophisticated and tactically clear; the long leftward blade produces the widest silhouette and moderately increases animation-envelope cost.

RECOMMENDED_ALISTAIR_MASTER: B

Reason: B best balances Reference-V1 material quality with Seed-B construction discipline, tactical readability, clean module boundaries, and future animation feasibility. This is a recommendation only.

ALISTAIR_CHARACTER_MASTER_SELECTED: NO

## Geometry and pixel contract

GENERATION_MODE: TEXT_PLUS_APPROVED_STYLE_AUTHORITIES

LEGACY_CHARACTER_IMAGE_INPUTS: 0

LOGICAL_CANVAS: 128x128

RUNTIME_CANVAS: 512x512

UPSCALE: NEAREST_NEIGHBOR_X4

PIVOT_LOGICAL: 64

PIVOT_RUNTIME: 256

FOOT_BASELINE_LOGICAL: 116

FOOT_BASELINE_RUNTIME: 464

TARGET_UPRIGHT_BODY_HEIGHT_LOGICAL: approximately 84px

Every accepted candidate has a measured logical body height of exactly 84 px, pivot x=64, baseline y=116, and minimum edge clearance of 12 px. The raw source correction targets the shared 84 px body-height contract; it never scales a candidate merely to fill its canvas. All 512×512 files are verified exact 4×4 repetitions of their logical pixels.

MODEL: gpt-image-2.5-sunburst-2026-09-08

QUALITY: max

FALLBACK_USED: NO

IMAGE_GENERATION_ATTEMPTS: 6

- A attempt 1: `REJECTED_REFERENCE_COPY_DRIFT`; preserved.
- A attempt 2: `MASTER_CANDIDATE`; normalized.
- B attempt 1: `REJECTED_REFERENCE_COPY_DRIFT`; preserved.
- B attempt 2: `MASTER_CANDIDATE`; normalized.
- C attempt 1: `REJECTED_REFERENCE_COPY_DRIFT`; preserved.
- C attempt 2: `MASTER_CANDIDATE`; normalized.

## Review artifacts

- [A/B/C comparison](../../../../../public/assets/dev/option-c/character-masters/alistair/reviews/alistair-master-abc-comparison.png)
- Logical sprites: `public/assets/dev/option-c/character-masters/alistair/logical-128/`
- Exact 4× runtime sprites: `public/assets/dev/option-c/character-masters/alistair/runtime-512/`
- Dark, light, silhouette, grayscale, 400%, armor, helmet, sword, geometry, and pivot/baseline boards: `public/assets/dev/option-c/character-masters/alistair/reviews/`
- Request provenance and six-attempt manifest: `public/assets/dev/option-c/character-masters/alistair/provenance/`
- Metrics, scorecard, and deterministic audit: `public/assets/dev/option-c/character-masters/alistair/qa/`

## Project boundary

FILES_CREATED:

- Alistair master prompts and this report under `docs/art-direction/option-c/character-style-lock/alistair-master/`;
- all raw, isolated, logical, runtime, review, provenance, and QA master artifacts under `public/assets/dev/option-c/character-masters/alistair/`;
- `tools/option-c/build_alistair_master_review_artifacts.py`;
- `tools/option-c/audit_alistair_master.py`.

FILES_MODIFIED:

- character-style lock authority, Alistair semantic contract, generation gate, and roster contract;
- style-seed final-selection records, manifest, scorecard, audit, and deterministic builder.

CANONICAL_ASSETS_CHANGED: NO

RUNTIME_CHANGED: NO

GAMEPLAY_CHANGED: NO

COMBAT_LOGIC_CHANGED: NO

VFX_CHANGED: NO

COMMIT: NO

PUSH: NO

STOP. WAIT FOR OPERATOR SELECTION OF ALISTAIR CHARACTER MASTER.
