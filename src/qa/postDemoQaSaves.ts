/**
 * Set 1.20.0, post-demo QA (DEV only): genuine demo saves whose Lion chronicle ended, to play the Bear without replaying
 * the Lion. The demo saves carry the demo's reputation; the QA start sets it where a post-demo Lion would leave it
 * under the approved calibration (OD-2026-11-08-A): 57 after an honour run (30 + its sure +27), 35 after a force run.
 * Loaded lazily, so no fixture reaches a production chunk that the game loads.
 */
import { migrateState } from '../game/store';
import type { GameState } from '../game/types';

export const POST_DEMO_QA_LION_END_REPUTATION = Object.freeze({ honour: 57, force: 35 });

export async function loadLionEndForBearQa(route: 'honour' | 'force'): Promise<GameState> {
  const fixture = route === 'honour'
    ? (await import('../game/__fixtures__/demo-v6-lion-honour-complete.json')).default
    : (await import('../game/__fixtures__/demo-v6-lion-force-complete.json')).default;
  const state = migrateState(structuredClone(fixture));
  state.reputation = POST_DEMO_QA_LION_END_REPUTATION[route];
  return state;
}

/**
 * A finished Bear to play the Dragon from, played by the QA driver from the matching Lion end: honour (every merit, the
 * Master Spy fallen, the dark ore sealed) or force (the dark ore seized, the Seal taken from Borin). DEV QA only.
 */
export async function loadBearEndForDragonQa(route: 'honour' | 'force'): Promise<GameState> {
  const { playBearPlateau } = await import('./bearPlateauDriver');
  const lionEnd = await loadLionEndForBearQa(route);
  return playBearPlateau(lionEnd, route === 'honour'
    ? { name: 'QA Bear honour', prefer: 'merit', intent: 'claim_recognition', guardianChests: ['bear-poi-mine-lift-cache', 'bear-poi-depths-reserve'] }
    : { name: 'QA Bear force', prefer: 'greed', intent: 'claim_recognition',
      answers: { bear_raven_messenger: 'bearRavenOfferRefused', bear_sacred_mines: 'bearMinesSeized' } }).state;
}
