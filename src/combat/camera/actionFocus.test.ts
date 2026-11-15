import { describe, expect, it } from 'vitest';
import { BASIC_FOCUS, actionFocusLevel, resolveActionFocus, type ActionFocusInput } from './actionFocus';

const attack: ActionFocusInput = { attack: true };
const heroSkill: ActionFocusInput = { skill: true };
const heroUltimate: ActionFocusInput = { skill: true, ultimate: true };
const eliteSkill: ActionFocusInput = { skill: true, actorElite: true };
const bossSkill: ActionFocusInput = { skill: true, actorBoss: true };
const bossSignature: ActionFocusInput = { skill: true, signature: true, actorBoss: true };
const furyStrike: ActionFocusInput = { attack: true, fury: true, actorBoss: true };

describe('graded action focus', () => {
  it('grades weapon attacks, skills, elite and boss skills, Ultimates and signatures', () => {
    expect(actionFocusLevel(attack)).toBe('basic');
    expect(actionFocusLevel({})).toBe('basic'); // an item
    expect(actionFocusLevel(heroSkill)).toBe('skill');
    expect(actionFocusLevel(eliteSkill)).toBe('marked');
    expect(actionFocusLevel(bossSkill)).toBe('marked');
    expect(actionFocusLevel(furyStrike)).toBe('marked');
    expect(actionFocusLevel({ attack: true, fury: true, actorElite: true })).toBe('marked');
    expect(actionFocusLevel(heroUltimate)).toBe('spotlight');
    expect(actionFocusLevel(bossSignature)).toBe('spotlight');
    // an elite casting a boss signature gets the spotlight, as today
    expect(actionFocusLevel({ skill: true, signature: true, actorElite: true })).toBe('spotlight');
    expect(actionFocusLevel({ forceSpotlight: true })).toBe('spotlight');
  });

  it('leaves the plain attacks of bosses and elites as they are', () => {
    expect(actionFocusLevel({ attack: true, actorBoss: true })).toBe('basic');
    expect(actionFocusLevel({ attack: true, actorElite: true })).toBe('basic');
  });

  it('keeps the weapon attack push-in exactly as before', () => {
    expect(resolveActionFocus(attack)).toMatchObject({ kind: 'action', moveCamera: true, enterSeconds: 0.32, releaseSeconds: 0.32, exitSeconds: 0.45, ease: 'cubic', vignette: null, arenaDim: null });
    expect(resolveActionFocus({ ...attack, multiTarget: true }).kind).toBe('aoe');
    expect(resolveActionFocus({ ...attack, reduced: true })).toMatchObject({ moveCamera: false, releaseSeconds: 0.2, exitSeconds: 0.45 });
  });

  it('never makes an action wait longer than the push-in it replaces', () => {
    for (const input of [attack, heroSkill, eliteSkill, bossSkill, furyStrike]) {
      for (const reduced of [false, true]) {
        const plan = resolveActionFocus({ ...input, reduced });
        expect(plan.releaseSeconds).toBeLessThanOrEqual(BASIC_FOCUS.enterSeconds);
        expect(plan.releaseSeconds).toBeLessThanOrEqual(plan.enterSeconds);
        // the return lasts at most 0.1 s longer than today's 0.45 s
        expect(plan.exitSeconds).toBeLessThanOrEqual(BASIC_FOCUS.exitSeconds + 0.1 + 1e-9);
      }
    }
  });

  it('eases skills in and out more softly and longer than attacks, the marked focus most', () => {
    const basic = resolveActionFocus(attack), skill = resolveActionFocus(heroSkill), marked = resolveActionFocus(bossSkill);
    expect(skill).toMatchObject({ kind: 'skill', ease: 'sine', vignette: null, arenaDim: null });
    expect(marked).toMatchObject({ kind: 'focus', ease: 'sine' });
    expect(skill.enterSeconds).toBeGreaterThan(basic.enterSeconds);
    expect(marked.enterSeconds).toBeGreaterThan(skill.enterSeconds);
    expect(marked.vignette).toBeGreaterThan(1.04);
    expect(marked.arenaDim).toBeLessThan(1);
    expect(marked.arenaDim).toBeGreaterThan(0.42); // lighter than the spotlight's dimmed arena
  });

  it('frames the whole area of a multi-target skill', () => {
    expect(resolveActionFocus({ ...heroSkill, multiTarget: true }).kind).toBe('aoe');
    expect(resolveActionFocus({ ...bossSkill, multiTarget: true })).toMatchObject({ kind: 'aoe', level: 'marked' });
  });

  it('never moves the camera under reduced motion and keeps the reduced beats', () => {
    for (const input of [attack, heroSkill, eliteSkill, bossSkill, furyStrike, heroUltimate, bossSignature]) {
      const plan = resolveActionFocus({ ...input, reduced: true });
      expect(plan.moveCamera).toBe(false);
    }
    expect(resolveActionFocus({ ...heroSkill, reduced: true })).toMatchObject({ releaseSeconds: 0.2, exitSeconds: 0.45 });
    // the marked focus keeps its light (the "projecteur"), not its motion
    expect(resolveActionFocus({ ...bossSkill, reduced: true })).toMatchObject({ moveCamera: false, vignette: 1.4, arenaDim: 0.8, releaseSeconds: 0.2, exitSeconds: 0.45 });
    expect(resolveActionFocus({ ...bossSignature, reduced: true })).toMatchObject({ kind: 'spotlight', moveCamera: false, releaseSeconds: 0.3, exitSeconds: 0.6 });
  });

  it('keeps the spotlight timings', () => {
    expect(resolveActionFocus(heroUltimate)).toMatchObject({ kind: 'spotlight', moveCamera: true, enterSeconds: 0.5, exitSeconds: 0.6, ease: 'cubic' });
  });
});
