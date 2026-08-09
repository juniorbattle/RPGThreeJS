# R2C-A Held Candidate Visual Source Lock

## Scope and guardrails

R2C-A is a local visual-review pass, not a production VFX migration. The 16
commercial CartoonCoffee source sheets remain ignored under
`public/assets/vfx/megapack-runtime/r2c-a-held/`. They are never added to the
V1/V2 manifests, production preset registry, or gameplay dispatch.

The local-only bench is available at `http://localhost:5174/?r2ca=1`. It
replays a selected held sheet in the real Stage or Tactical route returned by
`resolvePresentationRoute`, without calling `executeAction`. Therefore it
cannot change damage, AP, targeting, AI, rewards, saves, run routing, or any
production VFX fallback.

R0C is preserved by scope. The paired Stage asset
`public/assets/generated/lion-phase/combat-stage/forest_route_stage.webp` is
retained and was not modified. R0C previously reported 772 tests; that count
is historical baseline information rather than a fresh R2C-A R0C audit.

## Native source policy

| Native sheet | Grid | Frames | Cell size |
|---|---:|---:|---:|
| 4096 x 4096 | 8 x 8 | 64 | 512 px |
| 2048 x 2048 | 4 x 4 | 16 | 512 px |

The bench reads these native sheets only while `?r2ca=1` is enabled on
localhost. A resource manager is still required before any production
promotion: all 60 planned native candidates decode to about 3.0 GiB, while
the current source-lock plan represents about 2.66 GiB (39 4K and 14 2K
sources). The practical simultaneous target remains 8 to 12 4K-equivalent
textures.

## Held candidate decisions

`PRESENTATION_TUNE_ONLY` means the source is semantically acceptable but must
be calibrated for anchor, timing, travel, or residue before final runtime
promotion. `NEEDS_ALT` means that no amount of staging turns the source into
the intended action.

| Action | Candidate | Native | Route | Verdict | Decision |
|---|---|---|---|---|---|
| `basic_greatsword_hit` | r1_1709 Impact Cut V6 | 4K, 8x8, 64f | Stage | `PRESENTATION_TUNE_ONLY` | Keep for cut timing and greatsword anchor QA. |
| `basic_crosier_hit` | r1_0483 Healing V5 A | 4K, 8x8, 64f | Stage | `NEEDS_ALT` | Heal semantics do not read as a crosier impact. |
| `basic_longbow_hit` | r1_0961 Projectile Wind Ball Lv1 | 4K, 8x8, 64f | Stage | `NEEDS_ALT` | Missing arrow and piercing identity. |
| `basic_hand_cannon_hit` | r1_0943 Projectile Fire Ball Lv4 | 4K, 8x8, 64f | Stage | `PRESENTATION_TUNE_ONLY` | Needs recoil and muzzle/impact staging to read as cannon fire. |
| `p_interpose` | r1_2599 Jump Wind White v1 | 2K, 4x4, 16f | Tactical | `NEEDS_ALT` | Movement cue does not communicate interception. |
| `d_blood_pact` | r1_1728 Blood Burst v10 | 4K, 8x8, 64f | Tactical | `PRESENTATION_TUNE_ONLY` | Correct blood language; validate short residue only. |
| `l_griffon_jump` | r1_2600 Jump Wind White v2 | 2K, 4x4, 16f | Stage | `PRESENTATION_TUNE_ONLY` | Tune contact position and height. |
| `l_firmament_lance` | r1_1718 Stab V3 | 2K, 4x4, 16f | Stage | `PRESENTATION_TUNE_ONLY` | Tune line orientation and cadence. |
| `n_flame_wave` | r1_0453 Flamethrower 002 | 4K, 8x8, 64f | Stage | `PRESENTATION_TUNE_ONLY` | Correct dedicated source for Flame Wave. |
| `w_sanctuary` | r1_0677 Positive Buff V3 | 4K, 8x8, 64f | Tactical | `PRESENTATION_TUNE_ONLY` | Tune ground center and support linger. |
| `w_miracle` | r1_0494 Healing V7 A | 4K, 8x8, 64f | Stage | `PRESENTATION_TUNE_ONLY` | Suitable high-intensity heal; verify lift and exit. |
| `e_absolute_harmony` | r1_0679 Positive Buff V5 | 4K, 8x8, 64f | Stage | `NEEDS_ALT` | Too generic for a support ultimate signature. |
| `a_hawk_leap` | r1_0707 Power Up Wind Rings | 4K, 8x8, 64f | Tactical | `PRESENTATION_TUNE_ONLY` | Suitable leap support; tune departure timing. |
| `a_arrow_rain` | r1_0004 Arrow Indicator V4 | 4K, 8x8, 64f | Stage | `NEEDS_ALT` | A marker cannot express multi-impact rain. |
| `a_zenith_arrow` | r1_0005 Arrow Indicator V5 | 4K, 8x8, 64f | Stage | `NEEDS_ALT` | Useful anticipation, not an ultimate arrow signature. |
| `ro_jaw_trap` | r1_0300 Circle Cut Out V1 | 2K, 4x4, 16f | Stage | `NEEDS_ALT` | Generic circle does not read as a jaw trap. |

Nine of the sixteen are current source-lock candidates pending presentation
calibration. Seven need an alternate semantic source. No held sheet is
silently promoted by this conclusion.

## Mandatory reservations and exclusions

- `r1_0453` is the only R2C-A candidate for `n_flame_wave`.
- `r1_0450` stays reserved for Dragon Breath and is not mapped to Flame Wave.
- `d_devouring_eclipse` remains an accepted existing source with later
  presentation tuning. It is intentionally not part of this 16-sheet held set.
- No `raw/`, `validation/`, `processed/`, or `rejected/` source is referenced
  by the production runtime through this pass.

## Review procedure

1. Open `?r2ca=1` locally.
2. Select an action route, a held source, and player/foe direction.
3. Replay in both route-appropriate contexts when relevant.
4. Inspect native frame cadence, ground/target anchor, line direction, and
   any temporary occlusion of units or grid.
5. Confirm the provisional verdict or record a replacement source request.
6. Only after final human QA may a separate resource-managed promotion plan be
   proposed.

## R2C-A conclusion

The project has a safe, reproducible source-review lane for all held
candidates. It protects the existing R0C Stage pair and V1/V2 runtime library,
while making the correct presentation route visible for every decision. The
next decision is visual: confirm the nine tune-only candidates in the bench or
replace them with better semantic sources before production integration.
