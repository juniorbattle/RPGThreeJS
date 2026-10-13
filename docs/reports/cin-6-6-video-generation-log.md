# CIN-6.6 — Video Generation Log

## Contract and accounting

- Provider: MiniMax Open Platform Direct API
- Model: MiniMax-H3
- Mode: image-to-video, first-frame conditioning
- Generation resolution: 2K
- Final mastering: 1920×1080, H.264 High, yuv420p, 24 fps, silent, fast-start
- Authorized targets: `alaric_audience_arrival`, `camp_departure`
- Paid provider tasks: 6
- Selected shot masters: 5
- Rejected candidates: 1
- Targeted retries: 1
- P1/P2 tasks: 0/0

An initial sandboxed Camp request failed before provider submission and produced only a local failure metadata stub. It incurred no provider task ID or paid generation and is not counted as an attempt.

No API key, Authorization header, provider download URL, response dump, or environment listing is recorded here.

## Alaric audience arrival

Semantic target: `node:lion-audience:arrival`  
Runtime ID: `alaric_audience_arrival`  
Spec: `tools/cinematics/specs/cin6a/alaric_audience_arrival.json`  
Sequence: `cin66_alaric_audience_arrival`  
Cast: company `alistair`, `marian`; Lion `alaric`, `lion_champion`  
Environment: canonical Lion audience pavilion  
Duration: 3 × 4 seconds

| Shot | Attempt | Source SHA-256 | Prompt SHA-256 | Task ID | Tokens | Raw SHA-256 | Decision |
| --- | ---: | --- | --- | --- | ---: | --- | --- |
| `shot_01` | 1 | `44ff0ee50b2ac6c312ffff95f14f529e04e354741b17bb7045d37391fd3d3872` | `e034933be62137d92f254526aa58eaaa4d61260d39b8f5a4cc9fd4539ea4ce7b` | `439420025192528` | 221,332 | `a774b7f0593851a02f2d7d5ebe111414ef47534fcd4482095b8dceac721a3075` | SELECTED |
| `shot_02` | 1 | `890eecc29093890f665867db36028489a166451ddcb4be636b3678091a2b3549` | `91ba6c38b2730c02bed9c02f4bd0e0115b368f13ceed2b80a148248dc496f333` | `439420234997989` | 221,332 | `dd25dad39483f14af4a331d395cb96f05f98fab56f3a6f3dfbd5b135637320b7` | REJECTED |
| `shot_02` | 2 | `890eecc29093890f665867db36028489a166451ddcb4be636b3678091a2b3549` | `acb584b0e981661ad34409bb33ce4ef68ca140dcdd65d6e6ac637a69b3f49137` | `439422639984838` | 221,332 | `cf20b06ad6d1375c5559776459466f92f75e3fe9fd9ae9386c497d77171a3aad` | SELECTED |
| `shot_03` | 1 | `44cf6fed4ba9a14ad47266c67caa64b0394558c04eebc62b00ce3a626f9e394c` | `0e9665ee5411f4fe177a78789dfaa293d1073855805c7eb4e104ebbe34bf1702` | `439423597936729` | 221,332 | `802a2a23db831bafe5808905d789267c76c2bdf919561f2fb32a4bc6ea61058c` | SELECTED |

Shot decisions:

- `shot_01`: selected on first attempt; both factions readable, scale/facing/grounding stable.
- `shot_02` attempt 1: rejected because Alistair's sword rotated horizontally toward Alaric, creating an unintended threatening gesture.
- `shot_02` attempt 2: targeted correction changed the company-side action to restrained observation; selected after identity, equipment, facing, scale, and continuity review.
- `shot_03`: selected on first attempt; balanced dialogue handoff and safe lower-frame area.
- mastering: 4% overscan on shots 2 and 3 removes a narrow provider-reconstructed edge. It does not hide a character/anatomy failure.

Selected mastered shot hashes:

- `shot_01`: `a48d1a9c0e9e960f54f5b93bbbb38b0b1826bc1fe73c29df6e4ce435eeba41e4`
- `shot_02`: `ceb6890aed4b4265e87a0ec05f58c7c36c2c2e725457c8d82df44e6b6297df22`
- `shot_03`: `df5eb2487f800298d54a7f996a6f5b6f4f136132132c202c7cee210909755c95`

Final master:

- path: `public/assets/cinematics/alaric_audience_arrival.mp4`
- SHA-256: `958d5e9a8f6b52a9defb1d3ebfd39af49c71cf84a90c50753b829adf5db82715`
- bytes: 12,955,241
- duration: 12.000 s
- visual QA: PASS for casting, player/Lion representation, identity, facing, scale, grounding, environment, continuity, no text/watermark, safe zone, final frame, narrative purpose, and game-truth safety.

## Camp departure

Semantic target: `node:lion-camp:departure`  
Runtime ID: `camp_departure`  
Spec: `tools/cinematics/specs/cin6a/camp_departure.json`  
Sequence: `cin66_camp_departure`  
Cast: `alistair`, `sage_seraphine`  
Environment: canonical Lion camp road  
Duration: 2 × 6 seconds

| Shot | Attempt | Source SHA-256 | Prompt SHA-256 | Task ID | Tokens | Raw SHA-256 | Decision |
| --- | ---: | --- | --- | --- | ---: | --- | --- |
| `shot_01` | 1 | `0fb3f094b7f8ff41e9ee122bb9bb7dad7f747e744aa129a75213c04e80196a40` | `f84c00a37bbacb3020c335cddd6e88875da3fed8d66ae09638297041645102c3` | `439426266583236` | 325,488 | `d98e1f0f91bd9cbe0c07d73876770df654d63196f4fdbca25a387abb2a37a630` | SELECTED |
| `shot_02` | 1 | `83d68c24900b3122dc9a62959479bd9d2c8b1c81bf4d67967b756a07a0da7107` | `64ffbe517d80593464ec918c4ea99ddf438e51842599e86109c8ff66414d3ae1` | `439453864632564` | 325,488 | `9743e1ac84806645d2d2cd6e2906fc75ea1df0fa33a01e3a5453a4f279d88f67` | SELECTED |

Shot decisions:

- `shot_01`: selected on first attempt; wide departure geography with restrained character motion and visible environmental life.
- `shot_02`: selected on first attempt; short step/stance transition, root motion below 4%, credible foot contact, locked camera distance, and no long cross-frame glide.
- mastering: matched 4% overscan on both shots removes provider edge falloff while keeping their optical scale consistent.

Selected mastered shot hashes:

- `shot_01`: `24bef4a30d49c250038db58c567e6b8bcf45887309f12e54ef124f1be833b16f`
- `shot_02`: `5bb7d631c7c4c2c5eb520f957abd8c8496865b3a25f3dbb1ac2bbb72045934b6`

Final master:

- path: `public/assets/cinematics/camp_departure.mp4`
- SHA-256: `fedff433adaa69d15f10b40bd5ae8be0a52fd3f3eeabf35db6a035e25f1af279`
- bytes: 8,751,383
- duration: 12.000 s
- visual QA: PASS for no sliding, foot contact, gait/root-motion match, identity, facing, cross-shot scale, ground alignment, environment motion, parallax, world integration, safe zone, final frame, narrative purpose, and game-truth safety.

## Promotion and storage

Only the five selected mastered shots were assembled into the two production replacements. Rejected raw candidates, provider metadata, extracted review frames, contact sheets, intermediate masters, and baseline copies remain under ignored `tmp/cinematics/` paths. The manifest ID set stayed unchanged; only Audience duration changed from 9,000 ms to 12,000 ms.
