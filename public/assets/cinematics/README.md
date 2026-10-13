# Cinematic Assets

The runtime loads descriptors from `manifest.json`. Keep source order as WebM first and MP4 second when both encodes are available.

Each production descriptor requires:

- A stable ID used only by `CinematicTriggers.ts`.
- A title and fallback text.
- Ordered `video/webm` and `video/mp4` sources.
- An optional poster and WebVTT captions file.
- An expected duration in milliseconds for bounded fallback timing.

Use lowercase kebab-case filenames. Keep videos optimized for browser playback and avoid embedding final media until it has been reviewed. Missing files, unsupported codecs, autoplay rejection, stalls, and manifest errors must always fall through to normal game flow.

`qa-placeholder` contains no video and exists only for the local cinematic QA route.
