// @vitest-environment happy-dom
/**
 * OD-2026-11-13-F (N1, N2, N3), lines approved word for word by the operator on 2026-11-13
 * (docs/content/drafts/PLATEAU_FORKS_AND_MAELOR_LINES_DRAFT_2026-11-13.md).
 *
 * N1: one combat fork per Seal plateau. A choice that already existed keeps its facts and reputation and now costs a
 * fight in an existing arena; the other avoids it at its unchanged price. The victory reopens the same scene on its
 * outcome and the hero meeting of that branch. N2: Maelor's betrayal recalls Bois-Clair. N3: the epilogues tell his fate.
 */
import { describe, expect, it } from 'vitest';
import lionHonourComplete from '../../game/__fixtures__/demo-v6-lion-honour-complete.json';
import lionForceComplete from '../../game/__fixtures__/demo-v6-lion-force-complete.json';
import { resolveGameDialogue } from '../../game/contextualDialogueContent';
import { resolvePlateauVerdict, type PlateauFinaleDefinition } from '../../game/plateauFinale';
import { combatVictoryFacts } from '../../game/plateauProgression';
import { POST_DEMO_COMBATS } from '../../game/postDemoContent';
import { migrateState, createInitialState } from '../../game/store';
import type { DialogueSequence, GameState } from '../../game/types';
import { playPlateau, type PlateauPlaythrough } from '../../qa/plateauDriver';
import { BEAR_FINALE } from './bear/bearFinale';
import { DRAGON_FINALE } from './dragon/dragonFinale';
import { SCORPION_FINALE } from './scorpion/scorpionFinale';

interface Fork {
  dialogueId: string;
  combatId: string;
  victoryFact: string;
  finale: PlateauFinaleDefinition;
  fight: { index: number; flag: string; reputation: number; next: string; line: string };
  avoid: { index: number; flag: string; reputation: number };
  arena: string;
  enemies: string[];
  gold: number;
  reopened: { first: string; line: string };
}

const FORKS: readonly Fork[] = [
  {
    dialogueId: 'bear_ore_convoy', combatId: 'bear_convoy_escort', victoryFact: 'bearConvoyEscortDefeated', finale: BEAR_FINALE,
    fight: { index: 1, flag: 'bearConvoySeized', reputation: -1, next: 'escort',
      line: 'Les gardes ne s’enfuient pas. Ils se serrent autour des chariots, lames tirées.' },
    avoid: { index: 0, flag: 'bearConvoyReported', reputation: 1 },
    arena: 'bear_mountain_pass', enemies: ['raven_scout', 'raven_miner', 'raven_scout'], gold: 20,
    reopened: { first: 'seized', line: 'Les chariots sont à nous. Ce minerai sent la pierre froide… et autre chose.' },
  },
  {
    dialogueId: 'dragon_terrorized_village', combatId: 'dragon_village_raid', victoryFact: 'dragonVillageRaidRepelled', finale: DRAGON_FINALE,
    fight: { index: 0, flag: 'dragonVillageProtected', reputation: 1, next: 'raid',
      line: 'Des torches sur le sentier, et des loups devant les hommes. Le Loup descend, comme chaque nuit. Cette fois, nous l’attendons.' },
    avoid: { index: 1, flag: 'dragonVillageExtorted', reputation: -2 },
    arena: 'dragon_peak_trail', enemies: ['wolf_raider', 'wolf', 'wolf_raider'], gold: 25,
    reopened: { first: 'protected', line: 'Le Loup a goûté vos lames et il a tourné bride. C’est la première nuit que nous dormons depuis des semaines.' },
  },
  {
    dialogueId: 'scorpion_scholars', combatId: 'scorpion_scholars_camp', victoryFact: 'scorpionScholarsDefeated', finale: SCORPION_FINALE,
    fight: { index: 0, flag: 'scorpionFaithfulFreed', reputation: 0, next: 'refusal',
      line: 'Ce témoin appartient au Grand Inquisiteur. Si vous le voulez, il faudra nous le prendre.' },
    avoid: { index: 1, flag: 'scorpionFaithfulAbandoned', reputation: -2 },
    arena: 'scorpion_dune_track', enemies: ['scorpion_scholar', 'scorpion_scholar', 'scorpion_scholar'], gold: 30,
    reopened: { first: 'freed', line: 'Vous n’êtes pas des leurs ? Alors écoutez : au temple, un étranger parle à nos gardiens depuis des lunes. Il prophétise, et ils l’écoutent.' },
  },
];

const withFlags = (flags: Record<string, boolean>): GameState => {
  const state = createInitialState();
  Object.assign(state.flags, flags);
  return state;
};
const sequenceOf = (id: string, state: GameState = createInitialState()): DialogueSequence => resolveGameDialogue(id, state)!.sequence;
const stepOf = (sequence: DialogueSequence, id: string) => sequence.steps.find((step) => step.id === id);
const fights = (sequence: DialogueSequence) => sequence.steps.flatMap((step) => [...step.effects, ...(step.choices ?? []).flatMap((option) => option.effects)])
  .filter((effect) => effect.type === 'startCombat');
const reputationOf = (effects: readonly { type: string; amount?: number }[]) =>
  effects.reduce((sum, effect) => sum + (effect.type === 'addReputation' ? effect.amount ?? 0 : 0), 0);

describe('one combat fork per Seal plateau (OD-2026-11-13-F, N1)', () => {
  it('lets one existing choice start the fight and the other avoid it, with their facts and reputation unchanged', () => {
    for (const fork of FORKS) {
      const sequence = sequenceOf(fork.dialogueId);
      const choices = stepOf(sequence, 'choice')!.choices!;
      expect(choices, fork.dialogueId).toHaveLength(2);
      const fight = choices[fork.fight.index]!;
      const avoid = choices[fork.avoid.index]!;
      expect(fight.effects).toContainEqual({ type: 'startCombat', combatId: fork.combatId });
      expect(fight.effects).toContainEqual({ type: 'setFlag', key: fork.fight.flag, value: true });
      expect(reputationOf(fight.effects), fork.dialogueId).toBe(fork.fight.reputation);
      expect(avoid.effects.some((effect) => effect.type === 'startCombat'), fork.dialogueId).toBe(false);
      expect(avoid.effects).toContainEqual({ type: 'setFlag', key: fork.avoid.flag, value: true });
      expect(reputationOf(avoid.effects), fork.dialogueId).toBe(fork.avoid.reputation);
      // The fight branch announces the fight and ends the scene there: the fight follows, then the reopened scene.
      expect(fight.next).toBe(fork.fight.next);
      const announce = stepOf(sequence, fork.fight.next)!;
      expect(announce.text).toBe(fork.fight.line);
      expect([announce.next, announce.choices?.length ?? 0]).toEqual([null, 0]);
      expect(fights(sequence), fork.dialogueId).toHaveLength(1);
    }
  });

  it('plays each fight in an existing arena of its plateau, without reputation, and reopens the same scene after it', () => {
    for (const fork of FORKS) {
      const combat = POST_DEMO_COMBATS.get(fork.combatId)!;
      expect(combat, fork.combatId).toBeDefined();
      expect(combat.sceneId).toBe(fork.arena);
      expect(combat.enemyVisualIds).toEqual(fork.enemies);
      expect(combat.encounterRank).toBe('normal');
      expect(combat.rewards).toEqual({ gold: fork.gold, reputation: 0, materials: {} });
      expect(combat.postCombatDialogueId).toBe(fork.dialogueId);
      expect(combatVictoryFacts(fork.combatId)).toEqual({ [fork.victoryFact]: true });
      const reopened = sequenceOf(fork.dialogueId, withFlags({ [fork.victoryFact]: true }));
      expect(reopened.steps[0]!.id, fork.dialogueId).toBe(fork.reopened.first);
      expect(reopened.steps[0]!.text).toBe(fork.reopened.line);
      expect(fights(reopened), fork.dialogueId).toEqual([]);
      expect(stepOf(reopened, 'choice'), fork.dialogueId).toBeUndefined();
    }
  });

  it('weighs nothing with the technical victory fact: every verdict is the same with or without it', () => {
    for (const fork of FORKS) {
      const { finale, victoryFact } = fork;
      expect(Object.keys(finale.conductWeights)).not.toContain(victoryFact);
      expect(finale.deeds.map((deed) => deed.flag)).not.toContain(victoryFact);
      expect(finale.forceFacts).not.toContain(victoryFact);
      expect(finale.honourFact).not.toBe(victoryFact);
      const samples: Record<string, boolean>[] = [
        { [fork.fight.flag]: true },
        { [fork.avoid.flag]: true },
        { [fork.fight.flag]: true, [finale.honourFact]: true, [finale.witnesses.supportiveFlag]: true },
        { [fork.avoid.flag]: true, [finale.honourFact]: true, [finale.evidence.flag]: true },
      ];
      for (const flags of samples) for (const reputation of [30, 55, 70]) {
        expect(resolvePlateauVerdict(finale, { flags: { ...flags, [victoryFact]: true }, reputation }))
          .toEqual(resolvePlateauVerdict(finale, { flags, reputation }));
      }
    }
  });
});

describe('both branches of each fork, played end to end by the QA driver (OD-2026-11-13-F, N1)', () => {
  const lionEnd = (fixture: unknown, reputation: number): GameState => {
    const state = migrateState(structuredClone(fixture));
    state.reputation = reputation;
    return state;
  };
  const said = (run: PlateauPlaythrough, dialogueId: string) => run.lines.filter((line) => line.dialogueId === dialogueId);
  const honourBear = playPlateau('bear', lionEnd(lionHonourComplete, 57), { name: 'Bear honour', prefer: 'merit', intent: 'claim_recognition' });
  const greedyBear = playPlateau('bear', lionEnd(lionForceComplete, 40), { name: 'Bear greed', prefer: 'greed', intent: 'claim_recognition',
    answers: { bear_raven_messenger: 'bearRavenOfferRefused', bear_sacred_mines: 'bearMinesSeized' } });
  const honourDragon = playPlateau('dragon', honourBear.state, { name: 'Dragon honour', prefer: 'merit', intent: 'claim_recognition' });
  const greedyDragon = playPlateau('dragon', greedyBear.state, { name: 'Dragon greed', prefer: 'greed', intent: 'claim_recognition',
    answers: { dragon_wolf_envoy: 'dragonWolfOfferRefused', dragon_wolf_lair: 'dragonCrystalKept' } });
  const honourScorpion = playPlateau('scorpion', honourDragon.state, { name: 'Scorpion honour', prefer: 'merit', intent: 'claim_recognition' });
  const greedyScorpion = playPlateau('scorpion', greedyDragon.state, { name: 'Scorpion greed', prefer: 'greed', intent: 'claim_recognition',
    answers: { scorpion_phoenix_faithful: 'scorpionOathRefused', scorpion_phoenix_temple: 'scorpionCodexKept' } });
  const runs: Record<string, { fought: PlateauPlaythrough; avoided: PlateauPlaythrough; meetingAfter: string; meetingAvoided: string }> = {
    bear_ore_convoy: { fought: greedyBear, avoided: honourBear, meetingAfter: 'gunnar_react_s', meetingAvoided: 'gunnar_react_r' },
    dragon_terrorized_village: { fought: honourDragon, avoided: greedyDragon, meetingAfter: 'lyra_react_p', meetingAvoided: 'lyra_react_e' },
    scorpion_scholars: { fought: honourScorpion, avoided: greedyScorpion, meetingAfter: 'eldwin_react_f', meetingAvoided: 'eldwin_react_a' },
  };

  it('fights on one branch, then plays the reopened scene and its hero once; avoids the fight on the other', () => {
    for (const fork of FORKS) {
      const { fought, avoided, meetingAfter, meetingAvoided } = runs[fork.dialogueId]!;
      expect(fought.state.flags[fork.fight.flag], fork.dialogueId).toBe(true);
      expect(fought.fights, fork.dialogueId).toContain(fork.combatId);
      expect(fought.state.flags[fork.victoryFact]).toBe(true);
      const lines = said(fought, fork.dialogueId).map((line) => line.stepId);
      // The announce, then (after the fight) the reopened outcome and the hero's reaction to it, each once.
      expect(lines.indexOf(fork.fight.next)).toBeGreaterThanOrEqual(0);
      expect(lines.indexOf(fork.reopened.first)).toBeGreaterThan(lines.indexOf(fork.fight.next));
      expect(lines.filter((id) => id === meetingAfter), fork.dialogueId).toHaveLength(1);
      expect(lines).not.toContain(meetingAvoided);

      expect(avoided.state.flags[fork.avoid.flag], fork.dialogueId).toBe(true);
      expect(avoided.fights, fork.dialogueId).not.toContain(fork.combatId);
      expect(avoided.state.flags[fork.victoryFact]).toBeUndefined();
      const avoidedLines = said(avoided, fork.dialogueId).map((line) => line.stepId);
      expect(avoidedLines.filter((id) => id === meetingAvoided), fork.dialogueId).toHaveLength(1);
      expect(avoidedLines).not.toContain(meetingAfter);
    }
    // The Dragon's avoidance shows its price: the Wolf turns back for one night only.
    expect(said(greedyDragon, 'dragon_terrorized_village').map((line) => line.text))
      .toContain('Le Loup a vu nos feux et il a tourné bride sans combattre. Pour cette nuit, du moins.');
  });

  it('keeps each plateau’s outcome on both branches: honour for the honour runs, force for the greedy ones', () => {
    for (const run of [honourBear, honourDragon, honourScorpion]) expect(run.state.endingId).toMatch(/-seal-honour$/);
    for (const run of [greedyBear, greedyDragon, greedyScorpion]) expect(run.state.endingId).toMatch(/-seal-force$/);
  });
});

describe('Maelor recalls Bois-Clair at the betrayal (OD-2026-11-13-F, N2)', () => {
  const betrayal = (flags: Record<string, boolean>) => sequenceOf('finale_betrayal', withFlags(flags));
  const BOTH = 'Tout a commencé à Bois-Clair. Je vous ai dit que la porte basse était notre bourse, et vous avez emporté les coffres. Puis, quand les survivants ont voulu parler, vous leur avez imposé le silence.';
  const GREED = 'Tout a commencé à Bois-Clair. Je vous ai dit que la porte basse était notre bourse, et vous avez emporté les coffres pendant que les captifs partaient au nord.';
  const SILENCE = 'Tout a commencé à Bois-Clair. Quand les survivants ont voulu parler, il n’y avait plus de silence à acheter : vous leur avez imposé le silence.';

  it('says the approved line for each Lion fact, between the reveal and the advice, and nothing when the Lion did neither', () => {
    for (const [flags, text] of [
      [{ missionGreed: true, silencedWitnesses: true }, BOTH],
      [{ missionGreed: true }, GREED],
      [{ silencedWitnesses: true }, SILENCE],
    ] as const) {
      const sequence = betrayal(flags);
      expect(stepOf(sequence, 'reveal')!.next).toBe('boisclair');
      expect(stepOf(sequence, 'boisclair')).toMatchObject({ speaker: 'Maelor', text, next: 'advice' });
    }
    const untouched = betrayal({ missionSuccess: true, protectedWitnesses: true });
    expect(stepOf(untouched, 'boisclair')).toBeUndefined();
    expect(stepOf(untouched, 'reveal')!.next).toBe('advice');
  });

  it('no longer says he was never heeded after Bois-Clair, and keeps every other advice line', () => {
    expect(stepOf(betrayal({ missionGreed: true }), 'advice')!.text)
      .toBe('Depuis, vous ne m’avez plus écouté. Peu importe : il me suffisait d’entrer avec vous dans cette arène.');
    expect(stepOf(betrayal({}), 'advice')!.text)
      .toBe('Vous ne m’avez jamais écouté. Peu importe : il me suffisait d’entrer avec vous dans cette arène.');
    expect(stepOf(betrayal({ missionGreed: true, bearMinesSeized: true }), 'advice')!.text)
      .toBe('Vous m’avez écouté plus souvent que vous ne le croyez : le filon sombre gardé pour le clan. Chaque fois, vous avez servi ceux que je sers.');
  });
});

describe('the epilogues tell Maelor’s fate (OD-2026-11-13-F, N3)', () => {
  it('lets Kestrel say it right after the Seals, in the words approved for each ending', () => {
    const fates = {
      finale_epilogue_respect: 'Maelor n’est pas ressorti de la brèche. Elle s’est refermée sur lui, et les clans ne retiendront de lui qu’un nom qu’on ne prononce plus.',
      finale_epilogue_balance: 'Maelor n’est pas ressorti de la brèche. Elle s’est refermée sur lui, mais certains clans se demandent encore combien de ses conseils nous avons suivis.',
      finale_epilogue_fear: 'Maelor n’est pas ressorti de la brèche. Elle s’est refermée sur lui. Pour les clans, il était des nôtres jusqu’au bout, et c’est aussi pour cela qu’ils nous craignent.',
    };
    for (const [dialogueId, text] of Object.entries(fates)) {
      const sequence = sequenceOf(dialogueId);
      expect(stepOf(sequence, 'seals')!.next, dialogueId).toBe('maelor');
      expect(stepOf(sequence, 'maelor'), dialogueId).toMatchObject({ speaker: 'Kestrel', text });
      expect(stepOf(sequence, 'maelor')!.effects, dialogueId).toEqual([]);
    }
  });
});
