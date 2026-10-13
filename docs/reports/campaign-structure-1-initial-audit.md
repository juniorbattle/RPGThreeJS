# CAMPAIGN-STRUCTURE-1 — Initial canonical audit

Status: **audit baseline established; no legacy authority silently rewritten**

## Scope

This pass introduces a high-level canonical contract for all 21 Lion RunGraph nodes. It classifies location anchors versus route interrupts so future Traversal T0–T4 legs can integrate secondary nodes directly inside the playable journey instead of treating every node as a full scene boundary.

The campaign registry owns relationships and contracts only. Asset paths remain owned by Character System V2 / CharacterVisualRegistry and the production environment pack. RunSystem remains authoritative for adaptive branch/content selection.

## Canonical spatial classification

### Location anchors

- lion-camp
- lion-audience
- lion-first-refuge
- lion-village-choice
- lion-second-refuge
- lion-shadow-signs
- lion-final-refuge
- lion-final-judgement

### Route interrupts

- lion-opening-ambush
- lion-nomad-crossroads
- lion-refugees
- lion-first-trial-event
- lion-first-trial-combat
- lion-reserve-trail
- lion-valmir-road
- lion-second-trial-event
- lion-second-trial-combat
- lion-lancer-recruit
- lion-witnesses
- lion-final-trial-event
- lion-final-trial-combat

The future Traversal relation layer will choose which anchors delimit T0–T4. That relation is intentionally not encoded in this baseline.

## Confirmed structural debt

1. **RunGraph vs legacy campaignNodes**
   - RunSystem has 21 nodes.
   - src/game/content.ts has 20 campaign nodes.
   - lion-lancer-recruit is absent from content.ts.
   - content.ts still links lion-second-refuge directly to lion-witnesses instead of lion-lancer-recruit.

2. **Missing Lancier environment authority**
   - dialogue:mystery_lancer_recruit already resolves to WITNESS_ROAD.
   - node:lion-lancer-recruit is missing.
   - edge:lion-second-refuge>lion-lancer-recruit is missing.
   - edge:lion-lancer-recruit>lion-witnesses is missing.
   - The stale edge lion-second-refuge>lion-witnesses still exists.

3. **Reserve trail family mismatch**
   - node:lion-reserve-trail resolves to FOREST_ROAD.
   - dialogue:reserve_trail resolves to VALMIR_ROAD.
   - Canonical target is VALMIR_ROAD.

4. **Final trial combat family mismatch**
   - node:lion-final-trial-combat resolves to FOREST_ROAD.
   - combat:ruins_guardians and combat:serpent_hunters resolve to SHADOW_RUINS.
   - Canonical target is SHADOW_RUINS.

5. **Adaptive final event family drift**
   - lion-final-trial-event belongs to the SHADOW_RUINS campaign context.
   - dialogue:mystery_dragon_roost resolves to SHADOW_RUINS.
   - dialogue:serpent_informant resolves to FOREST_ROAD.
   - dialogue:mystery_shrine resolves to VALMIR_ROAD.
   - These adaptive variants cannot yet be treated as one traversal interruption without an explicit correction or justified sub-environment contract.

6. **Character System V2 gap**
   - The mystery_shrine adaptive dialogue uses actorId shrine_apparition.
   - CharacterVisualRegistry currently has no canonical V2 profile/alias for shrine_apparition.
   - The new audit reports this instead of accepting a direct asset fallback.

## Next correction pass

Correct the authorities above until the cross-authority audit reaches zero unexplained issues. Only after that should T0–T4 be encoded as campaign travel relations. The Traversal runtime can then consume anchors, route interrupts, cast identities and environment contexts without owning any of those source-of-truth decisions.
