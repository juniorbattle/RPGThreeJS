# Après-démo, Lot 2 — le Dragon (brouillon jouable)

| Champ | Valeur |
| --- | --- |
| TASK | POST-DEMO-LOT-2-DRAGON |
| DOMAIN | Campagne (plateau, passage de l’Ours au Dragon, relations), contenu brouillon, combat (familles et boss), présentation provisoire, outils de QA |
| BASELINE | `e7167f89` sur `post-demo` (Ours accepté, OD-2026-11-08-B ; jeu de contrats 1.20.0, baseline immuable `6c965169c2dc153cafd5a8609d914cf8de723ff3`) |
| BRANCH | `post-demo` |
| HEAD | voir le commit de clôture du lot (ce rapport et l’état) |
| STATUS | accepté : le Dragon est canon depuis [OD-2026-11-08-C](../autonomy/POST_DEMO_LOT_2_OPERATOR_DECISION_2026-11-08.md) ; il reste sur `post-demo` jusqu’à un ordre d’intégration |
| MERGED_IN | NONE |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Sur `post-demo` seulement. À la fin d’une chronique de l’Ours, « Continuer : Les Pics Célestes (brouillon) » ouvre le Dragon, qui se joue de bout en bout. Tout son contenu est marqué brouillon ; toutes ses images sont provisoires et marquées. L’Ours, accepté, ne change pas ; la démo sur `dev` non plus. |
| CANONICAL_DOCS_UPDATED | `docs/autonomy/AUTONOMOUS_WORK_STATE.md` et `.json` ; aucun document canonique de contenu : le Dragon reste un brouillon jusqu’à ton accord. |
| EVIDENCE | Suite vitest et `node:test`, types, build, validateur des contrats, porte du verrou documentaire, `narrative:validate` (Lion, Ours, Dragon), pilote de QA des deux voies, contrôle navigateur sur un serveur lancé par la session (section 7). Captures dans le dossier de travail de la session, non promues. |

Session cloud de l’après-démo, run `claude-postdemo-lot2-20261108T0600Z`. Elle suit [le brief](../autonomy/POST_DEMO_CLOUD_SESSION_BRIEF.md), [OD-2026-11-07-I](../autonomy/POST_DEMO_DIRECTION_OPERATOR_DECISION_2026-11-07.md), [OD-2026-11-08-A](../autonomy/POST_DEMO_LOT_0_OPERATOR_DECISION_2026-11-08.md) et [OD-2026-11-08-B](../autonomy/POST_DEMO_LOT_1_OPERATOR_DECISION_2026-11-08.md).

## Résumé

- **Le plateau est jouable**, en brouillon, à la taille de l’Ours : 21 lieux sur la route, 12 lieux facultatifs, 3 régions, 3 refuges, 3 bifurcations engagées, 6 défis, 2 gardiens en deux vagues, 9 combats de récit, 3 boss.
- **La narration d’abord.** La carte des conséquences a été écrite et poussée avant toute réplique. Elle compte 11 choix majeurs, chacun repris plus tard par une scène qui en nomme la cause.
- **Le fil des Ombres.** L’autel du Cristal porte la même souillure que l’éclat du filon sombre de l’Ours et que les preuves des Ombres du Lion ; le guerrier du Loup épargné annonce le Chaman ; Kaelen révèle que le Cristal a été altéré et que le Loup était sous l’influence d’un Chaman des Ombres.
- **Deux voies** (§3.3). Honneur : le Cristal rapporté, Kaelen scelle l’alliance et la compagnie traque le Chaman des Ombres. Force : le Cristal gardé ou laissé au Loup, ou l’épreuve demandée, et le Sceau se prend contre Kaelen et ses gardiens.
- **Les relations** suivent l’issue : honneur, Dragon allié et Loup ennemi ; force, Dragon et Loup ennemis. Un pacte avec le Loup qui lui laisse le Cristal garde le Loup allié.
- **Réputation mesurée** : +12 au mieux, +10 pour une conduite d’honneur constante, exactement le budget approuvé. Une conduite d’honneur atteint Renommé (81) à la fin du Dragon, comme prévu.
- **Vérifié** : pilote des deux voies depuis de vraies fins de l’Ours (cinq scénarios et une reprise), validateur complet des trois cartes, bornes, et contrôle navigateur sans défaut.

## 1. Ce qui est construit

| Région | Lieux de la route | Refuge |
| --- | --- | --- |
| I · Les contreforts | Pied des Pics Célestes, Audience de Kaelen, Patrouille du Loup, Émissaire du Loup, Hameau terrorisé, puis au choix Pièges du Loup ou Éclaireurs du Loup | Ermitage des contreforts |
| II · Les terrasses | Guerrier du Loup blessé, Créatures des crêtes, puis au choix Inscriptions du Cristal ou Wyrm corrompu, Repaire du Loup | Abri des pèlerins |
| III · Les cimes | Camp déserté du Loup, Pèlerins libérés, puis au choix Nid du jeune dragon ou Bêtes sous l’emprise des Ombres, Autel du Cristal | Veillée sur les Pics, puis Jugement de Kaelen |

- **Défis** : « Bêtes du ravin » (initiation, 3 héros au plus), « Wyrm corrompu » (aucun objet), « Bêtes sous l’emprise des Ombres » (8 tours au plus), et les deux gardiens (3 héros au plus).
- **Gardiens** : le Champion du Loup garde la cache du Loup sur les terrasses ; le Wyrm des cimes garde la réserve des cimes. Chacun se bat en deux vagues.
- **Familles** (§3.3) : pillards et chasseurs du Loup et leurs loups, créatures des montagnes (sangliers, rats, jeunes wyrms), créatures sous l’emprise des Ombres (wyrm corrompu, bête corrompue), gardiens du Dragon sur la voie de la force.
- **Boss** : le chef du Clan du Loup au repaire (deux variantes : reprendre le Cristal pour Kaelen, ou pour la compagnie) ; le Chaman des Ombres sur la voie de l’honneur ; l’Ancien Dragon Kaelen et ses gardiens sur la voie de la force. Aucune nouvelle compétence : chaque ennemi utilise des compétences qui ont déjà leur signature d’effets, et un test le vérifie.
- **Dialogues** : 24 scènes en brouillon, écrites depuis le §3.3 et les faits établis seulement. Aucun clan, lieu, personnage ou objet nouveau : le Cristal d’Écho, Kaelen, le Clan du Loup, le Chaman des Ombres et les Ombres Silencieuses viennent de la feuille de route ; le jeune dragon vient de la démo. Texte complet dans [la fiche de texte](post-demo-lot-2-dragon-text-sheet-2026-11-08.md).

## 2. La carte des conséquences

Fichier : [`src/campaign/consequences/dragon.consequences.json`](../../src/campaign/consequences/dragon.consequences.json). Statut : brouillon. Écrite et poussée avant toute réplique (commit `b155b566`).

| Choix majeur | Lieu | Options (fait, réputation) |
| --- | --- | --- |
| Mandat | Audience de Kaelen | rapporter le Cristal sans rien exiger (+1) ; exiger un prix (−1) |
| Émissaire du Loup | Émissaire du Loup | le repousser (0, mérite) ; pacte avec le Loup (−2) |
| Hameau terrorisé | Hameau terrorisé | le protéger (+1) ; faire payer la protection (−2) |
| Pièges du Loup | branche évènement, région I | les désarmer (+1) ; les retourner au risque des pèlerins (−1) |
| Guerrier du Loup blessé | Guerrier du Loup blessé | l’écouter puis le relâcher (+1) ; le briser (−2) |
| Inscriptions du Cristal | branche évènement, région II | les copier pour Kaelen (0, mérite) ; garder le secret (−1) |
| **Le repaire** | Repaire du Loup | rapporter le Cristal à Kaelen (+1) ; le garder pour le clan (−2, puis −1 au combat) ; le laisser au Loup, seulement après le pacte (−3, Loup allié) |
| Pèlerins libérés | Pèlerins libérés | les escorter (+1) ; les faire taire (−2) |
| Jeune dragon | branche évènement, région III | le soigner (0, mérite) ; prendre ses écailles (−1) |
| Autel du Cristal | Autel du Cristal | sceller un éclat de la souillure (0, mérite) ; l’effacer (−1) |
| Intention au jugement | Jugement de Kaelen | réclamer le Sceau ; demander l’épreuve |

**Mérites discrets.** Pour tenir le budget plus petit du Dragon (R2), quatre gestes honorables ne donnent pas de réputation et ne pèsent que dans le jugement de Kaelen : repousser l’émissaire, copier les inscriptions, soigner le jeune dragon, sceller la souillure. Aux bifurcations des régions II et III, le +1 vient des combats d’élite.

**Échos.** 29 échos en jeu dans le Dragon (jugement, repaire, camp du Chaman, autel, veillée, épilogue), 3 prévus pour l’acte final. **Échos des plateaux précédents** (5, en jeu) : à l’audience, l’issue de l’Ours (« Borin vous a confié le Sceau de l’Ours » ou « le Sceau de l’Ours arraché à Borin ») ; à l’autel, l’éclat du filon sombre de l’Ours et le sort des preuves des Ombres au Lion (confiées au Lion, ou gardées).

## 3. Réputation

| Mesure | Dragon | Budget approuvé |
| --- | --- | --- |
| Partie parfaite (route + gardiens) | +12 (route +10, gardiens +2) | 12 |
| Conduite d’honneur constante | +10 | 10 |
| Pire route | −17 | — |

Le pilote retrouve exactement +12 sur la partie parfaite. Projection : honneur constant 57 après le Lion, 71 après l’Ours, 81 après le Dragon (Renommé) ; partie parfaite 90 après le Dragon, 100 seulement à l’acte final.

## 4. Passage de l’Ours au Dragon

- À la fin de l’épilogue de l’Ours, `RunSystem` enregistre l’issue de l’Ours et ses relations approuvées, puis l’écran de fin propose « Continuer : Les Pics Célestes (brouillon) ».
- Le Dragon s’ouvre sur sa scène d’arrivée, puis sur sa carte ; le Dragon et le Loup sont rencontrés, neutres. Tous les faits du Lion et de l’Ours passent tels quels.
- À la fin du Dragon, le Scorpion n’étant pas construit, la chronique s’arrête avec un enregistrement complet.
- Les moteurs (plateau, jugement, pilote de QA, fiche de texte) sont maintenant communs à l’Ours et au Dragon ; le libellé « Demander l’épreuve » vient de chaque plateau (texte de l’Ours inchangé).

## 5. Ce qui reste à décider (fiche)

1. **Accepter le Dragon comme canon**, ou demander des retouches.
2. **Relations du Dragon** (proposées) : honneur, Dragon allié et Loup ennemi ; force, Dragon et Loup ennemis.
3. **Pacte avec le Loup** : laisser le Cristal au Loup après le pacte garde le Loup allié malgré l’issue de force, comme le Corbeau à l’Ours.
4. **Crédibilité devant Kaelen** (proposée) : crédible à 60, haute à 75 (une conduite d’honneur arrive vers 71, une conduite de force vers 25).
5. **Mérites discrets** : quatre gestes honorables sans réputation, qui ne pèsent que dans le jugement, pour tenir le budget de 12.

## 6. Images provisoires et images finales attendues

Toutes provisoires et marquées à l’écran ; aucune générée, aucune vidéo. Source : `src/campaign/plateaux/dragon/dragonPresentation.ts`, vérifiée par un test.

- **Atlas (3)** : les contreforts jusqu’à l’ermitage ; les terrasses, la paroi gravée et le repaire du Loup ; les cimes, l’autel du Cristal et la salle de Kaelen.
- **Tableaux de scène (24)** : l’arrivée au pied des Pics ; la salle de Kaelen ; l’émissaire sous un drapeau de trêve ; le hameau barricadé ; les collets sur le sentier des pèlerins ; la compagnie à l’ermitage ; le guerrier du Loup blessé ; la paroi gravée ; le repaire et le Cristal sur un autel étranger ; le chef du Loup devant le Cristal ; le Cristal repris ; le chef du Loup face à une compagnie avide ; le Cristal aux mains de la compagnie ; la tente du Chaman ; les pèlerins libérés ; le jeune dragon blessé ; l’autel fendu et sa souillure ; la veillée ; le jugement de Kaelen ; la traque du Chaman ; la chute du Chaman ; Kaelen et ses gardiens ; l’épreuve achevée ; le Sceau du Dragon.
- **Personnages (8, Character V2)** : l’Ancien Dragon Kaelen (master, portrait et sprite de boss) ; le gardien du Dragon ; le villageois des contreforts ; le pèlerin du Dragon ; l’émissaire du Loup ; le guerrier du Loup blessé ; le chef du Clan du Loup (master, sprite de boss) ; le Chaman des Ombres (master, sprite de boss).
- **Ennemis (8 sprites)** : pillard du Loup ; chasseur du Loup ; champion du Loup (élite) ; wyrm corrompu (élite) ; gardien du Dragon ; et les sprites de boss du chef du Loup, du Chaman et de Kaelen.
- **Refuges (3 fonds)** : l’ermitage accroché à la paroi ; l’abri des pèlerins ; la veillée sur les Pics.
- **Surface partagée (1)** : la fin de chronique du Dragon, aujourd’hui dans la salle du jugement du Lion.

## 7. Vérification

| Contrôle | Résultat |
| --- | --- |
| `npx tsc --noEmit` | vert |
| `npx vitest run` | 3 085 réussis, 23 ignorés, 10 échecs connus de la ligne de base (spritesheetPng 5, cin6ea3_pilot_e_regate 4, cin4_media 1), aucun nouveau |
| `node --test tools/qa/qa-job.test.mjs` | 26 sur 26 |
| `npm run build` | vert |
| `npm run contracts:validate` | vert |
| Porte du verrou documentaire | vide |
| `npm run narrative:validate` | Lion, Ours et Dragon valides, vérification complète, aucune erreur ni exception |
| `npm run cinematics:validate-narrative-staging` | vert |
| Test des bornes | Dragon +12 / +10, projet dans les cibles |

**Pilote de QA** (`src/qa/dragonPlateauDriver.test.ts`), depuis des fins de l’Ours jouées par le même pilote à partir des vraies sauvegardes du Lion :

- départ : l’Ours allié, le Dragon et le Loup neutres, l’audience nomme le Sceau confié par Borin ;
- honneur parfait, avec les gardiens : issue honneur, Dragon allié, Loup ennemi, +12 ; le jugement nomme chaque mérite tenu, les pèlerins et la preuve ; l’autel nomme l’éclat du filon sombre et les preuves des Ombres du Lion ; le camp du Chaman nomme le guerrier relâché ; la veillée nomme le hameau protégé ;
- avidité depuis un Ours avide : la réclamation est rejetée, épreuve contre Kaelen, Dragon et Loup ennemis, l’audience nomme le Sceau arraché à Borin ;
- pacte et Cristal laissé au Loup : issue force, Loup allié (cause `dragon.crystal`) ;
- honneur puis épreuve demandée : coût de réputation conforme ;
- sauvegarde et reprise d’un Dragon terminé.

**Contrôle navigateur** (serveur de développement lancé par la session, 1440×810), depuis une fin de l’Ours par l’honneur : « Continuer : Les Pics Célestes (brouillon) » ; l’arrivée avec le badge brouillon ; la carte des contreforts marquée « Brouillon · carte provisoire » ; l’audience de Kaelen (compagnie à gauche, Kaelen à droite, quatre acteurs au plus), le choix enregistré ; la veillée avec ses services ; le jugement avec « Demander l’épreuve du Dragon » ; le combat du Chaman qui démarre ; la fin de chronique sans suite. Les trois boss et les familles du Dragon apparaissent dans le moteur de combat avec les bonnes compétences. Aucune erreur.

Limites : comme pour l’Ours, le combat de campagne tourne trop lentement sur le WebGL logiciel du conteneur pour être piloté jusqu’au bout ; le pilote logique couvre l’issue des combats. L’équilibre tactique attend ton test sur PC.

## 8. Jouer le Dragon

- **Dans le jeu** : termine l’Ours sur `post-demo`, puis « Continuer : Les Pics Célestes (brouillon) ».
- **Sans rejouer le Lion ni l’Ours** (développement) : `/?qa=1`, « QA rencontres », puis « Dragon (brouillon) · depuis une fin de l’Ours par l’honneur » ou « … par la force ». Le jeu joue l’Ours par le pilote depuis une vraie fin du Lion, puis continue normalement.
- Le laboratoire liste aussi les combats du Dragon, marqués « brouillon ». Avec `/?qa=1&cin6a=golden`, les combats de la campagne affichent le bouton « Victoire ».

## 9. Fichiers principaux

- Plateau : `src/campaign/plateaux/dragon/` (topologie, combats, dialogues, jugement, présentation provisoire, liaison et tests).
- Registres communs : `src/campaign/plateaux/postDemoPresentation.ts`, `postDemoRefuges.ts`, `plateauAtlas.ts`, `src/game/postDemoContent.ts`, `src/game/challenges.ts`.
- Combat : `src/combat/legacyCombatRuntime.js`, `src/combat/vfx/DemoVfxActionScope.ts`, `src/campaign/plateaux/postDemoCombatRuntime.test.ts`.
- QA : `src/qa/plateauDriver.ts` (pilote commun), `src/qa/dragonPlateauDriver.test.ts`, `src/qa/postDemoQaSaves.ts`, `tools/narrative/plateau-text-sheet.ts`.
