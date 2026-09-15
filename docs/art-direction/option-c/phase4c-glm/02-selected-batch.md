# 02 — Selected Batch (Demo Scope Lock)

## Demo Scope Lock

After runtime truth verification, the demo playable roster is:
- warrior (Alistair) — core, always playable
- white_mage (Marian) — core, always playable
- dark_mage (Elara) — core, always playable
- archer (Kestrel) — core, always playable (GOLD_REFERENCE)
- rogue (Cedric) — optional recruit, depth 3, conditional
- lancer (Garen) — optional recruit, depth 12, conditional

Morvan (dark_knight) is NOT demo playable — no recruitUnit effect exists.
Morvan's GLM structural definition is preserved as DEFERRED_POST_DEMO.

## Original GLM selection criteria (superseded by demo scope lock)

1. Maximum silhouette diversity (heavy/robed/lithe)
2. Maximum weapon diversity (greatsword/crosier/scythe)
3. Maximum combat archetype diversity (knight/cleric/knight-dark)
4. Maximum animation demand diversity (heavy swing/staff cast/scythe sweep)
5. High story/runtime importance
6. Exclude Kestrel (gold reference)

## Selected characters

### A. Alistair (warrior) — SCALING_DRAFT

- **Weapon:** greatsword
- **Archetype:** knight (melee frontline)
- **Silhouette:** heavy_frontline — wide defensive stance
- **Palette:** emerald, steel, gold
- **Animation needs:** idle, dash, attack (heavy swing), skill (whirl/charge)
- **Story importance:** Core hero, frontline tank
- **Codex slots:** 5 (master, idle, dash, attack, skill)

### B. Marian (white_mage) — SCALING_DRAFT

- **Weapon:** crosier
- **Archetype:** cleric (support caster)
- **Silhouette:** robed_caster — sacred cleric with staff
- **Palette:** white, gold, silver
- **Animation needs:** idle, dash, attack (staff strike), cast (heal/sanctuary)
- **Story importance:** Core hero, primary healer
- **Codex slots:** 5 (master, idle, dash, attack, cast)

### C. Morvan (dark_knight) — SCALING_DRAFT

- **Weapon:** scythe
- **Archetype:** knight (dark melee)
- **Silhouette:** heavy_dark — dark imposing figure
- **Palette:** dark gold, black, wine
- **Animation needs:** idle, dash, attack (scythe sweep), cast (cursed blade/eclipse)
- **Story importance:** Late recruit, high narrative weight
- **Codex slots:** 5 (master, idle, dash, attack, cast)

## Diversity matrix

| Dimension | Alistair | Marian | Morvan |
|---|---|---|---|
| Weapon | greatsword | crosier | scythe |
| Archetype | knight | cleric | knight |
| Silhouette | heavy_frontline | robed_caster | heavy_dark |
| Body class | heavy | robed | heavy |
| Palette | emerald/steel/gold | white/gold/silver | dark gold/black/wine |
| Combat range | 1 (melee) | 1 (support) | 2 (reach) |
| Animation set | idle/dash/attack/skill | idle/dash/attack/cast | idle/dash/attack/cast |

All three have distinct silhouettes, weapons, palettes, and animation demands.
No two share the same weapon or silhouette class.

## Draft representation

All three characters are SCALING_DRAFT. They use their canonical pixel art
(640×768) as a single-frame idle placeholder. Real Option C animation
sheets (512×512, 6-12 frames per state) are ART_PENDING_CODEX.

The runtime pipeline is fully functional with placeholder art — Codex can
drop in real sheets without architectural changes.
