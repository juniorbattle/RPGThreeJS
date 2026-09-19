import { campaignNodes } from './content';
import { LION_CAMPAIGN_STRUCTURE } from './LionCampaignStructure';
import { generateRunGraph } from './runSystem';
import {
  demoEnvironmentPlateForContext,
} from '../render/demoEnvironmentPack';
import { resolveCharacterVisualProfile } from '../render/CharacterVisualRegistry';

export type LionCampaignAuditCode =
  | 'RUN_NODE_MISSING'
  | 'RUN_LINK_MISMATCH'
  | 'RUN_CONTENT_OUTSIDE_CONTRACT'
  | 'LEGACY_NODE_MISSING'
  | 'LEGACY_LINK_MISMATCH'
  | 'ENV_NODE_CONTEXT_MISSING'
  | 'ENV_NODE_FAMILY_MISMATCH'
  | 'ENV_EDGE_CONTEXT_MISSING'
  | 'CONTENT_ENV_CONTEXT_MISSING'
  | 'CONTENT_ENV_FAMILY_MISMATCH'
  | 'CHARACTER_VISUAL_UNRESOLVED';

export interface LionCampaignAuditIssue {
  readonly code: LionCampaignAuditCode;
  readonly nodeId: string;
  readonly detail: string;
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function environmentFamily(contextId: string): string | undefined {
  try {
    return demoEnvironmentPlateForContext(contextId).visualFamily;
  } catch {
    return undefined;
  }
}

export function auditLionCampaignStructure(seed = 0): LionCampaignAuditIssue[] {
  const issues: LionCampaignAuditIssue[] = [];
  const runNodes = new Map(generateRunGraph(seed).nodes.map((node) => [node.id, node] as const));
  const legacyNodes = new Map(campaignNodes.map((node) => [node.id, node] as const));

  for (const definition of LION_CAMPAIGN_STRUCTURE) {
    const runNode = runNodes.get(definition.id);
    if (!runNode) {
      issues.push({
        code: 'RUN_NODE_MISSING',
        nodeId: definition.id,
        detail: 'Canonical campaign node is absent from RunSystem.',
      });
    } else {
      if (!sameStrings(runNode.links, definition.expectedNextNodeIds)) {
        issues.push({
          code: 'RUN_LINK_MISMATCH',
          nodeId: definition.id,
          detail: `RunSystem links [${runNode.links.join(', ')}] differ from canonical links [${definition.expectedNextNodeIds.join(', ')}].`,
        });
      }
      if (!definition.allowedContentIds.includes(runNode.contentId)) {
        issues.push({
          code: 'RUN_CONTENT_OUTSIDE_CONTRACT',
          nodeId: definition.id,
          detail: `RunSystem resolved content "${runNode.contentId}" outside the canonical allowed set.`,
        });
      }
    }

    const legacyNode = legacyNodes.get(definition.id);
    if (!legacyNode) {
      issues.push({
        code: 'LEGACY_NODE_MISSING',
        nodeId: definition.id,
        detail: 'src/game/content.ts campaignNodes does not contain this canonical node.',
      });
    } else if (!sameStrings(legacyNode.links, definition.expectedNextNodeIds)) {
      issues.push({
        code: 'LEGACY_LINK_MISMATCH',
        nodeId: definition.id,
        detail: `content.ts links [${legacyNode.links.join(', ')}] differ from canonical links [${definition.expectedNextNodeIds.join(', ')}].`,
      });
    }

    const nodeFamily = environmentFamily(definition.environmentContextId);
    if (!nodeFamily) {
      issues.push({
        code: 'ENV_NODE_CONTEXT_MISSING',
        nodeId: definition.id,
        detail: `Missing environment mapping "${definition.environmentContextId}".`,
      });
    } else if (nodeFamily !== definition.expectedEnvironmentFamily) {
      issues.push({
        code: 'ENV_NODE_FAMILY_MISMATCH',
        nodeId: definition.id,
        detail: `Node environment is ${nodeFamily}; canonical family is ${definition.expectedEnvironmentFamily}.`,
      });
    }

    for (const nextNodeId of definition.expectedNextNodeIds) {
      const edgeContextId = `edge:${definition.id}>${nextNodeId}`;
      if (!environmentFamily(edgeContextId)) {
        issues.push({
          code: 'ENV_EDGE_CONTEXT_MISSING',
          nodeId: definition.id,
          detail: `Missing environment mapping "${edgeContextId}".`,
        });
      }
    }

    if (definition.contentAuthority !== 'NONE') {
      const prefix = definition.contentAuthority === 'COMBAT' ? 'combat' : 'dialogue';
      for (const contentId of definition.allowedContentIds) {
        const contentContextId = `${prefix}:${contentId}`;
        const contentFamily = environmentFamily(contentContextId);
        if (!contentFamily) {
          issues.push({
            code: 'CONTENT_ENV_CONTEXT_MISSING',
            nodeId: definition.id,
            detail: `Missing environment mapping "${contentContextId}".`,
          });
        } else if (contentFamily !== definition.expectedEnvironmentFamily) {
          issues.push({
            code: 'CONTENT_ENV_FAMILY_MISMATCH',
            nodeId: definition.id,
            detail: `${contentContextId} uses ${contentFamily}; canonical family is ${definition.expectedEnvironmentFamily}.`,
          });
        }
      }
    }

    for (const characterId of [...definition.cast.required, ...definition.cast.optional]) {
      if (!resolveCharacterVisualProfile(characterId)) {
        issues.push({
          code: 'CHARACTER_VISUAL_UNRESOLVED',
          nodeId: definition.id,
          detail: `Character identity "${characterId}" has no Character System V2 visual profile.`,
        });
      }
    }
  }

  return issues;
}
