import { describe, expect, it, vi } from 'vitest';
import { NarrativeBeatDirector } from './NarrativeBeatDirector';
import type { NarrativeBeatSpec } from './NarrativeTableau';

const beats: readonly NarrativeBeatSpec[] = [
  { id: 'visual', kind: 'VISUAL', mediaPhase: 'INTRO_MEDIA', skippable: true },
  { id: 'speaker', kind: 'SPEAKER_CARD', dialogueStepId: '1', skippable: false },
  { id: 'transition', kind: 'TRANSITION', skippable: true },
  { id: 'choice', kind: 'SPATIAL_CHOICE', dialogueStepId: '2', skippable: false },
  { id: 'reaction', kind: 'VISUAL', mediaPhase: 'REACTION_MEDIA', skippable: true },
];

describe('NarrativeBeatDirector', () => {
  it('plays deterministic order and waits at input-owned beats', () => {
    const seen: string[] = [];
    const director = new NarrativeBeatDirector(beats, { onBeat: (beat) => seen.push(beat.id) });
    expect(director.start()?.id).toBe('visual');
    expect(director.state).toBe('RUNNING');
    expect(director.advance()?.id).toBe('speaker');
    expect(director.state).toBe('WAITING');
    expect(director.advance()?.id).toBe('speaker');
    expect(director.currentIndex).toBe(1);
    expect(director.advance('input')?.id).toBe('transition');
    expect(director.advance()?.id).toBe('choice');
    expect(director.advance('input')?.id).toBe('reaction');
    expect(director.advance()).toBeNull();
    expect(director.state).toBe('COMPLETE');
    expect(seen).toEqual(['visual', 'speaker', 'transition', 'choice', 'reaction']);
  });

  it('skip stops at the next safe narrative hold', () => {
    const director = new NarrativeBeatDirector(beats);
    director.start();
    expect(director.skip()?.id).toBe('speaker');
    expect(director.skip()?.id).toBe('speaker');
    expect(director.state).toBe('WAITING');
  });

  it('never skips route, context, combat, or explicit wait input', () => {
    for (const kind of ['ROUTE_CHOICE', 'CONTEXT_ACTION', 'COMBAT_HANDOFF', 'WAIT_FOR_INPUT'] as const) {
      const director = new NarrativeBeatDirector([{ id: kind, kind, skippable: true }]);
      director.start();
      expect(director.skip()?.kind).toBe(kind);
      expect(director.state).toBe('WAITING');
    }
  });

  it('seeks canonical dialogue steps without inventing sequence truth', () => {
    const director = new NarrativeBeatDirector(beats);
    expect(director.seekDialogueStep('2')?.id).toBe('choice');
    expect(director.seekDialogueStep('missing')?.id).toBe('choice');
    expect(director.seekDialogueStep('1')?.id).toBe('speaker');
  });

  it('supports intro and reaction media in one tableau', () => {
    const director = new NarrativeBeatDirector(beats);
    expect(director.start()?.mediaPhase).toBe('INTRO_MEDIA');
    expect(director.seekKind('VISUAL')?.mediaPhase).toBe('INTRO_MEDIA');
    director.seekDialogueStep('2');
    director.advance('input');
    expect(director.current?.mediaPhase).toBe('REACTION_MEDIA');
  });

  it('completes an empty sequence and is inert after disposal', () => {
    const onStateChange = vi.fn();
    const empty = new NarrativeBeatDirector([], { onStateChange });
    expect(empty.start()).toBeNull();
    expect(empty.state).toBe('COMPLETE');
    empty.dispose();
    expect(empty.state).toBe('DISPOSED');
    expect(empty.start()).toBeNull();
    expect(empty.advance('input')).toBeNull();
    expect(onStateChange.mock.calls.map(([state]) => state)).toEqual(['COMPLETE', 'DISPOSED']);
  });
});
