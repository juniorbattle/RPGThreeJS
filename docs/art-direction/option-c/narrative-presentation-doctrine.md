# Narrative Presentation Doctrine — Option C Phase 4C-GLM.3

Status: **FINAL STRUCTURAL LOCK BEFORE ART PRODUCTION**
Authority: This document is the single authoritative reference for the narrative presentation doctrine.
Machine contract: `src/cinematics/NarrativePresentationDoctrine.ts`
Runtime authority: `src/cinematics/NarrativePresentationDoctrine.ts`

---

## 0. Purpose

This doctrine formalizes the already-approved narrative presentation rules into repository documentation, machine-readable metadata, and validators. It does NOT redesign the runtime. It makes the approved doctrine explicit, deterministic, and difficult to accidentally violate during Codex / GPT Image / MiniMax production.

The existing runtime presentation system (`ResolvedPresentationBeat`, `NarrativePresentationMode`, `CinematicReductionPolicy`, `NarrativeStage`, `JourneySession`) remains the runtime execution layer. This doctrine adds the **planning-layer contract** that classifies each beat's narrative role, cinematic requirement, cinematic tier, cinematic placement, and combat outcome.

---

## 1. Locked Narrative Presentation Doctrine

### STATIC_TABLEAU
- **Role**: Primary narrative mode. Carries the majority of dialogues and choices.
- **Staging**: Rich animated staging with runtime-owned actors. Stage composition evolves during the dialogue.
- **Vocabulary**: actor stage-in, stage-out, slide, fade, speaker activation, listener dimming, facing change, runtime mirroring, repositioning, composition change, 1/2/3/4-actor staging, light animation / idle motion, background atmospheric motion, dialogue-card transitions.
- **Constraint**: Do NOT create excessive bespoke animation architecture. Reuse existing staging/runtime capabilities.

### CINEMATIC_VIDEO / MAJOR
- **Role**: Major narrative moments — openings, major revelations, major transitions, major confrontations, major conclusions.
- **Constraint**: Does NOT carry normal interactive dialogue.

### CINEMATIC_VIDEO / QUICK
- **Role**: Short visual punctuation — brief action, dramatic reveal, transition, impact moment.
- **Classification**: Subtype of CINEMATIC_VIDEO. NOT an independent runtime mode.
- **Use cases**: brief reveal, impact action, character arrival, environment reveal, threat appearance, short transition, short dramatic punctuation.
- **Constraint**: Do NOT assign QUICK automatically to every secondary event. Do NOT generate any QUICK cinematic now.

### CINEMATIC_HOLD
- **Role**: Atmospheric punctuation, contemplative visual beat.
- **Constraints**: NO dialogue. NO choice.
- **Preservation**: Preserve as a separate existing runtime mode. Do not convert HOLD into QUICK_VIDEO automatically.

### TRAVEL_STILL
- **Role**: Journey / connective presentation. Living environment.
- **Constraints**: NO free-roam. NO player-controlled exploration. Do not redesign Travel.

### COMBAT
- **Role**: May result from a narrative event. REQUIRED or CONDITIONAL.
- **Coexistence**: Can coexist with cinematic/tableau presentation around it. Not mutually exclusive with narrative presentation.

---

## 2. Static Tableau Is The Main Interactive Language

STATIC_TABLEAU must NOT be interpreted as "one static image with text on top." It represents a staged narrative presentation system.

Supported presentation vocabulary (preserved or exposed via existing runtime):
- actor stage-in / stage-out
- slide / fade
- speaker activation
- listener dimming
- facing change
- runtime mirroring
- repositioning
- composition change
- 1-actor / 2-actor / 3-actor / 4-actor staging
- light animation / idle motion
- background atmospheric motion where supported
- dialogue-card transitions

Do NOT create excessive bespoke animation architecture. Reuse existing staging/runtime capabilities.

---

## 3. Absolute Interaction Invariants

```
DIALOGUE_STEPS_ON_VIDEO = 0
DIALOGUE_STEPS_ON_HOLD = 0
CHOICE_STEPS_ON_HOLD = 0
```

Normal interactive dialogue and choices belong to STATIC_TABLEAU. Cinematic video may precede or follow that interaction.

These invariants are enforced by the existing runtime:
- `RuntimePresentationStepCensus.ts` — rejects plans where `normalDialogueDuringVideo !== 0`, `dialogueStepsOnHold !== 0`, or `choiceStepsOnHold !== 0`.
- `NarrativeStagingAudit.ts` — validates staging against tableau grammar.

---

## 4. Event Presentation Is Compositional

An event is NOT modeled as having only one presentation type. An event may contain several layers:

```
EVENT
├── INTERACTIVE_PRESENTATION
├── CINEMATIC_PRESENTATION
└── COMBAT_OUTCOME
```

The semantic model (implemented in `NarrativePresentationDefinition`):

| Field | Values |
|---|---|
| `primaryInteractiveMode` | `STATIC_TABLEAU` \| `TRAVEL_STILL` \| `NONE` |
| `mainEvent` | `boolean` |
| `cinematicRequirement` | `NONE` \| `OPTIONAL` \| `REQUIRED` |
| `cinematicTier` | `NONE` \| `QUICK` \| `MAJOR` \| `TBD` |
| `cinematicPlacement` | `TBD` \| `BEFORE` \| `AFTER` \| `BOTH` |
| `combatOutcome` | `NONE` \| `CONDITIONAL` \| `REQUIRED` |
| `combatTrigger` | `string?` — semantic reference to combat ID(s) |
| `notes` | `string?` |

---

## 5. Primary Interactive Mode

Supported values: `STATIC_TABLEAU` | `TRAVEL_STILL` | `NONE`

`CINEMATIC_VIDEO` is NOT a valid `primaryInteractiveMode`. Video may precede or follow interaction, never host it.

---

## 6. Cinematic Requirement

Supported values: `NONE` | `OPTIONAL` | `REQUIRED`

Locked rules:
- **PROLOGUE** → `CINEMATIC_REQUIRED`
- **EPILOGUE** → `CINEMATIC_REQUIRED`
- **MAIN_EVENT** → `CINEMATIC_REQUIRED` (strictly enforced — OPTIONAL is NOT valid)

Secondary events do NOT automatically require video.

---

## 7. Cinematic Tier

Supported values: `NONE` | `QUICK` | `MAJOR` | `TBD`

- `QUICK` is a production classification of `CINEMATIC_VIDEO`. It is NOT a new runtime presentation mode.
- `MAJOR` is reserved for the strongest narrative moments.
- `TBD` is a valid state — exact tier may remain undecided until artistic production.
- Do NOT decide every video's tier during this mission unless already explicitly established.

---

## 8. Cinematic Placement

Supported values: `TBD` | `BEFORE` | `AFTER` | `BOTH`

- Placement for most main-event cinematics is intentionally NOT decided now.
- `TBD` is a valid state.
- Do NOT infer placement merely from current runtime ordering.
- Only `BEFORE` / `AFTER` / `BOTH` values backed by an existing, explicit, previously approved project decision (e.g. `VideoCinematicTriggers`) are locked. All others are `TBD`.
- Current priority: `CINEMATIC_REQUIRED = known`. Exact placement = later artistic/cinematic production decision.

---

## 9. Combat Outcome

Supported values: `NONE` | `CONDITIONAL` | `REQUIRED`

- `CONDITIONAL` combat may result from: dialogue choice, negative decision, failed contest, route state, reputation state, narrative consequence, or other existing deterministic game state.
- Do NOT invent new combats. Only model actual existing combat routes and leave future-compatible structure.

---

## 10. Valid Event Flow Examples

**Valid:**
```
CINEMATIC_VIDEO / MAJOR → transition → STATIC_TABLEAU → dialogue / choice
```

**Valid:**
```
STATIC_TABLEAU → dialogue / choice → CINEMATIC_VIDEO / QUICK
```

**Valid:**
```
CINEMATIC_VIDEO → STATIC_TABLEAU → choice
    ├── narrative resolution
    └── combat
         ↓
       aftermath
```

**Valid:**
```
TRAVEL_STILL → CINEMATIC_VIDEO / QUICK → STATIC_TABLEAU
```

**Invalid:**
```
CINEMATIC_VIDEO + normal dialogue overlay
```

**Invalid:**
```
CINEMATIC_HOLD + dialogue
```

**Invalid:**
```
CINEMATIC_HOLD + choice
```

---

## 11. Prologue / Epilogue

```
PROLOGUE
  MAIN_EVENT = YES
  CINEMATIC_REQUIREMENT = REQUIRED

EPILOGUE
  MAIN_EVENT = YES
  CINEMATIC_REQUIREMENT = REQUIRED
```

Exact placement / duration / generation method remains TBD.

---

## 12. Main Events

Every event classified by project narrative truth as a `MAIN_EVENT` must have `CINEMATIC_REQUIREMENT = REQUIRED`.

This does NOT mean "replace the event with video." It means the event receives a cinematic layer somewhere in its presentation. STATIC_TABLEAU remains the primary interactive dialogue/choice surface.

---

## 13. Do Not Over-Classify

This mission is NOT for deciding:
- exact cinematic duration
- exact video placement
- camera direction
- shot composition
- keyframes
- MiniMax motion prompts
- character animation inside generated video
- exact transition timing
- final lighting
- final environment plates

Those belong to later artistic production. Use `TBD` where appropriate.

---

## 14. Demo Scope Preservation

Preserve the current demo production priorities:

### P0 Core Party (Codex P0 Active Batch)
- **Kestrel** = `GOLD_REFERENCE` = `NO_REGENERATION`
- **Alistair** = `ART_PENDING_CODEX`
- **Marian** = `ART_PENDING_CODEX`
- **Elara** = `ART_PENDING_CODEX`

### P1 Conditional Recruits (Codex P1 Deferred Batch)
- **Cedric**
- **Garen**

### Deferred Post-Demo
- Morvan, Aldric, Lyra, Eldwin, Talon, Gunnar

Do NOT expand current character production scope.

---

## 15. Enemy Status

```
EXISTING_ART_PENDING_VISUAL_REVIEW
```

for demo enemies unless already explicitly approved. Do NOT regenerate enemies now.

---

## 16. Environment Status

- **Forest Road** = `GOLD_REFERENCE`
- **Bois-Clair burning** = `ART_PENDING`
- **Lion Sanctum** = `ART_PENDING`

No environment generation now.

---

## 17. Artistic Pipeline Boundary

This is the final structural mission before visual production. After operator approval, artistic production will handle:
- character generation/refinement
- environment generation/refinement
- spritesheets
- runtime character placement
- runtime scale tuning
- background integration
- cinematic keyframes
- cinematic video generation
- final visual QA

Do NOT perform these tasks in this mission.

---

## 18. Future Generation Tooling

Later production may use GPT Image generation workflow and MiniMax video generation workflow.

Do not fabricate model provenance. When future generation tooling does not expose an exact model identifier:
```
MODEL_PROVENANCE = UNKNOWN
```
Record the actual provider/tool metadata that is available.

---

## 19. Validation Rules

The doctrine contract (`NarrativePresentationDoctrine.ts`) enforces:

1. `MAIN_EVENT` → `cinematicRequirement` MUST equal `REQUIRED` (strictly enforced — OPTIONAL is NOT valid)
2. `PROLOGUE` → `cinematicRequirement = REQUIRED`
3. `EPILOGUE` → `cinematicRequirement = REQUIRED`
4. `STATIC_TABLEAU` → dialogue allowed (no restriction)
5. `CINEMATIC_VIDEO` → normal dialogue forbidden (enforced by runtime)
6. `CINEMATIC_HOLD` → dialogue forbidden, choices forbidden (enforced by runtime)
7. `COMBAT_OUTCOME = CONDITIONAL` → must not imply combat always occurs
8. `TBD` cinematic placement → valid state
9. `QUICK` → treated as `CINEMATIC_VIDEO` production subtype, not independent dialogue surface
10. `primaryInteractiveMode` must never be `CINEMATIC_VIDEO` (enforced by type system)

---

## 20. Relationship To Existing Runtime

This doctrine is a **planning-layer contract**. It complements (not replaces) the existing runtime presentation system:

| Existing Runtime | Doctrine Layer |
|---|---|
| `ResolvedPresentationBeat.mode` | `NarrativePresentationDefinition.primaryInteractiveMode` (subset) |
| `ResolvedPresentationBeat.hasDialogue` | Doctrine does not override — runtime enforces |
| `CinematicReductionPolicy` | `NarrativePresentationDefinition.cinematicRequirement` + `cinematicTier` |
| `VideoCinematicTrigger` | `NarrativePresentationDefinition.cinematicPlacement` |
| `startCombat` effects | `NarrativePresentationDefinition.combatOutcome` |
| `RuntimePresentationStepCensus` | `DOCTRINE_INVARIANTS` (restated) |
| `NarrativeStagingAudit` | Runtime enforces staging; doctrine declares intent |

The doctrine registry references `beatId` values from `FINAL_PRESENTATION_BEATS`. Each beat gets exactly one doctrine definition.
