# CIN-6.7.2 — Reachable Dialogue and Staging Profile Audit

Date: 2026-09-09  
Source: canonical `DialogueSequence` data  
Machine artifact: [`narrative_dialogue_staging.json`](../../tools/cinematics/specs/narrative_dialogue_staging.json)

## Coverage result

| Metric | Result |
| --- | ---: |
| Reachable dialogues | 71 |
| Staged dialogues | 71 |
| Canonical dialogue steps | 247 |
| Staged dialogue steps | 247 |
| Unmapped dialogues | 0 |
| Unmapped steps | 0 |
| Visual phases / distinct compositions | 75 |
| Approved staging profiles | 9 |
| Choice steps | 28 |
| Choice-purity violations | 0 |
| Text-capacity violations | 0 |
| Normal-dialogue scroll violations | 0 |
| Accidental full-width fallbacks | 0 |
| Arbitrary center fallbacks | 0 |
| Unresolved media/speaker conflicts | 0 |
| Intentional contextual offscreen steps | 12 |

Every canonical step has exactly one staging record and one effects owner. Presentation-only segmentation never changes canonical step order, text ownership, choices, effects, or branching.

## Reachable dialogue families

| Family | Dialogues |
| --- | ---: |
| Event | 26 |
| Pre-combat | 13 |
| Aftermath | 13 |
| ATE | 10 |
| Finale | 8 |
| Audience | 1 |

## Profile distribution across dialogue steps

| Profile | Steps | Audit interpretation |
| --- | ---: | --- |
| `DIALOGUE_SIDE_COMPACT` | 118 | Ordinary dialogue uses a bounded side lane |
| `DIALOGUE_TOP_CENTER` | 39 | Ensemble compositions protect occupied lower cast space |
| `DIALOGUE_BOTTOM_BAND_RESERVED` | 29 | Wider treatment is limited to curated pre-combat/threat states |
| `CHOICE_TWO_PATH_SPATIAL` | 28 | Every actionable dialogue choice uses the choice-only transition |
| `DIALOGUE_SPEAKER_FOCUS` | 14 | Authority/finale focus remains compact |
| `INTRO_CAST_PRESENTATION` | 9 | Every opening clan step retains the full cast composition |
| `ADVISER_EXCHANGE` | 8 | Adviser ownership uses an authored lane |
| `HELD_VIDEO_DIALOGUE` | 2 | Authored held beats have a dedicated compact profile |
| `CHOICE_SINGLE_ROUTE_CONTINUE` | Journey boundary | Camp and generic single-route boundaries use the ninth approved profile |

The longest audited segment is 210 characters in a 220-character `DIALOGUE_TOP_CENTER` profile. The next-longest held-video segment is 209 characters in its 210-character capacity. No segment exceeds its selected profile.

## Choice-state proof

All 28 choice steps record:

- `speakerCardPolicy=SETUP_THEN_CHOICES_ONLY`;
- an optional non-actionable setup card before agency;
- `speakerCardDuringActiveChoice=false`;
- `CHOICE_TWO_PATH_SPATIAL` with `SPATIAL` placement;
- canonical choice count and order copied from the source sequence;
- a single canonical owner for choice effects.

Browser evidence verifies the same state machine in still and held-video modes: setup has one visible card and zero choice buttons; active agency has two visible choices and a hidden speaker card.

## Media and speaker alignment

No unresolved media/speaker conflict remains. Twelve video-mode steps use the explicit `OFFSCREEN_CONTEXTUAL` strategy because the existing moving media does not depict that speaker:

| Dialogue | Explicit offscreen steps |
| --- | ---: |
| `village_choice` | 7 |
| `pre_opening_trail` | 2 |
| `shadow_signs` | 2 |
| `final_refuge` | 1 |

Each record includes its reason, keeps automatic full-body overlays disabled, and marks future media remaster need without changing the current media. The real forest-threat browser path confirms the intentional offscreen strategy and zero cast duplication.

## Mandatory representative-state matrix

| State | Profile / placement | Cast and overlap review | Reveal / scroll | Choice purity | Still | Video |
| --- | --- | --- | --- | --- | --- | --- |
| Opening clan introduction | `INTRO_CAST_PRESENTATION / TOP_CENTER` | PASS — six cast members readable, one active and five listening | PASS — 0 px geometry delta | N/A | PASS | PASS fallback-to-video journey flow |
| Alaric audience normal dialogue | `DIALOGUE_SPEAKER_FOCUS / RIGHT` | PASS — authority composition remains readable | PASS | N/A | PASS | PASS moving video |
| Audience adviser exchange | `ADVISER_EXCHANGE / RIGHT` | PASS — adviser owns the visual argument | PASS | N/A | PASS | Same grammar retained |
| Audience political choice | `CHOICE_TWO_PATH_SPATIAL / SPATIAL` | PASS — central cast remains readable | N/A | PASS — two choices, no speaker card | PASS | PASS held video |
| Single-route travel | `CHOICE_SINGLE_ROUTE_CONTINUE / LOWER_RIGHT` | PASS — compact next-step treatment | N/A | Single continuation only | PASS | PASS |
| Two-path Valmir fork | `CHOICE_TWO_PATH_SPATIAL / SPATIAL` | PASS — LEFT/RIGHT geography retained | N/A | PASS — two route choices only | PASS | PASS |
| Multi-speaker event choice | `CHOICE_TWO_PATH_SPATIAL / SPATIAL` | PASS — scene cast remains present | N/A | PASS | PASS | Grammar-covered by shared resolver |
| Refugee choice | `CHOICE_TWO_PATH_SPATIAL / SPATIAL` | PASS — six-person scene remains readable | N/A | PASS | PASS | Grammar-covered by shared resolver |
| Tension / pre-combat | `DIALOGUE_BOTTOM_BAND_RESERVED / BOTTOM_CENTER` | PASS — threat and company remain readable | PASS — bounded, no scroll | N/A | PASS | PASS with explicit offscreen speaker handling |
| Immediate post-combat | `DIALOGUE_SIDE_COMPACT / RIGHT` | PASS — narrative tableau resumes directly | PASS — bounded, no scroll | N/A | PASS | PASS |

## Deterministic validation

The audit validator fails on any unmapped dialogue or step, unapproved profile, missing placement, missing cast/media ownership, duplicate effects owner, canonical choice-count drift, unexplained offscreen speaker, full-body overlay over moving video, active-choice speaker card, normal-dialogue scrolling, accidental full-width fallback, arbitrary center fallback, or segment-capacity overflow.

Current validator result: **PASS with zero errors**.
