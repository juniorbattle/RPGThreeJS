/**
 * Strict TypeScript entry point for the combat page.
 *
 * The historical imperative renderer remains isolated in a JavaScript runtime
 * while all data crossing the campaign/combat boundary is validated and typed
 * by protocol.ts, deploymentRules.ts and UnitFocusController.ts.
 */
import './legacyCombatRuntime.js';
import { installGamepadNavigator } from '../ui/GamepadNavigator';
import { initLanguage } from '../i18n/i18n';

// OD-2026-11-15-C: the frame reads the same stored language and borrows the parent's catalog, so a fight opens in
// the language chosen before it; a change during the fight applies to the next one.
void initLanguage();

// OD-2026-11-05-A: the combat frame reads the controller itself while it holds focus.
const gamepad = installGamepadNavigator(window);
window.addEventListener('pagehide', () => gamepad?.dispose(), { once: true });
