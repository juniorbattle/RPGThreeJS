/**
 * Set 1.20.0, post-demo Lot 3 — DRAFT: the Grand Inquisiteur's judgement and the Scorpion's epilogue (roadmap §3.4,
 * Phase 3). Not canon until the operator approves the plateau. Every deed the Grand Inquisiteur weighs is named in the
 * words the consequence map expects: the sage names the merits, a scholar of the Scorpion the breaches and the steward
 * the stains. Credibility before the chief (R3) uses its own thresholds, proposed with the plateau: a company that kept
 * its honour through the Lion, the Bear and the Dragon arrives near 81, a company of force near 21.
 */
import type { PlateauFinaleDefinition } from '../../../game/plateauFinale';

export const SCORPION_FINALE: PlateauFinaleDefinition = Object.freeze<PlateauFinaleDefinition>({
  plateauId: 'scorpion',
  judgementDialogueId: 'scorpion_judgement',
  epilogueDialogueId: 'scorpion_epilogue',
  judgementSceneArtId: 'lion_finale_judgement',
  epilogueSceneArtId: 'epilogue',
  chief: { speaker: 'Grand Inquisiteur', actorId: 'grand_inquisitor', side: 'right' },
  sage: { speaker: 'Sage Séraphine', actorId: 'sage_seraphine', side: 'left' },
  steward: { speaker: 'Intendant Maelor', actorId: 'maelor', side: 'left' },
  guard: { speaker: 'Érudit du Scorpion', actorId: 'scorpion_scholar', side: 'right' },
  conductWeights: Object.freeze({
    scorpionMandateHonour: 1, scorpionFaithfulFreed: 1, scorpionOathRefused: 1, scorpionRiddleSolved: 1, scorpionWardsRespected: 1,
    scorpionLibraryRespected: 1, scorpionCodexDelivered: 2, scorpionWitnessesProtected: 1, scorpionAshesRespected: 1, scorpionShadowEvidence: 1,
    scorpionMandateTerms: -1, scorpionFaithfulAbandoned: -2, scorpionPhoenixOath: -2, scorpionRiddleForced: -1, scorpionWardsBroken: -1,
    scorpionLibraryLooted: -1, scorpionCodexKept: -2, scorpionCodexProtected: -3, scorpionWitnessesSilenced: -2, scorpionAshesTaken: -1,
    scorpionShadowBurned: -1,
  }),
  deeds: Object.freeze([
    { flag: 'scorpionCodexDelivered', kind: 'merit', severity: 'decisive', phrase: 'vous m’avez rapporté le codex prophétique' },
    { flag: 'scorpionMandateHonour', kind: 'merit', severity: 'important', phrase: 'vous avez accepté la requête du Grand Inquisiteur sans marchander' },
    { flag: 'scorpionFaithfulFreed', kind: 'merit', severity: 'important', phrase: 'vous avez arraché un fidèle du Phénix aux érudits du Scorpion' },
    { flag: 'scorpionOathRefused', kind: 'merit', severity: 'important', phrase: 'vous n’avez rien promis au Phénix' },
    { flag: 'scorpionRiddleSolved', kind: 'merit', severity: 'minor', phrase: 'vous avez résolu l’énigme des sables sans briser son mécanisme' },
    { flag: 'scorpionWardsRespected', kind: 'merit', severity: 'minor', phrase: 'vous avez levé les sceaux du Phénix selon leur rite' },
    { flag: 'scorpionLibraryRespected', kind: 'merit', severity: 'important', phrase: 'vous avez laissé intacte la bibliothèque ensevelie' },
    { flag: 'scorpionAshesRespected', kind: 'merit', severity: 'important', phrase: 'vous avez respecté les cendres sacrées' },
    { flag: 'scorpionCodexKept', kind: 'breach', severity: 'decisive', phrase: 'vous avez gardé le codex pour votre clan' },
    { flag: 'scorpionCodexProtected', kind: 'breach', severity: 'decisive', phrase: 'vous avez laissé le codex au Phénix' },
    { flag: 'scorpionPhoenixOath', kind: 'breach', severity: 'important', phrase: 'vous avez juré fidélité au Phénix' },
    { flag: 'scorpionFaithfulAbandoned', kind: 'breach', severity: 'important', phrase: 'vous avez livré un fidèle du Phénix à nos interrogatoires' },
    { flag: 'scorpionMandateTerms', kind: 'stain', severity: 'minor', phrase: 'le droit de lire le codex avant le Grand Inquisiteur, exigé à l’audience' },
    { flag: 'scorpionRiddleForced', kind: 'stain', severity: 'minor', phrase: 'le mécanisme de l’énigme brisé' },
    { flag: 'scorpionWardsBroken', kind: 'stain', severity: 'minor', phrase: 'les sceaux du Phénix brisés sans leur rite' },
    { flag: 'scorpionLibraryLooted', kind: 'stain', severity: 'minor', phrase: 'les rouleaux de la bibliothèque vendus' },
    { flag: 'scorpionAshesTaken', kind: 'stain', severity: 'minor', phrase: 'les braises sacrées emportées' },
    { flag: 'scorpionShadowBurned', kind: 'stain', severity: 'minor', phrase: 'la page souillée brûlée avant qu’on puisse l’étudier' },
  ]),
  forceFacts: Object.freeze(['scorpionCodexKept', 'scorpionCodexProtected', 'scorpionWitnessesSilenced']),
  honourFact: 'scorpionCodexDelivered',
  outcome: {
    tag: 'Le codex',
    lines: Object.freeze([
      { flag: 'scorpionCodexDelivered', text: 'Le codex est sur ma table, parce que vous m’avez rapporté le codex prophétique au lieu de le vendre au plus offrant.' },
      { flag: 'scorpionCodexKept', text: 'Vous avez pris le codex au Phénix, c’est vrai. Puis vous avez gardé le codex pour votre clan, comme si la vérité sur les Ombres se rangeait dans un coffre.' },
      { flag: 'scorpionCodexProtected', text: 'Vous deviez me rapporter le codex, et vous avez laissé le codex au Phénix, pour un serment fait à ceux qui me le refusent.' },
    ]),
    noneText: 'Le codex n’a été ni rapporté ni défendu. Je ne scellerai rien sur un vide.',
  },
  witnesses: {
    supportiveFlag: 'scorpionWitnessesProtected',
    silencedFlag: 'scorpionWitnessesSilenced',
    supportive: 'Les fidèles rescapés sont venus dire eux-mêmes ce qu’ils ont vu au temple. Des fidèles du Phénix, devant moi, sans qu’on leur dicte un mot : je les ai écoutés.',
    silenced: 'Des fidèles se taisent derrière vos lames. Je sais lire un silence, et celui-ci n’est pas une absence de témoins.',
    none: 'Aucun fidèle n’est venu parler pour vous. Il ne me reste que ce que mes érudits ont noté.',
  },
  evidence: {
    flag: 'scorpionShadowEvidence',
    text: 'Voici la page souillée que nous avons scellée. Les Ombres ne se contentent pas de voler ou de souiller, Grand Inquisiteur : les Ombres écrivent aussi, et elles écrivent dans la foi des autres.',
  },
  credibility: { credible: 70, high: 85 },
  opening: 'Vous revenez du temple. Mes érudits ont noté chacun de vos pas dans ce désert, et le désert a gardé le reste. Je les ai lus. Je vous écouterai ensuite.',
  intent: 'Ce qui est consigné ne s’efface pas. Dites-moi seulement ce que vous demandez au Scorpion.',
  trialChoice: 'Demander l’épreuve du Scorpion.',
  meritsLead: 'Il y a aussi ceci, et les érudits du Scorpion l’ont vu comme nous :',
  breachesLead: 'Et nos registres consignent ce qui pèse contre vous, car le Grand Inquisiteur pèse la parole autant que les actes :',
  stainsLead: 'Mes comptes gardent aussi',
  flags: { trialRequested: 'scorpionTrialRequested', honourSelected: 'scorpionFinaleHonourSelected', trialSelected: 'scorpionFinaleTrialSelected', seal: 'scorpionSealAcknowledged' },
  combats: { honour: 'scorpion_shadow_prophet', force: 'scorpion_inquisitor' },
  victoryFacts: Object.freeze({
    scorpion_temple_assault: Object.freeze({ scorpionGuardianChiefDefeated: true }),
    scorpion_temple_seizure: Object.freeze({ scorpionGuardianChiefDefeated: true }),
    scorpion_shadow_prophet: Object.freeze({ scorpionShadowProphetDefeated: true, scorpionSealAcknowledged: true }),
    scorpion_inquisitor: Object.freeze({ scorpionTrialWon: true, scorpionSealAcknowledged: true }),
  }),
  reputation: { honourClaim: 1, voluntaryTrial: -1, rejectedClaim: 0 },
  epilogue: {
    honour: 'Le Sceau du Scorpion est entre vos mains : le Grand Inquisiteur a scellé l’alliance du Scorpion, et le Prophète des Ombres est tombé dans les dunes où il semait ses fausses prophéties.',
    force: 'Le Sceau du Scorpion est entre vos mains, mais vous avez pris le Sceau du Scorpion par l’épreuve. Les érudits du Grand Inquisiteur ont tout consigné ; le Scorpion n’oubliera pas ce Sceau arraché.',
    evidence: 'La page souillée voyage avec nous, scellée avec les autres preuves. Les Ombres volent, souillent, et maintenant elles écrivent. Je n’aime pas ce que ce tableau commence à montrer.',
    noEvidence: 'La page souillée n’est plus. Ce que les Ombres écrivaient dans le codex, nous ne le lirons jamais.',
    chronicle: 'Quatre Sceaux. La route du Tournoi des Grands est ouverte, et chaque clan que nous avons croisé se souviendra de la manière dont nous l’avons gagnée.',
  },
});
