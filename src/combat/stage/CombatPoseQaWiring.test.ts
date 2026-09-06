import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const runtime = readFileSync(join(process.cwd(), 'src', 'combat', 'legacyCombatRuntime.js'), 'utf8');
const bridge = readFileSync(join(process.cwd(), 'src', 'combat', 'CombatBridge.ts'), 'utf8');

describe('Combat Pose DEV QA wiring', () => {
  it('is gated by Vite DEV mode and the explicit stageqa query flag', () => {
    expect(runtime).toContain("const STAGE_QA_ENABLED=import.meta.env.DEV&&campaignParams.get('stageqa')==='1'");
    expect(bridge).toContain("params.get('stageqa') === '1'");
    expect(bridge).toContain("${devStageQa ? '&stageqa=1' : ''}");
  });

  it('provides held Stage inspection, unit selection and semantic cycling controls', () => {
    expect(runtime).toContain('togglePoseQaStage()');
    expect(runtime).toContain('combatStage.selectNextPoseQaUnit');
    expect(runtime).toContain('combatStage.cycleSelectedPose()');
    expect(runtime).toContain('data-pose-qa="hold"');
    expect(runtime).toContain("k==='p'");
    expect(runtime).toContain("k==='['||k===']'");
  });

  it('propagates authoritative encounter visual IDs onto live Stage units', () => {
    expect(runtime).toContain('combatPoseUnitId:id');
    expect(runtime).toContain('combatPoseUnitId:def.combatPoseUnitId||null');
    expect(runtime).toContain('combatPoseUnitId:ENCOUNTER_BOSS_VISUAL_ID||null');
  });
});
