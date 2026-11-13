/**
 * Set 1.20.0, post-demo Lot 3 — dialogues of the Scorpion plateau, canon since OD-2026-11-08-D (accepted by the
 * operator with the plateau). Written from the roadmap (§3.4 and its status: the chief is named by his title only, P5), the facts already
 * established by the Lion, the Bear and the Dragon, and the operator's decisions only; no clan, place, character, object
 * or lore beyond them. Authored at the post-demo reputation scale (OD-2026-11-08-A), the smallest of the Seal plateaux (R2).
 *
 * Static scenes are plain sequences. State-built scenes carry the echoes that name their cause: the Dragon's Seal before
 * the Grand Inquisiteur, the oath sworn to the Phénix at its temple, the freed faithful at the Prophet's cell, the Bear's
 * dark ore and the Dragon's altar shard beside the soiled page, the Phénix's wards at the vigil, and the Prophet's traces.
 */
import { ELDWIN_MEETING, MORVAN_MEETING, withMeeting, withMeetingPart } from '../heroMeetings';
import type { DialogueChoice, DialogueSequence, DialogueStep, GameState, NarrativeEffect } from '../../../game/types';

interface Who { speaker: string; actorId: string; side: 'left' | 'right' }
const ALISTAIR: Who = { speaker: 'Alistair', actorId: 'alistair', side: 'left' };
const SERAPHINE: Who = { speaker: 'Sage Séraphine', actorId: 'sage_seraphine', side: 'left' };
const MAELOR: Who = { speaker: 'Intendant Maelor', actorId: 'maelor', side: 'left' };
const MARIAN: Who = { speaker: 'Marian', actorId: 'marian', side: 'left' };
const KESTREL: Who = { speaker: 'Kestrel', actorId: 'kestrel', side: 'left' };
const INQUISITOR: Who = { speaker: 'Grand Inquisiteur', actorId: 'grand_inquisitor', side: 'right' };
const SCHOLAR: Who = { speaker: 'Érudit du Scorpion', actorId: 'scorpion_scholar', side: 'right' };
const FAITHFUL: Who = { speaker: 'Fidèle du Phénix', actorId: 'phoenix_faithful', side: 'right' };
const CAPTIVE: Who = { speaker: 'Fidèle captif', actorId: 'phoenix_captive', side: 'right' };
const GUARDIAN_CHIEF: Who = { speaker: 'Chef des gardiens du Phénix', actorId: 'phoenix_guardian_chief', side: 'right' };
const PROPHET: Who = { speaker: 'Prophète des Ombres', actorId: 'shadow_prophet', side: 'right' };

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

export const SCORPION_STATIC_DIALOGUES: readonly DialogueSequence[] = Object.freeze([
  scene('scorpion_arrival', 'forest_fork', 'Bord des Déserts Arides', chained([
    say('1', KESTREL, 'Déserts Arides', 'Les Déserts Arides. Trois Sceaux dans notre coffre, et un soleil qui ne pardonne rien.', null, { expression: 'stern' }),
    say('2', SERAPHINE, 'Sage', 'Le Clan du Scorpion garde ici des secrets plus anciens que ses dunes. Ses érudits savent beaucoup, et ils ne disent jamais tout.', null, { expression: 'mystical' }),
    say('3', MAELOR, 'Intendant', 'Un clan qui collectionne les secrets. Voyons ce qu’il est prêt à échanger contre les nôtres.'),
  ])),
  scene('scorpion_phoenix_faithful', 'witnesses_on_road', 'Fidèles du Phénix', [
    say('1', KESTREL, 'Éclaireuse', 'Des fidèles du Phénix gardent la route de leur temple. Ils ne portent pas d’armes, seulement des lampes allumées en plein jour.', '2', { expression: 'stern' }),
    say('2', FAITHFUL, 'Phénix', 'Vous marchez vers le temple, et nous savons qui vous envoie. Le Scorpion veut notre codex depuis toujours. Il le lirait comme il lit tout : pour s’en servir.', '3'),
    say('3', FAITHFUL, 'Serment', 'Jurez que vous ne le lui livrerez pas, et le Phénix se souviendra de vous.', '4'),
    say('4', SERAPHINE, 'Sage', 'Le Phénix garde ses flammes et ses textes avec la même foi. Un serment ici nous lierait autant qu’une dette. Ne promettons que ce que nous tiendrons.', '5', { expression: 'mystical' }),
    say('5', MAELOR, 'Intendant', 'Un serment ne coûte rien à prononcer. Ce qu’on en fait ensuite, c’est une autre affaire.', 'oath'),
    say('oath', ALISTAIR, 'Décision', 'Que leur répondons-nous ?', null, { expression: 'stern', choices: [
      choice('Ne rien leur promettre.', 'refused', [flag('scorpionOathRefused')], ['Aucune parole donnée au Phénix']),
      choice('Jurer de ne pas livrer le codex au Grand Inquisiteur.', 'sworn', [flag('scorpionPhoenixOath')], ['Un serment au Phénix', 'Le Grand Inquisiteur l’apprendra']),
    ] }),
    say('refused', FAITHFUL, 'Phénix', 'Alors passez. Le Phénix jugera vos actes à son temple, pas vos paroles sur la route.', null, { expression: 'stern' }),
    say('sworn', FAITHFUL, 'Serment', 'Le Phénix se souviendra de ce serment. À son temple, nos gardiens le sauront.', 'sworn2', { expression: 'grateful' }),
    say('sworn2', SERAPHINE, 'Sage', 'Nous voilà liés. Le Grand Inquisiteur n’aimera pas l’apprendre.', null, { expression: 'stern' }),
  ]),
  scene('scorpion_sand_riddle', 'mystery_shrine', 'Énigme des sables', [
    say('1', SERAPHINE, 'Sage', 'Une porte de pierre, couverte de signes anciens. Une énigme y est gravée ; les textes du Phénix en donnent la réponse à qui prend le temps de les lire.', '2', { expression: 'mystical' }),
    say('2', KESTREL, 'Éclaireuse', 'Ou il y a un levier de bronze derrière la pierre, à portée de lame. Le mécanisme céderait en un coup.', '3'),
    say('3', MAELOR, 'Intendant', 'Le temps, c’est ce qui nous manque. Brisons-le.', 'choice'),
    say('choice', ALISTAIR, 'Décision', 'Comment passons-nous ?', null, { choices: [
      choice('Chercher la réponse dans les textes.', 'solved', [flag('scorpionRiddleSolved')], ['La porte intacte']),
      choice('Briser le mécanisme.', 'forced', [flag('scorpionRiddleForced'), gold(40), reputation(-1)], ['40 or dans la niche du mécanisme', 'Une porte du Phénix brisée']),
    ] }),
    say('solved', SERAPHINE, 'Sage', 'La réponse était dans le troisième texte. La porte s’ouvre sans un bruit, comme si elle nous attendait.', null, { expression: 'mystical' }),
    say('forced', KESTREL, 'Éclaireuse', 'Le mécanisme a cédé. Il y avait des pièces dans sa niche, une offrande oubliée. La porte, elle, ne se refermera plus.', null),
  ]),
  scene('scorpion_oasis_gathering', 'lion_refuge', 'Oasis des érudits', chained([
    say('1', ALISTAIR, 'Oasis', 'Une oasis tenue par les érudits du Scorpion. L’eau est fraîche, et personne ne nous demande rien. Pas encore.'),
    say('2', MAELOR, 'Intendant', 'Ici, même l’eau a un prix. On nous le dira plus tard.'),
    say('3', SERAPHINE, 'Sage', 'Reposons-nous. Les ruines du Phénix commencent derrière ces palmiers, et elles sont gardées.', null, { expression: 'mystical' }),
  ])),
  scene('scorpion_warded_path', 'mystery_shrine', 'Sceaux de garde', [
    say('1', KESTREL, 'Éclaireuse', 'Des sceaux de garde tracés au sol, en travers de la route des ruines. Le premier qui marche dessus s’embrase.', '2', { expression: 'fearful' }),
    say('2', SERAPHINE, 'Sage', 'Ce sont des sceaux du Phénix. Ils se lèvent selon un rite que je sais lire : il y faut du temps, et du respect.', '3', { expression: 'mystical' }),
    say('3', MAELOR, 'Intendant', 'Ou un bon coup de marteau. Un sceau brisé ne brûle plus personne.', 'choice'),
    say('choice', ALISTAIR, 'Décision', 'Que faisons-nous de ces sceaux ?', null, { choices: [
      choice('Les lever selon leur rite.', 'respected', [flag('scorpionWardsRespected')], ['La route ouverte selon le rite du Phénix']),
      choice('Les briser sans attendre.', 'broken', [flag('scorpionWardsBroken'), reputation(-1)], ['La route ouverte tout de suite', 'Des sceaux du Phénix brisés']),
    ] }),
    say('respected', SERAPHINE, 'Sage', 'Les sceaux s’éteignent un à un, sans fumée. Les fidèles du Phénix sauront que quelqu’un a respecté leur rite.', null, { expression: 'mystical' }),
    say('broken', KESTREL, 'Éclaireuse', 'Les sceaux ont volé en éclats. La route est ouverte, et noire de suie.', null),
  ]),
  scene('scorpion_buried_library', 'mystery_shrine', 'Bibliothèque ensevelie', withMeeting([
    say('1', KESTREL, 'Éclaireuse', 'Une bibliothèque du Phénix, à moitié ensevelie. Le sable a gardé ses rouleaux mieux que n’importe quel gardien.', '2'),
    say('2', SERAPHINE, 'Sage', 'Des siècles de textes. Les déplacer les tuerait ; les lire ici prendrait des années.', '3', { expression: 'mystical' }),
    say('3', MAELOR, 'Intendant', 'Quelques rouleaux bien choisis valent une fortune chez les érudits du Scorpion. Ils ne demanderont pas d’où ils viennent.', '4'),
    say('4', MARIAN, 'Soigneuse', 'Ce sont les souvenirs d’un clan. On ne vend pas les souvenirs des autres.', 'choice', { expression: 'stern' }),
    say('choice', ALISTAIR, 'Décision', 'Que faisons-nous de cette bibliothèque ?', null, { choices: [
      choice('La laisser intacte.', 'respected', [flag('scorpionLibraryRespected')], ['La bibliothèque laissée au Phénix']),
      choice('Emporter des rouleaux pour les vendre.', 'looted', [flag('scorpionLibraryLooted'), gold(80), reputation(-1)], ['80 or', 'Des rouleaux du Phénix vendus']),
    ] }),
    say('respected', SERAPHINE, 'Sage', 'Je recouvre l’entrée de sable. Elle a attendu des siècles ; elle attendra encore.', null, { expression: 'mystical' }),
    say('looted', MAELOR, 'Intendant', 'Un érudit du Scorpion campait près des ruines. Il a payé les rouleaux sans discuter, et sans demander d’où ils venaient.', null),
  ], MORVAN_MEETING)),
  scene('scorpion_pre_temple_assault', 'shadow_signs', 'Assaut du temple', chained([
    say('1', GUARDIAN_CHIEF, 'Phénix', 'Le Scorpion lit tout et ne comprend rien. Ce codex ne quittera pas sa flamme tant que je respire.', null, { expression: 'hostile' }),
  ])),
  scene('scorpion_temple_assault_aftermath', 'shadow_signs', 'Le codex repris', chained([
    say('1', SERAPHINE, 'Sage', 'Le codex. Ses pages sont chaudes, comme si la flamme les avait lues avant nous. Rapportons-le au Grand Inquisiteur.', null, { expression: 'mystical' }),
    say('2', KESTREL, 'Éclaireuse', 'Le chef des gardiens est tombé. Mais une cellule, à l’écart de la nef, a été vidée en hâte : quelqu’un est parti avant nous.', null, { expression: 'stern' }),
  ])),
  scene('scorpion_pre_temple_seizure', 'shadow_signs', 'Prise du codex', chained([
    say('1', GUARDIAN_CHIEF, 'Phénix', 'Ni pour le Scorpion, ni pour le Phénix : pour vous seuls. Vous ne valez pas mieux que ceux qui vous envoient.', null, { expression: 'hostile' }),
  ])),
  scene('scorpion_temple_seizure_aftermath', 'shadow_signs', 'Le codex pris', chained([
    say('1', MAELOR, 'Intendant', 'Le codex est à nous. Le Scorpion et le Phénix devront traiter avec ceux qui le tiennent.'),
    say('2', MARIAN, 'Soigneuse', 'Ou ils s’uniront pour le reprendre, et nous n’aurons pas le droit de nous en plaindre.', null, { expression: 'stern' }),
  ])),
  scene('scorpion_sacred_ashes', 'mystery_shrine', 'Cendres sacrées', [
    say('1', KESTREL, 'Éclaireuse', 'Un sanctuaire creusé dans la roche. Les cendres sacrées du Phénix y couvent encore ; des braises rouges luisent sous la cendre grise.', '2'),
    say('2', SERAPHINE, 'Sage', 'Les flammes purificatrices du Phénix naissent ici. Ce lieu n’est pas à nous.', '3', { expression: 'mystical' }),
    say('3', MAELOR, 'Intendant', 'Des braises qui ne s’éteignent jamais. Un forgeron en donnerait une fortune, et un érudit davantage.', 'choice'),
    say('choice', ALISTAIR, 'Décision', 'Que faisons-nous ?', null, { choices: [
      choice('Respecter les cendres sacrées.', 'respected', [flag('scorpionAshesRespected')], ['Le sanctuaire intact']),
      choice('Emporter des braises.', 'taken', [flag('scorpionAshesTaken'), item('red_gem', 1), reputation(-1)], ['Une gemme rouge', 'Un sanctuaire du Phénix pillé']),
    ] }),
    say('respected', MARIAN, 'Soigneuse', 'Nous repartons sans rien toucher. La chaleur des cendres nous accompagne jusqu’au seuil.', null, { expression: 'grateful' }),
    say('taken', MARIAN, 'Soigneuse', 'Maelor emporte une braise, rouge comme une gemme. Derrière nous, les cendres pâlissent.', null, { expression: 'wounded' }),
  ]),
  scene('scorpion_prophet_aftermath', 'lion_finale_judgement', 'Le Prophète des Ombres vaincu', chained([
    say('1', PROPHET, 'Vaincu', 'Les prophéties… ne sont que des mots. Ceux que je sers n’ont besoin que de mots, et d’un clan prêt à y croire.', null, { expression: 'wounded' }),
    say('2', SERAPHINE, 'Sage', 'Les Ombres, derrière un quatrième clan. Le Phénix n’a pas choisi seul sa haine du Scorpion : on la lui a soufflée.', null, { expression: 'mystical' }),
  ])),
  scene('scorpion_inquisitor_pre_combat', 'lion_finale_judgement', 'Épreuve du Scorpion', chained([
    say('1', INQUISITOR, 'Grand Inquisiteur', 'Vous voulez mon Sceau par la force plutôt que par ma confiance. Soit. Seule la vérité, même amère, peut sauver ce monde ; voyons ce que vaut la vôtre. Mes érudits et moi, contre votre compagnie.', null, { expression: 'hostile' }),
    say('2', KESTREL, 'Épreuve', 'Nous l’assumerons.', null, { expression: 'stern' }),
  ])),
  scene('scorpion_trial_aftermath', 'lion_finale_judgement', 'Le Sceau arraché', chained([
    say('1', INQUISITOR, 'Grand Inquisiteur', 'Le Sceau est à vous. Mes érudits l’ont consigné. Ne comptez plus sur le savoir du Scorpion le jour où vous en aurez besoin.', null, { expression: 'wounded' }),
  ])),
]);

// ---------------------------------------------------------------------------------------------------------------------
// State-built scenes

/**
 * OD-2026-11-13-F (N1), lines approved word for word on 2026-11-13: freeing the faithful costs a fight against the
 * scholars who hold him; leaving him to them avoids it at its unchanged price. Once the scholars are beaten, the same
 * scene reopens on the faithful's confession and Eldwin's meeting for that branch.
 */
function scorpionScholars(state: Readonly<GameState>): DialogueSequence {
  if (state.flags.scorpionScholarsDefeated) {
    return scene('scorpion_scholars', 'mystery_ambush', 'Érudits du Scorpion', withMeetingPart([
      say('freed', CAPTIVE, 'Aveu', 'Vous n’êtes pas des leurs ? Alors écoutez : au temple, un étranger parle à nos gardiens depuis des lunes. Il prophétise, et ils l’écoutent.', 'freed2', { expression: 'wounded' }),
      say('freed2', SCHOLAR, 'Scorpion', 'Le Grand Inquisiteur saura qui nous a pris notre témoin.', null, { expression: 'wounded' }),
    ], ELDWIN_MEETING, ['freed2']));
  }
  return scene('scorpion_scholars', 'mystery_ambush', 'Érudits du Scorpion', withMeetingPart([
    say('1', KESTREL, 'Éclaireuse', 'Un camp d’érudits du Scorpion sur la piste du temple. Ils ont attaché un fidèle du Phénix au pied d’une tente, et ils l’interrogent depuis l’aube.', '2', { expression: 'stern' }),
    say('2', SCHOLAR, 'Scorpion', 'Il connaît les passages du temple. Il finira par les dire. Le Grand Inquisiteur nous a laissé le temps qu’il faudra.', '3'),
    say('3', CAPTIVE, 'Phénix', 'Je ne dirai rien du temple. Faites de moi ce que vous voudrez.', '4', { expression: 'hostile' }),
    say('4', MAELOR, 'Intendant', 'Laissons les érudits travailler. Ce qu’il dira nous servira autant qu’à eux, et le Scorpion saura que nous ne le gênons pas.', '5'),
    say('5', MARIAN, 'Soigneuse', 'Ils le privent d’eau depuis l’aube. Il ne tiendra pas jusqu’au soir.', 'choice', { expression: 'stern' }),
    say('choice', ALISTAIR, 'Décision', 'Que faisons-nous ?', null, { expression: 'stern', choices: [
      choice('Libérer le fidèle du Phénix.', 'refusal', [flag('scorpionFaithfulFreed'), fight('scorpion_scholars_camp')],
        ['Combat contre les érudits du Scorpion', 'Un fidèle libre', 'Le Grand Inquisiteur l’apprendra']),
      choice('Le laisser aux érudits.', 'abandoned', [flag('scorpionFaithfulAbandoned'), gold(50), reputation(-2)], ['50 or des érudits', 'Un acte que le Scorpion consignera']),
    ] }),
    say('refusal', SCHOLAR, 'Scorpion', 'Ce témoin appartient au Grand Inquisiteur. Si vous le voulez, il faudra nous le prendre.', null, { expression: 'hostile' }),
    say('abandoned', SCHOLAR, 'Scorpion', 'Prenez ceci pour la route. Le Scorpion sait remercier ceux qui ne le gênent pas.', 'abandoned2'),
    say('abandoned2', MARIAN, 'Soigneuse', 'Il nous a regardés partir. Je n’oublierai pas ce regard.', null, { expression: 'wounded' }),
  ], ELDWIN_MEETING, ['abandoned2']));
}

function scorpionAudience(state: Readonly<GameState>): DialogueSequence {
  const flags = state.flags;
  const sealsLine = flags.dragonShadowShamanDefeated
    ? 'On dit que Kaelen vous a confié le Sceau du Dragon, et qu’un Chaman des Ombres est tombé sur ses cimes. Le Dragon se trompe rarement. Je vérifierai par moi-même.'
    : flags.dragonTrialWon
      ? 'Mes érudits ont aussi noté le Sceau du Dragon arraché à Kaelen par l’épreuve. Je ne juge pas encore. Je note.'
      : 'Trois Sceaux vous ont menés jusqu’ici. Ce qu’ils valent, mes érudits le consigneront.';
  return scene('scorpion_audience', 'lion_briefing', 'Audience du Grand Inquisiteur', [
    say('open', INQUISITOR, 'Grand Inquisiteur', 'Le Clan du Phénix garde dans son temple un codex prophétique, plus ancien que nos deux clans. Il pourrait révéler la vraie nature des Ombres Silencieuses.', 'seals', { expression: 'stern' }),
    say('seals', INQUISITOR, 'Trois Sceaux', sealsLine, 'request', { expression: 'stern' }),
    say('request', INQUISITOR, 'Requête', 'Le Phénix est trop idéaliste pour comprendre ce qu’il garde. Il prie devant ses flammes purificatrices et laisse dormir le seul texte qui pourrait nous armer. Rapportez-moi ce codex, et le Sceau du Scorpion entendra votre nom.', 'seraphine', { expression: 'stern' }),
    say('seraphine', SERAPHINE, 'Sage', 'Un savoir interdit l’est rarement sans raison, Grand Inquisiteur. Et un texte lu par un seul clan ne dit que ce que ce clan veut y lire. Cherchons la vérité par nous-mêmes avant de la confier à qui que ce soit.', 'maelor', { expression: 'mystical' }),
    say('maelor', MAELOR, 'Intendant', 'Ou lisons ce codex avant tout le monde. Un savoir que tous les clans convoitent vaut plus que n’importe quel Sceau, pour qui sait à qui le vendre… Je dis seulement ce que chacun pense devant ce marché.', 'alistair'),
    say('alistair', KESTREL, 'Clan sans terre', 'Nous sommes venus chercher un Sceau, pas un savoir à revendre.', 'mandate', { expression: 'stern' }),
    say('mandate', INQUISITOR, 'Mandat', 'Alors. Me rapporterez-vous le codex prophétique ?', null, { expression: 'stern', choices: [
      choice('Rapporter le codex sans marchander.', 'accepted', [flag('scorpionMandateHonour'), reputation(1)], ['Parole claire devant le Scorpion', 'Le Grand Inquisiteur observe votre conduite']),
      choice('Exiger de lire le codex avant lui.', 'terms', [flag('scorpionMandateTerms'), reputation(-1)], ['Le codex lu avant lui', 'L’exigence pèsera dans le jugement']),
    ] }),
    say('accepted', INQUISITOR, 'Parole', 'Bien. Le temple est loin, et le Phénix ne prête rien à personne.', null, { expression: 'stern' }),
    say('terms', INQUISITOR, 'Parole conditionnée', 'Vous voulez lire avant moi ce que je cherche depuis des années. Soit. Mes érudits noteront aussi cette exigence.', null, { expression: 'hostile' }),
  ]);
}

function scorpionPhoenixTemple(state: Readonly<GameState>): DialogueSequence {
  const sworn = Boolean(state.flags.scorpionPhoenixOath);
  return scene('scorpion_phoenix_temple', 'shadow_signs', 'Temple du Phénix', chained([
    say('open', KESTREL, 'Éclaireuse', 'Le Temple du Phénix. Une flamme brûle au cœur de la nef, et le codex repose devant elle, gardé par le chef des gardiens en personne.', null, { expression: 'stern' }),
    sworn
      ? say('oath', GUARDIAN_CHIEF, 'Phénix', 'Les étrangers du serment fait à nos fidèles. Tenez-le, et laissez le codex à sa flamme. Rompez-le, et le Phénix saura ce que vaut votre parole.', null, { expression: 'stern' })
      : say('chief', GUARDIAN_CHIEF, 'Phénix', 'Le Scorpion envoie des étrangers prendre ce qu’il n’ose pas réclamer lui-même. Ce codex ne quittera pas sa flamme.', null, { expression: 'hostile' }),
    sworn
      ? say('seraphine', SERAPHINE, 'Sage', 'Nous avons promis ce codex au Grand Inquisiteur, et juré au Phénix de ne pas le lui livrer. L’une de ces deux paroles va se briser ici.', null, { expression: 'stern' })
      : say('seraphine', SERAPHINE, 'Sage', 'Le Grand Inquisiteur attend ce codex, et notre parole le lui promet. Mais souvenez-vous : celui qui lira ces pages leur fera dire ce qu’il voudra.', null, { expression: 'mystical' }),
    say('maelor', MAELOR, 'Intendant', 'Ou gardons-le. Le seul texte qui parle des Ombres, entre nos mains : le Scorpion devra traiter avec nous, et le Phénix aussi.', null),
    say('choice', ALISTAIR, 'Décision', 'Le temple attend notre réponse.', null, { expression: 'stern', choices: [
      choice('Prendre le codex pour le Grand Inquisiteur.', null, [flag('scorpionCodexDelivered'), reputation(1), fight('scorpion_temple_assault')],
        ['Combat contre le chef des gardiens du Phénix', 'Le codex rapporté au Scorpion']),
      choice('Prendre le codex et le garder pour le clan.', null, [flag('scorpionCodexKept'), reputation(-2), fight('scorpion_temple_seizure')],
        ['Combat contre le chef des gardiens du Phénix', 'Le codex gardé pour le clan']),
      choice('Tenir notre serment et laisser le codex au Phénix.', 'protected',
        [flag('scorpionCodexProtected'), reputation(-1), { type: 'setClanRelation', clan: 'phoenix', stance: 'ally', cause: 'scorpion.codex' }],
        ['Le Phénix vous doit une faveur', 'Le Grand Inquisiteur l’apprendra'], { requiresFlag: 'scorpionPhoenixOath' }),
    ] }),
    say('protected', GUARDIAN_CHIEF, 'Phénix', 'Des étrangers qui tiennent parole. Le Phénix n’oubliera pas que vous avez laissé sa flamme en paix.', 'protected2', { expression: 'grateful' }),
    say('protected2', SERAPHINE, 'Sage', 'Et le Grand Inquisiteur n’oubliera pas que nous revenons les mains vides.', null, { expression: 'stern' }),
  ]));
}

function scorpionProphetTraces(state: Readonly<GameState>): DialogueSequence {
  const freed = state.flags.scorpionFaithfulFreed
    ? 'Le fidèle que vous avez arraché aux érudits parlait de ce prophète. Il disait vrai : ces feuillets sont des prophéties, et aucune n’est du Phénix.'
    : 'Ces feuillets sont des prophéties, et aucune n’est du Phénix. Quelqu’un vivait ici et parlait à sa place.';
  return scene('scorpion_prophet_traces', 'mystery_ambush', 'Cellule du Prophète', chained([
    say('open', KESTREL, 'Éclaireuse', 'Une cellule à l’écart du temple, vidée en hâte. Des feuillets épars, couverts d’une écriture serrée qui n’est pas celle du Phénix.', null, { expression: 'stern', effects: [flag('scorpionProphetTraceFound')] }),
    say('freed', SERAPHINE, 'Sage', freed, null, { expression: 'mystical' }),
    say('maelor', MAELOR, 'Intendant', 'Celui qui écrivait ici est parti avant nous. Il savait qu’on viendrait le chercher.'),
  ]));
}

function scorpionTempleWitnesses(state: Readonly<GameState>): DialogueSequence {
  const flags = state.flags;
  const witnesses = flags.dragonPilgrimsProtected
    ? 'Comme les pèlerins du Dragon, ils veulent parler avec leurs propres mots. Laissons-les marcher avec nous.'
    : flags.dragonPilgrimsSilenced
      ? 'Les pèlerins du Dragon se sont tus sous nos lames. Je ne veux pas que le désert en compte d’autres.'
      : 'Des témoins libres pèsent plus lourd qu’un récit que nous ferions nous-mêmes.';
  const opening = flags.scorpionCodexProtected
    ? 'Nous avons quitté le temple derrière vous. Ce que nous y voyons depuis des lunes, il faut que quelqu’un l’entende : l’étranger qui murmurait à nos gardiens des prophéties que personne n’avait jamais lues.'
    : 'Nous avons fui le temple pendant le combat. Nous avons tout vu : le codex, la flamme, et l’étranger qui murmurait à nos gardiens des prophéties que personne n’avait jamais lues.';
  const fear = flags.scorpionCodexKept || flags.scorpionCodexProtected
    ? 'Ils ont vu ce que nous avons fait du codex. S’ils parlent au Grand Inquisiteur, nous n’aurons plus rien à expliquer.'
    : 'Des fidèles du Phénix devant le Grand Inquisiteur… Il les écoutera, puis il les gardera. Le Scorpion ne laisse jamais repartir un témoin.';
  return scene('scorpion_temple_witnesses', 'witnesses_on_road', 'Fidèles rescapés', [
    say('open', FAITHFUL, 'Fidèles rescapés', opening, 'request'),
    say('request', FAITHFUL, 'Témoignage', 'Nous voulons le dire nous-mêmes au Grand Inquisiteur. Que le Scorpion sache que le Phénix n’a pas choisi cette haine seul.', 'seraphine'),
    say('seraphine', SERAPHINE, 'Sage', witnesses, 'maelor', { expression: 'mystical' }),
    say('maelor', MAELOR, 'Intendant', fear, 'choice'),
    say('choice', ALISTAIR, 'Décision', 'Que faisons-nous d’eux ?', null, { expression: 'stern', choices: [
      choice('Escorter les fidèles jusqu’au Grand Inquisiteur.', 'protected', [flag('scorpionWitnessesProtected'), reputation(1)], ['Des témoins libres devant le Grand Inquisiteur']),
      choice('Les réduire au silence, quel qu’en soit le prix.', 'silenced', [flag('scorpionWitnessesSilenced'), reputation(-2)], ['Aucun témoin devant le Grand Inquisiteur', 'Un acte que le désert retiendra']),
    ] }),
    say('protected', FAITHFUL, 'Escorte', 'Merci. Nous marcherons avec vous, mais nous parlerons pour nous.', null, { expression: 'grateful' }),
    say('silenced', MARIAN, 'Soigneuse', 'Ils se taisent. Le désert, lui, garde toutes les traces.', null, { expression: 'wounded' }),
  ]);
}

function scorpionCorruptedTexts(state: Readonly<GameState>): DialogueSequence {
  const flags = state.flags;
  const ore = flags.bearDarkOreEvidence
    ? 'Je reconnais cette froideur : c’est celle de l’éclat du filon sombre de l’Ours, dans notre coffre depuis les montagnes.'
    : '';
  const altar = flags.dragonShadowEvidence
    ? `${ore ? 'Et c’est' : 'C’est'} la même souillure que l’éclat de l’autel du Cristal, scellé avec les autres.`
    : '';
  const traces = [ore, altar].filter(Boolean).join(' ')
    || 'Je n’avais jamais vu la marque des Ombres écrite de cette façon. Mais je sais ce qu’elle annonce : elles ont touché à la foi du Phénix.';
  return scene('scorpion_corrupted_texts', 'shadow_signs', 'Pages souillées', [
    say('open', KESTREL, 'Éclaireuse', 'Une page arrachée au codex, cachée au fond du sanctuaire. Son encre est noire et froide, et ses lignes ne sont pas des prophéties.', 'reading', { expression: 'fearful' }),
    say('reading', SERAPHINE, 'Sage', 'Quelqu’un a écrit entre les lignes du codex. Pas une prophétie : un ordre, glissé dans la foi des autres.', 'traces', { expression: 'mystical' }),
    say('traces', SERAPHINE, 'Les Ombres', traces, 'maelor', { expression: 'mystical' }),
    say('maelor', MAELOR, 'Intendant', 'Une page que personne ne devrait lire. Brûlons-la, et n’en parlons plus.', 'choice'),
    say('choice', ALISTAIR, 'Décision', 'Que faisons-nous de cette page ?', null, { choices: [
      choice('La sceller comme preuve.', 'sealed', [flag('scorpionShadowEvidence')], ['Une preuve à montrer au Grand Inquisiteur']),
      choice('La brûler sur-le-champ.', 'burned', [flag('scorpionShadowBurned'), reputation(-1)], ['La page détruite', 'Aucune preuve à montrer']),
    ] }),
    say('sealed', SERAPHINE, 'Sage', 'Je l’enferme dans le coffre doublé de plomb, avec les autres. Le Grand Inquisiteur devra la voir.', null, { expression: 'mystical' }),
    say('burned', KESTREL, 'Éclaireuse', 'La page se tord dans la flamme sans faire de fumée. Nous ne saurons jamais ce qu’elle ordonnait.', null),
  ]);
}

function scorpionVigil(state: Readonly<GameState>): DialogueSequence {
  const wards = state.flags.scorpionWardsRespected
    ? 'Des fidèles du Phénix ont laissé une lampe à notre porte. Ils n’ont pas dit un mot ; ils savent que nous avons respecté leurs sceaux.'
    : 'Personne ne s’approche de notre feu. Le désert, ce soir, nous laisse seuls.';
  return scene('scorpion_vigil', 'lion_refuge', 'Veillée au désert', chained([
    say('1', KESTREL, 'Veillée', 'Le Grand Inquisiteur nous attend demain. Tout ce que nous avons fait dans ce désert sera consigné devant lui.', null, { expression: 'stern' }),
    say('wards', MARIAN, 'Soigneuse', wards, null),
    say('2', SERAPHINE, 'Sage', 'Le Scorpion n’oublie rien. Il ne nous jugera pas sur nos mots, mais sur ce que ses érudits ont noté de nous.', null, { expression: 'mystical' }),
    say('3', MAELOR, 'Intendant', 'Quatre Sceaux, bientôt. Et un codex qui parle des Ombres… Un jour, quelqu’un voudra savoir ce que nous en avons appris. J’aimerais savoir quoi lui répondre.'),
  ]));
}

function scorpionProphetPreCombat(state: Readonly<GameState>): DialogueSequence {
  return scene('scorpion_prophet_pre_combat', 'lion_finale_judgement', 'Prophète des Ombres', chained([
    say('1', INQUISITOR, 'Grand Inquisiteur', 'Le codex parle d’un Prophète des Ombres. Il manipule les croyances des clans : il a soufflé au Phénix ses peurs, et peut-être au Scorpion les siennes.', null, { expression: 'stern' }),
    say('2', INQUISITOR, 'Alliance', 'Il s’est enfui dans les dunes. Traquez-le, empêchez ses fausses prophéties de se répandre, et le Sceau du Scorpion scellera notre alliance.', null, { expression: 'stern' }),
    state.flags.scorpionProphetTraceFound
      ? say('3', KESTREL, 'Éclaireuse', 'Sa cellule, près du temple, était pleine de ses feuillets. Je reconnaîtrai sa piste.', null, { expression: 'stern' })
      : say('3', SERAPHINE, 'Sage', 'Celui qui écrit les prophéties des autres ne reste jamais près de ses lecteurs. Il faudra aller le chercher.', null, { expression: 'mystical' }),
    say('4', PROPHET, 'Prophète des Ombres', 'Vous avez rapporté le codex à un clan qui croit lire mieux que les autres. Chaque clan croit cela. C’est pour cela que mes prophéties prennent si bien.', null, { expression: 'hostile' }),
  ]));
}

/** The Scorpion's state-built scenes, by dialogue ID. The judgement and epilogue come from the plateau finale engine. */
export const SCORPION_SCENE_BUILDERS: Readonly<Record<string, (state: Readonly<GameState>) => DialogueSequence>> = Object.freeze({
  scorpion_audience: scorpionAudience,
  scorpion_scholars: scorpionScholars,
  scorpion_phoenix_temple: scorpionPhoenixTemple,
  scorpion_prophet_traces: scorpionProphetTraces,
  scorpion_temple_witnesses: scorpionTempleWitnesses,
  scorpion_corrupted_texts: scorpionCorruptedTexts,
  scorpion_vigil: scorpionVigil,
  scorpion_prophet_pre_combat: scorpionProphetPreCombat,
});

/** Static Scorpion dialogues registered in the post-demo content registry. */
export const SCORPION_DIALOGUES: readonly DialogueSequence[] = SCORPION_STATIC_DIALOGUES;
