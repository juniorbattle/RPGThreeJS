# CIN-6A video generation log

## Production contract

- Baseline: `9aad61dffe55d785f20e9b6c8fd081f210d7faf2`
- Census SHA-256: `b3ee675cccf87630c004ce00ba3c168ac64e8a50d92b6dbf07ed0ab625021c82`
- Provider: MiniMax Open Platform Direct API
- Model: `MiniMax-H3`
- Mode: image-to-video, first-frame conditioning
- Generation resolution: `2K`
- Mastering: H.264 High, yuv420p, 1920x1080, 24 fps, silent, rotation 0, fast-start
- Prompt version: `cin6a-v1`
- Canonical facing: `SCREEN_RIGHT`; authored `SCREEN_LEFT` placements were deterministically mirrored before composition.
- Attempt policy: inspect attempt 1, retry only for an explicit defect, maximum three attempts per shot.
- Storage: all raw candidates, rejected attempts, provider metadata, review frames, contact sheets, chain frames, and intermediates remain under ignored `tmp/cinematics/cin4/cin6a_*` paths.

No API key, authorization header, full environment, provider URL dump, or secret-bearing response body is recorded here.

## Accounting

| Measure | Result |
|---|---:|
| Produced targets | 15 |
| Authored shots | 40 |
| Provider attempts | 48 |
| Selected attempts | 40 |
| Targeted retries | 8 |
| Attempts beyond three per shot | 0 |
| Provider usage | 13,227,836 total tokens |
| New mastered duration | 200 seconds |
| New mastered bytes | 216,561,818 |

## Final masters

The final path and hash in this table apply to every selected shot row for that target below.

| Runtime ID | Final master | Seconds | Bytes | SHA-256 |
|---|---|---:|---:|---|
| `forest_journey_tension` | `public/assets/cinematics/forest_journey_tension.mp4` | 9 | 17,508,957 | `385f5f9b99b22d9710ef1ef7a89fd21a8b59e392664a51a2480eab6167511fac` |
| `camp_departure` | `public/assets/cinematics/camp_departure.mp4` | 12 | 11,262,128 | `fd9ec9efee8e127eed25a6ee680f875ab3f670eabcfae37e02970950e9fa35d4` |
| `alaric_audience_arrival` | `public/assets/cinematics/alaric_audience_arrival.mp4` | 9 | 9,749,877 | `b844b273dd955c34364d041b54baf385bd89b9a367db16bc29050685a186951f` |
| `refugees_approach` | `public/assets/cinematics/refugees_approach.mp4` | 12 | 9,713,540 | `5f1d76f8686c2bf2f9775576da6d50649cb33e1c5157b46e6d3f9d5b719e5a28` |
| `first_refuge_arrival` | `public/assets/cinematics/first_refuge_arrival.mp4` | 10 | 10,231,757 | `31b4a50f678d6d7431a855d7056bbcee66f44f8a623081be972b79986a55c56e` |
| `first_refuge_departure` | `public/assets/cinematics/first_refuge_departure.mp4` | 12 | 11,142,441 | `a3078c6e149c02f78be58063d9f884004a7d3b0265ba29481506fe138d194425` |
| `valmir_route_fork` | `public/assets/cinematics/valmir_route_fork.mp4` | 10 | 6,115,990 | `1a2f0a5f5eb02cec0fd12ce660b7ecfcb94bef9da264d4682880649b6f76438c` |
| `bois_clair_arrival` | `public/assets/cinematics/bois_clair_arrival.mp4` | 20 | 25,714,244 | `a37d397665960f8f6749d8f1ece69eaf91c7160cec68fc581ed26ea78042a699` |
| `bois_clair_saved` | `public/assets/cinematics/bois_clair_saved.mp4` | 18 | 21,378,564 | `a57d9ef8ff2fbb26084066b057f89948bdfe59de22dc7f7770d6576900223b1f` |
| `second_refuge_departure` | `public/assets/cinematics/second_refuge_departure.mp4` | 10 | 11,299,422 | `a7d4210b8223a6ef3946fc63bdb138310ed61168f6d902bfc0eb4f74dbe9be3d` |
| `witnesses_encounter` | `public/assets/cinematics/witnesses_encounter.mp4` | 12 | 12,057,859 | `de8f577bb18dc4ce30e0ec3d902fe7f27c4778154ade2e6e1a14eeec99ac4b98` |
| `ruins_approach_context` | `public/assets/cinematics/ruins_approach_context.mp4` | 10 | 17,438,390 | `adf235b6d84889cf80059ae314e7472f2c07e9dcd2f7e9cf99cf7f936bebe525` |
| `shadow_signs` | `public/assets/cinematics/shadow_signs.mp4` | 20 | 20,631,945 | `141d5e04d3573a1827cff7dbdc9efacb024d8a3ecab32a985b700da75a56f4c2` |
| `final_refuge_dossier` | `public/assets/cinematics/final_refuge_dossier.mp4` | 18 | 16,258,584 | `fa821768883d1afd897216c60c81f979c998db0b1437e1c7eb74f098b58f5ca2` |
| `serpent_route_ending` | `public/assets/cinematics/serpent_route_ending.mp4` | 18 | 16,058,120 | `f1de1f29ccc98ca66f97da94c21060d100687e4fef39b2d0378bcdea36db395c` |

## Rejection and correction ledger

Every source frame in this ledger passed deterministic composition, canonical asset, position, look-target, role, and facing validation before generation.

| Target / shot | Rejected attempt | Exact defect | Targeted prompt correction | Result |
|---|---:|---|---|---|
| `camp_departure/shot_02` | 1 | Seraphine reversed the established screen direction. | Locked character sides and required Seraphine to keep screen-left facing through the last frame. | Attempt 2 selected. |
| `first_refuge_departure/shot_02` | 1 | Facing drift during the reaction beat. | Reasserted left/right geography and prohibited turns or crossing. | Attempt 2 selected. |
| `first_refuge_departure/shot_03` | 1 | Unrequested push-in weakened the route-choice hold. | Required a static camera and stable final context. | Attempt 2 selected. |
| `second_refuge_departure/shot_01` | 1 | Character separation/staging became unclear. | Locked spacing, sides, and shared forward movement. | Attempt 2 selected. |
| `shadow_signs/shot_04` | 1 | Unrequested push-in reduced the neutral dialogue handoff. | Required a static settle, no reframing, and no disclosure gesture. | Attempt 2 selected. |
| `final_refuge_dossier/shot_02` | 1 | Character crop impaired the dossier composition. | Required all three canonical characters to remain completely readable in frame. | Attempt 2 selected. |
| `serpent_route_ending/shot_01` | 1 | The defeated General remained too upright. | Required an unmistakable stable kneel, bowed helmet, grounded polearm, and no recovery. | Attempt 2 selected. |
| `serpent_route_ending/shot_02` | 1 | Upright General contradicted the preceding defeated state. | Repeated the kneeling posture and continuity lock while preserving the authored artefact. | Attempt 2 selected. |

No retry repeated an unchanged prompt. No shot required operator approval for a fourth attempt.

## Per-shot provenance

Legend: `R` = `ROOT_SOURCE`, `C` = `CUT_SOURCE`, `H` = `CHAIN_SOURCE`. Source and last-frame values are SHA-256. Each attempt is `attempt / task ID / tokens / prompt SHA / disposition`. Provider, model, resolution, prompt version, and final master are the locked values above.

| Target / shot | Source path and SHA | Canonical assets; facing/action | Camera; seconds | Attempts | Last frame / continuity |
|---|---|---|---|---|---|
| `forest_journey_tension/shot_01` | R `.../shot_01/source.png` `676182bd782ea00bcc83119c755e0d0f612dcabcf81170bb799c66a0e7769e44` | Seraphine `RIGHT/WALK_SLOW` | `TRACK_SMALL_RIGHT`; 4 | 1 / `438374976487515` / 221332 / `275dc25059163b23c8ceae099c6ae2e20cd4c8b330245638cdf98769bff8e3ba` / selected | n/a / cut |
| `forest_journey_tension/shot_02` | C `.../shot_02/source.png` `902777a88477379f74fed2182111490d372fe18930ee1dc6e13ef078c05a7cf7` | Seraphine `RIGHT/STOP` | `SUBJECT_FOCUS_LEFT`; 5 | 1 / `438377113530628` / 273410 / `29fb9fee30911523a7f588a509034e2e996af2d0704faa2fe07cb8d4344c56a2` / selected | n/a / end |
| `camp_departure/shot_01` | R `.../shot_01/source.png` `d16c1fd80fff4c5d9d4d85b38219f39de8091d3c6b839616edccd6bbebf2247e` | Alistair `RIGHT/READY_STANCE`; Seraphine `LEFT/OBSERVE` | `WIDE_HOLD`; 6 | 1 / `438379033174275` / 325488 / `6f21425cf68a073b9c9644845ed6ad34b05a23fee1dd570f0e354f0518e2ac83` / selected | n/a / cut |
| `camp_departure/shot_02` | C `.../shot_02/source.png` `7773076d8ebf50379b2f55d7d60fed7896858a1a63a9126efd60c16928963a41` | Alistair `RIGHT/WALK_SLOW`; Seraphine `LEFT/OBSERVE` | `TRACK_SMALL_RIGHT`; 6 | 1 / `438388507337012` / 325488 / `adefec9f79b6a2007a64679986b8a450c52ebafeb242b72edb00b3e725662509` / rejected; 2 / `438390860107990` / 325488 / `42d0e93090bef31a582fd28faef38e6feb0563174bfcf25d36b70693f52b3a43` / selected | n/a / end |
| `alaric_audience_arrival/shot_01` | R `.../shot_01/source.png` `d5ae37cd34985b1f3e3d30ac28f73980dd331fd906df31385c26472addc33aac` | Alaric `RIGHT/OBSERVE`; Lion Champion `LEFT/STAND` | `WIDE_HOLD`; 4 | 1 / `438392484942102` / 221332 / `5075a692b6e256bcbb4c373bb3b74c001f94f1e72b5704a4a603dcf9187f0bc9` / selected | n/a / cut |
| `alaric_audience_arrival/shot_02` | C `.../shot_02/source.png` `14a741c38f14fea2e7a2c0c219dee5058ab8a13712eeeed5d0c15bfda74b39c2` | Alaric `RIGHT/SHIFT_STANCE`; Lion Champion `LEFT/OBSERVE` | `SUBJECT_FOCUS_LEFT`; 5 | 1 / `438394645553218` / 273410 / `dc0eb8f9f0686963522cb01fd09e3a9cf0eb93f1ac376173fec73168c2df7a61` / selected | n/a / end |
| `refugees_approach/shot_01` | R `.../shot_01/source.png` `ca607c0301d5b15a8ae839c7a1a5723a59be33e51b749d7e967deb483be10e9b` | Marian `RIGHT/WALK_SLOW`; Refugee Mother `LEFT/STAND` | `SLOW_PULL`; 4 | 1 / `438394857984295` / 221332 / `eb57dcd783d83fdf29db63963f5570c194cb66839e2f8bb0fbb4bbacf5b2d724` / selected | n/a / cut |
| `refugees_approach/shot_02` | C `.../shot_02/source.png` `e0a1254c4f2b582738b5632734ea85707e48e96db5149d4fbfde43e2118f90d8` | Marian `RIGHT/REACT_SMALL`; Refugee Mother `LEFT/SHIFT_STANCE` | `PAN_SMALL_RIGHT`; 4 | 1 / `438397523816514` / 221332 / `94af2bf056ff8a321bf8982c79ee130ea92eebf96be490082661d0c4007983ff` / selected | `31169fbb65a641669c5be6d381286eee2cf08b511527005a7280d259da6c27a3` / chain |
| `refugees_approach/shot_03` | H `.../shot_02/last_frame.png` `31169fbb65a641669c5be6d381286eee2cf08b511527005a7280d259da6c27a3` | Marian `RIGHT/OBSERVE`; Refugee Mother `LEFT/IDLE_BREATH` | `WIDE_HOLD`; 4 | 1 / `438398062993498` / 221332 / `a368dc8ad86fe4a3d1dc781252341387dfedd6c25423397a1dbcf93e4b92d9f3` / selected | n/a / end |
| `first_refuge_arrival/shot_01` | R `.../shot_01/source.png` `7496d7c8b1cfc542dd44fa4ac04ddedeac888545f995fe6373f0d6b847addaf2` | Marian `RIGHT/WALK_SLOW`; Alistair `LEFT/OBSERVE` | `TRACK_SMALL_RIGHT`; 5 | 1 / `438402007032032` / 273410 / `fc08785acbbb20979ac95a5e5dfa7b182fd33adadfae0bce4a05df80c38d3c7e` / selected | `8ebafcd06bfdf0b045e5eaca77db21423d5b9acb5fe83cf8e2ad1fb550d420c1` / chain |
| `first_refuge_arrival/shot_02` | H `.../shot_01/last_frame.png` `8ebafcd06bfdf0b045e5eaca77db21423d5b9acb5fe83cf8e2ad1fb550d420c1` | Marian `RIGHT/OBSERVE`; Alistair `LEFT/IDLE_BREATH` | `WIDE_HOLD`; 5 | 1 / `438404551823624` / 273410 / `b050e7fe4601777398aad5d170db8b44735a1b1ebd42f8116132fca3e330a077` / selected | n/a / end |
| `first_refuge_departure/shot_01` | R `.../shot_01/source.png` `bc7b6a1a8963464cb72519138a5f1505ac7d279f59b0f5235530a231fd6e9d4c` | Kestrel `RIGHT/OBSERVE`; Maelor `LEFT/WALK_SLOW` | `SLOW_PULL`; 4 | 1 / `438406378819781` / 221332 / `e8715cbf87974a806139fcff2454bb4983f1e41d349aea0eb13b333909cf15df` / selected | n/a / cut |
| `first_refuge_departure/shot_02` | C `.../shot_02/source.png` `5df5229ca1eafbe3de29cc1f586e36981251d640928c34a0c42cab28c9e60dba` | Kestrel `RIGHT/REACT_SMALL`; Maelor `LEFT/OBSERVE` | `PAN_SMALL_RIGHT`; 4 | 1 / `438406414651686` / 221332 / `b93d5394497e9c9cf86594ad05f641ce64d12a048a5ec76a8b7b3e871aaa81f4` / rejected; 2 / `438409834778695` / 221332 / `f016b6c2b5ed733dcfa512fe9cae66e0a74b6c9b7610609fb1adca2ba1212d80` / selected | `1703e8402de42a9480a7ae2a5d7656d0bfa7093574b67a180a5a0d22a55c24e0` / chain |
| `first_refuge_departure/shot_03` | H `.../shot_02/last_frame.png` `1703e8402de42a9480a7ae2a5d7656d0bfa7093574b67a180a5a0d22a55c24e0` | Kestrel `RIGHT/OBSERVE`; Maelor `LEFT/IDLE_BREATH` | `STATIC`; 4 | 1 / `438411838750976` / 221332 / `35b38ead1832f45f21097adce84b369402effcbb92fa59015b4f9f287ed0e9b0` / rejected; 2 / `438413667147971` / 221332 / `821eadc52c01a31c236137726e023c2f95ee7a94187ef6843f304a595c6ea584` / selected | n/a / end |
| `valmir_route_fork/shot_01` | R `.../shot_01/source.png` `2fd4a3b031adf1215d25fc18eaa21237f24c56707ba922512b070ef6c1e51bb4` | Kestrel `RIGHT/WALK_SLOW` | `PAN_SMALL_RIGHT`; 5 | 1 / `438415468564766` / 273410 / `45f79f3792c147025caac2cf5a9b5e65987d6a3817ee00e998b123f7b9c2749a` / selected | `08b7adc709a0b796369fa977acdba9a2972c764640f2a3236c5ce5a4f517165a` / chain |
| `valmir_route_fork/shot_02` | H `.../shot_01/last_frame.png` `08b7adc709a0b796369fa977acdba9a2972c764640f2a3236c5ce5a4f517165a` | Kestrel `RIGHT/OBSERVE` | `STATIC`; 5 | 1 / `438417879007304` / 273410 / `dda387097d6b8f33c4d6f3e0ff711c7ad7039c9916b7d7e11d209d67da081c08` / selected | n/a / end |
| `bois_clair_arrival/shot_01` | R `.../shot_01/source.png` `49c08d209417ad34f199eb286164a73b73a0fad12e41d119430456d6282a0368` | Alistair `RIGHT/WALK_SLOW` | `TRACK_SMALL_RIGHT`; 5 | 1 / `438579004665948` / 273410 / `10569da55f393ff53b85c92f02dfd3a5646c50ad294d66b84fe5030c71235c5a` / selected | `e84341e37f44fb4221e6ee65b2e0e1d79c2e17d3a9a3223642abe2ec72945b0f` / chain |
| `bois_clair_arrival/shot_02` | H `.../shot_01/last_frame.png` `e84341e37f44fb4221e6ee65b2e0e1d79c2e17d3a9a3223642abe2ec72945b0f` | Alistair `RIGHT/REACT_SMALL` | `SUBJECT_FOCUS_RIGHT`; 5 | 1 / `438581083709511` / 273410 / `942837c0acdcff73ade58d0e1f7b64fd51d062c39ed6b5385c2b9bee9f68a4aa` / selected | n/a / cut |
| `bois_clair_arrival/shot_03` | C `.../shot_03/source.png` `f0bf51ebef4a6a17e3a0d7ceb4734b2185a2ee695968b22e157b5f31e86ce79b` | Serpent Raider `RIGHT/SHIFT_STANCE`; Villageoise `LEFT/REACT_SMALL` | `PAN_SMALL_RIGHT`; 5 | 1 / `438579284320574` / 273410 / `b2843f559a57f5ab8bb45853a8b5b833b4309c4144bde1d2fc3a9fc0c7a38cec` / selected | `f9b3ba55e922d05d611c0088bf2ff8af3200e8e051cfb9f55475ddf86b438343` / chain |
| `bois_clair_arrival/shot_04` | H `.../shot_03/last_frame.png` `f9b3ba55e922d05d611c0088bf2ff8af3200e8e051cfb9f55475ddf86b438343` | Serpent Raider `RIGHT/OBSERVE`; Villageoise `LEFT/IDLE_BREATH` | `STATIC`; 5 | 1 / `438581112688879` / 273410 / `043295c31721fc78eb2c813a2eb558ac4714739968f0631fccf2fec0cd247ca8` / selected | n/a / end |
| `bois_clair_saved/shot_01` | R `.../shot_01/source.png` `d278391750491e993ad2568b7a8ae8116beb82a9e17bb6bc902b0386269bdf9c` | Refugee Mother `RIGHT/WALK_SLOW`; Villageoise `LEFT/REACT_SMALL` | `SLOW_PULL`; 6 | 1 / `438586253627595` / 325488 / `b370fa6b21c686c2d8c30f7bc34c9cb5d0c3405ffbcf62a621b7f0518ec3e4ad` / selected | n/a / cut |
| `bois_clair_saved/shot_02` | C `.../shot_02/source.png` `2ebddf94c949dcab49b4ae28bd2c91bb401d9bd289020161192610b2dfd99cf5` | Maelor `RIGHT/OBSERVE`; Villageoise `LEFT/IDLE_BREATH` | `SUBJECT_FOCUS_LEFT`; 6 | 1 / `438586756342039` / 325488 / `b2b82b7c87c379c3564618fd72e06def93b0998281949264990da5aabade72a8` / selected | `0a16931fbb7ee04cd568d4ea5e76604f29b75ab2d2d82156365038903deb0940` / chain |
| `bois_clair_saved/shot_03` | H `.../shot_02/last_frame.png` `0a16931fbb7ee04cd568d4ea5e76604f29b75ab2d2d82156365038903deb0940` | Maelor `RIGHT/OBSERVE`; Villageoise `LEFT/IDLE_BREATH` | `STATIC`; 6 | 1 / `438585893322874` / 325488 / `04032112c6a72732db461dc75c28f85bfe03fd2ec6ed5744f6bf81a3df9a2e66` / selected | n/a / end |
| `second_refuge_departure/shot_01` | R `.../shot_01/source.png` `6b362b085582b6522d886fd36461b38d28824276d2365c62ac830592b52e1764` | Marian `RIGHT/WALK_SLOW`; Alistair `LEFT/WALK_SLOW` | `TRACK_SMALL_RIGHT`; 5 | 1 / `438593780560129` / 273410 / `268f2b9dd9a46d234a8690150004115d42c181156205d0f5ba402ed8771c6465` / rejected; 2 / `438593203401002` / 273410 / `d1080ebee30d87c53887326a0128f6b450752d4a044d332b124283ad8d35f277` / selected | n/a / cut |
| `second_refuge_departure/shot_02` | C `.../shot_02/source.png` `4922348efc21805da97d2b3baa7ab4a4f9a64c4fda39c9be3e2c045649f86312` | Marian `RIGHT/OBSERVE`; Alistair `LEFT/STOP` | `SLOW_PULL`; 5 | 1 / `438595621630047` / 273410 / `3960d13f7e16fe0389dca729e8a3f197388473bccfecfea3d4603fbf82b2303c` / selected | n/a / end |
| `witnesses_encounter/shot_01` | R `.../shot_01/source.png` `8c238c35046ceff89edaa9a3581f01766c04df76b08a05b7bd57ccef2ada5361` | Marian `RIGHT/WALK_SLOW`; Survivor `LEFT/STAND` | `SLOW_PULL`; 4 | 1 / `438598891815115` / 221332 / `9244bc51d4b08a8e8d93eff404083c0aaab066c90e7970f2d0e8f5f7171c7b59` / selected | n/a / cut |
| `witnesses_encounter/shot_02` | C `.../shot_02/source.png` `a5f854f0324bb9d47b16cb3498bfdbef98178205403ab338d3897eae831f8b9b` | Marian `RIGHT/REACT_SMALL`; Survivor `LEFT/SHIFT_STANCE` | `PAN_SMALL_RIGHT`; 4 | 1 / `438598891815138` / 221332 / `b86a058b1555c951ab1295f2a5104d609948463dcc4dc5fadcc4ebbe75c98574` / selected | `3817a12441e22f084817ed17e17726d7111c7cfef071c734ce276e086c4904ab` / chain |
| `witnesses_encounter/shot_03` | H `.../shot_02/last_frame.png` `3817a12441e22f084817ed17e17726d7111c7cfef071c734ce276e086c4904ab` | Marian `RIGHT/OBSERVE`; Survivor `LEFT/IDLE_BREATH` | `STATIC`; 4 | 1 / `438601694888215` / 221332 / `b84ab91f7101ecdf92d4cd8d2ff0c8c3347162dc68bba62f76234f2f7b26f915` / selected | `5cf8f98272a30335dcf042837d80cb79479de041c260030ae9007b1baa72002b` / end |
| `ruins_approach_context/shot_01` | R `.../shot_01/source.png` `e1891b61e839b30bbb909f324458bf9c6c51d364129095c6df7975da164cb74b` | Seraphine `RIGHT/WALK_SLOW` | `TRACK_SMALL_RIGHT`; 5 | 1 / `438605055508727` / 273410 / `113cb542fd54b5f758e271a347acea556ccfab5216f8383ce7a43b32091ed883` / selected | n/a / cut |
| `ruins_approach_context/shot_02` | C `.../shot_02/source.png` `b11fbdfd4366a428b8267d7ba9e2b817d5edbc64d0d1b6d483c2bbcc5c9729e3` | Seraphine `RIGHT/OBSERVE` | `SLOW_PULL`; 5 | 1 / `438608458035425` / 273410 / `c3c2036542d401474f08966ae2417c019711c70b5effe0c05f53df2273cfe2b4` / selected | n/a / end |
| `shadow_signs/shot_01` | R `.../shot_01/source.png` `cb6d9f6176e6d1156c9a7e7bb5873e7d24cf480da2a0584fa09ec317ccad346e` | Seraphine `RIGHT/WALK_SLOW`; Elara `LEFT/OBSERVE` | `WIDE_HOLD`; 5 | 1 / `438608941138041` / 273410 / `8b0c4097998adcdd76e7c4cabb5910dfae5c38a13757667a4f2cbe3a34921f5f` / selected | `4c90db2f0e2b4897298aac15b77df861574d52584fafcdabd092f6e48c55db3d` / chain |
| `shadow_signs/shot_02` | H `.../shot_01/last_frame.png` `4c90db2f0e2b4897298aac15b77df861574d52584fafcdabd092f6e48c55db3d` | Seraphine `RIGHT/STOP`; Elara `LEFT/SMALL_HEAD_TURN` | `SLOW_PUSH`; 5 | 1 / `438611798904925` / 273410 / `b5d6d2b4ea4ea905ea0b844068d98d7ed8ce776732e4b62eafa348f7c1c871ff` / selected | n/a / cut |
| `shadow_signs/shot_03` | C `.../shot_03/source.png` `9ee1490c6894a512cbb37bfd67849999b596d342a95e3cfe235a07c9b58748b8` | Seraphine `RIGHT/REACT_SMALL`; Elara `LEFT/LOWER_HAND` | `SUBJECT_FOCUS_LEFT`; 5 | 1 / `438613698855009` / 273410 / `c340fa214604f0131e28e5131faf6cde31f18cea1049b7227386f659e39a930a` / selected | `1139186dce4863d77dfed9fc02fae0a4b04827ca787569e24adc1dd131934f85` / chain |
| `shadow_signs/shot_04` | H `.../shot_03/last_frame.png` `1139186dce4863d77dfed9fc02fae0a4b04827ca787569e24adc1dd131934f85` | Seraphine `RIGHT/OBSERVE`; Elara `LEFT/IDLE_BREATH` | `STATIC`; 5 | 1 / `438616925675778` / 273410 / `9174a2d726aef0cffe86a072df6ef48b652c5161c7a97fb51c39da8ca70e65d6` / rejected; 2 / `438617041277158` / 273410 / `f35543837d51df0258fbbb2c71650f8f77ccdf86b6eb29f9d06f5f45d392d980` / selected | `c050e460aa1f74b1150a31233d35a479f1ebac0156abe1e5942aa599d62813e6` / end |
| `final_refuge_dossier/shot_01` | R `.../shot_01/source.png` `4bfce910a92958a8bee08f0068517a09e01ccea8759f206ded12055fb5b0ca76` | Alistair `RIGHT/STOP`; Maelor `RIGHT/OBSERVE`; Seraphine `LEFT/STAND` | `SLOW_PULL`; 6 | 1 / `438621201518805` / 325488 / `d31aea69297ed7c5bef5e20f677a73697e9f981e6a444f9cb1390ed1161b8e04` / selected | n/a / cut |
| `final_refuge_dossier/shot_02` | C `.../shot_02/source.png` `0af811ddebb9897b3a10b89dc69a767c041ef7e48f591274e7a1d8e264ff8ec5` | Alistair `RIGHT/OBSERVE`; Maelor `RIGHT/SMALL_HEAD_TURN`; Seraphine `LEFT/REACT_SMALL` | `WIDE_HOLD`; 6 | 1 / `438623578538250` / 325488 / `8745f9858398b6272db66a37f750e089e447a1b144f00287b9447ab5f4f942d9` / rejected; 2 / `438622583287919` / 325488 / `a4d1a5fd7c34164a4cfc899b4c01a28e3c814cc9172e5a537bf77a93f35997cc` / selected | `31c6d52a81ec44ac2775598bfc590783659ca28ae85554bbd554a0217872e8df` / chain |
| `final_refuge_dossier/shot_03` | H `.../shot_02/last_frame.png` `31c6d52a81ec44ac2775598bfc590783659ca28ae85554bbd554a0217872e8df` | Alistair `RIGHT/READY_STANCE`; Maelor `RIGHT/LOWER_HAND`; Seraphine `LEFT/SHIFT_STANCE` | `WIDE_HOLD`; 6 | 1 / `438627308736788` / 325488 / `00db3e5a73c33d21bfaa1bf03e383966e4e6af6b91628678b23e2611cd5b992d` / selected | `8343dce8f3f32c1906e6c18e97650184bb0b909d0471c8d2c3ad1b9460d5da7a` / end |
| `serpent_route_ending/shot_01` | R `.../shot_01/source.png` `a430d05c2c5a11eea3e15d1c4b3f2099a0f26dfe4af7037c6e64a6c49211bd50` | Seraphine `RIGHT/STEP_FORWARD`; Serpent General `LEFT/LOWER_WEAPON` | `WIDE_HOLD`; 6 | 1 / `438629933551731` / 325488 / `ab4d9ebfd49ea52816c80f8cb73dfe2c1d22785ffa506f767e7a7a155997dfdc` / rejected; 2 / `438632757559386` / 325488 / `4019049c7d0ca5c01495ea19bb0e4002157866e16dee68e1673004184b216ff4` / selected | `1a521c832346ce34e1bc5d9a014fa8447bd18260bcaa155ae40095b3ba72bffd` / cut |
| `serpent_route_ending/shot_02` | C `.../shot_02/source.png` `a1cc82280aca28ea5e55302a91001b558e4dea6f0606a6ed51ab9b5b61b6fc4c` | Seraphine `RIGHT/OBSERVE`; Serpent General `LEFT/STAND` | `CLOSE_FOCUS`; 6 | 1 / `438633644568812` / 325488 / `c8cc4eb218defcc8c427e1437ad645b49bc0c8699552d9279d7ddc710bb7abb1` / rejected; 2 / `438680171098360` / 325488 / `1e43ac132415119c750e52e81716557b96b4189b24765736375ef294df0e49fd` / selected | `381325538c837cad4387b2bbbbfa5def6d07e4dacb9e1db0df852f458edb6cbd` / chain |
| `serpent_route_ending/shot_03` | H `.../shot_02/last_frame.png` `381325538c837cad4387b2bbbbfa5def6d07e4dacb9e1db0df852f458edb6cbd` | Seraphine `RIGHT/STOP`; Serpent General `LEFT/STAND` | `SLOW_PULL`; 6 | 1 / `438684237025496` / 325488 / `4ba7a5e0cd6232d27934f1c5ec7d2ccc297206d859992a80016fb82f3a062d75` / selected | `4763e1ae8a9f284eb2221fc95c2505d9f423cfd3c88aea7c43361b20f337f1fe` / end |

## Promotion decision

All 40 selected shots passed extracted-frame review at first, 25%, 50%, 75%, and last positions; every used chain source passed nonblack, nonblank, identity, anatomy, facing, weapon, background, composition, and motion-blur review before propagation. All 15 assembled masters passed sequence-transition review and technical validation. The eight rejected candidates remain ignored and were not added to the manifest.
