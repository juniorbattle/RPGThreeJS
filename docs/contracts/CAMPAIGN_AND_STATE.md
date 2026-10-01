# Campaign, progression and state

Status: **LOCKED**.

The Lion campaign is authored. Keep existing dialogue, nodes, branch identities, causal consequences, and route order unless an explicit narrative task changes them. Do not invent new canonical choices, encounters, stages, outcomes, or rewards to fill a presentation gap. `LionCampaignStructure`, travel relations, `RunSystem`, and combat authorities decide eligibility and consequences; `GameApp` coordinates lifecycle and handoff.

Progression has no level or XP. The current progression channels are equipment, weapon tiers, accessories, skill upgrades, recruitment, and materials. A party member equips one weapon and two accessories. Ultimates stay out of scope until explicitly activated by an operator decision.

Refuges are for consolidation and preparation. Route loot is temporary until the existing securing boundary; a Traversal pickup must not directly increase secured gold. Preserve first and second refuge continuity and management returns. Do not convert the final refuge into an interactive hub or alter its node type as an incidental presentation change.

Durable campaign facts are saved through versioned schemas and migrations. Preserve durable IDs and compatibility with existing saves. Save route choices, resolved events, inventory and resources through their existing owners; do not serialize animation state, camera, transient Route Risk/Pursuit state, layout, or other visual state. Any changed durable schema requires an explicit migration and resume tests at affected boundaries.
