// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dialogues } from '../../game/content';
import { ARRIVAL_ACTORS, ARRIVAL_EXTRAS, BOIS_CLAIR_ARRIVAL } from './boisClairArrival';
import { LivingTableauPlayer, type LivingScript } from './LivingTableauPlayer';

/** Pictures that load at once, except those whose address says they are missing. */
class TestImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 16;
  naturalHeight = 16;
  set src(value: string) { queueMicrotask(() => (value.includes('missing') ? this.onerror?.() : this.onload?.())); }
}

function play(script: LivingScript = BOIS_CLAIR_ARRIVAL, options: { reducedMotion?: boolean } = {}) {
  const root = document.createElement('div');
  document.body.append(root);
  const player = new LivingTableauPlayer(root);
  const done = player.open(script, options);
  const element = root.querySelector<HTMLElement>('.living-tableau')!;
  return { root, player, element, done };
}
const press = (key: string) => document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('Bois-Clair arrival script (set 1.13.0, OD-2026-11-04-A)', () => {
  it('lasts at most 30 seconds, on the burning tableau, and names its moment by the dialogue it precedes', () => {
    expect(BOIS_CLAIR_ARRIVAL.id).toBe('bois_clair_arrival');
    expect(BOIS_CLAIR_ARRIVAL.shots.reduce((sum, shot) => sum + shot.seconds, 0)).toBeLessThanOrEqual(30);
    for (const shot of BOIS_CLAIR_ARRIVAL.shots) expect(shot.image).toContain('bois-clair-tableau-burning.png');
    expect(dialogues.has('village_choice')).toBe(true);
  });

  it('keeps four narrative actors from the dialogue that follows, and at most twelve extras that never speak', () => {
    expect(ARRIVAL_ACTORS).toHaveLength(4);
    const speakers = new Set(dialogues.get('village_choice')!.steps.map(step => step.actorId));
    for (const actor of ARRIVAL_ACTORS) expect(speakers.has(actor.id), actor.id).toBe(true);
    for (const extras of Object.values(ARRIVAL_EXTRAS)) expect(extras.length).toBeLessThanOrEqual(12);
    expect(BOIS_CLAIR_ARRIVAL.sheets).not.toContain('villageoise');
    expect(BOIS_CLAIR_ARRIVAL.portraits).toEqual(['villageoise']);
  });

  it('shows the company coming in and the villager stepping out, with no gesture before her line', () => {
    const villager = ARRIVAL_ACTORS.find(actor => actor.id === 'villageoise')!;
    const heroes = ARRIVAL_ACTORS.filter(actor => actor !== villager);
    // The heroes are on the square, facing her, before she steps out.
    for (const hero of heroes) {
      expect(hero.facing).toBe('LEFT');
      expect(hero.at + Math.hypot(hero.to[0] - hero.from[0], hero.to[1] - hero.from[1]) / hero.speed).toBeLessThan(villager.at + 0.5);
      expect(hero.to[0]).toBeGreaterThan(villager.to[0]);
    }
    expect(villager.facing).toBe('RIGHT');
    // A few steps only: she does not run.
    expect(Math.hypot(villager.to[0] - villager.from[0], villager.to[1] - villager.from[1])).toBeLessThanOrEqual(160);
  });
});

describe('living tableau player', () => {
  it('has no caption: Passer is its only text', () => {
    const { element } = play();
    expect(element.textContent?.replace(/\s+/g, ' ').trim()).toBe('Passer');
    expect(element.getAttribute('aria-label')).toBe('Arrivée à Bois-Clair');
  });

  it('moves to the next shot on a click or Enter, then settles as played after the last one', async () => {
    const { player, element, done } = play();
    player.start();
    expect(element.dataset.shot).toBe('arrival_village');
    element.click();
    expect(element.dataset.shot).toBe('arrival_square');
    press('Enter');
    await expect(done).resolves.toBe('played');
    expect(element.classList.contains('is-leaving')).toBe(true);
  });

  it('leaves at once on Escape or Passer, as skipped', async () => {
    const escape = play();
    escape.player.start();
    press('Escape');
    await expect(escape.done).resolves.toBe('skipped');
    document.body.replaceChildren();
    const skip = play();
    skip.player.start();
    skip.element.querySelector<HTMLButtonElement>('[data-skip]')!.click();
    await expect(skip.done).resolves.toBe('skipped');
  });

  it('never shows a sequence whose picture is missing: the dialogue opens as it would without it', async () => {
    vi.stubGlobal('Image', TestImage);
    const script: LivingScript = { ...BOIS_CLAIR_ARRIVAL, shots: BOIS_CLAIR_ARRIVAL.shots.map(shot => ({ ...shot, image: '/missing.png' })) };
    const { player, done } = play(script);
    await player.ready;
    player.start();
    await expect(done).resolves.toBe('missing');
  });

  it('follows reduced motion from the game or the system', () => {
    expect(play(BOIS_CLAIR_ARRIVAL, { reducedMotion: true }).element.dataset.reducedMotion).toBe('true');
  });

  it('closing settles the sequence and leaves nothing behind', async () => {
    const { player, root, done } = play();
    player.start();
    player.close();
    await expect(done).resolves.toBe('skipped');
    expect(root.querySelector('.living-tableau')).toBeNull();
  });
});
