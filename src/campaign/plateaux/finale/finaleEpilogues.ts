/**
 * Set 1.20.0, post-demo Lot 5 — the three endings (roadmap §2.6 and §3.7, phase 3; F5) and the Fear ending's choice,
 * canon since OD-2026-11-09-B, like the final act they follow (OD-2026-11-09-A). Written
 * from the roadmap, its status, the demo's established facts (the landless clan, its lost lands, the four Seals) and the
 * operator's decisions only: no clan, place, character, object or lore beyond them. The entity stays unnamed.
 *
 * R4 decides which epilogue plays (RunSystem, `campaignRelations.ts`); each epilogue names its causes: the four Seals,
 * each confided or taken, the allied and enemy clans, and the civilians of the arena. While their tableaux are
 * provisional, the epilogues' living tableaux do not play and each moment goes straight to its dialogue
 * (PRESENTATION_AND_MEDIA "Post-demo moments"). The Fear ending's choice belongs to the dialogue that follows.
 *
 * Content only: these builders read the saved state they are given and decide nothing.
 */
import type { CombatConfig, DialogueChoice, DialogueSequence, DialogueStep, GameState, NarrativeEffect } from '../../../game/types';
import type { CampaignClanId } from '../campaignIds';
import { FINALE_CLAN_ORDER } from './finaleCombat';

/** The endings are canon since the operator accepted them (OD-2026-11-09-B); their images stay provisional. */
export const EPILOGUE_STATUS: 'draft' | 'canon' = 'canon';

export type EpilogueEndingId = 'respect' | 'fear' | 'balance';

/** The ending's name as the chronicle's end states it. */
export const ENDING_LABELS: Readonly<Record<EpilogueEndingId, string>> = Object.freeze({
  respect: 'Le Respect',
  fear: 'La Crainte',
  balance: 'L’Équilibre',
});

export const EPILOGUE_DIALOGUE_IDS: Readonly<Record<EpilogueEndingId, string>> = Object.freeze({
  respect: 'finale_epilogue_respect',
  fear: 'finale_epilogue_fear',
  balance: 'finale_epilogue_balance',
});
export const FEAR_CLOSE_DIALOGUE_ID = 'finale_fear_close';
export const LAST_STAND_COMBAT_ID = 'finale_last_stand';

/** Every content ID of the endings, drafts while `EPILOGUE_STATUS` is `draft`. */
export const EPILOGUE_CONTENT_IDS: ReadonlySet<string> = new Set([
  ...Object.values(EPILOGUE_DIALOGUE_IDS), FEAR_CLOSE_DIALOGUE_ID, LAST_STAND_COMBAT_ID,
]);

// ---------------------------------------------------------------------------------------------------------------------
// The last stand (Fear ending, first answer)

/**
 * Alone against all: the foes of the clans that turned on the company, the Serpent's raider first, as the Serpent is
 * always an enemy. RunSystem adds the other enemy clans' foes before the fight and gives it no clan support.
 */
type EpilogueCombatInput = Omit<CombatConfig, 'enemyVisualIds' | 'escortVisualIds' | 'encounterRank' | 'maxPlayerUnits'>
  & Partial<Pick<CombatConfig, 'enemyVisualIds' | 'escortVisualIds' | 'encounterRank' | 'maxPlayerUnits'>>;

export const EPILOGUE_COMBATS: readonly EpilogueCombatInput[] = Object.freeze<EpilogueCombatInput[]>([
  { id: LAST_STAND_COMBAT_ID, sceneId: 'lion_sanctum', objective: 'Tenez, seuls contre tous : abattez ceux que les clans envoient.',
    encounterLabel: 'Seuls contre tous', encounterRank: 'elite', enemyVisualIds: ['serpent_raider'],
    rewards: { gold: 0, reputation: 0, materials: {} } },
]);

/** The clans whose foes may join the last stand, beside the Serpent's raider already in its formation. */
export const LAST_STAND_CLANS: readonly CampaignClanId[] = Object.freeze(FINALE_CLAN_ORDER.filter((clan) => clan !== 'serpent'));

export const EPILOGUE_VICTORY_FACTS: Readonly<Record<string, Readonly<Record<string, boolean>>>> = Object.freeze({
  [LAST_STAND_COMBAT_ID]: Object.freeze({ finaleLastStandWon: true }),
});

// ---------------------------------------------------------------------------------------------------------------------
// Dialogues

interface Who { speaker: string; actorId: string; side: 'left' | 'right' }
const ALISTAIR: Who = { speaker: 'Alistair', actorId: 'alistair', side: 'left' };
const SERAPHINE: Who = { speaker: 'Sage Séraphine', actorId: 'sage_seraphine', side: 'left' };
const MARIAN: Who = { speaker: 'Marian', actorId: 'marian', side: 'left' };
const KESTREL: Who = { speaker: 'Kestrel', actorId: 'kestrel', side: 'left' };
const CHIEFS: readonly { clan: CampaignClanId; who: Who; tag: string }[] = Object.freeze([
  { clan: 'lion', who: { speaker: 'Chef Alaric', actorId: 'alaric', side: 'right' }, tag: 'Le Lion' },
  { clan: 'bear', who: { speaker: 'Ancien Ours Borin', actorId: 'borin', side: 'right' }, tag: 'L’Ours' },
  { clan: 'dragon', who: { speaker: 'Ancien Dragon Kaelen', actorId: 'kaelen', side: 'right' }, tag: 'Le Dragon' },
  { clan: 'scorpion', who: { speaker: 'Grand Inquisiteur', actorId: 'grand_inquisitor', side: 'right' }, tag: 'Le Scorpion' },
]);

type Expression = DialogueStep['expression'];

function say(id: string, who: Who, tag: string, text: string, options: { expression?: Expression; effects?: NarrativeEffect[];
  choices?: DialogueChoice[] } = {}): DialogueStep {
  return { id, speaker: who.speaker, actorId: who.actorId, side: who.side, tag, text, expression: options.expression ?? 'neutral',
    portrait: '', next: null, effects: options.effects ?? [], choices: options.choices ?? [] };
}

/** Links each step without choices to the next one. */
function chained(steps: (DialogueStep | null)[]): DialogueStep[] {
  const present = steps.filter((step): step is DialogueStep => step !== null);
  return present.map((step, index) => (step.choices?.length || index === present.length - 1) ? step : { ...step, next: present[index + 1]!.id });
}

const COMPLETE: NarrativeEffect = { type: 'completeEpilogue' };

const OF_CLAN: Readonly<Record<CampaignClanId, string>> = Object.freeze({
  lion: 'du Lion', bear: 'de l’Ours', dragon: 'du Dragon', scorpion: 'du Scorpion',
  raven: 'du Corbeau', wolf: 'du Loup', phoenix: 'du Phénix', serpent: 'du Serpent',
});
const BANNER_ORDER: readonly CampaignClanId[] = Object.freeze(['lion', ...FINALE_CLAN_ORDER]);

function listFrench(items: readonly string[]): string {
  return items.length <= 1 ? items[0] ?? '' : `${items.slice(0, -1).join(', ')} et ${items.at(-1)}`;
}

/** The clans of a stance, read from the saved relations RunSystem keeps; an unmet clan reads as neutral. */
function clansOf(state: Readonly<GameState>, stance: 'ally' | 'enemy'): CampaignClanId[] {
  return BANNER_ORDER.filter((clan) => (state.campaign?.clanRelations[clan]?.stance ?? 'neutral') === stance);
}

const banners = (clans: readonly CampaignClanId[]) => `celles ${listFrench(clans.map((clan) => OF_CLAN[clan]))}`;

/** Each Seal, confided by its chief or taken from him, in the words the consequence maps expect. */
const SEALS: readonly { honour: string; force: string; confided: string; taken: string }[] = Object.freeze([
  { honour: 'serpentGeneralDefeated', force: 'lionTrialWon', confided: 'le Sceau du Lion, qu’Alaric nous a confié', taken: 'le Sceau du Lion, gagné contre son Champion' },
  { honour: 'bearMasterSpyDefeated', force: 'bearTrialWon', confided: 'le Sceau de l’Ours, que Borin nous a confié', taken: 'le Sceau de l’Ours, arraché à Borin' },
  { honour: 'dragonShadowShamanDefeated', force: 'dragonTrialWon', confided: 'le Sceau du Dragon, que Kaelen nous a confié', taken: 'le Sceau du Dragon, arraché à Kaelen' },
  { honour: 'scorpionShadowProphetDefeated', force: 'scorpionTrialWon', confided: 'le Sceau du Scorpion, que le Grand Inquisiteur nous a confié', taken: 'le Sceau du Scorpion, arraché au Grand Inquisiteur' },
]);

function sealsStep(flags: Readonly<Record<string, boolean>>): DialogueStep {
  const named = SEALS.flatMap((seal) => flags[seal.honour] ? [seal.confided] : flags[seal.force] ? [seal.taken] : []);
  const text = named.length ? `${named.length === 4 ? 'Quatre Sceaux' : 'Nos Sceaux'} : ${named.join(' ; ')}.` : 'Quatre Sceaux, et la brèche refermée.';
  return say('seals', SERAPHINE, 'Les Sceaux', text, { expression: 'mystical' });
}

function civiliansStep(flags: Readonly<Record<string, boolean>>, protectedText: string, abandonedText: string): DialogueStep | null {
  if (flags.finaleCiviliansProtected) return say('civilians', MARIAN, 'L’arène', protectedText, { expression: 'grateful' });
  if (flags.finaleCiviliansAbandoned) return say('civilians', MARIAN, 'L’arène', abandonedText, { expression: 'wounded' });
  return null;
}

/** The Seal plateaux' outcomes RunSystem recorded, counted for the Balance ending's reading of R4. */
function outcomeCounts(state: Readonly<GameState>): { honour: number; force: number } {
  const chapters = state.campaign?.chapters;
  const outcomes = chapters ? (['lion', 'bear', 'dragon', 'scorpion'] as const).map((id) => chapters[id]?.outcome) : [];
  return { honour: outcomes.filter((outcome) => outcome === 'honour').length, force: outcomes.filter((outcome) => outcome === 'force').length };
}

const COUNT_WORDS: Readonly<Record<number, string>> = Object.freeze({ 2: 'Deux', 3: 'Trois', 4: 'Quatre' });

function epilogueRespect(state: Readonly<GameState>): DialogueSequence {
  const flags = state.flags;
  const allies = clansOf(state, 'ally');
  const chief = CHIEFS.find((candidate) => allies.includes(candidate.clan));
  return { id: EPILOGUE_DIALOGUE_IDS.respect, sceneArtId: 'epilogue', title: ENDING_LABELS.respect, steps: chained([
    say('breach', SERAPHINE, 'La brèche', 'La brèche se referme. Tous ensemble, maintenant : c’est pour cela que les Sceaux nous ont été donnés.', { expression: 'mystical' }),
    say('allies', KESTREL, 'Les alliés', allies.length
      ? `Autour de la brèche, les bannières tiennent la ligne jusqu’au bout : ${banners(allies)}.`
      : 'Autour de la brèche, la compagnie tient la ligne jusqu’au bout.', { expression: 'stern' }),
    sealsStep(flags),
    chief
      ? say('acclaim', chief.who, chief.tag, 'Les clans vous doivent d’être encore debout. Qu’ils se rassemblent sous votre bannière pour reconstruire ce que la brèche a brûlé.', { expression: 'grateful' })
      : say('acclaim', KESTREL, 'Les clans', 'Les clans vous acclament. Ils se rassemblent sous votre bannière pour reconstruire ce que la brèche a brûlé.', { expression: 'grateful' }),
    civiliansStep(flags, 'Dans la foule qui vous acclame, il y a les civils sauvés de l’arène.',
      'Ils acclament, mais certains n’oublient pas la foule abandonnée de l’arène.'),
    say('alistair', ALISTAIR, 'Clan sans terre', 'Nous ne reconstruirons pas seuls. Chaque clan portera sa part du fardeau, et la justice vaudra pour tous.', { expression: 'stern' }),
    say('clan', SERAPHINE, 'Le clan', 'Votre clan avait perdu ses terres et sa place. Aujourd’hui, il retrouve son honneur, et devient un pilier de la nouvelle alliance.', { expression: 'grateful' }),
    say('close', ALISTAIR, 'Le Respect', 'Alors rentrons. Il y a tant à reconstruire.', { effects: [COMPLETE] }),
  ]) };
}

function epilogueBalance(state: Readonly<GameState>): DialogueSequence {
  const flags = state.flags;
  const allies = clansOf(state, 'ally');
  const enemies = clansOf(state, 'enemy');
  const counts = outcomeCounts(state);
  const why = counts.honour >= 3
    ? `${COUNT_WORDS[counts.honour]} Sceaux confiés, et pourtant notre nom pèse moins que nos actes : les clans hésitent encore à nous suivre.`
    : counts.force >= 3
      ? `${COUNT_WORDS[counts.force]} Sceaux arrachés, et pourtant notre nom inspire encore le respect : les clans ne savent plus s’ils doivent nous craindre ou nous suivre.`
      : counts.honour === 2 ? 'Deux Sceaux confiés, deux arrachés : les clans nous respectent autant qu’ils nous craignent.'
        : 'Les clans nous respectent autant qu’ils nous craignent.';
  const sides = [
    allies.length ? `Certaines bannières se tiennent à nos côtés : ${banners(allies)}.` : null,
    enemies.length ? `${allies.length ? 'D’autres' : 'Les bannières des clans'} nous observent de loin : ${banners(enemies)}.` : null,
  ].filter((part): part is string => part !== null).join(' ');
  return { id: EPILOGUE_DIALOGUE_IDS.balance, sceneArtId: 'final_refuge', title: ENDING_LABELS.balance, steps: chained([
    say('breach', SERAPHINE, 'La brèche', 'La brèche se referme. Le monde tient encore, mais il ne sera plus jamais le même.', { expression: 'mystical' }),
    say('banners', KESTREL, 'Les clans', sides || 'Les bannières des clans se tiennent à distance, et attendent.', { expression: 'stern' }),
    sealsStep(flags),
    say('why', SERAPHINE, 'L’Équilibre', why),
    civiliansStep(flags, 'Dans la capitale, les civils sauvés de l’arène parlent de nous avec gratitude. D’autres, avec méfiance.',
      'Dans la capitale, on parle encore de la foule abandonnée de l’arène.'),
    say('peace', ALISTAIR, 'Clan sans terre', 'Alors il faudra négocier. Une paix fragile vaut mieux qu’une guerre de plus, même si elle nous coûte une part de ce que nous croyions.', { expression: 'stern' }),
    say('clan', SERAPHINE, 'Le clan', 'Votre clan regagne une part de son honneur. Le reste, il faudra le mériter, dans un monde encore divisé.'),
    say('close', KESTREL, 'L’Équilibre', 'Respectés, et craints. Il faudra apprendre à marcher entre les deux.', { effects: [COMPLETE] }),
  ]) };
}

function epilogueFear(state: Readonly<GameState>): DialogueSequence {
  const flags = state.flags;
  const allies = clansOf(state, 'ally');
  const enemies = clansOf(state, 'enemy');
  return { id: EPILOGUE_DIALOGUE_IDS.fear, sceneArtId: 'shadow_signs', title: ENDING_LABELS.fear, steps: chained([
    say('breach', SERAPHINE, 'La brèche', 'La brèche se referme. Les Ombres Silencieuses sont vaincues.', { expression: 'mystical' }),
    say('alone', KESTREL, 'Personne', allies.length
      ? `Peu de bannières sont restées, et elles se tiennent à distance : ${banners(allies)}.`
      : 'Autour de nous, aucune bannière alliée. Personne n’a voulu tenir la ligne à nos côtés.', { expression: 'stern' }),
    sealsStep(flags),
    civiliansStep(flags, 'Même les civils sauvés de l’arène nous regardent comme on regarde un incendie.',
      'Personne n’a oublié la foule abandonnée de l’arène.'),
    say('approach', KESTREL, 'Les clans', enemies.length
      ? `Des bannières approchent : ${banners(enemies)}. Elles ne viennent pas nous remercier.`
      : 'Les clans approchent. Ils ne viennent pas nous remercier.', { expression: 'fearful' }),
    say('demand', SERAPHINE, 'Sage', 'Ils vous craignent plus que la brèche, Alistair. Ils exigent qu’on vous livre, pour acheter leur paix.', { expression: 'fearful' }),
    say('choice', ALISTAIR, 'Décision', 'Alors ?', { expression: 'stern', choices: [
      { text: 'Nous battre, seuls contre tous.', next: null, effects: [{ type: 'setFlag', key: 'finaleFearLastStand', value: true }],
        outcomePreview: { mode: 'soft', hints: ['Un dernier combat, sans aucun soutien', 'Le clan sans terre rayé des clans'] } },
      { text: 'Accepter mon destin.', next: null, effects: [{ type: 'setFlag', key: 'finaleFearFateAccepted', value: true }],
        outcomePreview: { mode: 'soft', hints: ['Alistair se livre aux clans', 'Le clan, de nouveau déchu, survit'] } },
    ] }),
  ]) };
}

function fearClose(state: Readonly<GameState>): DialogueSequence {
  const flags = state.flags;
  const steps = flags.finaleFearLastStand
    ? [
      say('fate', SERAPHINE, 'La Crainte', 'Nous nous sommes battus seuls contre tous, et nous sommes encore debout.', { expression: 'stern' }),
      say('clan', KESTREL, 'Le clan', 'Mais les clans ont rayé votre nom des leurs. Le clan sans terre n’existe plus : il ne reste que nous.', { expression: 'wounded' }),
      say('close', ALISTAIR, 'La Crainte', 'Alors nous marcherons sans nom.', { expression: 'stern', effects: [COMPLETE] }),
    ]
    : [
      say('fate', SERAPHINE, 'La Crainte', 'Vous avez accepté votre destin, Alistair, pour que les autres vivent.', { expression: 'wounded' }),
      say('clan', MARIAN, 'Le clan', 'Les clans tiendront parole : votre clan vivra, mais déchu, une fois de plus.', { expression: 'wounded' }),
      say('close', ALISTAIR, 'La Crainte', 'Qu’il vive. C’est assez.', { effects: [COMPLETE] }),
    ];
  return { id: FEAR_CLOSE_DIALOGUE_ID, sceneArtId: 'serpent_general_aftermath', title: ENDING_LABELS.fear, steps: chained(steps) };
}

/** The endings' state-built scenes, by dialogue ID. */
export const EPILOGUE_SCENE_BUILDERS: Readonly<Record<string, (state: Readonly<GameState>) => DialogueSequence>> = Object.freeze({
  [EPILOGUE_DIALOGUE_IDS.respect]: epilogueRespect,
  [EPILOGUE_DIALOGUE_IDS.fear]: epilogueFear,
  [EPILOGUE_DIALOGUE_IDS.balance]: epilogueBalance,
  [FEAR_CLOSE_DIALOGUE_ID]: fearClose,
});
