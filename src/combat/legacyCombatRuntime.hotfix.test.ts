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
    expect(runtimeSource).toContain("if(!playActionVfxAt(getActionVfxPreset(spec,u),u,head,spec)&&spec.key!=='ar_explosive_retreat')vfx('hit',head)");
  });

  // OD-2026-10-29-A: combat plays procedural recipes only, at leap, teleport and dash points too; the dash plays its own effect.
  it('plays procedural recipes at leap, teleport and dash points, and the dash plays its own effect', () => {
    expect(runtimeSource).toContain('fxDirector.play(resolveFxRecipe(presetId,preset?.tags||[]),{source:fxUnitRef(u),targets:[{position:point.clone(),height:1.6}]');
    expect(runtimeSource).toContain('screenShake(0.5,0.3); if(!playActionVfxAt(getActionVfxPreset(spec,u),u,head,spec)){ screenFlash');
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
    expect(runtimeSource).toContain("preset.steps.some(step=>step.type==='spriteSheet'&&isVfxSpriteSheetResolved(step.spriteSheet))");
    expect(runtimeSource).toContain('function actionHasPreset(spec={},u=null)');
    // procedural FX recipes count as authored VFX: generic overlays stay suppressed
    expect(runtimeSource).toContain('const hasSpritesheet=fxReady||actionHasSpritesheetVfx(spec,u)');
    expect(runtimeSource).toContain('const hasPreset=fxReady||actionHasPreset(spec,u)');
    expect(runtimeSource).toContain('if(!hasPreset)screenFlash');
    expect(runtimeSource).toContain('if(!playActionVfxAt(getActionVfxPreset(spec,u),u,head,spec)){ screenFlash');
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
    expect(runtimeSource).toContain("applyDamage(t,dmg,u,{critical:crit,magic:(spec.type==='mag')})");
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
    expect(runtimeSource).toContain('if(G.spotlight)await presentActionExit()');
    expect(runtimeSource).toContain("window.addEventListener('pagehide',disposeCombatRuntime");
    expect(runtimeSource).toContain('combatVfxSystem.dispose()');
  });

  it('drives the combat camera through one director (tactical, action push-in, spotlight)', () => {
    expect(runtimeSource).toContain("import { CombatCameraDirector, shotFor } from './camera/CombatCameraDirector'");
    expect(runtimeSource).toContain('const cameraDirector=new CombatCameraDirector({');
    expect(runtimeSource).toContain('function restoreCam(){ return cameraDirector.restore(0.5); }');
    expect(runtimeSource).toContain("cameraDirector.frame('spotlight',");
    expect(runtimeSource).toContain('await cameraDirector.restore(');
    // the player never orbits the camera; Q/E stay unbound
    expect(runtimeSource).toContain('function rotateCam(){ }');
    expect(runtimeSource).not.toContain('tween(cam');
    expect(runtimeSource).not.toContain('tweenP(cam');
  });

  it('V2.6.1: screen-space shake replaces world-camera shake', () => {
    // applyAdditiveCameraShake is still imported (backward compat) but NOT used in applyCam
    expect(runtimeSource).toContain('applyAdditiveCameraShake');
    // cameraFeedback.sample() is used in the animate loop for the post-process pass
    expect(runtimeSource).toContain('cameraFeedback.sample()');
    expect(runtimeSource).toContain('shakeSampleToUvOffset');
    expect(runtimeSource).toContain('ImpactShake');
    expect(runtimeSource).toContain('impactShakePass');
    // Camera position comes from the director shot, without applyAdditiveCameraShake
    expect(runtimeSource).toContain('camera.position.set(shot.tx+Math.sin(shot.yaw)*shot.dist,shot.ty+shot.height,shot.tz+Math.cos(shot.yaw)*shot.dist)');
    expect(runtimeSource).toContain('camera.lookAt(shot.tx,shot.ty,shot.tz)');
    // The old world-camera shake path is removed from applyCam
    expect(runtimeSource).not.toContain('applyAdditiveCameraShake({x:cam.tx+x');
    expect(runtimeSource).not.toContain("if(k==='q')rotateCam");
    expect(runtimeSource).not.toContain("if(k==='e')rotateCam");
  });
});

describe('R0A-QA1.1 impact ordering and phase timing', () => {
  it('resolves gameplay before the presentation impact hold', () => {
    const block = runtimeSource.match(/await resolveImpact\(\);\r?\n\s*const impactHold=/);
    expect(block).not.toBeNull();
  });

  it('resolveImpact is wrapped in onceAsync for exactly-once resolution', () => {
    expect(runtimeSource).toContain('const resolveImpact=onceAsync(async()=>{');
    expect(runtimeSource).toContain("if(typeof actionContext.onResolveImpact==='function')await actionContext.onResolveImpact()");
  });

  it('opens the action presentation before the attack animation', () => {
    const block = runtimeSource.match(/await presentActionEnter\(u,targets,spec\);[\s\S]*?attackAnim\(/);
    expect(block).not.toBeNull();
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

describe('In-arena action presentation (Combat Stage retired)', () => {
  it('no longer imports or instantiates the Combat Stage scene', () => {
    expect(runtimeSource).not.toContain("from './stage/CombatStage'");
    expect(runtimeSource).not.toContain('new CombatStage(');
    expect(runtimeSource).not.toContain('combatStage.');
  });

  it('routes ultimates and boss signatures to the spotlight, AoE to a wider shot', () => {
    expect(runtimeSource).toContain("if(presentation?.ultimate||tuning.tier===6)return 'spotlight';");
    expect(runtimeSource).toContain("if((spec.radius||0)>=1&&targets.length>1)return 'aoe';");
  });

  it('closes the presentation after gameplay resolution', () => {
    const block = runtimeSource.match(/await animation;[\s\S]*?await presentActionExit\(\); G\.busy=false; checkEnd\(\);/);
    expect(block).not.toBeNull();
  });
});
