# Option C common character style seed

Status: CHARACTER_STYLE_SEED_V1_SELECTED

This folder records the operator-authorized A/B/C visual gate for a common modern tactical pixel-art character language. The subjects are anonymous style probes, not RPGThreeJS heroes and not production assets.

## Source authority

- Text doctrine: the Option C character-style lock.
- Sole visual input: `CHARACTER_STYLE_REFERENCE_V1` at `../references/character-style-reference-v1.png`.
- Reference SHA-256: `e4470e9506df2f4c84af286060e85b69983c87cb5bba27d1bb576f50847b7bd7`.
- The reference controls pixel language, proportion family, face concealment, material abstraction, class readability, and roster coherence.
- It does not control identity, canonical design, exact costume, exact pose, or exact composition.
- Legacy RPGThreeJS character images, legacy animations, rejected candidates, and screenshots containing legacy characters are forbidden model inputs.

Every generation request therefore has exactly one image input: the approved style reference. Legacy character image input count is zero.

## Candidate families

| Candidate | Controlled variation | Intended emphasis |
| --- | --- | --- |
| A | larger clusters, simplest ramps, lowest ornament density | cleanest and most tactical |
| B | medium clusters, moderate ornament, controlled premium material detail | balanced premium; closest to the reference |
| C | smaller but disciplined clusters, richer material accents, slightly more ornament | richer premium without illustration drift |

All candidates use the same anonymous Ranger, Knight, Priestess/Lightcaster, and Mage blueprint. Candidate variation is restricted to rendering density and material treatment.

## Accepted raw layout contract

The first 2048×2048 2×2 attempts are preserved as `REJECTED_PROPORTIONS`: the lower row drifted larger and crossed the intended cell boundary. They are not normalization parents.

The accepted second attempt for each candidate is a 2048×1152 opaque PNG arranged as one horizontal four-class lineup:

1. Ranger;
2. Knight;
3. Priestess/Lightcaster;
4. Mage.

All four subjects share one raw baseline. The postprocess stage chroma-isolates and groups connected components by class, applies one common source-to-logical scale to all four classes in a candidate, aligns pivot x=64 and foot baseline y=116, quantizes without dithering, and exports 512×512 through exact nearest-neighbor 4× scaling. It never applies an independent fill scale per class.

## Final operator selection

Candidate B is selected as `CHARACTER_STYLE_SEED_V1` for production feasibility and technical construction. Reference V1 remains the primary artistic-quality authority and Seed B is not the visual-quality ceiling. A remains the strongest animation-first/tactical alternate. C remains a valid richer alternate.

`FINAL_STYLE_SEED_SELECTED=YES`.

- `STYLE_SEED_A=VALID_ALTERNATE_NOT_SELECTED`
- `STYLE_SEED_B=SELECTED_STYLE_AUTHORITY`
- `STYLE_SEED_C=VALID_ALTERNATE_NOT_SELECTED`

## Selection boundary

The operator has set `CHARACTER_STYLE_SEED_V1=B`. A and C, their raw attempts, logical/runtime sprites, prompts, provenance, hashes, review boards, rejected attempts, and QA evidence remain preserved.

The subsequent operator gate authorizes Alistair master candidates only. Pose-sheet generation, runtime integration, canonical replacement, commit, and push remain unauthorized.
