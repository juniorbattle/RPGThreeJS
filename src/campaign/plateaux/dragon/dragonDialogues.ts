/**
 * Set 1.20.0, post-demo Lot 2 — dialogues of the Dragon plateau, canon since OD-2026-11-08-C. Written from the roadmap (§3.3 and its status),
 * the facts already established by the Lion and the Bear, and the operator's decisions only; no clan, place, character,
 * object or lore beyond them. Accepted by the operator with the plateau. Authored at the post-demo reputation
 * scale (OD-2026-11-08-A), smaller than the Bear's (R2).
 *
 * Static scenes are plain sequences. State-built scenes carry the echoes that name their cause: the Bear's Seal before
 * Kaelen, the Wolf's pact at the lair, the Wolf warrior who was heard, the inscriptions brought back, the Lion's Shadow
 * evidence and the Bear's dark ore at the altar, the hamlet at the vigil, and the shaman's traces.
 */
import { LYRA_MEETING, TALON_MEETING, withMeeting, withMeetingPart } from '../heroMeetings';
import type { DialogueChoice, DialogueSequence, DialogueStep, GameState, NarrativeEffect } from '../../../game/types';

interface Who { speaker: string; actorId: string; side: 'left' | 'right' }
const ALISTAIR: Who = { speaker: 'Alistair', actorId: 'alistair', side: 'left' };
const SERAPHINE: Who = { speaker: 'Sage Séraphine', actorId: 'sage_seraphine', side: 'left' };
const MAELOR: Who = { speaker: 'Intendant Maelor', actorId: 'maelor', side: 'left' };
const MARIAN: Who = { speaker: 'Marian', actorId: 'marian', side: 'left' };
const KESTREL: Who = { speaker: 'Kestrel', actorId: 'kestrel', side: 'left' };
const ELARA: Who = { speaker: 'Elara', actorId: 'elara', side: 'left' };
const KAELEN: Who = { speaker: 'Ancien Dragon Kaelen', actorId: 'kaelen', side: 'right' };
const VILLAGER: Who = { speaker: 'Villageois des contreforts', actorId: 'dragon_villager', side: 'right' };
const ENVOY: Who = { speaker: 'Émissaire du Loup', actorId: 'wolf_envoy', side: 'right' };
const CAPTIVE: Who = { speaker: 'Guerrier du Loup', actorId: 'wolf_captive', side: 'right' };
const WOLF_CHIEF: Who = { speaker: 'Chef du Clan du Loup', actorId: 'wolf_chief', side: 'right' };
const PILGRIM: Who = { speaker: 'Pèlerin du Dragon', actorId: 'dragon_pilgrim', side: 'right' };
const SHAMAN: Who = { speaker: 'Chaman des Ombres', actorId: 'shadow_shaman', side: 'right' };

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

export const DRAGON_STATIC_DIALOGUES: readonly DialogueSequence[] = Object.freeze([
  scene('dragon_arrival', 'forest_fork', 'Pied des Pics Célestes', chained([
    say('1', ELARA, 'Pics Célestes', 'Les Pics Célestes. Deux Sceaux dans notre coffre, et la montagne la plus haute que nous ayons jamais gravie.', null, { expression: 'stern' }),
    say('2', SERAPHINE, 'Sage', 'Le Clan du Dragon garde ici des savoirs plus anciens que tous les clans des plaines. Il écoute peu, et il pèse longtemps ce qu’il entend.', null, { expression: 'mystical' }),
    say('3', MAELOR, 'Intendant', 'Un clan si sage qu’il n’a besoin de personne. Voyons ce qu’il nous demandera quand même.'),
  ])),
  scene('dragon_wolf_envoy', 'mystery_ambush', 'Émissaire du Loup', [
    say('1', KESTREL, 'Éclaireuse', 'Un guerrier du Loup, seul, sous un drapeau de trêve. Il a laissé son arme plantée dans la neige, loin de lui.', '2', { expression: 'stern' }),
    say('2', ENVOY, 'Loup', 'Le Dragon vous envoie reprendre son Cristal. Le Loup vous propose mieux : ne le reprenez pas. Laissez-le où il est, et le Loup partagera les vallées que le Dragon garde pour lui seul.', '3'),
    say('3', ENVOY, 'Offre', 'Prenez cet or en gage. Montez jusqu’au repaire, et le jour venu, souvenez-vous de qui vous a parlé le premier.', '4'),
    say('4', MAELOR, 'Intendant', 'Le Dragon et le Loup se disputent ces pics depuis toujours. Qu’ils s’affaiblissent l’un l’autre, et le plus fort au bout sera peut-être celui qui n’a pas choisi trop tôt.', '5'),
    say('5', SERAPHINE, 'Sage', 'Un clan qui vole un artefact puis achète le silence de ceux qui le cherchent… Je voudrais savoir pourquoi le Loup a eu besoin de ce Cristal, avant de croire à son partage.', 'offer', { expression: 'mystical' }),
    say('offer', ALISTAIR, 'Réponse', 'Votre réponse, alors.', null, { expression: 'stern', choices: [
      choice('Repousser l’émissaire et prévenir Kaelen.', 'refused', [flag('dragonWolfOfferRefused')], ['Kaelen saura ce que le Loup a tenté']),
      choice('Accepter l’or et le pacte du Loup.', 'pact', [flag('dragonWolfPact'), gold(90), reputation(-2)], ['90 or', 'Un pacte avec le Loup']),
    ] }),
    say('refused', ENVOY, 'Refus', 'Le Dragon vous remerciera du bout des lèvres. Le Loup, lui, se souviendra de votre réponse.', 'warned', { expression: 'hostile' }),
    say('warned', KESTREL, 'Éclaireuse', 'Je fais porter un message à l’ermitage. Kaelen saura qu’un émissaire du Loup descend jusqu’ici.', null),
    say('pact', ENVOY, 'Pacte', 'Alors nous nous reverrons au repaire. Le Loup tient parole à ceux qui la tiennent.', null),
  ]),
  scene('dragon_wolf_traps', 'forest_fork', 'Pièges du Loup', withMeeting([
    say('1', KESTREL, 'Éclaireuse', 'Des collets d’acier sous la neige, en travers du sentier des pèlerins. Le Loup les a posés pour ceux qui montent prier le Dragon.', '2', { expression: 'stern' }),
    say('2', MAELOR, 'Intendant', 'Déplaçons-les sur les sentiers du Loup. Ses patrouilles y tomberont, et le repaire sera moins gardé.', '3'),
    say('3', MARIAN, 'Soigneuse', 'Les pèlerins passent aussi par là. Un collet ne distingue pas un loup d’un enfant.', 'choice', { expression: 'stern' }),
    say('choice', ALISTAIR, 'Décision', 'Que fait-on de ces pièges ?', null, { choices: [
      choice('Désarmer les pièges du sentier des pèlerins.', 'disarmed', [flag('dragonTrapsDisarmed'), reputation(1)], ['Le sentier des pèlerins sûr']),
      choice('Les retourner contre les patrouilles du Loup.', 'turned', [flag('dragonTrapsTurned'), item('grenade_entravante', 1), reputation(-1)], ['1 grenade entravante', 'Au risque des pèlerins']),
    ] }),
    say('disarmed', KESTREL, 'Éclaireuse', 'Le sentier est sûr. Les pèlerins pourront monter sans regarder où ils posent les pieds.', null),
    say('turned', KESTREL, 'Éclaireuse', 'Les collets attendent le Loup, maintenant. J’espère que personne d’autre ne passera par là.', null),
  ], TALON_MEETING)),
  scene('dragon_hermitage_gathering', 'lion_refuge', 'Ermitage des contreforts', chained([
    say('1', ALISTAIR, 'Ermitage', 'Un ermitage du Dragon, accroché à la paroi. Les moines nous laissent le feu sans poser de questions.'),
    say('2', MAELOR, 'Intendant', 'Sans poser de questions, et sans rien nous dire non plus. Le Dragon garde même ses silences.'),
    say('3', SERAPHINE, 'Sage', 'Ils prient pour que le Cristal revienne. Reposons-nous ; le repaire du Loup est plus haut que tout ce que nous avons traversé.', null, { expression: 'mystical' }),
  ])),
  scene('dragon_captive_wolf', 'mystery_ambush', 'Guerrier du Loup blessé', [
    say('1', KESTREL, 'Éclaireuse', 'Un guerrier du Loup, blessé, abandonné par les siens au bord des terrasses. Il est encore conscient.', '2', { expression: 'stern' }),
    say('2', CAPTIVE, 'Loup', 'Achevez-moi ou laissez-moi. Je ne dirai rien du repaire.', '3', { expression: 'hostile' }),
    say('3', MAELOR, 'Intendant', 'Il dira tout, avec un peu d’encouragement. Le repaire est gardé, et nous ne savons rien de ses défenses.', '4'),
    say('4', SERAPHINE, 'Sage', 'Écoutons-le d’abord. Un clan qui vole un artefact sacré n’agit pas toujours de lui-même ; ce guerrier sait peut-être pourquoi.', 'choice', { expression: 'mystical' }),
    say('choice', ALISTAIR, 'Décision', 'Que faisons-nous de lui ?', null, { expression: 'stern', choices: [
      choice('Soigner ses blessures, l’écouter, puis le relâcher.', 'heard', [flag('dragonWolfHeard'), reputation(1)], ['Un ennemi épargné', 'Peut-être une vérité']),
      choice('Lui arracher ce qu’il sait.', 'tortured', [flag('dragonWolfTortured'), reputation(-2)], ['Les gardes du repaire', 'Un acte que les Pics retiendront']),
    ] }),
    say('heard', CAPTIVE, 'Aveu', 'Notre chef n’était pas ainsi, avant. Un chaman est venu d’on ne sait où, et depuis, il n’écoute plus que lui. C’est le chaman qui voulait le Cristal.', 'heard2', { expression: 'wounded' }),
    say('heard2', SERAPHINE, 'Sage', 'Un chaman venu de nulle part, derrière un clan qui n’agit plus de lui-même. Nous avons déjà vu cela.', null, { expression: 'mystical' }),
    say('tortured', MARIAN, 'Soigneuse', 'Il a parlé des gardes et des passages. Il ne parlera plus jamais d’autre chose.', null, { expression: 'wounded' }),
  ]),
  scene('dragon_crystal_clues', 'mystery_shrine', 'Inscriptions du Cristal', [
    say('1', SERAPHINE, 'Sage', 'Une paroi gravée par les anciens du Dragon. Elle parle du Cristal d’Écho : il tient l’équilibre des Pics, mais une main qui saurait le tourner pourrait en faire une arme.', '2', { expression: 'mystical' }),
    say('2', MAELOR, 'Intendant', 'Une arme qui tient des montagnes en équilibre. Ce savoir vaut plus que tout l’or du Loup. Pourquoi le rendre à un clan qui le garde pour lui seul ?', '3'),
    say('3', MARIAN, 'Soigneuse', 'Parce que ce n’est pas à nous de décider qui tient les montagnes.', 'choice', { expression: 'stern' }),
    say('choice', ALISTAIR, 'Décision', 'Que faisons-nous de ces inscriptions ?', null, { choices: [
      choice('Copier les inscriptions pour Kaelen.', 'shared', [flag('dragonCluesShared')], ['Kaelen saura ce que dit la paroi']),
      choice('Garder pour nous le secret du Cristal.', 'hidden', [flag('dragonCluesHidden'), item('ether', 1), reputation(-1)], ['1 éther (poussière de cristal)', 'Un secret gardé pour le clan']),
    ] }),
    say('shared', SERAPHINE, 'Sage', 'Je les recopie trait pour trait. Kaelen saura les lire mieux que nous.', null),
    say('hidden', MAELOR, 'Intendant', 'Je garde la copie, et la poussière de cristal au pied de la paroi. Un jour, ce savoir nous servira.', null),
  ]),
  scene('dragon_pre_lair_assault', 'shadow_signs', 'Assaut du repaire', chained([
    say('1', WOLF_CHIEF, 'Loup', 'Le Dragon envoie des étrangers chercher ce qu’il n’a pas su garder. Venez le prendre.', null, { expression: 'hostile' }),
  ])),
  scene('dragon_lair_assault_aftermath', 'shadow_signs', 'Le Cristal repris', chained([
    say('1', SERAPHINE, 'Sage', 'Le Cristal d’Écho. Il est chaud, et il tremble comme une source sous la glace. Rapportons-le à Kaelen.', null, { expression: 'mystical' }),
    say('2', KESTREL, 'Éclaireuse', 'Le chef est tombé, mais quelqu’un s’est enfui par le fond du repaire. Pas un guerrier du Loup.', null, { expression: 'stern' }),
  ])),
  scene('dragon_pre_lair_seizure', 'shadow_signs', 'Prise du Cristal', chained([
    say('1', WOLF_CHIEF, 'Loup', 'Vous aussi, vous voulez le Cristal pour vous. Au moins, le Loup ne prétend pas servir l’équilibre.', null, { expression: 'hostile' }),
  ])),
  scene('dragon_lair_seizure_aftermath', 'shadow_signs', 'Le Cristal pris', chained([
    say('1', MAELOR, 'Intendant', 'Le Cristal est à nous. Le Dragon devra traiter avec ceux qui tiennent l’équilibre de ses pics.'),
    say('2', MARIAN, 'Soigneuse', 'Ou il viendra le reprendre, et nous n’aurons pas le droit de nous en plaindre.', null, { expression: 'stern' }),
  ])),
  scene('dragon_shaman_aftermath', 'lion_finale_judgement', 'Le Chaman des Ombres vaincu', chained([
    say('1', SHAMAN, 'Vaincu', 'Le Cristal… n’était qu’un écho. Ceux que je sers écoutent d’autres échos, partout où vos Sceaux vous mènent.', null, { expression: 'wounded' }),
    say('2', SERAPHINE, 'Sage', 'Les Ombres, derrière un troisième clan. Le Loup n’était qu’une main de plus, comme le Corbeau avant lui.', null, { expression: 'mystical' }),
  ])),
  scene('dragon_trial_aftermath', 'lion_finale_judgement', 'Le Sceau arraché', chained([
    say('1', KAELEN, 'Ancien Dragon', 'Le Sceau est à vous. Les Pics l’ont vu. Ne comptez plus sur la sagesse du Dragon le jour où vous en aurez besoin.', null, { expression: 'wounded' }),
  ])),
]);

// ---------------------------------------------------------------------------------------------------------------------
// State-built scenes

/**
 * OD-2026-11-13-F (N1), lines approved word for word on 2026-11-13: guarding the hamlet costs a fight against the
 * Wolf's raid; making it pay avoids the fight, and the Wolf turns back for one night only. Once the raid is repelled, the
 * same scene reopens on the hamlet's first quiet night and Lyra's meeting for that branch.
 */
function dragonTerrorizedVillage(state: Readonly<GameState>): DialogueSequence {
  if (state.flags.dragonVillageRaidRepelled) {
    return scene('dragon_terrorized_village', 'forest_fork', 'Hameau terrorisé', withMeetingPart([
      say('protected', VILLAGER, 'Gratitude', 'Le Loup a goûté vos lames et il a tourné bride. C’est la première nuit que nous dormons depuis des semaines.', null, { expression: 'grateful' }),
    ], LYRA_MEETING, ['protected']));
  }
  return scene('dragon_terrorized_village', 'forest_fork', 'Hameau terrorisé', withMeetingPart([
    say('1', MARIAN, 'Soigneuse', 'Des portes barricadées, des enfants cachés dans les granges. Ce hameau attend une attaque.', '2', { expression: 'fearful' }),
    say('2', VILLAGER, 'Contreforts', 'Le Loup descend chaque nuit depuis la disparition du Cristal. Il prend les bêtes, les réserves, et il revient toujours. Le Dragon reste là-haut.', '3', { expression: 'fearful' }),
    say('3', MAELOR, 'Intendant', 'Ces gens paieraient cher pour dormir tranquilles. Une protection a un prix, et personne d’autre ne la leur offre.', '4'),
    say('4', SERAPHINE, 'Sage', 'Ils paient déjà le Loup en bêtes et en peur. Leur prendre davantage ferait de nous un deuxième Loup.', 'choice', { expression: 'stern' }),
    say('choice', ALISTAIR, 'Décision', 'Que faisons-nous pour ce hameau ?', null, { expression: 'stern', choices: [
      choice('Monter la garde et repousser le prochain raid.', 'raid', [flag('dragonVillageProtected'), reputation(1), fight('dragon_village_raid')],
        ['Combat contre les pillards du Loup', 'Le hameau protégé']),
      choice('Faire payer notre protection.', 'extorted_night', [flag('dragonVillageExtorted'), gold(60), reputation(-2)], ['60 or', 'Un hameau qui paie deux fois']),
    ] }),
    say('raid', KESTREL, 'Éclaireuse', 'Des torches sur le sentier, et des loups devant les hommes. Le Loup descend, comme chaque nuit. Cette fois, nous l’attendons.', null, { expression: 'stern' }),
    say('extorted_night', KESTREL, 'Éclaireuse', 'Le Loup a vu nos feux et il a tourné bride sans combattre. Pour cette nuit, du moins.', 'extorted'),
    say('extorted', MARIAN, 'Soigneuse', 'Ils ont vidé leur dernier coffre pour nous. Ils nous regardent comme ils regardent le Loup.', null, { expression: 'wounded' }),
  ], LYRA_MEETING, ['extorted']));
}

function dragonAudience(state: Readonly<GameState>): DialogueSequence {
  const flags = state.flags;
  const sealsLine = flags.bearMasterSpyDefeated
    ? 'Borin vous a confié le Sceau de l’Ours, dit-on, et le Maître Espion du Corbeau ne reverra pas ses montagnes. L’Ours ne donne pas sa parole à la légère. Le Dragon non plus.'
    : flags.bearTrialWon
      ? 'On parle aussi du Sceau de l’Ours arraché à Borin par l’épreuve. Les Pics ont de bons yeux, étrangers. Ils regarderont ce que vous ferez ici.'
      : 'Deux Sceaux vous ont menés jusqu’ici. Ce qu’ils valent, je le jugerai sur les Pics.';
  return scene('dragon_audience', 'lion_briefing', 'Audience de Kaelen', [
    say('open', KAELEN, 'Ancien Dragon', 'Le Clan du Loup a volé le Cristal d’Écho. Il tenait l’équilibre de ces pics depuis avant vos chroniques. Sans lui, la montagne se fend, la neige glisse, et les vallées tremblent.', 'seals', { expression: 'stern' }),
    say('seals', KAELEN, 'Deux Sceaux', sealsLine, 'request', { expression: 'stern' }),
    say('request', KAELEN, 'Requête', 'Le Dragon ne demande pas d’aide ; il en accepte, quand elle est digne. Rapportez le Cristal, et le Sceau du Dragon entendra votre nom.', 'seraphine', { expression: 'stern' }),
    say('seraphine', SERAPHINE, 'Sage', 'Un artefact qui tient des montagnes ne se manie pas sans danger, Ancien Kaelen. Et un clan qui le vole sait peut-être ce qu’il fait, ou quelqu’un le sait pour lui. Comprenons le Loup avant de le frapper.', 'maelor', { expression: 'mystical' }),
    say('maelor', MAELOR, 'Intendant', 'Ou laissons le Loup et le Dragon s’user l’un contre l’autre. Le Cristal ira à qui le tiendra à la fin… Je dis seulement ce que chacun pense en regardant ces pics.', 'alistair'),
    say('alistair', ELARA, 'Clan sans terre', 'Nous ne sommes pas venus vendre l’équilibre d’un autre clan.', 'mandate', { expression: 'stern' }),
    say('mandate', KAELEN, 'Mandat', 'Alors, étrangers. Rapporterez-vous le Cristal d’Écho ?', null, { expression: 'stern', choices: [
      choice('Rapporter le Cristal sans rien exiger.', 'accepted', [flag('dragonMandateHonour'), reputation(1)], ['Parole claire devant le Dragon', 'Kaelen observe votre conduite']),
      choice('Exiger un prix pour notre aide.', 'price', [flag('dragonMandatePrice'), gold(60), reputation(-1)], ['60 or d’avance', 'Le prix pèsera dans le jugement']),
    ] }),
    say('accepted', KAELEN, 'Parole', 'Montez, alors. Le repaire du Loup est haut, et le Loup voit loin.', null, { expression: 'stern' }),
    say('price', KAELEN, 'Parole chiffrée', 'Vous chiffrez l’équilibre des Pics comme une marchandise. Prenez votre or. Le Dragon se souviendra de ce qu’il vous a coûté.', null, { expression: 'hostile' }),
  ]);
}

function dragonWolfLair(state: Readonly<GameState>): DialogueSequence {
  const pact = Boolean(state.flags.dragonWolfPact);
  return scene('dragon_wolf_lair', 'shadow_signs', 'Repaire du Loup', chained([
    say('open', KESTREL, 'Éclaireuse', 'Le repaire du Loup, creusé dans la paroi. Le Cristal brille au fond, posé sur un autel qui n’est pas celui du Dragon. Le chef du Loup le garde lui-même.', null, { expression: 'stern' }),
    pact
      ? say('pact', WOLF_CHIEF, 'Loup', 'Les étrangers de la trêve. Le pacte scellé avec notre émissaire tient toujours ? Alors laissez le Cristal où il est, et partagez les vallées avec nous.', null)
      : say('chief', WOLF_CHIEF, 'Loup', 'Encore des étrangers au service du Dragon. Il a gardé ces pics trop longtemps. Le Cristal ira à qui saura s’en servir.', null, { expression: 'hostile' }),
    say('seraphine', SERAPHINE, 'Sage', 'Ce Cristal appartient à l’équilibre des Pics, et cet autel n’a rien d’un autel du Loup. Reprenons-le, et rapportons-le à Kaelen.', null, { expression: 'mystical' }),
    say('maelor', MAELOR, 'Intendant', 'Ou reprenons-le pour nous. Celui qui tient le Cristal tient le Dragon.', null),
    say('choice', ALISTAIR, 'Décision', 'Le repaire attend notre réponse.', null, { expression: 'stern', choices: [
      choice('Prendre le repaire et rapporter le Cristal à Kaelen.', null, [flag('dragonCrystalRecovered'), reputation(1), fight('dragon_lair_assault')],
        ['Combat contre le chef du Clan du Loup', 'Le Cristal rapporté au Dragon']),
      choice('Prendre le repaire et garder le Cristal pour le clan.', null, [flag('dragonCrystalKept'), reputation(-2), fight('dragon_lair_seizure')],
        ['Combat contre le chef du Clan du Loup', 'Le Cristal gardé pour le clan']),
      choice('Tenir parole au Loup et lui laisser le Cristal.', 'alliance',
        [flag('dragonWolfAlliance'), gold(130), reputation(-3), { type: 'setClanRelation', clan: 'wolf', stance: 'ally', cause: 'dragon.crystal' }],
        ['130 or', 'Le Loup vous doit une faveur', 'Kaelen l’apprendra'], { requiresFlag: 'dragonWolfPact' }),
    ] }),
    say('alliance', WOLF_CHIEF, 'Loup', 'Des étrangers qui tiennent parole. Le Loup n’oubliera pas que vous avez choisi le bon côté.', 'alliance2'),
    say('alliance2', SERAPHINE, 'Sage', 'Et les Pics n’oublieront pas ce que nous avons laissé entre ses mains.', null, { expression: 'stern' }),
  ]));
}

function dragonShamanTraces(state: Readonly<GameState>): DialogueSequence {
  const heard = state.flags.dragonWolfHeard
    ? 'Le guerrier du Loup que vous avez relâché parlait de ce chaman. Il disait vrai : ces symboles ne sont pas ceux du Loup.'
    : 'Ces symboles ne sont pas ceux du Loup. Quelqu’un d’autre vivait parmi eux.';
  return scene('dragon_shaman_traces', 'mystery_ambush', 'Camp déserté du Loup', chained([
    say('open', KESTREL, 'Éclaireuse', 'Le camp du Loup, plus haut que le repaire, déserté en hâte. Une tente à l’écart des autres, pleine de cendres froides et de symboles tracés au sol.', null, { expression: 'stern', effects: [flag('dragonShamanTraceFound')] }),
    say('heard', SERAPHINE, 'Sage', heard, null, { expression: 'mystical' }),
    say('maelor', MAELOR, 'Intendant', 'Celui qui vivait ici est parti avant nous. Il savait que le repaire tomberait.'),
  ]));
}

function dragonFreedPilgrims(state: Readonly<GameState>): DialogueSequence {
  const flags = state.flags;
  const village = flags.dragonVillageProtected ? ' On dit que vous avez gardé le hameau des contreforts. Nous en venons presque tous.' : '';
  const witnesses = flags.bearMinersProtected
    ? 'Comme les mineurs de l’Ours, ils veulent parler avec leurs propres mots. Laissons-les marcher avec nous.'
    : flags.bearMinersSilenced
      ? 'Les mineurs de l’Ours se sont tus sous nos lames. Je ne veux pas que les Pics en comptent d’autres.'
      : 'Des témoins libres pèsent plus lourd qu’un récit que nous ferions nous-mêmes.';
  const fear = flags.dragonCrystalKept || flags.dragonWolfAlliance
    ? 'Ils ont vu ce que nous avons fait du Cristal. S’ils parlent à Kaelen, nous n’aurons plus rien à expliquer.'
    : 'Ils parlent beaucoup, et ce qu’ils diront ne nous appartiendra plus une fois devant Kaelen.';
  return scene('dragon_freed_pilgrims', 'witnesses_on_road', 'Pèlerins libérés', [
    say('open', PILGRIM, 'Pèlerins du Dragon', `Le Loup nous retenait au repaire pour porter ses vivres. Nous avons tout vu : le Cristal, l’autel, l’étranger qui parlait au chef.${village}`, 'request'),
    say('request', PILGRIM, 'Témoignage', 'Nous voulons le dire nous-mêmes à l’Ancien Kaelen.', 'seraphine'),
    say('seraphine', SERAPHINE, 'Sage', witnesses, 'maelor', { expression: 'mystical' }),
    say('maelor', MAELOR, 'Intendant', fear, 'choice'),
    say('choice', ALISTAIR, 'Décision', 'Que faisons-nous d’eux ?', null, { expression: 'stern', choices: [
      choice('Escorter les pèlerins jusqu’à Kaelen.', 'protected', [flag('dragonPilgrimsProtected'), reputation(1)], ['Des témoins libres devant Kaelen']),
      choice('Les faire taire, quel qu’en soit le prix.', 'silenced', [flag('dragonPilgrimsSilenced'), reputation(-2)], ['Aucun témoin devant Kaelen', 'Un acte que les Pics retiendront']),
    ] }),
    // Last narrative pass (D1), approved on 2026-11-13: the witnesses no longer share one line across the plateaux.
    say('protected', PILGRIM, 'Escorte', 'Merci. Nous monterons avec vous, mais devant l’Ancien Kaelen, nos mots seront les nôtres.', null, { expression: 'grateful' }),
    say('silenced', MARIAN, 'Soigneuse', 'Ils se taisent. Les Pics, eux, ne se tairont pas.', null, { expression: 'wounded' }),
  ]);
}

function dragonCrystalAltar(state: Readonly<GameState>): DialogueSequence {
  const flags = state.flags;
  const clues = flags.dragonCluesShared
    ? 'Les inscriptions que nous rapportons à Kaelen parlaient d’une main capable de tourner le Cristal. Cette souillure est la trace de cette main.'
    : flags.dragonCluesHidden
      ? 'Ce que disait la paroi restera entre nous, comme convenu. Mais cette souillure dit la même chose : quelqu’un a voulu tourner le Cristal.'
      : 'Quelqu’un a voulu tourner le Cristal, et cette souillure en est la trace.';
  const lion = flags.shadowRevealed
    ? 'Je l’ai déjà vue. Ce sont les preuves des Ombres que nous avons confiées au Lion, dans les plaines : la même marque, la même froideur.'
    : flags.shadowConcealed
      ? 'Je l’ai déjà vue. Ce sont les preuves des Ombres que nous gardons encore pour nous, depuis les plaines du Lion : la même marque.'
      : 'Je ne l’avais jamais vue d’aussi près, mais je sais ce qu’elle annonce.';
  const ore = flags.bearDarkOreEvidence
    ? 'Et c’est la même souillure que l’éclat du filon sombre, dans notre coffre depuis les montagnes de l’Ours.'
    : 'Les Ombres ne laissent jamais qu’une trace par endroit. Il faudra les suivre ailleurs.';
  return scene('dragon_crystal_altar', 'shadow_signs', 'Autel du Cristal', [
    say('open', KESTREL, 'Éclaireuse', 'L’autel du Cristal, au sommet des Pics. La pierre est fendue, et une souillure noire suinte de la fente, comme de l’encre gelée.', 'clues', { expression: 'fearful' }),
    say('clues', SERAPHINE, 'Sage', clues, 'lion', { expression: 'mystical' }),
    say('lion', SERAPHINE, 'Les Ombres', lion, 'ore', { expression: 'mystical' }),
    say('ore', MAELOR, 'Intendant', ore, 'choice'),
    say('choice', ALISTAIR, 'Décision', 'Que faisons-nous de cette souillure ?', null, { choices: [
      choice('En sceller un éclat comme preuve.', 'sealed', [flag('dragonShadowEvidence')], ['Une preuve à montrer à Kaelen']),
      choice('L’effacer sur-le-champ.', 'purged', [flag('dragonShadowPurged'), reputation(-1)], ['L’autel nettoyé', 'Aucune preuve à montrer']),
    ] }),
    say('sealed', SERAPHINE, 'Sage', 'Je l’enferme dans un coffre doublé de plomb, comme les autres. Kaelen devra la voir.', null, { expression: 'mystical' }),
    say('purged', KESTREL, 'Éclaireuse', 'La souillure fond sous la flamme. L’autel est propre, et nous ne saurons jamais ce qu’elle était.', null),
  ]);
}

function dragonVigil(state: Readonly<GameState>): DialogueSequence {
  const village = state.flags.dragonVillageProtected
    ? 'Les gens du hameau ont fait monter du pain et du bois jusqu’ici. Ils n’ont rien demandé en retour.'
    : 'Personne ne monte jusqu’ici. Le froid, ce soir, nous appartient à nous seuls.';
  return scene('dragon_vigil', 'lion_refuge', 'Veillée sur les Pics', chained([
    say('1', ELARA, 'Veillée', 'Kaelen nous attend demain. Tout ce que nous avons fait sur ces pics sera posé devant lui.', null, { expression: 'stern' }),
    say('village', MARIAN, 'Soigneuse', village, null),
    say('2', SERAPHINE, 'Sage', 'Le Dragon pèse lentement. Il ne nous jugera pas sur nos mots, mais sur ce que les Pics ont retenu de nous.', null, { expression: 'mystical' }),
    say('3', MAELOR, 'Intendant', 'Trois Sceaux, bientôt. Il viendra un jour où quelqu’un voudra savoir à quoi ils nous servent vraiment. J’aimerais avoir la réponse avant lui.'),
  ]));
}

function dragonShamanPreCombat(state: Readonly<GameState>): DialogueSequence {
  return scene('dragon_shaman_pre_combat', 'lion_finale_judgement', 'Chaman des Ombres', chained([
    say('1', KAELEN, 'Ancien Dragon', 'Le Cristal a été altéré par une énergie sombre. Le Loup ne l’a pas volé pour lui-même : un Chaman des Ombres le tenait sous son influence.', null, { expression: 'stern' }),
    say('2', KAELEN, 'Alliance', 'Ce chaman s’est enfui vers les cimes. Traquez-le et purgez cette menace, et le Sceau du Dragon scellera notre alliance.', null, { expression: 'stern' }),
    state.flags.dragonShamanTraceFound
      ? say('3', KESTREL, 'Éclaireuse', 'Sa tente, au camp déserté du Loup, était pleine de ses symboles. Je reconnaîtrai sa piste.', null, { expression: 'stern' })
      : say('3', SERAPHINE, 'Sage', 'Celui qui tourne le Cristal ne reste jamais près de l’autel. Il faudra aller le chercher.', null, { expression: 'mystical' }),
    say('4', SHAMAN, 'Chaman des Ombres', 'Vous avez rendu au Dragon son jouet. Vous n’avez pas encore compris qui écoute quand le Cristal résonne.', null, { expression: 'hostile' }),
  ]));
}

/**
 * Last narrative pass (C2, C3), approved word for word on 2026-11-13: when the company claimed the Seal and was refused,
 * Kaelen says so instead of « by force »; the line for a requested trial is unchanged.
 */
function dragonKaelenPreCombat(state: Readonly<GameState>): DialogueSequence {
  const refused = Boolean(state.flags.dragonFinaleTrialSelected && !state.flags.dragonTrialRequested);
  return scene('dragon_kaelen_pre_combat', 'lion_finale_judgement', 'Épreuve du Dragon', chained([
    say('1', KAELEN, 'Ancien Dragon', refused
      ? 'Vous réclamez mon Sceau, et les Pics ne vous le confient pas. Alors prouvez votre force à ceux qui gardent l’équilibre : mes gardiens et moi, contre votre compagnie.'
      : 'Vous voulez mon Sceau sans le mériter. Alors prouvez votre force à ceux qui gardent l’équilibre : mes gardiens et moi, contre votre compagnie.', null, { expression: 'hostile' }),
    say('2', ELARA, 'Épreuve', 'Que les Pics regardent, alors.', null, { expression: 'stern' }),
  ]));
}

/** The Dragon's state-built scenes, by dialogue ID. The judgement and epilogue come from the plateau finale engine. */
/**
 * OD-2026-11-11-E (final audit B7b), line approved word for word by the operator: the young dragon met in the Lion's
 * lands is remembered here, without saying it is the same dragon. Without either Lion fact, the scene is unchanged.
 */
function dragonYoungDragon(state: Readonly<GameState>): DialogueSequence {
  const lionNest = state.flags.sparedYoungDragon
    ? say('lion', KESTREL, 'Éclaireuse', 'Ce n’est pas le premier jeune dragon que nous croisons. Dans les terres du Lion, nous avions scellé un nid sans y toucher.', '3')
    : state.flags.challengedYoungDragon
      ? say('lion', SERAPHINE, 'Sage', 'Dans les terres du Lion, nous avons chassé un jeune dragon pour ses gemmes. Celui-ci ne pourrait même pas se défendre.', '3', { expression: 'stern' })
      : null;
  return scene('dragon_young_dragon', 'mystery_shrine', 'Nid du jeune dragon', [
    say('1', KESTREL, 'Éclaireuse', 'Un nid dans la roche. Un jeune dragon, blessé, le flanc noirci par une souillure qui n’est pas une brûlure.', '2', { expression: 'fearful' }),
    say('2', SERAPHINE, 'Sage', 'La même énergie sombre que sur les créatures des crêtes. Il peut guérir, si nous l’aidons.', lionNest ? 'lion' : '3', { expression: 'mystical' }),
    ...(lionNest ? [lionNest] : []),
    say('3', MAELOR, 'Intendant', 'Ses écailles valent une armure entière chez un bon forgeron. Il ne les sentira pas.', 'choice'),
    say('choice', ALISTAIR, 'Décision', 'Que faisons-nous ?', null, { choices: [
      choice('Soigner le jeune dragon.', 'tended', [flag('dragonYoungDragonTended')], ['Le jeune dragon soigné']),
      choice('Prendre ses écailles.', 'scales', [flag('dragonScalesTaken'), item('red_gem', 1), reputation(-1)], ['Une gemme rouge', 'Un jeune dragon dépouillé']),
    ] }),
    say('tended', MARIAN, 'Soigneuse', 'La souillure recule sous mes mains. Il nous regarde partir sans crainte.', null, { expression: 'grateful' }),
    say('scales', MARIAN, 'Soigneuse', 'Il ne se défend même pas. Je ne sais pas ce qui est le pire.', null, { expression: 'wounded' }),
  ]);
}

export const DRAGON_SCENE_BUILDERS: Readonly<Record<string, (state: Readonly<GameState>) => DialogueSequence>> = Object.freeze({
  dragon_audience: dragonAudience,
  dragon_terrorized_village: dragonTerrorizedVillage,
  dragon_wolf_lair: dragonWolfLair,
  dragon_shaman_traces: dragonShamanTraces,
  dragon_freed_pilgrims: dragonFreedPilgrims,
  dragon_crystal_altar: dragonCrystalAltar,
  dragon_vigil: dragonVigil,
  dragon_shaman_pre_combat: dragonShamanPreCombat,
  dragon_kaelen_pre_combat: dragonKaelenPreCombat,
  dragon_young_dragon: dragonYoungDragon,
});

/** Static Dragon dialogues registered in the post-demo content registry. */
export const DRAGON_DIALOGUES: readonly DialogueSequence[] = DRAGON_STATIC_DIALOGUES;
