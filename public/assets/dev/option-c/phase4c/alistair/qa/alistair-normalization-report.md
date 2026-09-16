# Alistair normalization report

Status: **PASS**

## Shared contract

- Frame: 512x512 RGBA PNG
- Pivot X: 256
- Foot baseline: 470
- Target armored-body height: 326
- Minimum alpha-edge margin: 16
- Resampling: premultiplied-alpha Lanczos
- Scale authority pose: master
- Shared source-to-frame scale: 0.193094276
- Scale rule: the master alone establishes scale; every pose receives that exact scale and is translated only to the shared foot baseline and pivot.

## Pose measurements

| Pose | Source body h | Normalized body h | Pose compression | Scale | Alpha bbox | Visible w | Foot | Pivot x | Head center | Body center | Edge L/T/R/B |
|---|---:|---:|---|---:|---:|---:|---|---|---|
| master | 1678 | 326 | 1.000 | 0.193094 | [92, 110, 417, 471] | 325 | 470 | 255.89 | [215.34, 176.03] | [242.37, 293.82] | 92/110/95/41 |
| idle | 1717 | 333 | 1.023 | 0.193094 | [108, 110, 417, 471] | 309 | 470 | 256.36 | [229.13, 179.89] | [246.51, 295.75] | 108/110/95/41 |
| dash | 1512 | 293 | 0.901 | 0.193094 | [70, 150, 431, 471] | 361 | 470 | 255.94 | [294.37, 196.03] | [263.47, 306.09] | 70/150/81/41 |
| attack | 1521 | 296 | 0.906 | 0.193094 | [111, 166, 471, 471] | 360 | 470 | 256.01 | [242.68, 215.62] | [248.48, 314.09] | 111/166/41/41 |
| skill | 1473 | 286 | 0.878 | 0.193094 | [74, 172, 435, 471] | 361 | 470 | 256.08 | [219.2, 220.55] | [230.78, 317.09] | 74/172/77/41 |

## Consistency

- Maximum projected body-height deviation at the shared scale: 2 px (allowed resampling tolerance: 2 px)
- Maximum scale deviation: 0.000000000
- Normalized pose body-height range: [286, 333] px (pose compression is expected)
- Minimum observed edge clearance: 41 px
- Size consistency: PASS
- Alpha containment: PASS

Head/body/weapon reference points are operator-reviewed landmarks recorded in the checked-in config. Pixel bounds, scale, pivot, baseline, transformed landmarks, and clearances are calculated deterministically.
