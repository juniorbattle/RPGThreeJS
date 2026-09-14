# Phase 4A composite vs Phase 4B runtime

Phase 4A composites were visual targets. Phase 4B evidence comes from the actual application at the same two viewports.

| Surface | Classification | Runtime finding | Cause of drift |
| --- | --- | --- | --- |
| Travel | `MATCH` | Approved plate survives the real Travel View crop; compact menu and next-step panel remain readable; no avatar or exploration cue appears. | Real typography and card dimensions differ only within the existing Travel View family. |
| Tableau | `MINOR_RUNTIME_DRIFT` | Character-free plate, independent Kestrel, real dialogue, emphasis, listener dimming, mirroring, and three stage positions all work. | Real narrative-stage actor sizing and lower dialogue placement differ from the Phase 4A illustrative composite. |
| Strategic | `MINOR_RUNTIME_DRIFT` | Existing perspective/camera, real seven-unit battlefield, selection, turn order, actions, and objective UI remain intact. Kestrel is readable at tactical scale. | Real camera projection, grid/unit density, and HUD reduce the generous negative space shown in the composite. This is runtime density, not an art or camera-semantics defect. |
| Combat Stage | `MINOR_RUNTIME_DRIFT` | Real side-on Stage, Kestrel/target lanes, attack header, attack frames, damage, and existing VFX path compose with the approved family. | The real Stage profile, lane scale, overlays, and action cadence are more constrained than the illustrative composite. |

No surface has `MAJOR_RUNTIME_DRIFT`. The remaining strategic gap is primarily UI/unit density and representative gameplay scale. Changing the tactical camera would violate runtime authority and is neither required nor recommended.

## Conclusion

The approved family survives real rendering without identity drift, staging breakage, camera change, gameplay change, or asset regeneration. The minor differences are expected consequences of using authoritative runtime components rather than reproducing the Phase 4A mockups.

