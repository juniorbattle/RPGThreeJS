# CIN-6.5 — Camp Departure Remaster

## Result

`CAMP_DEPARTURE_REMASTER: PASS`

The reviewed defect was an apparent scale jump after the cut into shot 2.
Alistair grew from a plausible wide-shot figure into a foreground-scale figure
even though the intended movement was lateral along the road. Shot 1 was
preserved; only shot 2 was recomposed and regenerated.

## Master accounting

| Field | Before | After |
| --- | ---: | ---: |
| Runtime ID | `camp_departure` | `camp_departure` |
| Duration | 12.000 s | 12.000 s |
| Bytes | 11,262,128 | 9,428,366 |
| SHA-256 | `fd9ec9efee8e127eed25a6ee680f875ab3f670eabcfae37e02970950e9fa35d4` | `5ccf6e4e5156831ab10c992ee4af59a5bc5a28093df690b737a3eed441469463` |
| Byte delta | — | -1,833,762 (-16.28%) |
| Manifest IDs | 21 | 21 |

The manifest duration remains the ffprobe-backed 12,000 ms. No manifest edit
was necessary.

## Shot provenance

### Shot 1 — preserved

- source/master: existing approved CIN-6A shot;
- duration: 6.000 s;
- master SHA-256: `9d54270b19fd2fd4790ad966481de44538739952f44564d4b195710bef69c3e0`;
- generation attempts in CIN-6.5: 0.

### Shot 2 — one targeted attempt

- framing: `WIDE_LATERAL_MARCH`;
- camera: `TRACK_SMALL_RIGHT`;
- Alistair: height 650 px, x 0.34, groundY 0.97, screen-right;
- Séraphine: height 610 px, x 0.69, groundY 0.97, screen-left;
- source type: deterministic `CUT_SOURCE`;
- deterministic source SHA-256: `d2ba5ebc37cd21fa3108ce03b1684719be76840ab0bb7a49094b44e7a3f5aea2`;
- Alistair canonical asset SHA-256: `7e16df524ba10c6f42b08843eecafe5456425ba1e22f39567cd933fe23857942`;
- Séraphine canonical asset SHA-256: `6446afd4e0849b6ade20e454bb8ef5ed1a0ef847bd241cc5f5c796eb45a47064`;
- environment SHA-256: `9030537fc31b1a498d74799a9e9cc11d5f458aeaf022a637ccf34d305042e1e2`;
- provider: MiniMax Open Platform Direct API;
- model/mode: MiniMax-H3, image-to-video, first-frame conditioning;
- requested resolution: 2K;
- duration: 6 seconds;
- prompt version: `cin6.5-remaster-v1`;
- prompt SHA-256: `388b3b098b0120ca6ab50645c3b518a171f4dd4d40d00e64128ac9ed308bdeb0`;
- task ID: `439112625746225`;
- attempt: 1 of the allowed maximum 3;
- provider usage: 6 output seconds, one input image, 325,488 total tokens;
- raw candidate: 4,059,775 bytes;
- raw candidate SHA-256: `4e41102fcf323600867ef13bbf98eaeb7f4ebc9039fad9377ed57ed15adf7ce3`;
- mastered shot SHA-256: `a05193177a1adada02219a8dbca8931aedd7968cef821c11f3cddaae23d394c3`.

The prompt explicitly prohibited push-in, dolly toward camera, zoom, foreground
approach, ground-plane changes, and growth relative to Séraphine. No retry was
needed and no other cinematic consumed provider credits.

## Visual QA

First, 25%, 50%, 75%, and last frames were extracted for shot 2. Sequence review
then compared shot 1 beginning/mid/end with shot 2 beginning/mid/end. The ignored
evidence lives under:

- `tmp/cinematics/cin4/cin6a_camp_departure/shot_02/review_cin65_attempt_01/`;
- `tmp/cinematics/cin4/cin6a_camp_departure/review_cin65_after/`;
- `tmp/cinematics/cin4/cin6a_camp_departure/cin65_before_after_contact_sheet.png`.

| Gate | Result |
| --- | --- |
| Canonical identity | PASS |
| Facing / screen direction | PASS |
| Anatomy and weapons | PASS |
| Character scale consistency | PASS |
| Relative character height | PASS |
| Ground-plane alignment | PASS |
| Perspective scale | PASS |
| Cross-shot scale continuity | PASS |
| No unjustified camera approach | PASS |
| No subject scale inflation | PASS |
| Environment continuity | PASS |
| Final frame | PASS — stable, nonblack, nonblank |
| Text / watermark | PASS — absent |

The before/after contact sheet makes the correction explicit: the previous shot
2 enlarged Alistair well beyond the shot-1 relationship; the new shot 2 retains
the 650/610 source scale and keeps both characters grounded through the lateral
track.

## Technical QA

| Field | Final master |
| --- | --- |
| Container | MP4 (`mov,mp4,m4a,3gp,3g2,mj2`) |
| Codec/profile | H.264 High |
| Pixel format | yuv420p |
| Dimensions | 1920×1080 |
| Display aspect | 16:9 |
| Frame rate | 24 fps |
| Duration | 12.000 s |
| Audio | none |
| Rotation | 0 |
| Last-frame mean / standard deviation | 67.233 / 52.579 |
| Last-frame nonblack / nonblank | true / true |
| Chromium decode/playback | PASS — natural end at 12/12 s, readyState 4 |

The CIN-4 sequence validator, shot/staging validator, ffprobe-backed technical
validator, manifest-backed CIN-6B production test, and full suite all pass.

## P0 visual polish audit

The production library remains 20 P0 masters plus one QA placeholder. Existing
reviewed QA evidence and the current technical/targeted visual pass produced the
following disposition:

| Runtime IDs | Disposition |
| --- | --- |
| `camp_departure` | REMASTER before this pass; KEEP after the approved one-shot replacement |
| `lion_judgement`, `serpent_general_reveal`, `lion_champion_reveal` | KEEP |
| `forest_journey_tension`, `alaric_audience_arrival`, `refugees_approach` | KEEP |
| `first_refuge_arrival`, `first_refuge_departure`, `valmir_route_fork` | KEEP |
| `bois_clair_arrival`, `bois_clair_saved`, `bois_clair_sacrificed` | KEEP |
| `second_refuge_departure`, `witnesses_encounter`, `ruins_approach_context` | KEEP |
| `shadow_signs`, `final_refuge_dossier`, `serpent_route_ending`, `lion_trial_route_ending` | KEEP |

No second hard visual defect was found, so no other remaster was attempted.
`NEW_MEDIA_IDS: 0`; `P1_MEDIA_GENERATED: 0`.

## Secret and temporary-artifact safety

`.env.local` is ignored and untracked. The tracked diff contains neither the
API key nor an Authorization header. Raw candidates, source previews, review
frames, contact sheets, provider metadata, and FFmpeg intermediates remain under
ignored `tmp/cinematics/` paths. No secret-bearing response dump was retained.

`COMMIT: NO`  
`PUSH: NO`
