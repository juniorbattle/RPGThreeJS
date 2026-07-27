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
    expect(runtimeSource).toContain("if(preset==='leap_impact')playActionVfxAt(preset,u,head,spec)");
    expect(runtimeSource).toContain("else if(spec.key!=='ar_explosive_retreat')vfx('hit',head)");
  });

  it('imports presentation tuning from the shared combatVfxPresentation module', () => {
    expect(runtimeSource).toContain("from './combatVfxPresentation'");
    expect(runtimeSource).not.toContain("const ACTION_PRESENTATION_TIERS=Object.freeze");
  });

  it('guards castTelegraph burst when authored spritesheet preset exists (V10G-R2A.1)', () => {
    expect(runtimeSource).toContain('function castTelegraph(u,spec,skipBurst)');
    expect(runtimeSource).toContain('if(!skipBurst) burst(');
    expect(runtimeSource).toContain("castTelegraph(u,spec,Boolean(getActionVfxPreset(spec,u)))");
  });

  it('suppresses generic overlays when authored spritesheet exists (V10G-R2A.2)', () => {
    expect(runtimeSource).toContain("import { getVfxPreset } from './vfx/VfxPresets'");
    expect(runtimeSource).toContain('function actionUsesAuthoredSpritesheet(spec={},u=null)');
    expect(runtimeSource).toContain("preset.steps.some(step=>visualTypes.includes(step.type))");
    expect(runtimeSource).toContain('const hasAuthoredVfx=actionUsesAuthoredSpritesheet(spec,u)');
    expect(runtimeSource).toContain('if(!hasAuthoredVfx)screenFlash');
    expect(runtimeSource).toContain("if(preset!=='teleport_burst')screenFlash");
    expect(runtimeSource).toContain('if(!dashHasAuthored){ screenFlash');
  });

  it('removes oversized statusHalo ring for exhausted/staggered (V10G-R2A.3)', () => {
    expect(runtimeSource).not.toContain('statusHalo');
    expect(runtimeSource).not.toContain('RingGeometry(0.57,0.82');
    expect(runtimeSource).not.toContain('halo.visible');
    expect(runtimeSource).not.toContain('halo.material');
    expect(runtimeSource).not.toContain('halo.scale');
  });
});
