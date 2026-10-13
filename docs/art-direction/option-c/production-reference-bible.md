# Phase 2 — Option C production reference bible

## Reference authority

The six supplied images are archived in `references/` with SHA-256 provenance. They are **directional review references**, not canonical content and not shippable assets.

Authority order for every future generation or manual paintover:

1. current game truth and presentation manifests;
2. canonical character PNG for the exact actor ID;
3. approved visual-family grammar and production media lineage;
4. the supplied Option C references for composition, light, density, and motion language;
5. prompt text.

If a reference label contradicts a canonical asset, the canonical asset wins.

## Reading the supplied references

### `surface-board-a.png`

Use for: strict separation of the five runtime views, compact action title on Combat Stage, dense but readable forest/castle world, navy/gold chrome, and a clear destination card.

Do not copy: French/English mock labels, party/cast names, apparent free-exploration road framing, baked UI, or exact camera geometry.

### `surface-board-b.png`

Use for: the strongest “same game” continuity across travel, tableau, cinematic, tactical, and stage; strong actor/environment color integration; restrained UI footprint; recognizable forest family.

Do not copy: the four-character travel parade, mock brand, or in-image combat UI.

### `surface-board-c.png`

Use for: alternate panel proportions, close two-character tableau staging, cinematic negative space, tactical information grouping, and consistent gold-line ornament.

Do not copy: named lore, character assignments, baked choice buttons, or the tactical camera as an exact implementation spec.

### `motion-lightcaster-reference.png`

Use for: white/gold/blue lightcaster material response, staff silhouette, ground-contact glow, and readable `idle/dash/attack/cast` differentiation.

Canonical warning: the depicted visual identity is closest to canonical **Marian**, despite the board title “Sage Seraphine.” Canonical Séraphine is a separate unmasked adviser with a lantern staff. This board must never be used to overwrite Séraphine’s face, costume, or role.

### `motion-armored-vanguard-reference.png`

Use for: heavy armored silhouette, red-cloth motion arcs, broad anticipation, and clean sword-attack follow-through.

Canonical warning: the depicted identity is closest to canonical **Alistair**, despite the board title “Marian.” Canonical Marian is the white/gold masked lightcaster. Treat the text label as non-authoritative.

### `motion-kestrel-reference.png`

Use for: high-confidence Kestrel silhouette, green hood and cloth mask, bow/quiver continuity, leaf-shaped motion language, and pose separation. Still validate every generated face/mask, bow limb, string, arrow, quiver, hand, and foot against `kestrel.png`.

## Option C visual DNA

### Shape and silhouette

- Characters read at 10–15% viewport height in tactical play and 45–70% in tableau/stage.
- Each hero keeps one dominant silhouette cue and one weapon cue.
- Effects support the action arc but never erase hands, weapon endpoints, or face/mask identity.
- Small enemies use compact value blocks; bosses use proportion and footprint, not excess micro-detail.

### Rendering

- HD-2D / pixel-art stylized modern: deliberate pixel-like clusters in edges and materials, supported by high-resolution lighting and atmospheric depth.
- Controlled outlines: darkest on silhouette breaks, colored and lighter inside forms.
- Materials: cloth matte, metal selective, wet ground reflective only where the family requires it.
- Avoid glossy 3D-render smoothness, watercolor softness, photoreal texture noise, and a pasted transparent-character look.

### Palette and light

- Base UI/world frame: deep ink navy and restrained warm gold.
- Each family adds one dominant environmental hue and one accent.
- Actor light direction must match the plate; add rim light only when motivated by the scene.
- Protect faces/masks and weapons from black crush.

### Grounding and depth

- Every actor has an explicit foot/baseline and a soft contact shadow.
- Tableau and stage plates reserve a continuous midground strip for feet and VFX anchors.
- Foreground elements may frame, but never hide interactive actors or targets.
- Atmospheric depth separates planes without desaturating characters into the background.

## Prompt-ready global contract

Use this invariant block for future image production:

> Production asset for a premium tactical RPG in a modern stylized HD-2D / pixel-art language. Preserve the supplied canonical character or environment identity exactly. Strong readable silhouettes, controlled pixel clusters, tactile cloth/stone/timber, selective metal highlights, three clear depth planes, dramatic but legible light, and a restrained deep-navy/warm-gold family frame. Build for the specified runtime camera and UI safe zones. No baked text, logo, frame, button, HUD, watermark, duplicate actor, extra weapon, missing mask, costume redesign, generic anime face, photorealism, smooth 3D render, collage look, or unrelated background style.

Surface-specific suffixes:

- Travel: `character-free 16:9 transition still; destination geography unmistakable; no controllable-avatar staging; lower-right destination-card safe zone; route decision left/right only when the manifest requires it`.
- Tableau background: `character-free environment plate; five actor lanes; continuous ground band; dialogue safe band above actors; choice safe band below; foreground occlusion only at extreme edges`.
- Tactical combat: `match existing perspective camera and grid footprint; readable walkable tiles; center action space clear; top turn-order and side HUD safe zones; no baked units or effects`.
- Combat Stage: `frontal orthographic-feeling shot; attacker lane left, target lane right, impact corridor center; large feet-safe ground strip; top-center title safe zone; no baked actors or VFX`.
- Character pose: `transparent delivery; exact canonical silhouette, palette, face/mask, costume, weapon and accessories; consistent body scale, baseline and pivot; one unambiguous action; no background or text`.

## Animation reference contract

The first production reference set should contain four actions per character:

| Action | Read at first frame | Motion requirement | End-state requirement |
|---|---|---|---|
| Idle | combat-ready identity | subtle breathing/cloth; weapon stable | perfect loop; feet fixed |
| Dash | committed travel direction | one readable lean; controlled cloth trail | recoverable to idle/attack pivot |
| Attack | weapon anticipation | single strong arc; contact frame readable | no weapon/limb duplication |
| Cast/skill | class fantasy | energy originates from canonical hand/weapon | VFX-safe silhouette and clean recovery |

Per-frame production rules:

- identical canvas and pivot conventions within a set;
- no identity drift between frames;
- feet or virtual airborne anchor declared explicitly;
- animation pixels and combat VFX remain separate assets;
- provide contact sheet, dark-background sheet, per-frame alpha bounds, baseline report, duplicate-frame check, and human review status.

## Reference gaps

The supplied set is strong enough to lock the family direction and begin one pilot. It is not enough to mass-produce:

- no canonical animation board yet exists for Elara, NPCs, generic enemies, bosses, or non-humanoid monsters;
- the moodboards do not prove 1920×1080 crops or actual runtime safe zones;
- baked mock UI cannot be sampled as production pixels;
- no reference resolves every one of the 13 environment families.

These gaps are intentional phase-4/5 work, gated by human approval.
