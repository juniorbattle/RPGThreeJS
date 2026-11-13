# Asset migration reports

Historical records of the September 2026 asset migrations, moved here from `public/` on 2026-11-13 by the operator's cleanup choice (OD-2026-11-13-F, C4) so they no longer ship in the build. Nothing in the game or its tests reads them; their content is unchanged.

| Folder | Former path | Content |
| --- | --- | --- |
| `characters-pixel/` | `public/assets/characters/pixel/*.json` | Character System V2: alias map, cleanup report, legacy pose cleanup plan, master promotion report, non-combat master census |
| `demo-environment-pack-v1/` | `public/assets/generated/lion-phase/environments/demo-environment-pack-v1/*.json` | Demo environment pack: approved source manifest, beat to background map, census, promotion manifest |

The production registry of the environment pack is `src/render/data/demo-environment-pack-v1.production.json`. Older reports that link the former paths keep them as history; the files are here. Inventory: `docs/audits/global-cleanup-inventory-2026-11-13.md`.
