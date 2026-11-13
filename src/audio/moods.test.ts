import { describe, expect, it } from 'vitest';
import { dialogues } from '../game/content';
import { createInitialState } from '../game/store';
import { POST_DEMO_DIALOGUES, postDemoSceneIds, resolvePostDemoDialogue } from '../game/postDemoContent';
import { POST_DEMO_MOMENTS, POST_DEMO_PROVISIONAL_SCENES } from '../campaign/plateaux/postDemoPresentation';
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
    expect(sceneMood('bear_arrival')).toBe('refuge');
  });

  // OD-2026-11-13-F (P1). A new post-demo dialogue (N1 to N3 included) adds its key in moods.ts.
  const postDemoIds = [...new Set([...POST_DEMO_DIALOGUES.keys(),
    ...(['bear', 'dragon', 'scorpion', 'finale'] as const).flatMap((chapter) => postDemoSceneIds(chapter))])].sort();
  // Moods the operator chose apart from the counterpart rule (5 A): the epilogues of fear and balance as `epilogue`.
  const operatorChosen: Readonly<Record<string, string>> = { finale_epilogue_fear: 'drama', finale_epilogue_balance: 'drama' };

  it('give every post-demo dialogue a decided mood, refuge written out, and nothing else (OD-2026-11-13-F, P1)', () => {
    expect(postDemoIds.length).toBeGreaterThanOrEqual(91);
    expect(Object.keys(POST_DEMO_SCENE_MOODS).sort()).toEqual(postDemoIds);
    expect(new Set(Object.values(POST_DEMO_SCENE_MOODS))).toEqual(new Set(['refuge', 'tension', 'drama']));
  });

  it('give each post-demo dialogue the mood of the Lion dialogue its scene was drawn from (OD-2026-11-13-F, P1)', () => {
    for (const id of postDemoIds) {
      const counterpart = POST_DEMO_PROVISIONAL_SCENES[id]?.environmentContext;
      expect(counterpart, id).toMatch(/^dialogue:/);
      const lionMood = SCENE_MOODS[counterpart!.slice('dialogue:'.length)];
      expect(lionMood, `${id} <- ${counterpart}`).toBeDefined();
      expect(POST_DEMO_SCENE_MOODS[id], `${id} <- ${counterpart}`).toBe(operatorChosen[id] ?? lionMood);
    }
    // The pre-combat scenes, judgements, vigils, the breach and the end of the act are heard in tension or drama.
    expect([sceneMood('bear_borin_pre_combat'), sceneMood('bear_judgement'), sceneMood('dragon_vigil')]).toEqual(['tension', 'drama', 'tension']);
    expect([sceneMood('finale_breach_confrontation'), sceneMood('finale_breach_aftermath'), sceneMood('finale_act_end')]).toEqual(['tension', 'drama', 'drama']);
    expect([sceneMood('scorpion_oasis_gathering'), sceneMood('finale_capital_arrival')]).toEqual(['refuge', 'refuge']);
  });
});
