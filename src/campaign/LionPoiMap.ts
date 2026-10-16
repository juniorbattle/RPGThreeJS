import {lionPoiRegion} from './LionPoiTopology';
export const LION_POI_REGIONS = Object.freeze([
  {shortTitle:'I · Le Lion',title:'Du Camp au Refuge du Lion',image:'/assets/generated/lion-phase/poi-lot-e/lion-opening.png'},
  {shortTitle:'II · Bois-Clair',title:'La vallée de Bois-Clair',image:'/assets/generated/lion-phase/poi-lot-e/bois-clair.png'},
  {shortTitle:'III · Le Sceau',title:'Les témoins et le jugement',image:'/assets/generated/lion-phase/poi-lot-e/judgement.png'},
]);
/** Off-region destinations are anchored at visible outbound trails, not waterfalls. */
export const LION_POI_REGION_EXITS:readonly(readonly[number,number])[]=[[650,350],[720,420],[870,430]];
/** Authored layout only. RunSystem/campaign own connections and live eligibility. */
export const LION_POI_POSITIONS: Readonly<Record<string, readonly [number, number]>> = {
  'lion-camp': [75,305], 'lion-audience': [190,170], 'lion-opening-ambush': [300,275],
  'lion-nomad-crossroads': [450,245], 'lion-refugees': [690,70],
  'lion-first-trial-event': [780,180], 'lion-first-trial-combat': [755,370],
  'lion-first-refuge': [870,270],
  'lion-poi-opening-supplies':[350,70], 'lion-poi-opening-patrol':[500,70],
  'lion-poi-opening-wolves':[420,375], 'lion-poi-opening-cache':[580,405],
  'lion-reserve-trail': [160,245], 'lion-valmir-road': [455,275],
  'lion-second-trial-event': [570,75], 'lion-second-trial-combat': [640,395],
  'lion-village-choice': [760,240], 'lion-second-refuge': [875,100],
  'lion-poi-valley-supplies':[230,95], 'lion-poi-valley-marsh':[355,130],
  'lion-poi-valley-bridge-cache':[260,350], 'lion-poi-valley-serpent':[415,440],
  'lion-lancer-recruit': [140,340], 'lion-witnesses': [365,245],
  'lion-final-trial-event': [580,75], 'lion-final-trial-combat': [550,370],
  'lion-shadow-signs': [710,245], 'lion-final-refuge': [805,370], 'lion-final-judgement': [885,130],
  'lion-poi-seal-witness-supplies':[185,160], 'lion-poi-seal-hunters':[390,75],
  'lion-poi-seal-ruin-encounter':[360,390], 'lion-poi-seal-ruin-supplies':[750,70],
};

/** Art-only bends follow the inspected atlas trails, stairs and bridge approaches. They never
 * create an edge: PoiMapView uses them only after RunSystem supplied that exact connection. */
const PATH_BENDS:Readonly<Record<string,readonly(readonly[number,number])[]>>={
  'lion-camp>lion-audience':[[120,285],[160,235]],
  'lion-audience>lion-opening-ambush':[[205,235],[255,265]],
  'lion-nomad-crossroads>lion-refugees':[[460,180],[480,125],[555,90],[625,75]],
  'lion-nomad-crossroads>lion-first-trial-event':[[540,250],[600,230],[660,220],[725,180]],
  'lion-nomad-crossroads>lion-first-trial-combat':[[525,290],[590,340],[680,365]],
  'lion-refugees>lion-first-trial-combat':[[735,115],[775,165],[805,195],[850,235],[855,290],[820,335],[785,355]],
  'lion-poi-opening-supplies>lion-nomad-crossroads':[[420,65],[460,70],[500,85],[480,125],[460,180]],
  'lion-poi-opening-supplies>lion-poi-opening-patrol':[[420,65],[460,70]],
  'lion-poi-opening-patrol>lion-refugees':[[550,85],[610,80]],
  'lion-poi-opening-wolves>lion-nomad-crossroads':[[435,340],[450,300]],
  'lion-poi-opening-wolves>lion-poi-opening-cache':[[470,395],[525,410]],
  'lion-poi-opening-cache>lion-nomad-crossroads':[[595,350],[570,295],[510,260]],
  'lion-poi-valley-supplies>lion-reserve-trail':[[180,120],[155,175]],
  'lion-poi-valley-supplies>lion-poi-valley-marsh':[[275,100],[315,120]],
  'lion-poi-valley-marsh>lion-valmir-road':[[345,170],[375,225],[420,260]],
  'lion-poi-valley-bridge-cache>lion-valmir-road':[[295,350],[335,325],[410,305]],
  'lion-poi-valley-bridge-cache>lion-poi-valley-serpent':[[300,390],[350,425],[400,440]],
  'lion-poi-valley-serpent>lion-valmir-road':[[475,420],[520,420],[600,370],[640,345],[620,310],[540,265],[490,275]],
  'lion-valmir-road>lion-second-trial-event':[[490,270],[530,260],[580,240],[605,210],[615,170],[605,135],[590,110]],
  'lion-valmir-road>lion-second-trial-combat':[[525,265],[575,310],[625,365]],
  'lion-second-trial-combat>lion-village-choice':[[705,345],[735,290]],
  'lion-poi-seal-witness-supplies>lion-lancer-recruit':[[225,185],[250,215],[225,245],[175,275],[150,305]],
  'lion-poi-seal-witness-supplies>lion-witnesses':[[220,210],[285,230],[335,245]],
  'lion-poi-seal-hunters>lion-witnesses':[[365,130],[350,180]],
  'lion-poi-seal-hunters>lion-final-trial-event':[[450,90],[505,80]],
  'lion-poi-seal-ruin-encounter>lion-witnesses':[[360,345],[365,300]],
  'lion-poi-seal-ruin-encounter>lion-final-trial-combat':[[410,405],[480,390]],
  'lion-witnesses>lion-final-trial-event':[[430,230],[480,215],[530,195],[560,170],[570,135],[570,95]],
  'lion-witnesses>lion-final-trial-combat':[[430,245],[470,280],[510,310]],
  'lion-poi-seal-ruin-supplies>lion-shadow-signs':[[750,110],[755,160],[730,200]],
  'lion-final-refuge>lion-final-judgement':[[850,320],[885,270],[900,210],[885,160]],
};
const REGION_PATH_BENDS:Readonly<Record<number,Readonly<Record<string,readonly(readonly[number,number])[]>>>>={
  0:{'lion-first-refuge>lion-reserve-trail':[[850,305],[820,330],[770,350],[720,350]]},
  1:{'lion-second-refuge>lion-lancer-recruit':[[845,165],[790,225],[745,280],[700,310],[650,330],[680,375]]},
  2:{'lion-second-refuge>lion-lancer-recruit':[[125,115],[185,140],[225,185],[250,215],[225,245],[175,275],[150,305]]},
};
export function lionPoiPathBends(from:string,to:string,region?:number):readonly(readonly[number,number])[]|undefined {
  const paths=region===undefined?undefined:REGION_PATH_BENDS[region];
  return paths?.[`${from}>${to}`]??paths?.[`${to}>${from}`]?.slice().reverse()
    ??PATH_BENDS[`${from}>${to}`]??PATH_BENDS[`${to}>${from}`]?.slice().reverse();
}

export function lionPoiMapPhase(nodeId: string): number { return lionPoiRegion(nodeId); }
