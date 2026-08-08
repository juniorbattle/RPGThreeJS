import { describe, expect, it } from 'vitest';
import {
  COMBAT_STAGE_PROFILES,
  STAGE_LAYOUT,
  isStageEligibleAction,
  resolveCombatStageProfile,
  resolveCombatStageProfileIncludingQA,
  resolveCombatStageProfileUniversal,
  classifyActionPresentation,
  getStageProfileInfo,
  type StageSlotId,
  type ActionSpecForStage,
  type PresentationForStage,
} from './combatStageProfiles';

const REQUIRED_SLOTS: readonly StageSlotId[] = [
  'attackerStart',
  'attackerImpact',
  'casterSlot',
  'casterCenter',
  'primaryTarget',
  'secondaryTargetLeft',
  'secondaryTargetRight',
  'targetLeft',
  'targetCenter',
  'targetRight',
  'allyLeft',
  'allyCenter',
  'allyRight',
  'arenaCenter',
  'stageGround',
  'projectileOrigin',
  'projectileImpact',
  'skyEntry',
];

const NON_PILOT_ACTION_KEYS = [
  'w_whirl',
  'n_dark_bolt',
  'w_salvation',
  'flame_wave',
  'boss_quake',
  'attack_ranged',
  'n_dark_meteor',
];

const PLAY_PROFILE_IDS = ['BASIC_MELEE', 'DEVOURING_ECLIPSE', 'FLAME_WAVE'] as const;
const ALL_PROFILE_IDS = [...PLAY_PROFILE_IDS, 'QA_MULTI_TARGET', 'QA_SUPPORT_GROUP'] as const;

describe('combat stage layout', () => {
  it('defines every required semantic slot with finite presentation coordinates', () => {
    for (const slot of REQUIRED_SLOTS) {
      const point = STAGE_LAYOUT[slot];
      expect(point).toBeDefined();
      expect(Number.isFinite(point.x)).toBe(true);
      expect(Number.isFinite(point.y)).toBe(true);
      expect(Number.isFinite(point.z)).toBe(true);
    }
  });

  it('places the attacker and primary target on opposite horizontal sides', () => {
    expect(STAGE_LAYOUT.attackerStart.x).toBeLessThan(STAGE_LAYOUT.arenaCenter.x);
    expect(STAGE_LAYOUT.primaryTarget.x).toBeGreaterThan(STAGE_LAYOUT.arenaCenter.x);
  });

  it('places multi-target slots on the enemy side and ally slots on the caster side', () => {
    expect(STAGE_LAYOUT.targetLeft.x).toBeGreaterThan(STAGE_LAYOUT.arenaCenter.x);
    expect(STAGE_LAYOUT.targetCenter.x).toBeGreaterThan(STAGE_LAYOUT.arenaCenter.x);
    expect(STAGE_LAYOUT.targetRight.x).toBeGreaterThan(STAGE_LAYOUT.arenaCenter.x);
    expect(STAGE_LAYOUT.allyLeft.x).toBeLessThan(STAGE_LAYOUT.arenaCenter.x);
    expect(STAGE_LAYOUT.allyCenter.x).toBeLessThan(STAGE_LAYOUT.arenaCenter.x);
    expect(STAGE_LAYOUT.allyRight.x).toBeLessThan(STAGE_LAYOUT.arenaCenter.x);
  });
});

describe('combat stage pilot profiles', () => {
  it('includes exactly the three play profiles plus two QA-only profiles', () => {
    expect(COMBAT_STAGE_PROFILES.map((profile) => profile.id).sort()).toEqual(
      [...ALL_PROFILE_IDS].sort(),
    );
  });

  it('maps each action key to exactly one profile, with no overlap', () => {
    const seen = new Map<string, string>();
    for (const profile of COMBAT_STAGE_PROFILES) {
      for (const key of profile.actionKeys) {
        expect(seen.has(key)).toBe(false);
        seen.set(key, profile.id);
      }
    }
    expect(seen.get('attack')).toBe('BASIC_MELEE');
    expect(seen.get('n_flame_wave')).toBe('FLAME_WAVE');
    expect(seen.get('d_devouring_eclipse')).toBe('DEVOURING_ECLIPSE');
    expect(seen.get('__qa_multi_target')).toBe('QA_MULTI_TARGET');
    expect(seen.get('__qa_support_group')).toBe('QA_SUPPORT_GROUP');
  });

  it('is eligible for every action with a key (universal routing)', () => {
    expect(isStageEligibleAction({ key: 'attack' })).toBe(true);
    expect(isStageEligibleAction({ key: 'n_flame_wave' })).toBe(true);
    expect(isStageEligibleAction({ key: 'd_devouring_eclipse' })).toBe(true);
    expect(isStageEligibleAction({ key: '__qa_multi_target' })).toBe(true);
    for (const key of NON_PILOT_ACTION_KEYS) {
      expect(isStageEligibleAction({ key })).toBe(true);
    }
    expect(isStageEligibleAction(undefined)).toBe(false);
    expect(isStageEligibleAction(null)).toBe(false);
    expect(isStageEligibleAction({})).toBe(false);
  });

  it('resolves undefined for ineligible specs via resolveCombatStageProfile', () => {
    for (const key of NON_PILOT_ACTION_KEYS) {
      expect(resolveCombatStageProfile({ key })).toBeUndefined();
    }
    expect(resolveCombatStageProfile({ key: '__qa_multi_target' })).toBeUndefined();
  });

  it('resolves QA profiles via resolveCombatStageProfileIncludingQA', () => {
    expect(resolveCombatStageProfileIncludingQA({ key: '__qa_multi_target' })?.id).toBe('QA_MULTI_TARGET');
    expect(resolveCombatStageProfileIncludingQA({ key: '__qa_support_group' })?.id).toBe('QA_SUPPORT_GROUP');
    expect(resolveCombatStageProfileIncludingQA({ key: 'w_whirl' })).toBeUndefined();
  });

  it('every profile is structurally complete with sane, positive timing/framing values', () => {
    for (const profile of COMBAT_STAGE_PROFILES) {
      expect(profile.cameraFrustumHalfHeight).toBeGreaterThan(0);
      expect(profile.transitionInMs).toBeGreaterThan(0);
      expect(profile.transitionOutMs).toBeGreaterThan(0);
      expect(profile.approachMs).toBeGreaterThanOrEqual(0);
      expect(profile.recoilMs).toBeGreaterThanOrEqual(0);
      expect(profile.impactPulseMs).toBeGreaterThan(0);
      expect(profile.extraHoldSeconds).toBeGreaterThanOrEqual(0);
      expect(profile.layout).toBeDefined();
      expect(profile.targetSlots.length).toBeGreaterThanOrEqual(1);
      for (const slot of [
        profile.impactAnchorSlot,
        profile.castAnchorSlot,
        profile.actorStartSlot,
        profile.actorImpactSlot,
        profile.targetSlot,
        ...profile.targetSlots,
      ]) {
        expect(REQUIRED_SLOTS).toContain(slot);
      }
      const phases = profile.phases;
      expect(phases.settleMs).toBeGreaterThanOrEqual(0);
      expect(phases.releaseToImpactMs).toBeGreaterThanOrEqual(0);
      expect(phases.impactToReactionMs).toBeGreaterThanOrEqual(0);
      expect(phases.reactionToFeedbackMs).toBeGreaterThanOrEqual(0);
      expect(phases.recoveryMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('separates impact VFX anchor from actor motion slot for basic melee', () => {
    const basicMelee = COMBAT_STAGE_PROFILES.find((profile) => profile.id === 'BASIC_MELEE')!;
    expect(basicMelee.impactAnchorSlot).toBe('primaryTarget');
    expect(basicMelee.actorImpactSlot).toBe('attackerImpact');
    expect(basicMelee.impactAnchorSlot).not.toBe(basicMelee.actorImpactSlot);
  });

  it('keeps basic melee inside the fast-execution stage-overhead budget', () => {
    const basicMelee = COMBAT_STAGE_PROFILES.find((profile) => profile.id === 'BASIC_MELEE')!;
    const stageOverheadMs =
      basicMelee.transitionInMs + basicMelee.transitionOutMs + basicMelee.approachMs + basicMelee.impactPulseMs;
    expect(stageOverheadMs).toBeLessThan(600);
  });

  it('gives devouring eclipse the longest transition and hold, matching ultimate-grade framing', () => {
    const flameWave = COMBAT_STAGE_PROFILES.find((profile) => profile.id === 'FLAME_WAVE')!;
    const eclipse = COMBAT_STAGE_PROFILES.find((profile) => profile.id === 'DEVOURING_ECLIPSE')!;
    const basicMelee = COMBAT_STAGE_PROFILES.find((profile) => profile.id === 'BASIC_MELEE')!;
    expect(eclipse.transitionInMs).toBeGreaterThan(flameWave.transitionInMs);
    expect(flameWave.transitionInMs).toBeGreaterThan(basicMelee.transitionInMs);
    expect(eclipse.cameraFrustumHalfHeight).toBeGreaterThan(basicMelee.cameraFrustumHalfHeight);
  });

  it('uses multi-target slots for multi-target layouts', () => {
    const flameWave = COMBAT_STAGE_PROFILES.find((profile) => profile.id === 'FLAME_WAVE')!;
    expect(flameWave.targetSlots.length).toBe(3);
    expect(flameWave.targetSlots).toContain('targetLeft');
    expect(flameWave.targetSlots).toContain('targetCenter');
    expect(flameWave.targetSlots).toContain('targetRight');
  });

  it('uses ally slots for support group layout', () => {
    const supportGroup = COMBAT_STAGE_PROFILES.find((profile) => profile.id === 'QA_SUPPORT_GROUP')!;
    expect(supportGroup.layout).toBe('support_group');
    expect(supportGroup.targetSlots).toContain('allyLeft');
    expect(supportGroup.targetSlots).toContain('allyCenter');
    expect(supportGroup.targetSlots).toContain('allyRight');
  });

  it('keeps transition times in the less-abrupt range (100-200ms)', () => {
    for (const profile of COMBAT_STAGE_PROFILES) {
      expect(profile.transitionInMs).toBeGreaterThanOrEqual(100);
      expect(profile.transitionInMs).toBeLessThanOrEqual(200);
      expect(profile.transitionOutMs).toBeGreaterThanOrEqual(80);
      expect(profile.transitionOutMs).toBeLessThanOrEqual(160);
    }
  });
});

describe('R0A-QA1.1 anchor correctness', () => {
  it('Devouring Eclipse primary impact anchor is arenaCenter (not skyEntry)', () => {
    const eclipse = COMBAT_STAGE_PROFILES.find((profile) => profile.id === 'DEVOURING_ECLIPSE')!;
    expect(eclipse.impactAnchorSlot).toBe('arenaCenter');
    expect(eclipse.impactAnchorSlot).not.toBe('skyEntry');
  });

  it('skyEntry slot is defined and available for sky-descent VFX steps', () => {
    expect(STAGE_LAYOUT.skyEntry).toBeDefined();
    expect(Number.isFinite(STAGE_LAYOUT.skyEntry.y)).toBe(true);
    expect(STAGE_LAYOUT.skyEntry.y).toBeGreaterThan(STAGE_LAYOUT.arenaCenter.y);
  });

  it('basic melee primary impact anchor is primaryTarget', () => {
    const basicMelee = COMBAT_STAGE_PROFILES.find((profile) => profile.id === 'BASIC_MELEE')!;
    expect(basicMelee.impactAnchorSlot).toBe('primaryTarget');
  });

  it('Flame Wave main impact anchor is targetCenter (multi-target group center)', () => {
    const flameWave = COMBAT_STAGE_PROFILES.find((profile) => profile.id === 'FLAME_WAVE')!;
    expect(flameWave.impactAnchorSlot).toBe('targetCenter');
    expect(STAGE_LAYOUT.targetCenter.x).toBeGreaterThan(STAGE_LAYOUT.arenaCenter.x);
  });

  it('separates impact VFX anchor from actor motion anchor across all play profiles', () => {
    for (const profile of COMBAT_STAGE_PROFILES) {
      if (profile.qaOnly) continue;
      expect(profile.impactAnchorSlot).not.toBe(profile.actorImpactSlot);
    }
  });
});

describe('R0B universal Stage routing', () => {
  const meleeSpec: ActionSpecForStage = { key: 'w_break_guard', type: 'phys', offensive: true, range: [1, 1], ap: 2 };
  const rangedSpec: ActionSpecForStage = { key: 'a_precise_shot', type: 'phys', offensive: true, range: [2, 4], ap: 2 };
  const rangedPres: PresentationForStage = { motionPreset: 'ranged_attack', castStyle: 'rangedShot' };
  const healSpec: ActionSpecForStage = { key: 'w_salvation', type: 'heal', support: true, healPercent: 0.4, range: [0, 3], targetMode: 'ally', ap: 2 };
  const groupHealSpec: ActionSpecForStage = { key: 'w_sanctuary', type: 'buff', support: true, radius: 1.3, range: [0, 2], ap: 4, effects: [{ kind: 'heal', target: 'allies' }] };
  const selfBuffSpec: ActionSpecForStage = { key: 'd_blood_pact', type: 'buff', self: true, support: true, ap: 4 };
  const selfAndAlliesSpec: ActionSpecForStage = { key: 'p_oathwall', type: 'buff', self: true, support: true, radius: 1.3, ap: 4 };
  const multiTargetOffensiveSpec: ActionSpecForStage = { key: 'a_arrow_rain', type: 'phys', offensive: true, radius: 1.2, range: [2, 4], ap: 4 };
  const debuffSpec: ActionSpecForStage = { key: 'enemy_hex', type: 'debuff', offensive: true, range: [1, 3], ap: 2 };
  const groupDebuffSpec: ActionSpecForStage = { key: 'e_binding_seal', type: 'debuff', offensive: true, radius: 1.2, range: [1, 3], ap: 4 };
  const teleportSpec: ActionSpecForStage = { key: 'n_teleport', type: 'move', mode: 'teleport', dest: true, range: [2, 3], ap: 3 };
  const leapSpec: ActionSpecForStage = { key: 'a_hawk_leap', type: 'move', mode: 'leap', dest: true, range: [2, 3], ap: 3 };
  const ultimateSpec: ActionSpecForStage = { key: 'w_lion_surge', type: 'phys', offensive: true, range: [1, 3], radius: 1, ap: 5 };
  const ultimatePres: PresentationForStage = { ultimate: true, visualTier: 5, castStyle: 'ultimateCast' };
  const skyDescentSpec: ActionSpecForStage = { key: 'n_dark_meteor', type: 'mag', offensive: true, radius: 1.5, range: [2, 4], ap: 5 };
  const skyDescentPres: PresentationForStage = { ultimate: true, visualTier: 5, castStyle: 'ultimateCast' };
  const bossSpec: ActionSpecForStage = { key: 'boss_slam', type: 'phys', offensive: true, radius: 1.2, range: [1, 7], ap: 5 };
  const bossPres: PresentationForStage = { visualTier: 6, scaleTier: 'boss' };

  it('ordinary melee action resolves to SINGLE_TARGET_OFFENSIVE', () => {
    const profile = resolveCombatStageProfileUniversal(meleeSpec);
    expect(profile).toBeDefined();
    expect(profile!.id).toBe('SINGLE_TARGET_OFFENSIVE');
    expect(profile!.generic).toBe(true);
  });

  it('ordinary ranged action resolves to BASIC_RANGED', () => {
    const profile = resolveCombatStageProfileUniversal(rangedSpec, rangedPres);
    expect(profile).toBeDefined();
    expect(profile!.id).toBe('BASIC_RANGED');
  });

  it('non-ultimate single heal routes to TACTICAL (undefined profile)', () => {
    const profile = resolveCombatStageProfileUniversal(healSpec);
    expect(profile).toBeUndefined();
  });

  it('non-ultimate group heal routes to TACTICAL (undefined profile)', () => {
    const profile = resolveCombatStageProfileUniversal(groupHealSpec);
    expect(profile).toBeUndefined();
  });

  it('non-ultimate caster-inclusive group support routes to TACTICAL', () => {
    const profile = resolveCombatStageProfileUniversal(selfAndAlliesSpec);
    expect(profile).toBeUndefined();
  });

  it('multi-target offensive resolves to MULTI_TARGET_OFFENSIVE', () => {
    const profile = resolveCombatStageProfileUniversal(multiTargetOffensiveSpec);
    expect(profile).toBeDefined();
    expect(profile!.id).toBe('MULTI_TARGET_OFFENSIVE');
    expect(profile!.targetSlots.length).toBe(3);
  });

  it('non-ultimate self buff routes to TACTICAL (undefined profile)', () => {
    const profile = resolveCombatStageProfileUniversal(selfBuffSpec);
    expect(profile).toBeUndefined();
  });

  it('single-target debuff resolves to SINGLE_TARGET_DEBUFF', () => {
    const profile = resolveCombatStageProfileUniversal(debuffSpec);
    expect(profile).toBeDefined();
    expect(profile!.id).toBe('SINGLE_TARGET_DEBUFF');
  });

  it('group debuff resolves to GROUP_DEBUFF', () => {
    const profile = resolveCombatStageProfileUniversal(groupDebuffSpec);
    expect(profile).toBeDefined();
    expect(profile!.id).toBe('GROUP_DEBUFF');
    expect(profile!.targetSlots.length).toBe(3);
  });

  it('non-ultimate teleport routes to TACTICAL (undefined profile)', () => {
    const profile = resolveCombatStageProfileUniversal(teleportSpec);
    expect(profile).toBeUndefined();
  });

  it('non-ultimate leap routes to TACTICAL (undefined profile)', () => {
    const profile = resolveCombatStageProfileUniversal(leapSpec);
    expect(profile).toBeUndefined();
  });

  it('ultimate resolves to ARENA_ULTIMATE', () => {
    const profile = resolveCombatStageProfileUniversal(ultimateSpec, ultimatePres);
    expect(profile).toBeDefined();
    expect(profile!.id).toBe('ARENA_ULTIMATE');
    expect(profile!.impactAnchorSlot).toBe('arenaCenter');
  });

  it('sky descent ultimate (n_dark_meteor) resolves to SKY_DESCENT_ULTIMATE with arenaCenter impact', () => {
    const profile = resolveCombatStageProfileUniversal(skyDescentSpec, skyDescentPres);
    expect(profile).toBeDefined();
    expect(profile!.id).toBe('SKY_DESCENT_ULTIMATE');
    expect(profile!.impactAnchorSlot).toBe('arenaCenter');
    expect(profile!.impactAnchorSlot).not.toBe('skyEntry');
  });

  it('boss signature resolves to BOSS_SIGNATURE', () => {
    const profile = resolveCombatStageProfileUniversal(bossSpec, bossPres);
    expect(profile).toBeDefined();
    expect(profile!.id).toBe('BOSS_SIGNATURE');
  });

  it('explicit profiles override generic profiles', () => {
    const attackSpec: ActionSpecForStage = { key: 'attack', type: 'phys', offensive: true, ap: 1 };
    const profile = resolveCombatStageProfileUniversal(attackSpec);
    expect(profile).toBeDefined();
    expect(profile!.id).toBe('BASIC_MELEE');
    expect(profile!.generic).toBeUndefined();
  });

  it('Flame Wave explicit profile overrides generic classification', () => {
    const flameSpec: ActionSpecForStage = { key: 'n_flame_wave', type: 'mag', offensive: true, radius: 1.6, ap: 4 };
    const profile = resolveCombatStageProfileUniversal(flameSpec);
    expect(profile).toBeDefined();
    expect(profile!.id).toBe('FLAME_WAVE');
    expect(profile!.generic).toBeUndefined();
  });

  it('Devouring Eclipse explicit profile overrides generic classification', () => {
    const eclipseSpec: ActionSpecForStage = { key: 'd_devouring_eclipse', type: 'mag', offensive: true, radius: 1.5, ap: 5 };
    const eclipsePres: PresentationForStage = { ultimate: true, visualTier: 5 };
    const profile = resolveCombatStageProfileUniversal(eclipseSpec, eclipsePres);
    expect(profile).toBeDefined();
    expect(profile!.id).toBe('DEVOURING_ECLIPSE');
    expect(profile!.generic).toBeUndefined();
  });

  it('offensive and ultimate actions resolve to Stage; support/movement route to tactical', () => {
    const stageSpecs: Array<{ spec: ActionSpecForStage; pres?: PresentationForStage }> = [
      { spec: meleeSpec },
      { spec: rangedSpec, pres: rangedPres },
      { spec: multiTargetOffensiveSpec },
      { spec: debuffSpec },
      { spec: groupDebuffSpec },
      { spec: ultimateSpec, pres: ultimatePres },
      { spec: skyDescentSpec, pres: skyDescentPres },
      { spec: bossSpec, pres: bossPres },
      { spec: { key: 'w_whirl', type: 'phys', offensive: true, self: true, radius: 1, ap: 4 } },
      { spec: { key: 'w_charge', type: 'move', mode: 'dash', dest: true, offensive: true, ap: 3 } },
      { spec: { key: 'enemy_crush', type: 'phys', offensive: true, self: true, radius: 1, ap: 3 } },
    ];
    for (const { spec, pres } of stageSpecs) {
      const profile = resolveCombatStageProfileUniversal(spec, pres);
      expect(profile, `Offensive/ultimate action ${spec.key} should resolve to a Stage profile`).toBeDefined();
    }

    const tacticalSpecs: ActionSpecForStage[] = [
      healSpec, groupHealSpec, selfBuffSpec, selfAndAlliesSpec, teleportSpec, leapSpec,
      { key: 'e_transpose', type: 'move', mode: 'swap', dest: true, support: true, ap: 3 },
      { key: 'boss_regen', type: 'buff', self: true, support: true, ap: 3 },
    ];
    for (const spec of tacticalSpecs) {
      const profile = resolveCombatStageProfileUniversal(spec);
      expect(profile, `Support/movement action ${spec.key} should route to tactical (undefined)`).toBeUndefined();
    }
  });

  it('null/undefined specs return undefined (true non-action bypass)', () => {
    expect(resolveCombatStageProfileUniversal(null)).toBeUndefined();
    expect(resolveCombatStageProfileUniversal(undefined)).toBeUndefined();
    expect(resolveCombatStageProfileUniversal({})).toBeUndefined();
  });

  it('getStageProfileInfo returns explicit flag correctly', () => {
    const explicitInfo = getStageProfileInfo({ key: 'attack' });
    expect(explicitInfo).not.toBeNull();
    expect(explicitInfo!.explicit).toBe(true);
    expect(explicitInfo!.id).toBe('BASIC_MELEE');

    const genericInfo = getStageProfileInfo(meleeSpec);
    expect(genericInfo).not.toBeNull();
    expect(genericInfo!.explicit).toBe(false);
    expect(genericInfo!.id).toBe('SINGLE_TARGET_OFFENSIVE');
  });

  it('classifyActionPresentation maps self+offensive+radius to MULTI_TARGET_OFFENSIVE', () => {
    const family = classifyActionPresentation({ key: 'w_whirl', type: 'phys', offensive: true, self: true, radius: 1, ap: 4 });
    expect(family).toBe('MULTI_TARGET_OFFENSIVE');
  });

  it('multi-target targetGroupCenter (targetCenter) is Stage-space and on enemy side', () => {
    const profile = resolveCombatStageProfileUniversal(multiTargetOffensiveSpec);
    expect(profile).toBeDefined();
    const center = STAGE_LAYOUT[profile!.impactAnchorSlot];
    expect(center.x).toBeGreaterThan(STAGE_LAYOUT.arenaCenter.x);
  });

  it('ultimate support group layouts use ally slots on the caster side', () => {
    const ultSupportSpec: ActionSpecForStage = { key: 'e_absolute_harmony', type: 'buff', support: true, radius: 2, range: [0, 3], ap: 5 };
    const ultSupportPres: PresentationForStage = { ultimate: true, visualTier: 5, castStyle: 'ultimateCast' };
    const profile = resolveCombatStageProfileUniversal(ultSupportSpec, ultSupportPres);
    expect(profile).toBeDefined();
    for (const slot of profile!.targetSlots) {
      const p = STAGE_LAYOUT[slot];
      expect(p.x).toBeLessThanOrEqual(STAGE_LAYOUT.arenaCenter.x);
    }
  });
});
