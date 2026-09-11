import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CIN6A_JOURNEY_TRIGGERS } from '../cinematics/Cin6aPresentation';

const GAME_APP = readFileSync(resolve(process.cwd(), 'src/game/GameApp.ts'), 'utf8');
const SESSION = readFileSync(resolve(process.cwd(), 'src/cinematics/CinematicDialogueSession.ts'), 'utf8');

function method(name: string): string {
  const start = GAME_APP.indexOf(name);
  expect(start, `missing ${name}`).toBeGreaterThan(-1);
  const next = GAME_APP.indexOf('\n  private ', start + name.length);
  return GAME_APP.slice(start, next === -1 ? GAME_APP.length : next);
}

describe('CIN-6.5 cinematic dialogue integration', () => {
  it('keeps the exact reviewed Journey before-dialogue pilots', () => {
    expect(CIN6A_JOURNEY_TRIGGERS.beforeDialogue).toEqual({
      lion_briefing: 'alaric_audience_arrival',
      village_choice: 'bois_clair_arrival',
      shadow_signs: 'shadow_signs',
      final_refuge: 'final_refuge_dossier',
    });
  });

  it('gives a mapped NarrativeStage dialogue an explicit video/hold owner', () => {
    const playDialogue = method('private async playDialogue');
    const narrativeDialogue = method('private async playNarrativeDialogue');
    expect(playDialogue).toContain("resolveVideoCinematicTrigger({ hook: 'beforeDialogue', dialogueId })");
    expect(playDialogue).toContain("resolveCin6aJourneyTrigger({ hook: 'beforeDialogue', dialogueId })");
    expect(playDialogue).toContain("resolveCin6cJourneyTrigger({ hook: 'beforeDialogue', dialogueId }, { flags: this.state.flags })");
    expect(playDialogue).toContain('await this.playNarrativeDialogue');
    expect(narrativeDialogue).toContain('resolveDialoguePresentation(sequence.id)');
    expect(narrativeDialogue).toContain("mode: 'narrative-stage'");
    expect(narrativeDialogue).toContain("presentationBeat?.mode === 'CINEMATIC_HOLD'");
    expect(narrativeDialogue).toContain('await stage.presentCinematicBeat(videoBeat');
    expect(narrativeDialogue).toContain('await stage.enterCinematicHold(presentationBeat');
    expect(narrativeDialogue).toContain("presentationBeat?.mode === 'STATIC_TABLEAU'");
    expect(method('private async playClassicDialogue')).not.toContain('resolveCin6aJourneyTrigger');
  });

  it('leaves non-Journey and unmapped dialogue on the classic interlude path', () => {
    const playDialogue = method('private async playDialogue');
    expect(playDialogue).toContain("this.cinematicInterlude({ hook: 'beforeDialogue', dialogueId })");
    expect(method('private async playClassicDialogue')).toContain("variant: 'dialogue'");
    expect(method('private async playClassicDialogue')).toContain('this.dialogue.play(sequence)');
  });

  it('keeps the presentation coordinator free of game truth and mutation', () => {
    expect(SESSION).not.toMatch(/GameState|state\.|flags|enterRunNode|startCombat|applyEffects|finishChapter|save/i);
    expect(SESSION).toContain('finally');
    expect(SESSION).toContain('held.release()');
  });

  it('keeps the 21 approved IDs and adds the eleven CIN-6C production IDs', () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'public/assets/cinematics/manifest.json'), 'utf8'));
    const ids = manifest.cinematics.map((entry: { id: string }) => entry.id);
    expect(ids).toHaveLength(32);
    expect(new Set(ids).size).toBe(32);
    expect(manifest.cinematics.find((entry: { id: string }) => entry.id === 'camp_departure')?.durationMs).toBe(12_000);
    expect(manifest.cinematics.find((entry: { id: string }) => entry.id === 'alaric_audience_arrival')?.durationMs).toBe(12_000);
    expect(manifest.cinematics.find((entry: { id: string }) => entry.id === 'valmir_route_fork')?.durationMs).toBe(10_000);
    const campMedia = readFileSync(resolve(process.cwd(), 'public/assets/cinematics/camp_departure.mp4'));
    expect(createHash('sha256').update(campMedia).digest('hex')).toBe('a56678969bfb319d503be1f3f406ca2a3bef1a11bebc07db78c6fb22e6b9c0f3');
    const audienceMedia = readFileSync(resolve(process.cwd(), 'public/assets/cinematics/alaric_audience_arrival.mp4'));
    expect(createHash('sha256').update(audienceMedia).digest('hex')).toBe('b823180582228dc2dd08592926efeb8ec58bc40bc102e238577361eac1dcb629');
    const valmirMedia = readFileSync(resolve(process.cwd(), 'public/assets/cinematics/valmir_route_fork.mp4'));
    expect(createHash('sha256').update(valmirMedia).digest('hex')).toBe('63a4a0c3793d6e29ce8fd94b1478dfab59e40f856d53a01915e47fb9a6343261');

    const spec = JSON.parse(readFileSync(resolve(process.cwd(), 'tools/cinematics/specs/cin6a/camp_departure.json'), 'utf8'));
    expect(spec.promptVersion).toBe('cin66-final-camp-v3');
    expect(spec.shots.map((shot: { durationSeconds: number }) => shot.durationSeconds)).toEqual([6, 6]);
    expect(spec.shots.flatMap((shot: { characters: Array<{ heightPx?: number }> }) => shot.characters).every((character: { heightPx?: number }) => character.heightPx === undefined)).toBe(true);
    expect(spec.shots.every((shot: { source: { integration?: { method?: string } } }) => shot.source.integration?.method === 'OPENAI_BUILT_IN_IMAGE_GEN_EDIT')).toBe(true);
    expect(spec.shots[1].characters[0].action).toBe('SHIFT_STANCE');
    expect(spec.shots[1].camera.mode).toBe('TRACK_SMALL_RIGHT');
  });
});
