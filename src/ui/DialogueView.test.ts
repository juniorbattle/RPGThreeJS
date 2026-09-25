// @vitest-environment happy-dom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { dialogues } from '../game/content';
import { createInitialState } from '../game/store';
import type { DialogueSequence, NarrativeEffect } from '../game/types';
import { DialogueView } from './DialogueView';
import { resolveDialoguePortrait } from './DialoguePortrait';

describe('DialogueView narrative boundaries', () => {
  it('crops the canonical master into a compact frame and falls back when it cannot load', () => {
    const portrait = resolveDialoguePortrait('alaric');
    expect(portrait?.src).toBe('/assets/characters/pixel/masters/alaric.png');
    expect(portrait?.scale).toBeGreaterThan(2);
    expect(resolveDialoguePortrait('unregistered_actor')).toBeUndefined();

    const root = document.createElement('div');
    const view = new DialogueView({ root, getState: createInitialState, applyEffects: async () => undefined });
    const sequence: DialogueSequence = {
      id: 'portrait-proof',
      steps: [{ id: '1', speaker: 'Alaric', actorId: 'alaric', text: 'La ligne reste visible.',
        tag: '', portrait: '/uncanonical.png', expression: 'neutral', side: 'left', next: null, effects: [], choices: [] }],
    };
    void view.play(sequence, { reducedMotion: true });
    const card = root.querySelector<HTMLElement>('.dialogue__box')!;
    const frame = root.querySelector<HTMLElement>('.dialogue__card-portrait')!;
    expect(card.classList.contains('campaign-ui-frame--compact')).toBe(true);
    expect(root.querySelector('.dialogue__speaker')?.textContent).toBe('Alaric');
    expect(root.querySelector('.dialogue__text')?.textContent).toBe('La ligne reste visible.');
    expect(frame.querySelector('img')?.getAttribute('src')).toBe(portrait?.src);
    frame.querySelector('img')?.dispatchEvent(new Event('error'));
    expect(frame.hidden).toBe(true);
    expect(frame.dataset.portraitState).toBe('fallback');
    expect(root.querySelector('.dialogue__text')?.textContent).toBe('La ligne reste visible.');
    view.close();
  });
  it('renders the local contest hint without interpreting Lion campaign flags', () => {
    const state = createInitialState();
    state.reputation = 50;
    state.flags.alaricDoubt = true;
    state.flags.lionMandateAdvance = true;
    const root = document.createElement('div');
    const view = new DialogueView({
      root,
      getState: () => state,
      applyEffects: async () => {},
    });

    view.play(dialogues.get('mystery_lancer_recruit')!);

    const badgeTexts = Array.from(root.querySelectorAll('.dialogue-outcome span'))
      .map((element) => element.textContent ?? '');
    expect(badgeTexts).toContain('Garen pèse votre conduite avant de se lier.');
    expect(badgeTexts).not.toContain('Alaric semble méfiant');
    view.close();
  });

  it('contains no hard-coded interpretation of Lion-specific flags', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/ui/DialogueView.ts'), 'utf8');
    const forbiddenStoryFacts = [
      'alaricDoubt',
      'liedToAlaric',
      'lionMandateHonour',
      'lionMandateAdvance',
      'helpedRefugees',
      'exploitedRefugees',
      'missionSuccess',
      'missionGreed',
      'protectedWitnesses',
      'silencedWitnesses',
      'shadowEvidence',
      'shadowFragments',
      'shadowRevealed',
      'shadowConcealed',
    ];

    for (const flag of forbiddenStoryFacts) {
      expect(source, `DialogueView must not interpret ${flag}`).not.toContain(flag);
    }
  });

  it('retains default painted compatibility for isolated tools without making it a production routing decision', () => {
    const root = document.createElement('div');
    const view = new DialogueView({
      root,
      getState: createInitialState,
      applyEffects: async () => {},
    });
    void view.play(dialogues.get('lion_briefing')!);
    const overlay = root.querySelector<HTMLElement>('.dialogue');
    expect(overlay?.className).toBe('dialogue ui-screen');
    expect(overlay?.dataset.screenEnv).toBeDefined();
    expect(overlay?.style.getPropertyValue('--dialogue-bg-image')).not.toBe('');
    expect(overlay?.getAttribute('aria-modal')).toBe('true');
    view.close();
  });

  it('renders cinematic dialogue as the sole modal without a second backdrop or portrait', async () => {
    const state = createInitialState();
    const applied: NarrativeEffect[][] = [];
    const root = document.createElement('div');
    document.body.append(root);
    const view = new DialogueView({
      root,
      getState: () => state,
      applyEffects: async (effects) => { applied.push(effects); },
    });
    const sequence: DialogueSequence = {
      id: 'cin65-effects',
      title: 'Held dialogue',
      steps: [{
        id: 'choice',
        speaker: 'Alaric',
        tag: 'Roi-Lion',
        text: 'Choisissez.',
        actorId: 'alaric',
        expression: 'stern',
        portrait: '/portrait.png',
        side: 'right',
        effects: [
          { type: 'setFlag', key: 'cin65Step', value: true },
          { type: 'addReputation', amount: 1 },
        ],
        choices: [{
          text: 'Combattre puis conclure',
          next: null,
          effects: [
            { type: 'startCombat', combatId: 'village_defense' },
            { type: 'finishChapter', endingId: 'cin65-test' },
          ],
        }],
      }],
    };

    const completion = view.play(sequence, { mode: 'cinematic-overlay' });
    const overlay = root.querySelector<HTMLElement>('.dialogue--cinematic');
    expect(overlay?.getAttribute('aria-modal')).toBe('true');
    expect(document.querySelectorAll('[aria-modal="true"]')).toHaveLength(1);
    expect(overlay?.dataset.screenEnv).toBeUndefined();
    expect(overlay?.style.getPropertyValue('--dialogue-bg-image')).toBe('');
    expect(root.querySelector<HTMLElement>('.dialogue__portrait--right')?.style.backgroundImage).toBe('');
    const choice = root.querySelector<HTMLButtonElement>('.dialogue-choice');
    expect(document.activeElement).toBe(choice);
    choice?.click();
    choice?.click();
    await completion;

    expect(applied).toEqual([
      [
        { type: 'setFlag', key: 'cin65Step', value: true },
        { type: 'addReputation', amount: 1 },
      ],
      [
        { type: 'startCombat', combatId: 'village_defense' },
        { type: 'finishChapter', endingId: 'cin65-test' },
      ],
    ]);
    expect(root.querySelector('.dialogue')).toBeNull();
  });

  it('switches NarrativeStage speaker, subtitle, held, and spatial modes without copying effects', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const applyEffects = vi.fn(async () => undefined);
    const onStepChange = vi.fn();
    const view = new DialogueView({ root, getState: createInitialState, applyEffects });
    const sequence: DialogueSequence = {
      id: 'narrative-modes',
      steps: [
        { id: 'card', speaker: 'Séraphine', actorId: 'sage_seraphine', tag: 'Sage', text: 'Canonical card.', portrait: '/seraphine.png', expression: 'mystical', side: 'left', next: 'subtitle', effects: [], choices: [] },
        { id: 'subtitle', speaker: 'Alaric', actorId: 'alaric', tag: 'Lion', text: 'Canonical subtitle.', portrait: '', expression: 'stern', side: 'right', next: 'held', effects: [], choices: [] },
        { id: 'held', speaker: 'Maelor', actorId: 'maelor', tag: 'Intendant', text: 'Canonical held.', portrait: '', expression: 'neutral', side: 'left', next: 'choice', effects: [], choices: [] },
        { id: 'choice', speaker: 'Alistair', actorId: 'alistair', tag: 'Décision', text: 'Canonical choice.', portrait: '', expression: 'stern', side: 'left', next: null, effects: [], choices: [{ text: 'Continue', next: null, effects: [{ type: 'setFlag', key: 'once', value: true }] }] },
      ],
    };
    const modes: Record<string, 'SPEAKER_CARD' | 'CINEMATIC_SUBTITLE' | 'HELD_DIALOGUE' | 'SPATIAL_CHOICE'> = {
      card: 'SPEAKER_CARD',
      subtitle: 'CINEMATIC_SUBTITLE',
      held: 'HELD_DIALOGUE',
      choice: 'SPATIAL_CHOICE',
    };
    const completion = view.play(sequence, {
      mode: 'narrative-stage',
      reducedMotion: true,
      stepPresentation: (step) => ({
        mode: modes[step.id]!,
        displayText: step.id === 'card' ? 'Condensed card.' : undefined,
        showPortrait: step.id === 'card',
      }),
      onStepChange,
    });
    const overlay = root.querySelector<HTMLElement>('.dialogue--narrative');
    expect(overlay?.classList.contains('dialogue--speaker-card')).toBe(true);
    expect(overlay?.dataset.dialogueMode).toBe('SPEAKER_CARD');
    expect(root.querySelector('.dialogue__text')?.textContent).toBe('Condensed card.');
    expect(root.querySelector<HTMLElement>('.dialogue__portrait--left')?.style.backgroundImage).toBe('');
    expect(root.querySelector<HTMLImageElement>('.dialogue__card-portrait img')?.src).toContain('/sage_seraphine.png');
    root.querySelector<HTMLButtonElement>('.dialogue__box')?.click();
    expect(overlay?.classList.contains('dialogue--cinematic-subtitle')).toBe(true);
    root.querySelector<HTMLButtonElement>('.dialogue__box')?.click();
    expect(overlay?.classList.contains('dialogue--held-dialogue')).toBe(true);
    root.querySelector<HTMLButtonElement>('.dialogue__box')?.click();
    expect(overlay?.classList.contains('dialogue--spatial-choice')).toBe(true);
    expect(root.querySelectorAll('.dialogue-choice')).toHaveLength(0);
    root.querySelector<HTMLButtonElement>('.dialogue__box')?.click();
    const choice = root.querySelector<HTMLButtonElement>('.dialogue-choice');
    expect(overlay?.dataset.narrativeAgencyState).toBe('ACTIVE');
    expect(overlay?.classList.contains('dialogue--choice-active')).toBe(true);
    expect(root.querySelector<HTMLButtonElement>('.dialogue__box')?.disabled).toBe(true);
    expect(root.querySelector('.dialogue__text')?.textContent).toBe('Canonical choice.');
    choice?.click();
    choice?.click();
    await completion;
    expect(applyEffects).toHaveBeenCalledTimes(1);
    expect(onStepChange).toHaveBeenCalledTimes(4);
    expect(sequence.steps[0]!.text).toBe('Canonical card.');
    expect(document.querySelectorAll('[aria-modal="true"]')).toHaveLength(0);
  });

  it('paginates one canonical step while applying its effects and choice exactly once', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const applyEffects = vi.fn(async () => undefined);
    const view = new DialogueView({ root, getState: createInitialState, applyEffects });
    const sequence: DialogueSequence = {
      id: 'segmented-step',
      steps: [{
        id: '1', speaker: 'Alaric', actorId: 'alaric', tag: 'Mandat', text: 'Phrase canonique une. Phrase canonique deux.',
        portrait: '', expression: 'stern', side: 'right', next: null,
        effects: [{ type: 'setFlag', key: 'step-once', value: true }],
        choices: [{ text: 'Choix canonique', next: null, effects: [{ type: 'setFlag', key: 'choice-once', value: true }] }],
      }],
    };
    const completion = view.play(sequence, {
      mode: 'narrative-stage',
      reducedMotion: true,
      stepPresentation: () => ({
        mode: 'SPATIAL_CHOICE',
        displaySegments: ['Phrase canonique une.', 'Phrase canonique deux.'],
        showPortrait: false,
      }),
    });
    expect(root.querySelectorAll('.dialogue-choice')).toHaveLength(0);
    root.querySelector<HTMLButtonElement>('.dialogue__box')?.click();
    expect(root.querySelectorAll('.dialogue-choice')).toHaveLength(0);
    expect(root.querySelector('.dialogue__text')?.textContent).toBe('Phrase canonique deux.');
    root.querySelector<HTMLButtonElement>('.dialogue__box')?.click();
    expect(root.querySelectorAll('.dialogue-choice')).toHaveLength(1);
    root.querySelector<HTMLButtonElement>('.dialogue-choice')?.click();
    root.querySelector<HTMLButtonElement>('.dialogue-choice')?.click();
    await completion;
    expect(applyEffects).toHaveBeenCalledTimes(2);
    expect(sequence.steps[0]!.text).toBe('Phrase canonique une. Phrase canonique deux.');
  });

  it('waits for visual staging before exposing the next line and ignores fast advance during the handoff', async () => {
    let releaseStage: (() => void) | undefined;
    const firstStaged = Promise.resolve();
    const secondStaged = new Promise<void>((resolveStage) => { releaseStage = resolveStage; });
    const root = document.createElement('div');
    document.body.append(root);
    const view = new DialogueView({ root, getState: createInitialState, applyEffects: async () => undefined });
    const sequence: DialogueSequence = {
      id: 'staging-barrier',
      steps: [
        { id: '1', speaker: 'Alaric', actorId: 'alaric', tag: 'Mandat', text: 'Première ligne.', portrait: '', expression: 'stern', side: 'right', next: '2', effects: [], choices: [] },
        { id: '2', speaker: 'Maelor', actorId: 'maelor', tag: 'Conseil', text: 'Deuxième ligne.', portrait: '', expression: 'neutral', side: 'left', next: null, effects: [], choices: [] },
      ],
    };
    const completion = view.play(sequence, {
      mode: 'narrative-stage',
      reducedMotion: true,
      beforeStepChange: (step) => step.id === '1' ? firstStaged : secondStaged,
    });
    await firstStaged;
    await Promise.resolve();
    const box = root.querySelector<HTMLButtonElement>('.dialogue__box')!;
    expect(root.querySelector('.dialogue__text')?.textContent).toBe('Première ligne.');
    box.click();
    box.click();
    expect(root.querySelector('.dialogue')?.classList).toContain('dialogue--preparing-step');
    expect(root.querySelector('.dialogue__text')?.textContent).toBe('Première ligne.');
    releaseStage?.();
    await Promise.resolve();
    await Promise.resolve();
    expect(root.querySelector('.dialogue__text')?.textContent).toBe('Deuxième ligne.');
    box.click();
    await completion;
  });

  it('reserves final text before progressive reveal and keeps active choices with their speech card', () => {
    vi.useFakeTimers();
    const root = document.createElement('div');
    document.body.append(root);
    const view = new DialogueView({ root, getState: createInitialState, applyEffects: async () => undefined });
    const sequence: DialogueSequence = {
      id: 'stable-reveal',
      steps: [{
        id: 'choice', speaker: 'Séraphine', actorId: 'sage_seraphine', tag: 'Conseil',
        text: 'Le texte final réserve toute sa géométrie avant que la première lettre ne soit révélée.',
        portrait: '', expression: 'mystical', side: 'left', next: null, effects: [],
        choices: [
          { text: 'Première voie', next: null, effects: [] },
          { text: 'Seconde voie', next: null, effects: [] },
        ],
      }],
    };
    void view.play(sequence, {
      mode: 'narrative-stage',
      reducedMotion: false,
      stepPresentation: () => ({
        mode: 'SPATIAL_CHOICE',
        showPortrait: false,
        layoutProfile: 'CHOICE_TWO_PATH_SPATIAL',
        layoutPlacement: 'LEFT_UPPER',
        speakerScreenPosition: 'LEFT',
        speakerAssociation: 'SPEAKER_LEFT_UPPER',
        dialogueSurfaceMode: 'STATIC_TABLEAU',
        speakerCardPolicy: 'SETUP_THEN_CHOICES_ONLY',
        choiceScreenLanes: ['RIGHT', 'LEFT'],
      }),
    });
    const text = root.querySelector<HTMLElement>('.dialogue__text')!;
    expect(text.dataset.finalText).toBe(sequence.steps[0]!.text);
    expect(text.querySelector('.dialogue__text-reveal')?.textContent).toBe('');
    vi.advanceTimersByTime(30);
    expect(text.querySelector('.dialogue__text-reveal')?.textContent?.length).toBeGreaterThan(0);
    root.querySelector<HTMLButtonElement>('.dialogue__box')?.click();
    const overlay = root.querySelector<HTMLElement>('.dialogue--narrative')!;
    expect(overlay.dataset.narrativeSceneMode).toBe('STATIC_TABLEAU');
    expect(overlay.dataset.narrativePlacement).toBe('LEFT_UPPER');
    expect(overlay.dataset.narrativeAgencyState).toBe('ACTIVE');
    expect(root.querySelector<HTMLButtonElement>('.dialogue__box')?.disabled).toBe(true);
    expect(root.querySelectorAll('.dialogue-choice')).toHaveLength(2);
    const [firstChoice, secondChoice] = [...root.querySelectorAll<HTMLButtonElement>('.dialogue-choice')];
    expect(firstChoice?.textContent).toContain('Première voie');
    expect(firstChoice?.dataset.narrativeChoiceLane).toBe('RIGHT');
    expect(secondChoice?.textContent).toContain('Seconde voie');
    expect(secondChoice?.dataset.narrativeChoiceLane).toBe('LEFT');
    view.close();
    vi.useRealTimers();
  });
});
