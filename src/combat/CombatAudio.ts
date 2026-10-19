import { z } from 'zod';
import { TACTICAL_SOUND_IDS, type TacticalSoundId, type CombatSoundId } from '../ui/GameSoundCatalog';

/** Presentation messages carry no writable unit, combat result or resource payload. */
export const combatAudioMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('rpg-threejs:combat-sound'), sessionId: z.string().max(80), id: z.enum(TACTICAL_SOUND_IDS), eventId: z.string().regex(/^[\w:.-]{1,160}$/) }).strict(),
  z.object({ type: z.literal('rpg-threejs:combat-sound-settings'), sessionId: z.string().max(80) }).strict(),
]);
export class CombatAudioEmitter {
  private sessionId: string | null = null;
  private serial = 0;
  constructor(private readonly send: (message: unknown) => void) {}
  initialize(sessionId?: string): void { this.sessionId = sessionId ?? null; }
  cue(id: TacticalSoundId, key?: string): void {
    if (!this.sessionId) return;
    try { this.send({ type: 'rpg-threejs:combat-sound', sessionId: this.sessionId, id, eventId: key ?? `event:${++this.serial}` }); } catch { /* optional presentation */ }
  }
  settings(): void {
    if (!this.sessionId) return;
    try { this.send({ type: 'rpg-threejs:combat-sound-settings', sessionId: this.sessionId }); } catch { /* optional presentation */ }
  }
  dispose(): void { this.sessionId = null; }
}

export function combatLaunchSound(spec: { key?: string; type?: string; weaponType?: string; support?: boolean; heal?: boolean; revive?: boolean; cure?: boolean }): CombatSoundId | null {
  if (spec.support || spec.heal || spec.revive || spec.cure || spec.type === 'move') return null;
  if (spec.type === 'mag' || spec.type === 'debuff') return 'magic-cast';
  if (spec.key === 'a_precise_shot' || spec.weaponType === 'longbow' || spec.weaponType === 'shuriken') return 'bow-release';
  if (spec.weaponType === 'long_spear' || spec.key === 'l_long_thrust') return 'thrust';
  if (spec.weaponType === 'greatsword' || spec.weaponType === 'holy_mace' || spec.weaponType === 'scythe' || spec.key === 'w_break_guard') return 'heavy-weapon';
  return 'light-blade';
}
