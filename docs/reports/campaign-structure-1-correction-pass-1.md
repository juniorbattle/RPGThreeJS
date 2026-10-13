# CAMPAIGN-STRUCTURE-1 — Correction Pass 1

Status: **runtime authorities normalized; canonical audit expected clean**

## Corrections applied

- Restored `lion-lancer-recruit` in `src/game/content.ts`.
- Replaced the stale `lion-second-refuge -> lion-witnesses` legacy edge with:
  - `lion-second-refuge -> lion-lancer-recruit`
  - `lion-lancer-recruit -> lion-witnesses`
- Added environment contexts for the Lancier node and both canonical edges.
- Kept Garen on the produced `WITNESS_ROAD` presentation family because both his current cinematic source and dialogue are staged on that road. The older visual-family planning document that groups him under `SECOND_REFUGE` is now treated as stale planning metadata rather than runtime truth.
- Corrected `node:lion-reserve-trail` from `FOREST_ROAD` to `VALMIR_ROAD`.
- Corrected `node:lion-final-trial-combat` from `FOREST_ROAD` to `SHADOW_RUINS`.
- Normalized the adaptive final-event presentation contexts for `serpent_informant` and `mystery_shrine` to `SHADOW_RUINS`, matching the existing final-sequence family contract.
- Reclassified `shrine_apparition` as a presentation entity rather than inventing a Character System V2 master. The apparition is therefore no longer part of canonical character-master validation.

## Resulting invariant

The 21-node campaign topology, canonical node families, legal adaptive content, campaign-node registry, production environment contexts and Character System V2 identities now have one executable cross-authority audit.

The focused invariant is now:

```text
21 / 21 canonical nodes
21 / 21 RunGraph nodes
21 / 21 legacy campaignNodes
0 stale campaign edges
0 missing canonical node environment contexts
0 missing canonical edge environment contexts
0 canonical character IDs without Character System V2 resolution
0 unexplained content/environment family mismatches
```

## Deferred intentionally

T0-T4 traversal legs are still not encoded. Their boundaries will be defined only after the corrected anchor/interrupt structure is verified, so Traversal consumes campaign truth instead of becoming a second campaign authority.
