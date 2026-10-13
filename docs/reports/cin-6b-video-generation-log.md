# CIN-6B video generation log

## Production contract

| Field | Value |
|---|---|
| Baseline | `b1ba1e36d3b21b2b008808ea007445b3564fe3cb` |
| Census SHA-256 | `b3ee675cccf87630c004ce00ba3c168ac64e8a50d92b6dbf07ed0ab625021c82` |
| Provider | MiniMax Open Platform Direct API |
| Model | `MiniMax-H3` |
| Mode | image-to-video, first-frame conditioned |
| Requested generation resolution | `2K` |
| Prompt version | `cin6b-v1` |
| Production order | `bois_clair_sacrificed`, then `lion_trial_route_ending` |
| Selected shots | 6 |
| Provider attempts | 9 |
| Targeted retries | 3 |
| Provider usage reported | 3,137,704 total tokens; 58 generated seconds across all attempts |

The API key, authorization header, complete environment, provider response dumps, provider download URLs, raw candidates, review frames, contact sheets, and FFmpeg intermediates are not recorded in tracked content. Task IDs are non-secret production provenance and follow the existing CIN-6A logging policy.

## Source-frame and scale audit

All four canonical files have a 640x768 canvas, which was not interpreted as physical stature. Transparent bounds were inspected before layout:

| Character | Transparent-trim bounds | Visible pixels |
|---|---|---:|
| `villageoise` | `(171,84)-(468,736)` | 297x652 |
| `maelor` | `(87,84)-(553,736)` | 466x652 |
| `alaric` | `(74,84)-(565,735)` | 491x651 |
| `lion_champion` | `(65,84)-(575,735)` | 510x651 |

Bois-Clair shot 1 uses the same 620 px wide-shot displayed height as the saved counterpart. Shots 2 and 3 place Maelor at 700 px and the villageoise at 680 px on the same `groundY=0.98` plane. Lion Trial shot 1 places Alaric at 680 px and the Champion at 620 px on `groundY=0.97`; shots 2 and 3 coherently move closer at 820/750 px on `groundY=0.98`. The Alaric-to-Champion ratios are 1.0968 and 1.0933, a 0.32% cross-shot difference. Source contact sheets passed identity, facing, screen direction, weapon/prop, composition, grounding, relative height, environment, truth, and collage-scale review before the first paid request.

## Provider attempts

Abbreviations: R = `ROOT_SOURCE`, C = `CUT_SOURCE`, H = `CHAIN_SOURCE`. Every attempt used the canonical environment and character assets named in the shot spec.

| Runtime / shot | Source | Source SHA-256 | Staging | Camera / seconds | Attempt provenance | Decision |
|---|---|---|---|---|---|---|
| `bois_clair_sacrificed/shot_01` | R | `97b469bd1eda38074a0320f15a48f711a20a481b0957de2f45fa462d011fc6b7` | villageoise LEFT, 620 px, `groundY=.98` | `SLOW_PULL` / 6 | attempt 1; task `438973101773073`; 325,488 tokens; prompt `521f5d0807fe8edd98511d317cf2bd33c642311da51b1a67e8ab29ad11716195`; raw `790aeaaa357954dca6ade232fd3cbe491937bd4e2ac7987699686acf6ef541aa` | selected; mastered `9e311dd226299631ef44b6cd1c258aaf4ced5c1b145a1871b422d8b15b88799f` |
| `bois_clair_sacrificed/shot_02` | C | `2ebddf94c949dcab49b4ae28bd2c91bb401d9bd289020161192610b2dfd99cf5` | Maelor RIGHT 700 px; villageoise LEFT 680 px; shared `.98` plane | `SUBJECT_FOCUS_LEFT` / 6 | attempt 1; task `438973502967912`; 325,488 tokens; prompt `89e8a2f3a48ee16b98ed30b9993470aef9357398fdec2c7cb575695a481f9c97`; raw `4a2911e683249eb33ffbd2bcc99983e94609dc4fe80522c5745868e8e7486259` | rejected: Maelor rotated toward camera/screen-left and camera/scale drifted |
| `bois_clair_sacrificed/shot_02` | C | same reviewed source | same authored scale and plane | `STATIC` / 6 | attempt 2; task `438975143772405`; 325,488 tokens; prompt `cb32d76c102547fd7570aeb6a1e9968704705227c3d7d90c2e634d8e6b7b1c3d`; raw `4cff4acfc6aa06a4dbac7507d4936c9e74a4bf0ba7fcae10d39447c9f8503f43` | selected after facing/camera-only correction; mastered `401d3521fe0d000e6543bb15a2f1427e2a5ef14eba3bfe258b31ed96cbc1ca68` |
| `bois_clair_sacrificed/shot_03` | H from selected shot 2 | `e833fdff4b5b20a57da315477dfa3ec6607f4c30dad11ac6a8025fb042eb17fe` | Maelor RIGHT; villageoise LEFT; scale and plane retained | `STATIC` / 6 | attempt 1; task `438977158357265`; 325,488 tokens; prompt `3e5079bb0165e0b021157d0b45d895b97c996ba853a5c513980daf8c7ba1a14b`; raw `4fd9415a950c2ac284a2757d95d5c7c2d7fcc95146c19bd773b97176a04a434e` | selected; mastered `5174c68e35c242b18c308a93a77ebaf81b722e7a867f839e5ef834d19e756515`; last frame `d1391b1d5f274a006bb15997a00ddf4686aa6f0e1e43b31fef137887e3e8836c` |
| `lion_trial_route_ending/shot_01` | R | `469078c9b3116d0c55e43ca68811a0ca7d007da0da6d5484852183e04a27e826` | Alaric RIGHT 680 px; Champion LEFT 620 px; shared `.97` plane | `WIDE_HOLD` / 6 | attempt 1; task `438980112322839`; 325,488 tokens; prompt `3c6aba1f311a7db4f442df00d0348a25e3abcd9ba9eecab84369517076cb6c75`; raw `efa4ce261dd0be3ca933beac1a3b9e82384edf573946ba00478f09a10e14dbbc` | selected; mastered `b032f56cf9ddc906ec6f239775db08774f20fa020e477b625428a1497e7bfa2a` |
| `lion_trial_route_ending/shot_02` | C | `eade4912a2a32d72b3bea74c0fde6ad7ca1c963ff751cce6abfe8c1d25a8a558` | Alaric RIGHT 820 px; Champion LEFT 750 px; shared `.98` plane | `SUBJECT_FOCUS_RIGHT` / 7 | attempt 1; task `438981024698675`; 377,566 tokens; prompt `d5ecc6fbedf43a0b3e6a914fcc7b64175f326d3e80fd57d7e708b005cbc0a7f1`; raw `c1cd5ddab38de071a8160cc65cec218c780971dab2677d47046749018be6b2c1` | rejected: Champion raised the sword upright instead of retaining the low yield pose |
| `lion_trial_route_ending/shot_02` | C | same reviewed source | same authored scale and plane | `STATIC` / 7 | attempt 2; task `438982850322748`; 377,566 tokens; prompt `8f81d54e8ef972984be4708219b13ddafe718b8c35134c650ba1797ed200ce9c`; raw `17db2f2f4fcd8ffa559e5a2cd6102f03d46cafde78b90749db5371ff474c57a8` | selected after weapon/camera-only correction; mastered `27b0c3395caca8d97251233c6e743dce92188cf19f5c3016b59f5eac7653e2a9` |
| `lion_trial_route_ending/shot_03` | H from selected shot 2 | `1175e5acbfb24263546915dadfa405732d38149cfefd92ceaef90731d5caaf1c` | Alaric RIGHT; Champion LEFT; scale and plane retained | `STATIC` / 7 | attempt 1; task `438985745367120`; 377,566 tokens; prompt `7a6bc799f3daaba9f400618b06bf3b67448976c295ad78c46fade1ac320e6269`; raw `ee97f23a7bede6bba24408090192a20c6dc1ba706a0a0cb7b2a0d68ffe571f53` | rejected: sword rotated horizontally across the body at the ending frame |
| `lion_trial_route_ending/shot_03` | H from selected shot 2 | same reviewed chain source | same authored scale and plane | `STATIC` / 7 | attempt 2; task `438987837309016`; 377,566 tokens; prompt `5c3427e67c7c495e1b814340ce382c6db23bfce3fc961019df01f89a57e41c8c`; raw `4fe0235ea4fa808bcf5727a8ee981c254cfe2f07e92268a0e46130b87dc35bf4` | selected after weapon-only correction; mastered `cf6a0d7922c9fff744f60c5708c101aa31d9ebcdb18794af91b7ca4925e30867`; last frame `a3b33c8e3af32f4b3e717e12a191c37eb5ac3ae3af8d45d4616424fbc08c2350` |

## Sequence assembly and promotion

| Runtime ID | Editorial order | Chain boundary MAD | Final master | Final SHA-256 |
|---|---|---:|---|---|
| `bois_clair_sacrificed` | shot 1 CUT shot 2 CHAIN shot 3 | 5.7844 | `public/assets/cinematics/bois_clair_sacrificed.mp4` | `db07031a3105fb31280abe3aca026cb74e4612e2aa44f7023b5401847322f1a4` |
| `lion_trial_route_ending` | shot 1 CUT shot 2 CHAIN shot 3 | 4.7154 | `public/assets/cinematics/lion_trial_route_ending.mp4` | `34f023ac0313e622a82d53c955e63e1e56a62eb4bd3bfdef9580196fcff178b2` |

Every selected shot was reviewed at first, 25%, 50%, 75%, and last frames. Both sequences were reviewed across their deliberate cuts and exact last-frame chains. The three rejected attempts remain only in ignored QA storage and were not promoted or referenced by the manifest.

## Visual acceptance

| Runtime ID | Identity | Facing | Direction | Scale | Relative height | Grounding | Anatomy | Weapon | Environment | Camera | Continuity | Final frame | Truth safe |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `bois_clair_sacrificed` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `lion_trial_route_ending` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

Both promoted masters are silent 1920x1080, 24 fps, H.264 High, yuv420p MP4s with no rotation. They passed the CIN-4 media validator, real Chromium decode, natural-end, final-frame-hold, Skip, reduced-motion, missing/broken fallback, and overlay-cleanup checks.
