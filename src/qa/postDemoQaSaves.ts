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

/**
 * A finished Dragon to play the Scorpion from, played by the QA driver from the matching Bear end: honour (every merit,
 * the Chaman des Ombres fallen, the altar's shard sealed) or force (the Crystal kept, the Seal taken from Kaelen). DEV QA only.
 */
export async function loadDragonEndForScorpionQa(route: 'honour' | 'force'): Promise<GameState> {
  const { playPlateau } = await import('./plateauDriver');
  const bearEnd = await loadBearEndForDragonQa(route);
  return playPlateau('dragon', bearEnd, route === 'honour'
    ? { name: 'QA Dragon honour', prefer: 'merit', intent: 'claim_recognition', guardianChests: ['dragon-poi-terrace-cache', 'dragon-poi-peak-reserve'],
      forks: { 'dragon-second-trial': 'combat', 'dragon-final-trial': 'combat' } }
    : { name: 'QA Dragon force', prefer: 'greed', intent: 'claim_recognition',
      answers: { dragon_wolf_envoy: 'dragonWolfOfferRefused', dragon_wolf_lair: 'dragonCrystalKept' } }).state;
}

/**
 * A finished Scorpion to play the final act from, played by the QA driver from the matching Dragon end: honour (every
 * merit, the Prophète des Ombres fallen, the soiled page sealed) or force (the codex kept, the Seal taken from the Grand
 * Inquisiteur). DEV QA only.
 */
export async function loadScorpionEndForFinaleQa(route: 'honour' | 'force'): Promise<GameState> {
  const { playPlateau } = await import('./plateauDriver');
  const dragonEnd = await loadDragonEndForScorpionQa(route);
  return playPlateau('scorpion', dragonEnd, route === 'honour'
    ? { name: 'QA Scorpion honour', prefer: 'merit', intent: 'claim_recognition', guardianChests: ['scorpion-poi-ruin-cache', 'scorpion-poi-sanctum-reserve'] }
    : { name: 'QA Scorpion force', prefer: 'greed', intent: 'claim_recognition',
      answers: { scorpion_phoenix_faithful: 'scorpionOathRefused', scorpion_phoenix_temple: 'scorpionCodexKept' } }).state;
}

/**
 * Post-demo Lot 5 (DRAFT endings): a complete campaign played by the QA driver, stopped at the start of its ending's
 * epilogue, just after the act's closing scene: Respect (four honour outcomes), Fear (four force outcomes) or Balance
 * (two and two). The ending is the one RunSystem recorded; only the epilogue's own steps are left to play. DEV QA only.
 */
export async function loadEpilogueStartQa(ending: 'respect' | 'fear' | 'balance'): Promise<GameState> {
  const { playBearPlateau } = await import('./bearPlateauDriver');
  const { playPlateau } = await import('./plateauDriver');
  const honour = { prefer: 'merit', intent: 'claim_recognition' } as const;
  const force = { prefer: 'greed', intent: 'request_trial' } as const;
  const [lion, bear, dragon, scorpion] = ending === 'respect' ? ['honour', honour, honour, honour] as const
    : ending === 'fear' ? ['force', force, force, force] as const : ['honour', honour, force, force] as const;
  const afterBear = playBearPlateau(await loadLionEndForBearQa(lion), { name: 'QA Bear', ...bear }).state;
  const afterDragon = playPlateau('dragon', afterBear, { name: 'QA Dragon', ...dragon,
    ...(dragon === honour ? { forks: { 'dragon-second-trial': 'combat' as const, 'dragon-final-trial': 'combat' as const } } : {}) }).state;
  const afterScorpion = playPlateau('scorpion', afterDragon, { name: 'QA Scorpion', ...scorpion }).state;
  const state = playPlateau('finale', afterScorpion, { name: 'QA finale', prefer: ending === 'fear' ? 'greed' : 'merit', intent: 'claim_recognition' }, 20261111).state;
  // Back to the moment the act's closing scene ended: the ending recorded, its epilogue not yet played.
  state.campaign!.finalAct.stage = 'epilogue';
  state.endingId = 'finale-breach';
  for (const key of ['finaleFearLastStand', 'finaleFearFateAccepted', 'finaleLastStandWon']) delete state.flags[key];
  return state;
}
