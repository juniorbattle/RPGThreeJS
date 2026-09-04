import type {
  JourneyAgencyPresentation,
  JourneyChoicePresentation,
  JourneySecondaryActionPresentation,
} from '../cinematics/JourneyTypes';
import { ratingScale, runNodePresentation } from '../ui/RunNodePresentation';
import type { RunNode } from '../game/types';

/**
 * PURE adapter: authoritative resolved RunNodes → CIN-1 Journey presentation contract.
 *
 * It receives exactly the nodes `getAvailableRunNodes(state)` produced for TravelView, so adaptive
 * route variants are already resolved by RunSystem before they reach any UI. Nothing here reads or
 * writes campaign state, and no route registry is duplicated: every label, risk, reward, difficulty
 * and hint comes from the node itself through the shared RunNodePresentation semantics.
 */
export type JourneyBoundaryKind = 'terminal' | 'single' | 'branch';

export interface JourneyBoundaryPlan {
  kind: JourneyBoundaryKind;
  presentation: JourneyAgencyPresentation;
  /** The only successor, when `kind === 'single'`. A continuation commits exactly this node. */
  singleNodeId: string | null;
}

export interface JourneyBoundaryContext {
  currentLabel?: string;
  secondary?: readonly JourneySecondaryActionPresentation[];
}

export const JOURNEY_CONTINUE_LABEL = 'Continuer';
export const JOURNEY_TERMINAL_LABEL = 'Retour au menu';

export function toJourneyChoice(node: RunNode): JourneyChoicePresentation {
  const meta = runNodePresentation(node);
  return {
    id: node.id,
    label: node.label,
    category: meta.label,
    difficulty: meta.difficulty,
    hint: meta.hint,
    risk: `Risque ${ratingScale(meta.risk)}`,
    reward: `Gain ${ratingScale(meta.reward)}`,
  };
}

export function toJourneyChoices(nodes: readonly RunNode[]): JourneyChoicePresentation[] {
  return nodes.map(toJourneyChoice);
}

/**
 * Builds the agency plan for a campaign boundary.
 *
 * - 2+ successors → real route choices, one per available node.
 * - exactly 1 successor → a single CONTINUE affordance. A lone successor is not a strategic
 *   decision, so it must never be dressed up as a route-comparison card.
 * - 0 successors → a safe terminal boundary. No node is fabricated and no route can be committed.
 */
export function planJourneyBoundary(
  available: readonly RunNode[],
  context: JourneyBoundaryContext = {},
): JourneyBoundaryPlan {
  const secondary = context.secondary ? [...context.secondary] : undefined;
  const only = available.length === 1 ? available[0] : undefined;

  if (only) {
    const meta = runNodePresentation(only);
    return {
      kind: 'single',
      singleNodeId: only.id,
      presentation: {
        title: context.currentLabel ?? 'La route se poursuit',
        caption: `Prochaine étape : ${only.label} · ${meta.label} · ${meta.difficulty}`,
        choices: [],
        continueLabel: JOURNEY_CONTINUE_LABEL,
        ...(secondary ? { secondary } : {}),
      },
    };
  }

  if (!available.length) {
    return {
      kind: 'terminal',
      singleNodeId: null,
      presentation: {
        title: context.currentLabel ?? 'La route s’achève ici',
        caption: 'Aucune route ne poursuit cette chronique.',
        choices: [],
        continueLabel: JOURNEY_TERMINAL_LABEL,
        ...(secondary ? { secondary } : {}),
      },
    };
  }

  return {
    kind: 'branch',
    singleNodeId: null,
    presentation: {
      title: context.currentLabel ?? 'La route se divise',
      caption: `${available.length} routes s’ouvrent devant la compagnie.`,
      choices: toJourneyChoices(available),
      ...(secondary ? { secondary } : {}),
    },
  };
}
