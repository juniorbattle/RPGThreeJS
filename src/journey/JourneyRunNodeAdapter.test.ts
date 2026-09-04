import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getAvailableRunNodes, getRunNode } from '../game/runSystem';
import { createInitialState } from '../game/store';
import { ratingScale, runNodePresentation } from '../ui/RunNodePresentation';
import type { GameState, RunNode } from '../game/types';
import {
  JOURNEY_CONTINUE_LABEL,
  JOURNEY_TERMINAL_LABEL,
  planJourneyBoundary,
  toJourneyChoice,
} from './JourneyRunNodeAdapter';

/** Exactly what TravelView receives: authoritative, adaptive-resolved successors. */
function availableAt(state: GameState, nodeId: string): RunNode[] {
  state.run.currentNodeId = nodeId;
  state.currentNodeId = nodeId;
  return getAvailableRunNodes(state);
}

describe('journey RunNode adapter', () => {
  it('preserves IDs and labels from the authoritative nodes', () => {
    const state = createInitialState();
    const available = availableAt(state, 'lion-refugees');
    expect(available.length).toBeGreaterThan(1);
    const plan = planJourneyBoundary(available);
    expect(plan.kind).toBe('branch');
    expect(plan.presentation.choices.map((choice) => choice.id)).toEqual(available.map((node) => node.id));
    expect(plan.presentation.choices.map((choice) => choice.label)).toEqual(available.map((node) => node.label));
  });

  it('reads risk, reward, difficulty, hint and type from the shared presentation semantics', () => {
    const state = createInitialState();
    for (const nodeId of ['lion-camp', 'lion-refugees', 'lion-nomad-crossroads', 'lion-shadow-signs']) {
      for (const node of availableAt(state, nodeId)) {
        const meta = runNodePresentation(node);
        const choice = toJourneyChoice(node);
        expect(choice.id).toBe(node.id);
        expect(choice.label).toBe(node.label);
        expect(choice.category).toBe(meta.label);
        expect(choice.difficulty).toBe(meta.difficulty);
        expect(choice.hint).toBe(meta.hint);
        expect(choice.risk).toBe(`Risque ${ratingScale(meta.risk)}`);
        expect(choice.reward).toBe(`Gain ${ratingScale(meta.reward)}`);
        expect(choice.disabled).toBeUndefined();
      }
    }
  });

  it('carries adaptive content already resolved by RunSystem, never re-inferred', () => {
    const honourable = createInitialState();
    honourable.flags.lionMandateHonour = true;
    const [honourEvent] = availableAt(honourable, 'lion-refugees');
    expect(honourEvent?.id).toBe('lion-first-trial-event');
    expect(honourEvent?.contentId).toBe('mystery_help');
    const honourChoice = toJourneyChoice(honourEvent!);
    expect(honourChoice.hint).toBe(honourEvent!.hint);
    expect(honourChoice.hint).toContain('mandat du Lion');

    const advancing = createInitialState();
    advancing.flags.lionMandateAdvance = true;
    const [advanceEvent] = availableAt(advancing, 'lion-refugees');
    expect(advanceEvent?.id).toBe('lion-first-trial-event');
    const advanceChoice = toJourneyChoice(advanceEvent!);
    // Same node ID, different resolved variant: the adapter reports whichever RunSystem resolved.
    expect(advanceChoice.id).toBe(honourChoice.id);
    expect(advanceChoice.hint).not.toBe(honourChoice.hint);
    expect(advanceChoice.hint).toBe(advanceEvent!.hint);
  });

  it('presents a single successor as a continuation, never as a route comparison', () => {
    const state = createInitialState();
    const available = availableAt(state, 'lion-nomad-crossroads');
    expect(available).toHaveLength(1);
    const plan = planJourneyBoundary(available);
    expect(plan.kind).toBe('single');
    expect(plan.singleNodeId).toBe(available[0]!.id);
    expect(plan.presentation.choices).toEqual([]);
    expect(plan.presentation.continueLabel).toBe(JOURNEY_CONTINUE_LABEL);
    expect(plan.presentation.caption).toContain(available[0]!.label);
  });

  it('presents a terminal boundary without fabricating a route', () => {
    const plan = planJourneyBoundary([]);
    expect(plan.kind).toBe('terminal');
    expect(plan.singleNodeId).toBeNull();
    expect(plan.presentation.choices).toEqual([]);
    expect(plan.presentation.continueLabel).toBe(JOURNEY_TERMINAL_LABEL);
    expect(plan.presentation.continueLabel).not.toBe(JOURNEY_CONTINUE_LABEL);
  });

  it('reaches a real terminal boundary at the end of the authored route', () => {
    const state = createInitialState();
    const judgement = getRunNode(state.run, 'lion-final-judgement');
    expect(judgement?.links).toEqual([]);
    expect(planJourneyBoundary(availableAt(state, 'lion-final-judgement')).kind).toBe('terminal');
  });

  it('passes secondary actions through untouched', () => {
    const secondary = [{ id: 'COMPANY', label: 'Compagnie' }, { id: 'MENU', label: 'Menu' }];
    for (const available of [[], availableAt(createInitialState(), 'lion-refugees')]) {
      const plan = planJourneyBoundary(available, { secondary, currentLabel: 'Camp' });
      expect(plan.presentation.secondary).toEqual(secondary);
      expect(plan.presentation.title).toBe('Camp');
    }
  });

  it('shares one presentation interpretation with TravelView', () => {
    const travel = readFileSync(join(process.cwd(), 'src', 'ui', 'TravelView.ts'), 'utf8');
    const adapter = readFileSync(join(process.cwd(), 'src', 'journey', 'JourneyRunNodeAdapter.ts'), 'utf8');
    expect(travel).toContain("from './RunNodePresentation'");
    expect(adapter).toContain("from '../ui/RunNodePresentation'");
    // Neither surface may keep a private copy of the route type table.
    expect(travel).not.toContain('const NODE_PRESENTATION');
    expect(adapter).not.toContain('const NODE_PRESENTATION');
    for (const source of [travel, adapter]) {
      expect(source).not.toContain("label: 'Combat', risk:");
    }
  });

  it('never reads or writes campaign state', () => {
    const adapter = readFileSync(join(process.cwd(), 'src', 'journey', 'JourneyRunNodeAdapter.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(adapter).not.toMatch(/enterRunNode|getAvailableRunNodes|stepCounter|resolvedNodeIds|GameState/);
  });
});
