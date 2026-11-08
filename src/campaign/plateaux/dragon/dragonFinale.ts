/**
 * Set 1.20.0, post-demo Lot 2 — DRAFT: Kaelen's judgement and the Dragon's epilogue (roadmap §3.3, Phase 3). Not canon
 * until the operator approves the plateau. Every deed Kaelen weighs is named in the words the consequence map expects.
 * Credibility before the chief (R3) uses its own thresholds, proposed for approval with the plateau: a company that
 * kept its honour through the Lion and the Bear arrives near 71, a company of force near 25.
 */
import type { PlateauFinaleDefinition } from '../../../game/plateauFinale';

export const DRAGON_FINALE: PlateauFinaleDefinition = Object.freeze<PlateauFinaleDefinition>({
  plateauId: 'dragon',
  judgementDialogueId: 'dragon_judgement',
  epilogueDialogueId: 'dragon_epilogue',
  judgementSceneArtId: 'lion_finale_judgement',
  epilogueSceneArtId: 'epilogue',
  chief: { speaker: 'Ancien Dragon Kaelen', actorId: 'kaelen', side: 'right' },
  sage: { speaker: 'Sage Séraphine', actorId: 'sage_seraphine', side: 'left' },
  steward: { speaker: 'Intendant Maelor', actorId: 'maelor', side: 'left' },
  guard: { speaker: 'Gardien du Dragon', actorId: 'dragon_guardian', side: 'right' },
  conductWeights: Object.freeze({
    dragonMandateHonour: 1, dragonWolfOfferRefused: 1, dragonVillageProtected: 1, dragonTrapsDisarmed: 1, dragonWolfHeard: 1,
    dragonCluesShared: 1, dragonCrystalRecovered: 2, dragonPilgrimsProtected: 1, dragonYoungDragonTended: 1, dragonShadowEvidence: 1,
    dragonMandatePrice: -1, dragonWolfPact: -2, dragonVillageExtorted: -2, dragonTrapsTurned: -1, dragonWolfTortured: -2,
    dragonCluesHidden: -1, dragonCrystalKept: -2, dragonWolfAlliance: -3, dragonPilgrimsSilenced: -2, dragonScalesTaken: -1,
    dragonShadowPurged: -1,
  }),
  deeds: Object.freeze([
    { flag: 'dragonCrystalRecovered', kind: 'merit', severity: 'decisive', phrase: 'vous avez rapporté le Cristal d’Écho aux Pics' },
    { flag: 'dragonMandateHonour', kind: 'merit', severity: 'important', phrase: 'vous avez répondu à mon appel sans rien exiger' },
    { flag: 'dragonWolfOfferRefused', kind: 'merit', severity: 'important', phrase: 'vous avez repoussé l’émissaire du Loup' },
    { flag: 'dragonVillageProtected', kind: 'merit', severity: 'important', phrase: 'vous avez protégé le hameau que le Loup terrorisait' },
    { flag: 'dragonTrapsDisarmed', kind: 'merit', severity: 'minor', phrase: 'vous avez désarmé les pièges tendus sur le sentier des pèlerins' },
    { flag: 'dragonWolfHeard', kind: 'merit', severity: 'important', phrase: 'vous avez écouté le guerrier du Loup au lieu de le briser' },
    { flag: 'dragonCluesShared', kind: 'merit', severity: 'important', phrase: 'vous m’avez rapporté les inscriptions du Cristal' },
    { flag: 'dragonYoungDragonTended', kind: 'merit', severity: 'important', phrase: 'vous avez soigné le jeune dragon blessé' },
    { flag: 'dragonCrystalKept', kind: 'breach', severity: 'decisive', phrase: 'vous avez gardé le Cristal d’Écho pour votre clan' },
    { flag: 'dragonWolfAlliance', kind: 'breach', severity: 'decisive', phrase: 'vous avez laissé le Cristal aux mains du Loup' },
    { flag: 'dragonWolfPact', kind: 'breach', severity: 'decisive', phrase: 'vous avez pactisé avec le Loup' },
    { flag: 'dragonVillageExtorted', kind: 'breach', severity: 'important', phrase: 'le hameau a payé deux fois, au Loup puis à vous' },
    { flag: 'dragonWolfTortured', kind: 'breach', severity: 'important', phrase: 'un guerrier du Loup a été brisé pour quelques mots' },
    { flag: 'dragonMandatePrice', kind: 'stain', severity: 'minor', phrase: 'le prix exigé pour votre aide' },
    { flag: 'dragonTrapsTurned', kind: 'stain', severity: 'minor', phrase: 'les pièges retournés au risque des pèlerins' },
    { flag: 'dragonCluesHidden', kind: 'stain', severity: 'minor', phrase: 'le secret du Cristal gardé pour vous' },
    { flag: 'dragonScalesTaken', kind: 'stain', severity: 'minor', phrase: 'les écailles prises au jeune dragon' },
    { flag: 'dragonShadowPurged', kind: 'stain', severity: 'minor', phrase: 'la souillure effacée avant qu’on puisse l’étudier' },
  ]),
  forceFacts: Object.freeze(['dragonCrystalKept', 'dragonWolfAlliance', 'dragonPilgrimsSilenced']),
  honourFact: 'dragonCrystalRecovered',
  outcome: {
    lines: Object.freeze([
      { flag: 'dragonCrystalRecovered', text: 'Le Cristal d’Écho chante de nouveau sur son autel, parce que vous avez rapporté le Cristal d’Écho aux Pics au lieu d’en chercher le prix.' },
      { flag: 'dragonCrystalKept', text: 'Vous avez repris le Cristal au Loup, c’est vrai. Puis vous avez gardé le Cristal d’Écho pour votre clan, comme si l’équilibre des Pics se vendait.' },
      { flag: 'dragonWolfAlliance', text: 'Vous deviez rapporter le Cristal, et vous avez laissé le Cristal aux mains du Loup. Les Pics tremblent déjà de votre marché.' },
    ]),
    noneText: 'Le Cristal d’Écho n’a été ni rapporté ni défendu. Je ne scellerai rien sur un vide.',
  },
  witnesses: {
    supportiveFlag: 'dragonPilgrimsProtected',
    silencedFlag: 'dragonPilgrimsSilenced',
    supportive: 'Les pèlerins sont venus d’eux-mêmes raconter ce qu’ils ont vu au repaire. Personne ne leur a dicté leurs mots, et c’est pour cela que je les écoute.',
    silenced: 'Des pèlerins se taisent derrière vos lames. Je connais ce silence, et je ne l’appellerai pas une absence de témoins.',
    none: 'Aucun pèlerin n’est venu parler pour vous. Il ne me reste que ce que les Pics ont retenu.',
  },
  evidence: {
    flag: 'dragonShadowEvidence',
    text: 'Voici l’éclat de la souillure que nous avons scellé près de l’autel. Le Cristal n’a pas seulement été volé, Ancien : une énergie sombre l’a touché.',
  },
  credibility: { credible: 60, high: 75 },
  opening: 'Vous revenez des cimes. Les Pics ont déjà parlé avant vous : leurs pèlerins, leurs bêtes, leur autel fendu. Je les ai écoutés. Je vous écouterai ensuite.',
  intent: 'Ce que les Pics ont vu ne changera plus. Dites-moi seulement ce que vous demandez au Dragon.',
  trialChoice: 'Demander l’épreuve du Dragon.',
  meritsLead: 'Il y a aussi ceci, Ancien, et les Pics en gardent la trace :',
  breachesLead: 'Et le Dragon n’oubliera pas ce qui pèse contre eux :',
  stainsLead: 'Mes comptes gardent aussi',
  flags: { trialRequested: 'dragonTrialRequested', honourSelected: 'dragonFinaleHonourSelected', trialSelected: 'dragonFinaleTrialSelected', seal: 'dragonSealAcknowledged' },
  combats: { honour: 'dragon_shadow_shaman', force: 'dragon_kaelen' },
  victoryFacts: Object.freeze({
    dragon_lair_assault: Object.freeze({ dragonWolfChiefDefeated: true }),
    dragon_lair_seizure: Object.freeze({ dragonWolfChiefDefeated: true }),
    dragon_shadow_shaman: Object.freeze({ dragonShadowShamanDefeated: true, dragonSealAcknowledged: true }),
    dragon_kaelen: Object.freeze({ dragonTrialWon: true, dragonSealAcknowledged: true }),
  }),
  reputation: { honourClaim: 1, voluntaryTrial: -1, rejectedClaim: 0 },
  epilogue: {
    honour: 'Le Sceau du Dragon est entre vos mains. Kaelen a scellé l’alliance du Dragon, et le Chaman des Ombres est tombé sur les cimes qu’il croyait siennes.',
    force: 'Le Sceau du Dragon est entre vos mains, mais vous avez pris le Sceau du Dragon par l’épreuve. Les gardiens de Kaelen vous ont laissé passer ; le Dragon n’oubliera pas ce Sceau arraché.',
    evidence: 'L’éclat de la souillure du Cristal voyage avec nous, scellé avec les autres. Chaque Sceau ajoute une pièce à un tableau que je n’aime pas regarder.',
    noEvidence: 'La souillure est restée là-haut, ou n’est plus. Ce que les Ombres voulaient du Cristal, nous ne le saurons que plus tard.',
    chronicle: 'Trois Sceaux. Le Tournoi des Grands n’est plus très loin, et chaque clan que nous avons croisé se souviendra de la manière dont nous avons avancé.',
  },
});
