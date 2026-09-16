# Forest Road v2 environment production

## Scope

This package is the Option C, DEV-only Forest Road / Forest Route environment family. It is a visual-production and operator-review package only. It does not replace production assets and does not change runtime, gameplay, narrative, combat logic, VFX, or character production.

The selected pipeline is:

- visual model: `baked_raster`
- runtime object model: `none`
- collision model: `none`
- engine target: `project-native-review-only`
- clean plate size: `1672x941` RGB PNG

## Location identity

Every surface preserves the same authored geography:

- ancient Lion-Court flagstone road
- carved waystone and ruined royal masonry on the left
- stream and cascades on the right
- forested waterfall ridge and mountain notch in depth
- distant citadel direction
- blue-and-old-gold heraldic remnants

## Candidate recommendations

| Surface | A | B | C | Recommendation |
| --- | --- | --- | --- | --- |
| Travel | pass | pass | pass | **B** |
| Static tableau | pass | pass | pass with bright-UI caveat | **B** |
| Strategic combat | pass with center-value caveat | pass | pass with center-value caveat | **B** |
| Combat stage | pass with hotspot caveat | pass | pass | **C** |

These are recommendations for operator review, not production selections.

## Review entry points

- `public/assets/dev/option-c/environments/forest-road-v2/reviews/forest-road-v2-travel-abc-comparison.png`
- `public/assets/dev/option-c/environments/forest-road-v2/reviews/forest-road-v2-tableau-abc-comparison.png`
- `public/assets/dev/option-c/environments/forest-road-v2/reviews/forest-road-v2-strategic-abc-comparison.png`
- `public/assets/dev/option-c/environments/forest-road-v2/reviews/forest-road-v2-combat-stage-abc-comparison.png`
- `public/assets/dev/option-c/environments/forest-road-v2/reviews/forest-road-v2-family-coherence-recommended.png`
- `public/assets/dev/option-c/environments/forest-road-v2/reviews/forest-road-v2-tableau-b-staging-overlay.png`
- `public/assets/dev/option-c/environments/forest-road-v2/reviews/forest-road-v2-strategic-b-dev-overlay.png`

The clean candidates contain no overlay graphics. Staging and UI guides exist only in the two review overlays.

## QA and provenance

- Human review: `qa/operator-review.md`
- Machine QA: `public/assets/dev/option-c/environments/forest-road-v2/qa/forest-road-v2-machine-qa.json`
- Provenance: `public/assets/dev/option-c/environments/forest-road-v2/provenance/generation-provenance.json`
- Prompt set: `prompts/forest-road-v2-generation-prompts.md`

The image backend did not expose an exact model identifier, so provenance is recorded as `UNKNOWN` instead of inferred.

## Deterministic review rebuild

Run the package-local review builder with a Python environment containing Pillow:

```powershell
python docs/art-direction/option-c/environment-production/forest-road-v2/build_review_artifacts.py
```

This rebuilds only comparison boards, overlays, hashes, dimensions, and zone metrics. It does not regenerate creative art.

## Integration status

- Production asset replacement: no
- Runtime integration: no
- Gameplay changes: no
- Narrative changes: no
- Combat logic changes: no
- VFX changes: no
- Character asset changes: no
- Commit: no
- Push: no

