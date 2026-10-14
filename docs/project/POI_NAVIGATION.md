# Production POI navigation

Authority: [OD-2026-10-13-D](../autonomy/POI_NAVIGATION_OPERATOR_DECISION_2026-10-13.md), contract set 1.2.0; immutable baseline `692829f32d735ad890182eea6b5e5e195551bbbf`. Production code checkpoint `14490908966f58888fb1ccc87c90c8af066b8903` replaces physical road selection with the connected campaign map; `596e390d3288ea0814316381429a32b1e822a327` preserves optional bypass connections in both directions. [First-slice acceptance](../reports/poi-map-first-slice-2026-10-13.md) covers desktop normal motion, authentic fresh play to the first refuge and an authenticated pre-migration V6 continuation. Later sections and broader acceptance remain open.

`runSystem.ts` derives available/resolved/neutralized/locked status, reusable refuges and reversible unlocked connections from the existing directed graph, resolution facts, bypasses and historical `traversalBranches` fields. It materializes approved adaptive assignments before visiting. Required unresolved events never open the next milestone. An explicitly bypassed optional event adds a displayed contracted connection; the original directed graph is unchanged and remains the recovery graph.

`PoiMapView` receives a display model and sends native intentions. `LionPoiMap` owns layout only, with existing labels and IDs. `GameApp` revalidates movement/activation and coordinates the existing NarrativeStage/dialogue, CombatBridge and refuge/management. Resolved and neutralized passage triggers no one-shot content. Refuge services can reopen under existing costs/arrival flags. Canonical pending finale combat remains resumable even if its story node is resolved.

The first slice is Audience → opening ambush → Cédric → optional refugees → first-trial event or combat → first refuge. The same map adapter displays the existing later graph in further panels; that implementation does not certify later campaign branches or endings. No physical road session is driven invisibly by the map.

V6 schema, directed graph, IDs, rewards and tactical configurations remain intact. Old resolved boundaries resume on the map; genuine unresolved encounters resume through their existing owner. A bypassed or neutralized current POI resumes as inactive map passage. Existing checkpoint defeat loses temporary loot and clears downstream route choices through its original owner; visited alone never reconstitutes an irreversible fork.

Future chest and elite adapters are mechanical authoring seams. The production chest catalogue is empty; no chest, formation or reward placement was invented. A genuine elite is identified by its existing tactical configuration rank. Random seeded/adaptive POI content remains stable across movement/reload.

Old Traversal source, assets and QA are retained for compatibility/reference audit. Their physical navigation doctrine is superseded; remove only actual orphan references after verified replacement. Exactly eight videos, V2, tableau actor limit, deferred audio, main protection and historical evidence remain preserved.

## Next production boundary

Continue from an authenticated successful first-refuge save through the existing reserve-trail, Valmir, second exclusive trial and Bois-Clair content to the second refuge, using POI selection throughout. Keep authored reputation events and costs, existing battle owners and exact V6 reload assertions. Then verify the former T2/T4 narrative continuations and both endings. The generic adapter already displays the 21-node graph; this does not certify those later branches. Retire the physical-road runtime only after full replacement and a reference inventory, without deleting historical proofs.
