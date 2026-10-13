/**
 * Strict TypeScript entry point for the combat page.
 *
 * The historical imperative renderer remains isolated in a JavaScript runtime
 * while all data crossing the campaign/combat boundary is validated and typed
 * by protocol.ts, deploymentRules.ts and UnitFocusController.ts.
 */
import './legacyCombatRuntime.js';
