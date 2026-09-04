# CIN-3 video generation log

Date: 2026-09-04  
Baseline: `dfef3887b06f35a0ec5c189487ed22e92bac07cc`  
Provider: MiniMax Open Platform Direct API  
Model: `MiniMax-H3`  
Mode: image-to-video, first-frame conditioning  
Prompt version: `cin3-v1`

The development-only client used `POST https://api.minimax.io/v2/video_generation`, polled `GET https://api.minimax.io/v2/query/video_generation/{task_id}`, and transported each validated PNG as a lowercase `data:image/png;base64,...` first-frame image. Official contract references: [create video generation task](https://platform.minimax.io/docs/api-reference/video-generation-v2-create) and [query video generation task](https://platform.minimax.io/docs/api-reference/video-generation-v2-query).

No API key, authorization header, signed output URL, or complete provider response is retained. The safe metadata files and review frames are under ignored `tmp/cinematics/cin3/` and are not production artifacts.

## lion_judgement

- Canonical characters: `public/assets/characters/pixel/full/alaric.png`, `public/assets/characters/pixel/full/lion_champion.png`
- Environment: `public/assets/generated/lion-phase/dialogue/lion_finale_judgement.webp`
- Deterministic source: `public/assets/cinematics/source/lion_judgement_source.png`
- Source SHA-256: `5b8324ff338d6f06bc9eb2a3dc0c5e20d56100a0339749c43fa6998026790c01`
- Attempt: 1 of 3; task `438223457247491`
- Request: 2K, 8 seconds, one first-frame image
- Prompt SHA-256: `465689c463cfbf10c84039b7da811ec13b10c9c30c214f172870f258b9899fd0`
- Safe usage returned: 8 output seconds, 1 input image, 429,644 total tokens (13,020 prompt; 416,624 completion). Cost was not returned by the endpoint.
- Candidate: `tmp/cinematics/cin3/lion_judgement/candidate_01_raw.mp4`; 5,660,447 bytes; SHA-256 `1c1be84705d707d44b7fa16d66e1500ef12c37c5f875d6dd2fbcad47f6d06e37`
- Candidate media: MP4, H.264 High/yuv420p, 2560x1440, 24 fps, 8.0 seconds, AAC audio present, rotation 0
- Review: selected. First/25/50/75/last frames preserved Alaric and the Lion Champion, the judgement-hall composition, equipment, palette, and silhouettes. The last second settled without blank, black, corrupt, or deformed frames.
- Identity gate: head/face, hair/headgear, armour, clothing, cape/tabard, weapons, palette, silhouette, proportions, and Lion faction identity all PASS.
- Mastering: Lanczos fit/pad to 1920x1080, square pixels, 24 fps, libx264 High/yuv420p CRF 18, 48-frame GOP, audio removed, metadata removed, fast-start enabled. No appended freeze was required.
- Final: `public/assets/cinematics/lion_judgement.mp4`; 7,212,782 bytes; SHA-256 `f69799dde632b36c755a79b3747dbf5805fbdc187230a4a7e9aa8435d76c49f4`

## serpent_general_reveal

- Canonical character: `public/assets/characters/pixel/full/serpent_general_boss.png`
- Environment: `public/assets/generated/lion-phase/combat/lion_sanctum.webp`
- Deterministic source: `public/assets/cinematics/source/serpent_general_reveal_source.png`
- Source SHA-256: `ce1e6aabfafca830a198b0314ecb8ea6676574242f15c6947117b690af469c44`
- Attempt: 1 of 3; task `438226192974053`
- Request: 2K, 8 seconds, one first-frame image
- Prompt SHA-256: `f6a9837eed305eb1d6d17a27893dee7a1a1253db85a7ba7a283fd425b2865832`
- Safe usage returned: 8 output seconds, 1 input image, 429,644 total tokens (13,020 prompt; 416,624 completion). Cost was not returned by the endpoint.
- Candidate: `tmp/cinematics/cin3/serpent_general_reveal/candidate_01_raw.mp4`; 7,120,584 bytes; SHA-256 `694bd01852053bf994ecb7a5c3e3f104be59fa9d1488c31c2b00ae3bce0c422e`
- Candidate media: MP4, H.264 High/yuv420p, 2560x1440, 24 fps, 8.0 seconds, AAC audio present, rotation 0
- Review: selected. The restrained push-in and green backlight preserved the helmet, green/copper armour, single polearm, cloak, body proportions, and sanctum layout. No extra limb, weapon mutation, added character, text, or watermark appeared.
- Identity gate: head/helmet, armour, clothing, cape/tabard, weapon, palette, silhouette, proportions, and Serpent faction identity all PASS. Face is canonically concealed and remained concealed.
- Mastering: same production recipe as Lion Judgement; source AAC and provider metadata removed; no appended freeze.
- Final: `public/assets/cinematics/serpent_general_reveal.mp4`; 9,331,600 bytes; SHA-256 `e8c918d292693e4bc7f612fc6f4fbcdb283c6d2f8095c805db287692e561a682`

## lion_champion_reveal

- Canonical character: `public/assets/characters/pixel/full/lion_champion.png`
- Environment: `public/assets/generated/lion-phase/combat/lion_sanctum.webp`
- Deterministic source: `public/assets/cinematics/source/lion_champion_reveal_source.png`
- Source SHA-256: `e2739c151a772fbe5ac033f8583b0197000e49f8a9174fcecd808fa84391148a`
- Attempt: 1 of 3; task `438228257693796`
- Request: 2K, 8 seconds, one first-frame image
- Prompt SHA-256: `8650437201436a84a3f64efd8f2aeffd3f6c67ff5a14fbff8e66c4eb33b5a5c5`
- Safe usage returned: 8 output seconds, 1 input image, 429,644 total tokens (13,020 prompt; 416,624 completion). Cost was not returned by the endpoint.
- Candidate: `tmp/cinematics/cin3/lion_champion_reveal/candidate_01_raw.mp4`; 8,127,932 bytes; SHA-256 `c10d95df5ceed9af7511eea19907657ceda4fdccd69b2edacc84b7b95ea7e696`
- Candidate media: MP4, H.264 High/yuv420p, 2560x1440, 24 fps, 8.0 seconds, AAC audio present, rotation 0
- Review: selected. Crown, leonine head, blue/gold plate, fur mantle, sword, proportions, and Lion sanctum remained coherent in all sampled frames. Motion stayed minimal and stable; no redesign, duplication, text, or watermark appeared.
- Identity gate: head/face, crown, armour, clothing, mantle/tabard, sword, palette, silhouette, proportions, and Lion faction identity all PASS.
- Mastering: same production recipe; source AAC and provider metadata removed; no appended freeze.
- Final: `public/assets/cinematics/lion_champion_reveal.mp4`; 10,692,772 bytes; SHA-256 `2d581e76e5cc0a37d4633fd6d7166210780da55475f54abadfd90aedaf30b04c`

## Selection and audio summary

Exactly three paid generations were submitted: one attempt per authorized cinematic. All attempt-1 candidates were approved after a defined technical and visual review; there were no blind retries and no rejected candidates. Every raw candidate contained an AAC stream. CIN-3 deliberately strips raw audio from all production masters, so shipped media contains no audio stream and no generated speech. Default muted playback remains unchanged; mute/unmute is not applicable to the silent masters.
