# Retired cinematic masters

These 23 MP4s were moved byte-identically from `public/assets/cinematics/` during `CINEMATIC-EIGHT-SLOT-ALIGNMENT`. They are historical production evidence, not runtime assets. `inventory.json` records each original path, current path, byte size, SHA-256, and Git blob at `da1678945c6d42fc76ccb0f3c8b13a7a81a01176`.

The historical 31-master manifest remains at `tools/cinematics/specs/historical_cinematic_manifest_31.json`. Current production loads only the eight approved MP4s from `public/assets/cinematics/manifest.json`. Historical tests resolve archived paths through `tools/cinematics/historical_video_path.mjs` and verify the original bytes before allowing old paths in dated audit gates. Do not copy these files back into `public/` to satisfy an old report.
