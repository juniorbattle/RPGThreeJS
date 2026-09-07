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

  it('gives a mapped Journey dialogue one exclusive held cinematic owner', () => {
    const playDialogue = method('private async playDialogue');
    expect(playDialogue).toContain("resolveCin6aJourneyTrigger({ hook: 'beforeDialogue', dialogueId })");
    expect(playDialogue).toContain('await presentCinematicDialogue({');
    expect(playDialogue).toContain("mode: 'cinematic-overlay'");
    expect(playDialogue).toContain('openFallbackDialogue: () => this.playClassicDialogue(sequence, fallbackLabel)');
    expect(playDialogue.match(/presentCinematicDialogue\(/g)).toHaveLength(1);
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

  it('keeps 21 manifest IDs while locking the approved camp departure remaster', () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'public/assets/cinematics/manifest.json'), 'utf8'));
    const ids = manifest.cinematics.map((entry: { id: string }) => entry.id);
    expect(ids).toHaveLength(21);
    expect(new Set(ids).size).toBe(21);
    expect(manifest.cinematics.find((entry: { id: string }) => entry.id === 'camp_departure')?.durationMs).toBe(12_000);
    const media = readFileSync(resolve(process.cwd(), 'public/assets/cinematics/camp_departure.mp4'));
    expect(createHash('sha256').update(media).digest('hex')).toBe('5ccf6e4e5156831ab10c992ee4af59a5bc5a28093df690b737a3eed441469463');

    const spec = JSON.parse(readFileSync(resolve(process.cwd(), 'tools/cinematics/specs/cin6a/camp_departure.json'), 'utf8'));
    expect(spec.promptVersion).toBe('cin6.5-remaster-v1');
    expect(spec.shots.map((shot: { durationSeconds: number }) => shot.durationSeconds)).toEqual([6, 6]);
    expect(spec.shots[0].characters.map((character: { heightPx: number }) => character.heightPx)).toEqual([650, 610]);
    expect(spec.shots[1].characters.map((character: { heightPx: number }) => character.heightPx)).toEqual([650, 610]);
    expect(spec.shots[1].camera.mode).toBe('TRACK_SMALL_RIGHT');
  });
});
