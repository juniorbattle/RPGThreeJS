# UI FX: concrete audit and offline listening candidates

CURRENT FACT — 2026-10-18, run `codex-bois-clair-night-20261019T0213`, starting `dev` f4e8d9f4377060392bbf94d094ded66ef59d9ada.

## Direct operator request

« Ce qui te semble le plus simple a faire, si tu es capable generer simplement les sons FX apres un audit concret de notre besoin et emplacement, allons y ».

The operator also clarifies that the former Hunters defeat occurred without first using available healing potions. This is preparation feedback, not evidence for weakening that encounter. Correct the missing Bois-Clair night backdrop first. No claim that the full demo, balance, art, hardware or mobile has been accepted.

## What exists

No general sound-effects service, audio preference UI or game SFX playback was found in current `src/`. CinematicPlayer/CinematicOverlay already control their decoder video's mute state; they are a separate owner and will remain unchanged. Combat runs in the real iframe through CombatBridge, so a generic parent-document click handler would miss its controls and could double play during callbacks. No audio-generation connector is exposed in this session. The supplied candidates therefore use original deterministic mathematical synthesis, not a claimed AI/provider recording.

## First lot: eight short sounds, exact proposed locations

PROPOSED FUTURE DESIGN — these event hooks are audited locations, **not integrated runtime**.

| Candidate | Audited existing owner/location | Trigger and exclusions |
| --- | --- | --- |
| navigate | `src/ui/PoiMapView.ts` select/region handlers; `src/ui/ManagementView.ts` bind tab/unit handlers | Explicit changed selection only. Silent hover, automatic focus, same selection and generic Tab traversal. At most one sound per intentional action. |
| confirm | PoiMapView help/details/company; ManagementView voluntary opens; DialogueView accepted continuation/choice | Use the existing canonical click path for pointer and native Enter/Space. A reveal or selection must not falsely signal an outcome. Avoid one tick per typewriter character. |
| back | PoiMapView closePanel; ManagementView close/item/equipment modal close; existing Escape path | One voluntary close/cancel cue, shared across pointer and keyboard. No cue for programmatic cleanup or disposal. |
| refused | PoiMapView rejected movement feedback; ManagementView false action result; DialogueView blocked outcome | Only an explicit refused attempt with existing visible explanation. Disabled controls and merely visiting a locked POI stay silent. No invented error or state transition. |
| saved | `src/game/GameApp.ts` onSave, after `src/game/store.ts` SaveRepository.saveManual returns | One cue after successful actual write. Never before it or on exception. Autosaves remain silent. Storage error feedback is a separate existing owner concern, not concealed by a success sound. |
| reward | GameApp chest branch after createPoiChestAdapter grants loot, then `src/ui/PoiEncounterView.ts` reward presentation | Once on newly granted reward presentation. No trigger from rendering amounts, closing result, reopening UI or reloading a save. |
| recover | ManagementView useConsumable true; GameApp refuge restUnits true | Reflect completed healing only. Silent failed/no-op use; must not debit, heal, write saves or recompute costs in audio code. |
| travel-start | GameApp choosePoi after enterPoi succeeds; PoiMapView animateTravel boundary | Require actual currentNodeId !== origin; a successful interception leaving the party at origin is silent. One restrained departure cue, no continuous footsteps or physical-road simulation. Refused move and opening the current refuge do not claim travel. |

Combat impacts, weapons, magic, KO, victory/defeat, ambiences, music, voices and cinematic tracks need their own later inventory/listening pass. They are not silently covered by these eight UI candidates. Do not start by sounding every click in the application.

## Generated listening pack

[`../media/audio/ui-fx-candidates-v1/index.html`](../media/audio/ui-fx-candidates-v1/index.html) supplies eight individual players, manual play-all, stop and volume. No autoplay or imports into GameApp. [`manifest.json`](../media/audio/ui-fx-candidates-v1/manifest.json) records original synthetic provenance, generator SHA, PCM format, per-file SHA/duration/peak/RMS and explicit candidate status. `preview-all.wav` concatenates the eight sounds with one second of silence between them.

Generator: `tools/audio/generate-ui-fx-candidates.mjs`. Deterministic seeded noise and damped oscillators; mono PCM16/48kHz, 75–460ms, short boundary fades, peaks below -13dBFS. No external samples, paid provider, token, voice or copyrighted recording. It refuses to overwrite a candidate directory. Offline PCM checks are technical integrity only: timbre, loudness on the operator's hardware and fatigue from repetition still need listening.

## Production activation boundary

Audio remains **DEFERRED**, set1.5.0 baseline d1031ec02977379279a3c07eefa58edc8cab7246. This normal night/art task does not edit any LOCKED document. The current request authorizes this concrete audit and generated listening candidates. An independent guardian confirms this scope.

Before mounting sounds in the game, turn the reviewed concrete lot into a dedicated narrow production audio exception, independently review the actual affected constitution/contracts diff and commit its baseline. This must not declare all narrative/cinematic/global PC acceptance achieved or open music/voice/ambience doctrine. A bounded implementation needs:

- Explicit player sound enablement/volume and browser unlock on a real gesture. No automatic sound on load, resume or programmatic focus. Preferences separate from V6 gameplay truth and cinematic video mute.
- One short cue per canonical user action, shared keyboard/pointer path, limited simultaneous voices/rate and a stop/mute path. No keyboard-plus-click duplicate, queue replay or background-tab sound.
- Audio decode/play/permission failure never blocks an action, hides visible feedback or changes a route, resource, outcome, combat result or save.
- Cleanup on hidden/disposed state, normal and reduced-motion parity; silence remains fully playable and accessible. Sound is supplemental to current text/status.
- Existing production QA adapted narrowly for enable/mute/volume, pointer/keyboard deduplication, failed playback, iframe separation and unchanged owner/save state. Do not replay a campaign to collect an audio micro-PASS.

Next concrete step after OD-2026-10-18-E: prepare the dedicated narrow production exception/review/baseline, then integrate these eight accepted files at the audited events with volume/mute and non-blocking gesture-gated playback. Do not repeat the completed listening or regenerate accepted assets.


## Operator asset acceptance — OD-2026-10-18-E

APPROVED DECISION — recorded 2026-10-19T02:56:33.298Z (2026-10-18 America/Toronto). Exact operator statement: « Excellent je valide les sons et aussi la correction du fond nocturne ». The eight existing WAVs in the manifest are accepted for this UI FX lot, and the existing nocturnal Bois-Clair correction is artistically accepted. Asset bytes/hashes are unchanged. This closes those two specific operator-review items. It does not certify all narrative/art, audio integration, balance, hardware comfort or the global demo. Historical technical/night proof and failed receipts retain their exact scope. Audio runtime still awaits the bounded dedicated exception/integration described above; music, voice, ambience and cinematic audio remain outside this decision.


## Runtime integration — 2026-10-19

CURRENT FACT: OD-2026-10-18-F / reviewed set1.6.0 baseline8fdc797 authorizes the bounded implementation now present in UiSoundPlayer, UiSoundSettings and audited view/GameApp callbacks. Eight accepted files copied byte-identically into public/assets/audio/ui-fx-v1. Sons buttons on title/map, explicit enable, mute and volume, separate local preference. Source/unit gates pass59tests6files,24helper tests. Scoped earned native proof ui-fx-native-0633 verifies settings, actual potion/manualsave/resolved backtrack with exactly one cue, exact reload and failed media containment. Native hidden/suspend remains NOT_OBSERVED_PLATFORM and full-feature acceptance is not claimed. Prior asset approval remains valid; no need for regeneration or another listening gate. See docs/reports/ui-fx-integration-2026-10-19.md.
