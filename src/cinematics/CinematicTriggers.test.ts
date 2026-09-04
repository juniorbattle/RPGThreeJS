import { describe, expect, it } from 'vitest';
import { createInitialState } from '../game/store';
import { resolveVideoCinematicTrigger, VIDEO_CINEMATIC_TRIGGERS } from './CinematicTriggers';

describe('CIN-3 production triggers', () => {
  it('contains exactly the authorized production whitelist', () => {
    expect(VIDEO_CINEMATIC_TRIGGERS).toEqual({
      beforeDialogue: { lion_finale_judgement: 'lion_judgement' },
      beforeCombat: {
        serpent_captain: 'serpent_general_reveal',
        lion_chief: 'lion_champion_reveal',
      },
      afterCombat: {},
      chapterBeat: {},
    });
    expect(Object.keys(VIDEO_CINEMATIC_TRIGGERS.beforeDialogue)).toHaveLength(1);
    expect(Object.keys(VIDEO_CINEMATIC_TRIGGERS.beforeCombat)).toHaveLength(2);
  });

  it('resolves only the authorized dialogue and combat lifecycle points', () => {
    expect(resolveVideoCinematicTrigger({ hook: 'beforeDialogue', dialogueId: 'lion_finale_judgement' })).toBe('lion_judgement');
    expect(resolveVideoCinematicTrigger({ hook: 'beforeCombat', combatId: 'serpent_captain' })).toBe('serpent_general_reveal');
    expect(resolveVideoCinematicTrigger({ hook: 'beforeCombat', combatId: 'lion_chief' })).toBe('lion_champion_reveal');
    expect(resolveVideoCinematicTrigger({ hook: 'beforeDialogue', dialogueId: 'lion_finale_return' })).toBeUndefined();
    expect(resolveVideoCinematicTrigger({ hook: 'beforeCombat', combatId: 'lion_finale_duel' })).toBeUndefined();
    expect(resolveVideoCinematicTrigger({ hook: 'afterCombat', combatId: 'lion_chief', outcome: 'victory' })).toBeUndefined();
    expect(resolveVideoCinematicTrigger({ hook: 'chapterBeat', beatId: 'lion-finale' })).toBeUndefined();
  });

  it('is immutable and cannot mutate V6 game state', () => {
    const state = createInitialState();
    const before = JSON.stringify(state);
    expect(state.version).toBe(6);
    resolveVideoCinematicTrigger({ hook: 'beforeDialogue', dialogueId: 'lion_finale_judgement' });
    resolveVideoCinematicTrigger({ hook: 'beforeCombat', combatId: 'serpent_captain' });
    resolveVideoCinematicTrigger({ hook: 'beforeCombat', combatId: 'lion_chief' });
    expect(JSON.stringify(state)).toBe(before);
    expect(state.version).toBe(6);
    expect(Reflect.set(VIDEO_CINEMATIC_TRIGGERS.beforeDialogue, 'extra', 'forbidden')).toBe(false);
    expect(Reflect.set(VIDEO_CINEMATIC_TRIGGERS.beforeCombat, 'extra', 'forbidden')).toBe(false);
  });
});
