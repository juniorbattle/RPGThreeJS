# CIN-4 Shot, Staging, and Continuity Pipeline

## Baseline and verified starting state

- Required baseline: `a3ab98adcd89c0cc37ef4c5bafbda35743294251`.
- Local `HEAD`, `origin/main`, and the required baseline matched before edits; the worktree was clean.
- CIN-3 production media, deterministic source frames, direct MiniMax H3 client, mastering tools, registry, triggers, player, and QA scenarios were present.
- The prior `lion_judgement.mp4` was 8.000s, H.264 High/yuv420p, 1920x1080, 24fps, silent, and SHA-256 `f69799dde632b36c755a79b3747dbf5805fbdc187230a4a7e9aa8435d76c49f4`.
- Existing `beforeDialogue: lion_finale_judgement -> lion_judgement` and combat triggers were verified. The Journey production map remained empty.

## Production language

The canonical character root is `public/assets/characters/pixel/full/`. Every canonical master faces `SCREEN_RIGHT`. `compose_shot.py` opens an asset read-only, converts it to a new RGBA image, preserves a copy for `SCREEN_RIGHT`, or mirrors that copy with Pillow `Image.Transpose.FLIP_LEFT_RIGHT` for `SCREEN_LEFT`. Mirroring happens before alpha trim and deterministic scaling. The compositor records the canonical asset hash and never writes to the canonical path.

The structured staging contract is stored in `tools/cinematics/specs/lion_judgement_v2.json`, not buried in prompts. Each character declares:

- normalized `position.x` and `position.groundY`;
- `heightPx`;
- integer `depth`, composited back-to-front with stable ID fallback;
- `facing`, `lookTarget`, `role`, `action`, and `mirrorPolicy`.

`lookTarget` accepts stable character references (`CHARACTER:<id>`), camera/player/offscreen targets, and named environment or event focuses. Missing and self-referential character targets fail validation.

Actions are an allow-list with `SAFE` or `MODERATE` risk. Safe examples are stand, breathing, observation, small head turns, and small reactions. Moderate examples include a slow walk, step, partial weapon movement, frame entry/exit, or a ready stance. Unlisted actions fail before generation.

The camera grammar is likewise an allow-list: static, wide hold, slow push/pull, small pan/track, left/right subject focus, and close focus. Large or orbiting camera moves are excluded by validation and prompt constraints.

Tiers are `MICRO`, `JOURNEY`, and `HERO`; this pilot is `HERO`. Source continuity modes are `ROOT_SOURCE`, `CUT_SOURCE`, and `CHAIN_SOURCE`. Editorial exits are `DELIBERATE_CUT`, `LAST_FRAME`, and `END`. Continuous generation is expressed by a `CHAIN_SOURCE` that depends on the immediately preceding `LAST_FRAME`; otherwise the assembler makes a deliberate hard cut.

The screen-direction policy keeps character sides and explicit facing stable, forbids 180-degree body turns, axis crossings, side swaps, and camera orbits, and repeats those constraints in every generated prompt.

## Reusable tooling

| Tool | Responsibility |
| --- | --- |
| `tools/cinematics/cin4_shot_spec.mjs` | Schema rules, enums, source resolution, and data-driven H3 prompt construction. |
| `tools/cinematics/validate_shot_spec.mjs` | CLI validation of shot count, assets, staging, actions, camera, tier, continuity, and optional source existence. |
| `tools/cinematics/compose_shot.py` | General deterministic 1920x1080 ROOT/CUT compositor with canonical facing, depth, scale, placement, shadows, restrained grading, metadata, and contact sheets. |
| `tools/cinematics/minimax_h3_generate.mjs` | Existing direct MiniMax H3 client extended with CIN-4 specs, per-shot roots, maximum-three-attempt guard, and CHAIN_SOURCE hash proof. CIN-3 behavior is preserved. |
| `tools/cinematics/master_shot.mjs` | Per-shot 1920x1080/24fps silent H.264 High/yuv420p normalization to the exact spec duration. |
| `tools/cinematics/extract_cin4_review_frames.mjs` | Exact decoded first/25/50/75/last indexed review frames and hashes. |
| `tools/cinematics/extract_last_frame.mjs` | Exact final decoded frame extraction, index/timestamp/hash metadata, 1920x1080 check, and nonblack/nonblank pixel analysis. |
| `tools/cinematics/assemble_sequence.mjs` | Ordered three-master assembly, two hard cuts, exact 17s output, technical validation, seam analysis, and SHA provenance. |
| `tools/cinematics/validate_cin4_media.mjs` | Raw, master, and sequence stream validation plus final-frame statistics. |
| `tools/cinematics/extract_sequence_review.mjs` | Candidate/baseline timeline review sampling. |
| `tools/cinematics/make_review_contact_sheet.py` | Offline side-by-side comparison contact sheet. |

All raw outputs, reviewed frames, chain PNGs, ffmpeg intermediates, and contact sheets remain under ignored `tmp/cinematics/cin4/`.

## Lion Judgement V2 shot plan and generation

The HERO sequence contains exactly three shots totaling 17 seconds.

| Shot | Source | Facing and look | Action | Camera | Duration | Attempts | Result |
| --- | --- | --- | --- | --- | ---: | ---: | --- |
| `shot_01` | ROOT `source.png` | Alaric RIGHT looks to Champion; Champion LEFT looks to Alaric | static tableau, breathing/atmosphere only | `WIDE_HOLD` | 5s | 2 | Attempt 1 rejected for a large overhead sword lift; tightened attempt 2 approved. |
| `shot_02` | CUT `source.png` | Same opposing eye-line and sides | one restrained Alaric half-step/settle; small Champion reaction | `TRACK_SMALL_RIGHT` | 6s | 1 | Approved. |
| `shot_03` | CHAIN from Shot 2 exact last frame | Same sides/facing; Alaric primary | tiny Alaric head movement, then still | `SUBJECT_FOCUS_LEFT` | 6s | 1 | Approved. |

Offline source hashes:

- Shot 1: `057c441fa353f77631983a455c2cf47723d7f920404495c5a2f77c43964de025`.
- Shot 2: `d422dff62d879c8b474d6e710eb2fac5716fde07c917764561b0e08fd936e170`.
- Shared Lion hall environment: `77088b92c3bbb74e94e94f7cc9bade8ebbb9823e9bf434ac8b9f5a2752f166c0`.

Shot 2 final-frame evidence:

- decoded frame `143 / 144`, timestamp `5.958333s`;
- 1920x1080, luminance statistics nonblack/nonblank;
- PNG SHA-256 `f5ac150eb5918352369b5994b53ee00d4a83c39799c95d9bc0c33bf359f00896`.

Shot 3 generation metadata names `shot_02`, frame index 143, and that same SHA as both `chainSourceProof.outputSha256` and `sourceSha256`. This is proof that Shot 3 used the exact extracted, reviewed Shot 2 final frame rather than a recomposed approximation.

## Visual QA and drift control

Every selected master was reviewed at exact first/25/50/75/last decoded frames. Both character identities, armor palettes, weapons, proportions, opposing facing, screen sides, eye-lines, environment identity, and nonverdict tone remain readable. Shot 1 attempt 1 was retained in ignored storage and rejected before another submission; attempt 2 addressed the specific sword-motion defect. No shot exceeded the three-attempt limit.

The approved Shot 2 to Shot 3 boundary has mean absolute RGB difference `5.2479` and changed-channel fraction `0.131147`, below the chain threshold of 12. The Shot 1 to Shot 2 boundary is intentionally editorial (`28.4321` mean absolute RGB difference). Both sides of both cuts are nonblack and nonblank.

## Assembly and promotion

The assembled candidate is:

- `tmp/cinematics/cin4/lion_judgement_v2/lion_judgement_v2_candidate.mp4`;
- SHA-256 `6ea5b12bb8c97deadbea2177725d7e3eb958ab7971361d34064729acf776e5f9`;
- 21,565,194 bytes;
- H.264 High, yuv420p, 1920x1080, 24fps, 17.000s, silent, rotation 0, faststart;
- order `shot_01 -> shot_02 -> shot_03`, with two hard cuts.

The CIN-3 baseline used one dark 8-second composition and reduced the Champion to a small crouched silhouette. The CIN-4 sequence keeps both identities readable, provides a real wide/medium/focus progression, preserves confrontation geography, and creates a stronger dialogue handoff. `CIN4_V2_CLEARLY_BETTER_THAN_CIN3` is therefore `YES`.

Only `public/assets/cinematics/lion_judgement.mp4` was promoted, with the same SHA as the assembled candidate. Its manifest duration changed from 8,000ms to 17,000ms. `serpent_general_reveal.mp4` and `lion_champion_reveal.mp4` were not regenerated or changed. The old Lion master remains copied in ignored QA storage and is also recoverable from Git.

## Chromium integration QA

Real Chrome loaded `?qa=1&cinematic=1` and the production registry. The first held run exposed a QA-only 12-second legacy timeout; production duration resolution was already descriptor-driven, but the isolated real-hold scenario could not reach a 17-second natural end. `GameApp.ts` now gives that QA probe a 22-second ceiling.

The clean rerun proved:

- one 1920x1080 video, duration exactly 17s, ready state 4, no media error;
- natural `ended`, `played=true`;
- decoded final-frame canvas 640x360 with luminance `0/44/252` and visible Alaric/Champion imagery;
- Release returns `résidu DOM 0`;
- real skip removes the only video/overlay and opens `lion_finale_judgement` at Chef Alaric;
- reduced motion bypasses video into the same dialogue;
- missing-media fallback reaches the same dialogue with no stuck overlay;
- a separate non-skip 17-second run naturally opens the dialogue;
- Chrome console warning/error log is empty.

The browser capture backend renders the accelerated video plane black during playback, so content identity was reviewed from exact offline decoded frames; the runtime-created final canvas provided the in-browser decoded-frame visual proof.

## Automated validation

- Focused compositor: 3/3 Python tests.
- Focused CIN-4/cinematic suite: 12 files, 121/121 Vitest tests.
- Focused combined: 13 files, 124 assertions.
- Full project: 86 files, 1,939/1,939 Vitest tests.
- TypeScript: `npx tsc --noEmit` PASS.
- Production build: PASS (109 modules transformed); existing large-chunk advisory only.
- Every selected shot master, the assembly, and promoted production file pass ffprobe/media validation.

## Scope and ownership

Game truth, Lion narrative resolution, saves, combat, Journey production mapping, and production triggers are unchanged. Runtime still consumes one final MP4 through the existing registry/player; no runtime AI or runtime multi-shot orchestration was added. The only runtime-adjacent code change is the development-only real-hold QA timeout needed to validate the longer promoted file.

Known limitations:

- H3 motion is generative and not reproducible byte-for-byte; accepted artifacts and all inputs are hash-locked.
- Automated frame/seam checks cannot replace human identity, motion, and continuity review.
- The browser host cannot screenshot the accelerated video plane during playback; exact offline review frames plus the browser-decoded final canvas cover visual verification.
- This is one HERO pilot, not a campaign-wide tier census or production rollout.

Recommendations for CIN-5:

- Inventory campaign cinematics into MICRO/JOURNEY/HERO tiers before any mass generation.
- Reuse the structured spec, compositor, action/camera allow-lists, and per-shot approval gates.
- Keep Journey production mapping empty until every selected asset passes scene-local visual and browser QA.
- Add tiny checked-in synthetic media fixtures if CI-level ffmpeg execution becomes desirable.

No commit and no push were performed.
