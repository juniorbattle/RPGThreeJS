/**
 * Set 1.20.0, post-demo Lot 1 — DRAFT dialogues of the Bear plateau. Written from the roadmap (§3.2 and its status), the
 * demo's established facts and the operator's decisions only; no clan, place, character, object or lore beyond them.
 * Not canon until the operator approves the plateau. Authored at the post-demo reputation scale (OD-2026-11-08-A).
 *
 * Static scenes are plain sequences. State-built scenes carry the echoes that name their cause: the Lion's outcome and
 * Bois-Clair before Borin, Maelor's memory of the coffers, the witnesses and the Shadow altar, the Raven's pact at the
 * mines, the rescued miners, and the Master Spy's orders.
 */
import type { DialogueChoice, DialogueSequence, DialogueStep, GameState, NarrativeEffect } from '../../../game/types';

interface Who { speaker: string; actorId: string; side: 'left' | 'right' }
const ALISTAIR: Who = { speaker: 'Alistair', actorId: 'alistair', side: 'left' };
const SERAPHINE: Who = { speaker: 'Sage Séraphine', actorId: 'sage_seraphine', side: 'left' };
const MAELOR: Who = { speaker: 'Intendant Maelor', actorId: 'maelor', side: 'left' };
const MARIAN: Who = { speaker: 'Marian', actorId: 'marian', side: 'left' };
const KESTREL: Who = { speaker: 'Kestrel', actorId: 'kestrel', side: 'left' };
const BORIN: Who = { speaker: 'Ancien Ours Borin', actorId: 'borin', side: 'right' };
const MINER: Who = { speaker: 'Mineur de l’Ours', actorId: 'bear_miner', side: 'right' };
const MESSENGER: Who = { speaker: 'Messager du Corbeau', actorId: 'raven_messenger', side: 'right' };
const RAVEN_CHIEF: Who = { speaker: 'Chef des mineurs du Corbeau', actorId: 'raven_miner_chief', side: 'right' };
const SPY: Who = { speaker: 'Maître Espion du Corbeau', actorId: 'raven_master_spy', side: 'right' };

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
const gold = (amount: number): NarrativeEffect => ({ type: 'addGold', amount });
const item = (itemId: string, quantity: number): NarrativeEffect => ({ type: 'addItem', itemId, quantity });
const fight = (combatId: string): NarrativeEffect => ({ type: 'startCombat', combatId });

function scene(id: string, sceneArtId: string, title: string, steps: DialogueStep[]): DialogueSequence {
  return { id, sceneArtId, title, steps };
}

/** Links each step without choices to the next step when it has no explicit target. */
function chained(steps: (DialogueStep | null)[]): DialogueStep[] {
  const present = steps.filter((step): step is DialogueStep => step !== null);
  return present.map((step, index) => (step.choices?.length || step.next !== null || index === present.length - 1)
    ? step : { ...step, next: present[index + 1]!.id });
}

// ---------------------------------------------------------------------------------------------------------------------
// Static scenes

export const BEAR_STATIC_DIALOGUES: readonly DialogueSequence[] = Object.freeze([
  scene('bear_arrival', 'forest_fork', 'Pied des Montagnes', chained([
    say('1', ALISTAIR, 'Montagnes de la Résilience', 'Les Montagnes de la Résilience. Le Sceau du Lion pèse dans notre coffre, et pourtant ici personne ne nous attend.', null, { expression: 'stern' }),
    say('2', SERAPHINE, 'Sage', 'Le Clan de l’Ours garde ces pentes depuis plus longtemps que nos chroniques. Il ne juge pas un étranger sur un Sceau, mais sur ce qu’il fait de sa montagne.', null, { expression: 'mystical' }),
    say('3', MAELOR, 'Intendant', 'Alors montrons-lui ce que nous valons, et voyons ce que sa montagne peut nous donner en retour.'),
  ])),
  scene('bear_raven_messenger', 'mystery_ambush', 'Messager du Corbeau', [
    say('1', KESTREL, 'Éclaireuse', 'Quelqu’un nous attend sous les sapins, à l’écart du sentier. Plumes noires sur l’épaule, mains bien visibles. Il veut qu’on le voie.', '2', { expression: 'stern' }),
    say('2', MESSENGER, 'Corbeau', 'Pas d’épée, pas de piège. Le Corbeau sait que l’Ours vous envoie. Il sait aussi qu’un clan sans terre a plus besoin d’or que d’honneur.', '3'),
    say('3', MESSENGER, 'Offre', 'Prenez cette bourse. Montez, regardez ailleurs quand nos chariots passent, et redescendez avec votre Sceau. Personne n’aura à saigner.', '4'),
    say('4', MAELOR, 'Intendant', 'Personne ne saura qui a regardé ailleurs, et la bourse est lourde. Je ne dis pas d’accepter. Je dis seulement que l’honneur de l’Ours ne nous nourrira pas au prochain col.', '5'),
    say('5', SERAPHINE, 'Sage', 'Un clan qui paie pour qu’on détourne les yeux creuse quelque chose qu’il ne veut pas montrer. Souvenons-nous pourquoi Borin nous a reçus.', 'offer', { expression: 'mystical' }),
    say('offer', ALISTAIR, 'Réponse', 'Votre réponse, alors.', null, { expression: 'stern', choices: [
      choice('Refuser l’or et prévenir l’Ours.', 'refused', [flag('bearRavenOfferRefused'), reputation(1)], ['Borin saura ce que le Corbeau a tenté']),
      choice('Prendre la bourse et regarder ailleurs.', 'pact', [flag('bearRavenPact'), gold(80), reputation(-2)], ['80 or', 'Une promesse faite au Corbeau']),
    ] }),
    say('refused', MESSENGER, 'Refus', 'Comme vous voudrez. Le Corbeau se souvient aussi des portes qu’on lui ferme.', 'warned', { expression: 'hostile' }),
    say('warned', KESTREL, 'Éclaireuse', 'Je file prévenir la patrouille de l’Ours. Ils sauront qu’un messager du Corbeau rôde sur leur col.', null),
    say('pact', MESSENGER, 'Pacte', 'Sage décision. Quand vous verrez nos chariots, souvenez-vous que vous ne les avez pas vus.', null),
  ]),
  scene('bear_trapped_miners', 'forest_fork', 'Mineurs pris au piège', [
    say('1', MARIAN, 'Soigneuse', 'Écoutez… Des coups, sous les pierres. Quelqu’un frappe de l’autre côté de l’éboulement.', '2', { expression: 'fearful' }),
    say('2', MINER, 'Sous l’éboulement', 'Nous sommes quatre ! La galerie s’est effondrée quand les charges du Corbeau ont sauté. L’air manque !', '3', { expression: 'fearful' }),
    say('3', MAELOR, 'Intendant', 'Dégager ces pierres nous coûtera la journée, et le Corbeau ne nous attendra pas. Leurs sacs de minerai sont là, sur le côté. Sous les pierres, ils ne servent plus à personne.', '4'),
    say('4', SERAPHINE, 'Sage', 'Ce sont les mineurs de l’Ours. Borin nous a confié sa montagne ; ses gens en font partie.', 'choice', { expression: 'stern' }),
    say('choice', ALISTAIR, 'Décision', 'Décidons, et vite.', null, { expression: 'stern', choices: [
      choice('Dégager les mineurs, quel qu’en soit le temps.', 'rescued', [flag('bearMinersRescued'), reputation(1)], ['Une journée perdue', 'Des mineurs de l’Ours sauvés']),
      choice('Prendre leur minerai et poursuivre.', 'robbed', [flag('bearMinersRobbed'), item('iron_ore', 2), reputation(-2)], ['2 minerais pour la forge', 'Des mineurs laissés sous les pierres']),
    ] }),
    say('rescued', MINER, 'Sauvés', 'Vous êtes venus pour nous ? Pour des mineurs ? Borin saura ce que vous avez fait, je vous le promets.', null, { expression: 'grateful' }),
    say('robbed', MARIAN, 'Soigneuse', 'Nous les entendrons frapper encore longtemps, Maelor. Longtemps après avoir compté ce minerai.', null, { expression: 'wounded' }),
  ]),
  scene('bear_raven_traps', 'forest_fork', 'Pièges du Corbeau', [
    say('1', KESTREL, 'Éclaireuse', 'Des fils tendus en travers du sentier, et de la poudre dans des outres sous les pierres. Ce sont des pièges du Corbeau, posés pour les patrouilles de l’Ours.', '2', { expression: 'stern' }),
    say('2', MAELOR, 'Intendant', 'Cette poudre vaut de l’or dans une forge, et davantage dans un combat. Le Corbeau l’a payée ; nous pourrions au moins la lui reprendre.', '3'),
    say('3', SERAPHINE, 'Sage', 'Si nous la prenons sans rien dire, les prochains pièges seront posés ailleurs, et l’Ours n’en saura rien.', 'choice'),
    say('choice', ALISTAIR, 'Décision', 'Que fait-on de ces pièges ?', null, { choices: [
      choice('Désarmer les pièges et les signaler aux patrouilles.', 'marked', [flag('bearTrapsMarked'), reputation(1)], ['Les patrouilles de l’Ours prévenues']),
      choice('Garder la poudre pour la compagnie.', 'looted', [flag('bearTrapsLooted'), item('bomb', 1), reputation(-1)], ['1 bombe', 'Les pièges suivants resteront secrets']),
    ] }),
    say('marked', KESTREL, 'Éclaireuse', 'Je laisse notre marque sur chaque pierre piégée. Les patrouilles la reconnaîtront.', null),
    say('looted', KESTREL, 'Éclaireuse', 'Je prends la poudre. Si l’Ours trouve d’autres pièges plus haut, il ne saura pas que nous savions.', null),
  ]),
  scene('bear_outpost_gathering', 'lion_refuge', 'Avant-poste de l’Ours', chained([
    say('1', ALISTAIR, 'Avant-poste de l’Ours', 'Des murs de pierre et des feux gardés. Pour la première fois depuis le col, personne ne nous guette depuis les rochers.'),
    say('2', MAELOR, 'Intendant', 'Les guerriers de l’Ours ne nous quittent pas des yeux. Un Sceau du Lion pèse peu à cette altitude.'),
    say('3', SERAPHINE, 'Sage', 'Ils apprendront à nous connaître par ce que nous ferons dans leurs mines. Reposons-nous, et préparons la suite.'),
  ])),
  scene('bear_ancient_relic', 'mystery_shrine', 'Galerie effondrée', [
    say('1', KESTREL, 'Éclaireuse', 'Cette galerie s’est effondrée il y a longtemps. Sous la poussière, un objet sculpté : un ours dressé, taillé dans une pierre sombre et sertie d’une gemme rouge.', '2'),
    say('2', SERAPHINE, 'Sage', 'C’est un objet sacré du clan. Il appartenait à un sanctuaire de l’Ours ; quelqu’un l’a caché ici, peut-être pour le protéger.', '3', { expression: 'mystical' }),
    say('3', MAELOR, 'Intendant', 'Ou pour le vendre. Un artefact pareil ouvrirait bien des portes, loin d’ici.', 'choice'),
    say('choice', ALISTAIR, 'Décision', 'Et nous, qu’en faisons-nous ?', null, { choices: [
      choice('Rendre l’artefact au sanctuaire de l’Ours.', 'returned', [flag('bearRelicReturned'), reputation(1)], ['L’Ours retrouvera son artefact']),
      choice('Garder l’artefact.', 'kept', [flag('bearRelicKept'), item('red_gem', 1), reputation(-1)], ['Une gemme rouge', 'Un objet sacré soustrait à l’Ours']),
    ] }),
    say('returned', SERAPHINE, 'Sage', 'Nous le confierons au premier sanctuaire de l’Ours sur notre route. Ce qui appartient à la montagne doit lui revenir.', null),
    say('kept', MAELOR, 'Intendant', 'Il voyagera avec nous. Sa gemme paiera une lame, le jour venu.', null),
  ]),
  scene('bear_pre_mines_defense', 'shadow_signs', 'Défense des mines sacrées', chained([
    say('1', RAVEN_CHIEF, 'Corbeau', 'Vous voulez les galeries pour l’Ours ? Descendez les chercher.', null, { expression: 'hostile' }),
  ])),
  scene('bear_mines_defense_aftermath', 'shadow_signs', 'Les galeries reprises', chained([
    say('1', MINER, 'Mineurs de l’Ours', 'Les galeries sont à nous de nouveau ! Borin l’apprendra avant la nuit.', null, { expression: 'grateful' }),
    say('2', SERAPHINE, 'Sage', 'Ce chef n’agissait pas seul. Quelqu’un payait ces treuils et ces chariots.', null, { expression: 'mystical' }),
  ])),
  scene('bear_pre_mines_seizure', 'shadow_signs', 'Prise du filon', chained([
    say('1', RAVEN_CHIEF, 'Corbeau', 'Alors vous aussi, vous venez pour le filon. Au moins, le Corbeau ne s’en cache pas.', null, { expression: 'hostile' }),
  ])),
  scene('bear_mines_seizure_aftermath', 'shadow_signs', 'Le filon pris', chained([
    say('1', MAELOR, 'Intendant', 'Le filon est à nous. Plantons notre bannière à l’entrée ; l’Ours devra traiter avec nous, maintenant.'),
    say('2', MARIAN, 'Soigneuse', 'Ou il viendra nous la reprendre.', null, { expression: 'stern' }),
  ])),
  scene('bear_raven_camp', 'mystery_ambush', 'Campement du Corbeau', chained([
    say('1', KESTREL, 'Éclaireuse', 'Le campement du Corbeau, abandonné en hâte. Les feux sont encore tièdes, les tentes renversées.'),
    say('2', KESTREL, 'Ordres', 'Des ordres, pliés dans un coffre. La même écriture partout, la même signature : le Maître Espion. Celui qui dirigeait les mineurs recevait ses ordres de plus haut.', null, { expression: 'stern', effects: [flag('bearSpyOrdersFound')] }),
    say('3', SERAPHINE, 'Sage', 'Le Maître Espion du Corbeau. Borin voudra lire ces ordres, et nous aussi.', null, { expression: 'mystical' }),
  ])),
  scene('bear_mountain_shrine', 'mystery_shrine', 'Sanctuaire de la montagne', [
    say('1', SERAPHINE, 'Sage', 'Un sanctuaire de l’Ours. Des offrandes laissées à la montagne : des outils de mineur, des pierres polies, une bourse de pièces anciennes.', '2', { expression: 'mystical' }),
    say('2', MAELOR, 'Intendant', 'Personne ne viendra les compter avant des mois. Les offrandes ne nourrissent personne.', '3'),
    say('3', MARIAN, 'Soigneuse', 'Ce sont des prières, Maelor. Pas une caisse.', 'choice', { expression: 'stern' }),
    say('choice', ALISTAIR, 'Décision', 'Que laissons-nous à la montagne ?', null, { choices: [
      choice('Respecter les offrandes et repartir.', 'honoured', [flag('bearShrineHonoured'), reputation(1)], ['Le sanctuaire intact']),
      choice('Prendre les offrandes.', 'plundered', [flag('bearShrinePlundered'), gold(50), reputation(-1)], ['50 or', 'Un sanctuaire de l’Ours pillé']),
    ] }),
    say('honoured', SERAPHINE, 'Sage', 'La montagne garde ce qu’on lui donne. Laissons-lui au moins cela.', null),
    say('plundered', MAELOR, 'Intendant', 'Cinquante pièces. La montagne ne réclamera rien ; ses gardiens, peut-être.', null),
  ]),
  scene('bear_vigil', 'lion_refuge', 'Veillée avant le Sceau', chained([
    say('1', ALISTAIR, 'Veillée', 'Borin nous attend demain. Tout ce que nous avons fait dans ces montagnes sera posé devant lui.', null, { expression: 'stern' }),
    say('2', SERAPHINE, 'Sage', 'Ce qui comptera, ce ne sont pas nos mots devant lui, mais ce que ses mineurs et sa montagne diront de nous.', null, { expression: 'mystical' }),
    say('3', MAELOR, 'Intendant', 'Deux Sceaux, bientôt. Plus nous en portons, plus les clans nous regardent comme une menace. Il faudra un jour décider à quoi ils nous servent vraiment.'),
  ])),
  scene('bear_master_spy_aftermath', 'lion_finale_judgement', 'Le Maître Espion vaincu', chained([
    say('1', SPY, 'Vaincu', 'Le minerai… n’en était qu’une part. Ceux que nous servons ont besoin de bien d’autres choses, et vos Sceaux n’y changeront rien.', null, { expression: 'wounded' }),
    say('2', SERAPHINE, 'Sage', 'Les Ombres, encore, derrière un autre clan. Le Corbeau n’était qu’une main de plus.', null, { expression: 'mystical' }),
  ])),
  scene('bear_borin_pre_combat', 'lion_finale_judgement', 'Épreuve de l’Ours', chained([
    say('1', BORIN, 'Ancien Ours', 'Vous voulez mon Sceau par la force ? Alors gagnez-le selon la loi de la montagne : mes guerriers et moi, contre votre compagnie.', null, { expression: 'hostile' }),
    say('2', ALISTAIR, 'Épreuve', 'Nous l’assumerons.', null, { expression: 'stern' }),
  ])),
  scene('bear_trial_aftermath', 'lion_finale_judgement', 'Le Sceau arraché', chained([
    say('1', BORIN, 'Ancien Ours', 'Le Sceau est à vous. La montagne l’a vu, mes guerriers aussi. Ne revenez pas chercher autre chose ici.', null, { expression: 'wounded' }),
  ])),
]);

// ---------------------------------------------------------------------------------------------------------------------
// State-built scenes

function bearAudience(state: Readonly<GameState>): DialogueSequence {
  const flags = state.flags;
  const lionLine = flags.serpentGeneralDefeated
    ? 'Alaric vous a reconnu, dit-on, et le général Serpent est tombé sous vos lames. Le Lion parle bien de vous. L’Ours écoutera, mais il jugera par lui-même.'
    : flags.lionTrialWon
      ? 'On m’a rapporté le Sceau du Lion, pris par l’épreuve. Le Lion respecte la loi du duel. L’Ours, lui, se souvient de ceux qui forcent les portes.'
      : 'Vous portez le Sceau du Lion. Ce que vous valez, je le jugerai ici.';
  const reputationLine = flags.missionSuccess
    ? 'Les marchands qui montent des plaines racontent que vous avez ramené les captifs de Bois-Clair. C’est pour cela que je vous reçois au lieu de vous faire raccompagner au col.'
    : flags.missionGreed
      ? 'Les marchands des plaines racontent aussi qu’à Bois-Clair, vous avez emporté les coffres pendant que les captifs partaient. Je vous reçois parce que le Lion vous a donné son Sceau, pas parce que je vous crois.'
      : 'Les plaines parlent peu de vous. Tant mieux : vous commencerez ici sans dette ni crédit.';
  return scene('bear_audience', 'lion_briefing', 'Audience de Borin', [
    say('open', BORIN, 'Ancien Ours', 'Le Clan du Corbeau creuse nos mines sacrées sans notre accord. Il arrache à la montagne ce qu’elle ne donne qu’à ceux qui la respectent.', 'lion', { expression: 'stern' }),
    say('lion', BORIN, 'Sceau du Lion', lionLine, 'reputation', { expression: 'stern' }),
    say('reputation', BORIN, 'Rumeurs des plaines', reputationLine, 'request', { expression: flags.missionGreed ? 'hostile' : 'stern' }),
    say('request', BORIN, 'Requête', 'Repoussez le Corbeau hors des galeries, et le Sceau de l’Ours entendra votre nom. Échouez, ou servez-vous en chemin, et la montagne s’en souviendra.', 'seraphine', { expression: 'stern' }),
    say('seraphine', SERAPHINE, 'Sage', 'Ces mines ne sont pas qu’un trésor, Ancien Borin. Si le Corbeau creuse au-delà de ce que la montagne supporte, l’équilibre de ces vallées tombera avec ses galeries. Avant de tirer l’épée, sachons pourquoi il creuse si profond.', 'maelor', { expression: 'mystical' }),
    say('maelor', MAELOR, 'Intendant', 'Ou laissons l’Ours et le Corbeau s’user l’un contre l’autre. Deux clans affaiblis devant des mines ouvertes… Je dis seulement ce que tout le monde pensera en voyant ces galeries.', 'alistair'),
    say('alistair', ALISTAIR, 'Clan sans terre', 'Nous ne sommes pas venus vider la montagne d’un autre clan.', 'mandate', { expression: 'stern' }),
    say('mandate', BORIN, 'Mandat', 'Alors, étrangers. Défendrez-vous les mines de l’Ours ?', null, { expression: 'stern', choices: [
      choice('Défendre les mines sans condition.', 'accepted', [flag('bearMandateHonour'), reputation(1)], ['Parole claire devant l’Ours', 'Borin observe votre conduite']),
      choice('Accepter, contre une part du minerai repris.', 'share', [flag('bearMandateOreShare'), gold(50), reputation(-1)], ['50 or d’avance', 'Chaque part réclamée pèsera dans le jugement']),
    ] }),
    say('accepted', BORIN, 'Parole', 'Alors montez. Les galeries sont haut dans la montagne, et le Corbeau a des yeux sur chaque col.', null, { expression: 'stern' }),
    say('share', BORIN, 'Parole chiffrée', 'Vous chiffrez déjà ce que vous n’avez pas repris. Voici une avance, puisque vous la voulez. La montagne a de la mémoire : elle se souviendra de ce que vous avez réclamé.', null, { expression: 'hostile' }),
  ]);
}

function bearOreConvoy(state: Readonly<GameState>): DialogueSequence {
  const greed = state.flags.missionGreed
    ? ' À Bois-Clair, la bourse du clan nous a tenus debout. Je ne vois pas pourquoi la montagne serait différente.' : '';
  return scene('bear_ore_convoy', 'reserve_trail', 'Convoi de minerai', [
    say('open', KESTREL, 'Éclaireuse', 'Un convoi descend des galeries : des chariots bâchés, chargés de pierres noires qui ne brillent pas. Escorte légère, deux gardes et un conducteur.', 'maelor', { expression: 'stern' }),
    say('maelor', MAELOR, 'Intendant', `Du minerai volé à l’Ours. Si nous le prenons, personne ne le rendra jamais à Borin de toute façon. Autant qu’il serve à quelqu’un.${greed}`, 'seraphine'),
    say('seraphine', SERAPHINE, 'Sage', 'Ce minerai ne ressemble à rien de ce que j’ai vu. Borin doit savoir ce que le Corbeau emporte, avant que nous décidions de ce qu’il vaut.', 'choice', { expression: 'mystical' }),
    say('choice', ALISTAIR, 'Décision', 'Le convoi passe bientôt.', null, { choices: [
      choice('Marquer le convoi et prévenir Borin.', 'reported', [flag('bearConvoyReported'), reputation(1)], ['Borin saura ce que le Corbeau emporte']),
      choice('Saisir le minerai pour le clan.', 'seized', [flag('bearConvoySeized'), item('iron_ore', 3), gold(40), reputation(-1)], ['3 minerais et 40 or', 'Un convoi détourné']),
    ] }),
    say('reported', KESTREL, 'Éclaireuse', 'Je les suis jusqu’au pont et je laisse notre signe sur la dernière borne. Les éclaireurs de l’Ours sauront où chercher.', null),
    say('seized', KESTREL, 'Éclaireuse', 'Les gardes s’enfuient sans combattre. Les chariots sont à nous. Ce minerai sent la pierre froide… et autre chose.', null),
  ]);
}

function bearSacredMines(state: Readonly<GameState>): DialogueSequence {
  const pact = Boolean(state.flags.bearRavenPact);
  return scene('bear_sacred_mines', 'shadow_signs', 'Les mines sacrées', chained([
    say('open', KESTREL, 'Éclaireuse', 'L’entrée des galeries sacrées. Des tentes du Corbeau, des treuils, des chariots. Ils creusent encore, et leur chef surveille la descente.', null, { expression: 'stern' }),
    pact
      ? say('raven', RAVEN_CHIEF, 'Corbeau', 'Les étrangers du col. Vous aviez promis de regarder ailleurs. Alors regardez ailleurs, et laissez-nous finir.', null)
      : say('chief', RAVEN_CHIEF, 'Corbeau', 'Encore des étrangers payés par l’Ours ? Cette montagne ne lui appartient pas plus qu’à nous. Le filon va à qui sait le prendre.', null, { expression: 'hostile' }),
    say('seraphine', SERAPHINE, 'Sage', 'Ces galeries sont sacrées pour l’Ours, et ce filon ne sent pas la pierre honnête. Reprenons-les, et rendons-les à Borin.', null, { expression: 'mystical' }),
    say('maelor', MAELOR, 'Intendant', 'Ou reprenons-les pour nous. Le Corbeau a déjà fait le travail ; il suffirait de changer de bannière à l’entrée.', null),
    say('choice', ALISTAIR, 'Décision', 'Les galeries attendent notre réponse.', null, { expression: 'stern', choices: [
      choice('Chasser le Corbeau et rendre les galeries à l’Ours.', null, [flag('bearMinesRestored'), reputation(1), fight('bear_mines_defense')],
        ['Combat contre le chef des mineurs du Corbeau', 'Les galeries rendues à l’Ours']),
      choice('Chasser le Corbeau et garder le filon sombre pour le clan.', null, [flag('bearMinesSeized'), reputation(-2), fight('bear_mines_seizure')],
        ['Combat contre le chef des mineurs du Corbeau', 'Le filon gardé pour le clan']),
      choice('Tenir parole au Corbeau et le laisser finir.', 'abandoned',
        [flag('bearMinesAbandoned'), gold(120), reputation(-3), { type: 'setClanRelation', clan: 'raven', stance: 'ally', cause: 'bear.mines' }],
        ['120 or', 'Le Corbeau vous doit une faveur', 'Borin l’apprendra'], { requiresFlag: 'bearRavenPact' }),
    ] }),
    say('abandoned', RAVEN_CHIEF, 'Corbeau', 'Voilà des étrangers qui savent compter. Le Corbeau n’oublie pas ceux qui tiennent parole.', 'abandoned2'),
    say('abandoned2', SERAPHINE, 'Sage', 'Et l’Ours n’oubliera pas ceux qui l’ont trahi.', null, { expression: 'stern' }),
  ]));
}

function bearMinersTestimony(state: Readonly<GameState>): DialogueSequence {
  const flags = state.flags;
  const rescued = flags.bearMinersRescued ? ' Et nous n’oublions pas ceux qui nous ont sortis de l’éboulement.' : '';
  const witnesses = flags.protectedWitnesses
    ? 'Comme les survivants de Bois-Clair, ils veulent parler avec leurs propres mots. Laissons-les marcher avec nous, sans leur dicter ce qu’ils diront.'
    : flags.silencedWitnesses
      ? 'Les témoins de Bois-Clair se sont tus sous nos lames. Je ne veux pas que la montagne en compte d’autres.'
      : 'Des témoins libres pèsent plus lourd qu’un récit que nous ferions nous-mêmes.';
  const fear = flags.bearMinesSeized || flags.bearMinesAbandoned
    ? 'Ils ont vu ce que nous avons fait des galeries. Si nous les laissons descendre, Borin l’entendra de leur bouche.'
    : 'Ils parlent beaucoup, et ce qu’ils diront ne nous appartiendra plus une fois en bas.';
  return scene('bear_miners_testimony', 'witnesses_on_road', 'Mineurs libérés', [
    say('open', MINER, 'Mineurs de l’Ours', `Nous étions dans les galeries quand le Corbeau les a prises. Nous avons tout vu : les charges, le filon, les chariots.${rescued}`, 'request'),
    say('request', MINER, 'Témoignage', 'Nous voulons le dire nous-mêmes à Borin.', 'seraphine'),
    say('seraphine', SERAPHINE, 'Sage', witnesses, 'maelor', { expression: 'mystical' }),
    say('maelor', MAELOR, 'Intendant', fear, 'choice'),
    say('choice', ALISTAIR, 'Décision', 'Que faisons-nous d’eux ?', null, { expression: 'stern', choices: [
      choice('Escorter les mineurs jusqu’à Borin.', 'protected', [flag('bearMinersProtected'), reputation(1)], ['Des témoins libres devant Borin']),
      choice('Les faire taire, quel qu’en soit le prix.', 'silenced', [flag('bearMinersSilenced'), reputation(-2)], ['Aucun témoin devant Borin', 'Un acte que la montagne retiendra']),
    ] }),
    say('protected', MINER, 'Escorte', 'Merci. Nous marcherons avec vous, mais nous parlerons pour nous.', null, { expression: 'grateful' }),
    say('silenced', MARIAN, 'Soigneuse', 'Ils se taisent, maintenant. Nous aussi, nous devrons vivre avec ce silence.', null, { expression: 'wounded' }),
  ]);
}

function bearDarkVein(state: Readonly<GameState>): DialogueSequence {
  const altar = state.flags.shadowEvidence ? ' Il porte la même résonance que l’autel des Ombres, dans la plaine du Lion.' : '';
  return scene('bear_dark_vein', 'shadow_signs', 'Le filon sombre', [
    say('open', KESTREL, 'Éclaireuse', 'Le filon. Une veine noire dans la roche, qui ne renvoie pas la lumière des torches. Elle semble respirer, quand on la regarde trop longtemps.', 'seraphine', { expression: 'fearful' }),
    say('seraphine', SERAPHINE, 'Sage', `Voilà ce que le Corbeau creusait. Ce minerai n’appartient pas à la montagne.${altar}`, 'maelor', { expression: 'mystical' }),
    say('maelor', MAELOR, 'Intendant', 'Un tel minerai vaut une fortune, ou une malédiction. Peut-être les deux.', 'choice'),
    say('choice', ALISTAIR, 'Décision', 'Que faisons-nous du filon ?', null, { choices: [
      choice('En sceller un éclat comme preuve.', 'sealed', [flag('bearDarkOreEvidence'), reputation(1)], ['Une preuve à montrer à Borin']),
      choice('Briser le filon.', 'shattered', [flag('bearDarkOreShattered'), reputation(-1)], ['Le filon détruit', 'Aucune preuve à montrer']),
    ] }),
    say('sealed', SERAPHINE, 'Sage', 'Je le scelle dans un coffre doublé de plomb. Borin devra le voir, et d’autres après lui.', null, { expression: 'mystical' }),
    say('shattered', KESTREL, 'Éclaireuse', 'La veine éclate en mille éclats ternes. Ce qu’elle était, nous ne le saurons plus.', null),
  ]);
}

function bearMasterSpyPreCombat(state: Readonly<GameState>): DialogueSequence {
  return scene('bear_master_spy_pre_combat', 'lion_finale_judgement', 'Maître Espion du Corbeau', chained([
    say('1', BORIN, 'Ancien Ours', 'Le Corbeau ne cherchait pas l’or. Il cherchait ce minerai noir, et il le cherchait pour quelqu’un d’autre.', null, { expression: 'stern' }),
    say('2', BORIN, 'Alliance', 'Celui qui commandait le Corbeau fuit vers les hauteurs : son Maître Espion. Ramenez-le, ou empêchez-le de revenir, et le Sceau de l’Ours scellera notre alliance.', null, { expression: 'stern' }),
    state.flags.bearSpyOrdersFound
      ? say('3', KESTREL, 'Éclaireuse', 'Les ordres du campement portaient sa signature. C’est lui qui payait les treuils et les chariots.', null, { expression: 'stern' })
      : say('3', SERAPHINE, 'Sage', 'Celui qui tire les fils reste rarement près des galeries. Il faudra aller le chercher.', null, { expression: 'mystical' }),
    say('4', SPY, 'Maître Espion', 'Vous avez bien travaillé pour l’Ours. Dommage que vous ne sachiez pas pour qui vous travaillez vraiment.', null, { expression: 'hostile' }),
  ]));
}

/** The Bear's state-built scenes, by dialogue ID. The judgement and epilogue come from the plateau finale engine. */
export const BEAR_SCENE_BUILDERS: Readonly<Record<string, (state: Readonly<GameState>) => DialogueSequence>> = Object.freeze({
  bear_audience: bearAudience,
  bear_ore_convoy: bearOreConvoy,
  bear_sacred_mines: bearSacredMines,
  bear_miners_testimony: bearMinersTestimony,
  bear_dark_vein: bearDarkVein,
  bear_master_spy_pre_combat: bearMasterSpyPreCombat,
});

/** Static Bear dialogues registered in the post-demo content registry. */
export const BEAR_DIALOGUES: readonly DialogueSequence[] = BEAR_STATIC_DIALOGUES;
