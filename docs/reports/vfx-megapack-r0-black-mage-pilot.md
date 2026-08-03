# VFX Mega Pack R0 — Black Mage Pilot

> **Pre-purchase planning pass.** No runtime code, assets, gameplay, or mappings were modified.
> The Mega Pack has not yet been purchased or imported. All Mega Pack candidate fields are
> `UNASSIGNED_PENDING_R1`. R1 inventory is blocked until commercial files are locally available.

## Purpose

The Black Mage (Elara, Mage Noir) is the pilot unit for the VFX Mega Pack migration. This
document defines the proposed VFX presentation structure for R0–R5 and clearly separates
deferred gameplay proposals that remain PROPOSAL_ONLY until the R6 approval gate.

## Unit identity

- **Unit**: Elara, Mage Noir (mage class)
- **Combat kind**: magical
- **Weapon**: grimoire (range 1)
- **Elemental identity**: dark / void / shadow
- **Core conflict**: Skill 3 (n_flame_wave) and Ultimate (n_dark_meteor) both read as
  fire-based area attacks, creating a visual identity conflict for a dark/void mage.

## Current state

### Current gameplay mechanics (frozen during R0–R5)

| Slot | actionId | AP | Type | Range | Area | Status | Element |
|---|---|---|---|---|---|---|---|
| Base | basic_grimoire_hit | — | phys | 1 | single | — | dark |
| Skill 1 | n_dark_bolt | 2 | mag | 1–4 | single | root | dark |
| Skill 2 | n_teleport | 3 | move/teleport | 2–3 | — | barrier (upgrade) | void |
| Skill 3 | n_flame_wave | 4 | mag | 1 | cone, radius 1.6 | burn | fire |
| Ultimate | n_dark_meteor | 5 | mag | 2–4 | radius 1.5 | burn+curse | fire/dark |

### Current VFX presentation

| Slot | Preset | Spritesheet | Orientation | ScaleTier | VisualScale | R3H verdict |
|---|---|---|---|---|---|---|
| Base | `basic_grimoire_hit` | `basic_bolt_hit_small` | center_on_target | — | — | NEEDS_REGENERATION |
| Skill 1 | `shadow_lightning_bolt` | `skill_void_rune_orb_medium` | center_on_target | 2ap | — | PASS |
| Skill 2 | `teleport_burst` | `skill_void_spiral_implosion_medium` | source_to_destination | 3ap | — | MANUAL_REVIEW |
| Skill 3 | `skill_fire_impact` | `skill_fire_impact_burst_medium` | center_on_target | 4ap | 1.02 | NEEDS_REGENERATION |
| Ultimate | `ultimate_dark_meteor` | `skill_meteor_impact_burst_heavy` | center_on_aoe_origin | 5ap_ultimate | 1.08 | NEEDS_REGENERATION |

### Confirmed issues

1. **n_flame_wave** — R3G confirmed semantic mismatch: `skill_fire_impact` is a local burst
   that does not communicate cone/wave propagation. The VFX reads as a point explosion, not a
   directional wave.
2. **n_dark_meteor** — R3G P0: `skill_meteor_impact_burst_heavy` has source composition defects
   (fragments in cells), effective scale ~4.48 with additive blending. The VFX reads as fire,
   not dark/void.
3. **Redundancy** — n_flame_wave (fire, burn, cone) and n_dark_meteor (fire+curse, radius 1.5)
   both read as fire-based area attacks. The dark/void identity is lost.

---

## Proposed R0–R5 VFX presentation

> All changes below are VFX presentation only. Gameplay mechanics (AP, damage, elements,
> statuses, targeting, ranges, area shapes, skill slots, combat rules) remain frozen.

### Base — basic_grimoire_hit

| Field | Value |
|---|---|
| **Required visual family** | Small dark/grimoire bolt impact |
| **Tactical presentation requirement** | Compact physical impact at target position; dark palette; should read as a basic ranged physical hit, not a skill-level effect |
| **Processing type** | REPLACE — current sheet is NEEDS_REGENERATION |
| **Mega Pack candidate** | `UNASSIGNED_PENDING_R1` |
| **Change classification** | REPLACE |
| **Approval status** | R0_PLANNING |

### Skill 1 — n_dark_bolt

| Field | Value |
|---|---|
| **Required visual family** | Dark bolt / shadow projectile impact with root crystallization |
| **Tactical presentation requirement** | Projectile arrival + root/snare visual (crystalline or chain effect); dark palette; 2 AP scale; must communicate root status |
| **Processing type** | KEEP — current sheet is PASS |
| **Mega Pack candidate** | `UNASSIGNED_PENDING_R1` |
| **Change classification** | KEEP |
| **Approval status** | R0_PLANNING |

### Skill 2 — n_teleport

| Field | Value |
|---|---|
| **Required visual family** | Void teleport spiral (source dissolve + destination materialize) |
| **Tactical presentation requirement** | Two-phase: departure swirl at source, arrival swirl at destination; dark/void palette; 3 AP scale; should read as utility movement, not damage |
| **Processing type** | TUNE — current sheet is MANUAL_REVIEW |
| **Mega Pack candidate** | `UNASSIGNED_PENDING_R1` |
| **Change classification** | TUNE |
| **Approval status** | R0_PLANNING |

### Skill 3 — n_flame_wave

| Field | Value |
|---|---|
| **Required visual family** | Directional fire wave / cone propagation |
| **Tactical presentation requirement** | VFX must communicate forward propagation from caster toward target area; cone-shaped expanding front; fire palette; 4 AP scale; must NOT read as a local point burst |
| **Processing type** | REDESIGN — current preset (`skill_fire_impact`) is a local burst, confirmed semantic mismatch in R3G |
| **Mega Pack candidate** | `UNASSIGNED_PENDING_R1` |
| **Change classification** | REDESIGN |
| **Approval status** | R0_PLANNING |

**Rationale**: The current `skill_fire_impact` preset spawns a centered burst at the target.
For a cone attack, the VFX should show directional propagation — a wave front expanding from
the caster outward. This is a presentation change only; the gameplay cone shape, range, and
burn status remain unchanged.

### Ultimate — n_dark_meteor

| Field | Value |
|---|---|
| **Required visual family** | Void/dark meteor or gravity implosion (ultimate scale) |
| **Tactical presentation requirement** | Large-scale battlefield event; dark/void palette (not fire); descending or imploding motion; 5 AP ultimate scale; should read as a dark/void catastrophe, not a fire meteor |
| **Processing type** | REPLACE — current sheet is NEEDS_REGENERATION (R3G P0) |
| **Mega Pack candidate** | `UNASSIGNED_PENDING_R1` |
| **Change classification** | REPLACE |
| **Approval status** | R0_PLANNING |

**Rationale**: The current `skill_meteor_impact_burst_heavy` reads as fire (orange/yellow
palette, explosive burst). For a dark mage ultimate named "Météore Obscur", the VFX should
read as void/dark/gravity — a dark implosion, a void meteor, or a gravity collapse. This is
a presentation change only; the gameplay damage, radius, and statuses remain unchanged during
R0–R5.

---

## Deferred R6 gameplay proposals

> The following proposals are PROPOSAL_ONLY. They require a separate R6 approval gate before
> any implementation. No gameplay values are changed during R0–R5.

### Proposal BM-R6-1: Shift n_dark_meteor toward void/dark/gravity

- **Current**: element = fire/dark, status = burn+curse
- **Proposed**: element = void/dark (or gravity), status = curse-only (remove burn)
- **Rationale**: Eliminates redundancy with n_flame_wave. Gives the ultimate a distinct
  dark/void identity matching the unit's theme. The burn status currently makes n_dark_meteor
  read as a fire skill, which conflicts with the dark mage identity.
- **Approval required**: R6 gate

### Proposal BM-R6-2: Reconsider n_flame_wave element

- **Current**: element = fire, status = burn
- **Proposed options**:
  - Option A: Keep fire (maintains elemental diversity within the unit)
  - Option B: Shift to dark/void (unifies unit identity but reduces elemental coverage)
- **Rationale**: If n_dark_meteor shifts to void/dark (BM-R6-1), n_flame_wave could remain
  fire to provide elemental diversity, or shift to dark for identity unity. This decision
  affects the unit's tactical role in encounters with fire-vulnerable or dark-vulnerable enemies.
- **Approval required**: R6 gate

### Proposal BM-R6-3: Slot reordering

- **Current**: Skill 3 = n_flame_wave (fire cone), Ultimate = n_dark_meteor (fire+dark area)
- **Proposed**: If both skills shift toward dark/void, consider reordering slots to ensure
  the ultimate reads as the premium dark/void catastrophe and Skill 3 reads as a tactical
  area attack (directional wave or dark nova).
- **Approval required**: R6 gate

---

## Visual identity target

The Black Mage's VFX should communicate a clear dark/void identity across all five actions:

```
Base:     small dark bolt impact (compact, physical)
Skill 1:  dark bolt + root crystallization (ranged, control)
Skill 2:  void teleport spiral (utility, movement)
Skill 3:  directional fire wave (area, offensive) — or dark wave if R6 approves
Ultimate: void/dark gravity implosion (ultimate, battlefield event)
```

The key visual differentiation between Skill 3 and Ultimate must be:
- **Skill 3**: directional, cone-shaped, medium scale, fire (or dark) — a tactical area attack
- **Ultimate**: omnidirectional, large scale, void/dark — a battlefield catastrophe

This differentiation is achieved through VFX presentation (spritesheet, preset, scale, anchor)
without changing gameplay mechanics during R0–R5.

## Mega Pack candidate requirements

The following visual families will be needed from the Mega Pack for the Black Mage pilot.
Exact asset IDs, filenames, frame counts, and directories are `UNASSIGNED_PENDING_R1` —
they will be assigned during R1 after the commercial pack is purchased and indexed.

| Required visual family | Mega Pack category (estimated) | Processing | Candidate ID |
|---|---|---|---|
| Small dark bolt impact | projectile impact / magic bolt | REPLACE | `UNASSIGNED_PENDING_R1` |
| Dark bolt + root | projectile impact + bind/root | KEEP (current PASS) | `UNASSIGNED_PENDING_R1` |
| Void teleport spiral | teleport / void spiral | TUNE | `UNASSIGNED_PENDING_R1` |
| Directional fire wave | directional wave / cone blast | REDESIGN | `UNASSIGNED_PENDING_R1` |
| Void/dark gravity implosion | implosion / meteor / ultimate | REPLACE | `UNASSIGNED_PENDING_R1` |

## Safety statement

No runtime code, spritesheet definitions, presets, mappings, gameplay values, or PNG files
were modified. All gameplay proposals are PROPOSAL_ONLY until the R6 approval gate. All Mega
Pack candidate fields are `UNASSIGNED_PENDING_R1`. The Mega Pack source root remains
configurable as `<MEGA_PACK_ROOT>` and outside `public/assets/`. No commercial assets are
copied, referenced through public runtime paths, or committed.
