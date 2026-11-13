// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInitialState } from '../../game/store';
import { resolvePostDemoDialogue } from '../../game/postDemoContent';
import { resolvePixelSheet } from '../../combat/pixel/PixelSpriteSheets';
import { resolveCharacterVisualProfile } from '../../render/CharacterVisualRegistry';
import { POST_DEMO_MOMENTS, POST_DEMO_PROVISIONAL_SCENES, postDemoMomentImage } from '../../campaign/plateaux/postDemoPresentation';
import { LIVING_TABLEAUX } from './livingTableaux';
import { POST_DEMO_LIVING_BACKDROPS, POST_DEMO_LIVING_TABLEAUX } from './postDemoLiving';
import { CHIEF_STATURE, POST_DEMO_FRAME, type MomentScript } from './postDemoScenes';

function webpSize(url: string): [number, number] {
  const bytes = readFileSync(join(process.cwd(), 'public', url));
  const kind = bytes.toString('ascii', 12, 16);
  if (kind === 'VP8X') return [1 + bytes.readUIntLE(24, 3), 1 + bytes.readUIntLE(27, 3)];
  if (kind === 'VP8L') { const bits = bytes.readUInt32LE(21); return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1]; }
  return [bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff];
}
const speakers = (id: string) => new Set(resolvePostDemoDialogue(id, createInitialState())!.steps.map((step) => step.actorId));
const isStill = (walker: { from: readonly number[]; to: readonly number[] }) => walker.from[0] === walker.to[0] && walker.from[1] === walker.to[1];
const scripts = () => Object.values(POST_DEMO_LIVING_TABLEAUX) as MomentScript[];
const momentOf = (id: string) => POST_DEMO_MOMENTS.find((moment) => moment.id === id)!;

const HEROES = { bear: 'marian', dragon: 'elara', scorpion: 'kestrel' } as const;
const CHIEFS = { bear: 'borin', dragon: 'kaelen', scorpion: 'grand_inquisitor' } as const;
const ADVERSARIES = ['raven_master_spy', 'shadow_shaman', 'shadow_prophet', 'maelor_traitor', 'serpent_champion', 'demon_champion', 'breach_entity'];

describe('the post-demo living tableaux (set 1.20.0, validated 2026-11-13)', () => {
  it('give every moment of the tables its script, none of them among the Lion’s seven', () => {
    expect(Object.keys(POST_DEMO_LIVING_TABLEAUX).sort()).toEqual(POST_DEMO_MOMENTS.map((moment) => moment.id).sort());
    for (const id of Object.keys(POST_DEMO_LIVING_TABLEAUX)) expect(Object.keys(LIVING_TABLEAUX)).not.toContain(id);
  });

  it('play within their length on their approved painting, at that painting’s size, with no caption', () => {
    for (const script of scripts()) {
      const moment = momentOf(script.id);
      expect(script.shots.reduce((sum, shot) => sum + shot.seconds, 0), script.id).toBeLessThanOrEqual(moment.maxSeconds);
      for (const shot of script.shots) {
        expect(shot.frame, script.id).toEqual(POST_DEMO_FRAME);
        expect(existsSync(join(process.cwd(), 'public', shot.image)), shot.image).toBe(true);
        expect(webpSize(shot.image), shot.image).toEqual([1536, 1024]);
      }
      expect(script.shots.at(-1)!.image, script.id).toBe(postDemoMomentImage(moment));
      expect(Object.keys(script)).not.toContain('lines');
    }
  });

  it('keep at most four narrative actors and twelve extras, every figure drawn from an existing sheet or portrait', () => {
    for (const script of scripts()) {
      expect(script.actors.length, script.id).toBeLessThanOrEqual(4);
      expect(script.extras.length, script.id).toBeLessThanOrEqual(12);
      for (const id of script.sheets) expect(resolvePixelSheet(id), `${script.id} ${id}`).toBeDefined();
      for (const id of script.portraits) expect(resolveCharacterVisualProfile(id), `${script.id} ${id}`).toBeDefined();
      for (const actor of script.actors) expect([...script.sheets, ...script.portraits], `${script.id} ${actor.id}`).toContain(actor.id);
      for (const id of [...script.sheets, ...script.portraits]) expect(ADVERSARIES, `${script.id} ${id}`).not.toContain(id);
    }
  });

  it('bring each plateau’s hero beside the advisers, the whole company in the final act', () => {
    for (const [plateau, hero] of Object.entries(HEROES)) {
      for (const script of scripts().filter((candidate) => candidate.id.startsWith(`${plateau}_`))) {
        const ids = script.actors.map((actor) => actor.id);
        expect(ids, script.id).toContain(hero);
        expect(ids, script.id).toEqual(expect.arrayContaining(['sage_seraphine', 'maelor']));
        expect(ids, script.id).not.toContain('alistair');
      }
    }
    for (const script of scripts().filter((candidate) => candidate.id.startsWith('finale_'))) {
      expect(script.actors.map((actor) => actor.id), script.id).toEqual(expect.arrayContaining(['alistair', 'sage_seraphine', 'kestrel']));
    }
  });

  it('show each arrival’s chief waiting in place and the company walking in from the viewer, all of them speakers of the audience', () => {
    for (const [plateau, chief] of Object.entries(CHIEFS)) {
      const script = POST_DEMO_LIVING_TABLEAUX[`${plateau}_arrival_moment`] as MomentScript;
      const audience = speakers(momentOf(script.id).beforeDialogueId);
      for (const actor of script.actors) expect(audience.has(actor.id), `${script.id} ${actor.id}`).toBe(true);
      const head = script.actors.find((actor) => actor.id === chief)!;
      expect(isStill(head)).toBe(true);
      expect(head.stature).toBe(CHIEF_STATURE);
      for (const hero of script.actors.filter((actor) => actor !== head)) {
        expect(hero.from[1], hero.id).toBeGreaterThan(1024);
        expect(hero.to[1], hero.id).toBeGreaterThan(head.to[1] + 100);
        expect(Math.abs(hero.to[0] - head.to[0]), hero.id).toBeGreaterThanOrEqual(140);
      }
      for (const extra of script.extras) {
        expect(audience.has(extra.id)).toBe(false);
        expect(extra.from).toEqual(extra.to);
        expect(script.scene.extras!.depth(extra.to[1])).toBeLessThan(Math.min(...script.actors.filter((actor) => actor !== head).map((actor) => script.scene.depth(actor.to[1]))));
      }
    }
  });

  it('show the outcomes still: the company alone after the hunt, the defeated chief before his hall after the trial', () => {
    for (const [plateau, chief] of Object.entries(CHIEFS)) {
      const honour = POST_DEMO_LIVING_TABLEAUX[`${plateau}_honour_moment`] as MomentScript;
      const force = POST_DEMO_LIVING_TABLEAUX[`${plateau}_force_moment`] as MomentScript;
      expect(honour.actors.map((actor) => actor.id)).not.toContain(chief);
      expect(force.actors.map((actor) => actor.id)).toContain(chief);
      for (const actor of [...honour.actors, ...force.actors]) expect(isStill(actor), actor.id).toBe(true);
      // The chief stands on his steps, above the company.
      const head = force.actors.find((actor) => actor.id === chief)!;
      for (const hero of force.actors.filter((actor) => actor !== head)) expect(hero.to[1]).toBeGreaterThan(head.to[1] + 150);
    }
  });

  it('end the betrayal in the arena before Maelor steps forward, and open each epilogue on the breach still open', () => {
    const betrayal = POST_DEMO_LIVING_TABLEAUX.finale_betrayal_moment as MomentScript;
    for (const shot of betrayal.shots) expect(shot.image).toBe(POST_DEMO_PROVISIONAL_SCENES.finale_pre_serpent_final!.image);
    expect([...betrayal.sheets, ...betrayal.portraits]).not.toContain('maelor');
    for (const id of ['finale_respect_moment', 'finale_fear_moment', 'finale_balance_moment']) {
      const epilogue = POST_DEMO_LIVING_TABLEAUX[id] as MomentScript;
      for (const shot of epilogue.shots) expect(shot.image, id).toBe(POST_DEMO_PROVISIONAL_SCENES.finale_act_end!.image);
      expect(epilogue.actors.map((actor) => actor.id), id).toEqual(['alistair', 'sage_seraphine', 'kestrel', 'marian']);
    }
  });

  it('keep each backdrop on the painting of its own dialogue', () => {
    expect(Object.keys(POST_DEMO_LIVING_BACKDROPS).sort()).toEqual([
      'bear_audience', 'bear_master_spy_aftermath', 'bear_trial_aftermath', 'dragon_audience', 'dragon_shaman_aftermath', 'dragon_trial_aftermath',
      'finale_betrayal', 'finale_epilogue_balance', 'finale_epilogue_fear', 'finale_epilogue_respect',
      'scorpion_audience', 'scorpion_prophet_aftermath', 'scorpion_trial_aftermath',
    ]);
    for (const [dialogueId, backdrop] of Object.entries(POST_DEMO_LIVING_BACKDROPS)) {
      expect(backdrop.image, dialogueId).toBe(POST_DEMO_PROVISIONAL_SCENES[dialogueId]!.image);
      expect(backdrop.frame).toEqual(POST_DEMO_FRAME);
      expect(backdrop.backdrop(), dialogueId).toBeTypeOf('function');
    }
  });
});
