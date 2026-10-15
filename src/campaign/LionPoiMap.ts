import {lionPoiRegion} from './LionPoiTopology';
export const LION_POI_REGIONS = Object.freeze([
  {shortTitle:'I · Le Lion',title:'Du Camp au Refuge du Lion',image:'/assets/generated/lion-phase/poi-v2/lion-opening.png'},
  {shortTitle:'II · Bois-Clair',title:'La vallée de Bois-Clair',image:'/assets/generated/lion-phase/poi-v2/bois-clair.png'},
  {shortTitle:'III · Le Sceau',title:'Les témoins et le jugement',image:'/assets/generated/lion-phase/poi-v2/judgement.png'},
]);
/** Authored layout only. RunSystem/campaign own connections and live eligibility. */
export const LION_POI_POSITIONS: Readonly<Record<string, readonly [number, number]>> = {
  'lion-camp': [80, 410], 'lion-audience': [205, 255], 'lion-opening-ambush': [310, 365],
  'lion-nomad-crossroads': [440, 280], 'lion-refugees': [470, 115],
  'lion-first-trial-event': [665, 170], 'lion-first-trial-combat': [670, 385],
  'lion-first-refuge': [840, 300], 'lion-reserve-trail': [175, 240],
  'lion-valmir-road': [300, 390], 'lion-second-trial-event': [490, 155],
  'lion-second-trial-combat': [530, 425], 'lion-village-choice': [730, 260],
  'lion-second-refuge': [845, 140], 'lion-lancer-recruit': [150, 370],
  'lion-witnesses': [285, 255], 'lion-final-trial-event': [375, 115],
  'lion-final-trial-combat': [530, 410], 'lion-shadow-signs': [650, 250],
  'lion-final-refuge': [740, 375], 'lion-final-judgement': [850, 180],
};

export function lionPoiMapPhase(nodeId: string): number { return lionPoiRegion(nodeId); }
