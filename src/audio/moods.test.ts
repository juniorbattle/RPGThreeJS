import { describe, expect, it } from 'vitest';
import { dialogues } from '../game/content';
import { SCENE_MOODS, sceneMood } from './moods';

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
});
