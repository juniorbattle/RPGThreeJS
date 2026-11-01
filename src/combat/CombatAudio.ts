import { z } from 'zod';
import { TACTICAL_SOUND_IDS, type CombatSoundId } from '../ui/GameSoundCatalog';

/** Presentation messages carry no writable unit, combat result or resource payload. */
export const combatAudioMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('rpg-threejs:combat-sound'), sessionId: z.string().max(80), id: z.enum(TACTICAL_SOUND_IDS), eventId: z.string().regex(/^[\w:.-]{1,160}$/) }).strict(),
  z.object({ type: z.literal('rpg-threejs:combat-sound-settings'), sessionId: z.string().max(80) }).strict(),
  z.object({ type: z.literal('rpg-threejs:combat-music-level'), sessionId: z.string().max(80), level: z.enum(['reflection', 'action']) }).strict(),
  z.object({ type: z.literal('rpg-threejs:combat-music-outcome'), sessionId: z.string().max(80), outcome: z.enum(['victory', 'defeat']) }).strict(),
]);
export class CombatAudioEmitter {
  private sessionId: string | null = null;
  private serial = 0;
  constructor(private readonly send: (message: unknown) => void) {}
  initialize(sessionId?: string): void { this.sessionId = sessionId ?? null; }
  cue(id: string, key?: string): void {
    if (!this.sessionId) return;
    try { this.send({ type: 'rpg-threejs:combat-sound', sessionId: this.sessionId, id, eventId: key ?? `event:${++this.serial}` }); } catch { /* optional presentation */ }
  }
  settings(): void {
    if (!this.sessionId) return;
    try { this.send({ type: 'rpg-threejs:combat-sound-settings', sessionId: this.sessionId }); } catch { /* optional presentation */ }
  }
  /** Where an action's presentation starts and ends: no unit, skill, target, number or result. */
  level(level: 'reflection' | 'action'): void {
    if (!this.sessionId) return;
    try { this.send({ type: 'rpg-threejs:combat-music-level', sessionId: this.sessionId, level }); } catch { /* optional presentation */ }
  }
  /** Once, when the result card is shown; never on a skirmish wave clear. */
  outcome(outcome: 'victory' | 'defeat'): void {
    if (!this.sessionId) return;
    try { this.send({ type: 'rpg-threejs:combat-music-outcome', sessionId: this.sessionId, outcome }); } catch { /* optional presentation */ }
  }
  dispose(): void { this.sessionId = null; }
}

/** The launch family of an action. Skills carry no weapon type: their motion preset says how heavy the gesture is. */
export function combatLaunchSound(spec: { key?: string; type?: string; weaponType?: string; support?: boolean; heal?: boolean; revive?: boolean; cure?: boolean }, motion?: string): CombatSoundId | null {
  if (spec.support || spec.heal || spec.revive || spec.cure || spec.type === 'move' || spec.type === 'buff') return null;
  if (spec.type === 'mag' || spec.type === 'debuff') return 'magic-cast';
  if (spec.key === 'a_precise_shot' || spec.weaponType === 'longbow' || spec.weaponType === 'shuriken') return 'bow-release';
  if (spec.weaponType === 'long_spear' || spec.key?.startsWith('l_')) return 'thrust';
  if (spec.weaponType === 'greatsword' || spec.weaponType === 'holy_mace' || spec.weaponType === 'scythe' || spec.weaponType === 'hand_cannon' || spec.key === 'w_break_guard' || spec.key?.startsWith('ar_')) return 'heavy-weapon';
  if (motion === 'ranged_attack') return 'bow-release';
  if (motion === 'melee_heavy' || motion === 'self_aoe') return 'heavy-weapon';
  return 'light-blade';
}
