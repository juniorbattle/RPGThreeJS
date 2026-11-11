/**
 * Set 1.20.0, post-demo Lot 4 — dialogues of the final act, canon since OD-2026-11-09-A (accepted by the operator). Written
 * from the roadmap (§3.6, §3.7 and its status), the operator's decisions (F1 to F4: the Serpent always the finalist,
 * Maelor opening the breach and fleeing through it, an entity that stays unnamed and speaks no line) and the facts
 * established by the four plateaux only; no clan, place, character, object or lore beyond them. The capital, the arena's
 * hosts and the demons stay unnamed. Authored at the post-demo reputation scale (OD-2026-11-08-A), the smallest share (R2).
 *
 * Static scenes are plain sequences. State-built scenes carry the echoes that name their cause: Maelor's advice the
 * company followed on the plateaux and the champions humiliated on his counsel at the Tournament, at the betrayal; the allied chiefs and the clans relevés or humiliés, at the rally; the evidence of
 * the Shadows, the civilians and the citizens, at the last vigil.
 */
import type { DialogueChoice, DialogueSequence, DialogueStep, GameState, NarrativeEffect } from '../../../game/types';

interface Who { speaker: string; actorId: string; side: 'left' | 'right' }
const ALISTAIR: Who = { speaker: 'Alistair', actorId: 'alistair', side: 'left' };
const SERAPHINE: Who = { speaker: 'Sage Séraphine', actorId: 'sage_seraphine', side: 'left' };
const MAELOR: Who = { speaker: 'Intendant Maelor', actorId: 'maelor', side: 'left' };
/** After the betrayal, Maelor stands on the other side. */
const MAELOR_TRAITOR: Who = { speaker: 'Maelor', actorId: 'maelor', side: 'right' };
const MARIAN: Who = { speaker: 'Marian', actorId: 'marian', side: 'left' };
const KESTREL: Who = { speaker: 'Kestrel', actorId: 'kestrel', side: 'left' };
const ALARIC: Who = { speaker: 'Chef Alaric', actorId: 'alaric', side: 'right' };
const BORIN: Who = { speaker: 'Ancien Ours Borin', actorId: 'borin', side: 'right' };
const KAELEN: Who = { speaker: 'Ancien Dragon Kaelen', actorId: 'kaelen', side: 'right' };
const INQUISITOR: Who = { speaker: 'Grand Inquisiteur', actorId: 'grand_inquisitor', side: 'right' };
const RAVEN_CHAMPION: Who = { speaker: 'Champion du Corbeau', actorId: 'finale_raven_champion', side: 'right' };
const WOLF_CHAMPION: Who = { speaker: 'Champion du Loup', actorId: 'finale_wolf_champion', side: 'right' };
const PHOENIX_CHAMPION: Who = { speaker: 'Champion du Phénix', actorId: 'finale_phoenix_champion', side: 'right' };
const SERPENT_CHAMPION: Who = { speaker: 'Champion du Serpent', actorId: 'finale_serpent_champion', side: 'right' };
const CITIZEN: Who = { speaker: 'Habitant de la capitale', actorId: 'finale_citizen', side: 'right' };

type Expression = DialogueStep['expression'];

function say(id: string, who: Who, tag: string, text: string, next: string | null = null,
  options: { expression?: Expression; effects?: NarrativeEffect[]; choices?: DialogueChoice[] } = {}): DialogueStep {
  return { id, speaker: who.speaker, actorId: who.actorId, side: who.side, tag, text, expression: options.expression ?? 'neutral',
    portrait: '', next, effects: options.effects ?? [], choices: options.choices ?? [] };
}

function choice(text: string, next: string | null, effects: NarrativeEffect[], hints: string[],
  extra: Partial<DialogueChoice> = {}): DialogueChoice {
  return { text, next, effects, outcomePreview: { mode: 'soft', hints }, ...extra };
}

const flag = (key: string, value = true): NarrativeEffect => ({ type: 'setFlag', key, value });
const reputation = (amount: number): NarrativeEffect => ({ type: 'addReputation', amount });
const fight = (combatId: string): NarrativeEffect => ({ type: 'startCombat', combatId });
const relation = (clan: 'raven' | 'wolf' | 'phoenix', stance: 'ally' | 'enemy'): NarrativeEffect =>
  ({ type: 'setClanRelation', clan, stance, cause: `finale.tournament.${clan}` });

function scene(id: string, sceneArtId: string, title: string, steps: DialogueStep[]): DialogueSequence {
  return { id, sceneArtId, title, steps };
}

/** Links each step without choices to the next step when it has no explicit target. */
function chained(steps: (DialogueStep | null)[]): DialogueStep[] {
  const present = steps.filter((step): step is DialogueStep => step !== null);
  return present.map((step, index) => (step.choices?.length || step.next !== null || index === present.length - 1)
    ? step : { ...step, next: present[index + 1]!.id });
}

function verdict(clan: 'raven' | 'wolf' | 'phoenix', facts: { spared: string; humiliated: string }, label: string, champion: Who,
  open: string, plea: string, spared: string, humiliated: string): DialogueSequence {
  const clanName = label.replace(/^du /, '');
  return scene(`finale_${clan}_verdict`, 'pre_lion_chief', `Tournoi : ${label}`, [
    say('1', KESTREL, 'Arène', open, '2', { expression: 'stern' }),
    say('2', champion, clanName, plea, '3', { expression: 'wounded' }),
    say('3', MAELOR, 'Intendant', 'Humiliez-le devant les clans. Qu’ils sachent tous qui nous sommes. Dans cette arène, la victoire justifie tout.', '4'),
    say('4', SERAPHINE, 'Sage', 'Le Tournoi est une épreuve de force, mais aussi de sagesse. Un adversaire relevé devant tous peut devenir un allié.', 'choice', { expression: 'mystical' }),
    say('choice', ALISTAIR, 'Verdict', 'Toute l’arène attend notre geste.', null, { expression: 'stern', choices: [
      choice(`Relever le champion ${label}.`, 'spared', [flag(facts.spared), relation(clan, 'ally')],
        [`Le clan ${label} s’en souviendra`, 'Un allié inattendu, peut-être']),
      choice('L’humilier devant les clans.', 'humiliated', [flag(facts.humiliated), reputation(-1), relation(clan, 'enemy')],
        ['Les tribunes acclament', `Le clan ${label} ne l’oubliera pas`]),
    ] }),
    say('spared', champion, clanName, spared, null, { expression: 'grateful' }),
    say('humiliated', MARIAN, 'Soigneuse', humiliated, null, { expression: 'wounded' }),
  ]);
}

// ---------------------------------------------------------------------------------------------------------------------
// Static scenes

export const FINALE_STATIC_DIALOGUES: readonly DialogueSequence[] = Object.freeze([
  scene('finale_arrival', 'lion_briefing', 'L’Arène des Destins', chained([
    say('1', ALISTAIR, 'Tournoi des Grands', 'Quatre Sceaux. L’Arène des Destins nous ouvre ses portes, et toutes les bannières des clans flottent au-dessus des tribunes.', null,
      { expression: 'stern', effects: [flag('finaleTournamentEntered')] }),
    say('2', KESTREL, 'Éclaireuse', 'Le Corbeau, le Loup et le Phénix ont envoyé leurs champions. Le Serpent attend en finale, comme toujours.', null),
    say('3', SERAPHINE, 'Sage', 'Ne laissez pas l’orgueil choisir à votre place. Ce Tournoi est une épreuve de force, mais aussi de sagesse. Et quelque chose de sombre plane sur cette arène : je le sens depuis que nous avons passé les portes.', null, { expression: 'mystical' }),
    say('4', MAELOR, 'Intendant', 'Écrasez-les tous, sans pitié. Personne ne se souvient de la manière, seulement de la victoire.', null),
    say('5', ALISTAIR, 'Clan sans terre', 'Nous nous souviendrons, nous.', null, { expression: 'stern' }),
  ])),
  verdict('raven', { spared: 'finaleRavenSpared', humiliated: 'finaleRavenHumiliated' }, 'du Corbeau', RAVEN_CHAMPION,
    'Le champion du Corbeau est à terre. Ses lames ont glissé hors de sa portée.',
    'Achevez ce que vous avez commencé. Le Corbeau ne demande rien à personne.',
    'Vous auriez pu m’écraser devant tous. Le Corbeau se souviendra de cette main tendue.',
    'Les tribunes ont ri. Le Corbeau, lui, ne rira pas.'),
  verdict('wolf', { spared: 'finaleWolfSpared', humiliated: 'finaleWolfHumiliated' }, 'du Loup', WOLF_CHAMPION,
    'Le champion du Loup ne se relève pas. La foule hurle son nom, ou le nôtre.',
    'Le Loup ne supplie pas. Faites ce que vous avez à faire.',
    'Un étranger qui relève un loup… Le Loup n’oublie jamais une dette.',
    'Il a quitté l’arène sous les huées. Le Loup a de la mémoire.'),
  verdict('phoenix', { spared: 'finalePhoenixSpared', humiliated: 'finalePhoenixHumiliated' }, 'du Phénix', PHOENIX_CHAMPION,
    'Le champion du Phénix a posé un genou au sol. Sa flamme vacille encore.',
    'Le Phénix renaît de ses cendres. Faites de moi ce que vous voudrez.',
    'Vous m’avez relevé quand vous pouviez me briser. Le Phénix saura ce que vaut votre geste.',
    'Ses fidèles ont détourné les yeux. Le Phénix gardera cette honte.'),
  scene('finale_pre_serpent_final', 'pre_lion_chief', 'Finale du Tournoi', chained([
    say('1', SERPENT_CHAMPION, 'Serpent', 'Depuis les plaines du Lion, le Serpent attend ce combat. Venez chercher votre victoire.', null, { expression: 'hostile' }),
    say('2', ALISTAIR, 'Finale', 'Alors finissons-en.', null, { expression: 'stern' }),
  ])),
  scene('finale_arena_chaos', 'shadow_signs', 'La brèche s’ouvre', [
    say('1', KESTREL, 'Éclaireuse', 'Des démons sortent de la brèche. Dans les tribunes, la foule se piétine pour atteindre les portes.', '2', { expression: 'fearful' }),
    say('2', MARIAN, 'Soigneuse', 'Les civils ne sortiront jamais seuls. Il faut quelqu’un entre eux et ces choses.', '3', { expression: 'fearful' }),
    say('3', SERAPHINE, 'Sage', 'Si nous restons, il faudra tenir l’arène le temps qu’ils passent. Le champion changé en démon ne nous laissera pas partir sans combat.', 'choice', { expression: 'stern' }),
    say('choice', ALISTAIR, 'Décision', 'Que faisons-nous ?', null, { expression: 'stern', choices: [
      choice('Couvrir la fuite des civils.', null, [flag('finaleCiviliansProtected'), reputation(3), fight('finale_arena_assault')],
        ['Combat contre le champion changé en démon', 'Les civils couverts']),
      choice('Fuir par les tribunes, sans les attendre.', null, [flag('finaleCiviliansAbandoned'), reputation(-2), fight('finale_arena_assault')],
        ['Combat contre le champion changé en démon', 'La foule laissée derrière vous']),
    ] }),
  ]),
  scene('finale_arena_assault_aftermath', 'post_ruins_guardians', 'L’arène en flammes', chained([
    say('1', SERAPHINE, 'Sage', 'Le champion est tombé une seconde fois. La brèche, elle, grandit encore.', null, { expression: 'mystical' }),
    say('2', KESTREL, 'Éclaireuse', 'Les portes de l’arène sont libres. Derrière, la capitale brûle.', null, { expression: 'stern' }),
  ])),
  scene('finale_capital_arrival', 'forest_fork', 'Portes de l’arène', chained([
    say('1', ALISTAIR, 'Capitale', 'La capitale. Des rues entières en flammes, et la brèche ouverte au-dessus des toits.', null, { expression: 'stern' }),
    say('2', SERAPHINE, 'Sage', 'Maelor nous attend au cœur de la brèche. Tout ce que nous avons vu des Ombres, depuis le premier Sceau, mène là.', null, { expression: 'mystical' }),
    say('3', KESTREL, 'Éclaireuse', 'Les démons tiennent les rues qui descendent de l’arène. Il faudra passer par elles.', null),
  ])),
  scene('finale_trapped_citizens', 'witnesses_on_road', 'Habitants sous les décombres', [
    say('1', KESTREL, 'Éclaireuse', 'Une rue effondrée. Il y a des voix sous les décombres.', '2', { expression: 'fearful' }),
    say('2', CITIZEN, 'Capitale', 'Par ici ! Ma famille est dessous, je n’arrive pas à soulever les poutres !', '3', { expression: 'fearful' }),
    say('3', SERAPHINE, 'Sage', 'Chaque heure compte. Mais ce sont ces gens que la brèche dévorera les premiers.', '4', { expression: 'stern' }),
    say('4', MARIAN, 'Soigneuse', 'Donnez-moi une heure. Je les sortirai de là.', 'choice'),
    say('choice', ALISTAIR, 'Décision', 'Que faisons-nous ?', null, { expression: 'stern', choices: [
      choice('Dégager les habitants.', 'freed', [flag('finaleCitizensFreed'), reputation(1)], ['Une heure perdue', 'Des habitants sauvés']),
      choice('Les laisser et gagner la brèche.', 'left', [flag('finaleCitizensLeft'), reputation(-1)], ['La brèche plus tôt', 'Des voix laissées derrière vous']),
    ] }),
    say('freed', CITIZEN, 'Gratitude', 'Vous êtes restés. Personne d’autre ne l’aurait fait.', null, { expression: 'grateful' }),
    say('left', MARIAN, 'Soigneuse', 'Leurs voix nous suivent jusqu’au bout de la rue.', null, { expression: 'wounded' }),
  ]),
  scene('finale_breach_confrontation', 'serpent_pursuit_pre_combat', 'La brèche', chained([
    say('1', MAELOR_TRAITOR, 'Maelor', 'Vous voilà. Quatre Sceaux, des clans derrière vous ou contre vous… et toujours la même question : à quoi vous servaient-ils vraiment ?', null, { expression: 'hostile' }),
    say('2', SERAPHINE, 'Sage', 'Ce qui se tient derrière lui n’a aucun nom que je connaisse. Il faudra l’abattre quand même.', null, { expression: 'fearful' }),
    say('3', ALISTAIR, 'Clan sans terre', 'Tu as marché avec nous depuis le début, Maelor. Ici, ça s’arrête.', null, { expression: 'stern' }),
    say('4', MAELOR_TRAITOR, 'Maelor', 'Alors venez.', null, { expression: 'hostile' }),
  ])),
  scene('finale_breach_aftermath', 'serpent_general_aftermath', 'La brèche vacille', chained([
    say('1', KESTREL, 'Éclaireuse', 'Maelor est tombé le premier. Il n’a rien dit de plus.', null, { expression: 'stern' }),
    say('2', SERAPHINE, 'Sage', 'L’entité est tombée à son tour. La brèche vacille, mais elle est encore ouverte.', null, { expression: 'mystical' }),
    say('3', ALISTAIR, 'Clan sans terre', 'Alors il reste une chose à faire.', null, { expression: 'stern' }),
  ])),
  scene('finale_act_end', 'epilogue', 'Avant les épilogues', chained([
    say('1', SERAPHINE, 'Chronique', 'Refermer la brèche, maintenant. Ce qui suivra dépendra de tout ce que nous avons fait depuis le premier Sceau.', null,
      { expression: 'stern', effects: [{ type: 'completePlateau', plateauId: 'finale' }] }),
  ])),
]);

// ---------------------------------------------------------------------------------------------------------------------
// State-built scenes

/** Maelor's advice the company followed, in his words: the Shadows' interest served on his counsel. */
function followedAdvice(flags: Readonly<Record<string, boolean>>): string[] {
  return [
    flags.bearMinesSeized ? 'le filon sombre gardé pour le clan' : null,
    flags.dragonCrystalKept ? 'le Cristal gardé pour le clan' : null,
    flags.scorpionCodexKept ? 'le codex gardé pour le clan' : null,
    flags.scorpionShadowBurned ? 'la page souillée brûlée sur mon conseil' : null,
  ].filter((item): item is string => item !== null);
}

function listFrench(items: readonly string[]): string {
  return items.length <= 1 ? items[0] ?? '' : `${items.slice(0, -1).join(', ')} et ${items.at(-1)}`;
}

/** The champions humiliated at the Tournament, as Maelor urged at each verdict. */
function humiliatedChampions(flags: Readonly<Record<string, boolean>>): string | null {
  const clans = [
    flags.finaleRavenHumiliated ? 'du Corbeau' : null,
    flags.finaleWolfHumiliated ? 'du Loup' : null,
    flags.finalePhoenixHumiliated ? 'du Phénix' : null,
  ].filter((item): item is string => item !== null);
  if (!clans.length) return null;
  return clans.length === 1 ? `le champion ${clans[0]} humilié devant les clans` : `les champions ${listFrench(clans)} humiliés devant les clans`;
}

function betrayalAdviceLine(flags: Readonly<Record<string, boolean>>): string {
  const advice = followedAdvice(flags);
  const arena = humiliatedChampions(flags);
  if (advice.length && arena) {
    return `Vous m’avez écouté plus souvent que vous ne le croyez : ${listFrench(advice)}. Et dans cette arène encore, ${arena}. Chaque fois, vous avez servi ceux que je sers.`;
  }
  if (advice.length) return `Vous m’avez écouté plus souvent que vous ne le croyez : ${listFrench(advice)}. Chaque fois, vous avez servi ceux que je sers.`;
  if (arena) return `Dans cette arène, vous m’avez enfin écouté : ${arena}. Vous avez servi ceux que je sers.`;
  return 'Vous ne m’avez jamais écouté. Peu importe : il me suffisait d’entrer avec vous dans cette arène.';
}

function finaleBetrayal(state: Readonly<GameState>): DialogueSequence {
  const adviceLine = betrayalAdviceLine(state.flags);
  return scene('finale_betrayal', 'shadow_signs', 'La trahison', [
    say('open', KESTREL, 'Éclaireuse', 'Le champion du Serpent tombe… et Maelor s’avance au milieu de l’arène, un artefact à la main.', 'reveal', { expression: 'fearful' }),
    say('reveal', MAELOR_TRAITOR, 'Trahison', 'Vous avez cherché les Ombres Silencieuses dans chaque clan. Elles marchaient avec vous depuis le premier Sceau.', 'advice', { expression: 'hostile' }),
    say('advice', MAELOR_TRAITOR, 'Conseils', adviceLine, 'breach', { expression: 'hostile' }),
    say('breach', MAELOR_TRAITOR, 'La brèche', 'Regardez.', 'champion', { expression: 'hostile', effects: [flag('finaleBreachOpened')] }),
    say('champion', SERAPHINE, 'Sage', 'La brèche… Elle s’ouvre au cœur de l’arène. Le champion du Serpent se relève, et ce n’est plus un homme.', 'flee', { expression: 'fearful' }),
    say('flee', MAELOR_TRAITOR, 'Maelor', 'Nous nous reverrons au cœur de la brèche.', 'alistair', { expression: 'hostile' }),
    say('alistair', ALISTAIR, 'Clan sans terre', 'Maelor !', null, { expression: 'stern' }),
  ]);
}

function finaleAlliedRally(state: Readonly<GameState>): DialogueSequence {
  const flags = state.flags;
  const lion = flags.serpentGeneralDefeated
    ? say('lion', ALARIC, 'Le Lion', 'Le Lion n’a pas oublié votre jugement : les guerriers d’Alaric tiennent parole.', null, { expression: 'stern' })
    : flags.lionTrialWon
      ? say('lion', KESTREL, 'Le Lion', 'Pas de bannière du Lion. Alaric garde ses guerriers loin de nous.', null)
      : null;
  const bear = flags.bearMasterSpyDefeated
    ? say('bear', BORIN, 'L’Ours', 'Vous avez rendu leurs galeries à mes mineurs, et les guerriers de Borin tiennent parole.', null, { expression: 'stern' })
    : flags.bearTrialWon
      ? say('bear', KESTREL, 'L’Ours', 'Des guerriers de l’Ours rôdent dans les rues : les guerriers de Borin n’ont pas oublié le Sceau arraché.', null, { expression: 'stern' })
      : null;
  const dragon = flags.dragonShadowShamanDefeated
    ? say('dragon', KAELEN, 'Le Dragon', 'Le Dragon pèse longtemps, et il n’oublie pas : les gardiens de Kaelen tiennent parole.', null, { expression: 'stern' })
    : flags.dragonTrialWon
      ? say('dragon', KESTREL, 'Le Dragon', 'Des gardiens du Dragon barrent une rue : les gardiens de Kaelen n’ont pas oublié l’épreuve.', null, { expression: 'stern' })
      : null;
  const scorpion = flags.scorpionShadowProphetDefeated
    ? say('scorpion', INQUISITOR, 'Le Scorpion', 'Mes érudits ont tout consigné, même ceci : les érudits du Grand Inquisiteur tiennent parole.', null, { expression: 'stern' })
    : flags.scorpionTrialWon
      ? say('scorpion', KESTREL, 'Le Scorpion', 'Des érudits du Scorpion nous observent depuis les toits : les érudits du Grand Inquisiteur n’ont pas oublié.', null, { expression: 'stern' })
      : null;
  const rival = (clan: string, spared: boolean, humiliated: boolean, label: string) => spared
    ? say(clan, KESTREL, `Le clan ${label}`, `Avec les siens, le champion ${label} que vous avez relevé dans l’arène nous rejoint.`, null)
    : humiliated
      ? say(clan, KESTREL, `Le clan ${label}`, `Ses guerriers barrent une rue : ils n’ont pas pardonné le champion ${label} humilié devant les clans.`, null, { expression: 'stern' })
      : null;
  return scene('finale_allied_rally', 'lion_briefing', 'Ralliement des clans', chained([
    say('open', KESTREL, 'Éclaireuse', 'Des bannières se rassemblent à la croisée des rues. Certaines viennent à nous ; d’autres nous attendent.', null),
    lion, bear, dragon, scorpion,
    rival('raven', Boolean(flags.finaleRavenSpared), Boolean(flags.finaleRavenHumiliated), 'du Corbeau'),
    rival('wolf', Boolean(flags.finaleWolfSpared), Boolean(flags.finaleWolfHumiliated), 'du Loup'),
    rival('phoenix', Boolean(flags.finalePhoenixSpared), Boolean(flags.finalePhoenixHumiliated), 'du Phénix'),
    say('close', SERAPHINE, 'Sage', 'Ceux qui marchent avec nous et ceux qui nous attendent dans les rues : chaque clan se souvient de la manière dont nous avons avancé.', null, { expression: 'mystical' }),
    say('go', ALISTAIR, 'Clan sans terre', 'Alors avançons. La brèche n’attendra pas.', null, { expression: 'stern' }),
  ]));
}

function finaleLastVigil(state: Readonly<GameState>): DialogueSequence {
  const flags = state.flags;
  const evidence = [
    flags.shadowRevealed ? 'les preuves des Ombres confiées à Alaric' : null,
    flags.shadowConcealed ? 'les preuves des Ombres que nous gardons depuis les plaines' : null,
    flags.bearDarkOreEvidence ? 'l’éclat que vous avez rapporté des mines de l’Ours' : null,
    flags.dragonShadowEvidence ? 'l’éclat de la souillure du Cristal' : null,
    flags.scorpionShadowEvidence ? 'la page souillée du codex' : null,
  ].filter((item): item is string => item !== null);
  const evidenceLine = evidence.length
    ? `Voici ce que nous savons des Ombres : ${listFrench(evidence)}. La même marque, partout où Maelor nous a suivis.`
    : 'Nous n’avons gardé aucune preuve des Ombres. Il faudra comprendre la brèche en y entrant.';
  const civilians = flags.finaleCiviliansProtected
    ? 'Des nouvelles des portes : les civils que vous avez couverts dans l’arène ont trouvé refuge hors des murs.'
    : flags.finaleCiviliansAbandoned
      ? 'Je pense encore à la foule laissée dans les tribunes.'
      : 'Personne n’a de nouvelles de l’arène.';
  const citizens = flags.finaleCitizensFreed
    ? 'Dans la rue effondrée, les habitants que vous avez dégagés des décombres nous ont montré le chemin le plus sûr.'
    : flags.finaleCitizensLeft
      ? 'Nous sommes passés vite, et je pense encore à tous les habitants laissés sous les décombres.'
      : 'La grande place est tombée. La route de la brèche est ouverte.';
  return scene('finale_last_vigil', 'lion_refuge', 'Dernière veillée', chained([
    say('1', ALISTAIR, 'Veillée', 'La dernière nuit avant la brèche. Plus de Sceau à gagner : seulement ce que nous avons fait pour en arriver là.', null, { expression: 'stern' }),
    say('evidence', SERAPHINE, 'Les Ombres', evidenceLine, null, { expression: 'mystical' }),
    say('civilians', MARIAN, 'Soigneuse', civilians, null),
    say('citizens', KESTREL, 'Éclaireuse', citizens, null),
    say('2', SERAPHINE, 'Sage', 'Demain, Maelor, et ce qu’il sert. Je ne sais pas ce qui attend derrière lui. Je sais seulement que nous y entrerons ensemble.', null, { expression: 'mystical' }),
  ]));
}

/** The final act's state-built scenes, by dialogue ID. */
export const FINALE_SCENE_BUILDERS: Readonly<Record<string, (state: Readonly<GameState>) => DialogueSequence>> = Object.freeze({
  finale_betrayal: finaleBetrayal,
  finale_allied_rally: finaleAlliedRally,
  finale_last_vigil: finaleLastVigil,
});

/** Static final-act dialogues registered in the post-demo content registry. */
export const FINALE_DIALOGUES: readonly DialogueSequence[] = FINALE_STATIC_DIALOGUES;
