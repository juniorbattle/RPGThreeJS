# CIN-6.7 ThreeUI Pattern Study

## Upstream identity

- Repository: `MengTo/threeui`
- Default branch: `main`
- Inspected upstream HEAD: `68802d5428071ada5c20db8094b1649e6bb770ed`
- Verification: `git ls-remote https://github.com/MengTo/threeui.git HEAD`, followed by a read-only shallow clone at the same SHA outside the RPGThreeJS worktree.
- Package at inspected SHA: `@designcodeio/threeui` `1.2.0`.
- Code license: MIT, Copyright (c) 2026 Meng To.
- No ThreeUI dependency, code bundle, asset, font, or media was added to RPGThreeJS.

## Architecture finding

ThreeUI is a React component catalog. Its package declares React and ReactDOM `>=18 <20` and Three.js `>=0.149 <1` as peer dependencies. The inspected development application uses React 19.2, ReactDOM 19.2, Vite, and multiple aliased Three.js versions for component compatibility.

RPGThreeJS already has a direct TypeScript/DOM/CSS architecture and Three.js `0.160.0`. A React migration or broad ThreeUI installation would add a second UI lifecycle, peer-runtime weight, multiple rendering ownership models, and unnecessary version pressure. CIN-6.7 therefore rejects React, ReactDOM, and the ThreeUI package.

## Patterns inspected

### Animated Top Dock

Upstream files:

- `src/shaders/animated-top-dock/AnimatedTopDock.tsx`
- `src/shaders/animated-top-dock/topDockController.ts`
- `src/shaders/community.css`

Useful observations:

- `AnimatedTopDock.tsx:31-50` centralizes motion parameters.
- `AnimatedTopDock.tsx:104-180` keeps renderer ownership explicit and releases RAF, ResizeObserver, IntersectionObserver, pointer listeners, and renderer resources.
- `AnimatedTopDock.tsx:222-335` keeps controls as semantic buttons with `aria-pressed` and a labelled navigation owner.
- `topDockController.ts:34-56` gates animation for reduced motion, narrow viewports, and non-precision pointers.
- `topDockController.ts:87-188` maps pointer proximity into a bounded spring and writes geometry in one place.
- `topDockController.ts:199-255` gives keyboard focus equivalent behavior and performs complete cleanup.
- `community.css:377-492` uses a compact isolated translucent dock, restrained depth, state attributes, and focus-visible parity.
- `community.css:499-548` collapses to a static compact layout on narrow or reduced-motion surfaces.

### Bestsellers Book Showcase

Upstream file:

- `public/landing-pages/bestsellers-book-showcase.html`

Useful observations:

- Lines 238-313 use stateful card position, restrained hover lift, perspective, and explicit transition groups.
- Lines 599-608 keep detail content passive until the selected state owns interaction.
- Lines 795-880 use a compact action rail/dock separated from primary content.
- Lines 1076-1148 use `data-mode` and selected-state attributes to coordinate composition rather than rebuilding the document.
- Lines 1161-1341 adapt composition at 900 px and 560 px breakpoints.
- Lines 1343-1355 provide an explicit reduced-motion path.

The literal book model, book-opening motion, bright editorial styling, and landing-page product behavior are not suitable for RPGThreeJS.

### Checkpoint control

Upstream file:

- `src/components/CheckpointSliderControl.tsx`

Useful observations:

- Lines 29-35 normalize pointer input into semantic options.
- Lines 57-84 preserve a real range input, `aria-valuetext`, output, arrow keys, Home, and End even though the control has a custom visual surface.

This reinforces the CIN-6.7 rule that spatial presentation is an enhancement over complete textual/keyboard semantics.

### Layer and renderer ownership

Additional inspected examples:

- `src/shaders/koi-studies/KoiStudies.tsx`
- `src/shaders/landing-pages/LandingPages.tsx`
- `src/shaders/typography-vortex/typographyVortexRenderer.ts`
- `src/shaders/temple-night/TempleNightScene.tsx`

They demonstrate isolated render hosts, explicit ready/loading state, bounded pixel ratio, visibility-aware RAF, and cleanup. They also demonstrate why a broad import is inappropriate: several examples are iframe documents or dedicated shader renderers with their own animation loops.

## Patterns adopted

| Upstream concept | RPGThreeJS use | Implementation relationship |
| --- | --- | --- |
| Compact layered dock separated from primary content | NarrativeStage moves Company, Save, and Menu into a small utility layer rather than enlarging route/dialogue cards. | Independent DOM/CSS implementation; no upstream markup, values, icons, or controller code copied. |
| State attributes coordinate visual modes | NarrativeStage and DialogueView expose tableau, beat, media surface, dialogue mode, anchor, and transition through `data-*` state. | Independent implementation using existing RPGThreeJS classes. |
| Restrained card entrance and depth | Speaker cards use a short seven-pixel fade/settle; route cards keep shallow translucent depth. | Independent CSS authored for the existing fantasy visual language. |
| Focus behavior equivalent to pointer behavior | Existing buttons retain focus-visible styling and DOM order; route semantics remain textual. | Existing RPGThreeJS accessibility pattern, reinforced by the study. |
| Responsive `clamp()` composition and static narrow mode | Speaker cards, held dialogue, choices, subtitles, and utility dock adapt at 900/780 and 680 boundaries. | Independent CSS; no ThreeUI breakpoints or declarations copied verbatim. |
| Explicit reduced-motion and lifecycle cleanup | NarrativeStage disables nonessential transitions; existing video/RAF/canvas owners cancel and release on dispose. | Independent implementation composed from CIN-6.5.1 lifecycle primitives. |
| Single active content owner | Narrative media becomes passive while DialogueView owns the modal interaction; agency replaces dialogue rather than competing with it. | Independent architecture derived from RPGThreeJS ownership requirements. |

No substantial upstream code was copied. The adopted material is conceptual and independently reimplemented, so no MIT source block is required in runtime files. This report retains precise attribution and provenance.

## Patterns rejected

- React and ReactDOM migration.
- Installing `@designcodeio/threeui` as a dependency.
- Multiple aliased Three.js runtimes.
- Literal book/page-turn presentation.
- Koi card-stack, holographic foil, neon, product-showcase, or modern SaaS art direction.
- Shader buttons and particle-heavy utility controls.
- A continuous proximity-spring RAF for the three-item campaign utility dock.
- Iframe-hosted UI components inside NarrativeStage.
- ThreeUI fonts, thumbnails, videos, textures, and remote catalog media.
- Any animation that competes with MiniMax media or creates another high-frequency render loop.

## License review

`LICENSE` grants MIT use of code with notice retention for copied or substantial portions. `ASSET-LICENSES.md` states that included ThreeUI-authored Community assets are MIT, bundled Three.js files are MIT, bundled fonts have separate SIL OFL 1.1 terms, and external catalog media is not covered by the repository MIT license. `FONT-LICENSES.md` records the bundled OFL fonts.

CIN-6.7 copies no ThreeUI code or assets and redistributes no ThreeUI font. No third-party notice file is required by the implemented concept-only adaptation. If future work copies a substantial source portion, the Meng To 2026 MIT notice must accompany it. Third-party and remote media require a separate license review and are not authorized by this study.

## Performance conclusion

The useful ThreeUI lesson is disciplined ownership, not visual complexity. CIN-6.7 retains one authoritative cinematic canvas, no added shader canvas, no utility-dock RAF, no duplicate decoder, and no high-frequency layout animation. Transitions are short CSS opacity/transform/clip effects and are removed under reduced motion. Existing requestVideoFrameCallback/RAF cancellation and canvas-memory release remain the governing media lifecycle.
