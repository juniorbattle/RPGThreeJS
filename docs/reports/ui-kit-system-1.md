# UI-KIT-SYSTEM-1

## Mission and baseline

Build one reusable premium fantasy UI family from the approved campaign direction while keeping gameplay scenery dominant. Work began from clean `main` at `7ac6debae88d161b6b73cda90397065772c662e9` on the single branch `ui-kit-system-1`. The supplied UI-KIT-SYSTEM-1 board was the visual contract.

## Architecture audit

The repository already had `src/ui/design-system/CampaignUi.ts`, `campaign-ui.css`, and `frame-corner.svg`. Its five SVG icons and frame helper were consumed by CampaignStatusHud, the Journey departure panel, and Traversal Next Stop and encounter panel. The button classes were partly used, but there were no typed button, badge, divider, or typography helpers and only five canonical icon IDs. Existing production CSS deliberately constrained the four campaign surfaces, so the kit extends these files and keeps the per-surface compact measurements.

## Kit introduced and reused

- **Typography:** eight reusable `campaign-ui-type--*` roles for display, title, compact title, eyebrow, value, body, metadata, and button. Alegreya is the title family, Source Sans 3 the data and body family. The roles specify weight, line height, tracking, and casing.
- **Spacing:** six CSS tokens, `--ui-space-1/2/3/4/6/8` = 4/8/12/16/24/32 px. Consumers keep their established compact dimensions.
- **Frames:** the existing `decorateCampaignFrame` now resolves compact, standard, and hero with one shared corner asset and density-specific border emphasis and corner size. Re-decoration is idempotent.
- **Icons:** the five existing IDs remain available. Seven authored SVG paths add danger, combat, reward, rest, clan, inventory, and upgrade, yielding 12 typed IDs on a shared 32 px grid. Icons are decorative by default and can receive an explicit accessible label.
- **Buttons:** `decorateCampaignButton` supplies primary, secondary, disabled, and danger classes and actual disabled state for the disabled variant. CSS covers default, hover, pressed, focus-visible, and disabled states. Primary is compact navy and gold; danger uses a restrained red surface and explicit action text.
- **Badges:** `createCampaignBadge` provides optional, danger, reputation, new, and merchant variants with an optional decorative icon.
- **Ornaments:** the existing authored `frame-corner.svg` remains the shared corner asset. `createCampaignDivider` provides horizontal, compact horizontal, vertical, diamond, and terminal forms. Frame corner scale supplies compact, standard, and hero ornaments without duplicate SVG.

No new runtime dependency, framework, game state, or save hook was introduced. `tools/ui-kit-system-1-gallery.html` and its TypeScript renderer are dev-only and absent from Vite's production entry points.

## Production consumers

- CampaignStatusHud retains its movable, read-only ownership and state selector, gold, reputation, optional route-gold line, and absence of gems. It now marks title, numeric, and metadata roles.
- Traversal Next Stop retains destination and distance updates and the compact frame and destination icon. It now marks canonical text roles.
- Journey departure retains `DÉPART / VERS [destination] / PRENDRE LA ROUTE`, continuation behavior, hero frame, and compact 430 × 110 browser bounds. Its action now uses the canonical primary button.
- Traversal optional encounter retains its existing content and confirm/ignore callbacks, standard frame, merchant icon, and ~420 × 110 desktop bounds. Its buttons now use the typed helper.

## Accessibility and input

All actions remain semantic buttons. The disabled variant sets the real `disabled` property; production interaction disabled states remain controlled by their existing logic. Focus-visible uses a high-contrast outline. Decorative icons and ornaments are hidden from accessible names; an icon can be explicitly labeled when it carries meaning.

## Validation

- Focused UI, Journey, and Traversal: **5 files, 33 tests passed**.
- Full Vitest: **150 files, 2,513 tests passed; zero failures**. This includes the historical CIN-6E-A and CasterMotionBackCompat guards; no allowlist or protected test was changed.
- TypeScript: `node_modules/.bin/tsc.cmd --noEmit` passed.
- Production Vite build: passed, 160 modules transformed. Vite reported its existing large-chunk advisory.
- `git diff --check`: passed.
- Global `npx` could not launch because the local global npm path lacks `npx-cli.js`; validation used the installed repository binaries directly.

## Browser QA and captures

Run `node tools/ui-kit-system-1-qa.mjs` to recreate the dev gallery and real-scene proof in `docs/reports/ui-kit-system-1-browser/`. The script checks fonts, 12 icons, three frames, five badges, six button samples, no page errors, viewport fit, no HUD/panel overlaps, no horizontal or encounter text overflow, route-gold display, departure continuation, and merchant Ignore returning to Traversal. All checks passed at **1440 × 810**, **620 × 780**, and **390 × 844**. Browser bounds for the real production surfaces are recorded in `browser-qa.json`. Screenshots were inspected after a gallery-only overflow and example alignment correction.

Captures: `gallery-desktop.png`, `gallery-narrow.png`, `gallery-mobile.png`, `departure-1440.png`, `traversal-normal-1440.png`, `merchant-1440.png`, `merchant-narrow.png`, `merchant-mobile.png`, `hud-route-gold.png`.

## Files changed

Modified: `src/ui/design-system/CampaignUi.ts`, `src/ui/design-system/campaign-ui.css`, `src/ui/CampaignStatusHud.ts`, `src/cinematics/JourneyOverlay.ts`, `src/traversal/TraversalT0Scene.ts`, `src/styles/app.css`, `src/styles/traversal.css`.

Added: `src/ui/design-system/CampaignUi.test.ts`, `tools/ui-kit-system-1-gallery.html`, `tools/ui-kit-system-1-gallery.ts`, `tools/ui-kit-system-1-qa.mjs`, this report, and the ten browser QA files listed above (JSON plus nine PNGs).

## Explicit non-goals and next adoption

No campaign topology, RunSystem authority, save schema, traversal gate or route choice, optional consequence semantics, combat or merchant mechanics, narrative content or sequencing, refuge rules, CharacterVisualRegistry authority, camera, or world/background art changed.

Recommended adoption order: (1) Dialogue UI: frames, title/body roles, dialogue icon, dividers, buttons; (2) Combat HUD: compact frames, numeric roles, danger/combat/reward icons, badges; (3) Refuge and management: standard frames, clan/rest icons, badges; (4) Inventory and upgrade: compact frames, inventory/upgrade icons, value roles; (5) Notifications and contextual feedback: badges, icons, compact divider; (6) Secondary menus: standard frames, button states, typography.
