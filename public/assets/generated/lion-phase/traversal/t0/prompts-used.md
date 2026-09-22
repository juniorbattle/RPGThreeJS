# Traversal T0 two-lane convergence prompts

Generation mode: built-in image generation, followed by deterministic sprite cleanup and loop assembly. The supplied approved references defined composition, material language, scale, and art direction. All outputs remain preview-only and do not open the production rollout gate.

## Scenic panorama

Wide orthographic side-view fantasy panorama with bright sky, layered mountains, pine forest, waterfalls, a long bridge, and a warm golden castle-city. The lower region stays clear for a separate road layer. No gameplay entities, vehicle, UI, markers, labels, text, or watermark.

The original mirrored candidate `t0-far-panorama-loop.png` is preserved but inactive. The current runtime uses `t0-far-panorama.png` once, with no repeat, so the unique castle does not tile. Independent modular scenery supplies parallax.

## One undivided road

The retained road source is one broad horizontal ochre medieval road with no walls, terraces, platforms, dividers, entities, vehicle, UI, or text. Its natural ruts do not encode gameplay positions. The final runtime supplies exactly two logical lane coordinates over this single surface.

`tools/traversal/build_t0_road_loop.py` assembles the source plus its horizontal mirror into the repeat-safe road strip.

## Driverless wooden four-wheel 4x4

Create a fantasy medieval reinterpretation of a rugged wooden off-road 4x4 truck: timber chassis, reinforced dark iron frame, expedition cargo, exactly four clearly visible wheels, strong right-facing side-view silhouette, and warm daylight matching the approved references. Keep the exterior completely unoccupied. No driver, passenger, people, horse, harness, banner, flag, crest, heraldry, text, UI, marker, or watermark.

The earlier normalized `clean.png` is preserved but inactive. The current `fantasy-truck-v3.png` is a byte-identical copy of the generated transparent 1254×1254 output. Its prompt emphasized a fantasy timber truck, clearly separate four wheels, iron reinforcement, leaf suspension, cargo and empty windows; no modern rubber tires, people, horse or heraldry. The generation source is `exec-69fa9a44-e9aa-45fa-a99b-1ae2a2fd9c70.png` in this task's generated-images folder. Visible alpha bounds, rather than canvas size, determine runtime scale.

## Merchant caravan route prop

Create one compact roadside merchant caravan camp: small wooden trade wagon, tan canvas awning, stacked crates, barrels, sacks, travel packs, hanging lantern, and low display table. Match the approved HD-2D style and share one grounded side-view baseline. No merchant, NPC, driver, passenger, person, face, horse, animal, flag, banner, crest, text, UI, bubble, marker, or watermark.

The local sprite processor normalized the accepted character-free prop to transparent 1024×1024. The runtime layers the canonical Character System V2 merchant separately.

## Route props, revision 3

Generate six isolated HD-2D fantasy props matching the approved detail board: a small iron-bound wooden chest; an abandoned broken wooden cart; scattered timber and wheel debris; a modest glowing carved waystone; a wooden stake barricade; and a foreground cluster of bushes, boulders and broken fence. Arrange as two rows of three, with empty gutters, consistent warm daylight and side-view grounding. No people, text, labels, UI, flags or heraldry. Preserve complete silhouettes.

The background-cleanup revision returned native RGBA transparency. The final raw source is `exec-f20894ca-694c-4bce-aa51-24d9e8341acc.png`, preserved as `entities/route-props-v3/raw-sheet.png`. Equal-thirds extraction clipped a neighboring subject and was rejected. `tools/traversal/extract_props.py` uses inspected empty gutters instead, preserving the original alpha. All six accepted extracts have complete bounds with no edge contact. The runtime uses chest, abandoned-cart, debris, waystone, barricade and foreground PNGs. No canonical character artwork was regenerated or modified.

## Reference precedence and scope

The recovered approved composition/detail images are stored byte-identically under `docs/references/traversal/t0/`. The written specification overrides outdated image details. Every asset in this pack remains T0 preview-only. Local optional interactions create no canonical nodes or persistent rewards; production activation remains disabled. SHA-256 provenance and active/inactive asset flags are recorded in `asset-manifest.json`.
