import regressionSnapshot from './r7FastRegressionSnapshot.json';
import { describe, expect, it } from 'vitest';
import {
  R7_BASELINE_HEAD,
  aggregateLionSimulation,
  auditAllAteRules,
  auditFactSeedInvariance,
  auditProfileDistribution,
  auditR4ReputationDistribution,
  buildR7FastRegressionSnapshot,
  generateCanonicalLionProfiles,
  generateControlledProfileMatrix,
  generateLegacyContradictionProfiles,
  measureEquivalentFixture,
  productionEquivalentVariantGroupCount,
  probeR4SpacingAndCooldowns,
  reputationDefinitions,
  resolveEquivalentFixture,
  resolveProfileDialogue,
  serializeReloadSimulation,
  simulateLionRunProfile,
  simulateLionSeedRange,
  validateCoherentProfile,
} from './r7LionSimulation';

function canonical(id: string) {
  return generateCanonicalLionProfiles().find((profile) => profile.id === id)!;
}

describe('R7 coherent profile generation and controlled matrix', () => {
  it('keeps the exact audit baseline and all required authored families', () => {
    expect(R7_BASELINE_HEAD).toBe('098b774136e6e6aee33dc532aa67eb31febc54ee');
    const profiles = generateCanonicalLionProfiles();
    expect(profiles).toHaveLength(24);
    expect(new Set(profiles.map((profile) => profile.id)).size).toBe(24);
    expect(profiles.every((profile) => validateCoherentProfile(profile).valid)).toBe(true);
    expect(generateLegacyContradictionProfiles()).toHaveLength(5);
  });

  it('rejects impossible cross-product records with documented validity rules', () => {
    expect(validateCoherentProfile({
      ...canonical('PURE_HONOUR'),
      id: 'invalid-disclosure',
      shadow: 'none',
      disclosure: 'revealed',
    }).reasons).toContain('disclosure_requires_definitive_evidence');
    const matrix = generateControlledProfileMatrix();
    expect(matrix.attemptedCount).toBe(2_268);
    expect(matrix.profiles.length).toBeGreaterThan(0);
    expect(matrix.rejectedCount).toBeGreaterThan(0);
    expect(matrix.profiles.every((profile) => validateCoherentProfile(profile).valid)).toBe(true);
  });
});

describe('R7 fact-determined narrative invariants', () => {
  const seeds = Array.from({ length: 64 }, (_, index) => index);

  it.each([
    'PURE_HONOUR',
    'REAL_MIXED_PROFILE',
    'UNCERTAIN',
    'INFAMY',
    'HIGH_REPUTATION_PLUS_INFAMY',
    'LOW_REPUTATION_PLUS_HONOUR',
    'SAVED_BOIS_CLAIR_PLUS_SILENCED_WITNESSES',
    'SACRIFICED_BOIS_CLAIR_PLUS_HIGH_REPUTATION',
    'BETRAYED_INFORMANT',
    'VOLUNTARY_LION_TRIAL',
  ])('%s is seed-invariant for moral meaning and route', (id) => {
    const results = simulateLionSeedRange(canonical(id), seeds);
    expect(auditFactSeedInvariance(results)).toEqual({ invariant: true, differingFields: [] });
    expect(results.every((result) => result.impossibleOutcomes.length === 0)).toBe(true);
  });

  it('keeps reputation as social perception rather than a morality override', () => {
    const highInfamy = simulateLionRunProfile(canonical('HIGH_REPUTATION_PLUS_INFAMY'), 41);
    const lowHonour = simulateLionRunProfile(canonical('LOW_REPUTATION_PLUS_HONOUR'), 41);
    expect(highInfamy.conduct).toBe('infamy');
    expect(highInfamy.stance).toBe('hostile');
    expect(highInfamy.finalRoute).toBe('lion_trial');
    expect(lowHonour.conduct).toBe('honour');
    expect(lowHonour.stance).toBe('respect');
    expect(lowHonour.finalRoute).toBe('serpent_pursuit');
  });

  it('preserves decisive Bois-Clair, witness, informant, lie, and Shadow facts', () => {
    const sacrifice = simulateLionRunProfile(canonical('SACRIFICED_BOIS_CLAIR_PLUS_HIGH_REPUTATION'), 9);
    const silenced = simulateLionRunProfile(canonical('SAVED_BOIS_CLAIR_PLUS_SILENCED_WITNESSES'), 9);
    const betrayed = simulateLionRunProfile(canonical('BETRAYED_INFORMANT'), 9);
    const lied = simulateLionRunProfile(canonical('HEROIC_PLUS_LIE_TO_ALARIC'), 9);
    expect(sacrifice.verdictReasonIds).toContain('sacrificed_bois_clair');
    expect(silenced.witnessState).toBe('silenced');
    expect(betrayed.verdictReasonIds).toContain('betrayed_informant');
    expect(lied.verdictReasonIds).toContain('lied_to_alaric');
    expect(simulateLionRunProfile(canonical('SHADOW_FRAGMENTS'), 9).shadowKnowledge).toBe('fragments');
    expect(simulateLionRunProfile(canonical('DEFINITIVE_SHADOW_EVIDENCE'), 9).shadowKnowledge).toBe('evidence');
  });

  it('uses authoritative precedence for every supported legacy contradiction', () => {
    const results = Object.fromEntries(generateLegacyContradictionProfiles().map((profile) => [
      profile.id,
      simulateLionRunProfile(profile, 17),
    ]));
    expect(results.LEGACY_SAVED_AND_SACRIFICED_BOIS_CLAIR!.verdictReasonIds).toEqual(
      expect.arrayContaining(['saved_bois_clair', 'sacrificed_bois_clair']),
    );
    expect(results.LEGACY_SUPPORTIVE_AND_SILENCED_WITNESSES!.witnessState).toBe('silenced');
    expect(results.LEGACY_FRAGMENTS_AND_EVIDENCE!.shadowKnowledge).toBe('evidence');
    expect(results.LEGACY_REVEALED_AND_CONCEALED!.shadowDisclosure).toBe('revealed');
    expect(results.LEGACY_BOTH_FINALE_SELECTION_FLAGS!.persistedFinaleCombat).toBe('lion_chief');
  });
});

describe('R7 R3 and ATE audit', () => {
  it('measures the pure equivalent-group algorithm without inventing production variants', () => {
    expect(productionEquivalentVariantGroupCount()).toBe(0);
    for (const seed of [0, 1, 2, 49, 999]) {
      expect(resolveEquivalentFixture(seed)).toBe(resolveEquivalentFixture(seed));
      expect(resolveEquivalentFixture(seed, true)).toBe(resolveEquivalentFixture(seed));
    }
    const counts = measureEquivalentFixture(Array.from({ length: 1_000 }, (_, index) => index));
    expect(Object.keys(counts)).toEqual(['equivalent-a', 'equivalent-b', 'equivalent-c']);
    expect(Math.min(...Object.values(counts))).toBeGreaterThan(250);
  });

  it('keeps decisive contextual variants seed-invariant', () => {
    for (const id of [
      'PURE_HONOUR', 'REAL_MIXED_PROFILE', 'INFAMY', 'SAVED_BOIS_CLAIR_PLUS_SILENCED_WITNESSES',
      'SHADOW_REVEALED', 'SHADOW_CONCEALED', 'CEDRIC_RECRUITED', 'CEDRIC_ABSENT',
    ]) {
      expect(auditProfileDistribution(canonical(id), [0, 1, 2, 3, 4]).contextualSeedInvariant).toBe(true);
    }
  });

  it('selects decisive contextual variants by facts and priority', () => {
    const honour = simulateLionRunProfile(canonical('PURE_HONOUR'), 6);
    const savedMixed = simulateLionRunProfile({
      ...canonical('UNCERTAIN'),
      id: 'R7_SAVED_MIXED_PROBE',
      refugees: 'exploited',
      family: 'infamy',
    }, 6);
    const sacrificed = simulateLionRunProfile(canonical('INFAMY'), 6);
    const contradictory = simulateLionRunProfile(generateLegacyContradictionProfiles()[0]!, 6);
    const variant = (result: ReturnType<typeof simulateLionRunProfile>, dialogueId: string) => (
      result.ateResults.find((entry) => entry.dialogueId === dialogueId)?.variantId
      ?? result.contextualResolutions.find((entry) => entry.dialogueId === dialogueId)?.variantId
    );
    expect(variant(honour, 'ate_maelor_seal_analysis')).toBe('bois-clair-saved-honour');
    expect(variant(savedMixed, 'ate_maelor_seal_analysis')).toBe('bois-clair-saved-mixed');
    expect(variant(sacrificed, 'ate_maelor_seal_analysis')).toBe('bois-clair-sacrificed');
    expect(variant(contradictory, 'ate_maelor_seal_analysis')).toBe('bois-clair-contradictory-legacy');
    expect(variant(simulateLionRunProfile(canonical('SAVED_BOIS_CLAIR_PLUS_SILENCED_WITNESSES'), 6), 'ate_lion_council_doubt')).toBe('witnesses-silenced');
    expect(resolveProfileDialogue(canonical('SHADOW_REVEALED'), 6, 'serpent_pursuit_pre_combat')?.variantId).toBe('shadow-revealed');
    expect(resolveProfileDialogue(canonical('SHADOW_CONCEALED'), 6, 'serpent_pursuit_pre_combat')?.variantId).toBe('shadow-concealed');
  });

  it('resolves every eligible ATE dialogue and suppresses once-only replay', () => {
    const audit = auditAllAteRules(canonical('PURE_HONOUR'), 7);
    expect(audit.missingDialogues).toEqual([]);
    expect(audit.onceSuppressed).toEqual(audit.eligible);
    expect(audit.eligible).toEqual(expect.arrayContaining(['ate_first_refuge_watch', 'ate_bois_clair_night_watch']));
  });

  it('suppresses Shadow ATEs without knowledge and preserves Cedric output', () => {
    const noShadow = { ...canonical('CEDRIC_ABSENT'), shadow: 'none' as const, disclosure: 'undecided' as const };
    const absent = simulateLionRunProfile(noShadow, 3);
    const present = simulateLionRunProfile(canonical('CEDRIC_RECRUITED'), 3);
    expect(absent.ateResults.map((entry) => entry.ateId)).not.toContain('ate_ruins_awaken');
    expect(absent.ateResults.map((entry) => entry.ateId)).not.toContain('ate_serpent_retreat_order');
    expect(present.ateResults.some((entry) => entry.optionalStepIds.includes('r5-cedric-first-watch'))).toBe(true);
  });
});

describe('R7 R4 deterministic distribution and hard constraints', () => {
  const seeds = Array.from({ length: 500 }, (_, index) => index);

  it.each([5, 50, 95])('enforces budget, uniqueness, cooldown, spacing, and registration order at reputation %i', (reputation) => {
    const audit = auditR4ReputationDistribution(reputation, seeds);
    expect(audit.invariantFailures).toEqual([]);
    expect(audit.eventsPerRun['0'] + audit.eventsPerRun['1'] + audit.eventsPerRun['2']).toBe(seeds.length);
    expect(audit.averageEventsPerRun).toBeLessThanOrEqual(2);
    expect(audit.rejectionCounts.unique_already_consumed).toBeGreaterThan(0);
    expect(audit.rejectionCounts.opportunity_budget_exhausted).toBeGreaterThan(0);
  });

  it('keeps no-event reachable and non-consuming', () => {
    const audit = auditR4ReputationDistribution(50, seeds);
    expect(audit.noEventCount).toBeGreaterThan(0);
    expect(audit.eventsPerRun['0']).toBeGreaterThan(0);
  });

  it('moves hostile/helpful selection in the authored reputation direction', () => {
    const directionalSeeds = Array.from({ length: 2_000 }, (_, index) => index);
    const low = auditR4ReputationDistribution(5, directionalSeeds);
    const high = auditR4ReputationDistribution(95, directionalSeeds);
    expect(low.categoryPercentages.hostile).toBeGreaterThan(high.categoryPercentages.hostile);
    expect(high.categoryPercentages.helpful).toBeGreaterThan(low.categoryPercentages.helpful);
  });

  it('keeps all nine R5-expanded definitions reachable or explicitly eligible in the audit', () => {
    expect(reputationDefinitions()).toHaveLength(9);
    const audit = auditR4ReputationDistribution(50, Array.from({ length: 2_000 }, (_, index) => index));
    expect(audit.eventRows.every((row) => row.eligible > 0)).toBe(true);
    expect(audit.eventRows.every((row) => row.selected > 0)).toBe(true);
  });

  it('exercises family cooldown, global spacing, and budget rejection paths explicitly', () => {
    const probe = probeR4SpacingAndCooldowns();
    expect(probe.familyCooldownRejections).toBeGreaterThan(0);
    expect(probe.globalSpacingRejections).toBeGreaterThan(0);
    expect(probe.budgetRejections).toBeGreaterThan(0);
  });
});

describe('R7 R6 persistence and save/reload contract', () => {
  it.each([
    ['SERPENT_SELECTED_NOT_COMPLETED', 'serpent_captain', 'serpent_captain', null],
    ['LION_TRIAL_SELECTED_NOT_COMPLETED', 'lion_chief', 'lion_chief', null],
    ['SERPENT_COMPLETED', 'serpent_captain', null, 'lion-seal-serpent-truth'],
    ['LION_TRIAL_COMPLETED', 'lion_chief', null, 'lion-seal-trial-truth'],
  ] as const)('%s remains persisted and completion-aware', (id, selected, pending, ending) => {
    const results = simulateLionSeedRange(canonical(id), [0, 1, 17, 999]);
    expect(results.every((result) => result.persistedFinaleCombat === selected)).toBe(true);
    expect(results.every((result) => result.pendingFinaleCombat === pending)).toBe(true);
    expect(results.every((result) => result.endingId === ending)).toBe(true);
  });

  it('does not apply the voluntary-trial reputation consequence twice after reload/resume', () => {
    const selected = simulateLionRunProfile(canonical('VOLUNTARY_LION_TRIAL'), 10);
    const resumed = simulateLionRunProfile(canonical('LION_TRIAL_SELECTED_NOT_COMPLETED'), 10);
    expect(selected.finalRelevantReputation).toBe(63);
    expect(resumed.initialReputation).toBe(63);
    expect(resumed.finalRelevantReputation).toBe(63);
    expect(resumed.trialCause).toBe('voluntary');
  });

  it('reproduces narrative, R3, ATE, R4, verdict, route, and ending through repeated serialization', () => {
    for (const id of ['PURE_HONOUR', 'INFAMY', 'LEGACY_REVEALED_AND_CONCEALED']) {
      const profile = canonical(id) ?? generateLegacyContradictionProfiles().find((entry) => entry.id === id)!;
      const { direct, reloaded } = serializeReloadSimulation(profile, 73);
      expect(reloaded).toEqual(direct);
    }
  });
});

describe('R7 compact aggregate snapshot', () => {
  it('stays stable for fixed fast-regression seed ranges', () => {
    expect(buildR7FastRegressionSnapshot()).toEqual(regressionSnapshot);
  });

  it('aggregates impossible-outcome failures explicitly', () => {
    const aggregate = aggregateLionSimulation(simulateLionSeedRange(canonical('PURE_HONOUR'), [0, 1, 2]));
    expect(aggregate.invariantFailureCount).toBe(0);
  });
});
