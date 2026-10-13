# Kestrel — structural benchmark alignment

Status: STRUCTURAL_GOLD_REFERENCE_ONLY

This document does not regenerate or replace Kestrel. It defines how Kestrel guides the active batch structurally without serving as direct visual source material.

## Legacy semantic reference

- Runtime ID: archer
- Legacy reference source: public/assets/characters/pixel/full/kestrel.png
- Legacy reference size: 640×768 RGBA
- Legacy reference SHA-256: e948beb899eef71940aec200c3747e098a2c2f980ba16ec5e6e15b2ae5a700ec
- Weapon: longbow and quiver
- Role: agile ranger, scout, ranged precision
- Identity invariants: deep green pointed hood, closed cloth mask, leather armor, green-and-bronze palette, longbow, quiver, light mobile frame.

The legacy Kestrel PNG and Phase 4B frames must not be attached to generation requests, traced, repainted, or used as edit targets. They provide semantic role and integration evidence only.

## What remains gold

- semantic animation states: idle, dash, attack, skill;
- runtime mirroring rather than separate left/right art;
- fixed-frame animation controller integration;
- one stable plane, pivot, and scale across states;
- tableau, strategic, and Combat Stage proof discipline;
- frame ordering, one-shot return semantics, and selective loading;
- review artifacts and human approval boundary.

Current Phase 4B structural values remain unchanged in this phase:

| Property | Current gold value |
| --- | --- |
| Delivery frame | 512×512 RGBA |
| Current baseline | y=466 |
| Current pivot | x=256 |
| Idle timing | 190 ms/frame |
| Dash timing | 82 ms/frame |
| Attack timing | 105 ms/frame |
| Skill timing | 125 ms/frame |
| Mirror policy | runtime |

## What is not automatically gold

- current surface-detail density;
- any painterly or downscaled-illustration artifacts;
- decorative micro-noise;
- any frame-to-frame anatomical drift hidden by alpha bounds;
- the current y=466 art baseline as a reason to abandon the new integer logical grid.

The new roster contract proposes logical baseline y=116 and delivery y=464 for future remasters. The two-pixel difference from current Kestrel is a documented future art-normalization concern, not authorization for a runtime or asset change now.

## Future fresh-remaster target

Kestrel should eventually be rebuilt from scratch on the same 128×128 logical grid and exact 4× export as the active batch. The approved fresh roster style seed—not a legacy Kestrel frame—will be the visual input:

- body height target: 79–81 logical pixels;
- compact shoulder width: 27–31 logical pixels;
- longbow length: 65–74 logical pixels;
- green hood and mask as one strong head mass;
- one cape/poncho wedge, not many cloth strips;
- bow, draw hand, arrow, and quiver readable at 96 px;
- no face exposure, no chibi shift, no role redesign.

## Benchmark use for active characters

Use legacy Kestrel to answer structural questions:

- How is the state named?
- What is the transition timing?
- Where is the pivot?
- How is mirroring handled?
- Which surfaces require proof?

Use the new character-style lock and approved fresh roster style seed to answer aesthetic questions:

- How dense may the detail be?
- What is a valid pixel cluster?
- How are materials simplified?
- Which proportion tolerances pass?
- Does the result read as a native sprite at 96 px?

## Rejection boundary

Reject any active-character generation that copies legacy Kestrel pixels, rendering, proportions, pose geometry, colors, light body class, hooded silhouette, bow posture, or ranger motion. Kestrel is a pipeline benchmark, not a visual generation base or costume template.

No Kestrel file, manifest entry, runtime definition, or animation frame is modified by this lock.
