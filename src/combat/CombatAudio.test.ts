import { expect, it, vi } from 'vitest';
import { CombatAudioEmitter, combatAudioMessageSchema, combatLaunchSound } from './CombatAudio';

it('relays allowlisted presentation only, with no source of gameplay truth', () => {
  const send = vi.fn(), audio = new CombatAudioEmitter(send);
  audio.cue('thrust'); audio.settings(); expect(send).not.toHaveBeenCalled();
  audio.initialize('session'); audio.cue('thrust', 'action-1:launch'); audio.settings();
  expect(combatAudioMessageSchema.safeParse(send.mock.calls[0]![0]).success).toBe(true);
  expect(combatAudioMessageSchema.safeParse({ ...send.mock.calls[0]![0], damage: 20 }).success).toBe(false);
  expect(combatAudioMessageSchema.safeParse({ ...send.mock.calls[0]![0], id: 'saved' }).success).toBe(false);
  expect(combatAudioMessageSchema.safeParse({ ...send.mock.calls[0]![0], eventId: 'x'.repeat(161) }).success).toBe(false);
  audio.dispose(); audio.cue('critical'); expect(send).toHaveBeenCalledTimes(2);
});
it('send failures cannot escape an action', () => {
  const audio = new CombatAudioEmitter(() => { throw Error('closed'); }); audio.initialize('s');
  expect(() => { audio.cue('miss'); audio.settings(); }).not.toThrow();
});
it('maps the initial six hero launch families without calculating a hit or a heal', () => {
  expect(combatLaunchSound({ key: 'w_break_guard', type: 'phys' })).toBe('heavy-weapon');
  expect(combatLaunchSound({ key: 'w_salvation', type: 'heal', support: true })).toBeNull();
  expect(combatLaunchSound({ key: 'n_dark_bolt', type: 'mag' })).toBe('magic-cast');
  expect(combatLaunchSound({ key: 'a_precise_shot', type: 'phys' })).toBe('bow-release');
  expect(combatLaunchSound({ key: 'ro_sneak_attack', type: 'phys', weaponType: 'dagger' })).toBe('light-blade');
  expect(combatLaunchSound({ key: 'l_long_thrust', type: 'phys' })).toBe('thrust');
});
