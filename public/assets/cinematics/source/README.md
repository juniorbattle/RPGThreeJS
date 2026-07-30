# Cinematic Source Frames

This directory contains composited source frames for cinematic video generation.

## V11B-P1 Frames

| File | Cinematic ID | Narrative Moment | Trigger (future) |
|---|---|---|---|
| serpent_general_reveal_source.png | serpent_general_reveal | Boss reveal before serpent_captain combat | beforeCombat: serpent_captain |
| lion_judgement_source.png | lion_judgement | Chapter climax before lion_finale_judgement dialogue | beforeDialogue: lion_finale_judgement |

## Usage

These PNGs are 1920x1080 (16:9) composited stills designed as input for image-to-video generation tools (Seedance, Higgsfield, Vidfield, etc.).

- Do NOT edit these files directly. Regenerate via `tools/cinematics/prepare_v11b_p1_sources.py`.
- Do NOT create WebM/MP4 files in this directory. Video outputs go in `public/assets/cinematics/`.
- See `docs/reports/v11b-p1-cinematic-source-frames.md` for full composition specs and video generation prompts.
