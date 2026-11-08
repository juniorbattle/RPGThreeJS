/**
 * Set 1.20.0 narrative coherence validator (AUTHORING_AND_QA), post-demo Lot 0. The Lion's consequence map passes; each
 * rule is also shown to fail on a broken case, so a draft plateau cannot pass by accident.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import lionMap from '../campaign/consequences/lion.consequences.json';
import bearMap from '../campaign/consequences/bear.consequences.json';
import dragonMap from '../campaign/consequences/dragon.consequences.json';
import scorpionMap from '../campaign/consequences/scorpion.consequences.json';
import finaleMap from '../campaign/consequences/finale.consequences.json';
import { campaignConsequenceMapSchema, consequenceMapSchema, type ConsequenceMap } from '../campaign/consequences/ConsequenceMap';
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
      // Plus four echoes in the final act (Lot 4): the Shadow evidence and the outcome, at the vigil and the rally.
      dialogues: 75, steps: 256, facts: 64, majorChoices: 13, implementedEchoes: 42, plannedEchoes: 0,
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

describe('the Bear draft passes the narrative coherence validator (Lot 1)', () => {
  const report = validateNarrativeCoherence(bearMap, sources);

  it('has no error and no exception: every Bear fact set is read, every choice echoed by a scene naming its cause', () => {
    expect(report.errors).toEqual([]);
    expect(report.excused).toEqual([]);
    // Its dark-ore echo into the Scorpion is implemented since Lot 3, its four into the final act since Lot 4.
    expect(report.stats).toMatchObject({ facts: 29, majorChoices: 11, implementedEchoes: 35, plannedEchoes: 0 });
  });

  it('carries the Lion into the Bear: every Lion echo planned for the Bear is now implemented', () => {
    const lion = consequenceMapSchema.parse(structuredClone(lionMap));
    const toBear = lion.majorChoices.flatMap((choice) => choice.echoes).filter((echo) => echo.chapterId === 'bear');
    expect(toBear).toHaveLength(8);
    expect(toBear.every((echo) => echo.status === 'implemented')).toBe(true);
  });
});

describe('the Dragon draft passes the narrative coherence validator (Lot 2)', () => {
  const report = validateNarrativeCoherence(dragonMap, sources);

  it('has no error and no exception: every Dragon fact set is read, every choice echoed by a scene naming its cause', () => {
    expect(report.errors).toEqual([]);
    expect(report.excused).toEqual([]);
    // Its three echoes into the Scorpion are implemented since Lot 3, its four into the final act since Lot 4.
    expect(report.stats).toMatchObject({ facts: 29, majorChoices: 11, implementedEchoes: 36, plannedEchoes: 0 });
  });

  it('carries the Lion and the Bear into the Dragon: every echo they hold for the Dragon is implemented', () => {
    const into = [lionMap, bearMap].flatMap((raw) => {
      const map = consequenceMapSchema.parse(structuredClone(raw));
      return [...map.majorChoices.flatMap((choice) => choice.echoes), ...Object.values(map.outcomes).flatMap((outcome) => outcome.echoes)];
    }).filter((echo) => echo.chapterId === 'dragon');
    expect(into).toHaveLength(5);
    expect(into.every((echo) => echo.status === 'implemented')).toBe(true);
  });
});

describe('the Scorpion draft passes the narrative coherence validator (Lot 3)', () => {
  const report = validateNarrativeCoherence(scorpionMap, sources);

  it('has no error and no exception: every Scorpion fact set is read, every choice echoed by a scene naming its cause', () => {
    expect(report.errors).toEqual([]);
    expect(report.excused).toEqual([]);
    // Plus its five echoes into the final act, implemented since Lot 4.
    expect(report.stats).toMatchObject({ facts: 29, majorChoices: 11, implementedEchoes: 33, plannedEchoes: 0 });
  });

  it('carries the Bear and the Dragon into the Scorpion: every echo they hold for the Scorpion is implemented', () => {
    const into = [bearMap, dragonMap].flatMap((raw) => {
      const map = consequenceMapSchema.parse(structuredClone(raw));
      return [...map.majorChoices.flatMap((choice) => choice.echoes), ...Object.values(map.outcomes).flatMap((outcome) => outcome.echoes)];
    }).filter((echo) => echo.chapterId === 'scorpion');
    expect(into).toHaveLength(4);
    expect(into.every((echo) => echo.status === 'implemented')).toBe(true);
  });

  it('keeps nothing planned: every Scorpion echo, the final act’s included, is implemented', () => {
    const map = consequenceMapSchema.parse(structuredClone(scorpionMap));
    const echoes = [...map.majorChoices.flatMap((choice) => choice.echoes), ...Object.values(map.outcomes).flatMap((outcome) => outcome.echoes)];
    expect(echoes.filter((echo) => echo.status === 'planned').every((echo) => echo.scope === 'final_act')).toBe(true);
  });
});

describe('the Bear consequence map is written first, as a design (Lot 1)', () => {
  it('passes the design check: every option has a planned echo and every name sits in its chapter', () => {
    expect(validateConsequenceMapDesign(bearMap)).toEqual([]);
    const map = consequenceMapSchema.parse(structuredClone(bearMap));
    // Written as a draft before any line; canon since the operator accepted the Bear (OD-2026-11-08-B).
    expect(map.status).toBe('canon');
    expect([map.outcomes.honour.relationStatus, map.outcomes.force.relationStatus]).toEqual(['approved', 'approved']);
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

describe('the Dragon consequence map is written first, as a design (Lot 2)', () => {
  it('passes the design check before any line exists, with the roadmap duality and the earlier plateaux echoed', () => {
    expect(validateConsequenceMapDesign(dragonMap)).toEqual([]);
    const map = consequenceMapSchema.parse(structuredClone(dragonMap));
    // Written as a draft before any line; canon since the operator accepted the Dragon (OD-2026-11-08-C).
    expect(map.status).toBe('canon');
    expect([map.outcomes.honour.relationStatus, map.outcomes.force.relationStatus]).toEqual(['approved', 'approved']);
    expect(map.majorChoices).toHaveLength(11);
    expect(map.outcomes.honour.clanRelations).toEqual([{ clan: 'dragon', stance: 'ally' }, { clan: 'wolf', stance: 'enemy' }]);
    expect(map.outcomes.force.clanRelations).toEqual([{ clan: 'dragon', stance: 'enemy' }, { clan: 'wolf', stance: 'enemy' }]);
    const alliance = map.majorChoices.find((choice) => choice.id === 'dragon.crystal')!.options[2]!;
    expect(alliance.clanRelations).toEqual([{ clan: 'wolf', stance: 'ally' }]);
    // The Lion's Shadows and the Bear's outcome and dark ore are echoed in the Dragon.
    const intoDragon = [lionMap, bearMap].flatMap((raw) => consequenceMapSchema.parse(structuredClone(raw)).majorChoices
      .flatMap((choice) => choice.echoes)
      .concat(Object.values(consequenceMapSchema.parse(structuredClone(raw)).outcomes).flatMap((outcome) => outcome.echoes)))
      .filter((echo) => echo.chapterId === 'dragon').map((echo) => echo.fact).sort();
    expect(intoDragon).toEqual(['bearDarkOreEvidence', 'bearMasterSpyDefeated', 'bearTrialWon', 'shadowConcealed', 'shadowRevealed']);
  });
});

describe('the Scorpion consequence map is written first, as a design (Lot 3)', () => {
  it('passes the design check before any line exists, names the chief by his title only, and echoes the earlier plateaux', () => {
    expect(validateConsequenceMapDesign(scorpionMap)).toEqual([]);
    const map = consequenceMapSchema.parse(structuredClone(scorpionMap));
    // Written as a draft before any line; canon since the operator accepted the Scorpion (OD-2026-11-08-D).
    expect(map.status).toBe('canon');
    expect([map.outcomes.honour.relationStatus, map.outcomes.force.relationStatus]).toEqual(['approved', 'approved']);
    expect(map.majorChoices).toHaveLength(11);
    expect(JSON.stringify(map)).not.toMatch(/Kael(?!en)/);
    expect(map.outcomes.honour.clanRelations).toEqual([{ clan: 'scorpion', stance: 'ally' }, { clan: 'phoenix', stance: 'enemy' }]);
    expect(map.outcomes.force.clanRelations).toEqual([{ clan: 'scorpion', stance: 'enemy' }, { clan: 'phoenix', stance: 'enemy' }]);
    const protectedCodex = map.majorChoices.find((choice) => choice.id === 'scorpion.codex')!.options[2]!;
    expect(protectedCodex.clanRelations).toEqual([{ clan: 'phoenix', stance: 'ally' }]);
    const into = [bearMap, dragonMap].flatMap((raw) => {
      const parsed = consequenceMapSchema.parse(structuredClone(raw));
      return [...parsed.majorChoices.flatMap((choice) => choice.echoes), ...Object.values(parsed.outcomes).flatMap((outcome) => outcome.echoes)];
    }).filter((echo) => echo.chapterId === 'scorpion').map((echo) => echo.fact).sort();
    expect(into).toEqual(['bearDarkOreEvidence', 'dragonShadowEvidence', 'dragonShadowShamanDefeated', 'dragonTrialWon']);
  });
});

describe('the final act consequence map is written first, as a design (Lot 4)', () => {
  const map = campaignConsequenceMapSchema.parse(structuredClone(finaleMap));
  const allEchoes = (raw: unknown) => {
    const parsed = campaignConsequenceMapSchema.parse(structuredClone(raw));
    return [...parsed.majorChoices.flatMap((choice) => choice.echoes), ...Object.values(parsed.outcomes ?? {}).flatMap((outcome) => outcome.echoes)];
  };

  it('passes the design check before any line exists, as a draft with no honour or force outcome of its own (R4 decides the ending)', () => {
    expect(validateConsequenceMapDesign(finaleMap)).toEqual([]);
    expect(map.status).toBe('draft');
    expect(map.outcomes).toBeUndefined();
    expect(map.majorChoices.map((choice) => choice.id)).toEqual(['finale.raven_verdict', 'finale.wolf_verdict', 'finale.phoenix_verdict',
      'finale.civilians', 'finale.trapped_citizens']);
    expect(JSON.stringify(map)).not.toMatch(/Kael(?!en)/);
  });

  it('makes a champion relevé an unexpected ally and a champion humilié an enemy, as §3.7 allows', () => {
    for (const clan of ['raven', 'wolf', 'phoenix'] as const) {
      const verdict = map.majorChoices.find((choice) => choice.id === `finale.${clan}_verdict`)!;
      expect(verdict.options.map((option) => option.clanRelations)).toEqual([[{ clan, stance: 'ally' }], [{ clan, stance: 'enemy' }]]);
    }
  });

  it('names a real place of the final act for every echo the four plateaux hold for it, all implemented', () => {
    const into = [lionMap, bearMap, dragonMap, scorpionMap].flatMap(allEchoes).filter((echo) => echo.chapterId === 'finale');
    expect(into).toHaveLength(17);
    expect(into.every((echo) => echo.status === 'implemented')).toBe(true);
    for (const echo of into) {
      expect(echo.nodeId, echo.id).not.toBe('finale-tbd');
      expect(['finale-allied-rally', 'finale-last-refuge', 'finale-bout-serpent'], echo.id).toContain(echo.nodeId);
      expect(echo.stepId, echo.id).toBeDefined();
    }
  });

  it('keeps a Seal plateau stating its honour and force outcomes', () => {
    const withoutOutcomes = structuredClone(bearMap) as Record<string, unknown>;
    delete withoutOutcomes.outcomes;
    expect(() => campaignConsequenceMapSchema.parse(withoutOutcomes)).toThrow(/honour and force outcomes/);
  });
});

describe('the final act draft passes the narrative coherence validator (Lot 4)', () => {
  const report = validateNarrativeCoherence(finaleMap, sources);

  it('has no error and no exception: every fact read, every choice echoed by a scene naming its cause, the epilogues planned', () => {
    expect(report.errors).toEqual([]);
    expect(report.excused).toEqual([]);
    expect(report.stats).toMatchObject({ facts: 18, majorChoices: 5, implementedEchoes: 10, plannedEchoes: 2 });
  });
});
