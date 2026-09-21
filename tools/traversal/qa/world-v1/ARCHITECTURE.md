# Traversal T0 visual architecture rebase

Baseline: `campaign-structure-1`, `16a07a1f32c3e1997b9049243df1dcf769ef0305`.

## Rejected architecture audit

`TraversalT0Scene.buildEntity` attached the location backdrop, `crossroadsGround`, two generic foreground sprites and the centered encounter blockade to an interaction article. Consuming that article removed the location. `traversal.css` positioned these with successive micro-scene, roadside and fusion overrides: negative left offsets, vh bottom offsets, radial ground masks and generic verge patches. Separate roadside props were anchored to one progress coordinate. The nearby trees moved at .22 of the road camera while the ground and locations moved at 1, and foreground at 1.22.

## Replacement

- `TraversalT0World` owns presentation geography: contiguous road-space intervals, lead-in / core / lead-out bounds, kind, art and variants. It has no gameplay triggers, campaign node definitions, rewards, lane restrictions or narrative mutations. Variant keys only read the existing RunSystem branch selection.
- `TraversalWorldRenderer` mounts authored physical sections independently of interaction articles. Each section contains terrain, forest edge, structures and their connecting vegetation as one painted environment. These are opaque terrain sections, not transparent POI backdrops. Matching boundary orientation joins the normal forest at the edges. No generic grounding oval or opacity mask is used to integrate locations.
- Terrain and upper roadside share a near-world camera. A separate foreground foliage layer passes in front of the vehicle and actors using that same road-space distance. All section transforms derive from the accepted `roadCameraX` projection.
- Beat `locationId` is a reference into the presentation geography. Simple road subjects remain the existing canonical sprites and markers with unchanged contacts, lanes and interaction rules.
- Environment, corridor and transition sections have distinct authored composition and behavior. The corridor has an obstructed and cleared appearance; the route junction modifies the physical path; roadside environments leave both playable road lanes clear.
- Only existing stage completion selects corridor clearance. Only RunSystem branch selection selects a route variant, presented at the existing fade midpoint. The renderer cannot mutate either authority.

The large authored-section strategy is deliberate: roots, road ruts, soil and forest shadows are painted together using one base reference. Actors and markers remain independent, and the foreground is a separate depth layer. This avoids recreating the rejected architecture as a new collection of offset cutouts.

## First gate evidence

Merchant was integrated and inspected in Chromium before migrating the other locations. `merchant-gate.png` and `merchant-without-actors.png` show continuous terrain and a readable trading halt with the actor/interface hidden. `merchant-after-interaction.png` shows it persists after beat consumption. `merchant-browser.json` measures 0.00458 px difference between actor and section displacement (DOM rounding), and records no browser exceptions.

This report does not substitute automated checks for visual inspection. Operator review remains required; the task leaves work uncommitted and unpushed.
