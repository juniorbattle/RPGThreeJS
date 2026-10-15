/** Authored map layout only. IDs/topology/content remain owned by the existing campaign graph. */
export const LION_POI_POSITIONS: Readonly<Record<string, readonly [number, number]>> = {
  'lion-camp': [80, 410], 'lion-audience': [190, 325], 'lion-opening-ambush': [310, 365],
  'lion-nomad-crossroads': [440, 280], 'lion-refugees': [470, 115],
  'lion-first-trial-event': [650, 170], 'lion-first-trial-combat': [650, 410],
  'lion-first-refuge': [840, 300], 'lion-reserve-trail': [145, 330],
  'lion-valmir-road': [320, 240], 'lion-second-trial-event': [490, 145],
  'lion-second-trial-combat': [500, 385], 'lion-village-choice': [675, 270],
  'lion-second-refuge': [830, 325], 'lion-lancer-recruit': [135, 370],
  'lion-witnesses': [310, 285], 'lion-final-trial-event': [475, 170],
  'lion-final-trial-combat': [490, 400], 'lion-shadow-signs': [645, 270],
  'lion-final-refuge': [750, 340], 'lion-final-judgement': [850, 200],
};

export function lionPoiMapPhase(depth: number): number { return depth <= 6 ? 0 : depth <= 11 ? 1 : 2; }
