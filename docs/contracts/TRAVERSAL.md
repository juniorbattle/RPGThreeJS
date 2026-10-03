# Traversal

Status: **LOCKED**.

T0 is the production reference for a side-on horizontal route with caravan, two physical lanes, Risk, Reward, Pursuit, Route/Checkpoint rhythm, and transitions. Risk/Pursuit motion is scene-local; Reward uses temporary loot authority. Campaign/`RunSystem` decide nodes, choices, outcomes, and durable state. [OD-2026-10-03-A](../autonomy/MANUAL_PLAYTEST_OPERATOR_DECISION_2026-10-03.md), dedicated task `PRODUCTION-CONTRACTS-MANUAL-PLAYTEST-1`, explicitly supersedes the former CAUGHT -> resetRouteSpeed-only and no-road-combat target. The [T0 source baseline](../traversal/T0_PRODUCTION_CONTRACT.md) records what is implemented, not authority to reject the new manual findings.

Future playable Traversal legs are **T1 and T3**. Generalize the T0 grammar with a shared forest route base where visually coherent. Their variation comes primarily from checkpoints, props, NPCs, existing events, existing forks, and arrival context. Preserve each leg's authored campaign stages and choice IDs. Enable a leg only after its code, authored art, transitions, and QA meet the contract; relation membership alone never enables it.

**T2 is retired as a playable leg** because the Bois-Clair-to-camp interval needs no Traversal. **T4 is retired as a playable leg** because it duplicates the approach before judgement. Preserve durable IDs and existing campaign continuity until a separately tested compatibility migration proves removal safe. Do not renumber T3. Retiring playable presentation does not authorize deleting a save ID or inventing a replacement stage.

World geometry, lane collisions, pickup animation, speed pressure, checkpoint camera and UI are ephemeral scene state. They do not commit a campaign branch or secured currency. Any shared Traversal runtime must retain the T0 regression baseline and an explicit per-leg presentation/configuration seam; do not fork separate gameplay truth for T1 or T3.

## Shared ground and checkpoint world

T0/T1/T3 Route, Checkpoint and Return Route share ground language, earth-color family, scale, perspective, physical lane placement and foreground/route/depth relationship. Checkpoint narrative elements may differ; an unjustified ground/style/zone jump fails continuity.

The caravan physically represents the traveling clan. Traversal world contains environment, props, an optional external subject and the caravan. Never place clan members on a checkpoint road as if they were awaiting their own vehicle. Clan actors reappear in the event's STATIC_TABLEAU. A landmark, ruin, fork, abandoned camp or clue is a valid stop with no NPC. A hostile checkpoint has at most one Shadow Enemy marker from the pursuer's family, never a stack of the future combat formation.

## Physical transitions

Checkpoint departure reads as one continuous movement: visible acceleration -> screen coverage -> world swap under coverage -> reveal with momentum already engaged. No second perceptible restart. Final-route caravan retains forward momentum until fully outside the right viewport edge; only then handoff. Easing cannot resemble a near stop followed by disappearance. Reduced-motion alternatives retain clear ordering, agency and the equivalent complete-exit boundary.

## Pursuit threat and canonical collision handoff

Approach and readable lane pressure end with COMMITTED CHARGE: choose one of the two lanes, commit to it, show strong acceleration/readable running motion and attempt to overtake the caravan. A miss passes the caravan and fully exits right. A collision requests a canonical combat handoff exactly once. Require an explicitly eligible authored encounter/node/combat mapping through campaign/RunSystem and the existing tactical authority; no new formation, node, reward or consequence invented to fill a missing mapping. An absent mapping blocks that integration and must be recorded precisely. A miss never resolves or bypasses a canonical battle/choice. Traversal does not resolve damage/AP/status/outcomes or serialize pursuit state. The former reset-only/no-road-combat doctrine is superseded; historical proofs remain evidence for their older target only.

## Road elements and depth

Active production obstacle family: **rock** only. Other obstacle assets may remain historical pending reference/retention review. Rock, gold and other temporary road elements spawn offscreen or at a natural edge, enter the view and remain coherently in the world as the caravan passes; despawn only after their full viewport exit. Contact/collection must not arbitrarily pop them out immediately; use coherent collected/contact presentation and the existing owner to prevent duplicate rewards. Road gold stays temporary; defeat loses unsecured loot and the existing camp/refuge authority secures it.

Draw order follows physical ground depth (`screenGroundY` or equivalent), not creation order. Near/lower-lane elements naturally have priority over far/upper-lane elements; a far object cannot wrongly occlude a near caravan. Randomness selects among valid authored configurations: allowed lanes, minimum spacing, legible telegraph/reaction time, no absurd overlap and coherent perspective. These targets require new T0/T1/T3 visual/motion/owner-boundary acceptance, not reuse of an unrelated automated PASS.
