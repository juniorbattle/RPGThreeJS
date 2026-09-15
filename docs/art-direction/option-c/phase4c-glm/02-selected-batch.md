# 02 — Selected Batch (Demo Scope Lock)

## Demo Scope Lock (CURRENT)

After runtime truth verification, the demo playable roster is:
- warrior (Alistair) — core, always playable
- white_mage (Marian) — core, always playable
- dark_mage (Elara) — core, always playable
- archer (Kestrel) — core, always playable (GOLD_REFERENCE)
- rogue (Cedric) — optional recruit, depth 3, conditional
- lancer (Garen) — optional recruit, depth 12, conditional

Morvan (dark_knight) is NOT demo playable — no recruitUnit effect exists.
Morvan's GLM structural definition is preserved as DEFERRED_POST_DEMO.

## CODEX batch split (CURRENT)

```
CODEX_P0_ACTIVE_BATCH  = warrior, white_mage, dark_mage   (Alistair, Marian, Elara)
CODEX_P1_DEFERRED_BATCH = rogue, lancer                    (Cedric, Garen)
DEMO_ART_BACKLOG_REMAINING = 5  (3 P0 + 2 P1)
```

Kestrel = STRUCTURAL_GOLD_REFERENCE, VISUAL_REMASTER_ALLOWED, NO_REGENERATION.
Morvan = DEFERRED_POST_DEMO (structural definition preserved, not in active batch).

---

## HISTORICAL — Original GLM selection (SUPERSEDED)

> ARCHIVED REFERENCE: The selection below was the original GLM batch before
> the demo scope lock replaced Morvan with Elara. It is retained for
> provenance. The current active batch is Alistair, Marian, Elara (above).

### Original GLM selection criteria (superseded by demo scope lock)

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

### C. Morvan (dark_knight) — SCALING_DRAFT — SUPERSEDED (DEFERRED_POST_DEMO)

> SUPERSEDED: Morvan was removed from the active batch and replaced by Elara
> (dark_mage). Morvan's structural definition is preserved as
> DEFERRED_POST_DEMO. The entry below is retained for historical provenance.

- **Weapon:** scythe
- **Archetype:** knight (dark melee)
- **Silhouette:** heavy_dark — dark imposing figure
- **Palette:** dark gold, black, wine
- **Animation needs:** idle, dash, attack (scythe sweep), cast (cursed blade/eclipse)
- **Story importance:** Late recruit, high narrative weight
- **Codex slots:** 5 (master, idle, dash, attack, cast)

## Diversity matrix — CURRENT (Alistair, Marian, Elara)

| Dimension | Alistair | Marian | Elara |
|---|---|---|---|
| Weapon | greatsword | crosier | grimoire |
| Archetype | knight | cleric | mage |
| Silhouette | heavy_frontline | robed_caster | robed_arcane |
| Body class | heavy | robed | robed |
| Palette | emerald/steel/gold | white/gold/silver | arcane blue/cyan/gold |
| Combat range | 1 (melee) | 1 (support) | 2 (ranged magic) |
| Animation set | idle/dash/attack/skill | idle/dash/attack/cast | idle/dash/attack/cast |

All three have distinct weapons, silhouettes, palettes, and animation demands.
No two share the same weapon or silhouette class.

## HISTORICAL diversity matrix (SUPERSEDED — included Morvan)

> ARCHIVED REFERENCE: This was the original batch diversity matrix before
> Morvan was replaced by Elara. Retained for provenance.

| Dimension | Alistair | Marian | Morvan |
|---|---|---|---|
| Weapon | greatsword | crosier | scythe |
| Archetype | knight | cleric | knight |
| Silhouette | heavy_frontline | robed_caster | heavy_dark |
| Body class | heavy | robed | heavy |
| Palette | emerald/steel/gold | white/gold/silver | dark gold/black/wine |
| Combat range | 1 (melee) | 1 (support) | 2 (reach) |
| Animation set | idle/dash/attack/skill | idle/dash/attack/cast | idle/dash/attack/cast |

## Draft representation

All three active characters are SCALING_DRAFT. They use their canonical pixel art
(640×768) as a single-frame idle placeholder. Real Option C animation
sheets (512×512, 6-12 frames per state) are ART_PENDING_CODEX.

The runtime pipeline is fully functional with placeholder art — Codex can
drop in real sheets without architectural changes.
