# 01 — Playable Roster Census

## Summary

| # | Character ID | Display Name | Role | Weapon | Archetype | Tier | Option C Status |
|---|---|---|---|---|---|---|---|
| 1 | warrior | Alistair | Frontline knight/tank | greatsword | knight | core | ART_PENDING_CODEX |
| 2 | white_mage | Marian | Healer/support | crosier | cleric | core | ART_PENDING_CODEX |
| 3 | dark_mage | Elara | Arcane caster | grimoire | mage | core | ART_PENDING_CODEX |
| 4 | archer | Kestrel | Mobile ranged scout | longbow | archer | core | GOLD_REFERENCE |
| 5 | rogue | Cedric | Stealth scout | dagger | rogue | optional | ART_PENDING_CODEX |
| 6 | lancer | Garen | Reach melee | long_spear | knight | optional | ART_PENDING_CODEX |
| 7 | paladin | Aldric | Holy knight | holy_mace | knight | optional | ART_PENDING_CODEX |
| 8 | dark_knight | Morvan | Dark melee | scythe | knight | late | ART_PENDING_CODEX |
| 9 | red_mage | Lyra | Hybrid duelist | rapier | mage | late | ART_PENDING_CODEX |
| 10 | enchanter | Eldwin | Support enchanter | wand | cleric | late | ART_PENDING_CODEX |
| 11 | ninja | Talon | Silent assassin | shuriken | rogue | late | ART_PENDING_CODEX |
| 12 | artillerist | Gunnar | Ranged AoE | hand_cannon | archer | late | ART_PENDING_CODEX |

## Tiers

- **Core (4):** Alistair, Marian, Elara, Kestrel — available from game start
- **Optional (3):** Cedric, Garen, Aldric — optional recruits
- **Late (5):** Morvan, Lyra, Eldwin, Talon, Gunnar — late-game recruits

## Excluded from Phase 4C

- NPCs (villagers, merchants, etc.)
- Enemy families
- Environment families (only Forest Road is used as gold reference)

## Canonical asset paths

All canonical pixel art lives under `/assets/characters/pixel/full/`:
- 640×768 full body
- Validated by `canonical-character-qc.json`
- Runtime variants: full, dialogue, ui

## Source data

- `src/game/catalog.ts` — unit definitions, combat kinds, weapons, skills
- `src/render/assetManifest.ts` — visual profiles, runtime profiles
- `public/assets/characters/pixel/canonical-character-qc.json` — QC manifest
