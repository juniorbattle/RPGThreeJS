// @vitest-environment happy-dom
/**
 * Set 1.24.0 (PRESENTATION_AND_MEDIA « Tableau extras », AUTHORING_AND_QA « Tableau extras evidence », OD-2026-11-13-G):
 * the silent extras of the ordinary dialogue tableaux. Each dressed dialogue exists, stays within the cap with its own
 * part's civilian masters, names the painting its tableau shows, and the surface adds no actor, focus or text; reduced
 * motion keeps only those who stand.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dialogues } from '../game/content';
import { resolveGameDialogue } from '../game/contextualDialogueContent';
import { builtPlateauScenes, POST_DEMO_DIALOGUES } from '../game/postDemoContent';
import { createInitialState } from '../game/store';
import type { DialogueSequence } from '../game/types';
import { applyFinalDialoguePresentationPlan } from './DialoguePresentationSegments';
import { NarrativeSceneSurface } from './NarrativeSceneSurface';
import { resolveNarrativeDialogueTableau, type NarrativeTableauSpec } from './NarrativeTableau';
import { TABLEAU_EXTRA_SPRITES, TABLEAU_EXTRAS, TABLEAU_EXTRAS_CAP, tableauExtrasFor, type TableauExtrasPart } from './TableauExtras';

/** The fifteen dialogues the operator approved by id (OD-2026-11-13-G); adding one asks the operator first. */
const APPROVED: Readonly<Record<TableauExtrasPart, readonly string[]>> = {
  lion: ['refugee_trial', 'village_choice', 'ate_village_fear', 'rep_event_bois_clair_denunciation', 'rep_event_village_memorial_request',
    'ate_bois_clair_night_watch', 'village_defense_aftermath', 'village_raid_aftermath', 'witnesses_on_road'],
  bear: ['bear_miners_testimony', 'bear_mines_defense_aftermath'],
  dragon: ['dragon_terrorized_village', 'dragon_freed_pilgrims'],
  scorpion: ['scorpion_phoenix_faithful', 'scorpion_temple_witnesses'],
  finale: [],
};

/** Scenes whose own lines keep the place empty or count its people: never dressed. */
const KEPT_BARE = ['bear_arrival', 'bear_vigil', 'dragon_vigil', 'scorpion_vigil', 'finale_last_vigil', 'bear_trapped_miners',
  'finale_trapped_citizens', 'first_refuge_gathering', 'ate_first_refuge_watch'];

function allSequences(): Map<string, DialogueSequence> {
  const state = createInitialState();
  const all = new Map<string, DialogueSequence>();
  for (const id of dialogues.keys()) {
    const sequence = resolveGameDialogue(id, state)?.sequence;
    if (sequence) all.set(sequence.id, sequence);
  }
  for (const sequence of POST_DEMO_DIALOGUES.values()) all.set(sequence.id, sequence);
  for (const chapter of ['bear', 'dragon', 'scorpion', 'finale'] as const) for (const sequence of builtPlateauScenes(chapter, [state])) all.set(sequence.id, sequence);
  return all;
}

function stagedTableau(sequence: DialogueSequence): NarrativeTableauSpec {
  return applyFinalDialoguePresentationPlan(sequence, resolveNarrativeDialogueTableau(sequence.id, sequence)!);
}

describe('the silent extras of the ordinary tableaux (set 1.24.0)', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('dresses exactly the dialogues the operator approved, and none that keeps its place empty', () => {
    expect(Object.keys(TABLEAU_EXTRAS).sort()).toEqual(Object.values(APPROVED).flat().sort());
    for (const [part, ids] of Object.entries(APPROVED)) for (const id of ids) expect(TABLEAU_EXTRAS[id]!.part, id).toBe(part);
    for (const id of KEPT_BARE) expect(TABLEAU_EXTRAS[id], id).toBeUndefined();
  });

  it('gives each dressed dialogue at most twelve extras from its own part’s civilian masters, inside its painting', () => {
    const all = allSequences();
    for (const [id, entry] of Object.entries(TABLEAU_EXTRAS)) {
      const sequence = all.get(id);
      expect(sequence, id).toBeDefined();
      if (entry.part === 'lion') expect(dialogues.has(id), id).toBe(true);
      else expect(id.startsWith(`${entry.part}_`), id).toBe(true);
      expect(entry.extras.length, id).toBeGreaterThan(0);
      expect(entry.extras.length, id).toBeLessThanOrEqual(TABLEAU_EXTRAS_CAP);
      // The painting the extras were placed on is the one the dialogue's tableau shows.
      expect(stagedTableau(sequence!).stillImage ?? '', id).toContain(entry.image);
      for (const extra of entry.extras) {
        const sprite = TABLEAU_EXTRA_SPRITES[entry.part][extra.id];
        expect(sprite, `${id}:${extra.id}`).toBeDefined();
        expect(existsSync(resolve('public', sprite!.slice(1))), sprite).toBe(true);
        expect(extra.x).toBeGreaterThan(0);
        expect(extra.x).toBeLessThan(entry.frame.width);
        expect(extra.y).toBeGreaterThan(0);
        expect(extra.y).toBeLessThan(entry.frame.height);
        expect(extra.size).toBeGreaterThan(0);
        if (extra.pass) expect(extra.pass.seconds).toBeGreaterThan(0);
      }
      // The surface finds the extras by the tableau's dialogue id.
      expect(stagedTableau(sequence!).dialogueId, id).toBe(id);
      // In the Lion, where each civilian has a sprite of their own, an extra never repeats one of the speakers. A plateau
      // has one civilian sprite only: its extras are the speaking witness's companions, as the approved list says.
      const speakers = new Set(sequence!.steps.map((step) => step.actorId).filter(Boolean));
      if (entry.part === 'lion') for (const extra of entry.extras) expect(speakers.has(extra.id), `${id}:${extra.id}`).toBe(false);
    }
  });

  it('keeps the civilian masters to civilians: no combatant, no named character', () => {
    const ids = Object.values(TABLEAU_EXTRA_SPRITES).flatMap((sprites) => Object.keys(sprites));
    expect(ids.sort()).toEqual(['bear_miner', 'dragon_pilgrim', 'dragon_villager', 'finale_citizen', 'finale_civilian', 'phoenix_captive', 'phoenix_faithful',
      'refugee', 'refugee_mother', 'survivor', 'villageois', 'villageoise', 'wounded_merchant'].sort());
  });

  it('shows extras only over the painting they were placed on', () => {
    const entry = TABLEAU_EXTRAS.village_choice!;
    expect(tableauExtrasFor('village_choice', `url("/assets/generated/${entry.image}")`)).toBe(entry);
    expect(tableauExtrasFor('village_choice', 'url("/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/forest-road-tableau.png")')).toBeUndefined();
    expect(tableauExtrasFor('village_choice', undefined)).toBeUndefined();
    expect(tableauExtrasFor('camp_departure', `url("/assets/generated/${entry.image}")`)).toBeUndefined();
  });

  it('draws them behind the cast, as scenery: no actor, focus, text or accessible content', async () => {
    vi.useFakeTimers();
    vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue(undefined);
    const sequence = allSequences().get('village_choice')!;
    const tableau = stagedTableau(sequence);
    const surface = new NarrativeSceneSurface(document.createElement('div'), tableau);
    surface.bindDialogue(sequence);
    surface.mount(tableau.stillImage);
    await vi.runAllTimersAsync();
    const extras = [...surface.element.querySelectorAll<HTMLElement>('.narrative-extra')];
    expect(extras).toHaveLength(TABLEAU_EXTRAS.village_choice!.extras.length);
    expect(surface.extrasLayer.parentElement).toBe(surface.environmentLayer);
    expect(surface.extrasLayer.getAttribute('aria-hidden')).toBe('true');
    expect(surface.element.dataset.tableauExtras).toBe(`${extras.length}`);
    for (const extra of extras) {
      expect(surface.castLayer.contains(extra)).toBe(false);
      expect(extra.dataset.actorId).toBeUndefined();
      expect(extra.classList.contains('narrative-cast__actor')).toBe(false);
      expect(extra.textContent).toBe('');
      expect(extra.querySelector('img')!.alt).toBe('');
      expect(extra.tabIndex).toBe(-1);
    }
    // The cast is exactly the phase's staged actors: four at most, none of them an extra.
    const actors = [...surface.castLayer.querySelectorAll<HTMLElement>('.narrative-cast__actor')];
    expect(actors.length).toBeLessThanOrEqual(4);
    expect(actors.map((actor) => actor.dataset.actorId)).toEqual(tableau.phases![0]!.staticCast.map((actor) => actor.actorId));
    // A missing master leaves its place empty.
    extras[0]!.querySelector('img')!.dispatchEvent(new Event('error'));
    expect(extras[0]!.hidden).toBe(true);
    surface.dispose();
    expect(surface.element.isConnected).toBe(false);
  });

  it('keeps no extras over another picture, and none in a dialogue that is not dressed', async () => {
    vi.useFakeTimers();
    vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue(undefined);
    const all = allSequences();
    const dressed = stagedTableau(all.get('village_choice')!);
    const elsewhere = new NarrativeSceneSurface(document.createElement('div'), dressed);
    elsewhere.mount('/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/forest-road-tableau.png');
    await vi.runAllTimersAsync();
    expect(elsewhere.element.querySelector('.narrative-scene-surface__extras')).toBeNull();
    expect(elsewhere.element.dataset.tableauExtras).toBeUndefined();
    const bare = stagedTableau(all.get('bear_vigil')!);
    const vigil = new NarrativeSceneSurface(document.createElement('div'), bare);
    vigil.mount(bare.stillImage);
    await vi.runAllTimersAsync();
    expect(vigil.element.querySelector('.narrative-extra')).toBeNull();
  });

  it('under reduced motion keeps those who stand, still, and removes those who pass', async () => {
    vi.useFakeTimers();
    vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue(undefined);
    const entry = TABLEAU_EXTRAS.refugee_trial!;
    const standing = entry.extras.filter((extra) => !extra.pass).length;
    expect(standing).toBeGreaterThan(0);
    expect(standing).toBeLessThan(entry.extras.length);
    const tableau = stagedTableau(allSequences().get('refugee_trial')!);
    for (const reducedMotion of [false, true]) {
      const surface = new NarrativeSceneSurface(document.createElement('div'), tableau, { reducedMotion });
      surface.mount(tableau.stillImage);
      await vi.runAllTimersAsync();
      const extras = [...surface.element.querySelectorAll<HTMLElement>('.narrative-extra')];
      expect(extras).toHaveLength(reducedMotion ? standing : entry.extras.length);
      if (reducedMotion) expect(extras.every((extra) => extra.dataset.extraMotion === 'standing')).toBe(true);
      else expect(extras.some((extra) => extra.dataset.extraMotion === 'passing')).toBe(true);
      expect(surface.element.dataset.reducedMotion).toBe(String(reducedMotion));
    }
  });
});
