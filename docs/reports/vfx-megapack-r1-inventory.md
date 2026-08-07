# VFX Mega Pack R1 — Source Inventory

> **R1 deliverable 1/5.** Indexed candidate database for all Mega Pack PNG spritesheets.
> No runtime code, assets, gameplay, presets, mappings, UV, flipY, or frame-order changes.
> Commercial source files remain external to the repository at `<MEGA_PACK_ROOT>`.
> Raw scan output: `<MEGA_PACK_ROOT>/03_inventory_output/r1_inventory_raw.json`.

## Executive summary

| Field | Value |
|---|---|
| **Total assets indexed** | 2769 |
| **Collections scanned** | 6 |
| **Grid format** | Uniform 8×8 (64 frames per sheet) |
| **Runtime target** | 5×5 (25 frames), 256×256 per cell, 1280×1280 sheet |
| **R2 pipeline required** | Yes — every asset needs 64→25 frame resampling + cell resize + repack |
| **License verified** | Yes — Cartoon Coffee commercial license found in `00_archives/` |
| **GIF previews** | Available for 5/6 collections (Water collection has no preview folder) |
| **Bonus textures** | 11 Unity texture/mask folders available |
| **Rejected assets** | 0 (all PNGs read successfully) |

## Source structure

```
<MEGA_PACK_ROOT>/
  00_archives/                          Original ZIPs + license
  01_extracted/                         6 PNG spritesheet collections
    Essentials VFX Spritesheets/        1315 files
    Fire VFX Spritesheets/              111 files
    Lightning VFX Spritesheets/         176 files
    Sword Slash VFX Spritesheets/       121 files
    Water VFX Spritesheets/             770 files
    Wind VFX Spritesheets/              276 files
  02_previews/                          GIF previews (5 collections)
  03_inventory_output/                  R1 raw scan output (external)
  04_selected_candidates/               Empty — R2 staging
  05_conversion_output/                 Empty — R2 pipeline output
  bonus_textures_masks/                 Unity textures + masks (11 subfolders)
```

## Dimension distribution

| PNG dimensions | Cell size (8×8) | Asset count | Percentage |
|---|---|---|---|
| 4096×4096 | 512×512 | 2456 | 88.7% |
| 2048×2048 | 256×256 | 309 | 11.2% |
| 1536×1536 | 192×192 | 3 | 0.1% |
| 8192×8192 | 1024×1024 | 1 | <0.1% |

**Key finding**: 88.7% of source assets have 512×512 cells. The R2 pipeline must downscale from 512→256 (or 1024→256 for the single 8192×8192 asset). The 309 assets at 256×256 cells are already at the target cell size and need only frame resampling + repacking.

## Collection statistics

| Collection | Files | GIF previews | Primary families |
|---|---|---|---|
| Essentials VFX Spritesheets | 1315 | Yes | projectile_impact (611), persistent_loop (504), buff (319), charge (463) |
| Fire VFX Spritesheets | 111 | Yes | burn (85), explosion (117) |
| Lightning VFX Spritesheets | 176 | Yes | projectile_impact, shockwave, aura |
| Sword Slash VFX Spritesheets | 121 | Yes | slash (91), swirl (spin variants) |
| Water VFX Spritesheets | 770 | No | projectile_impact (water/blood), persistent_loop |
| Wind VFX Spritesheets | 276 | Yes | smoke (206), swirl (104), charge (dash variants) |

## Visual family distribution

| Family | Count | Primary collections |
|---|---|---|
| projectile_impact | 611 | Essentials, Water, Lightning |
| persistent_loop | 504 | Essentials, Water |
| charge | 463 | Essentials, Wind |
| buff | 319 | Essentials |
| smoke | 206 | Wind, Essentials |
| explosion | 117 | Essentials, Fire |
| swirl | 104 | Wind, Sword Slash |
| aura | 102 | Essentials |
| slash | 91 | Sword Slash |
| burn | 85 | Fire |
| shockwave | 24 | Essentials, Lightning |
| rune | 25 | Essentials |
| implosion | 15 | Essentials (Impact_Darkness), Wind (Absorb_Wind) |
| poison | 16 | Essentials |
| debuff | 13 | Essentials (Hex_Buff, Negative_Buff) |
| heal | 21 | Essentials (Healing_V1–V5) |
| sparks | 42 | Essentials, Wind |
| freeze | 3 | Essentials (Impact_Ice_Lv1–Lv3) |
| pillar | 3 | Fire (Fire_Pillar) |
| shield | 2 | Essentials (Shield_On, Shield_Off) |
| stun | 2 | Essentials (Stun_Stars_V1, V2) |
| smash | 1 | Essentials (Impact_Punch) |

## Element distribution

| Element | Count | Notes |
|---|---|---|
| neutral | 994 | Default for Essentials collection |
| physical | 477 | Sword Slash + Water (blood) |
| wind | 292 | Wind collection |
| holy | 308 | Healing, buffs, shields, light impacts |
| water | 252 | Water collection |
| lightning | 184 | Lightning collection |
| fire | 126 | Fire collection + fire-tagged Essentials |
| arcane | 38 | Tech, hex, energy projectiles |
| poison | 40 | Poison impacts + poison projectiles |
| dark | 32 | Darkness impacts + charge darkness |
| ice | 26 | Ice impacts + ice projectiles |

## Grid detection methodology

The scan script reads the PNG IHDR chunk (bytes 16–25) for width, height, bit depth, and color type. Grid detection tests all divisions from 1×1 through 12×12, scoring each candidate by:
- **HIGH confidence**: Square cells, common cell size (128/192/256/384/512/1024), common frame count (4/8/9/12/15/16/20/24/25/30/32/36/40/48/49/64/72/80/81/100)
- **MEDIUM confidence**: Square cells with either common size or common count
- **LOW confidence**: Non-square cells with common count

**Result**: All 2769 assets detected as 8×8 grids with HIGH confidence. The Mega Pack uses a uniform grid format across all collections.

## Alpha channel analysis

| Color type | Mode | Alpha | Count |
|---|---|---|---|
| 6 | RGBA | Yes | 2769 |

All source PNGs are RGBA (color type 6) with 8-bit depth. No palette or grayscale images were found. Every asset has a usable alpha channel for transparency compositing.

## R2 pipeline implications

Every source asset requires the following R2 pipeline stages:

1. **Extract**: Unpack 8×8 grid into 64 individual frames
2. **Trim**: Detect alpha bounds and trim empty borders per frame
3. **Resample**: Reduce 64 frames → 25 frames (temporal resampling)
4. **Stabilize**: Recenter by bbox (Mode A) or horizontal-center + baseline (Mode B)
5. **Resize**: Scale each frame to 256×256
6. **Pad**: Add 8px safe padding
7. **Pack**: Repack into 1280×1280 5×5 sheet
8. **Validate**: Check borders, no bleeding, no magenta contamination

**Assets at 256×256 cells** (309 files): Skip resize step; still need frame resampling and repacking.
**Assets at 512×512 cells** (2456 files): Full pipeline including 2× downscale.
**Asset at 1024×1024 cells** (1 file): Full pipeline including 4× downscale.

## Candidate ID scheme

Each asset receives a candidate ID of the form `r1_NNNN` where NNNN is a zero-padded sequential index from `r1_0001` to `r1_2769`. These IDs replace `UNASSIGNED_PENDING_R1` placeholders in the R0 action mappings.

## Notable findings

- **No "meteor" filename**: The Mega Pack does not contain any asset named "meteor". The closest candidates for meteor replacement are `Explosion_Bomb_V5`–`V8` (heavy/ultimate intensity, 512px cells) and `Impact_Darkness_Lv3` (heavy dark implosion).
- **No "void" or "teleport" filename**: No assets are named "void" or "teleport". The closest candidates for teleport/void effects are `Impact_Darkness_Lv1`–`Lv3` (implosion, radial_inward) and `Absorb_Wind_White_v1`–`v3` (implosion, radial_inward).
- **No "guard" or "barrier" filename**: No assets are named "guard" or "barrier". The closest candidates for barrier/guard effects are `Shield_On` and `Shield_Off` (holy, omnidirectional, ground-based).
- **No "execution" filename**: No assets are named "execution". The closest candidates for execution slash are `Blue Slash v1 - Flurry` (heavy, 512px) and `Fire Slash v1 - Flurry` (heavy, 512px).
- **Fire Slash Spin variants**: `Fire Slash v1 - Spin` and `Lightning Slash v1 - Spin` are classified as swirl family with radial_outward direction — strong candidates for `skill_wind_slash_swirl_medium` replacement.
- **Flamethrower assets**: `Flamethrower_001` and `Flamethrower_002` are directional fire effects — strong candidates for `n_flame_wave` redesign.
- **Dash_Wind assets**: `Dash_Wind_White_v1`–`v7` are directional horizontal charge effects — strong candidates for `w_charge` redesign.
- **Stun_Stars loop**: `Stun_Stars_V1` and `V2` are loop-suitable stun effects — direct candidates for status effect display.
- **Healing_V1–V5**: Six healing variants with small/medium/heavy intensity — direct candidates for heal/buff effects.
- **Impact_Ice_Lv1–Lv3**: Three freeze impact variants — candidates for freeze status effects.
- **Impact_Poison_Lv1–Lv2**: Six poison impact variants (with/without bubbles, red variants) — candidates for poison status effects.

## Validation

- **Script**: `tools/vfx/r1_inventory_scan.mjs` (Node.js ESM, no dependencies)
- **Raw output**: `<MEGA_PACK_ROOT>/03_inventory_output/r1_inventory_raw.json`
- **Deliverable**: `docs/reports/vfx-megapack-r1-inventory.json` (2769 candidates, schema-compliant)
- **No runtime files modified**: No changes to `src/`, `public/assets/`, or any runtime configuration
- **No commercial assets copied**: All PNG files remain in the external Mega Pack directory
