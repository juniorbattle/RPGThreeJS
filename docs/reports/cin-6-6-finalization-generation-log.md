# CIN-6.6 Finalization Generation Log

## Provider contract

- Integrated keyframes: OpenAI built-in image generation, seven source frames total. No itemized usage or cost was exposed by the tool.
- Video provider: MiniMax Open Platform Direct API.
- Model/mode: MiniMax-H3, image-to-video, first-frame conditioning, 2K request.
- Final mastering: 1920x1080, 24 fps, H.264 High, yuv420p, silent, zero rotation.
- Raw candidates, provider metadata, review frames, contact sheets, and keyframes remain ignored under `tmp/cinematics/`.
- No API key, Authorization header, provider URL, or response dump is recorded here.

## Attempt summary

Exactly nine MiniMax tasks were submitted for seven shots. Every retry followed a specific observed defect.

| Runtime / shot | Attempt | Task ID | Source SHA-256 | Prompt SHA-256 | Output SHA-256 | Tokens | Decision |
| --- | ---: | --- | --- | --- | --- | ---: | --- |
| `alaric_audience_arrival/shot_01` | 1 | `439696412803150` | `8537ff5c76eb791a1f6c1dc4b3932460ace46079e4a5af99d74dcd46d971536c` | `3497c2d4eec15ef1e43bd2ede498d0ca48c75333c83cc74f2e3512b6367c20c4` | `23943fef819ed44e47ea8413d9f53f6ba612b8bc63d60da0c4b032138398baa5` | 221,332 | selected |
| `alaric_audience_arrival/shot_02` | 1 | `439698969530626` | `b1e40e01552f738d8a58724efc4e3ae0d42a383332c717e94ae908b279cac496` | `5f6fb7506a135797e67a1cdb7a1e20d587d8052193f2d060ed652af4c4af99bc` | `b1c2a7728f6ad124831386efb345a64170f3741713c8b3f6c9c826dccb3bf1b3` | 221,332 | selected |
| `alaric_audience_arrival/shot_03` | 1 | `439697476440306` | `7351c8b7189fbd79404de75065f744bbf3009d0efd55068e929184e64a0c5d21` | `ea0f1183bea6f5be944e4bd7c9c50f0500236d194d5f5639629fba5ec18650a2` | `18eb41120828bb5956025c786bbb671e06c518e87e197bab0d72f47230d0eda4` | 221,332 | selected |
| `camp_departure/shot_01` | 1 | `439701259907362` | `aa5b01a326be742f9dc47ca48e20f726fd4730f7fa2ee4104fb560853045ce35` | `322dd3540cc2d1d21a9501a9124a64deccbc38b605f54eb78ce186bf7cd49084` | `5d81f8802292b68107928a6de05a70916d5df7994bb2cf7470ee566f48b38ea1` | 325,488 | selected |
| `camp_departure/shot_02` | 1 | `439703777341714` | `261ec6f0b0719f0ab43076005ecb32b5989179b10f20d4f17aa6871f93e705b8` | `179f15f311fbeea4589a02dcddf5e6b28ca24c99c2ad311825030cfaf890c988` | `0a4a5ad1be91f7186692c6cd1fd430dd237c2e32e613b402dce081f89b4a7199` | 325,488 | selected |
| `valmir_route_fork/shot_01` | 1 | `439706575151173` | `086dc6a5e924106ca30714c6d61c52400a3194c67eea8b58a728d486365b47dd` | `4fb3abce398e1a4315460729eb9f08b2be85382ef294b651bdb1bbcbe8f11f7c` | `c7bb4bc7b01ee5d848e274334e6cbfbea176ab0e4cd1f130eca03bcc7e125332` | 273,410 | rejected: full-back turn; Alistair sword and Maelor equipment lost |
| `valmir_route_fork/shot_01` | 2 | `439705826029806` | `086dc6a5e924106ca30714c6d61c52400a3194c67eea8b58a728d486365b47dd` | `f250b89cc3a7e30dcac37ddae5289bf62e3265d9605a9bb55e8f71a9ea1f6628` | `6ac64c069993d8d4c0ce084115afc0631d1b5b682b1e2132e82bb63bf33ce1f1` | 273,410 | rejected: equipment improved, adviser facing reversed |
| `valmir_route_fork/shot_01` | 3 | `439757920149577` | `086dc6a5e924106ca30714c6d61c52400a3194c67eea8b58a728d486365b47dd` | `f0a048ad94363ab643ee92e7ec51e0db984e7f037175257f315bba02e48078cd` | `a2957b1ed2b7418b4c5798583cd09aa492333534b767753b7096117bd80f9b96` | 273,410 | selected: stabilized pose/facing/equipment; world motion carries shot |
| `valmir_route_fork/shot_02` | 1 | `439757937770736` | `98ca010738c4b32cb87b85ea90cbc8a17b071c1bd2e3124e23f2a809902986f6` | `6aacb79fb23f225d772d96ce72166fd4f003cda48a231f27d962783102a8a0e3` | `9b1d025cbd2d2a8cabd6a7167a1acc9f59f83773d29637f6fcdaffa90a5ce698` | 273,410 | selected |

The selected Valmir attempt-3 candidate was rechecked after production. The file hash, `candidate_03_raw.metadata.json` output hash, and `shot_master.metadata.json` source-candidate hash are all exactly `a2957b1ed2b7418b4c5798583cd09aa492333534b767753b7096117bd80f9b96`.

## Selected shot masters

| Shot | Duration | Master SHA-256 |
| --- | ---: | --- |
| `alaric_audience_arrival/shot_01` | 4s | `a87f4ed014f6a30521d255985a7383482f127044b4c02815ce371c8ba4f222fe` |
| `alaric_audience_arrival/shot_02` | 4s | `9e8708abd0f2866d3c86210a08f473970f47336ed7c4cd95f8621441bbb22ef1` |
| `alaric_audience_arrival/shot_03` | 4s | `4b5914558968b355457456dcb59f411e035faee1af8c4f5fff71e826029afbf2` |
| `camp_departure/shot_01` | 6s | `05fe925725aa8352216c3b20e62241b88bd2d3f186e5e18299fcff308c47cfe5` |
| `camp_departure/shot_02` | 6s | `a665b7ed3b2eed4bfaab07dbe26235357b6770f53d5e3e9334e51e0ba4bfe7ae` |
| `valmir_route_fork/shot_01` | 5s | `1893f4ad2bacf3063d04ae3d3e519b4e2c44f824b03a39bba362a251583ede95` |
| `valmir_route_fork/shot_02` | 5s | `3bbda147ef0105e1231a4fcef98786be625452ca29ca2fea6bd371b76378965a` |

## Final masters

| Runtime ID | Duration | Bytes | Final SHA-256 |
| --- | ---: | ---: | --- |
| `alaric_audience_arrival` | 12s | 12,340,443 | `b823180582228dc2dd08592926efeb8ec58bc40bc102e238577361eac1dcb629` |
| `camp_departure` | 12s | 14,245,824 | `a56678969bfb319d503be1f3f406ca2a3bef1a11bebc07db78c6fb22e6b9c0f3` |
| `valmir_route_fork` | 10s | 13,094,926 | `63a4a0c3793d6e29ce8fd94b1478dfab59e40f856d53a01915e47fb9a6343261` |

All selected shots and all three final sequences passed first/25%/50%/75%/last review, cut review, identity, facing, equipment, anatomy, grounding, environment motion, no-text, no-watermark, stable-final-frame, and technical validation. No fourth media was generated.
