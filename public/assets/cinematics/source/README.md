# Cinematic Source Frames

This directory contains composited source frames for cinematic video generation.

## Production source frames

| File | Cinematic ID | Narrative moment | Trigger |
|---|---|---|---|
| serpent_general_reveal_source.png | serpent_general_reveal | Boss reveal before `serpent_captain` combat | `beforeCombat: serpent_captain` |
| lion_judgement_source.png | lion_judgement | Chapter climax before `lion_finale_judgement` dialogue | `beforeDialogue: lion_finale_judgement` |
| lion_champion_reveal_source.png | lion_champion_reveal | Formal Champion reveal before the Lion trial | `beforeCombat: lion_chief` |

## Usage

These PNGs are deterministic 1920x1080 (16:9) RGB composites designed as first-frame inputs for offline image-to-video production.

- Do NOT edit these files directly. Regenerate all frames with `python tools/cinematics/prepare_v11b_p1_sources.py`.
- Regenerate only the CIN-3 Lion Champion source with `python tools/cinematics/prepare_v11b_p1_sources.py --only lion_champion_reveal`.
- Do NOT create WebM/MP4 files in this directory. Video outputs go in `public/assets/cinematics/`.
- See `docs/reports/v11b-p1-cinematic-source-frames.md` for full composition specs and video generation prompts.
