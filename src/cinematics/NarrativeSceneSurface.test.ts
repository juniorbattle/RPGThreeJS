// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest';
import { dialogues } from '../game/content';
import { ALARIC_AUDIENCE_TABLEAU, createGenericNarrativeTableau } from './NarrativeTableau';
import { NarrativeSceneSurface } from './NarrativeSceneSurface';

describe('NarrativeSceneSurface', () => {
  afterEach(() => document.body.replaceChildren());

  it('composes environment, cast, atmosphere and speaker focus from one tableau', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const surface = new NarrativeSceneSurface(root, ALARIC_AUDIENCE_TABLEAU);
    surface.bindDialogue(dialogues.get('lion_briefing')!);
    surface.mount('/audience.webp');
    surface.setPhase('AUDIENCE_COMPANY_RESPONSE', 'alistair');
    expect(root.querySelector('.narrative-scene-surface__environment')?.getAttribute('style')).toContain('/audience.webp');
    expect(root.querySelectorAll('.narrative-cast__actor')).toHaveLength(4);
    expect(root.querySelector('[data-actor-id="alistair"]')?.classList).toContain('is-speaking');
    expect(root.querySelector('.narrative-scene-surface')?.getAttribute('data-layout-profile')).toBe('DIALOGUE_SPEAKER_FOCUS');
    expect(root.querySelector('.narrative-scene-surface')?.getAttribute('data-layout-placement')).toBe('LEFT');
  });

  it('keeps the full opening company cast and actor nodes stable while speaker emphasis changes', () => {
    const sequence = dialogues.get('acte_ouverture')!;
    const tableau = createGenericNarrativeTableau(sequence);
    const root = document.createElement('div');
    document.body.append(root);
    const surface = new NarrativeSceneSurface(root, tableau);
    surface.bindDialogue(sequence);
    surface.mount('/opening.webp');
    const phaseId = tableau.phases![0]!.id;
    surface.setPhase(phaseId, 'alistair');
    const alistair = root.querySelector<HTMLElement>('[data-actor-id="alistair"]')!;
    const seraphine = root.querySelector<HTMLElement>('[data-actor-id="sage_seraphine"]')!;
    expect(root.querySelectorAll('.narrative-cast__actor')).toHaveLength(6);
    expect(alistair.dataset.castState).toBe('ACTIVE');
    expect(seraphine.dataset.castState).toBe('LISTENING');

    surface.setPhase(phaseId, 'sage_seraphine');
    expect(root.querySelector('[data-actor-id="alistair"]')).toBe(alistair);
    expect(root.querySelector('[data-actor-id="sage_seraphine"]')).toBe(seraphine);
    expect(alistair.dataset.castState).toBe('LISTENING');
    expect(seraphine.dataset.castState).toBe('ACTIVE');
  });
});
