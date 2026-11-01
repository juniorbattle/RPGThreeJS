import { describe, expect, it } from 'vitest';
import { enemyAttackFxRecipe, listEnemyAttackWeapons, listSkillFxRecipes, skillFxRecipe } from '../combat/fx/fxSkills';
import { COMBAT_SFX_IDS } from '../combat/audio/CombatSfx';
import { markCue, sharedStepCue, SHARED_STEP_IDS, type FxSoundMark } from '../combat/fx/fxSounds';
import { combatAudioMessageSchema } from '../combat/CombatAudio';
import { listExplicitFxRecipes, resolveFxRecipe, type FxRecipe } from '../combat/fx/fxRecipes';
import { COMBAT_SOUND_IDS, soundPriority, TACTICAL_SOUND_IDS } from '../ui/GameSoundCatalog';
import { COMPOSED_CUE_IDS, COMPOSED_CUE_MAX_SECONDS, composedCue, cueFamily, isSignatureCue, SIGNATURE_CUE_IDS, SIGNATURE_CUE_MAX_SECONDS, SIGNATURE_SKILLS, signatureId, soundWeight, ULTIMATE_SKILLS, BOSS_SIGNATURES, type Weight } from './cueTable';
import { cueMaxSeconds, cuePeakTarget, renderCue, scheduleCue, TABLE_CUE_IDS } from './synthCues';

/** A recording stand-in for an audio context: it keeps every scheduled start and stop. */
function recorder() {
  const stops: number[] = [];
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({ connect: (next: unknown) => next });
  const ctx = {
    createOscillator: () => ({ ...node(), type: 'sine', frequency: param(), start() {}, stop: (t: number) => stops.push(t) }),
    createGain: () => ({ ...node(), gain: param() }),
    createBiquadFilter: () => ({ ...node(), type: 'lowpass', frequency: param(), Q: param() }),
    createBufferSource: () => ({ ...node(), buffer: null, start() {}, stop: (t: number) => stops.push(t) }),
  };
  return { ctx: ctx as unknown as BaseAudioContext, stops };
}
const seconds = (id: string) => { const { ctx, stops } = recorder(); scheduleCue(ctx, {} as AudioNode, {} as AudioBuffer, id); return Math.max(...stops); };

const skills = listSkillFxRecipes().map((id) => skillFxRecipe(id)!);
const attacks = listEnemyAttackWeapons().map((weapon) => enemyAttackFxRecipe(weapon)!);
const WEIGHTS: readonly Weight[] = ['l', 'm', 'h'];

describe('the closed cue table', () => {
  it('holds at most 160 identities with the sixteen families', () => {
    expect(TABLE_CUE_IDS.length).toBe(COMBAT_SOUND_IDS.length + COMPOSED_CUE_IDS.length + SIGNATURE_CUE_IDS.length);
    expect(TABLE_CUE_IDS.length).toBeLessThanOrEqual(160);
    expect(new Set(TABLE_CUE_IDS).size).toBe(TABLE_CUE_IDS.length);
  });

  it('writes charge, blow and wave for the twelve Ultimates and the eight boss signatures', () => {
    expect(ULTIMATE_SKILLS).toHaveLength(12);
    expect(BOSS_SIGNATURES).toHaveLength(8);
    expect(SIGNATURE_CUE_IDS).toHaveLength(60);
    for (const id of SIGNATURE_CUE_IDS) expect(isSignatureCue(id), id).toBe(true);
  });

  it('keeps every cue inside its limit, by design and deterministically', () => {
    for (const id of TABLE_CUE_IDS) {
      expect(seconds(id), id).toBeGreaterThan(0);
      expect(seconds(id), id).toBeLessThanOrEqual(cueMaxSeconds(id));
      expect(seconds(id), id).toBe(seconds(id));
    }
    expect(cueMaxSeconds(SIGNATURE_CUE_IDS[0]!)).toBe(SIGNATURE_CUE_MAX_SECONDS);
    expect(cueMaxSeconds(COMPOSED_CUE_IDS[0]!)).toBe(COMPOSED_CUE_MAX_SECONDS);
    expect(cueMaxSeconds('thrust')).toBe(1);
    expect(cuePeakTarget()).toBe(0.2);
  });

  it('gives every composed and signature cue a file family to fall back to', () => {
    for (const id of [...COMPOSED_CUE_IDS, ...SIGNATURE_CUE_IDS]) expect(COMBAT_SOUND_IDS, id).toContain(cueFamily(id));
    expect(cueFamily('not.a.cue')).toBeNull();
  });

  it('bins weight from AP cost and unit height only', () => {
    expect(soundWeight(2, 1.9)).toBe('l');
    expect(soundWeight(3, 1.9)).toBe('m');
    expect(soundWeight(4, 1.9)).toBe('h');
    expect(soundWeight(2, 3.6)).toBe('m');
    expect(soundWeight(3, 3.6)).toBe('h');
    expect(soundWeight.length).toBeLessThanOrEqual(2);
  });

  it('resolves the nearest weight of a pair and nothing for a pair the table does not hold', () => {
    expect(composedCue('thrust', 'sky', 'm')).toBe('fx.thrust.sky.m');
    expect(composedCue('dash', 'gold', 'h')).toBe('fx.dash.gold.l');
    expect(composedCue('mend', 'fire', 'l')).toBeNull();
  });

  it('is on the typed allowlist, and a cue outside the table is not', () => {
    const message = (id: string) => ({ type: 'rpg-threejs:combat-sound', sessionId: 's', id, eventId: 'action-1:mark0:' });
    for (const id of [...COMPOSED_CUE_IDS.slice(0, 3), ...SIGNATURE_CUE_IDS.slice(0, 3)]) {
      expect(TACTICAL_SOUND_IDS).toContain(id);
      expect(combatAudioMessageSchema.safeParse(message(id)).success, id).toBe(true);
    }
    expect(combatAudioMessageSchema.safeParse(message('fx.made.up.l')).success).toBe(false);
  });

  it('ranks signature cues above launches and below the critical', () => {
    expect(soundPriority(SIGNATURE_CUE_IDS[0]!)).toBeGreaterThan(soundPriority('light-blade'));
    expect(soundPriority(SIGNATURE_CUE_IDS[0]!)).toBeLessThan(soundPriority('critical'));
    expect(soundPriority(COMPOSED_CUE_IDS[0]!)).toBe(soundPriority('light-blade'));
  });

  it('renders nothing where offline audio is unavailable', async () => {
    expect(await renderCue(SIGNATURE_CUE_IDS[0]!, 48000)).toBeNull();
  });
});

describe('sound marks', () => {
  const marksOf = (recipe: FxRecipe): readonly FxSoundMark[] => recipe.marks ?? [];

  it('sit on all 63 recipes and the 14 enemy attacks, and every mark resolves to a table cue at every weight', () => {
    expect(skills).toHaveLength(63);
    expect(listEnemyAttackWeapons()).toHaveLength(14);
    for (const recipe of [...skills, ...attacks]) {
      expect(marksOf(recipe).length, recipe.id).toBeGreaterThan(0);
      for (const mark of marksOf(recipe)) {
        for (const weight of WEIGHTS) expect(TABLE_CUE_IDS, `${recipe.id} at ${weight}`).toContain(markCue(mark, weight));
      }
    }
  });

  it('take their identity from the recipe: a replay of the same weight names the same cues', () => {
    for (const recipe of [...skills, ...attacks]) {
      for (const mark of marksOf(recipe)) expect(markCue(mark, 'm')).toBe(markCue(mark, 'm'));
      expect(Object.keys(marksOf(recipe)[0]!).every((key) => ['at', 'afterHit', 'gesture', 'element', 'cue'].includes(key)), recipe.id).toBe(true);
    }
  });

  it('give the twenty their charge, blow and wave, ending within the recipe plus half a second', () => {
    const flight = 0.8;
    for (const skill of SIGNATURE_SKILLS) {
      const recipe = skillFxRecipe(skill)!;
      const marks = marksOf(recipe);
      expect(marks.map((mark) => mark.cue), skill).toEqual(['charge', 'blow', 'wave'].map((part) => signatureId(skill, part as 'charge')));
      const hit = recipe.projectile ? flight : 0;
      for (const mark of marks) {
        const end = mark.at + (mark.afterHit ? hit : 0) + seconds(mark.cue!);
        expect(end, `${mark.cue}`).toBeLessThanOrEqual(recipe.duration + hit + 0.5);
      }
    }
  });

  it('put the blow of every other skill on its impact', () => {
    for (const recipe of skills.filter((r) => !SIGNATURE_SKILLS.includes(r.id))) {
      expect(marksOf(recipe)).toHaveLength(1);
      expect(marksOf(recipe)[0]!.at, recipe.id).toBe(recipe.impactAt);
      expect(marksOf(recipe)[0]!.afterHit ?? false, recipe.id).toBe(Boolean(recipe.projectile));
    }
  });

  it('map every shared recipe step to a table cue or to silence, and never name a result', () => {
    for (const id of COMBAT_SFX_IDS) {
      for (const weight of WEIGHTS) {
        const cue = sharedStepCue(id, weight);
        if (cue) expect(TABLE_CUE_IDS, id).toContain(cue);
      }
    }
    for (const id of ['hit', 'arrow_hit', 'magic_hit', 'crit', 'ko', 'explosion', 'impact_heavy']) expect(SHARED_STEP_IDS, id).not.toContain(id);
    const stepIds = new Set(listExplicitFxRecipes().flatMap((id) => resolveFxRecipe(id).steps.filter((step) => step.kind === 'sfx').map((step) => String(step.p?.id))));
    expect(stepIds.size).toBeGreaterThan(5);
  });
});
