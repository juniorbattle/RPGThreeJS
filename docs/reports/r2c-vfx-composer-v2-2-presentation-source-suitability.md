# R2C VFX Composer V2.2 — Presentation + source suitability lock

Date: 2026-08-13

## Executive result

The Composer now treats every authored visual slot as a foreground impact effect, keeps native PNG transparency, removes author-facing opacity/fade controls, and applies the locked size profiles `LOW 1.80`, `MID 2.50`, and `BIG 3.40`.

The complete CartoonCoffee inventory was classified without deleting records. The default Composer catalogue hides only five confirmed UI indicator sheets. Two conclusively invalid bow assignments were repaired; uncertain but usable effects remain available for deliberate visual review instead of being silently discarded.

No gameplay, targeting, damage, AP, AI, routing, save, or economy logic was changed.

## Presentation lock

| Concern | Locked behavior |
| --- | --- |
| Size profiles | LOW `1.80`, MID `2.50`, BIG `3.40` |
| Opacity | `1.0`; native PNG alpha is preserved |
| Fade envelope | No automatic fade-in or fade-out (`fadeIn=0`, `fadeOut=1`) |
| Composer layer | Every visual slot compiles to `impact` |
| Depth | `depthTest=false`, `depthWrite=false` |
| Render priority | Impact sheets at order `74`, above persistent status indicators at order `60` |
| TARGET | Anchored to target, foreground impact |
| CASTER | Anchored to source, foreground impact |
| GROUND | Ground-positioned at target, but still foreground impact |
| AUTO | Semantic anchor chosen by the action, foreground impact |
| Technical polish | AUTO / OFF / LIGHT / STRONG preserved |
| Reduced graphics | Existing scale and technical-polish compensation preserved |

The Advanced Composer section no longer exposes `opacity`, `fadeIn`, `fadeOut`, or a layer/depth selector. Several authored slots may intentionally overlap at impact time.

## Source suitability inventory

Source: `docs/reports/vfx-megapack-r1-2-4-corrected-inventory.json`

| Classification | Count | Default catalogue |
| --- | ---: | --- |
| COMBAT_EFFECT | 1,589 | Visible |
| SUPPORT_EFFECT | 420 | Visible |
| AMBIGUOUS_REVIEW | 755 | Visible, explicitly reviewable |
| INDICATOR_UI | 5 | Hidden by default |
| **Total** | **2,769** | **2,764 visible** |

Confirmed UI-only indicators hidden from the default catalogue:

- `r1_0001` — `Arrow_Indicator_V1_spritesheet.png`
- `r1_0002` — `Arrow_Indicator_V2_spritesheet.png`
- `r1_0003` — `Arrow_Indicator_V3_spritesheet.png`
- `r1_0004` — `Arrow_Indicator_V4_spritesheet.png`
- `r1_0005` — `Arrow_Indicator_V5_spritesheet.png`

Classification is deterministic and based on normalized ID, filename, path, and collection metadata. Terms such as `arrow` are not rejected alone; only the explicit indicator family is classified as UI-only.

## Conclusive assignment repairs

| Action | Rejected source | Repaired source | Rationale |
| --- | --- | --- | --- |
| `a_arrow_rain` | `r1_0004` — Arrow Indicator V4 | `r1_0614` — `Impact_Wind_Lv3_spritesheet.png` | The previous source was an aiming/UI indicator, not an action effect. The replacement gives a readable wind-field impact without inventing a projectile asset. |
| `a_zenith_arrow` | `r1_0005` — Arrow Indicator V5 | `r1_0963` — `Projectile_Wind_Ball_Lv3_spritesheet.png` | The previous source was an aiming/UI indicator. The replacement supplies a strong directional projectile suitable for the ultimate. |

Repairs are applied when a Composer draft is created, loaded, or imported. Existing stored drafts are therefore corrected without rewriting unrelated assignments.

## Bow and ranged action audit

| Action | AP | Assigned source | Suitability decision |
| --- | ---: | --- | --- |
| `basic_longbow_hit` | Basic | `r1_0961` — Projectile Wind Ball Lv1 | `AMBIGUOUS_REVIEW`: mechanically readable, but its magical wind-ball identity is weaker than a true arrow. Preserved pending human review. |
| `a_precise_shot` | 2 | `r1_0952` — Projectile Light Ball Lv3 | `AMBIGUOUS_REVIEW`: valid combat projectile, but holy/light identity may be too magical for a precise physical shot. Preserved pending human review. |
| `a_hawk_leap` | 3 | `r1_0707` — Power Up Wind Rings | `SUPPORT_EFFECT`: suitable for a wind-assisted movement action; keep with visual review. |
| `a_arrow_rain` | 4 | `r1_0614` — Impact Wind Lv3 | `COMBAT_EFFECT`: repaired and suitable as the field-impact layer. |
| `a_zenith_arrow` | 5 | `r1_0963` — Projectile Wind Ball Lv3 | `COMBAT_EFFECT`: repaired and suitable as a strong directional ultimate projectile. |
| `ar_calibrated_shot` | 2 | `r1_0942` — Projectile Fire Ball Lv3 | `COMBAT_EFFECT`: valid directional combat source. |
| `ar_explosive_retreat` | 3 | `r1_0430` — Explosion Bomb V2 | `COMBAT_EFFECT`: valid radial explosive source. |
| `ar_incendiary_grenade` | 4 | `r1_0431` — Explosion Bomb V3 | `COMBAT_EFFECT`: valid incendiary impact source. |
| `ar_artillery_barrage` | 5 | `r1_0432` — Explosion Bomb V4 | `COMBAT_EFFECT`: valid high-tier barrage impact source. |

Result: two invalid UI assignments repaired, two assignments deliberately retained as ambiguous review cases, and no remaining conclusive indicator assignment in this ranged set.

## Preservation and QA

- Existing production VFX manifests and gameplay definitions were not edited.
- The complete 2,769-record inventory remains intact.
- UI indicators remain accessible to audit code but are excluded from the default authoring catalogue.
- Automated tests cover exact sizing, no-fade compilation, foreground layering, classifier counts, filtering, assignment repair, persistence repair, and the no-fade runtime envelope.
- Browser QA verified the real Composer at `http://127.0.0.1:5174/?qa=1&vfx=1&r2ca=1&vfxlab=1` with `MEGA_PACK_ROOT` configured, including repaired `512x512` source previews, the 2,764-candidate default catalogue, source categories, LOW/MID/BIG controls, and all three playback routes.

## Validation

- `npm.cmd test`: PASS — 46 files, 1,006 tests.
- `npm.cmd run build`: PASS — includes `tsc --noEmit`; existing bundle-size warning only.
- `git diff --check`: PASS — CRLF conversion warnings only.
- Commit: NO.
- Push: NO.
