# CIN-3 pilot cinematic production and integration

Date: 2026-09-04  
Status: READY for CIN-4  
Baseline: `dfef3887b06f35a0ec5c189487ed22e92bac07cc`

## 1. Baseline and pre-flight

`main`, local `HEAD`, and `origin/main` were all exactly the required baseline after `git fetch origin main`; the worktree was clean before implementation. `.env.local` existed at the repository root, was ignored, was not tracked, and contained a non-empty `MINIMAX_API_KEY` without its value being printed. CIN-1 runtime, CIN-2 bridge, TravelView default, empty Journey production map, placeholder-only starting manifest, empty starting trigger registry, canonical full-character directory, and the two existing 1920x1080 RGB source frames were verified before editing.

Required canonical files were present: `alaric.png`, `lion_champion.png`, and `serpent_general_boss.png`. No missing prerequisite blocked production.

The host had no `ffmpeg` or `ffprobe` on `PATH`. An ignored development-only toolchain was installed under `tmp/cinematics/toolchain/`: FFmpeg `6.0-essentials_build-www.gyan.dev` and ffprobe `4.0.2`. No package manifest or lockfile changed.

## 2. Current MiniMax contract and secret handling

The current official MiniMax contract was checked before spending balance: bearer authentication at `https://api.minimax.io`, create via `POST /v2/video_generation`, async query via `GET /v2/query/video_generation/{task_id}`, and `MiniMax-H3` first-frame image-to-video at 768P or 2K for 4–15 seconds. The create schema permits a lowercase base64 data URL in `image_url.url`. References: [MiniMax create API](https://platform.minimax.io/docs/api-reference/video-generation-v2-create) and [MiniMax query API](https://platform.minimax.io/docs/api-reference/video-generation-v2-query).

`tools/cinematics/minimax_h3_generate.mjs` discovers the repository root, parses only `MINIMAX_API_KEY` from `.env.local`, redacts errors, whitelists the three CIN-3 IDs, validates source size/dimensions, refuses overwrite, submits direct first-frame I2V, polls every 10 seconds with a finite timeout, handles HTTP/rate-limit/task failures, downloads through a temporary partial file, and writes only safe metadata under ignored `tmp/cinematics/cin3/`. It never serializes the key, authorization header, data URL, or signed download URL. There is no provider SDK or runtime/browser generation path.

## 3. Source construction and validation

`tools/cinematics/prepare_v11b_p1_sources.py` now reproducibly creates `lion_champion_reveal_source.png` from the canonical Lion sanctum and `public/assets/characters/pixel/full/lion_champion.png`, adding deterministic halo, mist, warmth, and vignette treatment without repainting the source character. Repeated generation produced the same SHA-256.

All source frames passed the updated PNG validator:

| Cinematic | Canonical characters | Environment | Size | SHA-256 |
|---|---|---|---:|---|
| `lion_judgement` | `alaric.png`, `lion_champion.png` | `generated/lion-phase/dialogue/lion_finale_judgement.webp` | 2,001,327 | `5b8324ff338d6f06bc9eb2a3dc0c5e20d56100a0339749c43fa6998026790c01` |
| `serpent_general_reveal` | `serpent_general_boss.png` | `generated/lion-phase/combat/lion_sanctum.webp` | 2,876,540 | `ce1e6aabfafca830a198b0314ecb8ea6676574242f15c6947117b690af469c44` |
| `lion_champion_reveal` | `lion_champion.png` | `generated/lion-phase/combat/lion_sanctum.webp` | 3,025,298 | `e2739c151a772fbe5ac033f8583b0197000e49f8a9174fcecd808fa84391148a` |

Each is an opaque RGB PNG at 1920x1080 and 16:9. Source compositions contain no UI, subtitle, text overlay, or watermark.

## 4. Locked production sequence and attempts

The sequence was strictly serial:

1. Lion Judgement tooling, source validation, attempt 1, technical/visual review, mastering, real Chromium decode, natural end, held final-frame observation, and cleanup all passed.
2. Only then was Serpent General attempt 1 submitted, reviewed, mastered, validated, and integrated.
3. Only then was Lion Champion attempt 1 submitted, reviewed, mastered, validated, and integrated.

Exactly three paid API tasks were created, one per pilot. All first candidates passed identity review; no retry was made. Task IDs and safe usage are recorded in `cin-3-video-generation-log.md`.

## 5. Character and visual review

For every pilot, first/25/50/75/last candidate frames were extracted to ignored storage and compared against the deterministic first frame and canonical full-character art. Face/head, hair or helmet, armour, clothing, cape/scarf/tabard, weapon, dominant palette, silhouette, proportions, and faction identity passed wherever applicable. The sequences favor identity-safe push-ins, subtle light/mist/dust, and nearly static character motion. There were no duplicate limbs/weapons, photoreal conversion, significant costume drift, added characters, text, UI, subtitle, watermark, blank end, or corrupt final frame.

The source-to-first-frame transition remained close for all three. Their final frames were stable enough for dialogue/combat transitions without an appended hold.

## 6. Mastering and final media

The reusable masterer fits/pads with Lanczos to 1920x1080, forces square pixels and 24 fps, encodes H.264 High/yuv420p at CRF 18, removes audio and metadata, uses a 48-frame GOP, and writes fast-start MP4. It accepts at most a 0.6-second appended clone hold, but all three used `0` because their natural ending was stable.

| Cinematic | Bytes | Duration | Video | Audio | Rotation | SHA-256 |
|---|---:|---:|---|---|---:|---|
| `lion_judgement` | 7,212,782 | 8.0s | H.264 High, yuv420p, 1920x1080, 24 fps | none | 0 | `f69799dde632b36c755a79b3747dbf5805fbdc187230a4a7e9aa8435d76c49f4` |
| `serpent_general_reveal` | 9,331,600 | 8.0s | H.264 High, yuv420p, 1920x1080, 24 fps | none | 0 | `e8c918d292693e4bc7f612fc6f4fbcdb283c6d2f8095c805db287692e561a682` |
| `lion_champion_reveal` | 10,692,772 | 8.0s | H.264 High, yuv420p, 1920x1080, 24 fps | none | 0 | `2d581e76e5cc0a37d4633fd6d7166210780da55475f54abadfd90aedaf30b04c` |

All three strict final-media validations passed. Raw candidates had AAC streams, which were removed by policy. Shipped clips therefore contain no speech or other audio; default muted behavior was preserved and mute/unmute is not applicable.

## 7. Manifest and deterministic triggers

The production manifest now contains exactly four descriptors: the retained `qa-placeholder` plus the three real local MP4s. Every real descriptor points to its local production MP4 and deterministic source poster and is not a placeholder.

The production trigger whitelist is exactly:

```text
beforeDialogue:
  lion_finale_judgement -> lion_judgement

beforeCombat:
  serpent_captain -> serpent_general_reveal
  lion_chief -> lion_champion_reveal

afterCombat: EMPTY
chapterBeat: EMPTY
```

The registry and nested maps remain frozen. Trigger resolution is presentation-only and does not mutate `GameState`; V6 save shape remains unchanged. `JOURNEY_PRESENTATION_MAP` remains empty, TravelView remains the normal production presentation, and `?journey=cinematic` remains the DEV selector.

The manifest fetch now uses `cache: 'no-cache'` because the manifest URL is stable across releases. This fixed a real Chromium case where `force-cache` retained the pre-CIN-3 placeholder-only manifest after a deploy/update.

## 8. Real Chromium QA

QA used the real local Vite app and real production MP4s in Chromium, not synthetic ended events.

- Lion Judgement decoded at 1920x1080 with `readyState=4`, no media error, and natural `ended=true` at `currentTime=duration=8`.
- `playHeld()` kept the ended/paused video and overlay mounted. A DEV-only 640x360 canvas sampled the actual Chromium-decoded final frame because automation screenshots omit hardware video layers. The sample visibly showed Alaric and the Lion Champion and measured luminance min/mean/max `0/36/246`, proving it was neither black nor blank.
- The frame stayed held for more than two seconds. Continue/Release removed the overlay, video, diagnostic canvas, listeners/resources, and DOM residue; all counts were zero.
- Natural Lion playback opened the actual `lion_finale_judgement` DialogueView exactly once.
- Skip on Lion opened that same dialogue; Skip on Serpent and Lion Champion opened the exact `serpent_captain` and `lion_chief` tactical deployment screens.
- Natural Serpent and Lion Champion playback each opened their actual tactical deployment screen with the correct objective and no remaining cinematic DOM.
- Reduced-motion bypass opened Lion judgement dialogue and Serpent combat without video or deadlock.
- A controlled unknown-media interlude resolved unavailable and still opened the actual Lion judgement DialogueView.
- Normal launch/Continue displayed TravelView. `?journey=cinematic` mounted one Journey overlay and one Journey surface with no TravelView.
- New Chromium console errors: 0. New warnings: 0.

The production players use no browser-native controls. Skip and mute affordances remained readable. Offline frame inspection plus actual Chromium decode found no accidental crop/stretch, black/white flash, blank ending, or bad source-poster transition.

## 9. Automated validation

- Focused CIN-3/CIN-2/narrative suites: 10 files, 101 tests passed.
- Full suite: 84 files, 1,920 tests passed.
- Typecheck: `npx tsc --noEmit` PASS.
- Production build: `npm run build` PASS; 109 modules transformed. The existing Rollup large-chunk advisory remains non-blocking.
- Three source-frame validations: PASS.
- Three strict final-media validations: PASS.
- `git diff --check`: PASS.

Tests cover the exact trigger whitelist, no extra lifecycle mappings, real production manifest and on-disk media, non-placeholder descriptors, immutable resolution with unchanged V6 state, unknown-ID fallback, player play/held regressions, Journey regressions, CIN-2 bridge regression, and downstream continuation after ended/skipped/reduced/unavailable/error interludes.

## 10. Scope, files, and audits

Gameplay truth and content were not changed: `runSystem.ts`, campaign topology, adaptive route logic, Conduct, reputation, Lion finale semantics, dialogue content/choices/effects, combat configs/outcomes/balance/rewards, skills, damage, combat AI, CombatStage, CasterMotion, VFX, and save schema are untouched. The only `GameApp.ts` changes are DEV QA controls and the DEV combat-QA cinematic prelude. No runtime AI, API key, provider request, provider SDK, token cost, or generation latency was introduced.

Tracked source/doc changes:

- `src/cinematics/CinematicRegistry.ts`
- `src/cinematics/CinematicRegistry.test.ts`
- `src/cinematics/CinematicTriggers.ts`
- `src/cinematics/CinematicTriggers.test.ts`
- `src/game/GameApp.ts`
- `src/game/cin2CampaignBridge.test.ts`
- `src/ui/SceneTransition.test.ts`
- `public/assets/cinematics/manifest.json`
- `public/assets/cinematics/source/README.md`
- `tools/cinematics/prepare_v11b_p1_sources.py`
- `tools/cinematics/validate_v11b_p1.py`
- `tools/cinematics/cin3_config.mjs`
- `tools/cinematics/ffmpeg_tools.mjs`
- `tools/cinematics/minimax_h3_generate.mjs`
- `tools/cinematics/master_cin3_video.mjs`
- `tools/cinematics/validate_cin3_media.mjs`
- `tools/cinematics/extract_review_frames.mjs`
- `docs/reports/cin-3-video-generation-log.md`
- `docs/reports/cin-3-pilot-production-integration.md`

Binary additions:

- `public/assets/cinematics/source/lion_champion_reveal_source.png`
- `public/assets/cinematics/lion_judgement.mp4`
- `public/assets/cinematics/serpent_general_reveal.mp4`
- `public/assets/cinematics/lion_champion_reveal.mp4`

Ignored raw candidates, task metadata, review frames, and FFmpeg tools remain under `tmp/cinematics/`. `.env.local` remains ignored and untracked. The actual key, authorization header, raw candidates, review frames, provider URLs/responses, and temp outputs do not appear in tracked changes.

## 11. Known limitations and CIN-4 deferral

- The API did not return a direct monetary cost; safe usage units are recorded instead.
- Raw provider AAC content was not promoted or semantically classified; it was intentionally discarded. The shipped files are verifiably silent.
- Chromium automation screenshots omit hardware-composited video, so final-frame visual proof uses the real decoded-frame canvas sample while DOM/video properties independently prove the video remained mounted and ended.

Deferred to CIN-4: automated last-frame chaining/source extraction for subsequent cinematics, broader production-pipeline orchestration, and any additional cinematic production. No CIN-4/CIN-5/CIN-6/CIN-7 work was started.

No commit was created and nothing was pushed.
