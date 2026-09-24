// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { dialogues } from '../game/content';
import { ALARIC_AUDIENCE_TABLEAU, AUDIENCE_ROAD_DEPARTURE_TABLEAU, CAMP_DEPARTURE_TABLEAU, VALMIR_FORK_TABLEAU, createGenericBoundaryTableau, createGenericNarrativeTableau } from './NarrativeTableau';
import { applyFinalDialoguePresentationPlan } from './DialoguePresentationSegments';
import { createNarrativeDialogueResolver } from './NarrativeDialogueAdapter';
import { NarrativeSceneSurface, THEATRICAL_ACTOR_BASE_SCALE } from './NarrativeSceneSurface';
import { resolveStaticTableauActorTuning, resolveStaticTableauComposition } from './StaticTableauComposition';

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
    expect(root.querySelector('.narrative-scene-surface')?.getAttribute('data-dialogue-surface-mode')).toBe('STATIC_TABLEAU');
    expect(root.querySelector('.narrative-scene-surface__cast')?.getAttribute('data-crop-policy')).toBe('BOTTOM_INTENTIONAL');
    expect(root.querySelectorAll('.narrative-cast__actor figcaption, .narrative-cast__actor [data-actor-label]')).toHaveLength(0);
  });

  it('uses authored semantic slots for a foreground Audience composition without environmental depth', async () => {
    const phase = ALARIC_AUDIENCE_TABLEAU.phases!.find((candidate) => candidate.id === 'AUDIENCE_COMPANY_RESPONSE')!;
    const profile = resolveStaticTableauComposition(ALARIC_AUDIENCE_TABLEAU, phase);
    expect(profile).toBe('AUTHORITY_AUDIENCE');
    const far = phase.staticCast.find((actor) => actor.screenPosition === 'FAR_LEFT')!;
    const center = phase.staticCast.find((actor) => actor.screenPosition === 'CENTER_RIGHT')!;
    expect(resolveStaticTableauActorTuning(profile, far).baselineVh).toBe(resolveStaticTableauActorTuning(profile, center).baselineVh);
    expect(resolveStaticTableauActorTuning(profile, far).scale).toBe(resolveStaticTableauActorTuning(profile, center).scale);
    const root = document.createElement('div');
    const surface = new NarrativeSceneSurface(root, ALARIC_AUDIENCE_TABLEAU, { reducedMotion: true });
    surface.mount('/audience.webp', 'AUDIENCE_COMPANY_RESPONSE');
    await surface.setPhase(phase.id, 'alistair');
    const actor = surface.castLayer.querySelector<HTMLElement>('[data-actor-id="alistair"]')!;
    const originalGeometry = { left: actor.style.left, baseline: actor.style.getPropertyValue('--tableau-baseline'), scale: actor.style.getPropertyValue('--narrative-actor-scale') };
    await surface.setPhase(phase.id, 'alaric');
    expect({ left: actor.style.left, baseline: actor.style.getPropertyValue('--tableau-baseline'), scale: actor.style.getPropertyValue('--narrative-actor-scale') }).toEqual(originalGeometry);
    expect(actor.dataset.screenPosition).toBe(phase.staticCast.find((candidate) => candidate.actorId === 'alistair')!.screenPosition);
    expect(actor.style.getPropertyValue('--narrative-ground-bottom')).toBe('');
    expect(actor.dataset.depthSlot).toBeUndefined();
  });

  it('selects theatrical grouping from scene context rather than cast count or the current speaker', () => {
    const opening = dialogues.get('acte_ouverture')!;
    const openingTableau = applyFinalDialoguePresentationPlan(opening, createGenericNarrativeTableau(opening));
    const event = dialogues.get('ate_bois_clair_night_watch')!;
    const eventTableau = applyFinalDialoguePresentationPlan(event, createGenericNarrativeTableau(event));
    const audience = ALARIC_AUDIENCE_TABLEAU;
    const profiles = [openingTableau, eventTableau, audience].map((tableau) =>
      resolveStaticTableauComposition(tableau, tableau.phases![0]!));
    expect([openingTableau, eventTableau, audience].map((tableau) => tableau.phases![0]!.staticCast.length)).toEqual([4, 4, 4]);
    expect(profiles).toEqual(['COMPANY_EXCHANGE', 'EVENT_SUBJECT_FOCUS', 'AUTHORITY_AUDIENCE']);
    const position = audience.phases![0]!.staticCast.find((actor) => actor.screenPosition === 'CENTER_LEFT')!;
    expect(resolveStaticTableauActorTuning('AUTHORITY_AUDIENCE', position).xPercent)
      .not.toBe(resolveStaticTableauActorTuning('COMPANY_EXCHANGE', position).xPercent);
    expect(position.screenPosition).toBe('CENTER_LEFT');
  });

  it('balances elite and apparition silhouettes without moving authored slots or baselines', () => {
    const base = ALARIC_AUDIENCE_TABLEAU.phases![0]!.staticCast[0]!;
    const tuning = (actorId: string) => resolveStaticTableauActorTuning('COMPANY_EXCHANGE', { ...base, actorId });
    const ordinary = tuning('sage_seraphine');
    const troll = tuning('forest_troll_elite');
    const dragon = tuning('young_dragon_elite');
    const apparition = tuning('shrine_apparition');
    expect(troll.scale).toBeGreaterThan(ordinary.scale);
    expect(dragon.scale).toBeGreaterThan(ordinary.scale);
    expect(apparition.scale).toBeLessThan(ordinary.scale);
    expect([troll, dragon, apparition].every((value) => value.xPercent === ordinary.xPercent && value.baselineVh === ordinary.baselineVh)).toBe(true);
  });

  it('segments the six-person opening into stable four-person compositions', async () => {
    const sequence = dialogues.get('acte_ouverture')!;
    const tableau = applyFinalDialoguePresentationPlan(sequence, createGenericNarrativeTableau(sequence));
    const root = document.createElement('div');
    document.body.append(root);
    const surface = new NarrativeSceneSurface(root, tableau);
    surface.bindDialogue(sequence);
    surface.mount('/opening.webp');
    const phaseId = tableau.phases![0]!.id;
    surface.setPhase(phaseId, 'alistair');
    const alistair = root.querySelector<HTMLElement>('[data-actor-id="alistair"]')!;
    const seraphine = root.querySelector<HTMLElement>('[data-actor-id="sage_seraphine"]')!;
    expect(root.querySelectorAll('.narrative-cast__actor')).toHaveLength(4);
    expect(root.querySelector('.narrative-scene-surface')?.getAttribute('data-cast-placement-mode')).toBe('THEATRICAL_FOREGROUND');
    expect(alistair.style.getPropertyValue('--narrative-actor-scale')).toBe(`${THEATRICAL_ACTOR_BASE_SCALE}`);
    expect(alistair.dataset.castState).toBe('ACTIVE');
    expect(seraphine.dataset.castState).toBe('LISTENING');

    surface.setPhase(phaseId, 'sage_seraphine');
    expect(root.querySelector('[data-actor-id="alistair"]')).toBe(alistair);
    expect(root.querySelector('[data-actor-id="sage_seraphine"]')).toBe(seraphine);
    expect(alistair.dataset.castState).toBe('LISTENING');
    expect(seraphine.dataset.castState).toBe('ACTIVE');
    expect(alistair.dataset.facing).toBe('LEFT');
    expect(seraphine.dataset.facing).toBe('RIGHT');

    await surface.setPhase(tableau.phases![1]!.id, 'kestrel');
    expect(root.querySelectorAll('.narrative-cast__actor')).toHaveLength(4);
    expect(root.querySelector('[data-actor-id="alistair"]')).toBeNull();
    expect(root.querySelector('[data-actor-id="marian"]')).toBeNull();
    expect(root.querySelector('[data-actor-id="kestrel"]')?.getAttribute('data-cast-state')).toBe('ACTIVE');
  });

  it('keeps one actor at the same theatrical scale across one to four cast members', async () => {
    const base = ALARIC_AUDIENCE_TABLEAU.phases![0]!.staticCast[0]!;
    const root = document.createElement('div');
    const samples: string[][] = [];
    for (const count of [1, 2, 3, 4]) {
      const tableau = { ...ALARIC_AUDIENCE_TABLEAU, phases: [{ ...ALARIC_AUDIENCE_TABLEAU.phases![0]!, staticCast: [base, ...ALARIC_AUDIENCE_TABLEAU.phases![0]!.staticCast.slice(1, count)] }] };
      const surface = new NarrativeSceneSurface(root, tableau, { reducedMotion: true });
      surface.mount();
      await surface.whenRenderable();
      const actor = surface.castLayer.querySelector<HTMLElement>(`[data-actor-id="${base.actorId}"]`)!;
      samples.push([actor.style.left, actor.style.getPropertyValue('--tableau-baseline'), actor.style.getPropertyValue('--narrative-actor-scale')]);
      surface.dispose();
    }
    expect(samples.every((sample) => JSON.stringify(sample) === JSON.stringify(samples[0]))).toBe(true);
  });

  it('requires scene-authored coordinates for each stage-owned journey cast', async () => {
    const tableaux = [CAMP_DEPARTURE_TABLEAU, AUDIENCE_ROAD_DEPARTURE_TABLEAU, VALMIR_FORK_TABLEAU, createGenericBoundaryTableau('test:road', 'single')];
    for (const tableau of tableaux) {
      expect(tableau.castPlacementMode).toBe('SCENE_INTEGRATED');
      const surface = new NarrativeSceneSurface(document.createElement('div'), tableau, { reducedMotion: true });
      surface.mount();
      await surface.whenRenderable();
      expect(surface.element.dataset.dialogueSurfaceMode).toBeUndefined();
      for (const actor of surface.castLayer.querySelectorAll<HTMLElement>('.narrative-cast__actor')) {
        expect(actor.dataset.castPlacementMode).toBe('SCENE_INTEGRATED');
        expect(actor.style.left).toBe(`${tableau.sceneCastPlacement![actor.dataset.actorId!]?.xPercent}%`);
      }
      surface.dispose();
    }
  });

  it('changes Maelor facing by addressee without changing his authored company-side position', async () => {
    const sequence = dialogues.get('lion_briefing')!;
    const tableau = applyFinalDialoguePresentationPlan(sequence, ALARIC_AUDIENCE_TABLEAU);
    const resolver = createNarrativeDialogueResolver(sequence, tableau);
    const step = sequence.steps.find((candidate) => candidate.id === '3')!;
    const presentation = resolver(step);
    const root = document.createElement('div');
    document.body.append(root);
    const surface = new NarrativeSceneSurface(root, tableau, { reducedMotion: true });
    surface.bindDialogue(sequence);
    surface.mount('/audience.webp', presentation.phaseId);
    await surface.setPhase(
      presentation.phaseId!,
      'maelor',
      presentation.layoutPlacement,
      presentation.speakerFacing,
      presentation.speakerLookTarget,
      presentation.addressedTo,
      presentation.addressResolution,
    );
    const maelor = root.querySelector<HTMLElement>('[data-actor-id="maelor"]')!;
    expect(maelor.dataset.screenPosition).toBe('CENTER_LEFT');
    expect(maelor.dataset.facing).toBe('RIGHT');
    expect(maelor.dataset.lookTarget).toBe('alaric');
    expect(surface.element.dataset.addressedTo).toBe('alaric');
    expect(surface.element.dataset.addressResolution).toBe('EXPLICIT_ADDRESSEE');

    await surface.setPhase(presentation.phaseId!, 'maelor', presentation.layoutPlacement, 'LEFT', 'sage_seraphine', 'sage_seraphine', 'EXPLICIT_ADDRESSEE');
    expect(root.querySelector('[data-actor-id="maelor"]')).toBe(maelor);
    expect(maelor.dataset.screenPosition).toBe('CENTER_LEFT');
    expect(maelor.dataset.facing).toBe('LEFT');
    expect(maelor.dataset.lookTarget).toBe('sage_seraphine');
  });

  it('honours facing/look-target overrides and keeps stage-out distinct from narrative exit', async () => {
    vi.useFakeTimers();
    const sequence = dialogues.get('lion_briefing')!;
    const base = applyFinalDialoguePresentationPlan(sequence, ALARIC_AUDIENCE_TABLEAU);
    const template = base.phases![1]!;
    const tableau = {
      ...base,
      phases: [
        {
          ...template,
          id: 'OVERRIDE_ENTRY',
          stepIds: ['1'],
          staticCast: [
            { actorId: 'alistair', screenPosition: 'FAR_LEFT', scale: 1, facing: 'LEFT', lookTarget: 'alaric', depth: 3, narrativeRole: 'CURRENT_SPEAKER', entryEffect: 'SLIDE_IN_LEFT' },
            { actorId: 'alaric', screenPosition: 'FAR_RIGHT', scale: 1, facing: 'RIGHT', lookTarget: 'alistair', depth: 2, narrativeRole: 'AUTHORITY', entryEffect: 'SLIDE_IN_RIGHT' },
          ],
          exits: [
            { actorId: 'alistair', kind: 'STAGE_OUT', effect: 'SLIDE_OUT_LEFT', reason: 'Visual focus changes; Alistair remains in the room.' },
            { actorId: 'alaric', kind: 'NARRATIVE_EXIT', effect: 'SLIDE_OUT_RIGHT', reason: 'Authored test departure.' },
          ],
        },
        {
          ...template,
          id: 'FADE_REPLACEMENT',
          stepIds: ['2'],
          staticCast: [
            { actorId: 'maelor', screenPosition: 'CENTER', scale: 1, facing: 'FORWARD', lookTarget: null, depth: 3, narrativeRole: 'CURRENT_SPEAKER', entryEffect: 'FADE_IN' },
          ],
          exits: [{ actorId: 'maelor', kind: 'STAGE_OUT', effect: 'FADE_OUT', reason: 'Visual focus changes.' }],
        },
      ],
    } as typeof base;
    const root = document.createElement('div');
    document.body.append(root);
    const surface = new NarrativeSceneSurface(root, tableau);
    root.append(surface.element);
    const entrance = surface.setPhase('OVERRIDE_ENTRY', 'alistair');
    expect(root.querySelector('[data-actor-id="alistair"]')?.getAttribute('data-facing')).toBe('LEFT');
    expect(root.querySelector('[data-actor-id="alistair"]')?.getAttribute('data-look-target')).toBe('alaric');
    expect(root.querySelector('[data-actor-id="alistair"]')?.getAttribute('data-entry-effect')).toBe('SLIDE_IN_LEFT');
    expect(root.querySelector('[data-actor-id="alaric"]')?.getAttribute('data-entry-effect')).toBe('SLIDE_IN_RIGHT');
    await vi.advanceTimersByTimeAsync(180);
    await entrance;

    const exit = surface.setPhase('FADE_REPLACEMENT', 'maelor');
    expect(root.querySelector('[data-actor-id="alistair"]')?.getAttribute('data-exit-kind')).toBe('STAGE_OUT');
    expect(root.querySelector('[data-actor-id="alistair"]')?.getAttribute('data-exit-effect')).toBe('SLIDE_OUT_LEFT');
    expect(root.querySelector('[data-actor-id="alaric"]')?.getAttribute('data-exit-kind')).toBe('NARRATIVE_EXIT');
    expect(root.querySelector('[data-actor-id="alaric"]')?.getAttribute('data-exit-effect')).toBe('SLIDE_OUT_RIGHT');
    expect(root.querySelector('[data-actor-id="maelor"]')?.getAttribute('data-entry-effect')).toBe('FADE_IN');
    await vi.advanceTimersByTimeAsync(180);
    await exit;
    vi.useRealTimers();
  });

  it('reduces slide choreography to fades without changing final facing or cast', async () => {
    const sequence = dialogues.get('acte_ouverture')!;
    const tableau = applyFinalDialoguePresentationPlan(sequence, createGenericNarrativeTableau(sequence));
    const root = document.createElement('div');
    document.body.append(root);
    const surface = new NarrativeSceneSurface(root, tableau, { reducedMotion: true });
    root.append(surface.element);
    await surface.setPhase(tableau.phases![0]!.id, 'sage_seraphine');
    const next = surface.setPhase(tableau.phases![1]!.id, 'kestrel');
    expect(root.querySelector('[data-actor-id="alistair"]')?.getAttribute('data-exit-effect')).toBe('FADE_OUT');
    expect(root.querySelector('[data-actor-id="kestrel"]')?.getAttribute('data-entry-effect')).toBe('FADE_IN');
    await next;
    expect(root.querySelector('[data-actor-id="kestrel"]')?.getAttribute('data-facing')).toBe('RIGHT');
    expect(root.querySelectorAll('.narrative-cast__actor')).toHaveLength(4);
  });
});
