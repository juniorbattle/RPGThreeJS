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

/** Region and role are authored metadata, independent of graph depth and live eligibility. */
export type LionPoiRole = 'primary' | 'structuring' | 'secondary';
export type LionPoiParticipation = 'required' | 'optional' | 'alternative';
export interface LionPoiMetadata {region:0|1|2;role:LionPoiRole;participation:LionPoiParticipation}
export const LION_POI_METADATA: Readonly<Record<string,LionPoiMetadata>> = Object.freeze({
  'lion-camp':{region:0,role:'primary',participation:'required'},
  'lion-audience':{region:0,role:'primary',participation:'required'},
  'lion-opening-ambush':{region:0,role:'structuring',participation:'required'},
  'lion-nomad-crossroads':{region:0,role:'structuring',participation:'required'},
  'lion-refugees':{region:0,role:'secondary',participation:'optional'},
  'lion-first-trial-event':{region:0,role:'secondary',participation:'alternative'},
  'lion-first-trial-combat':{region:0,role:'secondary',participation:'alternative'},
  'lion-first-refuge':{region:0,role:'primary',participation:'required'},
  'lion-reserve-trail':{region:1,role:'structuring',participation:'required'},
  'lion-valmir-road':{region:1,role:'structuring',participation:'required'},
  'lion-second-trial-event':{region:1,role:'secondary',participation:'alternative'},
  'lion-second-trial-combat':{region:1,role:'secondary',participation:'alternative'},
  'lion-village-choice':{region:1,role:'primary',participation:'required'},
  'lion-second-refuge':{region:1,role:'primary',participation:'required'},
  'lion-lancer-recruit':{region:2,role:'structuring',participation:'required'},
  'lion-witnesses':{region:2,role:'structuring',participation:'required'},
  'lion-final-trial-event':{region:2,role:'secondary',participation:'alternative'},
  'lion-final-trial-combat':{region:2,role:'secondary',participation:'alternative'},
  'lion-shadow-signs':{region:2,role:'primary',participation:'required'},
  'lion-final-refuge':{region:2,role:'primary',participation:'required'},
  'lion-final-judgement':{region:2,role:'primary',participation:'required'},
});

export function lionPoiRegion(nodeId:string):0|1|2 {return LION_POI_METADATA[nodeId]?.region??0;}
