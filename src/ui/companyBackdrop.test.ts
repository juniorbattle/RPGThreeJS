import { describe, expect, it } from 'vitest';
import { POST_DEMO_REFUGE_PRESENTATION } from '../campaign/plateaux/postDemoRefuges';
import { continueCampaign } from '../game/plateauProgression';
import { createInitialState } from '../game/store';
import type { GameState } from '../game/types';
import { loadLionEndForBearQa } from '../qa/postDemoQaSaves';
import { assets } from '../render/assetManifest';
import { demoEnvironmentPlateForContext } from '../render/demoEnvironmentPack';
import { companyBackdrop } from './companyBackdrop';

// OD-2026-11-13-F (P3): the register and the shop stand on the refuge of the part in progress.
const lionFirst = demoEnvironmentPlateForContext('dialogue:first_refuge_gathering', 'STATIC_TABLEAU').publicUrl;
const lionSecond = demoEnvironmentPlateForContext('node:lion-second-refuge', 'HOLD_SOURCE').publicUrl;
const lionFinal = demoEnvironmentPlateForContext('node:lion-final-refuge', 'HOLD_SOURCE').publicUrl;
const at = (state: GameState, nodeId: string, visited: string[] = []) => {
  state.run.currentNodeId = nodeId;
  state.run.visitedNodeIds = [...visited, nodeId];
  return state;
};

describe('company backdrop (OD-2026-11-13-F, P3)', () => {
  it('shows the Lion refuge the company stands at, else the last one it visited, else the first one', () => {
    const state = createInitialState();
    expect(companyBackdrop(state)).toBe(lionFirst);
    expect(companyBackdrop(at(state, 'lion-second-refuge', ['lion-camp', 'lion-first-refuge']))).toBe(lionSecond);
    expect(companyBackdrop(at(state, 'lion-witnesses', ['lion-first-refuge', 'lion-second-refuge', 'lion-lancer-recruit']))).toBe(lionSecond);
    expect(companyBackdrop(at(state, 'lion-final-judgement', ['lion-second-refuge', 'lion-final-refuge']))).toBe(lionFinal);
    expect(assets.screens.management.background).toBe(lionFirst);
  });

  it('shows the approved refuge images of a post-demo part, and changes nothing in the state', async () => {
    const state = await loadLionEndForBearQa('honour');
    expect(continueCampaign(state, 20261113)?.id).toMatch(/^bear-/);
    const before = JSON.stringify(state);
    expect(companyBackdrop(state)).toBe(POST_DEMO_REFUGE_PRESENTATION['bear-first-refuge']!.image);
    expect(JSON.stringify(state)).toBe(before);
    expect(companyBackdrop(at(state, 'bear-second-refuge', ['bear-camp', 'bear-first-refuge']))).toBe(POST_DEMO_REFUGE_PRESENTATION['bear-second-refuge']!.image);
    expect(companyBackdrop(at(state, 'bear-judgement', ['bear-second-refuge', 'bear-final-refuge']))).toBe(POST_DEMO_REFUGE_PRESENTATION['bear-final-refuge']!.image);
    for (const refuge of Object.values(POST_DEMO_REFUGE_PRESENTATION)) expect(refuge.image).toMatch(/^\/assets\/generated\/post-demo\/\w+\/refuges\//);
  });
});
