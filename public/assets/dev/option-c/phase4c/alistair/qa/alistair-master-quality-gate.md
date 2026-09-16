# Alistair Character Master quality gate

Status: **PASS**  
Art status: **FINAL_PRODUCTION_CANDIDATE**  
Production approved: **NO**

The selected master is `alistair-master-candidate-a003-chroma`, isolated deterministically and normalized to `512x512 RGBA`.

## Attempt accounting

| Attempt | Result | Defect | Correction |
|---|---|---|---|
| A001 | REJECTED | Black/red semi-transparent vignette; alpha touched edges | Targeted native-alpha cleanup |
| A002 | REJECTED | Semi-transparent halo remained; no fully opaque subject pixels | Switch to exact flat-magenta isolation source |
| A003 | SELECTED | None after deterministic isolation | One bounded magenta-edge cleanup ring |

All requests used `gpt-image-2.5-sunburst-2026-09-08` with quality `max`. The API response did not report a separate model identifier; request IDs and usage are preserved in the provenance JSON files. No fallback was used.

## Hard gates

| Gate | Result |
|---|---|
| Identity fidelity | PASS |
| Silhouette | PASS |
| Weapon | PASS |
| Armor | PASS |
| Palette | PASS |
| Proportions | PASS |
| Hands | PASS |
| Feet | PASS |
| Alpha | PASS |
| Pixel language | PASS |
| Option C style | PASS |

Alpha evidence: `512x512 RGBA`, alpha bbox `[92, 110, 417, 471]`, no nonzero edge pixels, minimum edge clearance `41 px`.

