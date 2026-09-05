# CIN-4 Safe Video Generation Log

This log contains no API key, Authorization value, temporary download URL, or image data URL. Raw candidates and metadata remain ignored under `tmp/cinematics/cin4/lion_judgement_v2/`.

## Shared production inputs

- Sequence: `lion_judgement_v2`
- Cinematic: `lion_judgement`
- Tier: `HERO`
- Model/provider: `MiniMax-H3`, MiniMax Open Platform direct API
- Resolution: `2K`
- Canonical character assets: `public/assets/characters/pixel/full/alaric.png`, `public/assets/characters/pixel/full/lion_champion.png`
- Environment: `public/assets/generated/lion-phase/dialogue/lion_finale_judgement.webp`
- Canonical master facing: `SCREEN_RIGHT`

## shot_01

- Source type/path/SHA: `ROOT_SOURCE`; `tmp/cinematics/cin4/lion_judgement_v2/shot_01/source.png`; `057c441fa353f77631983a455c2cf47723d7f920404495c5a2f77c43964de025`
- Staging: Alaric `SCREEN_RIGHT`, looks to Champion, PRIMARY, `OBSERVE`, depth 20; Champion `SCREEN_LEFT`, looks to Alaric, SECONDARY, depth 10.
- Camera/duration: `WIDE_HOLD`; 5 seconds.
- Attempt 1: task `438266187178299`; prompt SHA `e5846e3c4e7c132f3f8cc31a7abf7fd324adb5a4efb31b2e340b915cd32e9c4e`; output SHA `ec9c770f0f14df6185f09881e0adb20f865139214e5f39e7a40589f4ee0b8ca3`; downloaded and technically usable; REJECTED because the Champion raised the sword overhead in a large combat-like action at the 25% frame.
- Attempt 2: task `438267903295764`; defect-specific sword-down/static prompt SHA `ca1a406942f901c022dccb36768c694c8423c911e75627cbff657dee18282d1b`; output SHA `d2e288fd384a710805e3192248a2b051af8cb34e3ed1740a966afa30ece3cb48`; APPROVED and selected.
- Selected master SHA: `3eab09539a0119ca711710e7e28d9f94030c9f5aab4df61d26b7f7c7d3373c76`.
- Final frame SHA: `ddb21fc350f22efc7062583464ee55beddeea9a4acdf5298496d0efe8e96bcd0`.
- Next chained shot: none; deliberate cut to `shot_02`.

## shot_02

- Source type/path/SHA: `CUT_SOURCE`; `tmp/cinematics/cin4/lion_judgement_v2/shot_02/source.png`; `d422dff62d879c8b474d6e710eb2fac5716fde07c917764561b0e08fd936e170`
- Staging: Alaric `SCREEN_RIGHT`, looks to Champion, PRIMARY, `STEP_FORWARD`, depth 20; Champion `SCREEN_LEFT`, looks to Alaric, SECONDARY, `REACT_SMALL`, depth 10.
- Camera/duration: `TRACK_SMALL_RIGHT`; 6 seconds.
- Attempt 1: task `438266425790713`; prompt SHA `ea7176491fe58ea6c6632df6fa4cb0b58c39528836cfba8fff2ec8c000cf95fe`; output SHA `3cd7261f494ffb0a2b0c145d0d617a3cc8962393f05f3e6a8d0d13baa89182e6`; APPROVED and selected.
- Selected master SHA: `ec36eb0b0b652519f585be9fac11e73f6b86babfb877dc7cd88528bc79229138`.
- Exact final frame: index 143/144 at 5.958333s; SHA `f5ac150eb5918352369b5994b53ee00d4a83c39799c95d9bc0c33bf359f00896`; 1920x1080; nonblack/nonblank PASS.
- Next chained shot: `shot_03`.

## shot_03

- Source type/path/SHA: `CHAIN_SOURCE` from `shot_02`; `tmp/cinematics/cin4/lion_judgement_v2/shot_02/last_frame.png`; `f5ac150eb5918352369b5994b53ee00d4a83c39799c95d9bc0c33bf359f00896`.
- Chain proof: source SHA exactly equals Shot 2 extracted-frame metadata SHA; predecessor `shot_02`; frame index 143.
- Staging: Alaric `SCREEN_RIGHT`, looks to Champion, PRIMARY, `SMALL_HEAD_TURN`, depth 20; Champion `SCREEN_LEFT`, looks to Alaric, SECONDARY, `OBSERVE`, depth 10.
- Camera/duration: `SUBJECT_FOCUS_LEFT`; 6 seconds.
- Attempt 1: task `438268517867633`; prompt SHA `a7b46a322b1102c4cfddf4a37f47e1e0c9c73c832aa80155ce1a643d8b78c1fe`; output SHA `d54e55616dbd66470f7ca102f4094b49d60cd4331fb74af9173ca65601de316b`; APPROVED and selected.
- Selected master SHA: `b07f896c54f07835ad92a5bb9f6c73a78035d28ab4f289b3e012518678af9c1f`.
- Final frame SHA: `80e6819aa7603f6d2911f7ae40f55e007a01c6608fcd53e74574cfb293914d0b`.
- Next chained shot: none; sequence END.

## Assembly and promotion

- Editorial order: `shot_01 -> shot_02 -> shot_03`.
- Transitions: hard cut, hard cut.
- Candidate: `tmp/cinematics/cin4/lion_judgement_v2/lion_judgement_v2_candidate.mp4`.
- Candidate/final SHA: `6ea5b12bb8c97deadbea2177725d7e3eb958ab7971361d34064729acf776e5f9`.
- Final: 17.000s, 21,565,194 bytes, H.264 High/yuv420p, 1920x1080, 24fps, silent, rotation 0.
- Promotion result: YES; production `public/assets/cinematics/lion_judgement.mp4` now has the candidate SHA.
- Prior CIN-3 final SHA: `f69799dde632b36c755a79b3747dbf5805fbdc187230a4a7e9aa8435d76c49f4`.
