/**
 * OD-2026-11-11-F (F2): the meetings of the six heroes who were never recruitable, two per post-demo plateau. Lines
 * approved word for word by the operator on 2026-11-11 (docs/content/drafts/SIX_HEROES_MEETINGS_DRAFT_2026-11-11.md).
 *
 * Each meeting follows an existing choice scene, which keeps every line it had: its outcome steps lead into the meeting
 * instead of ending, and the hero reacts to the choice just made. One honour hero (no gold, a reputation condition that a
 * bad choice can close or price) and one mercenary hero (gold) per plateau. A hero met but not recruited waits at the
 * refuge his farewell names (refugeRecruitment.ts).
 */
import type { DialogueChoice, DialogueStep, NarrativeEffect } from '../../game/types';

interface Who { speaker: string; actorId: string; side: 'left' | 'right' }
const ALISTAIR: Who = { speaker: 'Alistair', actorId: 'alistair', side: 'left' };
const SERAPHINE: Who = { speaker: 'Sage Séraphine', actorId: 'sage_seraphine', side: 'left' };
const MAELOR: Who = { speaker: 'Intendant Maelor', actorId: 'maelor', side: 'left' };
const MARIAN: Who = { speaker: 'Marian', actorId: 'marian', side: 'left' };
const KESTREL: Who = { speaker: 'Kestrel', actorId: 'kestrel', side: 'left' };
const GUNNAR: Who = { speaker: 'Gunnar', actorId: 'gunnar', side: 'right' };
const ALDRIC: Who = { speaker: 'Aldric', actorId: 'aldric', side: 'right' };
const LYRA: Who = { speaker: 'Lyra', actorId: 'lyra', side: 'right' };
const TALON: Who = { speaker: 'Talon', actorId: 'talon', side: 'right' };
const ELDWIN: Who = { speaker: 'Eldwin', actorId: 'eldwin', side: 'right' };
const MORVAN: Who = { speaker: 'Morvan', actorId: 'morvan', side: 'right' };

type Expression = DialogueStep['expression'];

function say(id: string, who: Who, tag: string, text: string, next: string | null,
  options: { expression?: Expression; choices?: DialogueChoice[] } = {}): DialogueStep {
  return { id, speaker: who.speaker, actorId: who.actorId, side: who.side, tag, text, expression: options.expression ?? 'neutral',
    portrait: '', next, effects: [], choices: options.choices ?? [] };
}

const recruit = (unitId: string): NarrativeEffect => ({ type: 'recruitUnit', unitId });
const gold = (amount: number): NarrativeEffect => ({ type: 'addGold', amount });
const reputation = (amount: number): NarrativeEffect => ({ type: 'addReputation', amount });

export interface HeroMeeting {
  /** The recruitable unit the meeting offers. */
  unitId: string;
  /** Host scene outcome step → first meeting step it now leads to. */
  links: Readonly<Record<string, string>>;
  steps: readonly DialogueStep[];
}

/** The host scene with its outcome steps leading into the meeting, every original line unchanged. */
export function withMeeting(steps: readonly DialogueStep[], meeting: HeroMeeting): DialogueStep[] {
  for (const id of Object.keys(meeting.links)) {
    const step = steps.find((candidate) => candidate.id === id);
    if (!step || step.next !== null || step.choices?.length) throw new Error(`Meeting ${meeting.unitId}: host step '${id}' must end the scene.`);
  }
  return [...steps.map((step) => meeting.links[step.id] ? { ...step, next: meeting.links[step.id]! } : step), ...meeting.steps];
}

/**
 * OD-2026-11-13-F (N1): the part of a meeting that follows the given host steps only, every line unchanged. A host
 * scene whose branch leads to a fight keeps the other branch's part, and the same scene, reopened after the victory,
 * plays the fight branch's part: the hero reacts to what has really happened.
 */
export function withMeetingPart(steps: readonly DialogueStep[], meeting: HeroMeeting, hostIds: readonly string[]): DialogueStep[] {
  const links = Object.fromEntries(Object.entries(meeting.links).filter(([host]) => hostIds.includes(host)));
  const reachable = new Set<string>();
  const pending = Object.values(links);
  while (pending.length) {
    const id = pending.pop()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    const step = meeting.steps.find((candidate) => candidate.id === id);
    if (step?.next) pending.push(step.next);
    for (const option of step?.choices ?? []) if (option.next) pending.push(option.next);
  }
  return withMeeting(steps, { ...meeting, links, steps: meeting.steps.filter((step) => reachable.has(step.id)) });
}

// ---------------------------------------------------------------------------------------------------------------------
// Ours

/** Gunnar, after « Convoi de minerai », whatever the choice. */
export const GUNNAR_MEETING: HeroMeeting = Object.freeze({
  unitId: 'artillerist',
  links: { reported: 'gunnar_open_r', seized: 'gunnar_open_s' },
  steps: [
    ...(['r', 's'] as const).flatMap((branch) => [
      say(`gunnar_open_${branch}`, KESTREL, 'Éclaireuse', 'Quelqu’un nous suit depuis le pont. Un homme encapuchonné, un canon de poing à la ceinture et assez de poudre pour faire sauter une colline.', `gunnar_intro_${branch}`, { expression: 'stern' }),
      say(`gunnar_intro_${branch}`, GUNNAR, 'Artilleur', 'Gunnar. Je faisais sauter la roche pour les mineurs de l’Ours, avant que le Corbeau prenne les galeries. Depuis, ma poudre ne sert à personne.', `gunnar_react_${branch}`),
    ]),
    say('gunnar_react_r', GUNNAR, 'Artilleur', 'Vous avez marqué ce convoi au lieu de le vider. Les mineurs vous le rendront. Moi, je ne suis pas mineur : je me loue.', 'gunnar_price'),
    say('gunnar_react_s', GUNNAR, 'Artilleur', 'Vous avez pris le minerai. Bonne prise. Moi, je ne vole rien : je me loue.', 'gunnar_price'),
    say('gunnar_price', GUNNAR, 'Artilleur', 'Cent vingt pièces, et mon canon est à vous jusqu’au dernier Sceau.', 'gunnar_maelor'),
    say('gunnar_maelor', MAELOR, 'Intendant', 'Un homme qui donne son prix avant son nom. Au moins, nous savons ce qu’il vaut.', 'gunnar_choice'),
    say('gunnar_choice', ALISTAIR, 'Décision', 'Que répondons-nous à Gunnar ?', null, { expression: 'stern', choices: [
      { text: 'Engager Gunnar — 120 or.', next: 'gunnar_hired', requiresGold: 120, effects: [gold(-120), recruit('artillerist')] },
      { text: 'Décliner.', next: 'gunnar_declined', effects: [] },
    ] }),
    say('gunnar_hired', GUNNAR, 'Artilleur', 'Marché conclu. Montrez-moi un mur du Corbeau, je vous montrerai un trou.', 'gunnar_hired2', { expression: 'grateful' }),
    say('gunnar_hired2', KESTREL, 'Éclaireuse', 'Préviens avant d’allumer une mèche. Je tiens à mes oreilles.', null),
    say('gunnar_declined', GUNNAR, 'Artilleur', 'Comme vous voudrez. Je descends au refuge des mineurs. Si vous changez d’avis, demandez Gunnar.', null),
  ],
});

/** Aldric, after « Sanctuaire de la montagne ». */
export const ALDRIC_MEETING: HeroMeeting = Object.freeze({
  unitId: 'paladin',
  links: { honoured: 'aldric_open_h', plundered: 'aldric_open_p' },
  steps: [
    ...(['h', 'p'] as const).flatMap((branch) => [
      say(`aldric_open_${branch}`, SERAPHINE, 'Sage', 'Quelqu’un veillait derrière l’autel. Un chevalier en armure claire, une masse posée sur les genoux. Il nous observe depuis notre arrivée.', `aldric_intro_${branch}`, { expression: 'mystical' }),
      say(`aldric_intro_${branch}`, ALDRIC, 'Paladin', 'Aldric. Je garde ce sanctuaire depuis que les mineurs n’osent plus monter jusqu’ici.', `aldric_react_${branch}`),
    ]),
    say('aldric_react_h', ALDRIC, 'Paladin', 'J’ai vu ce que vous avez laissé à la montagne. Je ne demande pas d’or. Je cherche une bannière qui mérite qu’on la suive jusqu’au jugement de Borin, et plus loin s’il le faut.', 'aldric_marian'),
    say('aldric_marian', MARIAN, 'Soigneuse', 'Un homme qui garde des prières que personne ne vient compter. Il me plaît déjà.', 'aldric_choice_h', { expression: 'grateful' }),
    say('aldric_choice_h', ALISTAIR, 'Décision', 'Que répondons-nous à Aldric ?', null, { expression: 'stern', choices: [
      { text: 'Accueillir Aldric dans la compagnie.', next: 'aldric_joined', requiresReputationMin: 55,
        blockedText: 'Réputation insuffisante — Aldric ne suit pas les clans sans honneur.', effects: [recruit('paladin')] },
      { text: 'Décliner.', next: 'aldric_left', effects: [] },
    ] }),
    say('aldric_react_p', ALDRIC, 'Paladin', 'J’ai vu ce que vous avez pris. Ce n’étaient pas vos prières. Je ne suivrai pas une bannière qui vide les autels. Rendez à la montagne ce qui lui appartient, ou passez votre chemin.', 'aldric_maelor', { expression: 'stern' }),
    say('aldric_maelor', MAELOR, 'Intendant', 'Cinquante pièces pour un chevalier. Le compte est vite fait.', 'aldric_choice_p'),
    say('aldric_choice_p', ALISTAIR, 'Décision', 'Que répondons-nous à Aldric ?', null, { expression: 'stern', choices: [
      { text: 'Rendre les 50 or au sanctuaire et accueillir Aldric.', next: 'aldric_joined', requiresGold: 50, requiresReputationMin: 55,
        blockedText: 'Réputation insuffisante — Aldric ne suit pas les clans sans honneur.', effects: [gold(-50), reputation(1), recruit('paladin')] },
      { text: 'Garder l’or et repartir.', next: 'aldric_left', effects: [] },
    ] }),
    say('aldric_joined', ALDRIC, 'Paladin', 'Ma masse est à vous. Qu’elle ne frappe jamais ceux qui prient.', 'aldric_joined2', { expression: 'grateful' }),
    say('aldric_joined2', SERAPHINE, 'Sage', 'La montagne nous prête un gardien. Tâchons de ne pas le lui faire regretter.', null, { expression: 'mystical' }),
    say('aldric_left', ALDRIC, 'Paladin', 'Je garderai l’autel jusqu’au jugement. Si votre route vous mène à la veillée, je serai là.', null),
  ],
});

// ---------------------------------------------------------------------------------------------------------------------
// Dragon

/** Lyra, after « Hameau terrorisé ». */
export const LYRA_MEETING: HeroMeeting = Object.freeze({
  unitId: 'red_mage',
  links: { protected: 'lyra_open_p', extorted: 'lyra_open_e' },
  steps: [
    ...(['p', 'e'] as const).flatMap((branch) => [
      say(`lyra_open_${branch}`, MARIAN, 'Soigneuse', 'Une femme sort de la grange la plus proche, une rapière à la main et de la suie jusqu’aux coudes. Les villageois s’écartent devant elle avec respect.', `lyra_intro_${branch}`),
      say(`lyra_intro_${branch}`, LYRA, 'Mage Rouge', 'Lyra. Je tiens ce hameau depuis trois nuits, avec ma lame et un peu de feu. Le Loup a appris que mes flammes brûlent plus vite que ses torches.', `lyra_react_${branch}`),
    ]),
    say('lyra_react_p', LYRA, 'Mage Rouge', 'Cette nuit, vous avez monté la garde avec moi. C’est plus que ce que le Dragon a fait en un mois. Je n’ai pas besoin d’or : si votre route monte jusqu’au Cristal, ma lame monte avec vous.', 'lyra_kestrel', { expression: 'grateful' }),
    say('lyra_kestrel', KESTREL, 'Éclaireuse', 'Elle se bat seule depuis trois nuits. Elle saura se battre avec nous.', 'lyra_choice_p'),
    say('lyra_choice_p', ALISTAIR, 'Décision', 'Que répondons-nous à Lyra ?', null, { expression: 'stern', choices: [
      { text: 'Accueillir Lyra dans la compagnie.', next: 'lyra_joined', requiresReputationMin: 45,
        blockedText: 'Réputation insuffisante — Lyra ne suit pas les clans sans honneur.', effects: [recruit('red_mage')] },
      { text: 'Décliner.', next: 'lyra_left', effects: [] },
    ] }),
    say('lyra_react_e', LYRA, 'Mage Rouge', 'Cette nuit, vous avez fait payer ces gens pour une protection que je leur donnais pour rien. Rendez-leur leur or, et je vous suivrai jusqu’au Cristal. Gardez-le, et nous n’avons plus rien à nous dire.', 'lyra_seraphine', { expression: 'hostile' }),
    say('lyra_seraphine', SERAPHINE, 'Sage', 'Elle nous offre de réparer ce que nous avons pris. C’est plus que nous ne méritons.', 'lyra_choice_e', { expression: 'stern' }),
    say('lyra_choice_e', ALISTAIR, 'Décision', 'Que répondons-nous à Lyra ?', null, { expression: 'stern', choices: [
      { text: 'Rendre les 60 or au hameau et accueillir Lyra.', next: 'lyra_joined', requiresGold: 60, requiresReputationMin: 45,
        blockedText: 'Réputation insuffisante — Lyra ne suit pas les clans sans honneur.', effects: [gold(-60), reputation(1), recruit('red_mage')] },
      { text: 'Garder l’or.', next: 'lyra_left', effects: [] },
    ] }),
    say('lyra_joined', LYRA, 'Mage Rouge', 'Alors en route. Les nuits sont longues sur les Pics ; elles le seront moins à plusieurs.', 'lyra_joined2', { expression: 'grateful' }),
    say('lyra_joined2', MARIAN, 'Soigneuse', 'Laisse-moi d’abord regarder tes brûlures. Ensuite, tu pourras sauver qui tu voudras.', null),
    say('lyra_left', LYRA, 'Mage Rouge', 'Je resterai ici tant que le Loup descendra. À l’ermitage des contreforts, on vous dira où me trouver.', null),
  ],
});

/** Talon, after « Pièges du Loup », whatever the choice. */
export const TALON_MEETING: HeroMeeting = Object.freeze({
  unitId: 'ninja',
  links: { disarmed: 'talon_open_d', turned: 'talon_open_t' },
  steps: [
    ...(['d', 't'] as const).flatMap((branch) => [
      say(`talon_open_${branch}`, KESTREL, 'Éclaireuse', 'Ne bougez pas. Quelqu’un est dans les sapins, au-dessus de nous. Je ne l’ai pas entendu arriver. Ça ne m’arrive jamais.', `talon_intro_${branch}`, { expression: 'fearful' }),
      say(`talon_intro_${branch}`, TALON, 'Ninja', 'Talon. Je suivais ces collets avant vous. Je voulais voir qui les relèverait, et ce qu’il en ferait.', `talon_react_${branch}`),
    ]),
    say('talon_react_d', TALON, 'Ninja', 'Vous avez libéré le sentier des pèlerins. Je l’aurais fait aussi. Plus vite.', 'talon_price'),
    say('talon_react_t', TALON, 'Ninja', 'Vous avez retourné les collets contre le Loup. Efficace. Je n’aurais pas mieux fait.', 'talon_price'),
    say('talon_price', TALON, 'Ninja', 'Je vends mes lames, pas mes raisons. Cent cinquante pièces, et le Loup ne verra jamais d’où viennent les coups.', 'talon_maelor'),
    say('talon_maelor', MAELOR, 'Intendant', 'Enfin quelqu’un qui parle comme un marchand.', 'talon_kestrel'),
    say('talon_kestrel', KESTREL, 'Éclaireuse', 'Ou comme un assassin.', 'talon_choice', { expression: 'stern' }),
    say('talon_choice', ALISTAIR, 'Décision', 'Que répondons-nous à Talon ?', null, { expression: 'stern', choices: [
      { text: 'Engager Talon — 150 or.', next: 'talon_hired', requiresGold: 150, effects: [gold(-150), recruit('ninja')] },
      { text: 'Décliner.', next: 'talon_declined', effects: [] },
    ] }),
    say('talon_hired', TALON, 'Ninja', 'Bien. Je marcherai derrière vous. Vous ne me verrez que lorsqu’il le faudra.', 'talon_hired2'),
    say('talon_hired2', KESTREL, 'Éclaireuse', 'Marche plutôt devant. Je préfère savoir où tu es.', null, { expression: 'stern' }),
    say('talon_declined', TALON, 'Ninja', 'Vous me reverrez peut-être. À l’abri des pèlerins, si vous avez encore de l’or.', null),
  ],
});

// ---------------------------------------------------------------------------------------------------------------------
// Scorpion

/** Eldwin, after « Érudits du Scorpion ». Leaving the faithful to the scholars closes him for the whole run. */
export const ELDWIN_MEETING: HeroMeeting = Object.freeze({
  unitId: 'enchanter',
  links: { freed2: 'eldwin_open_f', abandoned2: 'eldwin_open_a' },
  steps: [
    ...(['f', 'a'] as const).flatMap((branch) => [
      say(`eldwin_open_${branch}`, KESTREL, 'Éclaireuse', 'Un des érudits s’est tenu à l’écart pendant tout l’interrogatoire. Il nous rattrape sur la piste, un sceptre à la main et les doigts tachés d’encre.', `eldwin_intro_${branch}`),
      say(`eldwin_intro_${branch}`, ELDWIN, 'Enchanteur', 'Eldwin. J’ai voyagé avec eux pour les runes du temple, pas pour ça.', `eldwin_react_${branch}`, { expression: 'wounded' }),
    ]),
    say('eldwin_react_f', ELDWIN, 'Enchanteur', 'Vous avez détaché cet homme quand je n’ai fait que regarder. Je ne veux plus regarder. Mes runes protègent et lient ; je n’ai besoin que d’une route qui ne passe pas par une tente comme celle-ci.', 'eldwin_seraphine'),
    say('eldwin_seraphine', SERAPHINE, 'Sage', 'Des runes de cette sorte valent bien des lames, si elles sont tracées pour les bonnes raisons.', 'eldwin_choice', { expression: 'mystical' }),
    say('eldwin_choice', ALISTAIR, 'Décision', 'Que répondons-nous à Eldwin ?', null, { expression: 'stern', choices: [
      { text: 'Accueillir Eldwin dans la compagnie.', next: 'eldwin_joined', requiresReputationMin: 60,
        blockedText: 'Réputation insuffisante — Eldwin hésite à suivre votre bannière.', effects: [recruit('enchanter')] },
      { text: 'Décliner.', next: 'eldwin_declined', effects: [] },
    ] }),
    say('eldwin_joined', ELDWIN, 'Enchanteur', 'Merci. Mes runes seront pour ceux que vous protégez, jamais pour ceux qu’on interroge.', 'eldwin_joined2', { expression: 'grateful' }),
    say('eldwin_joined2', MARIAN, 'Soigneuse', 'Bienvenue. Tu porteras l’eau, au début. Les runes viendront après.', null),
    say('eldwin_declined', ELDWIN, 'Enchanteur', 'Je comprends. Je resterai à l’oasis des érudits encore quelques jours.', null),
    say('eldwin_react_a', ELDWIN, 'Enchanteur', 'Vous l’avez laissé aux érudits, comme moi. Je reste avec eux : nous méritons la même compagnie.', 'eldwin_marian', { expression: 'wounded' }),
    say('eldwin_marian', MARIAN, 'Soigneuse', 'Il a raison. C’est le pire.', null, { expression: 'wounded' }),
  ],
});

/** Morvan, after « Bibliothèque ensevelie », whatever the choice; he does not follow a company whose renown is too pure. */
export const MORVAN_MEETING: HeroMeeting = Object.freeze({
  unitId: 'dark_knight',
  links: { respected: 'morvan_open_r', looted: 'morvan_open_l' },
  steps: [
    ...(['r', 'l'] as const).flatMap((branch) => [
      say(`morvan_open_${branch}`, KESTREL, 'Éclaireuse', 'Un chevalier en armure noire est assis sur les marches ensablées, une faux contre l’épaule. Il nous regarde fouiller comme on regarde la pluie.', `morvan_intro_${branch}`, { expression: 'stern' }),
      say(`morvan_intro_${branch}`, MORVAN, 'Chevalier Noir', 'Morvan. Je loue ma faux à qui paie, et je ne demande jamais pourquoi.', `morvan_react_${branch}`),
    ]),
    say('morvan_react_r', MORVAN, 'Chevalier Noir', 'Vous avez laissé les rouleaux. Des scrupules. Ils coûtent cher, dans ce désert.', 'morvan_price'),
    say('morvan_react_l', MORVAN, 'Chevalier Noir', 'Vous avez vendu les souvenirs d’un clan. Moi, je vends ma faux. Nous nous comprendrons.', 'morvan_price'),
    say('morvan_price', MORVAN, 'Chevalier Noir', 'Cent quatre-vingts pièces. Et pas de sermon : ceux qui se croient purs ne me gardent jamais longtemps.', 'morvan_marian'),
    say('morvan_marian', MARIAN, 'Soigneuse', 'Une faux qui ne demande jamais pourquoi. C’est exactement ce qui me fait peur.', 'morvan_choice', { expression: 'fearful' }),
    say('morvan_choice', ALISTAIR, 'Décision', 'Que répondons-nous à Morvan ?', null, { expression: 'stern', choices: [
      { text: 'Engager Morvan — 180 or.', next: 'morvan_hired', requiresGold: 180, requiresReputationMax: 65,
        blockedText: 'Votre renommée est trop pure — Morvan ne suit pas les clans qui se croient au-dessus de la mêlée.', effects: [gold(-180), recruit('dark_knight')] },
      { text: 'Décliner.', next: 'morvan_declined', effects: [] },
    ] }),
    say('morvan_hired', MORVAN, 'Chevalier Noir', 'Bien. Montrez-moi qui faucher, et gardez vos prières pour vous.', 'morvan_hired2'),
    say('morvan_hired2', SERAPHINE, 'Sage', 'Nous garderons aussi un œil sur toi.', null, { expression: 'stern' }),
    say('morvan_declined', MORVAN, 'Chevalier Noir', 'Le désert est grand, et je suis patient. À l’abri des caravanes, si l’envie vous prend.', null),
  ],
});

export const HERO_MEETINGS: readonly HeroMeeting[] = Object.freeze([GUNNAR_MEETING, ALDRIC_MEETING, LYRA_MEETING, TALON_MEETING, ELDWIN_MEETING, MORVAN_MEETING]);
