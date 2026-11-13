import { describe, expect, it } from 'vitest';
import { dialogues } from '../game/content';
import { createInitialState } from '../game/store';
import { resolvePostDemoDialogue } from '../game/postDemoContent';
import { POST_DEMO_MOMENTS } from '../campaign/plateaux/postDemoPresentation';
import { POST_DEMO_SCENE_MOODS, SCENE_MOODS, sceneMood } from './moods';

describe('narrative moods', () => {
  it('place every authored scene, and nothing else', () => {
    const authored = [...dialogues.keys()].sort();
    expect(Object.keys(SCENE_MOODS).sort()).toEqual(authored);
  });

  it('use all three moods, and the refuge context for a scene without one', () => {
    expect(new Set(Object.values(SCENE_MOODS))).toEqual(new Set(['refuge', 'tension', 'drama']));
    expect(sceneMood('village_choice')).toBe('drama');
    expect(sceneMood('pre_lion_chief')).toBe('tension');
    expect(sceneMood('roadside_peddler')).toBe('refuge');
    expect(sceneMood('not_a_scene')).toBe('refuge');
    expect(sceneMood(null)).toBe('refuge');
  });

  it('give the post-demo dialogues of the living tableaux the mood of their Lion counterpart (set 1.20.0, 2026-11-13)', () => {
    const state = createInitialState();
    for (const id of Object.keys(POST_DEMO_SCENE_MOODS)) {
      expect(resolvePostDemoDialogue(id, state), id).toBeDefined();
      expect(SCENE_MOODS[id], id).toBeUndefined();
    }
    // Every moment's dialogue, and the post-combat dialogue an outcome follows, has its key.
    for (const moment of POST_DEMO_MOMENTS) {
      for (const id of [moment.beforeDialogueId, moment.afterDialogueId].filter((value): value is string => Boolean(value))) {
        expect(POST_DEMO_SCENE_MOODS[id], id).toBeDefined();
      }
    }
    expect([sceneMood('bear_audience'), sceneMood('lion_briefing')]).toEqual(['tension', 'tension']);
    expect([sceneMood('finale_betrayal'), sceneMood('shadow_signs')]).toEqual(['tension', 'tension']);
    expect([sceneMood('scorpion_trial_aftermath'), sceneMood('lion_trial_aftermath')]).toEqual(['drama', 'drama']);
    expect([sceneMood('finale_epilogue_fear'), sceneMood('epilogue')]).toEqual(['drama', 'drama']);
    expect(sceneMood('bear_vigil')).toBe('refuge');
  });
});
