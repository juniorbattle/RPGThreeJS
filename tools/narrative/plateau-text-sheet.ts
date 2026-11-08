/**
 * Set 1.20.0, post-demo: the text sheet of a built post-demo plateau, for the operator's reading. Every scene in route
 * order, every line, every choice with its conditions and effects, every fight with its rewards and challenge, and
 * Borin's judgement as each deed is named. State-built scenes are printed under each state that changes them.
 * Read-only: `npm run narrative:text-sheet -- bear [output.md]`.
 */
import { writeFileSync } from 'node:fs';
import { requirePlateauCampaign, type CampaignChapterId } from '../../src/campaign/plateaux/PlateauRegistry';
import { POST_DEMO_REFUGE_GATHERINGS } from '../../src/campaign/plateaux/postDemoRefuges';
import { challengeFor, describeChallenge } from '../../src/game/challenges';
import { getPostDemoCombat, isPostDemoSceneBuilt, resolvePostDemoDialogue } from '../../src/game/postDemoContent';
import { plateauFinaleOf } from '../../src/game/plateauProgression';
import { greedPlateauState, perfectHonourPlateauState } from '../../src/game/reputationBounds';
import { createInitialState } from '../../src/game/store';
import type { DialogueSequence, GameState, NarrativeEffect } from '../../src/game/types';

const chapterId = (process.argv[2] ?? 'bear') as Exclude<CampaignChapterId, 'lion' | 'finale'>;
const output = process.argv[3];
const binding = requirePlateauCampaign(chapterId);
const route = binding.topology.route ?? [];
const finale = plateauFinaleOf(chapterId)!;

function effectText(effect: NarrativeEffect): string {
  switch (effect.type) {
    case 'setFlag': return `fait \`${effect.key}\`${effect.value ? '' : ' = faux'}`;
    case 'addGold': return `${effect.amount > 0 ? '+' : ''}${effect.amount} or`;
    case 'addReputation': return `réputation ${effect.amount > 0 ? '+' : ''}${effect.amount}`;
    case 'addItem': return `+${effect.quantity} ${effect.itemId}`;
    case 'startCombat': return `combat \`${effect.combatId}\``;
    case 'setClanRelation': return `relation ${effect.clan} → ${effect.stance} (cause \`${effect.cause}\`)`;
    case 'resolvePlateauFinale': return `issue du jugement : ${effect.intent === 'claim_recognition' ? 'réclamer le Sceau' : 'demander l’épreuve'}`;
    case 'completePlateau': return `clôture du plateau ${effect.plateauId}`;
    default: return effect.type;
  }
}

function sequenceText(sequence: DialogueSequence): string[] {
  const lines: string[] = [];
  for (const step of sequence.steps) {
    const effects = step.effects.length ? ` — *${step.effects.map(effectText).join(' ; ')}*` : '';
    lines.push(`- **${step.speaker}**${step.tag ? ` · ${step.tag}` : ''} : ${step.text}${effects}`);
    for (const choice of step.choices ?? []) {
      const conditions = [
        choice.requiresFlag ? `exige \`${choice.requiresFlag}\`` : '',
        choice.excludesFlag ? `exclu par \`${choice.excludesFlag}\`` : '',
        choice.requiresReputationMin !== undefined ? `réputation ≥ ${choice.requiresReputationMin}` : '',
        choice.requiresGold !== undefined ? `${choice.requiresGold} or` : '',
      ].filter(Boolean);
      const hints = choice.outcomePreview?.hints?.length ? ` (aperçu : ${choice.outcomePreview.hints.join(' ; ')})` : '';
      lines.push(`  - Choix « ${choice.text} »${conditions.length ? ` [${conditions.join(', ')}]` : ''}${hints} → ${choice.effects.map(effectText).join(' ; ') || 'sans effet'}`);
    }
  }
  return lines;
}

/** The states a state-built scene is printed under: what changes it, never more. */
const STATES: { label: string; state: GameState }[] = [
  { label: 'Lion par l’honneur, conduite honorable dans l’Ours', state: perfectHonourPlateauState(chapterId) },
  { label: 'Lion par la force, conduite avide dans l’Ours', state: greedPlateauState(chapterId) },
];
const lionForceHonourBear = perfectHonourPlateauState(chapterId);
lionForceHonourBear.flags.serpentGeneralDefeated = false;
lionForceHonourBear.flags.lionTrialWon = true;
STATES.push({ label: 'Lion par la force, conduite honorable dans l’Ours', state: lionForceHonourBear });
const pact = greedPlateauState(chapterId);
pact.flags.bearRavenPact = true;
STATES.push({ label: 'Pacte avec le Corbeau', state: pact });

function scene(id: string, heading: string): string[] {
  const out = [`### ${heading} — \`${id}\``, ''];
  if (!isPostDemoSceneBuilt(id)) {
    out.push(...sequenceText(resolvePostDemoDialogue(id, createInitialState())!), '');
    return out;
  }
  const printed = new Map<string, string>();
  for (const { label, state } of STATES) {
    const text = sequenceText(resolvePostDemoDialogue(id, state)!).join('\n');
    const seen = printed.get(text);
    if (seen) { printed.set(text, `${seen} ; ${label}`); continue; }
    printed.set(text, label);
  }
  for (const [text, labels] of printed) out.push(`*Construite selon l’état — ${labels} :*`, '', text, '');
  return out;
}

function fight(combatId: string): string[] {
  const config = getPostDemoCombat(combatId);
  if (!config) return [];
  const rewards = [`${config.rewards.gold} or`, `réputation ${config.rewards.reputation > 0 ? '+' : ''}${config.rewards.reputation}`,
    ...Object.entries(config.rewards.materials ?? {}).map(([id, n]) => `+${n} ${id}`)].join(', ');
  const roster = config.isBoss ? `boss \`${config.bossVisualId}\` avec ${config.escortVisualIds.join(', ') || 'aucune escorte'}`
    : config.enemyVisualIds.join(', ');
  const declared = challengeFor(combatId);
  const challenge = declared ? describeChallenge(declared) : null;
  const lines = [`- Combat **${config.encounterLabel}** (\`${combatId}\`, ${config.encounterRank}) : ${config.objective} Ennemis : ${roster}. Récompense : ${rewards}.${challenge ? ` Défi : ${challenge.condition}, prime ${challenge.prime}.` : ''}`];
  return lines;
}

const out: string[] = [
  `# Fiche de texte — ${chapterId === 'bear' ? 'Les Montagnes de la Résilience (l’Ours)' : chapterId} — BROUILLON`,
  '',
  'Générée par `tools/narrative/plateau-text-sheet.ts` depuis le contenu jouable. Brouillon : rien ici n’est canon avant l’approbation du plateau par l’opérateur.',
  '',
  '## Parcours, scènes et combats',
  '',
];
const dialogueSeen = new Set<string>();
for (const node of route) {
  out.push(`## ${node.label} — \`${node.id}\` (${node.type}, profondeur ${node.depth})`, '');
  const contentIds = node.type === 'refuge' ? [POST_DEMO_REFUGE_GATHERINGS[chapterId]?.[node.id]].filter((id): id is string => Boolean(id)) : [node.contentId];
  for (const contentId of contentIds) {
    const combat = getPostDemoCombat(contentId);
    if (combat) {
      if (combat.preCombatDialogueId && !dialogueSeen.has(combat.preCombatDialogueId)) { dialogueSeen.add(combat.preCombatDialogueId); out.push(...scene(combat.preCombatDialogueId, 'Avant le combat')); }
      out.push(...fight(contentId), '');
      if (combat.postCombatDialogueId && !dialogueSeen.has(combat.postCombatDialogueId)) { dialogueSeen.add(combat.postCombatDialogueId); out.push(...scene(combat.postCombatDialogueId, 'Après le combat')); }
      continue;
    }
    if (!resolvePostDemoDialogue(contentId, createInitialState())) continue;
    dialogueSeen.add(contentId);
    out.push(...scene(contentId, node.label));
    // Fights a scene starts, with their own scenes.
    const sequences = isPostDemoSceneBuilt(contentId) ? STATES.map(({ state }) => resolvePostDemoDialogue(contentId, state)!) : [resolvePostDemoDialogue(contentId, createInitialState())!];
    const started = new Set(sequences.flatMap((sequence) => sequence.steps.flatMap((step) => [...step.effects, ...(step.choices ?? []).flatMap((choice) => choice.effects)]))
      .flatMap((effect) => effect.type === 'startCombat' ? [effect.combatId] : []));
    for (const combatId of started) {
      const config = getPostDemoCombat(combatId)!;
      if (config.preCombatDialogueId && !dialogueSeen.has(config.preCombatDialogueId)) { dialogueSeen.add(config.preCombatDialogueId); out.push(...scene(config.preCombatDialogueId, 'Avant le combat')); }
      out.push(...fight(combatId), '');
      if (config.postCombatDialogueId && !dialogueSeen.has(config.postCombatDialogueId)) { dialogueSeen.add(config.postCombatDialogueId); out.push(...scene(config.postCombatDialogueId, 'Après le combat')); }
    }
  }
  if (node.id === binding.judgementNodeId) {
    for (const combatId of [finale.combats.honour, finale.combats.force]) {
      const config = getPostDemoCombat(combatId)!;
      out.push(`#### Voie ${combatId === finale.combats.honour ? 'd’honneur' : 'de force'}`, '');
      if (config.preCombatDialogueId) out.push(...scene(config.preCombatDialogueId, 'Avant le combat'));
      out.push(...fight(combatId), '');
      if (config.postCombatDialogueId) out.push(...scene(config.postCombatDialogueId, 'Après le combat'));
    }
    out.push(...scene(finale.epilogueDialogueId, 'Épilogue'));
  }
}

out.push('## Fouilles et gardiens (POI facultatifs)', '');
for (const poi of binding.topology.optionalPois) {
  const variants = poi.combat?.variants.map((variant) => variant.id) ?? [];
  out.push(`- **${poi.label}** (\`${poi.id}\`, région ${poi.region + 1}) : ${poi.kind}${variants.length ? ` — variantes ${variants.join(', ')}` : ''}`);
  for (const id of variants) out.push(`  ${fight(id).join('')}`);
}
for (const guardian of binding.topology.guardians) out.push(`- Gardien **${guardian.label}** (\`${guardian.id}\`) sur \`${guardian.spawnPosition}\`, deux vagues :`, `  ${fight(guardian.combat.id).join('')}`);
out.push('');

out.push('## Ce que Borin pèse au jugement', '', '| Fait | Nature | Poids | Phrase dite au jugement |', '| --- | --- | --- | --- |');
for (const deed of finale.deeds) out.push(`| \`${deed.flag}\` | ${deed.kind} (${deed.severity}) | ${finale.conductWeights[deed.flag] ?? 0} | ${deed.phrase} |`);
out.push('', `Crédibilité devant Borin (proposée) : crédible à ${finale.credibility.credible}, haute à ${finale.credibility.high}. Faits de force : ${finale.forceFacts.map((f) => `\`${f}\``).join(', ')}. Fait d’honneur : \`${finale.honourFact}\`.`, '');

const text = `${out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
if (output) writeFileSync(output, text);
else process.stdout.write(text);
