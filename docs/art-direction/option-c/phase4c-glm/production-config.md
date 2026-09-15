# Production Config — Authoritative Image Production Reference

Status: **CURRENT AUTHORITATIVE REFERENCE**
Scope: All future Codex / GPT Image production missions for Option C.

This document is the single authoritative source for the required image
production configuration. Future Codex missions MUST read these values from
here and MUST NOT infer them from historical CIN-6E scripts or job specs.

---

## Required Image Production Config

```
REQUIRED_IMAGE_MODEL    = gpt-image-2.5-sunburst-2026-09-08
REQUIRED_IMAGE_QUALITY  = max
FALLBACK_MODEL          = NONE
AUTO_DOWNGRADE          = FORBIDDEN
```

- The required model MUST be used exactly. No substitution.
- Quality MUST be `max`.
- There is NO fallback model. If the required model is unavailable, production
  halts and awaits operator direction.
- Automatic quality downgrade or model substitution is FORBIDDEN.

---

## Historical Provenance Policy

Historical `image_gen` generations that did not expose an exact backend model
identifier remain historically recorded as:

```
MODEL_PROVENANCE = UNKNOWN
```

These historical records MUST NOT be retroactively rewritten. Unknown
provenance is an honest historical record, not a gap to be filled by inference.

Future production uses the exact model above and records it explicitly.

---

## Production Promotion Authority Model

```
GLM      → SCALING_DRAFT → DEV_PRODUCTION_CANDIDATE
CODEX    → FINAL_PRODUCTION_CANDIDATE
OPERATOR → PRODUCTION_APPROVED   (operator-only gate)
```

A Codex generation mission MUST NOT self-promote its output directly to
`PRODUCTION_APPROVED`. Only operator approval may set `PRODUCTION_APPROVED`.

See `OptionCCharacterSchema.ts` (`OptionCArtStatus`) for the machine contract.

---

## Kestrel / Forest Road Reference Policy

```
KESTREL:
  STRUCTURAL_GOLD_REFERENCE     = YES
  RUNTIME_REFERENCE             = YES
  IDENTITY_AUTHORITY            = canonical kestrel.png
  FINAL_VISUAL_QUALITY_REFERENCE = NO
  VISUAL_REMASTER_ALLOWED       = YES
  ANIMATION_REMASTER_ALLOWED    = YES
  REDESIGN_ALLOWED              = NO

FOREST_ROAD:
  STRUCTURAL_GOLD_REFERENCE     = YES
  COMPOSITION_REFERENCE         = YES
  CAMERA_SEMANTICS_REFERENCE    = YES
  FINAL_VISUAL_QUALITY_REFERENCE = NO
  VISUAL_REMASTER_ALLOWED       = YES
  GAMEPLAY_GEOMETRY_CHANGE      = NO
```

Kestrel and Forest Road remain structural/runtime references. They are NOT
the final visual-quality ceiling. Visual/animation remaster is allowed;
redesign is not. Do NOT alter existing Kestrel/Forest Road media.
