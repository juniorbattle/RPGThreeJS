import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const runtimeSource = readFileSync(new URL('./legacyCombatRuntime.js', import.meta.url), 'utf8');

describe('V10F final hotfix runtime contracts', () => {
  it('wires revive_vial through the existing KO ally flow only', () => {
    expect(runtimeSource).toContain(
      "revive_vial:{name:'Fiole de résurrection',effect:'revive',power:0.5,range:[0,1]",
    );
    expect(runtimeSource).toContain(
      "if(it.effect==='revive')return Object.assign(base,{type:'revive',power:it.power||0.5,revive:true,support:true,targetMode:'ally'})",
    );
    expect(runtimeSource).toContain("if(spec.item&&spec.itemId&&!spec.revive)");
    expect(runtimeSource).toContain("if(revived>0&&spec.item&&spec.itemId)");
    expect(runtimeSource).toContain("it.effect!=='revive'||G.units.some(x=>!x.alive&&x.downed&&x.team===u.team)");
    expect(runtimeSource).toContain("if(spec.revive)return 'support_revive_pillar'");
  });

  it('anchors retreat impact at departure and tumble impact at landing', () => {
    expect(runtimeSource).toContain("spec.key==='ar_explosive_retreat'&&origin");
    expect(runtimeSource).toContain("if(spec.key==='ro_tumble')return");
    expect(runtimeSource).toContain("leapHasSpritesheet=actionHasSpritesheetVfx(spec,u)");
    expect(runtimeSource).toContain("if(leapHasSpritesheet)playActionVfxAt");
    expect(runtimeSource).toContain("else if(spec.key!=='ar_explosive_retreat')vfx('hit',head)");
  });

  it('imports presentation tuning from the shared combatVfxPresentation module', () => {
    expect(runtimeSource).toContain("from './combatVfxPresentation'");
    expect(runtimeSource).not.toContain("const ACTION_PRESENTATION_TIERS=Object.freeze");
  });

  it('guards castTelegraph burst when spritesheet VFX exists (V10G-R2A.1/R2A.5)', () => {
    expect(runtimeSource).toContain('function castTelegraph(u,spec,skipBurst)');
    expect(runtimeSource).toContain('if(!skipBurst) burst(');
    expect(runtimeSource).toContain('!hasSpritesheet)castTelegraph(u,spec,Boolean(hasPreset))');
  });

  it('suppresses generic overlays when spritesheet VFX exists (V10G-R2A.2/R2A.5)', () => {
    expect(runtimeSource).toContain("import { getVfxPreset } from './vfx/VfxPresets'");
    expect(runtimeSource).toContain('function actionHasSpritesheetVfx(spec={},u=null)');
    expect(runtimeSource).toContain("preset.steps.some(step=>step.type==='spriteSheet')");
    expect(runtimeSource).toContain('function actionHasPreset(spec={},u=null)');
    expect(runtimeSource).toContain('const hasSpritesheet=actionHasSpritesheetVfx(spec,u)');
    expect(runtimeSource).toContain('const hasPreset=actionHasPreset(spec,u)');
    expect(runtimeSource).toContain('if(!hasPreset)screenFlash');
    expect(runtimeSource).toContain('if(!dashHasSpritesheet){ screenFlash');
    expect(runtimeSource).not.toContain('actionUsesAuthoredSpritesheet');
  });

  it('removes oversized statusHalo ring for exhausted/staggered (V10G-R2A.3)', () => {
    expect(runtimeSource).not.toContain('statusHalo');
    expect(runtimeSource).not.toContain('RingGeometry(0.57,0.82');
    expect(runtimeSource).not.toContain('halo.visible');
    expect(runtimeSource).not.toContain('halo.material');
    expect(runtimeSource).not.toContain('halo.scale');
  });

  it('implements playUnitHitReaction for damage hit feedback (V10G-R2A.4)', () => {
    expect(runtimeSource).toContain('async function playUnitHitReaction(u,opts={})');
    expect(runtimeSource).toContain('const critical=Boolean(opts.critical)');
    expect(runtimeSource).toContain('isBoss=u.size>1');
    expect(runtimeSource).toContain('reduced=REDUCED_GRAPHICS');
    expect(runtimeSource).toContain('flashColor=critical?\'#fff3b0\':\'#ff6a5a\'');
    expect(runtimeSource).toContain('spriteReturnBaseline(u,baseline)');
  });

  it('wires applyDamage to use playUnitHitReaction for non-KO damage (V10G-R2A.4)', () => {
    expect(runtimeSource).toContain('async function applyDamage(u,dmg,src,opts={})');
    expect(runtimeSource).toContain('if(willKnockOut){ flashUnit(u');
    expect(runtimeSource).toContain("await playUnitHitReaction(u,{source:src,critical:opts.critical})");
  });

  it('passes critical flag from attack code to applyDamage (V10G-R2A.4)', () => {
    expect(runtimeSource).toContain('applyDamage(t,dmg,u,{critical:crit})');
  });

  it('does not trigger hit reaction for healing (V10G-R2A.4)', () => {
    const applyHealIdx = runtimeSource.indexOf('function applyHeal(u,amt)');
    expect(applyHealIdx).toBeGreaterThan(0);
    const applyHealSection = runtimeSource.slice(applyHealIdx, applyHealIdx + 200);
    expect(applyHealSection).not.toContain('playUnitHitReaction');
  });

  it('no sky_descent or cinematic travel reintroduced (V10G-R2A.4)', () => {
    expect(runtimeSource).not.toContain('sky_descent');
    expect(runtimeSource).not.toContain('cinematic_travel');
  });

  it('keeps V11A unit presentation transform-only for idle billboards', () => {
    expect(runtimeSource).toContain("from './unitMotion'");
    expect(runtimeSource).toContain('createCanonicalUnitMotionBaseline');
    expect(runtimeSource).toContain('restoreUnitVisualBaseline');
    expect(runtimeSource).not.toContain('SkinnedMesh');
    expect(runtimeSource).not.toContain('AnimationMixer');
    expect(runtimeSource).not.toContain('Skeleton');
    expect(runtimeSource).not.toContain('walkCycle');
  });

  it('resolves gameplay at visual impact before attacker recovery', () => {
    expect(runtimeSource).toContain('onResolveImpact');
    expect(runtimeSource).toContain('impactStarted');
    expect(runtimeSource).toContain('await impactFinished');
    expect(runtimeSource).toContain('await animation;');
    expect(runtimeSource.indexOf('} finally { finishImpact(); }')).toBeLessThan(runtimeSource.indexOf('await animation;'));
  });

  it('settles cancelled tweens without firing their completion chain', () => {
    expect(runtimeSource).toContain('handle.onCancel=()=>resolve({cancelled:true})');
    expect(runtimeSource).toContain('handle.onCancel&&handle.onCancel()');
    expect(runtimeSource).toContain('isUnitMotionCurrent');
  });

  it('guarantees action and page teardown', () => {
    expect(runtimeSource).toContain('try { await executeActionCore');
    expect(runtimeSource).toContain('if(G.stage)await combatStageExit()');
    expect(runtimeSource).toContain("window.addEventListener('pagehide',disposeCombatRuntime");
    expect(runtimeSource).toContain('combatVfxSystem.dispose()');
  });

  it('keeps the painted combat camera static across turns, actions, stages, and deployment', () => {
    expect(runtimeSource).toContain('const cam=Object.freeze({');
    expect(runtimeSource).toContain('function focusCam(){ }');
    expect(runtimeSource).toContain('function actionCam(){ }');
    expect(runtimeSource).toContain('function stageFrame(){ }');
    expect(runtimeSource).toContain('function overviewCam(){ }');
    expect(runtimeSource).toContain('function rotateCam(){ }');
    expect(runtimeSource).toContain('function restoreCam(){ return Promise.resolve(); }');
    expect(runtimeSource).not.toContain('tween(cam');
    expect(runtimeSource).not.toContain('tweenP(cam');
    expect(runtimeSource).not.toContain('_actionCameraBaseline');
    expect(runtimeSource).not.toContain('_stageCameraBaseline');
    expect(runtimeSource).not.toContain('camera.fov=cl(');
  });

  it('V2.6.1: screen-space shake replaces world-camera shake', () => {
    // applyAdditiveCameraShake is still imported (backward compat) but NOT used in applyCam
    expect(runtimeSource).toContain('applyAdditiveCameraShake');
    // cameraFeedback.sample() is used in the animate loop for the post-process pass
    expect(runtimeSource).toContain('cameraFeedback.sample()');
    expect(runtimeSource).toContain('shakeSampleToUvOffset');
    expect(runtimeSource).toContain('ImpactShake');
    expect(runtimeSource).toContain('impactShakePass');
    // Camera position is set directly from cam baseline, without applyAdditiveCameraShake
    expect(runtimeSource).toContain('camera.position.set(cam.tx+x,cam.ty+cam.height,cam.tz+z)');
    expect(runtimeSource).toContain('camera.lookAt(cam.tx,cam.ty,cam.tz)');
    // The old world-camera shake path is removed from applyCam
    expect(runtimeSource).not.toContain('applyAdditiveCameraShake({x:cam.tx+x');
    expect(runtimeSource).not.toContain("if(k==='q')rotateCam");
    expect(runtimeSource).not.toContain("if(k==='e')rotateCam");
  });
});

describe('R0A-QA1.1 impact ordering and phase timing', () => {
  it('notifyImpact occurs before resolveImpact with no presentation wait between them', () => {
    const impactBlock = runtimeSource.match(/combatStage\.notifyImpact\(\);[\s\S]*?await resolveImpact\(\);/);
    expect(impactBlock).not.toBeNull();
    const block = impactBlock![0];
    expect(block).toContain('combatStage.notifyImpact()');
    expect(block).toContain('await resolveImpact()');
    const notifyIdx = block.indexOf('combatStage.notifyImpact()');
    const resolveIdx = block.indexOf('await resolveImpact()');
    expect(notifyIdx).toBeLessThan(resolveIdx);
    const between = block.slice(notifyIdx + 'combatStage.notifyImpact()'.length, resolveIdx);
    expect(between).not.toContain('wait');
    expect(between).not.toContain('impactToReactionMs');
  });

  it('impactToReactionMs wait occurs AFTER resolveImpact, not before', () => {
    const impactBlock = runtimeSource.match(/combatStage\.notifyImpact\(\);[\s\S]*?impactHold/);
    expect(impactBlock).not.toBeNull();
    const block = impactBlock![0];
    const resolveIdx = block.indexOf('await resolveImpact()');
    const reactionIdx = block.indexOf('impactToReactionMs');
    expect(resolveIdx).toBeGreaterThan(-1);
    expect(reactionIdx).toBeGreaterThan(-1);
    expect(reactionIdx).toBeGreaterThan(resolveIdx);
  });

  it('resolveImpact is wrapped in onceAsync for exactly-once resolution', () => {
    expect(runtimeSource).toContain('const resolveImpact=onceAsync(async()=>{');
    expect(runtimeSource).toContain("if(typeof actionContext.onResolveImpact==='function')await actionContext.onResolveImpact()");
  });

  it('settleMs is consumed after combatStageEnter and before attackAnim', () => {
    const settleBlock = runtimeSource.match(/await combatStageEnter[\s\S]*?settleMs[\s\S]*?attackAnim/);
    expect(settleBlock).not.toBeNull();
  });

  it('recoveryMs is consumed before combatStageExit', () => {
    const recoveryBlock = runtimeSource.match(/recoveryMs[\s\S]*?combatStageExit/);
    expect(recoveryBlock).not.toBeNull();
  });

  it('releaseToImpactMs is not consumed as a separate wait in the runtime', () => {
    expect(runtimeSource).not.toContain('releaseToImpactMs');
  });

  it('reactionToFeedbackMs is not consumed as a separate wait in the runtime', () => {
    expect(runtimeSource).not.toContain('reactionToFeedbackMs');
  });

  it('preserves signalImpact/finishImpact/onResolveImpact exactly-once chain', () => {
    expect(runtimeSource).toContain('signalImpact=resolve');
    expect(runtimeSource).toContain('finishImpact=resolve');
    expect(runtimeSource).toContain('onResolveImpact:async()=>{signalImpact(); await impactFinished;}');
    expect(runtimeSource).toContain('} finally { finishImpact(); }');
  });
});

describe('R0B universal Stage routing in runtime', () => {
  it('imports resolveCombatStageProfileUniversal and getStageProfileInfo', () => {
    expect(runtimeSource).toContain('resolveCombatStageProfileUniversal');
    expect(runtimeSource).toContain('getStageProfileInfo');
  });

  it('combatStageEnter resolves profile universally and passes it to combatStage.enter', () => {
    expect(runtimeSource).toContain('resolveCombatStageProfileUniversal(spec,presentation)');
    expect(runtimeSource).toContain('profile:stageProfile');
  });

  it('combatStageEnter passes sourceTeam from attacker team', () => {
    expect(runtimeSource).toContain('sourceTeam:att.team');
  });

  it('combatStageEnter passes stationaryAttacker for boss/elite', () => {
    expect(runtimeSource).toContain('stationaryAttacker');
    expect(runtimeSource).toContain('att.boss||att.elite');
  });

  it('logs Stage QA info when STAGE_QA_ENABLED', () => {
    expect(runtimeSource).toContain('getStageProfileInfo(spec,presentation)');
    expect(runtimeSource).toContain('[Stage QA]');
  });

  it('QA logging includes faction direction and source team', () => {
    expect(runtimeSource).toContain('att.team');
    expect(runtimeSource).toContain('dir=');
  });

  it('uses getSkillPresentation for presentation metadata in combatStageEnter', () => {
    expect(runtimeSource).toContain('const presentation=getSkillPresentation(spec)');
  });

  it('preserves resolveImpact exactly-once with universal routing', () => {
    expect(runtimeSource).toContain('const resolveImpact=onceAsync(async()=>{');
    expect(runtimeSource).toContain('combatStage.notifyImpact()');
    expect(runtimeSource).toContain('await resolveImpact()');
    const impactBlock = runtimeSource.match(/combatStage\.notifyImpact\(\);[\s\S]*?await resolveImpact\(\);/);
    expect(impactBlock).not.toBeNull();
    const block = impactBlock![0];
    const notifyIdx = block.indexOf('combatStage.notifyImpact()');
    const resolveIdx = block.indexOf('await resolveImpact()');
    expect(notifyIdx).toBeLessThan(resolveIdx);
    const between = block.slice(notifyIdx + 'combatStage.notifyImpact()'.length, resolveIdx);
    expect(between).not.toContain('wait');
  });

  it('impactToReactionMs remains after resolveImpact', () => {
    const impactBlock = runtimeSource.match(/combatStage\.notifyImpact\(\);[\s\S]*?impactHold/);
    expect(impactBlock).not.toBeNull();
    const block = impactBlock![0];
    const resolveIdx = block.indexOf('await resolveImpact()');
    const reactionIdx = block.indexOf('impactToReactionMs');
    expect(reactionIdx).toBeGreaterThan(resolveIdx);
  });

  it('settleMs gap remains after combatStageEnter', () => {
    const settleBlock = runtimeSource.match(/await combatStageEnter[\s\S]*?settleMs[\s\S]*?attackAnim/);
    expect(settleBlock).not.toBeNull();
  });

  it('recoveryMs gap remains before combatStageExit', () => {
    const recoveryBlock = runtimeSource.match(/recoveryMs[\s\S]*?combatStageExit/);
    expect(recoveryBlock).not.toBeNull();
  });

  it('captures pre-resolution unit state for aftermath snapshot', () => {
    expect(runtimeSource).toContain('_preState');
    expect(runtimeSource).toContain('alive:u.alive,hp:u.hp,statuses');
  });

  it('calls presentResolvedAftermath with aftermath snapshot and floatText', () => {
    expect(runtimeSource).toContain('combatStage.presentResolvedAftermath(_aftermath,floatText)');
  });

  it('builds aftermath snapshot with KO, statusesApplied, healed from pre/post state', () => {
    expect(runtimeSource).toContain('_buildAE');
    expect(runtimeSource).toContain('ko:_pre.alive&&!_un.alive');
    expect(runtimeSource).toContain('statusesApplied');
    expect(runtimeSource).toContain('healed:_un.alive&&_un.hp>_pre.hp');
  });

  it('aftermath hold is driven by presentResolvedAftermath, not reactionToFeedbackMs wait', () => {
    expect(runtimeSource).not.toContain('reactionToFeedbackMs');
    expect(runtimeSource).toContain('presentResolvedAftermath');
  });

  it('aftermath occurs after animation and before recovery/exit', () => {
    const block = runtimeSource.match(/await animation;[\s\S]*?presentResolvedAftermath[\s\S]*?recoveryMs[\s\S]*?combatStageExit/);
    expect(block).not.toBeNull();
  });

  it('aftermath filters attacker from targets list', () => {
    expect(runtimeSource).toContain('targets.filter(t=>t!==u)');
  });
});
