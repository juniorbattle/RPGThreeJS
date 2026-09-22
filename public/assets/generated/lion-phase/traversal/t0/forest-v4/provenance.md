# Forest road artwork, T0 preview

Generated with built-in ImageGen in task `01a0bad5-95e3-7fd2-a749-08cc92f60bd9`; previous accepted art remains untouched.

| File | Generated source |
|---|---|
| `far.png` | `exec-826dc657-92a8-4048-acd6-61a19f8a2009.png` |
| `road-source.png` | `exec-8b52d1c0-e966-443f-9912-02dd81c3ddca.png` |
| `trees-source.png` | `exec-60ec1c04-0a68-4638-aef6-d7b22002068a.png` |
| `foreground-source.png` | `exec-ff590f5b-c0f3-4997-94db-1c2da542c839.png` |
| `fork-sign.png` | `exec-c0ce0167-26a5-4308-93dd-c66a79d0e14e.png` |

Source images were copied byte-identically from the task's generated-images directory. The far image was used as the visible art-direction reference for the remaining layers.

Prompt intent:

- Far: cool blue-green layered dense woodland, mist and distant tree masses, sparse glimpses of wooded hills, HD-2D painterly pixel-inspired game art; no road, castle, characters or UI.
- Road: compacted dark umber forest earth with horizontal wheel tracks, leaves, roots, small stones, damp patches, narrow mossy grass margins; no sandy ochre, lane dividers or perspective vanishing point.
- Trees: separate transparent parallax strip of mossy trunks and canopy, real open gaps showing the far forest, varied organic rhythm and fern baseline; no baked distant scenery in the gaps.
- Foreground: continuous dark-green fern/shrub/bramble/mossy-rock border, irregular upper silhouette with real transparency, small pale wildflowers; no isolated repeated fence clumps.
- Fork sign: isolated wooden post, two arrow boards pointing right/up and right/down, native transparency, no text or heraldry.

`tools/traversal/assemble_forest_loops.py` performs deterministic overlap assembly at end/start boundaries for road, trees and foreground. It does not mirror or draw artwork. Original sources remain unchanged; `assembly.json` records source/output hashes and overlap widths. Far scenery is non-repeating with extra horizontal coverage for its 0.08× parallax travel.

Production gate remains closed. Acceptance requires live browser review of motion and seams, not merely these asset records.

## Final world-place additions

Reference: `docs/references/traversal/t0/approved-world-composition.png`, supplied by the operator on 2026-09-20. Written interaction and authority rules take precedence over its illustrative UI/heraldry.

| Workspace asset | Built-in ImageGen source | Prompt intent |
|---|---|---|
| `woodland-blockade.png` | `exec-9bd164df-f49a-497b-b815-044153032f8e.png` | Wide rope-bound mossy fallen log and sharpened dark timber, roots and damp forest integration; no actors |
| `resting-place.png` | `exec-1c62da10-da2a-4f11-8c6c-6617753bc9e3.png` | Modest lean-to, bedroll, travel bags, bucket, jug and log seat; space for canonical people |
| `ruined-outpost.png` | `exec-9f84ed4c-faaf-4cfc-be91-6dbca1b6cd0c.png` | Ivy-covered ruined stone arch and wooden fence, transparent arch opening, lantern, forest roots |
| `crossroads-ground.png` | `exec-57dc88c4-4717-4543-9a5f-024d81a96931.png` | Low tapering mossy island, two worn trails and stone markers; no baked sign or actors |
| `merchant-camp.png` | `exec-546b38f1-7497-4048-abd1-a1d6dc76df86.png` | Broad adjoining canvas awnings, counter, crates, sacks, barrels, cookware and lanterns; no occupants, horses, flags, text or UI |

All five outputs are byte-identical copies with native alpha; no chroma-key extraction or creative script drawing. Forest palette references the generated tree layer; merchant mass/materials reference the latest operator inspiration. All characters remain independently resolved through Character System V2. The canonical mother sprite already holds her child.
