import { describe, expect, it } from 'vitest';
import { resolveLionVerdict } from './lionVerdict';

function verdict(flags: Record<string, boolean>, reputation = 30) {
  return resolveLionVerdict({ flags, reputation });
}

describe('Lion cumulative verdict', () => {
  it('A — resolves pure honour to respect and Serpent pursuit', () => {
    const result = verdict({
      lionMandateHonour: true,
      helpedRefugees: true,
      prioritizedVillage: true,
      missionSuccess: true,
      protectedWitnesses: true,
      protectedInformant: true,
    });
    expect(result.conductTier).toBe('honour');
    expect(result.stance).toBe('respect');
    expect(result.finalRoute).toBe('serpent_pursuit');
  });

  it('B — remembers an advance without letting it dominate an honourable run', () => {
    const result = verdict({
      lionMandateAdvance: true,
      helpedRefugees: true,
      prioritizedVillage: true,
      missionSuccess: true,
      protectedWitnesses: true,
    });
    expect(result.minorStains.map((entry) => entry.id)).toContain('requested_advance');
    expect(result.stance).toBe('respect_with_reservations');
    expect(result.finalRoute).toBe('serpent_pursuit');
  });

  it('C — resolves the real mixed playtest profile coherently', () => {
    const result = verdict({
      lionMandateAdvance: true,
      claimedLostTreasure: true,
      prioritizedLoot: true,
      helpedRefugees: true,
      missionSuccess: true,
      protectedWitnesses: true,
    });
    expect(result.conductTier).toBe('honour');
    expect(result.majorMerits.map((entry) => entry.id)).toContain('saved_bois_clair');
    expect(result.minorStains.map((entry) => entry.id)).toEqual(expect.arrayContaining([
      'requested_advance', 'claimed_lost_cargo', 'prioritized_loot',
    ]));
    expect(result.stance).toBe('respect_with_reservations');
    expect(result.finalRoute).toBe('serpent_pursuit');
  });

  it('D — sends an unsupported uncertain run to trial', () => {
    const result = verdict({
      lionMandateAdvance: true,
      prioritizedLoot: true,
      missionSuccess: true,
    });
    expect(result.conductTier).toBe('uncertain');
    expect(result.stance).toBe('uncertain');
    expect(result.finalRoute).toBe('lion_trial');
  });

  it('allows credible support, disclosed evidence, or public credibility to support an uncertain run', () => {
    const base = { lionMandateAdvance: true, prioritizedLoot: true, missionSuccess: true };
    expect(verdict({ ...base, protectedWitnesses: true }).finalRoute).toBe('serpent_pursuit');
    expect(verdict({ ...base, shadowEvidence: true, shadowRevealed: true }).finalRoute).toBe('serpent_pursuit');
    expect(verdict(base, 45).finalRoute).toBe('serpent_pursuit');
  });

  it('E — high public reputation cannot wash away infamy', () => {
    const result = verdict({
      exploitedRefugees: true,
      missionGreed: true,
      silencedWitnesses: true,
    }, 80);
    expect(result.conductTier).toBe('infamy');
    expect(result.stance).toBe('hostile');
    expect(result.finalRoute).toBe('lion_trial');
    expect(result.reasons).toContain('high_public_reputation');
  });

  it('F — low public reputation cannot erase honour and Bois-Clair', () => {
    const result = verdict({
      helpedRefugees: true,
      prioritizedVillage: true,
      missionSuccess: true,
      protectedWitnesses: true,
    }, 20);
    expect(result.conductTier).toBe('honour');
    expect(result.stance).toBe('respect');
    expect(result.finalRoute).toBe('serpent_pursuit');
    expect(result.reasons).toContain('low_public_reputation');
  });

  it('G — silenced witnesses force a trial even when the village was saved', () => {
    const result = verdict({
      helpedRefugees: true,
      prioritizedVillage: true,
      missionSuccess: true,
      protectedWitnesses: true,
      silencedWitnesses: true,
    });
    expect(result.conductTier).toBe('honour');
    expect(result.witnessState).toBe('silenced');
    expect(result.majorMerits.map((entry) => entry.id)).not.toContain('supportive_witnesses');
    expect(result.stance).toBe('distrust');
    expect(result.finalRoute).toBe('lion_trial');
  });

  it('H — sacrificing the village forces a trial at any reputation', () => {
    for (const reputation of [0, 45, 100]) {
      expect(verdict({ missionGreed: true }, reputation).finalRoute).toBe('lion_trial');
    }
  });

  it('I — a direct lie downgrades a heroic run without making Alaric hostile', () => {
    const result = verdict({
      helpedRefugees: true,
      prioritizedVillage: true,
      missionSuccess: true,
      protectedWitnesses: true,
      liedToAlaric: true,
    });
    expect(result.conductTier).toBe('honour');
    expect(result.majorBreaches.map((entry) => entry.id)).toContain('lied_to_alaric');
    expect(result.stance).toBe('respect_with_reservations');
    expect(result.finalRoute).toBe('serpent_pursuit');
  });

  it('J — a voluntary trial changes the route, not Alaric’s underlying stance', () => {
    const result = verdict({
      lionMandateHonour: true,
      helpedRefugees: true,
      prioritizedVillage: true,
      missionSuccess: true,
      protectedWitnesses: true,
      lionTrialRequested: true,
    });
    expect(result.stance).toBe('respect');
    expect(result.finalRoute).toBe('lion_trial');
  });

  it('gives decisive negative facts precedence in contradictory legacy saves', () => {
    const result = verdict({ missionSuccess: true, missionGreed: true }, 100);
    expect(result.majorMerits.map((entry) => entry.id)).toContain('saved_bois_clair');
    expect(result.majorBreaches.map((entry) => entry.id)).toContain('sacrificed_bois_clair');
    expect(result.finalRoute).toBe('lion_trial');
  });

  it('uses the R1 witness and Shadow precedence resolvers', () => {
    const result = verdict({
      missionSuccess: true,
      protectedWitnesses: true,
      silencedWitnesses: true,
      shadowEvidence: true,
      shadowRevealed: true,
      shadowConcealed: true,
    });
    expect(result.witnessState).toBe('silenced');
    expect(result.shadowKnowledge).toBe('evidence');
    expect(result.shadowDisclosure).toBe('revealed');
  });

  it('is pure, deterministic, and exposes semantic reason ids without prose', () => {
    const input = {
      flags: { lionMandateAdvance: true, missionSuccess: true, protectedWitnesses: true },
      reputation: 51,
    };
    const snapshot = structuredClone(input);
    const first = resolveLionVerdict(input);
    expect(resolveLionVerdict(input)).toEqual(first);
    expect(input).toEqual(snapshot);
    expect(first.reasons).toEqual(expect.arrayContaining([
      'saved_bois_clair', 'requested_advance', 'supportive_witnesses', 'credible_public_reputation',
    ]));
  });

  it('does not score alaricDoubt or treat reputation as conduct', () => {
    expect(verdict({ alaricDoubt: true }, 100).conductScore).toBe(0);
    expect(verdict({ exploitedRefugees: true }, 100).conductTier).toBe('infamy');
  });
});
