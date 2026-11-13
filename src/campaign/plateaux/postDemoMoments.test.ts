import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createInitialState } from '../../game/store';
import { anyCombatConfig } from '../../game/playableContent';
import { hasProvisionalArt, PLATEAU_FINALES, resolvePostDemoDialogue } from '../../game/postDemoContent';
import { BEAR_MOMENTS } from './bear/bearPresentation';
import { DRAGON_MOMENTS } from './dragon/dragonPresentation';
import { SCORPION_MOMENTS } from './scorpion/scorpionPresentation';
import { FINALE_MOMENTS } from './finale/finalePresentation';
import { postDemoMomentPlays } from './postDemoMoments';
import { POST_DEMO_MOMENTS, postDemoMomentAfter, postDemoMomentBefore, postDemoMomentImage } from './postDemoPresentation';

const PLATEAUX = [['bear', BEAR_MOMENTS], ['dragon', DRAGON_MOMENTS], ['scorpion', SCORPION_MOMENTS]] as const;
const firstLine = (dialogueId: string) => resolvePostDemoDialogue(dialogueId, createInitialState())!.steps[0]!;

describe('post-demo moment tables (set 1.20.0, validated 2026-11-13)', () => {
  it('hold thirteen moments: three per plateau and the final act’s four', () => {
    expect(POST_DEMO_MOMENTS).toHaveLength(13);
    expect(new Set(POST_DEMO_MOMENTS.map((moment) => moment.id)).size).toBe(13);
    for (const [, moments] of PLATEAUX) expect(moments.map((moment) => moment.id.split('_').at(-2))).toEqual(['arrival', 'honour', 'force']);
    expect(FINALE_MOMENTS.map((moment) => moment.beforeDialogueId)).toEqual(['finale_betrayal', 'finale_epilogue_respect', 'finale_epilogue_fear', 'finale_epilogue_balance']);
  });

  it('place each plateau’s arrival before its chief’s first dialogue, and its outcomes after their post-combat dialogues', () => {
    for (const [plateauId, [arrival, honour, force]] of PLATEAUX) {
      const finale = PLATEAU_FINALES[plateauId]!;
      expect(arrival!.afterDialogueId, plateauId).toBeUndefined();
      expect(firstLine(arrival!.beforeDialogueId).actorId, plateauId).toBe(finale.chief.actorId);
      expect(arrival!.sceneId).toBe(arrival!.beforeDialogueId);
      for (const [moment, path] of [[honour!, 'honour'], [force!, 'force']] as const) {
        expect(moment.afterDialogueId, moment.id).toBe(anyCombatConfig(finale.combats[path])?.postCombatDialogueId);
        expect(moment.beforeDialogueId, moment.id).toBe(finale.epilogueDialogueId);
        expect(moment.sceneId, moment.id).toBe(moment.afterDialogueId);
      }
    }
  });

  it('last at most 30 seconds, or 40 for the betrayal and the epilogues, and list established facts', () => {
    for (const moment of POST_DEMO_MOMENTS) {
      expect(moment.maxSeconds, moment.id).toBe(moment.id.startsWith('finale_') ? 40 : 30);
      expect(moment.facts.length, moment.id).toBeGreaterThan(0);
      expect(resolvePostDemoDialogue(moment.beforeDialogueId, createInitialState()), moment.id).toBeDefined();
    }
  });

  it('play on approved paintings: approved exactly while their plateau shows its final images', () => {
    for (const moment of POST_DEMO_MOMENTS) {
      const image = postDemoMomentImage(moment);
      expect(image && existsSync(join(process.cwd(), 'public', image)), moment.id).toBe(true);
      expect(moment.status, moment.id).toBe('approved');
      expect(moment.tableau === 'approved', moment.id).toBe(!hasProvisionalArt(moment.beforeDialogueId));
      expect(postDemoMomentPlays(moment), moment.id).toBe(true);
    }
    expect(postDemoMomentPlays({ ...BEAR_MOMENTS[0]!, tableau: 'provisional' })).toBe(false);
    expect(postDemoMomentPlays({ ...BEAR_MOMENTS[0]!, status: 'proposed' })).toBe(false);
  });

  it('never show what the following dialogue says first: no Seal at an outcome, no betrayal before its dialogue, no closing breach', () => {
    for (const moment of POST_DEMO_MOMENTS.filter((candidate) => candidate.afterDialogueId)) {
      for (const fact of moment.facts) expect(fact, moment.id).not.toMatch(/Sceau/);
    }
    const [betrayal, ...epilogues] = FINALE_MOMENTS;
    expect(betrayal!.sceneId).toBe('finale_pre_serpent_final');
    for (const fact of betrayal!.facts) expect(fact).not.toMatch(/Maelor|brèche|démon/);
    for (const epilogue of epilogues) {
      expect(epilogue.sceneId).toBe('finale_act_end');
      for (const fact of epilogue.facts) expect(fact, epilogue.id).not.toMatch(/se referme|bannières/);
    }
  });

  it('are found by the dialogue they precede or follow', () => {
    expect(postDemoMomentBefore('bear_audience')?.id).toBe('bear_arrival_moment');
    expect(postDemoMomentBefore('finale_betrayal')?.id).toBe('finale_betrayal_moment');
    expect(postDemoMomentBefore('finale_epilogue_fear')?.id).toBe('finale_fear_moment');
    // An epilogue that follows an outcome is not itself opened by a moment.
    expect(postDemoMomentBefore('bear_epilogue')).toBeUndefined();
    expect(postDemoMomentAfter('dragon_shaman_aftermath')?.id).toBe('dragon_honour_moment');
    expect(postDemoMomentAfter('scorpion_trial_aftermath')?.id).toBe('scorpion_force_moment');
    expect(postDemoMomentAfter('serpent_general_aftermath')).toBeUndefined();
    expect(postDemoMomentAfter(undefined)).toBeUndefined();
  });
});
