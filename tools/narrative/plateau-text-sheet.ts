/**
 * Set 1.20.0, post-demo: the text sheet of a built post-demo plateau, for the operator's reading. Every scene in route
 * order, every line, every choice with its conditions and effects, every fight with its rewards and challenge, and
 * the chief's judgement as each deed is named. State-built scenes are printed under each state that changes them.
 * The final act prints its Tournament board first, then its capital, and the clan supports and foes it proposes.
 * Read-only: `npm run narrative:text-sheet -- bear [output.md]` (or `finale`).
 */
import { writeFileSync } from 'node:fs';
import { CAMPAIGN_CLAN_LABELS, getPlateau, requirePlateauCampaign, type CampaignChapterId } from '../../src/campaign/plateaux/PlateauRegistry';
import { POST_DEMO_REFUGE_GATHERINGS } from '../../src/campaign/plateaux/postDemoRefuges';
import { challengeFor, describeChallenge } from '../../src/game/challenges';
import { getPostDemoCombat, isPostDemoSceneBuilt, resolvePostDemoDialogue } from '../../src/game/postDemoContent';
import { plateauFinaleOf } from '../../src/game/plateauProgression';
import { greedJudgementState, greedPlateauState, perfectHonourJudgementState, perfectHonourPlateauState } from '../../src/game/reputationBounds';
import { FINALE_TOURNAMENT, FINALE_TOURNAMENT_ARRIVAL } from '../../src/campaign/plateaux/finale/finaleTournament';
import { CLAN_FOES, CLAN_SUPPORTS, FINALE_ENEMY_CLAN_RULES } from '../../src/campaign/plateaux/finale/finaleCombat';
import { FINAL_ACT_CLOSING_DIALOGUE_ID } from '../../src/game/plateauProgression';
import { ENDING_LABELS, EPILOGUE_DIALOGUE_IDS, EPILOGUE_STATUS, FEAR_CLOSE_DIALOGUE_ID, LAST_STAND_COMBAT_ID } from '../../src/campaign/plateaux/finale/finaleEpilogues';
import { setClanRelation } from '../../src/game/runSystem';
import { skillById } from '../../src/game/skills';
import finaleMap from '../../src/campaign/consequences/finale.consequences.json';
import { createInitialState } from '../../src/game/store';
import type { DialogueSequence, GameState, NarrativeEffect } from '../../src/game/types';

const chapterId = (process.argv[2] ?? 'bear') as Exclude<CampaignChapterId, 'lion'>;
const output = process.argv[3];
const binding = requirePlateauCampaign(chapterId);
const route = binding.topology.route ?? [];
const isFinalAct = chapterId === 'finale';
/** A Seal plateau's judgement; the final act has none. */
const finale = plateauFinaleOf(chapterId);

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
    case 'completeEpilogue': return 'fin de la chronique';
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
const plateau = getPlateau(chapterId);
const hostName = plateau.hostClan ? CAMPAIGN_CLAN_LABELS[plateau.hostClan].replace(/^Clan d[eu]s? ?(l’)?/, '') : chapterId === 'finale' ? 'acte final' : chapterId;
const rivalName = plateau.rivalClan ? CAMPAIGN_CLAN_LABELS[plateau.rivalClan] : 'clan rival';
/** The previous plateaux's force facts, so a scene that echoes them is printed both ways. */
const PREVIOUS_FORCE: Readonly<Record<string, Readonly<Record<string, boolean>>>> = Object.freeze({
  bear: { serpentGeneralDefeated: false, lionTrialWon: true },
  dragon: { serpentGeneralDefeated: false, lionTrialWon: true, bearMasterSpyDefeated: false, bearTrialWon: true, bearDarkOreEvidence: false },
  scorpion: { serpentGeneralDefeated: false, lionTrialWon: true, bearMasterSpyDefeated: false, bearTrialWon: true, bearDarkOreEvidence: false,
    dragonShadowShamanDefeated: false, dragonTrialWon: true, dragonShadowEvidence: false, dragonPilgrimsSilenced: true },
  finale: { serpentGeneralDefeated: false, lionTrialWon: true, shadowConcealed: true, bearMasterSpyDefeated: false, bearTrialWon: true,
    bearMinesSeized: true, dragonShadowShamanDefeated: false, dragonTrialWon: true, dragonCrystalKept: true,
    scorpionShadowProphetDefeated: false, scorpionTrialWon: true, scorpionCodexKept: true, scorpionShadowBurned: true },
});
/** The previous plateaux's honour facts a scene echoes. */
const PREVIOUS_HONOUR: Readonly<Record<string, Readonly<Record<string, boolean>>>> = Object.freeze({
  dragon: { bearMasterSpyDefeated: true, bearDarkOreEvidence: true },
  scorpion: { bearMasterSpyDefeated: true, bearDarkOreEvidence: true, dragonShadowShamanDefeated: true, dragonShadowEvidence: true,
    dragonPilgrimsProtected: true },
  finale: { serpentGeneralDefeated: true, shadowRevealed: true, bearMasterSpyDefeated: true, bearDarkOreEvidence: true,
    dragonShadowShamanDefeated: true, dragonShadowEvidence: true, scorpionShadowProphetDefeated: true, scorpionShadowEvidence: true },
});
/** The final act's own conduct: its consequence map's honour and force options. */
const FINALE_OPTIONS = finaleMap.majorChoices.flatMap((choice) => choice.options);
const FINALE_HONOUR = Object.fromEntries(FINALE_OPTIONS.filter((option) => option.path === 'honour').flatMap((option) => option.sets.map((fact) => [fact, true])));
const FINALE_FORCE = Object.fromEntries(FINALE_OPTIONS.filter((option) => option.path === 'force').flatMap((option) => option.sets.map((fact) => [fact, true])));
function conductState(previous: 'honour' | 'force', conduct: 'honour' | 'force'): GameState {
  if (!isFinalAct) return conduct === 'honour' ? perfectHonourPlateauState(chapterId) : greedPlateauState(chapterId);
  const state = previous === 'honour' ? perfectHonourJudgementState() : greedJudgementState();
  Object.assign(state.flags, conduct === 'honour' ? FINALE_HONOUR : FINALE_FORCE);
  return state;
}
/** The pact flag that opens the decisive scene's third answer. */
const PACT_FLAG: Readonly<Record<string, string>> = Object.freeze({ bear: 'bearRavenPact', dragon: 'dragonWolfPact', scorpion: 'scorpionPhoenixOath' });
/** How that pact is named: the Scorpion's is an oath sworn to the Phénix. */
const PACT_LABEL: Readonly<Record<string, string>> = Object.freeze({ scorpion: 'serment juré au Phénix' });
const honour = conductState('honour', 'honour');
Object.assign(honour.flags, PREVIOUS_HONOUR[chapterId] ?? {});
const greed = conductState('force', 'force');
Object.assign(greed.flags, PREVIOUS_FORCE[chapterId] ?? {});
const forceThenHonour = conductState('force', 'honour');
Object.assign(forceThenHonour.flags, PREVIOUS_FORCE[chapterId] ?? {});
const pact = conductState('honour', 'force');
Object.assign(pact.flags, isFinalAct ? PREVIOUS_HONOUR[chapterId] ?? {} : PREVIOUS_FORCE[chapterId] ?? {});
if (PACT_FLAG[chapterId]) pact.flags[PACT_FLAG[chapterId]!] = true;
/** Each state with the route its conduct leads to, so the epilogue is printed after that route's victory. */
const STATES: { label: string; state: GameState; route: 'honour' | 'force' }[] = [
  { label: `plateaux précédents par l’honneur, conduite honorable ici (${hostName})`, state: honour, route: 'honour' },
  { label: 'plateaux précédents par la force, conduite avide ici', state: greed, route: 'force' },
  { label: 'plateaux précédents par la force, conduite honorable ici', state: forceThenHonour, route: 'honour' },
  { label: isFinalAct ? 'plateaux précédents par l’honneur, conduite avide ici'
    : PACT_LABEL[chapterId] ?? `pacte avec le ${rivalName.replace(/^Clan d[eu] ?/, '')}`, state: pact, route: 'force' },
];

/** The state a scene is built from: the epilogue follows the victory over its route's boss. */
function stateFor(id: string, entry: (typeof STATES)[number]): GameState {
  if (!finale || id !== finale.epilogueDialogueId) return entry.state;
  return { ...entry.state, flags: { ...entry.state.flags, ...finale.victoryFacts[finale.combats[entry.route]] } };
}

function scene(id: string, heading: string): string[] {
  const out = [`### ${heading} — \`${id}\``, ''];
  if (!isPostDemoSceneBuilt(id)) {
    out.push(...sequenceText(resolvePostDemoDialogue(id, createInitialState())!), '');
    return out;
  }
  const printed = new Map<string, string>();
  for (const entry of STATES) {
    const { label } = entry;
    const text = sequenceText(resolvePostDemoDialogue(id, stateFor(id, entry))!).join('\n');
    const seen = printed.get(text);
    if (seen) { printed.set(text, `${seen} ; ${label}`); continue; }
    printed.set(text, label);
  }
  for (const [text, labels] of printed) out.push(`*Construite selon l’état — ${labels} :*`, '', text, '');
  return out;
}

/**
 * Lot 5: the endings, printed after the act's closing scene under the states that change them: R4's outcomes, the saved
 * relations and the civilians of the arena. The Fear ending prints its choice, the last stand and both closing scenes.
 */
function endingState(outcomes: readonly ('honour' | 'force')[], reputation: number, civilians: 'protected' | 'abandoned'): GameState {
  const state = outcomes.filter((outcome) => outcome === 'honour').length >= 2 ? perfectHonourJudgementState() : greedJudgementState();
  const plateaux = ['lion', 'bear', 'dragon', 'scorpion'] as const;
  const facts = [['serpentGeneralDefeated', 'lionTrialWon'], ['bearMasterSpyDefeated', 'bearTrialWon'], ['dragonShadowShamanDefeated', 'dragonTrialWon'],
    ['scorpionShadowProphetDefeated', 'scorpionTrialWon']] as const;
  plateaux.forEach((chapter, index) => {
    const outcome = outcomes[index]!;
    state.campaign!.chapters[chapter] = { status: 'completed', outcome };
    state.flags[facts[index]![outcome === 'honour' ? 0 : 1]] = true;
    const stance = outcome === 'honour' ? 'ally' : chapter === 'lion' ? 'neutral' : 'enemy';
    setClanRelation(state, chapter, stance, 'sheet');
  });
  const rivals = ['raven', 'wolf', 'phoenix'] as const;
  for (const clan of rivals) setClanRelation(state, clan, outcomes.filter((outcome) => outcome === 'honour').length >= 3 ? 'ally' : 'enemy', 'sheet');
  setClanRelation(state, 'serpent', 'enemy', 'sheet');
  state.flags[civilians === 'protected' ? 'finaleCiviliansProtected' : 'finaleCiviliansAbandoned'] = true;
  state.reputation = reputation;
  return state;
}

function printedUnder(id: string, states: readonly { label: string; state: GameState }[]): string[] {
  const out = [`### ${id === FEAR_CLOSE_DIALOGUE_ID ? 'Clôture de la Crainte' : 'Épilogue'} — \`${id}\``, ''];
  const printed = new Map<string, string>();
  for (const { label, state } of states) {
    const text = sequenceText(resolvePostDemoDialogue(id, state)!).join('\n');
    const seen = printed.get(text);
    printed.set(text, seen ? `${seen} ; ${label}` : label);
  }
  for (const [text, labels] of printed) out.push(`*Construite selon l’état — ${labels} :*`, '', text, '');
  return out;
}

function endings(): string[] {
  const out = [`## Les fins — ${EPILOGUE_STATUS === 'draft' ? 'BROUILLON (Lot 5)' : 'CANON'}`, '',
    'RunSystem enregistre la fin quand l’acte se clôt (R4) : trois ou quatre fois l’honneur donnent le Respect, sauf si la jauge est sous 40 (alors l’Équilibre) ; trois ou quatre fois la force donnent la Crainte, sauf si la jauge est à 60 ou plus (alors l’Équilibre) ; deux et deux donnent l’Équilibre. Dans le Lion, l’honneur est la route du Général Serpent, la force celle de l’épreuve. Tant que leurs tableaux sont provisoires, les tableaux vivants des épilogues ne jouent pas : chaque fin passe directement à son dialogue.', ''];
  out.push(`## ${ENDING_LABELS.respect}`, '', ...printedUnder(EPILOGUE_DIALOGUE_IDS.respect, [
    { label: 'quatre fois l’honneur, civils couverts', state: endingState(['honour', 'honour', 'honour', 'honour'], 88, 'protected') },
    { label: 'trois fois l’honneur (le Lion par l’épreuve), foule laissée', state: endingState(['force', 'honour', 'honour', 'honour'], 70, 'abandoned') },
  ]));
  out.push(`## ${ENDING_LABELS.balance}`, '', ...printedUnder(EPILOGUE_DIALOGUE_IDS.balance, [
    { label: 'deux et deux, civils couverts', state: endingState(['honour', 'honour', 'force', 'force'], 50, 'protected') },
    { label: 'quatre fois l’honneur mais une jauge sous 40', state: endingState(['honour', 'honour', 'honour', 'honour'], 35, 'protected') },
    { label: 'quatre fois la force mais une jauge à 60 ou plus', state: endingState(['force', 'force', 'force', 'force'], 65, 'abandoned') },
  ]));
  out.push(`## ${ENDING_LABELS.fear}`, '', ...printedUnder(EPILOGUE_DIALOGUE_IDS.fear, [
    { label: 'quatre fois la force, foule laissée', state: endingState(['force', 'force', 'force', 'force'], 10, 'abandoned') },
    { label: 'trois fois la force (le Lion par l’honneur), civils couverts', state: endingState(['honour', 'force', 'force', 'force'], 30, 'protected') },
  ]));
  out.push('Premier choix : le dernier combat, sans soutien ; RunSystem y ajoute les adversaires des clans ennemis (voir la dernière section).', '', ...fight(LAST_STAND_COMBAT_ID), '');
  const stand = endingState(['force', 'force', 'force', 'force'], 10, 'abandoned');
  Object.assign(stand.flags, { finaleFearLastStand: true, finaleLastStandWon: true });
  const fate = endingState(['force', 'force', 'force', 'force'], 10, 'abandoned');
  fate.flags.finaleFearFateAccepted = true;
  out.push(...printedUnder(FEAR_CLOSE_DIALOGUE_ID, [
    { label: 'après le dernier combat gagné', state: stand },
    { label: 'destin accepté', state: fate },
  ]));
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
  const phases = (config.phases ?? []).map((phase, index) => ` Phase ${index + 2} : ${phase.label}, boss \`${phase.bossVisualId}\` avec ${phase.escortVisualIds.join(', ') || 'aucune escorte'}.`).join('');
  const lines = [`- Combat **${config.encounterLabel}** (\`${combatId}\`, ${config.encounterRank}) : ${config.objective} Ennemis : ${roster}.${phases} Récompense : ${rewards}.${challenge ? ` Défi : ${challenge.condition}, prime ${challenge.prime}.` : ''}`];
  return lines;
}

const chiefLabel = [plateau.chief?.title, plateau.chief?.name].filter(Boolean).join(' ');
const out: string[] = [
  `# Fiche de texte — ${plateau.label}${chiefLabel ? ` (${chiefLabel})` : ''} — ${plateau.status === 'canon' ? 'CANON' : 'BROUILLON'}`,
  '',
  plateau.status === 'canon'
    ? 'Générée par `tools/narrative/plateau-text-sheet.ts` depuis le contenu jouable. Canon : le plateau a été accepté par l’opérateur.'
    : 'Générée par `tools/narrative/plateau-text-sheet.ts` depuis le contenu jouable. Brouillon : rien ici n’est canon avant l’approbation du plateau par l’opérateur.',
  '',
  ...(isFinalAct && EPILOGUE_STATUS === 'draft'
    ? ['**Les fins (Lot 5) restent un brouillon** : la section « Les fins », après la clôture de l’acte, attend l’approbation de l’opérateur.', '']
    : []),
  '## Parcours, scènes et combats',
  '',
];
const dialogueSeen = new Set<string>();
/** A fight with the scenes around it, each printed once. */
function fightWithScenes(combatId: string): void {
  const config = getPostDemoCombat(combatId)!;
  if (config.preCombatDialogueId && !dialogueSeen.has(config.preCombatDialogueId)) { dialogueSeen.add(config.preCombatDialogueId); out.push(...scene(config.preCombatDialogueId, 'Avant le combat')); }
  out.push(...fight(combatId), '');
  if (config.postCombatDialogueId && !dialogueSeen.has(config.postCombatDialogueId)) { dialogueSeen.add(config.postCombatDialogueId); out.push(...scene(config.postCombatDialogueId, 'Après le combat')); }
}
if (isFinalAct) {
  out.push('## Le Tournoi des Grands — tableau des rencontres', '', 'RunSystem tient l’ordre du tableau et le lit dans les faits sauvegardés. Chaque combat de l’acte final reçoit les soutiens des clans alliés et les adversaires des clans ennemis (voir la dernière section).', '');
  dialogueSeen.add(FINALE_TOURNAMENT_ARRIVAL.dialogueId);
  out.push(...scene(FINALE_TOURNAMENT_ARRIVAL.dialogueId, 'Ouverture du Tournoi'));
  FINALE_TOURNAMENT.forEach((entry, index) => {
    out.push(`## ${index + 1}. ${entry.label} — \`${entry.nodeId}\``, '');
    if (entry.openingDialogueId) { dialogueSeen.add(entry.openingDialogueId); out.push(...scene(entry.openingDialogueId, entry.label)); }
    fightWithScenes(entry.combatId);
  });
  out.push('## La capitale corrompue', '');
}
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
  if (isFinalAct && node.id === binding.judgementNodeId) {
    out.push(...scene(FINAL_ACT_CLOSING_DIALOGUE_ID, 'Clôture de l’acte final'));
    out.push(...endings());
  }
  if (finale && node.id === binding.judgementNodeId) {
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

if (finale) {
  // P5: a chief named by his title only is « le Grand Inquisiteur ».
  const chiefName = plateau.chief?.name ?? (plateau.chief?.title ? `le ${plateau.chief.title}` : 'le chef');
  out.push(`## Ce que ${chiefName} pèse au jugement`, '', '| Fait | Nature | Poids | Phrase dite au jugement |', '| --- | --- | --- | --- |');
  for (const deed of finale.deeds) out.push(`| \`${deed.flag}\` | ${deed.kind} (${deed.severity}) | ${finale.conductWeights[deed.flag] ?? 0} | ${deed.phrase} |`);
  out.push('', `Crédibilité devant ${chiefName} (${plateau.status === 'canon' ? 'approuvée' : 'proposée'}) : crédible à ${finale.credibility.credible}, haute à ${finale.credibility.high}. Faits de force : ${finale.forceFacts.map((f) => `\`${f}\``).join(', ')}. Fait d’honneur : \`${finale.honourFact}\`.`, '');
} else {
  out.push(`## Soutiens des clans alliés et adversaires des clans ennemis (${plateau.status === 'canon' ? 'approuvés, OD-2026-11-09-A' : 'proposés'})`, '',
    'Avant chaque combat de l’acte final, RunSystem lit les relations sauvegardées : chaque clan allié offre son soutien, utilisable une fois dans le combat (sauf le clan que la compagnie affronte au Tournoi) ; chaque clan ennemi ajoute un adversaire. Rien de cela n’est sauvegardé.', '',
    '| Clan | Soutien (allié) | Effet (compétence existante) | Adversaire (ennemi) |', '| --- | --- | --- | --- |');
  for (const clan of ['lion', 'bear', 'dragon', 'scorpion', 'raven', 'wolf', 'phoenix', 'serpent'] as const) {
    const support = CLAN_SUPPORTS[clan];
    const skill = support ? skillById.get(support.skillId) : undefined;
    out.push(`| ${CAMPAIGN_CLAN_LABELS[clan]} | ${support?.label ?? '—'} | ${skill ? `${skill.name} (${support!.family}, ${skill.ap} PA) : ${skill.description}` : '—'} | ${CLAN_FOES[clan] ? `\`${CLAN_FOES[clan]}\`` : '— (jamais ennemi)'} |`);
  }
  out.push('', 'Clans ennemis pris en compte par combat : au Tournoi, le seul clan affronté ; dans l’arène en flammes, aucun ; dans la capitale et à la brèche, tous, dans l’ordre où la compagnie les a rencontrés, dans la limite des places libres (quatre adversaires, ou un boss et trois escortes).', '',
    Object.entries(FINALE_ENEMY_CLAN_RULES).map(([combatId, rule]) => `- \`${combatId}\` : ${rule === 'none' ? 'aucun' : rule === 'all' ? 'tous' : rule.map((clan) => CAMPAIGN_CLAN_LABELS[clan]).join(', ')}`).join('\n'), '',
    `- \`${LAST_STAND_COMBAT_ID}\` (Lot 5${EPILOGUE_STATUS === 'draft' ? ', brouillon' : ''}) : aucun soutien ; le pillard du Serpent, puis tous les autres clans ennemis, quatre adversaires au plus.`, '');
}

const text = `${out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
if (output) writeFileSync(output, text);
else process.stdout.write(text);
