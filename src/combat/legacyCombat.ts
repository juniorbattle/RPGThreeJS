/**
 * Strict TypeScript entry point for the combat page.
 *
 * The historical imperative renderer remains isolated in a JavaScript runtime
 * while all data crossing the campaign/combat boundary is validated and typed
 * by protocol.ts, deploymentRules.ts and UnitFocusController.ts.
 */
import './legacyCombatRuntime.js';
import { installGamepadNavigator } from '../ui/GamepadNavigator';

// OD-2026-11-05-A: the combat frame reads the controller itself while it holds focus.
const gamepad = installGamepadNavigator(window);
window.addEventListener('pagehide', () => gamepad?.dispose(), { once: true });
