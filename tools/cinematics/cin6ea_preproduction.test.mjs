import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const baseline = '57ba69cf718ea630cc9306c4122666fd6b58420f';
const model = 'gpt-image-2.5-sunburst-2026-09-08';
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const sha256Text = (value) => createHash('sha256').update(value).digest('hex');
const assetPath = (path) => resolve(root, path.startsWith('/assets/') ? `public${path}` : path);

describe('CIN-6E-A final visual preproduction system', () => {
  it('locks the required offline production profile without changing the runtime default', () => {
    const profile = readJson('tools/cinematics/specs/final_visual_production_profile.json');
    expect(profile.baseline).toBe(baseline);
    expect(profile.productionDefault).toBe('TravelView');
    expect(profile.narrativeStageStatus).toBe('DEV_SELECTABLE');
    expect(profile.runtimeAi).toBe(false);
    expect(profile.productionMediaMutationAllowed).toBe(false);
    expect(profile.imagePipeline).toMatchObject({
      requiredModel: model,
      requiredQuality: 'max',
      available: true,
      exactModelExecution: 'PROVEN',
      imageAttempts: 14,
      substitutionAllowed: false,
    });
    expect(profile.videoPipeline).toMatchObject({ model: 'MiniMax-H3', attempted: true, totalAttempts: 4 });
    expect(profile.finalDecision).toMatchObject({ VISUAL_PRODUCTION_LOCK: 'YES', READY_FOR_CIN_6E_B: 'YES' });
  });

  it('defines all 13 committed visual families with A/B candidate slots', () => {
    const data = readJson('tools/cinematics/specs/visual_family_master_specs.json');
    const required = [
      'visualFamilyId', 'physicalLocationIdentity', 'narrativePurpose', 'architecture',
      'signatureLandmarks', 'terrain', 'groundMaterial', 'palette', 'keyLightDirection',
      'keyLightTemperature', 'ambientFill', 'atmosphere', 'depthLanguage',
      'foregroundLanguage', 'midgroundLanguage', 'backgroundLanguage', 'cameraLanguage',
      'timeOfDay', 'weather', 'materialLanguage', 'environmentalMotionCandidates',
      'forbiddenVisualDrift', 'goldReferenceLineage',
    ];
    expect(data.count).toBe(13);
    expect(new Set(data.families.map((entry) => entry.visualFamilyId)).size).toBe(13);
    for (const family of data.families) {
      for (const field of required) expect(family[field], `${family.visualFamilyId}.${field}`).toBeTruthy();
      expect(family.familyMasterCandidates.map((entry) => entry.attempt)).toEqual(['A', 'B']);
      expect(family.familyMasterCandidates.every((entry) => !entry.status.includes('BLOCKED'))).toBe(true);
    }
    expect(data.sameGameVisualIdentity).toBe('PASS');
    expect(data.visualProductionLock).toBe('YES');
  });

  it('hashes canonical references for all 22 character cards and never replaces tableau sprites', () => {
    const data = readJson('tools/cinematics/specs/canonical_character_production_cards.json');
    expect(data.count).toBe(22);
    expect(new Set(data.characters.map((entry) => entry.characterId)).size).toBe(22);
    for (const card of data.characters) {
      expect(card.canonicalFullBodyReferences.length, card.characterId).toBeGreaterThan(0);
      for (const reference of card.canonicalFullBodyReferences) {
        const path = assetPath(reference);
        expect(existsSync(path), reference).toBe(true);
        expect(card.referenceSha256, reference).toBe(sha256(path));
      }
      expect(card.staticTableauRule).toBe('USE_CANONICAL_RUNTIME_FOREGROUND_SPRITE_UNCHANGED');
      expect(card.mustPreserve.length).toBeGreaterThan(5);
      expect(card.mustNotChange.length).toBeGreaterThan(5);
    }
  });

  it('locks face visibility to each canonical full sprite for the pilot cast', () => {
    const data = readJson('tools/cinematics/specs/canonical_character_production_cards.json');
    const cards = new Map(data.characters.map((entry) => [entry.characterId, entry]));
    expect(Object.fromEntries([
      'alaric', 'alistair', 'cedric', 'elara', 'kestrel', 'maelor', 'marian', 'sage_seraphine',
    ].map((id) => [id, cards.get(id).faceVisibility]))).toEqual({
      alaric: 'VISIBLE',
      alistair: 'CONCEALED_BY_CLOSED_HELM',
      cedric: 'CONCEALED_BY_METAL_MASK',
      elara: 'CONCEALED_IN_SHADOW_EXCEPT_BLUE_EYES',
      kestrel: 'CONCEALED_BY_HOOD_AND_CLOTH_MASK',
      maelor: 'VISIBLE',
      marian: 'CONCEALED_BY_CLOSED_HELM',
      sage_seraphine: 'VISIBLE',
    });
    expect(cards.get('cedric').mustPreserve.join(' ')).toContain('vertical mouth slits');
    expect(cards.get('kestrel').mustPreserve.join(' ')).toContain('no exposed mouth or jaw');
    expect(cards.get('marian').mustPreserve.join(' ')).toContain('white-and-gold slit helm');
    expect(cards.get('elara').mustPreserve.join(' ')).toContain('only two luminous blue eyes are visible');
  });

  it('resolves all character-bearing presentation beats through explicit cast manifests', () => {
    const data = readJson('tools/cinematics/specs/scene_cast_manifests.json');
    expect(data.count).toBe(125);
    expect(data.manifests).toHaveLength(125);
    expect(new Set(data.manifests.map((entry) => entry.beatId)).size).toBe(125);
    for (const manifest of data.manifests) {
      expect(manifest.id).toBe(`cast:${manifest.beatId}`);
      if (['CINEMATIC_VIDEO', 'CINEMATIC_HOLD'].includes(manifest.semanticMode)) {
        expect(manifest.mustRemainPhysicallyPresent).toEqual(manifest.requiredCharacters);
      } else {
        expect(manifest.mustRemainPhysicallyPresent).toEqual([]);
      }
      expect(manifest.recruitmentState.futureRecruitLeakForbidden).toBe(true);
      expect(manifest.truthSources).toHaveLength(3);
      expect(manifest.requiredCharacters.filter((id) => manifest.forbiddenCharacters.includes(id))).toEqual([]);
    }
    expect(data.manifests.filter((manifest) => manifest.requiredCharacters.length > 0)).toHaveLength(119);
    expect(data.manifests.filter((manifest) => manifest.requiredCharacters.length === 0)).toHaveLength(6);
  });

  it('preserves 44 exact-model A/B jobs and records the approved E-C repair with complete provenance', () => {
    const data = readJson('tools/cinematics/specs/cin6ea_compiled_prompt_manifest.json');
    expect(data.summary).toEqual({ totalJobs: 45, familyMasterJobs: 26, pilotJobs: 18, jobsWithCompleteReferenceHashes: 45, cin6ea3RepairJobs: 1, generatedOutputs: 14 });
    expect(data.exactModelSnapshot).toBe(model);
    expect(data.quality).toBe('max');
    expect(data.generatedOutputs).toBe(14);
    const historicalJobs = data.jobs.filter((job) => ['A', 'B'].includes(job.attempt));
    expect(historicalJobs).toHaveLength(44);
    for (const job of historicalJobs) {
      expect(job.exactModelSnapshot).toBe(model);
      expect(job.quality).toBe('max');
      expect(job.promptSha256).toBe(sha256Text(job.prompt));
      expect(job.referencePaths.length).toBeGreaterThan(0);
      for (const reference of job.referencePaths) expect(job.referenceSha256[reference]).toBe(sha256(assetPath(reference)));
      expect(job.finalApprovalState).not.toContain('BLOCKED');
      if (job.outputPath) expect(sha256(assetPath(job.outputPath))).toBe(job.outputSha256);
      else expect(job.executionStatus).toBe('NOT_EXECUTED_NOT_SELECTED');
    }
    const repair = data.jobs.find((job) => job.assetCandidateId === 'pilot_e_cinematic_keyframe_c');
    expect(repair).toMatchObject({
      mission: 'CIN-6E-A.3',
      attempt: 'C',
      exactModelSnapshot: model,
      quality: 'max',
      generationType: 'edit',
      outputPath: 'tmp/cinematics/cin6ea/execution/images/pilot_e_cinematic_keyframe_c/pilot_e_cinematic_keyframe_c.png',
      outputSha256: 'd2943e0349c22ea7045f1b8e0a5b0571e1a8c0bacdb8496a3799fce70ad0317a',
      selection: 'OPERATOR_APPROVED',
      finalApprovalState: 'OPERATOR_APPROVED',
      executionStatus: 'GENERATED',
    });
    expect(repair.promptSha256).toBe(sha256Text(repair.prompt));
    expect(repair.referencePaths).toHaveLength(3);
    for (const reference of repair.referencePaths) expect(repair.referenceSha256[reference]).toBe(sha256(assetPath(reference)));
    expect(sha256(assetPath(repair.outputPath))).toBe(repair.outputSha256);
  });

  it('records all six operator-approved pilots and the three approved dynamic results', () => {
    const data = readJson('tools/cinematics/specs/cin6ea_six_pilot_plan.json');
    expect(data.summary).toEqual({ planned: 6, executed: 6, passed: 6, blocked: 0, imageAttempts: 14, miniMaxAttempts: 4, retries: 1 });
    expect(data.pilots.map((pilot) => pilot.id)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(data.pilots.every((pilot) => pilot.status === 'OPERATOR_APPROVED' && pilot.pass === true)).toBe(true);
    expect(data.finalDecision).toMatchObject({ DYNAMIC_VIDEO_GATE: 'YES', VISUAL_PRODUCTION_LOCK: 'YES', HUMAN_VISUAL_REVIEW: 'APPROVED' });
    const continuity = readJson('tools/cinematics/specs/cin6ea_video_pilot_continuity_specs.json');
    expect(continuity.count).toBe(3);
    expect(continuity.specs.map((entry) => entry.pilotId)).toEqual(['C', 'E', 'F']);
    for (const spec of continuity.specs) {
      expect(spec.characters.length).toBeGreaterThan(0);
      expect(spec.characters.every((character) => character.remainsInScene && character.allowedExitReentry === false && character.mustBeVisibleAtEnd)).toBe(true);
      expect(spec.targetEndState.requiredFinalVisibleCast).toEqual(spec.characters.map((character) => character.characterId));
      expect(spec.acceptance.internalCutCount).toBe(0);
      expect(spec.status).toBe('OPERATOR_APPROVED');
      expect(spec.result.gates).toMatchObject({ INTERNAL_CUT_COUNT: 0, MASK_BREAKS: 0, FINAL_FRAME_HOLD_SAFE: 'PASS' });
    }
  });

  it('hands CIN-6E-B the exact audited 119-asset production queue', () => {
    const data = readJson('tools/cinematics/specs/final_future_production_manifest.json');
    expect(data.summary).toMatchObject({
      productionVideoRecords: 31,
      retainedVideoSlots: 29,
      videosSemanticallyReclassified: 2,
      holdStillSlots: 25,
      travelStillAssets: 14,
      tableauBackgrounds: 49,
      tableauBackgroundsReusable: 2,
      tableauBackgroundsRequiringWork: 47,
      livingStillCandidates: 10,
    });
    expect(data.assets).toHaveLength(119);
    expect(data.assets.every((asset) => asset.humanApprovalDependency === true)).toBe(true);
    expect(data.assets.filter((asset) => asset.semanticMode === 'CINEMATIC_HOLD')).toHaveLength(25);
  });

  it('locks the three GOLD source hashes and multiple continuity signals', () => {
    const data = readJson('tools/cinematics/specs/gold_visual_dna.json');
    expect(data.references.map((entry) => [entry.id, entry.sourceSha256])).toEqual([
      ['alaric_audience_arrival', 'b823180582228dc2dd08592926efeb8ec58bc40bc102e238577361eac1dcb629'],
      ['camp_departure', 'a56678969bfb319d503be1f3f406ca2a3bef1a11bebc07db78c6fb22e6b9c0f3'],
      ['valmir_route_fork', '63a4a0c3793d6e29ce8fd94b1478dfab59e40f856d53a01915e47fb9a6343261'],
    ]);
    for (const entry of data.references) {
      expect(sha256(resolve(root, entry.source))).toBe(entry.sourceSha256);
      expect(entry.whatWeKeep.length).toBeGreaterThan(2);
      expect(entry.whatWeImprove.length).toBeGreaterThan(2);
      expect(entry.whatWeMustNeverReproduce.length).toBeGreaterThan(2);
    }
    const mediaTool = readFileSync(resolve(root, 'tools/cinematics/cin6ea_media_qa.mjs'), 'utf8');
    const reviewTool = readFileSync(resolve(root, 'tools/cinematics/cin6ea_review_assets.py'), 'utf8');
    expect(mediaTool).toContain("select='gt(scene,0.35)'");
    expect(reviewTool).toContain('normalizedMeanAbsoluteDifference');
    expect(reviewTool).toContain('normalizedHistogramL1');
  });

  it('keeps protected game systems and visual assets unchanged outside authorized presentation-only runtime proofs', () => {
    const authorizedPostLockFiles = new Set([
      // CAMPAIGN-PRESENTATION-MIGRATION-1 authorizes presentation policy, not route truth/media.
      'src/journey/JourneyPresentationPolicy.ts',
      'src/journey/JourneyPresentationPolicy.test.ts',
      'src/combat/vfx/CasterMotionBackCompat.test.ts',
      'src/combat/CombatBridge.ts',
      'src/combat/legacyCombatRuntime.js',
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
      'src/combat/stage/CombatPoseVisual.test.ts',
      'src/combat/stage/CombatStagePose.test.ts',
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
    const allowedRuntime = new Set([
      'src/game/campaignPresentationMigration.test.ts',
      'src/cinematics/Cin6aPresentation.ts', // Current presentation-policy comment only.
      'src/game/GameApp.ts',
      'src/game/catalog.ts',
      'src/game/content.test.ts',
      'src/game/cin65CinematicDialogueIntegration.test.ts',
      'src/game/cin67NarrativeStageIntegration.test.ts',
      'src/cinematics/Cin673SpatialCoherence.test.ts',
      'src/cinematics/CinematicReductionPolicy.ts',
      'src/cinematics/DialoguePresentationSegments.ts',
      'src/cinematics/DialogueStagingDirector.test.ts',
      'src/cinematics/DialogueStagingDirector.ts',
      'src/cinematics/FinalDialoguePresentation.generated.ts',
      'src/cinematics/FinalDialoguePresentation.test.ts',
      'src/cinematics/NarrativeDialogueAdapter.test.ts',
      'src/cinematics/NarrativeDialogueAdapter.ts',
      'src/cinematics/NarrativePresentationDoctrine.ts',
      'src/cinematics/NarrativePresentationDoctrine.test.ts',
      'src/cinematics/NarrativeSceneSurface.test.ts',
      'src/cinematics/NarrativeSceneSurface.ts',
      'src/cinematics/NarrativeStage.ts',
      'src/cinematics/NarrativeStage.test.ts',
      'src/cinematics/NarrativeStagingAudit.test.ts',
      'src/game/contextualDialogue.test.ts',
      'src/cinematics/NarrativePresentationRuntime.test.ts',
      'src/cinematics/NarrativeStagingAudit.ts',
      'src/cinematics/NarrativeTableau.ts',
      'src/cinematics/RuntimePresentationStepCensus.test.ts',
      'src/cinematics/RuntimePresentationStepCensus.ts',
      'src/game/RuntimeDialogueReachability.ts',
      'src/game/dialoguePresentationShape.ts',
      'src/game/lionFinale.ts',
      'src/cinematics/FinalNarrativeContinuity.test.ts',
      'src/cinematics/FinalPresentationModeAudit.test.ts',
      'src/cinematics/FinalPresentationRegistry.generated.ts',
      'src/game/cin2CampaignBridge.test.ts',
      'src/game/content.ts',
      'src/game/contextualDialogueContent.ts',
      'src/game/lionFinale.test.ts',
      'src/game/lionVerdict.test.ts',
      'src/game/lionVerdict.ts',
      'src/game/r5NarrativeContent.ts',
      'src/game/r5NarrativeExpansion.test.ts',
      'src/game/r6FullRouteIntegration.test.ts',
      'src/game/reputationEventContent.ts',
      'src/game/reputationEventDirector.test.ts',
      'src/game/runSystem.ts',
      // Authorized T0 optional run fields; exact schema delta is guarded by the census test.
      'src/game/types.ts',
      'src/game/traversalRouteAuthority.test.ts',
    ]);
    const runtimeDiff = execFileSync('git', ['diff', '--name-only', baseline, '--', 'src/game', 'src/cinematics'], { cwd: root, encoding: 'utf8' })
      .trim().split(/\r?\n/u).filter(Boolean);
    expect(runtimeDiff.filter((path) => !allowedRuntime.has(path))).toEqual([]);
  });
});
