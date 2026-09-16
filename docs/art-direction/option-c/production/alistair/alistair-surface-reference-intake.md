# Alistair surface-reference intake

Status: `REFERENCE_INTAKE_COMPLETE`

This ledger separates the operator-provided surface references from Alistair identity authority. The mission brief remains authoritative for scope. The canonical sprite remains authoritative for identity.

## Authority and scope

- Mission brief: `RPGThreeJS — OPTION C VISUAL PRODUCTION / ALISTAIR SUNBURST QUALITY BENCHMARK — PHASE A`, SHA-256 `eff0a09e6bd1093ef8f7d177803bbfbbb18dce0aaa9ea594efabc83b907bb246`.
- Art-direction supplement: `Le jeu doit adopter une direction artistique pixel-art moderne / HD-2D premium`, SHA-256 `a7edff20570e49b30614dfc7c482f3818250d5cf48cae7d31588d7f864c11273`.
- Canonical identity source: `public/assets/characters/pixel/full/alistair.png`, SHA-256 `7e16df524ba10c6f42b08843eecafe5456425ba1e22f39567cd933fe23857942`.
- The five images below guide surface cohesion, scale readability, UI-safe composition, lighting, and premium HD-2D finish only. They do not define Alistair's face, helmet, armor, weapon, palette, proportions, or equipment.
- None of the five surface images was sent to the image-generation endpoint. Master and pose requests used the canonical sprite and the selected Alistair master/pose source only.

## Supplied surface references

| Surface intent | Dimensions | SHA-256 | Accepted use |
|---|---:|---|---|
| Travel View | 1672x941 RGB | `634f62d5d8dea5496b845b54201363d19bdbaeeedc17f3408b379f3d1886a7ed` | World palette, depth, premium UI framing |
| Dialogue View | 1672x941 RGB | `1b416544716d8d874affdeac915a536e25b8e803ebdd6d2ac2b011204fb86e11` | Speaker/listener readability and dialogue-safe space |
| Lion Court tableau | 1672x941 RGB | `11749db94263a7deeaab465e644ff16f1d0636553dae0cc06fc89403cb5c55f6` | Hero scale against a high-detail vista |
| Combat Stage View | 1672x941 RGB | `d533babd83d87bfa07b56cda24ba2edc19b6c4066b8920ed2d2483afb8f2a357` | Side-on silhouette, attack corridor, HUD-safe framing |
| Strategic combat | 1672x941 RGB | `438c718ae754e8586d7b19637e0431e4fc129f917c02eb20f9afcad461f28db4` | Tactical-size readability against the existing grid |

## Explicit conflicts resolved

- The dialogue reference depicts an unhelmeted/bearded warrior. Canonical Alistair has a closed vented helmet with no visible face; the canonical sprite wins.
- The supplement's generic `466` baseline and eight-frame animation conventions do not override this mission. Alistair's accepted baseline is `470`, and this delivery contains static master/key-pose authorities only.
- The supplied environments are visual benchmarks, not replacement assets. Runtime proof reuses the existing isolated Forest Road DEV surfaces without changing camera, grid, Combat Stage semantics, or VFX.

