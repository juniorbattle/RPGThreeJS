# Kestrel runtime contract

## Identity and source

- Canonical identity remains `public/assets/characters/pixel/full/kestrel.png`.
- Phase 4B uses the approved Phase 4A style derivatives without modifying the canonical file.
- Required identity invariants: green hood, closed mask, bow, quiver, green/bronze palette, ranger silhouette, proportions, and equipment identity.
- Provenance remains `GENERATION_TOOL = OpenAI image_gen`, `MODEL_PROVENANCE = UNKNOWN`.

## Frame geometry

| Property | Contract |
| --- | --- |
| Source frame | 512×512 RGBA PNG |
| Frame count | 8 per state |
| Logical baseline / foot anchor | source pixel y=466 |
| Bottom transparent margin | 46 px |
| Edge touch | 0 |
| Pivot / origin | horizontal center, semantic bottom/foot anchor |
| Mirror axis | vertical axis through frame x=256 |
| Filtering | nearest-neighbor only on the Option C Kestrel texture; mipmaps disabled in this DEV proof |

Phase 4A machine QA established a common 466 baseline. Phase 4B preserves every source byte and therefore preserves that geometry. The animation controller changes only frame URLs, so state transitions cannot change the runtime plane, pivot, or semantic anchor.

## Surface scale and alignment

| Surface | Scale contract | Ground/alignment contract |
| --- | --- | --- |
| Tableau | narrative actor scale `0.92`; bottom-origin CSS actor | common baseline stays on the stage floor; LEFT/CENTER/RIGHT reuse the same semantic anchor |
| Strategic | 2.08×2.08 Three.js plane | center y=0.936 with 0.05 hero-ground offset; alpha foot resolves approximately 0.003 world units above ground |
| Combat Stage | same 2.08×2.08 proxy plane | center y=0.856 after the existing Stage sink; alpha foot remains approximately 0.003 above the Stage floor |

No per-animation scale or origin changes are permitted. Facing is implemented with horizontal mirroring, not alternate artwork. Tableau evidence covers LEFT, CENTER, RIGHT, facing left/right, active speaker, and inactive listener with no baked cast.

