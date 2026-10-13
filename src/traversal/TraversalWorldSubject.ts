import type { GameState } from '../game/types';
import { resolveCharacterUnitId } from '../render/CharacterVisualRegistry';
import type { TraversalRouteBeat } from './TraversalRouteModel';
import { TRAVERSAL_PURSUER_IMAGE } from './TraversalRoutePursuitRenderer';
import { TRAVERSAL_T0_ASSETS } from './TraversalT0Assets';

export type TraversalWorldSubject = { kind: 'shadow' | 'external' | 'prop'; asset: string; mirror: boolean };

/** Read existing clan facts only. Tableau cast and canonical encounter formation are separate owners. */
export function resolveTraversalWorldSubject(beat: TraversalRouteBeat, state: GameState): TraversalWorldSubject | undefined {
  if (beat.type === 'fork') return undefined; // Persistent world sign already owns the fork prop.
  if (beat.marker === 'danger') return { kind: 'shadow', asset: TRAVERSAL_PURSUER_IMAGE, mirror: true };
  if (beat.visualAsset === TRAVERSAL_T0_ASSETS.abandonedCart) {
    return { kind: 'prop', asset: beat.visualAsset, mirror: Boolean(beat.mirrorX) };
  }
  const identity = resolveCharacterUnitId(beat.characterId);
  const travelingCompanion = identity === 'sage_seraphine' || identity === 'maelor';
  const clanMember = identity && state.clan.members.some(member =>
    resolveCharacterUnitId(member.definitionId) === identity);
  const recruitedContact = (identity === 'rogue' && state.flags.recruitedCedric)
    || (identity === 'lancer' && state.flags.recruitedLancer);
  if (travelingCompanion || clanMember || recruitedContact || !beat.visualAsset) return undefined;
  return { kind: 'external', asset: beat.visualAsset, mirror: Boolean(beat.mirrorX) };
}
