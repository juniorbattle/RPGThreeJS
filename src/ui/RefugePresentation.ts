import type { RunNode } from '../game/types';
import { CLAN_ANCHOR_DIALOGUES } from '../game/campaignGrammarContent';
import { demoEnvironmentPlateForContext, type DemoEnvironmentSurfaceRole } from '../render/demoEnvironmentPack';

/**
 * The two interactive refuge nodes have a hub; set 1.15.0 lends the same services to the final
 * story refuge (see resolveFinalRefugeServicesPresentation). Narrative and game rules stay elsewhere.
 */
interface RefugePresentationContent {
  environmentContext: string;
  environmentRole: DemoEnvironmentSurfaceRole;
  eyebrow: string;
  description: string;
  gatheringDialogueId?: string;
}

const INTERACTIVE_REFUGES: Readonly<Record<string, RefugePresentationContent>> = {
  'lion-first-refuge': {
    environmentContext: 'dialogue:first_refuge_gathering',
    environmentRole: 'STATIC_TABLEAU',
    eyebrow: 'Halte de run',
    description: 'Les feux du camp repoussent la brume. La compagnie se rassemble avant de reprendre la route.',
  },
  'lion-second-refuge': {
    environmentContext: 'node:lion-second-refuge',
    environmentRole: 'HOLD_SOURCE',
    eyebrow: 'Halte de run',
    description: 'Le dernier feu du Lion tient encore dans la brume. La compagnie se prépare pour la suite.',
    // An authored pre-management gathering can occupy the same optional slot later.
  },
};

export interface RefugePresentation extends RefugePresentationContent {
  nodeId: string;
  title: string;
  background: string;
  visualFamily: 'FIRST_REFUGE' | 'SECOND_REFUGE' | 'FINAL_REFUGE';
  /** Only the two refuge nodes secure loot into the chest; the final refuge services never do. */
  securesLoot: boolean;
}

export function resolveRefugePresentation(node: RunNode): RefugePresentation | null {
  if (node.type !== 'refuge') return null;
  const content = INTERACTIVE_REFUGES[node.id];
  if (!content) return null;
  const plate = demoEnvironmentPlateForContext(content.environmentContext, content.environmentRole);
  if (plate.visualFamily !== 'FIRST_REFUGE' && plate.visualFamily !== 'SECOND_REFUGE') {
    throw new Error(`Unexpected refuge environment family for ${node.id}: ${plate.visualFamily}`);
  }
  return {
    ...content,
    gatheringDialogueId: CLAN_ANCHOR_DIALOGUES[node.id],
    nodeId: node.id,
    title: node.label,
    background: plate.publicUrl,
    visualFamily: plate.visualFamily,
    securesLoot: true,
  };
}

/**
 * Set 1.15.0 (OD-2026-11-05-E): the final refuge keeps its `story` type and offers the existing
 * refuge services on its approved FINAL_REFUGE plate, with the node's own authored label and hint.
 */
export function resolveFinalRefugeServicesPresentation(node: RunNode): RefugePresentation | null {
  if (node.id !== 'lion-final-refuge' || node.type !== 'story') return null;
  if (!node.hint) throw new Error(`Missing authored hint for ${node.id}`);
  const environmentContext = `node:${node.id}`;
  const plate = demoEnvironmentPlateForContext(environmentContext, 'HOLD_SOURCE');
  if (plate.visualFamily !== 'FINAL_REFUGE') {
    throw new Error(`Unexpected final refuge environment family: ${plate.visualFamily}`);
  }
  return {
    environmentContext,
    environmentRole: 'HOLD_SOURCE',
    eyebrow: 'Halte de run',
    description: node.hint,
    nodeId: node.id,
    title: node.label,
    background: plate.publicUrl,
    visualFamily: 'FINAL_REFUGE',
    securesLoot: false,
  };
}
