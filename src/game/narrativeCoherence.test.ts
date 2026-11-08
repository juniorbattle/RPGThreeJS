/**
 * Set 1.20.0 narrative coherence validator (AUTHORING_AND_QA), post-demo Lot 0. The Lion's consequence map passes; each
 * rule is also shown to fail on a broken case, so a draft plateau cannot pass by accident.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import lionMap from '../campaign/consequences/lion.consequences.json';
import bearMap from '../campaign/consequences/bear.consequences.json';
import { consequenceMapSchema, type ConsequenceMap } from '../campaign/consequences/ConsequenceMap';
import { validateConsequenceMapDesign, validateNarrativeCoherence, type SourceFile } from './narrativeCoherence';
import type { DialogueSequence } from './types';

function loadSources(): SourceFile[] {
  return (readdirSync('src', { recursive: true }) as string[])
    .map((path) => `src/${path.replaceAll('\\', '/')}`)
    .filter((path) => path.endsWith('.ts') && !path.endsWith('.test.ts') && !path.endsWith('.d.ts') && !path.startsWith('src/qa/'))
    .map((path) => ({ path, text: readFileSync(path, 'utf8') }));
}

const sources = loadSources();
const baseMap = (): ConsequenceMap => consequenceMapSchema.parse(structuredClone(lionMap));

function draft(id: string, steps: DialogueSequence['steps']): DialogueSequence {
  return { id, steps } as DialogueSequence;
}

function step(id: string, overrides: Partial<DialogueSequence['steps'][number]> = {}): DialogueSequence['steps'][number] {
  return { id, speaker: 'Alistair', actorId: 'alistair', tag: '', text: 'Réplique de brouillon.', expression: 'neutral',
    portrait: '', side: 'left', next: null, effects: [], choices: [], ...overrides };
}

describe('the Lion consequence map passes the narrative coherence validator', () => {
  const report = validateNarrativeCoherence(lionMap, sources);

  it('has no error: every major choice is echoed later by a scene that names its cause', () => {
    expect(report.errors).toEqual([]);
    expect(report.stats).toEqual({
      dialogues: 75, steps: 256, facts: 64, majorChoices: 13, implementedEchoes: 28, plannedEchoes: 8,
    });
  });

  it('documents every known gap as an exception with its reason', () => {
    const byKind = report.excused.reduce<Record<string, number>>((counts, finding) => {
      counts[finding.kind] = (counts[finding.kind] ?? 0) + 1;
      return counts;
    }, {});
    expect(byKind).toEqual({ unreachable_dialogue: 4, fact_set_never_read: 25 });
    expect(report.excused.filter((finding) => finding.kind === 'unreachable_dialogue').map((finding) => finding.subject).sort())
      .toEqual(['mystery_ambush', 'mystery_troll_crossing', 'roadside_peddler', 'serpent_duelist_trial']);
    for (const finding of report.excused) expect(finding.reason.length).toBeGreaterThan(20);
  });

  it('keeps the map truthful: each option states the reputation its effects move in the demo', () => {
    const map = baseMap();
    const bois = map.majorChoices.find((choice) => choice.id === 'lion.bois_clair')!;
    expect(bois.options.map((option) => option.reputation)).toEqual([10, -10]);
    expect(map.outcomes.honour.relationStatus).toBe('approved');
    expect(map.outcomes.honour.clanRelations).toEqual([{ clan: 'lion', stance: 'ally' }, { clan: 'serpent', stance: 'enemy' }]);
  });
});

describe('each coherence rule fails on a broken case', () => {
  const kinds = (map: unknown, drafts: DialogueSequence[] = []) =>
    validateNarrativeCoherence(map, sources, { draftDialogues: drafts }).errors.map((finding) => `${finding.kind}:${finding.subject}`);

  it('an echo that does not contain its cause phrase', () => {
    const map = baseMap();
    map.majorChoices[1]!.echoes[0]!.causePhrase = 'vous avez sauvé des réfugiés imaginaires';
    expect(kinds(map)).toContain('echo_without_cause:lion.refugees.helped.judgement');
  });

  it('an echo whose phrase shows even without the fact: it does not name its cause', () => {
    const map = baseMap();
    Object.assign(map.majorChoices[1]!.echoes[0]!, { stepId: 'intent', causePhrase: 'Vous ne pouvez plus modifier la route' });
    expect(kinds(map)).toContain('echo_without_cause:lion.refugees.helped.judgement');
  });

  it('a major choice option with no implemented echo', () => {
    const map = baseMap();
    map.majorChoices[1]!.echoes[1]!.status = 'planned';
    expect(kinds(map)).toContain('choice_without_echo:lion.refugees:1');
  });

  it('an echo placed before the choice it shows', () => {
    const map = baseMap();
    Object.assign(map.majorChoices[6]!.echoes[0]!, { nodeId: 'lion-audience' });
    expect(kinds(map)).toContain('choice_without_echo:lion.bois_clair.saved.judgement');
  });

  it('a map that disagrees with content: facts set and reputation moved', () => {
    const map = baseMap();
    map.majorChoices[1]!.options[0]!.sets = ['exploitedRefugees'];
    map.majorChoices[1]!.options[0]!.reputation = 3;
    expect(kinds(map).filter((entry) => entry === 'map_mismatch:lion.refugees:0')).toHaveLength(2);
  });

  it('a fact missing from the map, and a documented gap whose exception is removed', () => {
    const map = baseMap();
    map.facts = map.facts.filter((fact) => fact.id !== 'missionSuccess');
    map.exceptions = map.exceptions.filter((entry) => entry.subject !== 'alaricDoubt');
    const found = kinds(map);
    expect(found).toContain('map_mismatch:missionSuccess');
    expect(found).toContain('fact_set_never_read:alaricDoubt');
  });

  it('an exception that no longer matches anything', () => {
    const map = baseMap();
    map.exceptions.push({ kind: 'unknown_actor', subject: 'nobody', reason: 'Exception laissée par erreur pour le test.' });
    expect(kinds(map)).toContain('stale_exception:nobody');
  });

  it('a draft with a broken link, an unknown actor, an unreachable step, a corrupted character and no way in', () => {
    const broken = draft('draft_broken', [
      step('1', { next: '9' }),
      step('2', { actorId: 'nameless_stranger' }),
      step('3', { text: 'RÃ©plique corrompue.' }),
    ]);
    const found = kinds(baseMap(), [broken]);
    expect(found).toContain('broken_link:draft_broken:1');
    expect(found).toContain('unknown_actor:draft_broken:2');
    expect(found).toContain('unreachable_step:draft_broken:2');
    expect(found).toContain('corrupted_text:draft_broken:3');
    expect(found).toContain('unreachable_dialogue:draft_broken');
  });

  it('a fact read and never set', () => {
    const map = baseMap();
    map.facts.push({ id: 'draftNeverSet', kind: 'flag', summary: 'Fait de brouillon lu sans être posé.' });
    const reader = draft('draft_reader', [step('1', { choices: [
      { text: 'Choix gardé.', next: null, requiresFlag: 'draftNeverSet', effects: [] },
      { text: 'Autre choix.', next: null, effects: [] },
    ] })]);
    expect(kinds(map, [reader])).toContain('fact_read_never_set:draftNeverSet');
  });
});

describe('the Bear consequence map is written first, as a design (Lot 1)', () => {
  it('passes the design check: every option has a planned echo and every name sits in its chapter', () => {
    expect(validateConsequenceMapDesign(bearMap)).toEqual([]);
    const map = consequenceMapSchema.parse(structuredClone(bearMap));
    expect(map.status).toBe('draft');
    expect(map.majorChoices).toHaveLength(11);
    expect(map.outcomes.honour.clanRelations).toEqual([{ clan: 'bear', stance: 'ally' }, { clan: 'raven', stance: 'enemy' }]);
    expect(JSON.stringify(map)).not.toMatch(/Kael(?!en)/);
  });

  it('fails a design that forgets an echo, names a place outside the plateau or echoes an undeclared fact', () => {
    const map = consequenceMapSchema.parse(structuredClone(bearMap));
    map.majorChoices[0]!.echoes = map.majorChoices[0]!.echoes.filter((echo) => echo.fact !== 'bearMandateOreShare');
    map.majorChoices[1]!.nodeId = 'lion-audience';
    map.majorChoices[2]!.echoes[0]!.fact = 'bearUnknownFact';
    const subjects = validateConsequenceMapDesign(map).map((finding) => finding.subject);
    expect(subjects).toContain('bear.mandate:1');
    expect(subjects).toContain('bear.raven_offer');
    expect(subjects).toContain('bear.trapped_miners.rescued.judgement');
  });
});
