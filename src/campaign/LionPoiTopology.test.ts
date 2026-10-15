import {describe,expect,it} from 'vitest';
import {LION_POI_METADATA,lionPoiRegion} from './LionPoiTopology';
import {LION_CAMPAIGN_STRUCTURE} from './LionCampaignStructure';
import {createInitialState} from '../game/store';
import {selectPoiMap} from '../game/runSystem';

describe('authored Lion POI regions and participation',()=>{
  it('classifies exactly the21canonical nodes without adding authoring or changing campaign facts',()=>{
    const state=createInitialState();const before=structuredClone(state);
    expect(Object.keys(LION_POI_METADATA).sort()).toEqual(LION_CAMPAIGN_STRUCTURE.map(n=>n.id).sort());
    expect(selectPoiMap(state).nodes).toHaveLength(21);expect(state).toEqual(before);
    expect(new Set(Object.values(LION_POI_METADATA).map(n=>n.region))).toEqual(new Set([0,1,2]));
    expect(LION_POI_METADATA['lion-opening-ambush']).toEqual({region:0,role:'structuring',participation:'required'});
    expect(LION_POI_METADATA['lion-nomad-crossroads']!.participation).toBe('required');
    expect(LION_POI_METADATA['lion-refugees']!.participation).toBe('optional');
    for(const region of ['first','second','final'])for(const kind of ['event','combat'])
      expect(LION_POI_METADATA[`lion-${region}-trial-${kind}`]!.participation).toBe('alternative');
  });
  it('keeps region boundaries independent of layout depth and eligibility',()=>{
    const state=createInitialState();
    for(const node of state.run.graph.nodes){
      expect(lionPoiRegion(node.id)).toBe(LION_POI_METADATA[node.id]!.region);
      if(node.id!=='lion-camp')node.depth+=100;
    }
    const map=selectPoiMap(state);
    expect(map.nodes.find(n=>n.id==='lion-first-refuge')!.region).toBe(0);
    expect(map.nodes.find(n=>n.id==='lion-village-choice')!.region).toBe(1);
    expect(map.nodes.find(n=>n.id==='lion-final-judgement')!.region).toBe(2);
    expect(map.nodes.find(n=>n.id==='lion-final-judgement')!.canMove).toBe(false);
  });
});
