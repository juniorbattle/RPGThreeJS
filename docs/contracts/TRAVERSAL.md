# Traversal

Status: **LOCKED**.

T0 is the production reference for a side-on horizontal route with caravan, two physical lanes, Risk, Reward, Pursuit, Route/Checkpoint rhythm, and transitions. Preserve its existing production behavior and [T0 contract](../traversal/T0_PRODUCTION_CONTRACT.md): Risk and Pursuit are scene-local, Reward uses temporary loot authority, CAUGHT resets Route speed only, and no local road combat exists. Campaign/`RunSystem` decide nodes, choices, outcomes, and durable state.

Future playable Traversal legs are **T1 and T3**. Generalize the T0 grammar with a shared forest route base where visually coherent. Their variation comes primarily from checkpoints, props, NPCs, existing events, existing forks, and arrival context. Preserve each leg's authored campaign stages and choice IDs. Enable a leg only after its code, authored art, transitions, and QA meet the contract; relation membership alone never enables it.

**T2 is retired as a playable leg** because the Bois-Clair-to-camp interval needs no Traversal. **T4 is retired as a playable leg** because it duplicates the approach before judgement. Preserve durable IDs and existing campaign continuity until a separately tested compatibility migration proves removal safe. Do not renumber T3. Retiring playable presentation does not authorize deleting a save ID or inventing a replacement stage.

World geometry, lane collisions, pickup animation, speed pressure, checkpoint camera and UI are ephemeral scene state. They do not commit a campaign branch or secured currency. Any shared Traversal runtime must retain the T0 regression baseline and an explicit per-leg presentation/configuration seam; do not fork separate gameplay truth for T1 or T3.
