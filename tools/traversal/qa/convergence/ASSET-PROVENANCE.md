# Reference convergence — art provenance

Built-in ImageGen generated four new complete world-section paintings and one closed/open chest sheet, using the approved Traversal boards and accepted forest as visual references. Existing images remain intact. These are presentation assets only; narrative actors still come from Character System V2.

The art brief preserves a continuous cool blue-green HD-2D forest, warm timber/iron materials, two readable road lanes, forest boundaries, no painted actors, no UI, and occupied scenery on both far and near road verges. The merchant's rejected first version cut architecture at the section edges; the integrated revision restores forest margins and adds foreground baggage. Refugees use a tent/fire/belongings scene; Cedric a ruined waystation and map table; the narrative branch a damaged caravan and shelter. Opening Ambush is unchanged.

| Integrated file | Generated source filename |
|---|---|
| `world-v1/reference-convergence/merchant-halt.png` | `exec-643fc3db-b5d9-474a-833f-36c73d7f8e4e.png` |
| `world-v1/reference-convergence/refugee-halt.png` | `exec-5ce5d904-0b6a-411c-8d5f-c439d01c072e.png` |
| `world-v1/reference-convergence/nomad-waystation.png` | `exec-78f348db-8883-4ada-b599-b77ee36b13df.png` |
| `world-v1/reference-convergence/damaged-caravan.png` | `exec-d3fe8f78-7067-4c90-922f-7e8d58becebb.png` |
| `entities/chest-v4/closed.png`, `open.png` | `exec-92b007b6-4a9f-4a92-985f-fb334560adda.png` |

Source directory: `C:/Users/miche/.codex/generated_images/01a0c28d-0e2e-7452-89f1-c1d4835f9485/`. Map copies are byte-identical, verified in `asset-hashes.json`.

The chest uses the generate2dsprite processor (`target asset`, 1 row × 2 columns, cell 768, fit .9, shared scale, bottom alignment, largest component, no edge cleanup or border trimming). ImageGen returned native alpha, which the processor preserved. Component extraction removes isolated alpha noise; no source was overwritten. Both extracted frames have a common bottom baseline at y=730. The open frame reuses the closed-frame canvas transform at runtime so raising the lid does not shrink the box. Processing metadata and original sheet are retained in `chest-processing/`; no edge-touch frames were reported. Both states were visually inspected, including live pickup contact.

Old route-props-v3 chest, all canonical character art, truck, Opening Ambush, forest road and junction source images remain unchanged.
