# V11B-P1 Cinematic Source Frames

## 1. Summary

Two cinematic source frame composites were produced as 1920x1080 PNG files for later image-to-video generation:

- **serpent_general_reveal_source.png** — Boss reveal before `serpent_captain` combat
- **lion_judgement_source.png** — Chapter climax before `lion_finale_judgement` dialogue

Both frames were composited from existing project assets using a deterministic Python/PIL script. No gameplay, combat, VFX, save schema, or trigger wiring was modified. No video files were generated.

**What remains to do:**
- V11B-P2: Generate WebM/MP4 video clips from these source frames using image-to-video tools
- V11B-P3: Wire cinematic triggers in `CinematicTriggers.ts` and update `manifest.json`

---

## 2. Source Assets Found

### serpent_general_reveal

| Asset | Path | Exists | Dimensions | Mode | Size |
|---|---|---|---|---|---|
| Background | `public/assets/generated/lion-phase/combat/lion_sanctum.webp` | Yes | 2048x1152 | RGB | 464,530 bytes |
| Character | `public/assets/characters/pixel/full/serpent_general_boss.png` | Yes | 640x768 | RGBA | 365,734 bytes |
| Character bbox | — | — | (75, 63, 566, 737) → 491x674 px | — | — |

### lion_judgement

| Asset | Path | Exists | Dimensions | Mode | Size |
|---|---|---|---|---|---|
| Background | `public/assets/generated/lion-phase/dialogue/lion_finale_judgement.webp` | Yes | 1920x1080 | RGB | 175,164 bytes |
| Primary character | `public/assets/characters/pixel/full/alaric.png` | Yes | 640x768 | RGBA | 453,453 bytes |
| Primary bbox | — | — | (74, 84, 565, 735) → 491x651 px | — | — |
| Secondary character | `public/assets/characters/pixel/full/lion_champion.png` | Yes | 640x768 | RGBA | 562,973 bytes |
| Secondary bbox | — | — | (65, 84, 575, 735) → 510x651 px | — | — |

---

## 3. Source Assets Missing

None. All required assets were found at their expected paths.

---

## 4. Composite Decisions

### serpent_general_reveal

| Parameter | Value | Rationale |
|---|---|---|
| Frame size | 1920x1080 | Standard 16:9 HD for image-to-video tools |
| Background crop | Resize 2048x1152 → 1920x1080 (LANCZOS) | Source is already 16:9; simple resize preserves full scene |
| Character scale | Height 820px (scale factor 1.068) | Boss is 2x2 board presence (combatHeight 3.28); large but not frame-filling |
| Character placement | x=811, y=263 (60% horizontal, feet at y≈1050) | Slightly right of center; dramatic boss positioning |
| Shadow aura | Dark green (20, 60, 30), radius 380px, opacity 0.22, Gaussian blur 30px | Subtle corrupted presence behind boss |
| Floor mist | 200px height, opacity 0.15, grey-white gradient | Atmospheric depth at floor level |
| Vignette | Strength 0.48, falloff start at 35% from center | Darkens edges, focuses attention on boss center-right |

### lion_judgement

| Parameter | Value | Rationale |
|---|---|---|
| Frame size | 1920x1080 | Standard 16:9 HD |
| Background crop | No resize needed (already 1920x1080) | Exact fit |
| Alaric scale | Height 750px (scale factor 0.977) | Boss-scale character (combatHeight 2.25); prominent but not overwhelming |
| Alaric placement | x=417, y=332 (38% horizontal, feet at y≈1050) | Center-left; presiding position |
| Lion Champion scale | Height 520px (scale factor 0.677) | Secondary; smaller than Alaric |
| Lion Champion placement | x=1166, y=552 (72% horizontal, feet at y≈1050) | Right side; guard presence |
| Lion Champion darkening | RGB factor 0.42, alpha factor 0.72 | Partly in shadow; doesn't compete with Alaric |
| Warmth overlay | Golden tint (255, 200, 120), opacity 0.07, upper-third gradient | Torch warmth, ceremonial light |
| Alaric glow | Golden (255, 210, 130), radius 320px, opacity 0.10 | Subtle judgement light behind Alaric |
| Vignette | Strength 0.42, falloff start at 35% from center | Focuses on hall center |

---

## 5. Exported Files

| File | Path | Dimensions | File Size |
|---|---|---|---|
| serpent_general_reveal_source.png | `public/assets/cinematics/source/serpent_general_reveal_source.png` | 1920x1080 | 2,876,540 bytes (2.74 MB) |
| lion_judgement_source.png | `public/assets/cinematics/source/lion_judgement_source.png` | 1920x1080 | 2,001,327 bytes (1.91 MB) |

Both files were generated successfully by `tools/cinematics/prepare_v11b_p1_sources.py`.

---

## 6. Video Generation Notes

### serpent_general_reveal

**Prompt outline:**
Use the provided source frame as the exact visual reference. Create a short fantasy tactical RPG cinematic reveal. Preserve the painted Lion Sanctum background and the exact Serpent General sprite design. Add subtle camera push-in, faint fog drift, corrupted shadow-green aura pulse, and small dust particles. Keep motion slow and controlled. The boss remains mostly still with slight breathing presence. Do not redesign the character.

**Negative prompt:**
No realistic 3D redesign, no new armor, no new face, no extra limbs, no extra characters, no projectile, no full battle animation, no strong camera rotation, no distorted background, no blurry unreadable frame, no style drift.

**Duration:** 8–12 seconds.

**Suggested motion:**
- Slow camera push-in (dolly forward, ~2-3% scale over duration)
- Faint fog drift left-to-right at floor level
- Subtle shadow-green aura pulse (opacity oscillation, 0.5-1Hz)
- Small dust particles drifting upward
- Boss breathing: barely perceptible vertical oscillation (1-2px)
- Vignette remains static or very slightly intensifies

### lion_judgement

**Prompt outline:**
Use the provided source frame as the exact visual reference. Create a short fantasy tactical RPG judgement hall cinematic. Preserve the painted hall background and exact Alaric sprite design. Add subtle torch flicker, drifting dust, slow camera push, and restrained golden light. The scene should feel solemn, tense, and ceremonial. Do not turn it into an action shot.

**Negative prompt:**
No realistic 3D redesign, no costume change, no extra characters, no combat action, no large camera move, no altered architecture, no face redesign, no blur, no style drift, no excessive glow.

**Duration:** 8–12 seconds.

**Suggested motion:**
- Slow camera push-in (dolly forward, ~1.5-2% scale over duration)
- Torch flicker: subtle warm light oscillation (0.5Hz, ±5% brightness)
- Drifting dust motes: slow upward particles, low opacity
- Golden judgement light: very slow pulse (0.3Hz, barely perceptible)
- Alaric breathing: barely perceptible (1-2px vertical)
- Lion Champion remains still in shadow
- Vignette remains static

---

## 7. Integration Readiness

**Do not integrate yet.** This pass only prepares source frames.

| Source Frame | Ready for V11B-P2 Video Generation? |
|---|---|
| serpent_general_reveal_source.png | Yes — 1920x1080, 16:9, composited, validated |
| lion_judgement_source.png | Yes — 1920x1080, 16:9, composited, validated |

Both frames are ready to be fed into image-to-video generation tools (Seedance, Higgsfield, Vidfield, etc.).

---

## 8. Validation

| Check | serpent_general_reveal | lion_judgement |
|---|---|---|
| Image dimensions | 1920x1080 | 1920x1080 |
| File size | 2,876,540 bytes (2.74 MB) | 2,001,327 bytes (1.91 MB) |
| Mode | RGB (flattened, no alpha) | RGB (flattened, no alpha) |
| 16:9 aspect ratio | 1.7778 — confirmed | 1.7778 — confirmed |
| Transparent sprites composited correctly | Yes — RGBA sprites alpha-blended onto RGB background | Yes — RGBA sprites alpha-blended onto RGB background |
| Composition respects 16:9 | Yes | Yes |
| Image preserves project style | Yes — painted background + pixel sprite art preserved | Yes — painted background + pixel sprite art preserved |

### Validation Commands

```
py tools/cinematics/prepare_v11b_p1_sources.py   # generation
py tools/cinematics/validate_v11b_p1.py           # dimension/size check
```

### Helper Scripts Created

| File | Purpose |
|---|---|
| `tools/cinematics/prepare_v11b_p1_sources.py` | Deterministic compositor — reads existing assets, writes two source PNGs |
| `tools/cinematics/validate_v11b_p1.py` | Post-generation validation — checks dimensions, mode, file size, aspect ratio |
| `tools/cinematics/check_bboxes.py` | Sprite bounding-box inspection utility |

### Composition Risks

1. **Sprite scale vs. background perspective**: Character sprites are full-body pixel art placed over painted backgrounds. The perspective match is approximate — feet are placed near the bottom of the frame, but the painted background's floor perspective may not perfectly align with the sprite's ground contact point. This is acceptable for image-to-video generation where the AI tool will add subtle motion.

2. **Lion Champion darkness**: The secondary character is darkened to 42% RGB and 72% alpha to keep it secondary. If the video generation tool brightens the image, the Champion may become more visible than intended. This is a minor risk — the composition is designed to be readable either way.

3. **No transparent output**: Both frames are exported as RGB (flattened). This is correct for image-to-video tools which expect opaque input frames.

4. **WebP background quality**: The `lion_sanctum.webp` background was upscaled slightly (2048→1920 width, 1152→1080 height). The LANCZOS resampling preserves quality, but the source WebP is already compressed. No visible quality loss is expected at 1920x1080.
