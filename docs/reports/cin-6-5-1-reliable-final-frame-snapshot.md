# CIN-6.5.1 — Reliable Live Canvas and Final-Frame Snapshot Hold

## Baseline and scope

- Repository: `juniorbattle/RPGThreeJS`
- Branch: `main`
- Required and verified baseline: `6efd54dbbf385aed8c004ece6a5411d01088e55b`
- `HEAD == origin/main`: PASS
- Initial worktree: clean
- Production cinematic manifest: 21 unique IDs, unchanged
- Media generation: none
- MiniMax attempts: 0
- Commit/push: no/no

This is a runtime presentation correction only. No MP4, cinematic identity, dialogue content, route topology, campaign truth, save schema, or combat runtime was changed.

## Confirmed human defects

The operator's normal-browser results are authoritative:

1. the original baseline could play a video, receive normal media lifecycle events, and mount cinematic-mode dialogue, yet show black behind the dialogue after natural completion;
2. the first CIN-6.5.1 correction made the final held canvas visible, but the live `<video>` playback plane itself could still remain black in a normal browser.

The old freeze implementation retained and paused the ended `<video>`. Its `renderedFrame` flag was set by `loadeddata`, `playing`, `timeupdate`, or `ended`. Those events prove media lifecycle progress; they do not prove that the browser will continue compositing a usable decoded frame after the video ends. The old criterion was therefore `RENDER_EVENT_OCCURRED`, not `USABLE_FREEZE_SURFACE`.

The addendum defect showed that end-only canvas capture was insufficient. Decoding and `drawImage()` were healthy, but direct browser compositing of the accelerated video plane was not reliable. The correction therefore makes one overlay-owned canvas authoritative for both moving presentation and the subsequent frozen hold.

## Architecture

Original baseline:

```text
VIDEO -> PAUSE ENDED VIDEO -> DIALOGUE / AGENCY -> RELEASE
```

First CIN-6.5.1 pass:

```text
VIDEO -> END -> DRAW FINAL DECODED FRAME TO OWNED CANVAS
      -> DIALOGUE OR AGENCY ABOVE CANVAS -> RELEASE
```

Final addendum architecture:

```text
VIDEO DECODER / CLOCK / AUDIO
        -> requestVideoFrameCallback (preferred) / requestAnimationFrame (fallback)
        -> ONE OWNED LIVE CANVAS
        -> STOP FRAME PUMP AT END OR SKIP
        -> SAME CANVAS FROZEN
        -> DIALOGUE OR AGENCY
        -> RELEASE AND ZERO CANVAS BUFFER
```

`CinematicOverlay` owns one `canvas.cinematic-overlay__freeze-frame` for its entire lifecycle. It starts hidden with a zero-sized backing buffer. `CinematicPlayer` starts the frame pump before loading/playing. Chromium's `requestVideoFrameCallback()` is preferred because it follows decoded frame delivery; `requestAnimationFrame()` is the defensive fallback when the paired request/cancel API is unavailable. Each delivered frame is drawn into the same intrinsic-resolution canvas. After the first successful draw, the canvas becomes the visible presentation surface and the video remains alive, unhidden, muted/unmuted by the existing control, and opacity-zero as decoder/clock/audio source.

Freeze draws the latest available frame synchronously, cancels the pending frame callback, pauses the decoder video, and retains that same canvas. Capture requires positive intrinsic dimensions and `readyState >= HAVE_CURRENT_DATA` (numeric value 2). The canvas backing resolution comes from `video.videoWidth` and `video.videoHeight`.

No data URL, image encoding, retry loop, detached per-frame canvas, or second cinematic runtime was introduced.

## Freeze selection and failure behavior

The visual hierarchy is now:

1. decoded canvas snapshot when `drawImage` succeeds;
2. descriptor poster when present;
3. existing text fallback.

Null 2D contexts, invalid decoded dimensions/readiness, and `drawImage` exceptions fall through without blocking. `CinematicPlayer` permits decoded-video snapshotting only for `ended` and `skipped`; timeout, error, abort, unavailable, placeholder, and autoplay-rejected results are forced through the poster/text hierarchy so stale dimensions cannot make a broken media surface appear healthy.

Natural completion stops on the final decoded canvas frame. Skip stops on the current decoded canvas frame and never seeks to the end. Reduced-motion bypass does not fabricate a canvas and continues through the existing safe classic/neutral presentation.

## Visual, layering, and accessibility contract

- Video and canvas both use absolute fullscreen placement, `z-index: 1`, `width/height: 100%`, and `object-fit: cover`; the first successful frame draw changes visual ownership without changing the crop contract.
- Active playback never sets the decoder video to `display:none` or `hidden=true`; the decoder class uses only `opacity:0` and `pointer-events:none` after the canvas is live.
- The existing cinematic grading/vignette remains above them at `z-index: 2`.
- Cinematic-mode dialogue remains transparent at its existing `z-index: 9200`, above the `z-index: 9100` cinematic surface.
- The canvas is `aria-hidden="true"` and `pointer-events: none`.
- After freeze, the cinematic container remains `role="presentation"`, `aria-hidden="true"`, and `inert`, with no modal ownership or focusable controls.
- Dialogue or Journey agency remains the single `aria-modal="true"` owner.
- The existing `presentCinematicDialogue()` ownership chain remains `playHeld() -> openHeldDialogue() -> finally release()`.

The DEV real-hold fixture now measures the authoritative freeze canvas itself rather than creating a separate sample from the ended video. Its manual Release control is a sibling above the inert surface, so the QA affordance is usable without weakening production accessibility semantics.

## Cleanup and memory handling

`release()`/`dispose()` cancels any pending video-frame or animation-frame callback, pauses and clears the video, removes media children, calls `load()` defensively, hides the live/freeze canvas, sets its backing `width` and `height` to zero, removes the overlay, and restores the prior connected focus target. Browser checks observed zero cinematic, video, canvas, Journey, and dialogue residue after completion/release.

## Real Chromium live playback and temporal-motion QA

The addendum was exercised with the real production MP4s at 1920×1080. The browser sampled the authoritative canvas at approximately 25%, 50%, and 75% of playback, computed independent luminance statistics and a deterministic pixel fingerprint, and then compared the same canvas at natural completion. Both videos used `requestVideoFrameCallback`; the video element stayed decoded and playing with `hidden=false` and computed `opacity=0`, while exactly one visible 1920×1080 canvas carried the moving picture.

### Camp departure — live playback

| Sample | `currentTime` | Mean luminance | Variance | Pixel fingerprint |
| --- | ---: | ---: | ---: | --- |
| 25% | 3.126558 s | 73.0023 | 2895.9957 | `bb27dce3` |
| 50% | 6.117814 s | 70.8730 | 2765.7229 | `43664072` |
| 75% | 9.110839 s | 71.4645 | 2730.5170 | `622dab61` |
| natural end | 12.000000 s | 71.4514 | 2724.1441 | `c323e7bb` |

All live samples had min/max `0/255`, `paused=false`, `ended=false`, `framePump="video-frame"`, `visualSurface="canvas"`, and one owned canvas. The distinct fingerprints prove temporal change rather than a static poster. At natural end the frame pump was `stopped`, `freezeSurface="canvas"`, and object identity proved the held canvas was the same canvas used during playback.

A normal attached Chrome screenshot at approximately 5.2 seconds visibly showed the moving camp scene and cinematic controls. The playback surface was not black.

### Alaric audience — live playback into held dialogue

| Sample | `currentTime` | Mean luminance | Variance | Pixel fingerprint |
| --- | ---: | ---: | ---: | --- |
| 25% | 2.349264 s | 38.6863 | 1391.9086 | `1e895868` |
| 50% | 4.595166 s | 40.6270 | 1720.0194 | `78053734` |
| 75% | 6.846266 s | 46.1518 | 1770.8148 | `7e313a25` |
| natural end | 9.000000 s | 46.6028 | 1780.0131 | `aaac915b` |

All live samples used the same one-canvas, decoder-video, and frame-pump contract as camp departure. A normal attached Chrome screenshot at approximately 4.6 seconds visibly showed the live Alaric/Lion tent scene with the existing controls. After natural end, another normal Chrome screenshot visibly showed that same owned canvas frozen behind the interactive `lion_briefing` dialogue. Modal count was one and console errors were zero.

Results:

- `REAL_LIVE_VIDEO_VISIBILITY: PASS`
- `REAL_LIVE_CANVAS_MOTION: PASS`
- `REAL_FINAL_FRAME_HOLD: PASS`
- `LIVE_CONTROLS_PRESERVED: PASS`
- `SAME_CANVAS_LIVE_TO_HOLD: PASS`

| Required pilot gate | `camp_departure` | `alaric_audience_arrival` |
| --- | --- | --- |
| `PLAYING_CANVAS_VISIBLE` | PASS | PASS |
| `PLAYING_CANVAS_NON_BLACK` | PASS | PASS |
| `FRAME_UPDATES_OVER_TIME` | PASS | PASS |
| `NATURAL_END` | PASS | PASS |
| `FREEZE_SAME_CANVAS` | PASS | PASS |
| `DIALOGUE/AGENCY_VISIBLE` | PASS — real Journey Continue agency | PASS — `lion_briefing` |
| `CLEANUP` | PASS | PASS |

The canvas and video share the exact existing fullscreen `object-fit: cover` contract. Visual ownership changes at the first decoded frame without reallocating or replacing the canvas, and that canvas continues into freeze, so no video-to-canvas crop or scale switch occurs. The normal-Chrome observations found no black intermediary or surface flash.

The actual Journey opening route was rerun after the addendum change. At camp settlement, the same 1920×1080 canvas was visible with `freezeSurface="canvas"`, the frame pump was stopped, the real Journey Continue agency was mounted, and modal count was one. Continuing led to the Alaric held-dialogue pilot; that surface was passive/inert beneath the transparent dialogue, then both surfaces cleaned up with no console errors.

## Real Chromium pixel QA

### Alaric audience — mandatory natural end

Executed through the actual local Journey campaign at 1920×1080:

```text
alaric_audience_arrival
-> natural end
-> owned canvas snapshot
-> lion_briefing DialogueView above canvas
-> complete dialogue
-> release
```

Settled media and canvas evidence:

| Metric | Result |
| --- | ---: |
| video dimensions | 1920 × 1080 |
| duration | 9.000 s |
| currentTime | 9.000 s |
| video state | ended=true, paused=true, readyState=4 |
| video decoder element | alive; hidden=false, opacity=0 |
| canvas dimensions | 1920 × 1080 |
| canvas visible | yes; display=block, visibility=visible, opacity=1 |
| mean luminance | 46.6028 |
| luminance variance | 1780.0131 |
| sampled min / max | 0 / 252.9852 |
| dark sample fraction | 0.0720 |
| opaque sample fraction | 1.0000 |
| freeze surface marker | `canvas` |
| frame pump after end | `stopped` |
| same live/held canvas | yes |
| dialogue visible | yes |
| modal owners | 1 |
| regular portrait count | 0 |
| painted dialogue backdrop | hidden |
| console errors | 0 |
| residue after dialogue | dialogue=0, cinematic=0, canvas=0 |

The robust luminance, variance, range, and opacity gates prove that the held canvas is non-blank, non-uniform, and non-black. A normal attached Chrome screenshot visibly contained the Alaric final frame underneath the readable dialogue instead of a black accelerated-video plane.

### Real skip snapshot

The isolated Journey QA scenario used the real local `forest_journey_tension.mp4`, waited for a decoded frame, pressed **Passer** at `currentTime=0.257461 s` (duration `9 s`), and presented real Journey agency over the current-frame canvas.

| Metric | Result |
| --- | ---: |
| canvas dimensions | 1920 × 1080 |
| mean luminance | 62.6516 |
| luminance variance | 1873.0243 |
| sampled min / max | 1.0630 / 248.5360 |
| opaque sample fraction | 1.0000 |
| video state | paused, hidden=false, opacity=0 before natural end |
| modal owners | 1 |
| residue after route choice | Journey=0, cinematic=0, canvas=0 |
| console errors | 0 |

This proves skip freezes the current decoded frame and does not seek to the ending.

## Pilot results

### Alaric Audience

- Real campaign, natural completion: PASS
- `alaric_audience_arrival -> canvas -> lion_briefing`: PASS
- Canvas remained visible for the full dialogue: PASS
- Single modal, transparent dialogue mode, no duplicate portrait: PASS
- Release and cleanup: PASS

### Bois-Clair choice

- Reached through the actual Journey campaign after the first refuge, reserve trail, Valmir road combat, and Valmir fork.
- `bois_clair_arrival` completed naturally.
- Owned canvas was visible at 1920×1080 with `data-cinematic-freeze-surface="canvas"`.
- `village_choice` dialogue and choices remained interactive above the burning-village final frame.
- The village-defense choice applied through deterministic dialogue; the canvas stayed until the owning dialogue session closed, then was removed before the subsequent narrative/combat seam.
- Modal owners: 1. No duplicate commit or cinematic residue.

Result: `BOIS_CLAIR_DIALOGUE_FREEZE=PASS`.

### Shadow Signs

- The real `shadow_signs.mp4` ran to natural completion in a deterministic selected-dialogue QA fixture backed by the production registry, actual `CinematicPlayer`, `presentCinematicDialogue()`, and `DialogueView` cinematic mode.
- The authoritative canvas was visible at 1920×1080. A preceding real-media hold measurement reported full-frame luminance min/mean/max `0/52/254`.
- A normal Chrome screenshot visibly showed the Shadow Signs final frame behind its real deterministic choice UI rather than black.
- The reviewed mapping remains `shadow_signs -> shadow_signs`. The player selected **Préserver les preuves pour Alaric** through the unchanged dialogue engine; the canvas remained visible through every outcome step.
- Dialogue completion produced zero cinematic/canvas/dialogue/modal residue. No visual or state content changed by the cinematic layer.

Result: `SHADOW_SIGNS_DIALOGUE_FREEZE=PASS`.

### Route fork agency

- Actual refugees fork: the real `refugees_approach` clip ended naturally, the 1920×1080 canvas remained visible beneath two authoritative RunSystem choices, and one route was committed exactly once.
- Actual Valmir fork also presented its real held canvas beneath the two authoritative choices and accepted the selected old-sanctuary route once.
- Route mutex tests remained green; cleanup after choice was zero.

Result: `ROUTE_FORK_FREEZE=PASS`.

## Game-truth and effect safety

The snapshot implementation reads only browser media/presentation state. It does not import or mutate `GameState`, flags, route choices, combat selection, rewards, reputation, finale resolution, or save data. `RunSystem`, dialogue content/effects, combat code, and save schema are unchanged.

The existing CIN-6.5 coordinator/dialogue regressions remained green for:

- step effects once;
- choice effects once;
- `startCombat` once;
- `finishChapter` once;
- one cinematic playback and one dialogue owner;
- reduced-motion/unavailable/error/timeout fallback;
- authoritative route commit mutex and stale-click rejection.

## Validation

### Focused automated tests

```text
12 test files passed
175 tests passed
```

Coverage included `CinematicOverlay`, `CinematicPlayer`, `CinematicDialogueSession`, `JourneySession`, `JourneyCampaignBoundary`, `DialogueView`, CIN-6.5 integration, CIN-6A presentation/integration, CIN-6B production, census, and route mutex.

New/updated assertions cover repeated `requestVideoFrameCallback` draws into one owned canvas, temporal frame-pump rescheduling, `requestAnimationFrame` fallback, cancellation at freeze/dispose, intrinsic dimensions, `drawImage`, visible authoritative canvas, decoder-only video semantics, mute control ownership, poster/text fallback, thrown capture, invalid readiness, natural end, real-frame skip, Journey freeze, timeout safety, cleanup, zeroed backing buffer, and CSS layering/crop rules.

### Full validation

| Gate | Result |
| --- | --- |
| full `npm test` | BLOCKED EXTERNALLY — 98/99 files passed; 2112/2123 tests passed; all 11 failures are in `CasterMotionBackCompat.test.ts` because the concurrently modified VFX registry currently has 0 actions instead of its required 33 |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS — 113 modules transformed |
| `git diff --check` | PASS |
| campaign census validator | PASS — 64 entries; P0 primary 17; P0 ordered incl. reuse 20 |
| pilot shot validators with canonical sources | PASS — Alaric 2/9s; Bois-Clair 4/20s; Shadow 4/20s |
| production media validators | PASS — Alaric, Bois-Clair, Shadow Signs, camp departure |
| browser console errors | 0 |

The production build retained the existing chunk-size advisory; it is unrelated to this change. The full-suite blocker is also outside CIN-6.5.1: `src/combat/vfx/generated/published-vfx-presets.json` is a concurrent, user-owned modification and was deliberately not overwritten, reverted, or partially restored. All 175 focused cinematic/Journey/census tests pass, and the remaining 98 full-suite test files pass.

## Media immutability and secret audit

- No file below `public/assets/cinematics/` changed.
- Manifest remains 21 unique IDs.
- `camp_departure.mp4` SHA-256 remains `5ccf6e4e5156831ab10c992ee4af59a5bc5a28093df690b737a3eed441469463`.
- Alaric/Bois-Clair/Shadow media validators report their existing local H.264 High, yuv420p, 1920×1080, 24fps silent masters as valid.
- No MiniMax call or provider activity occurred.
- No `.env.local`, secret, Authorization header, API key, provider URL, raw candidate, review frame, screenshot, or temporary browser profile is tracked or present in the CIN-6.5.1 diff.

## Human-reproducible verification

1. Start the local app with the normal development command.
2. Open `http://127.0.0.1:5173/?journey=cinematic`.
3. Select **Nouvelle chronique**.
4. Progress through the opening and camp boundary to the Alaric audience.
5. Do not press **Passer** on `alaric_audience_arrival`; let it end naturally.
6. Confirm the final audience frame remains visibly behind the Sage/Alaric `lion_briefing` dialogue.
7. Confirm the dialogue is readable and interactive, there is no regular painted backdrop or duplicate full portrait, and the cinematic disappears when the dialogue completes.

While the held dialogue is visible, this DevTools Console snippet reports the authoritative canvas and video state plus robust sampled luminance:

```js
(() => {
  const canvas = document.querySelector('.cinematic-overlay__freeze-frame');
  const video = document.querySelector('.cinematic-overlay__video');
  if (!(canvas instanceof HTMLCanvasElement) || !(video instanceof HTMLVideoElement)) {
    return { canvasPresent: false, videoPresent: video instanceof HTMLVideoElement };
  }
  const pixels = canvas.getContext('2d', { willReadFrequently: true })
    ?.getImageData(0, 0, canvas.width, canvas.height).data;
  let count = 0, sum = 0, squared = 0, min = 255, max = 0;
  if (pixels) for (let pixel = 0; pixel < canvas.width * canvas.height; pixel += 16) {
    const i = pixel * 4;
    const y = .2126 * pixels[i] + .7152 * pixels[i + 1] + .0722 * pixels[i + 2];
    count += 1; sum += y; squared += y * y; min = Math.min(min, y); max = Math.max(max, y);
  }
  const mean = count ? sum / count : null;
  return {
    canvasPresent: true,
    canvas: { width: canvas.width, height: canvas.height, hidden: canvas.hidden },
    pixels: { mean, variance: count ? squared / count - mean * mean : null, min, max },
    video: {
      videoWidth: video.videoWidth, videoHeight: video.videoHeight,
      currentTime: video.currentTime, duration: video.duration,
      ended: video.ended, paused: video.paused, hidden: video.hidden,
      readyState: video.readyState,
    },
    freezeSurface: document.querySelector('.cinematic-overlay')?.dataset.cinematicFreezeSurface,
  };
})()
```

Expected: canvas `1920×1080`, `hidden=false`, mean materially above zero, variance materially above zero, `freezeSurface="canvas"`, and video ended/paused with `hidden=false`, `opacity=0`, and the frame pump stopped.

## Known limitations

- No pixel-for-pixel browser-versus-FFmpeg similarity score was added. Real Chromium temporal hashes and luminance/variance gates, offline final-frame media checks, and normal-Chrome live/frozen visual screenshots provide robust evidence without a brittle color-conversion threshold.
- The production build's pre-existing large-chunk advisory remains.
- The concurrent VFX publication file must be restored to a valid 33-action state by its owning work before the repository-wide test gate can pass.

## Readiness

The live-canvas correction itself passes its focused, browser, media, typecheck, build, diff, and secret gates. Real decoded production videos are visibly moving in normal Chrome and end naturally on the same non-black owned canvas behind the actual cinematic dialogue UI.

Repository-wide readiness remains blocked by the unrelated concurrent VFX registry regression described above.

`READY_FOR_CIN_6C: NO`

No CIN-6C work was started.
