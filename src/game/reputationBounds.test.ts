/**
 * Set 1.20.0 reputation bounds test (AUTHORING_AND_QA), post-demo Lot 0. It computes the bounds from content and fails
 * when they no longer hold: only a perfect run reaches 100, at the end of the game; a consistent honour run reaches
 * Renowned (80) around the third plateau. The Lion's recalibration is a proposal awaiting the operator; the demo keeps
 * its values, which this test also pins.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { dialogues } from './content';
import {
  DEMO_LION_REPUTATION,
  LION_CODE_REPUTATION_THRESHOLDS,
  LION_CODE_THRESHOLD_FILES,
  PROPOSED_LION_REPUTATION,
  PROPOSED_LION_THRESHOLDS,
  REPUTATION_MAX,
  REPUTATION_START,
  RENOWNED_THRESHOLD,
  collectLionReputationLedger,
  compareLionThresholds,
  computeLionReputationBounds,
  projectCampaignReputation,
  proportionalLionThreshold,
  type ReputationCalibration,
} from './reputationBounds';
import { PROPOSED_REPUTATION_BUDGETS, getPlateau } from '../campaign/plateaux/PlateauRegistry';

const ledger = collectLionReputationLedger();

describe('the demo keeps its reputation values (OD-2026-11-07-I, R1 check)', () => {
  it('measures the Lion as the operator was told: +85 to +90 on the honour path, 100 reached before the judgement', () => {
    const demo = computeLionReputationBounds(DEMO_LION_REPUTATION);
    expect(demo.canonicalFloor).toBe(85);
    expect(demo.canonicalMax).toBe(90);
    expect(demo.optionalMax).toBe(6);
    expect(demo.socialMax).toBe(5);
    expect(demo.perfectMax).toBe(101);
    expect(REPUTATION_START + demo.canonicalFloor).toBeGreaterThanOrEqual(REPUTATION_MAX);
    expect(demo.perfectReaches100At).toBe('lion-witnesses');
  });

  it('applies no calibration at runtime: content keeps the demo amounts and thresholds', () => {
    expect(PROPOSED_LION_REPUTATION.status).toBe('proposed');
    const refugee = dialogues.get('refugee_trial')!.steps.flatMap((step) => step.choices ?? [])[0]!;
    expect(refugee.effects).toContainEqual({ type: 'addReputation', amount: 8 });
    const recruit = dialogues.get('mystery_recruit')!.steps.flatMap((step) => step.choices ?? [])[0]!;
    expect(recruit.requiresReputationMin).toBe(20);
  });
});

describe('the Lion reputation ledger is read from content', () => {
  it('finds every threshold, including Garen at 15 that the R1 list left out', () => {
    expect(ledger.thresholds.map((threshold) => [threshold.id, threshold.value])).toEqual([
      ['code:alaric_credible', 45],
      ['code:alaric_high', 70],
      ['gate:mystery_lancer_recruit:1:0', 15],
      ['gate:mystery_recruit:1:0', 20],
      ['gate:witnesses_on_road:1:0', 45],
    ]);
    for (const threshold of ledger.thresholds) expect(PROPOSED_LION_THRESHOLDS[threshold.id]).toBeTypeOf('number');
    expect(Object.keys(PROPOSED_LION_THRESHOLDS).sort()).toEqual(ledger.thresholds.map((threshold) => threshold.id).sort());
  });

  it('compares reputation in code only with the declared thresholds', () => {
    const compared = new Set<number>();
    for (const file of LION_CODE_THRESHOLD_FILES) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(/reputation\s*(?:>=|<=|>|<)\s*(\d+)/g)) compared.add(Number(match[1]));
    }
    expect([...compared].sort((a, b) => a - b)).toEqual(LION_CODE_REPUTATION_THRESHOLDS.map((threshold) => threshold.value));
  });

  it('changes amounts only: every sign is kept, every choice keeps a weight, only routine victories drop to zero', () => {
    expect(ledger.sources.length).toBeGreaterThan(60);
    for (const source of ledger.sources) {
      const calibrated = PROPOSED_LION_REPUTATION.amount(source);
      if (source.kind === 'combat' && source.rank === 'normal' && source.amount > 0) {
        expect(calibrated).toBe(0);
        continue;
      }
      expect(Math.sign(calibrated)).toBe(Math.sign(source.amount));
      expect(Math.abs(calibrated)).toBeLessThanOrEqual(Math.abs(source.amount));
    }
  });
});

describe('the proposed post-demo Lion calibration (Lot 0 package)', () => {
  const lion = computeLionReputationBounds(PROPOSED_LION_REPUTATION);

  it('gives the Lion at most +32 and a consistent honour run +27, as its registry budget states', () => {
    expect(lion.perfectMax).toBe(32);
    expect(lion.honourFloor).toBe(27);
    expect(getPlateau('lion').reputationBudget).toEqual({ perfectMax: lion.perfectMax, honourFloor: lion.honourFloor });
    expect(lion.perfectReaches100At).toBeNull();
  });

  it('keeps every gate open on the consistent honour path', () => {
    expect(lion.failedHonourGates).toEqual([]);
    const judgementEntry = REPUTATION_START + lion.honourFloor - lion.nodes.at(-1)!.floor;
    expect(judgementEntry).toBeGreaterThanOrEqual(PROPOSED_LION_THRESHOLDS['code:alaric_high']!);
  });

  it('still empties the gauge on the greed path', () => {
    const demo = computeLionReputationBounds(DEMO_LION_REPUTATION);
    expect(REPUTATION_START + demo.canonicalMin).toBeLessThan(20);
    expect(REPUTATION_START + lion.canonicalMin).toBeLessThan(20);
  });

  it('changes fewer current verdicts with the recommended thresholds than with the plain proportion', () => {
    const proportional: ReputationCalibration = {
      ...PROPOSED_LION_REPUTATION,
      threshold: (threshold) => proportionalLionThreshold(threshold.value),
    };
    const recommended = compareLionThresholds(PROPOSED_LION_REPUTATION);
    const plain = compareLionThresholds(proportional);
    expect(recommended.judgement.divergentStates).toBeLessThan(plain.judgement.divergentStates);
    const changed = (comparison: typeof recommended) => comparison.gates
      .reduce((sum, gate) => sum + gate.closedByCalibration + gate.openedByCalibration, 0);
    expect(changed(recommended)).toBeLessThan(changed(plain));
    expect(recommended.gates.find((gate) => gate.thresholdId === 'gate:mystery_recruit:1:0')).toMatchObject({
      closedByCalibration: 0, openedByCalibration: 0,
    });
  });
});

describe('whole-game reputation bounds (set 1.20.0 calibration targets)', () => {
  const projection = projectCampaignReputation(PROPOSED_LION_REPUTATION);

  it('lets only a perfect run reach 100, and only in the final act', () => {
    expect(projection.perfectTotal).toBe(REPUTATION_MAX - REPUTATION_START);
    expect(projection.perfectReaches100In).toBe('finale');
    const beforeFinale = projection.chapters.find((chapter) => chapter.id === 'scorpion')!;
    expect(beforeFinale.perfectAfter).toBeLessThan(REPUTATION_MAX);
  });

  it('brings a consistent honour run to Renowned around the third plateau, not before', () => {
    expect(projection.honourReachesRenownedIn).toBe('dragon');
    expect(projection.chapters.find((chapter) => chapter.id === 'bear')!.honourAfter).toBeLessThan(RENOWNED_THRESHOLD);
  });

  it('uses smaller amounts plateau after plateau (R2)', () => {
    const seals = projection.chapters.filter((chapter) => chapter.id !== 'finale').map((chapter) => chapter.perfectMax);
    for (let index = 1; index < seals.length; index += 1) expect(seals[index]).toBeLessThan(seals[index - 1]!);
    for (const chapter of projection.chapters) {
      expect(chapter.honourFloor).toBeLessThanOrEqual(chapter.perfectMax);
      if (!chapter.measured) expect(PROPOSED_REPUTATION_BUDGETS[chapter.id]).toEqual({ perfectMax: chapter.perfectMax, honourFloor: chapter.honourFloor });
    }
  });

  it('shows that the demo values alone break the targets, which is why the calibration exists', () => {
    const demo = projectCampaignReputation(DEMO_LION_REPUTATION);
    expect(demo.perfectReaches100In).toBe('lion');
    expect(demo.honourReachesRenownedIn).toBe('lion');
  });
});
