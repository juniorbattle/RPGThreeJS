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

  it('keeps only bounded additive camera shake over the immutable composition', () => {
    expect(runtimeSource).toContain('applyAdditiveCameraShake');
    expect(runtimeSource).toContain('cameraFeedback.sample()');
    expect(runtimeSource).toContain('camera.lookAt(cam.tx,cam.ty,cam.tz)');
    expect(runtimeSource).not.toContain("if(k==='q')rotateCam");
    expect(runtimeSource).not.toContain("if(k==='e')rotateCam");
  });
});
