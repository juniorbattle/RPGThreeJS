// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { dialogues } from '../../game/content';
import { ALARIC_AUDIENCE, AUDIENCE_ACTORS, AUDIENCE_GUARDS, audienceDepth, guardDepth } from './alaricAudience';
import { LIVING_BACKDROPS, LIVING_TABLEAUX, livingBackdropFits } from './livingTableaux';
import { LION_TRIAL_ROUTE_ENDING, SERPENT_ROUTE_ENDING, SERPENT_ENDING_ACTORS, TRIAL_ENDING_ACTORS } from './routeEndings';
import type { Walker } from './livingFigures';
import { readFileSync } from 'node:fs';

const livingCss = readFileSync('src/ui/living/living-tableau.css', 'utf8');

const seconds = (script: { shots: readonly { seconds: number }[] }) => script.shots.reduce((sum, shot) => sum + shot.seconds, 0);
const still = (walker: Walker) => walker.from[0] === walker.to[0] && walker.from[1] === walker.to[1];
const COMPANY_AND_ALARIC = new Set(['alaric', 'alistair', 'sage_seraphine', 'maelor']);

describe('Alaric audience script (set 1.14.0, OD-2026-11-04-B)', () => {
  it('lasts at most 30 seconds, on the audience tableau, before the briefing', () => {
    expect(ALARIC_AUDIENCE.id).toBe('alaric_audience_arrival');
    expect(seconds(ALARIC_AUDIENCE)).toBeLessThanOrEqual(30);
    for (const shot of ALARIC_AUDIENCE.shots) expect(shot.image).toContain('alaric-audience-tableau.png');
    expect(dialogues.has('lion_briefing')).toBe(true);
  });

  it('keeps the four narrative actors of the briefing, Alaric waiting in place, and a few far guards that never speak', () => {
    expect(AUDIENCE_ACTORS).toHaveLength(4);
    const speakers = new Set(dialogues.get('lion_briefing')!.steps.map((step) => step.actorId));
    for (const actor of AUDIENCE_ACTORS) expect(speakers.has(actor.id), actor.id).toBe(true);
    const alaric = AUDIENCE_ACTORS.find((actor) => actor.id === 'alaric')!;
    expect(still(alaric)).toBe(true);
    // The company walks in from the viewer and stops at the foot of the stairs, below the dais.
    for (const hero of AUDIENCE_ACTORS.filter((actor) => actor !== alaric)) {
      expect(hero.from[1]).toBeGreaterThan(941);
      expect(hero.to[1]).toBeGreaterThan(alaric.to[1]);
      expect(Math.sign(hero.to[0] - hero.from[0])).toBe(hero.facing === 'RIGHT' ? 1 : -1);
    }
    expect(AUDIENCE_GUARDS.length).toBeLessThanOrEqual(12);
    for (const guard of AUDIENCE_GUARDS) {
      expect(speakers.has(guard.id)).toBe(false);
      expect(guard.from).toEqual(guard.to);
      // Far off: smaller than anyone of the company where they stop.
      expect(guardDepth(guard.to[1])).toBeLessThan(Math.min(...AUDIENCE_ACTORS.filter((a) => a !== alaric).map((a) => audienceDepth(a.to[1]))));
    }
  });
});

describe('route ending scripts (set 1.14.0, OD-2026-11-04-B)', () => {
  it('last at most 40 seconds, each on the tableau of its aftermath dialogue', () => {
    expect(SERPENT_ROUTE_ENDING.id).toBe('serpent_route_ending');
    expect(LION_TRIAL_ROUTE_ENDING.id).toBe('lion_trial_route_ending');
    expect(seconds(SERPENT_ROUTE_ENDING)).toBeLessThanOrEqual(40);
    expect(seconds(LION_TRIAL_ROUTE_ENDING)).toBeLessThanOrEqual(40);
    for (const shot of SERPENT_ROUTE_ENDING.shots) expect(shot.image).toContain('serpent-finale-tableau-aftermath.png');
    for (const shot of LION_TRIAL_ROUTE_ENDING.shots) expect(shot.image).toContain('lion-trial-tableau-aftermath.png');
  });

  it('show the company standing still, without the champion and within four actors', () => {
    for (const actors of [SERPENT_ENDING_ACTORS, TRIAL_ENDING_ACTORS]) {
      expect(actors.length).toBeLessThanOrEqual(4);
      for (const actor of actors) {
        expect(COMPANY_AND_ALARIC.has(actor.id), actor.id).toBe(true);
        expect(still(actor), actor.id).toBe(true);
      }
    }
    expect([...SERPENT_ROUTE_ENDING.sheets, ...SERPENT_ROUTE_ENDING.portraits]).not.toContain('alaric');
    for (const script of [SERPENT_ROUTE_ENDING, LION_TRIAL_ROUTE_ENDING]) {
      expect([...script.sheets, ...script.portraits]).not.toContain('lion_champion');
      expect([...script.sheets, ...script.portraits]).not.toContain('serpent_general_boss');
    }
    // Alaric on the stairs, above the company on the mosaic.
    const alaric = TRIAL_ENDING_ACTORS.find((actor) => actor.id === 'alaric')!;
    for (const hero of TRIAL_ENDING_ACTORS.filter((actor) => actor !== alaric)) expect(hero.to[1]).toBeGreaterThan(alaric.to[1] + 150);
  });
});

describe('living tableau stacking', () => {
  it('shows a route ending over the aftermath stage still on screen (narrative stage at 9050)', () => {
    const rule = /\.living-tableau\s*\{[^}]*z-index:\s*(\d+)/.exec(livingCss);
    expect(Number(rule?.[1])).toBeGreaterThan(9050);
  });
});

describe('living backdrops of set 1.14.0', () => {
  it('keeps the briefing, both aftermath dialogues and the epilogue alive with a backdrop of their own tableau', () => {
    for (const [dialogue, tableau] of Object.entries({ lion_briefing: 'alaric_audience_arrival', serpent_general_aftermath: 'serpent_route_ending', lion_trial_aftermath: 'lion_trial_route_ending', epilogue: 'lion_judgement' })) {
      expect(LIVING_BACKDROPS[dialogue]).toBe(tableau);
      expect(LIVING_TABLEAUX[tableau]!.backdrop).toBeTypeOf('function');
    }
  });

  it('draws a backdrop only over the picture it was made for', () => {
    const at = (file: string) => `url("/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/${file}")`;
    expect(livingBackdropFits('serpent_general_aftermath', at('serpent-finale-tableau-aftermath.png'))).toBe(true);
    expect(livingBackdropFits('serpent_general_aftermath', at('lion-judgement-tableau.png'))).toBe(false);
    expect(livingBackdropFits('epilogue', at('lion-judgement-epilogue-tableau.png'))).toBe(true);
    expect(livingBackdropFits('epilogue', 'url("/assets/generated/lion-phase/dialogue/epilogue.webp")')).toBe(false);
    expect(livingBackdropFits('lion_trial_aftermath', '')).toBe(false);
    // The backdrops of set 1.13.0 keep their behaviour.
    expect(livingBackdropFits('village_choice', '')).toBe(true);
  });
});
