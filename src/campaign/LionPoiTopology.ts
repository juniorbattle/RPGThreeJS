/** Authored campaign geography; RunSystem validates every edge and causal gate.
 * The directed RunGraph remains unchanged for old V6 recovery. No layout is saved. */
export const LION_OPENING_LOCAL_ROUTES = Object.freeze([
  {from:'lion-nomad-crossroads',to:'lion-first-trial-event'},
  {from:'lion-nomad-crossroads',to:'lion-first-trial-combat'},
]);
export const LION_OPENING_REQUIRED = Object.freeze([
  'lion-audience','lion-opening-ambush','lion-nomad-crossroads',
]);
export const LION_FIRST_TRIAL = Object.freeze(['lion-first-trial-event','lion-first-trial-combat']);

export function openingLocalRoutesUnlocked(resolved: readonly string[]): boolean {
  return LION_OPENING_REQUIRED.every(id=>resolved.includes(id));
}
