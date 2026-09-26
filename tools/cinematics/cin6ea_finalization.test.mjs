import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const baseline = '57ba69cf718ea630cc9306c4122666fd6b58420f';
const model = 'gpt-image-2.5-sunburst-2026-09-08';
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const sha256 = (path) => createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');

describe('CIN-6E-A final operator approval and visual production lock', () => {
  it('records the exact model, canonical authority and six approved image selections', () => {
    const lock = readJson('tools/cinematics/specs/cin6ea_final_operator_lock.json');
    expect(lock.baseline).toBe(baseline);
    expect(lock.authority).toBe('FINAL_OPERATOR_DECISION');
    expect(lock.imagePipeline).toEqual({
      model,
      exactModelSnapshot: model,
      quality: 'max',
      exactModelExecution: 'PROVEN',
      imageAttempts: 14,
      canonicalCharacterAuthority: 'public/assets/characters/pixel/{masters,full,archive/non-demo}/*.png',
      authorityAppliedIndependentlyPerCharacter: true,
    });
    expect(Object.keys(lock.operatorImageSelections)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(Object.values(lock.operatorImageSelections).every((entry) => entry.decision === 'OPERATOR_APPROVED')).toBe(true);
    expect(lock.operatorImageSelections.C.selectedAssets).toEqual(['pilot_c_cinematic_keyframe_b']);
    expect(lock.operatorImageSelections.E.selectedAssets).toContain('pilot_e_cinematic_keyframe_c');
    expect(lock.operatorImageSelections.F.selectedAssets).toContain('pilot_f_cinematic_keyframe_a');
  });

  it('preserves both Pilot E rejections and approves only the corrected E-C source', () => {
    const lock = readJson('tools/cinematics/specs/cin6ea_final_operator_lock.json');
    expect(lock.rejections['E-A']).toMatchObject({ decision: 'REJECTED', reason: 'Kestrel canonical green cloth face mask absent.' });
    expect(lock.rejections['E-B']).toMatchObject({ decision: 'REJECTED', reason: 'Cedric canonical metal face mask absent.' });
    const e = lock.dynamicVideoValidation.selectedPilots.find((entry) => entry.pilotId === 'E');
    expect(e.sourceCandidateId).toBe('pilot_e_cinematic_keyframe_c');
    expect(e.sourceSha256).toBe('d2943e0349c22ea7045f1b8e0a5b0571e1a8c0bacdb8496a3799fce70ad0317a');
    expect(e.operatorDecision).toBe('OPERATOR_APPROVED');
  });

  it('locks all three selected H3 masters and exact final frames byte-for-byte', () => {
    const lock = readJson('tools/cinematics/specs/cin6ea_final_operator_lock.json');
    expect(lock.dynamicVideoValidation.selectedPilots.map((entry) => entry.pilotId)).toEqual(['C', 'E', 'F']);
    expect(lock.executionSummary).toMatchObject({ pilotsExecuted: 6, pilotsApproved: 6, imageAttempts: 14, miniMaxAttempts: 4 });
    for (const pilot of lock.dynamicVideoValidation.selectedPilots) {
      expect(pilot.provider).toBe('MiniMax-H3');
      expect(pilot.operatorDecision).toBe('OPERATOR_APPROVED');
      expect(sha256(pilot.sourcePath)).toBe(pilot.sourceSha256);
      expect(sha256(pilot.masterVideoPath)).toBe(pilot.masterVideoSha256);
      expect(sha256(pilot.finalFramePath)).toBe(pilot.finalFrameSha256);
      expect(pilot.gates).toEqual({
        INTERNAL_CUT_COUNT: 0,
        CHARACTER_IDENTITY_BREAKS: 0,
        MASK_BREAKS: 0,
        CAST_DISAPPEARANCE: 0,
        CAST_ADDITIONS: 0,
        WORLD_RESET: 0,
        SPATIAL_RESET: 0,
        FINAL_FRAME_HOLD_SAFE: 'PASS',
      });
    }
  });

  it('publishes the final YES/APPROVED gates without stale active blockers', () => {
    const lock = readJson('tools/cinematics/specs/cin6ea_final_operator_lock.json');
    expect(lock.finalDecision).toEqual({
      SAME_GAME_VISUAL_IDENTITY: 'PASS',
      DYNAMIC_VIDEO_GATE: 'YES',
      VISUAL_PRODUCTION_LOCK: 'YES',
      HUMAN_VISUAL_REVIEW: 'APPROVED',
      READY_FOR_CIN_6E_B: 'YES',
      CIN_6E_B_STARTED: false,
    });
    const authoritative = [
      'docs/reports/cin-6e-a-final-visual-production-system.md',
      'docs/reports/cin-6e-a-six-pilot-validation.md',
      'docs/reports/cin-6e-a-visual-family-lock.md',
      'docs/reports/cin-6e-a-human-review.md',
      'tools/cinematics/specs/final_visual_production_profile.json',
      'tools/cinematics/specs/cin6ea_six_pilot_plan.json',
      'tools/cinematics/specs/cin6ea_asset_lineage.json',
      'tools/cinematics/specs/cin6ea_video_pilot_continuity_specs.json',
      'tools/cinematics/specs/cin6ea_compiled_prompt_manifest.json',
      'tools/cinematics/specs/cin6ea_provenance_catalog.json',
    ].map((path) => readFileSync(resolve(root, path), 'utf8')).join('\n');
    expect(authoritative).not.toMatch(/BLOCKED_(?:IMAGE_)?MODEL_UNAVAILABLE|PENDING_HUMAN_VISUAL_APPROVAL|VISUAL_PRODUCTION_LOCK:\s*\*\*NO|"miniMaxAttempts":\s*0|"executed":\s*0/u);
  });

  it('changes no protected game system, production media or canonical sprite outside authorized presentation-only runtime proofs', () => {
    const authorizedPostLockFiles = new Set([
      // T0-CAMPAIGN-GRAMMAR-CONSOLIDATION-1 explicitly authorizes the presentation-only departure seam.
      'src/journey/JourneyCampaignBoundary.ts',
      'src/journey/JourneyCampaignBoundary.test.ts',
      // CAMPAIGN-PRESENTATION-MIGRATION-1 authorizes presentation policy, not route truth/media.
      'src/journey/JourneyPresentationPolicy.ts',
      'src/journey/JourneyPresentationPolicy.test.ts',
      'src/combat/vfx/CasterMotionBackCompat.test.ts',
      'src/combat/CombatBridge.ts',
      'src/combat/legacyCombatRuntime.js',
      // COMBAT-UI-SYSTEM-1 approves this presentation-only renderer and its focused proof.
      'src/combat/combatHudPresentation.ts',
      'src/combat/combatHudPresentation.test.ts',
      // Operator requested lighter CombatStage edge grading on 2026-09-22.
      'src/combat/combatPresentationConfig.js',
      'src/combat/protocol.ts',
      'src/combat/StrategicCharacterVisual.test.ts',
      'src/combat/vfx/DemoVfxActionScope.ts',
      'src/combat/vfx/gridDetectorV2.test.ts',
      'src/combat/stage/CombatStage.ts',
      'src/combat/stage/CombatStage.test.ts',
      'src/combat/stage/combatStageBackgrounds.ts',
      'src/combat/stage/combatStageBackgrounds.test.ts',
      'src/combat/stage/CombatPoseRegistry.ts',
      'src/combat/stage/CombatPoseRegistry.test.ts',
      // COMBAT-SHELL-UI-KIT-ADOPTION-1 scales posed large-unit geometry only.
      'src/combat/stage/CombatPoseVisual.ts',
      'src/combat/stage/CombatPoseVisual.test.ts',
      'src/combat/stage/CombatStagePose.test.ts',
      // COMBAT-SHELL-UI-KIT-ADOPTION-1 authorizes the narrow Essoufflé semantic fix.
      // AP creation, AP regeneration, costs, initiative and turn economy remain unchanged.
      'src/combat/combatExhaustion.ts',
      'src/combat/combatExhaustion.test.ts',
      // COMBAT-SHELL-UI-KIT-ADOPTION-1 approves presentation-only combat shell,
      // large-unit presence and status-anchor helpers with their focused proofs.
      'src/combat/combatPresencePresentation.ts',
      'src/combat/combatPresencePresentation.test.ts',
      'src/combat/combatShellPresentation.ts',
      'src/combat/combatShellPresentation.test.ts',
      'src/combat/statusAnchorPresentation.ts',
      'src/combat/statusAnchorPresentation.test.ts',
      'public/assets/characters/pixel/full/alistair.png',
      'public/assets/characters/pixel/full/cave_bat.png',
      'public/assets/characters/pixel/full/cave_rat.png',
      'public/assets/characters/pixel/full/cedric.png',
      'public/assets/characters/pixel/full/elara.png',
      'public/assets/characters/pixel/full/forest_badger.png',
      'public/assets/characters/pixel/full/forest_spider.png',
      'public/assets/characters/pixel/full/forest_troll_elite.png',
      'public/assets/characters/pixel/full/goblin.png',
      'public/assets/characters/pixel/full/kestrel.png',
      'public/assets/characters/pixel/full/lancer.png',
      'public/assets/characters/pixel/full/lion_champion.png',
      'public/assets/characters/pixel/full/marian.png',
      'public/assets/characters/pixel/full/marsh_toad.png',
      'public/assets/characters/pixel/full/serpent_brute.png',
      'public/assets/characters/pixel/full/serpent_duelist_elite.png',
      'public/assets/characters/pixel/full/serpent_general_boss.png',
      'public/assets/characters/pixel/full/serpent_oracle.png',
      'public/assets/characters/pixel/full/serpent_raider.png',
      'public/assets/characters/pixel/full/skeleton.png',
      'public/assets/characters/pixel/full/venom_serpent.png',
      'public/assets/characters/pixel/full/wild_boar.png',
      'public/assets/characters/pixel/full/wolf.png',
      'public/assets/characters/pixel/full/young_dragon_elite.png',
      'public/assets/characters/pixel/full/aldric.png',
      'public/assets/characters/pixel/full/eldwin.png',
      'public/assets/characters/pixel/full/gunnar.png',
      'public/assets/characters/pixel/full/lyra.png',
      'public/assets/characters/pixel/full/morvan.png',
      'public/assets/characters/pixel/full/talon.png',
      'public/assets/characters/pixel/full/chroniqueur.png',
      'public/assets/characters/pixel/full/shrine_apparition.png',
      'public/assets/characters/pixel/full/seal_guardian.png',
      'public/assets/characters/pixel/full/troll.png',
      'public/assets/characters/pixel/full/undead_champion.png',
      'public/assets/characters/pixel/full/forest_viper.png',
      'public/assets/characters/pixel/full/future_herbalist.png',
      'public/assets/characters/pixel/full/future_lion_scribe.png',
      'public/assets/characters/pixel/full/future_lion_spearman.png',
      'public/assets/characters/pixel/full/future_shadow_envoy.png',
      'public/assets/characters/pixel/full/giant_mygale.png',
      'public/assets/characters/pixel/full/mountain_ram.png',
      'public/assets/characters/pixel/full/river_crab.png',
      'public/assets/characters/pixel/full/swamp_crocodile.png',
      'public/assets/characters/pixel/full/seraphine.png',
      'public/assets/characters/pixel/full/alaric.png',
      'public/assets/characters/pixel/full/maelor.png',
      'public/assets/characters/pixel/full/sage_seraphine.png',
      'public/assets/characters/pixel/full/refugee_mother.png',
      'public/assets/characters/pixel/full/survivor.png',
      'public/assets/characters/pixel/full/villageoise.png',
      'public/assets/characters/pixel/full/wounded_merchant.png',
    ]);
    const protectedDiff = execFileSync('git', [
      'diff', '--name-only', baseline, '--',
      'src/combat', 'src/vfx', 'src/journey',
      'public/assets/characters/pixel/full', 'public/assets/cinematics',
    ], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/u).filter(Boolean);
    expect(protectedDiff.filter((path) => !authorizedPostLockFiles.has(path))).toEqual([]);
  });
});
