import { describe, expect, it } from 'vitest';
import { dialogues } from '../game/content';
import {
  ALARIC_AUDIENCE_TABLEAU,
  CAMP_DEPARTURE_TABLEAU,
  FOREST_AFTERMATH_TABLEAU,
  FOREST_THREAT_TABLEAU,
  NARRATIVE_BEAT_KINDS,
  resolveNarrativeBoundaryTableau,
  resolveNarrativeCombatTableau,
  resolveNarrativeDialogueTableau,
  validateDialogueCast,
  VALMIR_FORK_TABLEAU,
  type NarrativeTableauSpec,
} from './NarrativeTableau';

describe('Narrative Tableau presentation data', () => {
  it('maps only the reviewed prototype boundaries', () => {
    expect(resolveNarrativeBoundaryTableau('node:lion-camp:arrival')).toBe(CAMP_DEPARTURE_TABLEAU);
    expect(resolveNarrativeBoundaryTableau('node:lion-valmir-road:arrival')).toBe(VALMIR_FORK_TABLEAU);
    expect(resolveNarrativeBoundaryTableau('node:lion-refugees:arrival')).toBeUndefined();
  });

  it('maps Audience, threat, and aftermath from authoritative IDs', () => {
    expect(resolveNarrativeDialogueTableau('lion_briefing')).toBe(ALARIC_AUDIENCE_TABLEAU);
    expect(resolveNarrativeDialogueTableau('pre_opening_trail')).toBe(FOREST_THREAT_TABLEAU);
    expect(resolveNarrativeDialogueTableau('post_opening_trail')).toBe(FOREST_AFTERMATH_TABLEAU);
    expect(resolveNarrativeCombatTableau('forest_ambush')).toBe(FOREST_THREAT_TABLEAU);
    expect(resolveNarrativeCombatTableau('wolf_pack')).toBe(FOREST_THREAT_TABLEAU);
    expect(resolveNarrativeCombatTableau('lion_chief')).toBeUndefined();
  });

  it('keeps every required beat kind explicit', () => {
    expect(NARRATIVE_BEAT_KINDS).toEqual([
      'VISUAL', 'SPEAKER_CARD', 'CINEMATIC_SUBTITLE', 'HELD_DIALOGUE', 'SPATIAL_CHOICE',
      'ROUTE_CHOICE', 'CONTEXT_ACTION', 'TRANSITION', 'COMBAT_HANDOFF', 'WAIT_FOR_INPUT',
    ]);
  });

  it('derives all four Audience speakers from dialogue truth', () => {
    const sequence = dialogues.get('lion_briefing')!;
    const alignment = validateDialogueCast(ALARIC_AUDIENCE_TABLEAU, sequence);
    expect(alignment).toEqual({
      status: 'PASS',
      requiredSpeakers: ['alaric', 'alistair', 'sage_seraphine', 'maelor'],
      visuallyCovered: ['alaric', 'alistair', 'sage_seraphine', 'maelor'],
      justifiedOffscreen: [],
      unresolved: [],
    });
    expect(alignment.requiredSpeakers).not.toContain('lion_champion');
  });

  it('never silently passes a missing major speaker', () => {
    const sequence = dialogues.get('lion_briefing')!;
    const mismatched: NarrativeTableauSpec = {
      ...ALARIC_AUDIENCE_TABLEAU,
      cast: { ...ALARIC_AUDIENCE_TABLEAU.cast, visualActors: ['alaric', 'alistair'] },
    };
    expect(validateDialogueCast(mismatched, sequence)).toMatchObject({
      status: 'FAIL',
      unresolved: ['sage_seraphine', 'maelor'],
    });
  });

  it('accepts only an explicit offscreen reason', () => {
    const sequence = dialogues.get('lion_briefing')!;
    const justified: NarrativeTableauSpec = {
      ...ALARIC_AUDIENCE_TABLEAU,
      cast: {
        ...ALARIC_AUDIENCE_TABLEAU.cast,
        visualActors: ['alaric', 'alistair', 'sage_seraphine'],
        justifiedOffscreen: [{ actorId: 'maelor', reason: 'His warning begins immediately before the counter-shot.' }],
      },
    };
    expect(validateDialogueCast(justified, sequence)).toMatchObject({
      status: 'PASS_WITH_JUSTIFIED_OFFSCREEN',
      unresolved: [],
      justifiedOffscreen: [{ actorId: 'maelor', reason: 'His warning begins immediately before the counter-shot.' }],
    });
  });

  it('keeps two advisers in high-stakes Audience and Valmir presentation', () => {
    expect(ALARIC_AUDIENCE_TABLEAU.cast.playerRepresentatives).toEqual(['sage_seraphine', 'maelor']);
    expect(VALMIR_FORK_TABLEAU.cast.playerRepresentatives).toEqual(['sage_seraphine', 'maelor']);
    expect(VALMIR_FORK_TABLEAU.anchors.map((anchor) => anchor.routeIndex)).toEqual([0, 1]);
    expect(VALMIR_FORK_TABLEAU.mediaRemasterNeeded).not.toBe(true);
  });

  it('stores references rather than dialogue or route-choice copies', () => {
    const encoded = JSON.stringify([
      CAMP_DEPARTURE_TABLEAU,
      ALARIC_AUDIENCE_TABLEAU,
      FOREST_THREAT_TABLEAU,
      FOREST_AFTERMATH_TABLEAU,
      VALMIR_FORK_TABLEAU,
    ]);
    expect(encoded).not.toContain('Accepter la mission');
    expect(encoded).not.toContain('Vieux sanctuaire');
    expect(encoded).not.toContain('Barrage renforcé');
    expect(encoded).not.toContain('Votre clan réclame');
    expect(encoded).toContain('RESOLVED_CAMPAIGN_TABLEAU');
  });
});
