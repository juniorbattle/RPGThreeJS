import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../game/store';
import { greedPlateauState, perfectHonourPlateauState } from '../../game/reputationBounds';
import { POST_DEMO_DIALOGUES, postDemoSceneIds, resolvePostDemoDialogue } from '../../game/postDemoContent';
import type { DialogueStep, GameState } from '../../game/types';
import { pawnHeroFor } from '../../ui/PoiMapView';
import { ALDRIC_MEETING, ELDWIN_MEETING, GUNNAR_MEETING, LYRA_MEETING, MORVAN_MEETING, TALON_MEETING } from './heroMeetings';

/**
 * OD-2026-11-14-B, the operator's filled sheet « Alistair et le joueur »: the player is the « vous » of the prologue, the heir
 * never shown, and no hero is the player's avatar. The plateau's hero asks the questions before the choices (C1), the Fear
 * ending delivers the heir (B1, texts approved word for word), and Alistair's final-act role tag is « Bouclier » (D1).
 */
const COMPANY = new Set(['alistair', 'marian', 'kestrel', 'elara', 'sage_seraphine', 'maelor']);
const HERO: Readonly<Record<string, string>> = { bear: 'marian', dragon: 'elara', scorpion: 'kestrel' };
/** The questions Alistair keeps: the Tournament's three verdicts and the Fear ending's « Alors ? ». */
const KEPT = new Set(['finale_raven_verdict#choice', 'finale_wolf_verdict#choice', 'finale_phoenix_verdict#choice', 'finale_epilogue_fear#choice']);

function scenes(chapter: 'bear' | 'dragon' | 'scorpion' | 'finale') {
  const states: GameState[] = [createInitialState()];
  if (chapter !== 'finale') states.push(perfectHonourPlateauState(chapter), greedPlateauState(chapter));
  const built = postDemoSceneIds(chapter).flatMap((id) => states.map((state) => resolvePostDemoDialogue(id, state)!));
  const fixed = [...POST_DEMO_DIALOGUES.values()].filter((dialogue) => dialogue.id.startsWith(`${chapter}_`));
  return [...built, ...fixed];
}

const choiceSteps = (chapter: 'bear' | 'dragon' | 'scorpion' | 'finale') =>
  scenes(chapter).flatMap((scene) => scene.steps.filter((step) => step.choices?.length).map((step) => ({ key: `${scene.id}#${step.id}`, step })));

describe('Alistair and the player (OD-2026-11-14-B)', () => {
  for (const chapter of ['bear', 'dragon', 'scorpion'] as const) {
    it(`gives every company question of the ${chapter}'s road to ${HERO[chapter]}`, () => {
      const asked = choiceSteps(chapter).filter(({ step }) => COMPANY.has(step.actorId ?? ''));
      expect(asked.length).toBeGreaterThan(5);
      for (const { key, step } of asked) expect(step.actorId, key).toBe(HERO[chapter]);
    });
  }

  it('gives the recruitable heroes’ meeting questions to the hero of their plateau', () => {
    const meetings: [string, readonly DialogueStep[]][] = [
      ['marian', GUNNAR_MEETING.steps], ['marian', ALDRIC_MEETING.steps], ['elara', LYRA_MEETING.steps],
      ['elara', TALON_MEETING.steps], ['kestrel', ELDWIN_MEETING.steps], ['kestrel', MORVAN_MEETING.steps],
    ];
    for (const [hero, steps] of meetings) {
      const asked = steps.filter((step) => step.choices?.length);
      expect(asked.length).toBeGreaterThan(0);
      for (const step of asked) expect(step.actorId, step.id).toBe(hero);
    }
  });

  it('leaves Alistair four questions in the final act, Marian the civilians and Kestrel the citizens', () => {
    const asked = new Map(choiceSteps('finale').map(({ key, step }) => [key, step.actorId]));
    for (const key of KEPT) expect(asked.get(key), key).toBe('alistair');
    expect(asked.get('finale_arena_chaos#choice')).toBe('marian');
    expect(asked.get('finale_trapped_citizens#choice')).toBe('kestrel');
    expect([...asked].filter(([key, actor]) => actor === 'alistair' && !KEPT.has(key))).toEqual([]);
  });

  it('delivers the heir, not Alistair, in the Fear ending, with the approved words', () => {
    const fear = resolvePostDemoDialogue('finale_epilogue_fear', createInitialState())!;
    const demand = fear.steps.find((step) => step.id === 'demand')!;
    expect(demand.text).toBe('Ils vous craignent plus que la brèche. Ils exigent qu’on vous livre, pour acheter leur paix.');
    const fate = fear.steps.find((step) => step.id === 'choice')!.choices!.find((choice) => choice.text === 'Accepter mon destin.')!;
    expect(fate.outcomePreview?.hints).toEqual(['Vous vous livrez aux clans', 'Le clan, de nouveau déchu, survit']);
    const accepted = createInitialState();
    accepted.flags.finaleFearFateAccepted = true;
    const close = resolvePostDemoDialogue('finale_fear_close', accepted)!;
    expect(close.steps.find((step) => step.id === 'fate')!.text).toBe('Vous avez accepté votre destin, pour que les autres vivent.');
    for (const scene of [fear, close]) for (const step of scene.steps) expect(step.text, `${scene.id}#${step.id}`).not.toContain('Alistair');
  });

  it('tags Alistair « Bouclier » in the final act and keeps « Clan sans terre » for the meetings with a chief', () => {
    const tags = scenes('finale').flatMap((scene) => scene.steps).filter((step) => step.actorId === 'alistair').map((step) => step.tag);
    expect(tags).not.toContain('Clan sans terre');
    expect(tags.filter((tag) => tag === 'Bouclier').length).toBeGreaterThanOrEqual(6);
    for (const id of ['bear_audience', 'dragon_audience', 'scorpion_audience']) {
      expect(resolvePostDemoDialogue(id, createInitialState())!.steps.find((step) => step.id === 'alistair')!.tag).toBe('Clan sans terre');
    }
  });

  it('stands the hero of the part on the map, read from the POI id prefix (C2)', () => {
    expect(['lion-camp', 'bear-camp', 'dragon-camp', 'scorpion-camp', 'finale-arena'].map(pawnHeroFor))
      .toEqual(['alistair', 'marian', 'elara', 'kestrel', 'alistair']);
  });
});
