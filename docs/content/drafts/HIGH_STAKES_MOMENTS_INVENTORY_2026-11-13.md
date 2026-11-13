# Moments à enjeu : inventaire (2026-11-13)

Statut : inventaire seul, en lecture seule. Aucune retouche n'est écrite ici ; chaque fiche donne une piste en une phrase.
Base lue : `b2830891` (`dev`). Depuis, N1, N2 et N3 sont dans le jeu (`dd991f09`) ; les retouches proposées sont dans `HIGH_STAKES_NARRATIVE_PASS_DRAFT_2026-11-13.md`.

Conventions :
- Chemins abrégés : `content.ts` = `src/game/content.ts`, `lionFinale.ts` = `src/game/lionFinale.ts`, `plateauFinale.ts` = `src/game/plateauFinale.ts`, `bear/…`, `dragon/…`, `scorpion/…`, `finale/…` = `src/campaign/plateaux/<dossier>/…`.
- Les répliques sont citées mot à mot, sous la forme « Locuteur : texte ». `${…}` marque une liste construite depuis l'état.
- Impact : **haut**, **moyen** ou **bas**. Il croise trois critères : le poids du moment, la part des joueurs qui le voient, la gravité du défaut.
- Règle de canon : aucune piste ne doit créer de clan, de lieu, de personnage, d'objet, de savoir ni d'issue. Les pistes qui frôlent le canon sont marquées « à arbitrer ».

Nombre de moments : **35**. Ordre chronologique du jeu.

---

## Prologue

### M01 — Ouverture
- **Chapitre** : prologue. **Ids** : séquence `OpeningSequence` (panneaux `prologue_fall`, `prologue_seals`, `prologue_lion`, `prologue_shadow`, `prologue_departure` ; texte dans `src/game/prologue.ts`), puis `acte_ouverture` (étapes 1 à 9, `content.ts:92-203`) et `camp_departure` (1, 1a, 1b, 2 à 5). Nœud `lion-camp`.
- **Enjeu** : il pose la dette du clan, la règle des Sceaux, le premier objectif et la voix de chaque compagnon, futur traître compris.
- **Répliques clés** :
  - Panneau `prologue_seals` : « Les Sceaux ne répondent ni aux titres ni au sang. Ils jugent les actes. » / « Pour entrer au Tournoi des Grands, il nous faut les quatre Sceaux des quatre seigneurs. »
  - Panneau `prologue_lion` : « Bois-Clair brûle sous les torches des Serpents. »
  - `acte_ouverture:2`, Intendant Maelor : « Pour entrer au Tournoi des Grands, il nous faut les quatre Sceaux des quatre seigneurs. Chacun devra reconnaître nos actes. C’est notre voie pour rendre une place au clan ; aucun d’eux n’a promis de nous rendre celle que nous avons perdue. »
  - `acte_ouverture:6`, Elara : « Je veillerai à ce que nous ne pouvons pas arrêter avec un bouclier. Depuis la chute, je sens parfois quelque chose répondre aux Sceaux. Je ne sais pas quoi, et nous ne les avons pas encore obtenus. Je préfère vous dire mon doute que vous vendre une certitude. »
  - `acte_ouverture:7`, Intendant Maelor : « Nous irons d’abord trouver Alaric, le Vieux Lion. Bois-Clair brûle sous les Serpents. Son Sceau est le premier que nous cherchons, mais secourir le village ne sera pas un achat : il jugera ce que nous aurons fait, et ce que nous aurons laissé faire. »
  - `acte_ouverture:8`, Sage Séraphine : « Un Sceau peut rouvrir une porte. Il ne rendra ni les morts ni la confiance perdue. Quand vous demanderez à quelqu’un de croire de nouveau en notre clan, laissez-lui aussi le droit de se souvenir. »
- **Faiblesses** :
  - Doublon mot à mot à quelques secondes d'écart : la seconde ligne du panneau `prologue_seals` (`prologue.ts:14`) revient telle quelle dans la bouche de Maelor (`acte_ouverture:2`).
  - « Bois-Clair brûle » revient trois fois en deux minutes : panneau `prologue_lion` (`prologue.ts:18`), `acte_ouverture:7`, puis `lion_briefing:1`, qui reprend le panneau mot à mot (`content.ts:305`).
  - Elara, étape 6 : la tournure « Je veillerai à ce que nous ne pouvons pas arrêter » est fautive. « Veiller à ce que » appelle le subjonctif et veut dire « faire en sorte que » ; le sens visé est « veiller sur ce que ».
  - Graine jamais récoltée : le doute d'Elara (« quelque chose répondre aux Sceaux ») ne reçoit aucun écho. Après le Lion, Elara ne parle plus des Sceaux (`dragon/dragonDialogues.ts:64, 154, 177, 280`), et elle est absente de l'acte final et des fins.
  - Maelor ne dit ici rien d'ambigu. Sa première graine nette arrive dans `ate_maelor_seal_analysis` (`content.ts:1148`).
- **Impact** : moyen. **Piste** : supprimer le doublon panneau/réplique, donner une autre formulation à l'une des mentions de Bois-Clair, corriger la tournure d'Elara, puis décider si son doute est récolté (à arbitrer : cela touche au savoir sur les Sceaux).

---

## Le Lion

### M02 — Audience d'Alaric
- **Ids** : `lion_briefing`, étapes 1, 1a, 1b, 2, 3 (choix), 4, 5 (`content.ts:296-385`). Nœud `lion-audience`. Le tableau vivant `alaric_audience_arrival` le précède.
- **Enjeu** : premier choix de conduite devant un chef, mandat sans condition ou avance. Le jugement le lit (`lionMandateHonour`, `lionMandateAdvance`, `alaricDoubt`).
- **Répliques clés** :
  - 1, Chef Alaric : « Votre clan réclame une place parmi les grands. Alors prouvez-le. Bois-Clair brûle sous les torches des Serpents. Sauvez ce qui peut encore l’être, et le Sceau du Lion entendra votre nom. »
  - 3, Intendant Maelor : « Un serment ne nourrit pas une compagnie. Si Alaric exige que nous sauvions son village, demander de quoi tenir la route n’est pas une offense : c’est dire honnêtement ce que notre clan peut encore payer. »
  - 4 (mandat accepté), Chef Alaric : « Alors marchez. Revenez avec Bois-Clair debout, et le Sceau du Lion entendra votre nom. »
  - 5 (avance), Chef Alaric : « Vous osez chiffrer le prix devant moi. Très bien : prenez l’avance. J’appellerai cela de la lucidité si elle vous mène jusqu’à Bois-Clair — une excuse, si elle vous détourne de lui. »
- **Faiblesses** :
  - « le Sceau du Lion entendra votre nom » sert deux fois dans la même scène (étapes 1 et 4, `content.ts:305` et `367`). La formule devient ensuite celle de chaque chef (`bear/bearDialogues.ts:184`, `dragon/dragonDialogues.ts:174`, `scorpion/scorpionDialogues.ts:185`).
  - Le bon choix reçoit une redite (4), le choix intéressé une réplique tranchante (5). La récompense de l'honneur sonne creux.
  - « Vous osez chiffrer » sert de modèle à Borin (« Vous chiffrez déjà… », `bear/bearDialogues.ts:193`) et à Kaelen (« Vous chiffrez l’équilibre… », `dragon/dragonDialogues.ts:183`).
  - Maelor (3) donne ici son premier conseil intéressé (`lionMandateAdvance`). La trahison ne le rappelle pas : il manque dans `followedAdvice` (`finale/finaleDialogues.ts:194-201`) comme dans le brouillon N2.
- **Impact** : moyen. **Piste** : donner à Alaric, en 4, une réplique propre qui prend acte du serment sans répéter 1, et retirer de 1 la citation du prologue.

### M03 — Bois-Clair : le choix
- **Ids** : `village_choice`, étapes 1, 1a, 2, 2a, 3, 4, 4a, 5 (choix), 6, 6a, 6b, 7, 7a, 7b (`content.ts:620-650`). La variante `r5-cedric-at-bois-clair` remplace 2a (`recruitedCedric`, `contextualDialogueContent.ts:89`). Nœud `lion-village-choice` ; le tableau vivant `bois_clair_arrival` le précède.
- **Enjeu** : le choix central de la démo, les captifs (`missionSuccess`) ou les coffres (`missionGreed`). Alaric, Borin et Maelor le relisent, puis la trahison (N2).
- **Répliques clés** :
  - 1, Villageoise de Bois-Clair : « Ils emmènent les enfants vers le nord. Les coffres du village brûlent déjà. Aidez-nous — ils reviendront avant la nuit. »
  - 4, Intendant Maelor : « Je ne vais pas l’habiller autrement : la porte basse, c’est notre bourse. Les coffres du village partent par là. Si nous les reprenons aux Serpents, ils serviront au clan : avec cet or, nous tenons jusqu’au Sceau. Sans lui, nous arriverons devant Alaric en mendiants. »
  - 4a, Alistair : « Voilà le piège des Serpents : des vies d’un côté, de l’or de l’autre, et pas assez de lames pour les deux. Donnez l’ordre. Nous ne l’habillerons pas ensuite d’une vertu qu’il n’avait pas ; nous porterons son prix ensemble. »
  - 5, Villageoise : « Qu’allez-vous sauver ? »
  - 6 (vieux pont), Villageoise : « Merci. Le vieux pont mène directement à leurs positions. »
  - 7 (porte basse), Villageoise : « Prenez l’or si vous le voulez… mais ne prétendez plus être nos protecteurs. »
- **Faiblesses** :
  - Contradiction interne : en 1, « Les coffres du village brûlent déjà » ; en 4, « Les coffres du village partent par là » (la porte basse).
  - Exposition en double : Kestrel en 2a (« Ils attendent que nous nous divisions… ») et Alistair en 4a (« Voilà le piège des Serpents… ») expliquent le même piège.
  - « habiller » revient deux répliques de suite (Maelor 4, Alistair 4a). L'écho est peut-être voulu, mais il affaiblit la réplique d'Alistair.
  - Juste après le choix le plus lourd de la démo, la réplique 6 n'est que logistique, alors que la 7 frappe fort.
- **Impact** : haut. **Piste** : lever la contradiction des coffres (un mot suffit), retirer une des deux explications du piège, et donner à 6 une réplique de la villageoise de la force de 7.

### M04 — Bois-Clair : combats et suites
- **Ids** : `pre_village_defense` (1, 2), `pre_village_raid` (1, 2), combats `village_defense` / `village_raid`, `village_defense_aftermath` (1 avec choix, 2, 3), `village_raid_aftermath` (1 avec choix, 2, 3) (`content.ts:1023-1068`, `1187-1202`). Suivent `ate_bois_clair_night_watch` (variantes selon le verdict) et les tableaux `bois_clair_saved` / `bois_clair_sacrificed`.
- **Enjeu** : le prix du choix devient visible ; combat d'élite ; premier geste après la victoire.
- **Répliques clés** :
  - `pre_village_defense:2`, Pillard Serpent : « Vous voulez défendre ces paysans ? Montrez-moi ce que vaut le sang du Lion. »
  - `pre_village_raid`, Brute Serpent : « Regardez-les. Ils croient que leurs murs les protègent. » / « Ces coffres sont à nous. Vous voulez votre part ? Venez la prendre. »
  - `village_defense_aftermath:1`, Villageoise : « Les Serpents fuient. Les enfants sont sains et saufs. Vous avez fait ce que le Lion n’a pas eu le courage de faire. »
  - `village_defense_aftermath:2` (récompense refusée), Villageoise : « Alors nous parlerons de vous à tous ceux qui passeront. Le nom de votre clan sera béni sur cette route. »
  - `village_raid_aftermath:1`, Intendant Maelor : « Les coffres sont à nous. Les Serpents sont dispersés. Mais les villageois… ils ne nous maudiront pas à voix haute. Ils n’osent plus. »
  - `village_raid_aftermath:3` (« Partir avec tout »), Intendant Maelor : « Ils survivront. Ils ont survécu à pire. Et nous avons ce qu’il nous faut pour le Sceau. »
- **Faiblesses** :
  - Incohérence : « le sang du Lion ». La compagnie est un clan sans terre venu chercher le Sceau du Lion ; elle n'est pas du sang du Lion.
  - `pre_village_raid:1` vise les villageois, pas une compagnie qui vient prendre les coffres : l'enjeu du pillage choisi n'est pas dit.
  - Le choix « Partir avec tout. Ils ne sont pas notre problème. », dont l'indice dit « Maelor approuve ce calcul », ne pose aucun drapeau. « Refuser toute récompense » non plus. Ni le jugement ni la trahison ne peuvent donc les rappeler.
  - « Vous avez fait ce que le Lion n’a pas eu le courage de faire. » arrive juste avant le retour devant Alaric, qui a envoyé la compagnie. C'est peut-être la colère voulue de la villageoise ; à vérifier.
  - « Le nom de votre clan sera béni sur cette route » reste générique.
- **Impact** : moyen (haut pour « le sang du Lion », qui se corrige d'un mot). **Piste** : corriger « le sang du Lion » et donner à la brute une réplique qui nomme le pillage. Poser un fait pour « Partir avec tout » change les drapeaux : décision de l'opérateur.

### M05 — Témoins de Bois-Clair
- **Ids** : `witnesses_on_road`, étapes 0a, 0b, 1 (choix, épreuve de persuasion), 2, 2a, 2b / 3, 3a, 3b / 4, 4a, 4b (`content.ts:864-916`). L'étape 1 a trois variantes : `r5-witnesses-after-rescue`, `-after-sacrifice`, `-contradictory-legacy`. Suivent `pre_witness_road_clash` et `post_witness_road_clash`. Nœud `lion-witnesses`.
- **Enjeu** : protéger les témoins (`protectedWitnesses`) ou les faire taire (`silencedWitnesses`, qui mène à l'épreuve de force).
- **Répliques clés** :
  - 1 (base), Survivant de Bois-Clair : « Nous avons vu ce que vous avez choisi au village. Nos mots vous précéderont devant Alaric. »
  - 1 (variante si `saved_bois_clair`) : « Nous avons vu votre compagnie ouvrir le pont et ramener nos familles. Nos mots vous précéderont devant Alaric, mais ils resteront les nôtres : un acte juste ne nous oblige pas à devenir vos partisans. »
  - Choix : « Protéger les témoins jusqu’au camp. » (réputation 45 ou plus, sinon « Ils refusent votre escorte. ») / « Faire taire les témoins, quel qu’en soit le prix. »
  - 2, Survivant : « Alors nous parlerons. Pas pour vous flatter, mais parce que la vérité doit survivre. »
  - 3b, Intendant Maelor : « Les veilleurs de Bois-Clair ferment la route et les miliciens prennent position. Il n’y a plus de silence à acheter. Il faudra désormais l’imposer. »
  - 4 (persuasion ratée), Survivant : « Vos actes parlent plus fort que vos promesses. Nous trouverons notre propre chemin jusqu’au camp. »
- **Faiblesses** :
  - La réplique 4 ressemble à celle de Garen, rencontré une scène plus tôt (`mystery_lancer_recruit:4`, `content.ts:1088`) : « Les actes pèsent plus lourd que les promesses. »
  - Le choix « …, quel qu’en soit le prix » devient la formule des trois plateaux (`bear/bearDialogues.ts:254`, `dragon/dragonDialogues.ts:239`, `scorpion/scorpionDialogues.ts:254`).
  - La réplique 2 (« parce que la vérité doit survivre ») est abstraite ; 2a et 2b sont justes.
- **Impact** : moyen. **Piste** : changer la réplique 4 ou celle de Garen ; garder la formule du choix au Lion et en changer une dans chaque plateau.

### M06 — L'informateur traqué
- **Ids** : `serpent_informant`, étapes 1 (choix), 2, 3 (`content.ts:842-862`) ; `pre_serpent_hunters` (1 à 3) ; `post_serpent_hunters` (`r5NarrativeContent.ts`). Nœud `lion-final-trial-event`, événement adaptatif que tire une conduite « infamy » (`runSystem.ts:430-432`).
- **Enjeu** : protéger un déserteur ennemi au prix d'un combat, ou le vendre. La vente (`betrayedInformant`) est une rupture décisive qui impose l'épreuve (`lionVerdict.ts:144`).
- **Répliques clés** :
  - 1, Oracle déserteur : « J’ai vu qui commande réellement les raids. Mes frères me traquent déjà. Protégez-moi jusqu’au camp, ou vendez-leur ma route et prenez leur or. »
  - 3 (vente), Intendant Maelor : « Cent vingt pièces pour un nom et un chemin. Bon prix, si l’on oublie que le prochain informateur saura désormais ce que vaut notre protection. Ce marché nous enrichit une fois et peut nous coûter toutes les suivantes. »
  - `pre_serpent_hunters:1`, Chasseur Serpent : « L’Oracle a parlé. Un traître parmi nous a vendu notre route à des étrangers. Nous avons suivi ses pas jusqu’ici — et les vôtres avec. »
- **Faiblesses** :
  - Le fugitif propose lui-même sa propre vente (« ou vendez-leur ma route et prenez leur or ») : la voix sonne faux.
  - Promesse non tenue : « J’ai vu qui commande réellement les raids » n'est jamais payé. Aucune scène ne dit ce qu'il a vu ; le jugement ne retient que « vous avez protégé l’informateur Serpent ».
  - La scène n'apparaît qu'en conduite « infamy » : peu de joueurs la voient.
- **Impact** : moyen. **Piste** : retirer l'option de sa bouche et la laisser à Maelor ; lui faire dire ce qu'il a vu en ne citant qu'un fait établi, comme l'artefact du général (à arbitrer).

### M07 — Autel des Ombres (la révélation)
- **Ids** : `shadow_signs`, étapes 1 (choix), 2, 2a, 2b / 3, 3a, 3b (`content.ts:917-941`), avec les variantes de Cedric et de Garen (`contextualDialogueContent.ts`). Nœud `lion-shadow-signs`. Suivent les ATE `ate_ruins_awaken` et `ate_serpent_retreat_order`.
- **Enjeu** : première preuve des Ombres (`shadowEvidence` ou `shadowFragments`). Elle conditionne le jugement et les échos des plateaux.
- **Répliques clés** :
  - 1, Sage Séraphine : « Ces marques ne sont pas du Serpent. Le motif est encore entier : conservé ainsi, il pourrait servir de preuve devant Alaric — mais il rayonne comme une balise. Le démonter disperserait cette résonance au prix d’une vérité impossible à montrer entière. »
  - 2, Sage Séraphine : « Avec ceci, Alaric verra que son conflit dépasse les frontières du Lion. Ce que nous avons trouvé n’est pas une simple guerre de clan. »
  - 3, Intendant Maelor : « Si Elara a raison sur cette balise, briser l’autel n’est pas qu’un profit : c’est acheter de la sécurité en sacrifiant la meilleure preuve que nous ayons. Ne confondons pas prudence et victoire. »
  - 3a, Elara : « Ils arment, mais ils parlent aussi. Brisés, les motifs ne forment plus un dossier définitif ; ils conservent assez de résonance pour confirmer que quelque chose d’ancien travaillait ici. »
- **Faiblesses** :
  - La révélation (« Ces marques ne sont pas du Serpent ») se perd dans une réplique d'arbitrage technique. Aucun compagnon ne réagit avant le choix.
  - En 3, Maelor dit « Si Elara a raison sur cette balise » alors qu'Elara ne parle que dans l'autre branche (2a) : la référence n'a pas d'antécédent.
  - En 3a, le sujet de « Ils arment, mais ils parlent aussi » est flou.
  - « dépasse… guerre de clan(s) » revient trois fois au Lion : ici en 2, dans le jugement (« des preuves qui dépassent cette guerre de clans », `lionFinale.ts:290`) et dans l'aftermath (« cette menace dépasse désormais notre guerre contre les Serpents », `lionFinale.ts:524`).
  - Ironie inexploitée : dans cette branche, Maelor, agent des Ombres, défend la preuve. Rien ne s'en souvient à la trahison.
  - `shadowFragments` n'a aucun écho après le Lion (grep dans `src/campaign` : seuls `shadowEvidence`, `shadowRevealed` et `shadowConcealed` sont lus).
- **Impact** : moyen. **Piste** : détacher la révélation en une courte réplique avant l'arbitrage, corriger l'antécédent de Maelor et éclaircir 3a.

### M08 — Refuge et jugement d'Alaric
- **Ids** : `final_refuge`, étapes 1, 2, 4, 5, 6, avec les variantes de Cedric et de Garen (`content.ts:1320-1330`). `lion_finale_judgement` est construit par `buildLionFinaleJudgement` (`lionFinale.ts:326-463`) : open, record (choix : assumer / présenter les écarts / nier), bluff-accepted / lie-rebuked / brazen-lie-rebuked, outcome (avec l'écho `r5CarriedBoisClairNames`), merits, breaches, stains, witnesses, shadow (choix si la preuve n'est pas encore déclarée), intent (choix). Nœuds `lion-final-refuge` et `lion-final-judgement` ; tableau vivant `lion_judgement`.
- **Enjeu** : le verdict de la démo, avec deux choix (déposition, intention) et la révélation possible de la preuve.
- **Répliques clés** :
  - open, Chef Alaric : « Je vous ai vus partir avec un nom en ruine et une mission assez simple pour tenir en une phrase. Vous revenez avec des morts, des témoins, des dettes, des preuves et des gens qui ne racontent pas tous la même histoire. C’est cela que le Lion va juger. »
  - outcome (`missionSuccess`), Chef Alaric : « Bois-Clair tient encore parce que, lorsque le village s’est ouvert en deux, votre compagnie a choisi le vieux pont et ramené les captifs. Les rumeurs peuvent discuter votre nom ; elles ne peuvent pas rendre ces personnes à nouveau prisonnières. »
  - outcome (`missionGreed`), Chef Alaric : « À Bois-Clair, vous avez pris la porte basse et ses coffres pendant que les captifs partaient vers le nord. Votre bourse a survécu à cette décision. Ceux qui sont partis avec les Serpents aussi. »
  - witnesses (silence imposé), Chef Alaric : « Les survivants qui auraient dû parler arrivent derrière un silence imposé par vos lames. Ne me demandez pas de traiter cette absence comme si personne n’avait rien vu. »
  - brazen-lie-rebuked, Chef Alaric : « Assez. Vous ne discutez plus l’interprétation des faits : vous niez des rapports, des témoins et des traces que plusieurs voix indépendantes ont déjà confirmés. Vous me demandez de choisir votre version contre tout ce qui se tient devant moi. À cet instant, ce n’est plus seulement votre route que je mets en doute — c’est votre parole. Le Lion ne vous reconnaîtra pas sur cette base. »
  - intent, Chef Alaric : « Vous ne pouvez plus modifier la route qui mène jusqu’ici. Vous pouvez seulement choisir ce que vous demandez au Lion en la regardant telle qu’elle est. Parlez. » Choix : « Assumer nos actes et réclamer le Sceau. » / « Demander l’épreuve du Lion. »
- **Faiblesses** :
  - Rythme : entre `record` et `intent`, jusqu'à six répliques s'enchaînent sans geste du joueur (outcome, merits, breaches, stains, witnesses, shadow). Les listes de `listFrench` peuvent aligner jusqu'à neuf mérites (`lionFinale.ts:163-171`).
  - `brazen-lie-rebuked` compte 384 signes, la plus longue réplique repérée dans le corpus. Sa chute est forte mais tardive.
  - Les trois chefs reprennent ce gabarit (`plateauFinale.ts:174-199`) : ouverture « Vous revenez… », intention « Vous ne pouvez plus… Dites-moi seulement ce que vous demandez à… », choix « Assumer nos actes et réclamer le Sceau. » mot pour mot. Après coup, le jugement du Lion perd sa singularité.
  - `final_refuge:2`, Séraphine : « Les ruines chantent encore. Les Ombres se réveillent. » Générique, et l'autel l'a déjà montré.
  - `stains`, Maelor : l'amorce « Mes comptes gardent aussi… » revient dans les trois plateaux (`stainsLead` des `*Finale.ts`).
- **Impact** : haut. **Piste** : resserrer la réplique de rupture, fondre `stains` dans `breaches` quand les deux existent, garder l'intention du Lion intacte et changer celle des plateaux (voir M14).

### M09 — Les deux issues du Lion (poursuite du général / épreuve du champion)
- **Ids** :
  - Honneur : `serpent_pursuit_pre_combat` (`buildSerpentPursuitPreCombat`, `lionFinale.ts:468-481`). L'étape 1 a trois variantes selon `verdict.stance` ; l'étape 3 a les variantes `shadow-revealed` / `shadow-concealed`. Combat `serpent_captain`, puis `serpent_general_aftermath` (1, choix si la preuve n'est pas déclarée, 2 Alaric, 3 Maelor ; `lionFinale.ts:498-527`).
  - Force : `pre_lion_chief` (`buildLionTrialPreCombat`, 1 à 3 selon `lionTrialRequested`), combat `lion_chief`, `lion_trial_aftermath` (1, 2).
  - Tableaux vivants `serpent_route_ending` et `lion_trial_route_ending`.
- **Enjeu** : deux combats de boss et la décision de révéler l'artefact.
- **Répliques clés** :
  - Poursuite 1 (respect), Chef Alaric : « Vous avez accompli le mandat sans demander au Lion d’oublier ce qu’il a vu. Je reconnais votre clan sans réserve. Le Sceau sera vôtre si vous terminez maintenant ce que les Serpents ont commencé. »
  - Poursuite 2, Général Serpent : « Alors le Lion vous envoie finir sa guerre. Venez donc reprendre l’artefact — et découvrez ce qui vous observe derrière nos bannières. »
  - Aftermath 3 (artefact gardé), Intendant Maelor : « Le Lion nous a reconnus, mais l’artefact et son secret resteront avec nous. La cour ne peut condamner une vérité qu’elle ne connaît pas. »
  - Épreuve 1 (reconnaissance refusée), Chef Alaric : « Votre demande de reconnaissance ne peut être accordée au vu du dossier complet. Pourtant, la loi du Lion offre encore une voie : vaincre son champion. »
  - Épreuve 3, Champion du Lion : « Si vous tombez, le Sceau reste ici. Si vous tenez, il sera vôtre et Alaric acceptera le jugement. En garde. »
  - Après l'épreuve 1 (volontaire), Chef Alaric : « Vous avez demandé la loi du Lion et vous l’avez accomplie. Mon champion est vaincu ; le Sceau est à vous, sans autre dette de sang. »
- **Faiblesses** :
  - Le général Serpent n'a pas de dernière parole (Séraphine ouvre l'aftermath), alors que les trois agents des Ombres des plateaux en ont une.
  - La réplique de Maelor sur l'artefact gardé est la plus « Ombres » de la démo. Ni `followedAdvice` ni le brouillon N2 ne la rappellent.
  - Route de force : « le général Serpent demeure en fuite » (aftermath, épilogue) n'est jamais repris, même à la finale contre le Serpent (M28).
  - « le Sceau est à vous » devient la première phrase des trois chefs vaincus à l'épreuve (`bear/bearDialogues.ts:161`, `dragon/dragonDialogues.ts:157`, `scorpion/scorpionDialogues.ts:168`).
  - Point fort à préserver : le Lion distingue l'épreuve demandée et la reconnaissance refusée. Les plateaux ne le font pas (M15, M20, M25).
- **Impact** : moyen. **Piste** : donner au général une dernière réplique tirée des faits établis (l'artefact, « ce qui vous observe ») et garder la réplique de Maelor comme matière de la trahison (M29).

### M10 — Épilogue du Lion
- **Ids** : `epilogue` (`buildLionEpilogue`, `lionFinale.ts:548-591`) : 1 route (deux variantes), 2 Maelor (huit variantes selon la divulgation et la route), 3 Séraphine (`finishChapter`). Suit le panneau « La route continue » (`chronicleEndWords.ts`).
- **Enjeu** : clôture de la démo et passage aux plateaux.
- **Répliques clés** :
  - 1 (honneur), Sage Séraphine : « Le Sceau du Lion repose entre vos mains. Alaric a reconnu votre clan, le général Serpent est tombé, et l’artefact des Ombres a été arraché à sa fuite. »
  - 1 (force), Sage Séraphine : « Le Sceau du Lion repose entre vos mains. Vous l’avez gagné selon la loi martiale du clan ; Alaric accepte le résultat, tandis que le général Serpent demeure libre. »
  - 2 (exemple, artefact caché, honneur), Intendant Maelor : « L’artefact récupéré reste le secret de votre compagnie. Le Lion célèbre la victoire sans savoir quelle menace ancienne se cachait derrière elle. »
  - 3, Sage Séraphine : « Le premier Sceau est acquis. Ce n’est pas la fin de cette route : c’est la première preuve de ce que notre clan choisit de devenir quand personne ne peut choisir à sa place. »
- **Faiblesses** :
  - Bois-Clair, le choix central du chapitre, manque à l'épilogue : seuls la route et les Ombres sont dits.
  - « Le Sceau du Lion repose entre vos mains » ouvre le gabarit des épilogues de plateau (« Le Sceau de l’Ours est entre vos mains… », `bear/bearFinale.ts:89-90`, `dragon/dragonFinale.ts:90-91`, `scorpion/scorpionFinale.ts:92-93`).
  - Maelor dit « votre compagnie » quand Séraphine dit « notre clan ». La distance est peut-être une graine voulue ; à confirmer avant toute retouche.
- **Impact** : moyen. **Piste** : en 1 ou en 3, une demi-phrase qui nomme Bois-Clair selon `missionSuccess` ou `missionGreed`.

---

## L'Ours

### M11 — Audience de Borin
- **Ids** : `bear_audience` (`bearAudience`, `bear/bearDialogues.ts:168-195`) : open ; lion (trois variantes : `serpentGeneralDefeated`, `lionTrialWon`, défaut) ; reputation (trois variantes : `missionSuccess`, `missionGreed`, défaut) ; request, seraphine, maelor ; « alistair » (dit par Marian) ; mandate (choix) ; accepted / share. Nœud `bear-audience`.
- **Enjeu** : un nouveau chef juge le Lion et Bois-Clair ; mandat sans condition ou part de minerai.
- **Répliques clés** :
  - reputation (`missionGreed`), Ancien Ours Borin : « Les marchands des plaines racontent aussi qu’à Bois-Clair, vous avez emporté les coffres pendant que les captifs partaient. Je vous reçois parce que le Lion vous a donné son Sceau, pas parce que je vous crois. »
  - request, Borin : « Repoussez le Corbeau hors des galeries, et le Sceau de l’Ours entendra votre nom. Échouez, ou servez-vous en chemin, et la montagne s’en souviendra. »
  - maelor : « Ou laissons l’Ours et le Corbeau s’user l’un contre l’autre. Deux clans affaiblis devant des mines ouvertes… Je dis seulement ce que tout le monde pensera en voyant ces galeries. »
  - Marian : « Nous ne sommes pas venus vider la montagne d’un autre clan. »
  - share, Borin : « Vous chiffrez déjà ce que vous n’avez pas repris. Voici une avance, puisque vous la voulez. La montagne a de la mémoire : elle se souviendra de ce que vous avez réclamé. »
- **Faiblesses** :
  - Formules du Lion recopiées : « … entendra votre nom » (M02), « Vous chiffrez » (M02), et l'indice « Borin observe votre conduite » (= « Alaric observe votre conduite », `content.ts:357`).
  - Les deux plateaux suivants reprennent le même gabarit d'audience : Séraphine (« sachons pourquoi… »), puis Maelor (« Ou laissons… s’user l’un contre l’autre… Je dis seulement ce que… »), puis un compagnon (« Nous ne sommes pas venus… »), puis le chef (« Alors, étrangers. … ? »).
  - La même scène dit « la montagne s’en souviendra » (request) puis « La montagne a de la mémoire : elle se souviendra » (share).
  - Seule la route du Lion est lue (`serpentGeneralDefeated` / `lionTrialWon`). L'avertissement des Ombres donné ou non à Alaric (`shadowRevealed`) est ignoré, alors qu'Alaric promettait ses éclaireurs.
  - Point fort : les échos de Bois-Clair sont justes.
- **Impact** : moyen. **Piste** : réserver « entendra votre nom » au Lion, donner à chaque chef sa tournure, et ne garder qu'un seul « s’en souviendra ».

### M12 — Les mines sacrées (décision-clé)
- **Ids** : `bear_sacred_mines` (`bear/bearDialogues.ts:213-234`) : open ; raven (`bearRavenPact`) ou chief ; seraphine, maelor ; choice (trois options, la troisième exige `bearRavenPact`) ; abandoned, abandoned2. Puis `bear_pre_mines_defense` et `bear_mines_defense_aftermath`, ou `bear_pre_mines_seizure` et `bear_mines_seizure_aftermath` (`117-130`). Nœud `bear-sacred-mines`.
- **Enjeu** : le fait d'honneur du plateau (`bearMinesRestored`) contre deux faits de force (`bearMinesSeized`, ou `bearMinesAbandoned` avec l'alliance du Corbeau).
- **Répliques clés** :
  - raven (pacte), Chef des mineurs du Corbeau : « Les étrangers du col. Vous aviez promis de regarder ailleurs. Alors regardez ailleurs, et laissez-nous finir. »
  - maelor : « Ou reprenons-les pour nous. Le Corbeau a déjà fait le travail ; il suffirait de changer de bannière à l’entrée. »
  - choice, Alistair : « Les galeries attendent notre réponse. »
  - abandoned / abandoned2 : Chef des mineurs du Corbeau, « Voilà des étrangers qui savent compter. Le Corbeau n’oublie pas ceux qui tiennent parole. » / Sage Séraphine, « Et l’Ours n’oubliera pas ceux qui l’ont trahi. »
  - `bear_mines_seizure_aftermath` : Intendant Maelor, « Le filon est à nous. Plantons notre bannière à l’entrée ; l’Ours devra traiter avec nous, maintenant. » / Marian, « Ou il viendra nous la reprendre. »
- **Faiblesses** :
  - Même squelette qu'au repaire du Loup (M17) et au temple du Phénix (M22) :
    - ouverture de Kestrel, puis l'ennemi ;
    - Séraphine : « Reprenons-les… » ;
    - Maelor : « Ou reprenons-les pour nous » / « Ou reprenons-le pour nous » / « Ou gardons-le » ;
    - Alistair : « … attend(ent) notre réponse. » ;
    - alliance : « … qui tiennent parole », puis Séraphine : « Et X n’oubliera pas… » ;
    - après la prise : « … est à nous … devra traiter avec nous », puis Marian : « Ou il viendra… ».
  - Avant le combat, une seule réplique du chef ennemi ; après, deux répliques. C'est maigre pour la bascule du plateau.
- **Impact** : haut (avec M17 et M22). **Piste** : garder l'ossature commune, mais donner dans chaque plateau une réplique de bascule propre (Alistair, Séraphine ou Marian), et écrire autrement la suite de la prise.

### M13 — Témoins (mineurs) et preuve des Ombres (filon sombre)
- **Ids** : `bear_miners_testimony` (`bear/bearDialogues.ts:236-259`) : open (+ `bearMinersRescued`), request, seraphine (variantes `protectedWitnesses` / `silencedWitnesses` / défaut), maelor (deux variantes), choice, protected / silenced. Nœud `bear-miners-testimony`. `bear_dark_vein` (`261-274`) : open, seraphine (+ écho `shadowEvidence`), maelor, choice, sealed / shattered. Nœud `bear-dark-vein`.
- **Enjeu** : les témoins (les faire taire impose l'épreuve, `forceFacts`) et la preuve des Ombres (`bearDarkOreEvidence`).
- **Répliques clés** :
  - seraphine (`silencedWitnesses`) : « Les témoins de Bois-Clair se sont tus sous nos lames. Je ne veux pas que la montagne en compte d’autres. »
  - Choix : « Escorter les mineurs jusqu’à Borin. » / « Les faire taire, quel qu’en soit le prix. »
  - protected, Mineur de l’Ours : « Merci. Nous marcherons avec vous, mais nous parlerons pour nous. »
  - silenced, Marian : « Ils se taisent, maintenant. Nous aussi, nous devrons vivre avec ce silence. »
  - Filon, Séraphine : « Voilà ce que le Corbeau creusait. Ce minerai n’appartient pas à la montagne. » Si `shadowEvidence` : « Il porte la même résonance que l’autel des Ombres, dans la plaine du Lion. »
  - sealed, Séraphine : « Je le scelle dans un coffre doublé de plomb. Borin devra le voir, et d’autres après lui. »
- **Faiblesses** :
  - « Nous marcherons avec vous, mais nous parlerons pour nous. » revient mot à mot dans les trois plateaux (`bear:256`, `dragon:241`, `scorpion:256`).
  - Le choix « Les faire taire, quel qu’en soit le prix. » sert au Lion, à l'Ours et au Dragon. La réplique par défaut de Séraphine, « Des témoins libres pèsent plus lourd qu’un récit que nous ferions nous-mêmes. », revient trois fois.
  - Le rappel de l'autel ne lit que `shadowEvidence`. Le joueur qui a brisé l'autel (`shadowFragments`) n'a aucun rappel.
  - « coffre doublé de plomb » revient trois fois. « Ce qu’elle était, nous ne le saurons plus » revient sous d'autres formes au Dragon (`271`) et au Scorpion (« Nous ne saurons jamais… »).
- **Impact** : moyen. **Piste** : un remerciement propre à chaque peuple de témoins (mineurs, pèlerins, fidèles), et une branche `shadowFragments` au rappel de l'autel (fait établi, sans canon nouveau).

### M14 — Jugement de Borin (moteur commun des trois plateaux)
- **Ids** : `bear_judgement`, construit par `buildPlateauJudgement` (`plateauFinale.ts:174-199`) avec `BEAR_FINALE` (`bear/bearFinale.ts`) : open, outcome (trois lignes et `noneText`), merits, breaches, stains, witnesses, credibility, shadow, intent (choix). Nœud `bear-judgement`.
- **Enjeu** : le verdict du plateau. La voie d'honneur mène au Maître Espion, la voie de force à Borin.
- **Répliques clés** :
  - open, Ancien Ours Borin : « Vous revenez des galeries. La montagne a déjà parlé avant vous : ses éboulis, ses mineurs, ses feux éteints. Je l’écouterai encore une fois, puis je vous écouterai. »
  - outcome (`bearMinesRestored`) : « Les galeries respirent de nouveau parce que vous avez rendu les galeries sacrées à l’Ours au lieu d’y planter votre propre bannière. Mes mineurs y redescendront demain. »
  - outcome (`bearMinesAbandoned`) : « Pendant que mes mineurs attendaient, vous avez laissé le Corbeau vider nos galeries. Vous aviez donné votre parole à des voleurs, et vous l’avez mieux tenue que la mienne. »
  - witnesses (silence imposé) : « Je sais pourquoi des mineurs se taisent derrière vos lames. Ne me demandez pas d’appeler ce silence une absence de témoins. »
  - credibility (élevée / faible) : « Votre nom est arrivé ici avant vous, et il pèse lourd. Quand vous parlez, la montagne ne se méfie pas. » / « Votre nom est arrivé avant vous, et il ne plaide pas pour vous. Vos paroles ne pèseront que ce que pèsent vos actes. »
  - intent : « Vous ne pouvez plus changer ce que la montagne a vu. Dites-moi seulement ce que vous demandez à l’Ours. »
- **Faiblesses** :
  - La phrase de l'acte jugé est collée telle quelle dans la ligne d'issue : « Les galeries… parce que vous avez rendu les galeries sacrées » (« galeries » deux fois).
  - « mieux tenue que la mienne » est ambigu : la parole de Borin, ou celle donnée à Borin ?
  - « avant vous » revient trois fois dans un même jugement (open, et les deux répliques de crédibilité).
  - Gabarit commun aux trois chefs, même ordre et mêmes amorces :
    - « Vous revenez des/du … ont déjà parlé avant vous … Je vous écouterai ensuite » ;
    - « Ne me demandez pas d’appeler ce silence une absence de témoins » / « je ne l’appellerai pas une absence de témoins » / « celui-ci n’est pas une absence de témoins » ;
    - « Mes comptes gardent aussi » (quatre fois, Lion compris) ;
    - le choix « Assumer nos actes et réclamer le Sceau. », identique au Lion.
  - `breachesLead`, « ce qui pèse contre eux » : le gardien parle de la compagnie à la troisième personne, puis Borin lui dit « vous ».
- **Impact** : haut (vaut pour les trois jugements). **Piste** : réécrire les trois lignes d'issue sans répéter la phrase de l'acte, donner à chaque chef une ouverture et une intention propres, lever l'ambiguïté de « la mienne ».

### M15 — Issues de l'Ours et épilogue
- **Ids** :
  - Honneur : `bear_master_spy_pre_combat` (1, 2, 3 avec la variante `bearSpyOrdersFound`, 4), combat `bear_master_spy`, `bear_master_spy_aftermath`.
  - Force : `bear_borin_pre_combat` (1, 2), combat `bear_borin`, `bear_trial_aftermath`.
  - Épilogue : `bear_epilogue` (`buildPlateauEpilogue` : route, ore, chronicle).
- **Enjeu** : boss des Ombres ou épreuve du chef ; deuxième Sceau.
- **Répliques clés** :
  - Espion 2, Ancien Ours Borin : « Celui qui commandait le Corbeau fuit vers les hauteurs : son Maître Espion. Ramenez-le, ou empêchez-le de revenir, et le Sceau de l’Ours scellera notre alliance. »
  - Espion 4, Maître Espion du Corbeau : « Vous avez bien travaillé pour l’Ours. Dommage que vous ne sachiez pas pour qui vous travaillez vraiment. »
  - Épreuve, Borin : « Vous voulez mon Sceau par la force ? Alors gagnez-le selon la loi de la montagne : mes guerriers et moi, contre votre compagnie. » / Marian : « Nous l’assumerons. »
  - Après l'épreuve, Borin : « Le Sceau est à vous. La montagne l’a vu, mes guerriers aussi. Ne revenez pas chercher autre chose ici. »
  - Épilogue, route de force, Séraphine : « Le Sceau de l’Ours est entre vos mains, mais vous avez pris le Sceau de l’Ours par l’épreuve. Les guerriers de Borin vous ont laissé passer ; l’Ours ne pardonnera pas ce Sceau arraché. »
  - Épilogue, preuve gardée, Intendant Maelor : « L’éclat du filon sombre voyage avec nous, scellé dans un coffre. Encore un poids que les Sceaux nous font porter. Je me demande parfois lequel de ces fardeaux nous mène vraiment quelque part. »
- **Faiblesses** :
  - Le verdict n'est jamais dit.
    - Voie d'honneur : Borin passe à la traque sans une phrase de reconnaissance.
    - Voie de force : `bear_borin_pre_combat` est statique et dit « Vous voulez mon Sceau par la force ? » même quand la compagnie a réclamé le Sceau et se l'est vu refuser (`trialCause: 'rejected_claim'`, `plateauFinale.ts:131-133`). Le Lion distingue les deux cas (`buildLionTrialPreCombat`).
  - « Nous l’assumerons. » est la seule réponse de la compagnie aux trois épreuves (`bear:158`, `dragon:154`, `scorpion:165`).
  - Incohérence légère : selon Borin, l'Espion « fuit vers les hauteurs » ; selon l'épilogue d'honneur, il « est tombé dans les galeries qu’il faisait vider ». Le combat `bear_master_spy` se joue bien dans les galeries (`GALLERIES`).
  - Épilogue de force : « le Sceau de l’Ours » deux fois dans la même phrase, et la même structure dans les trois plateaux.
  - Chronique : « chaque clan que nous croisons se souviendra de la manière dont nous les avons gagnés ». La formule revient trois fois, plus une au ralliement.
  - L'épilogue ne rappelle ni les mines ni les témoins.
  - La dernière parole de l'Espion (« Le minerai… n’en était qu’une part. Ceux que nous servons… ») et la réplique de Séraphine (« Le Corbeau n’était qu’une main de plus. ») forment un gabarit repris au Dragon et au Scorpion. En revanche, « ceux que je sers » prépare la trahison de Maelor (`finale/finaleDialogues.ts:222-225`) : à garder.
- **Impact** : haut. **Piste** : deux variantes de l'avant-combat de l'épreuve selon `bearTrialRequested`, comme au Lion, et une phrase de reconnaissance de Borin avant la traque ; ne dire « le Sceau de l’Ours » qu'une fois par phrase.

---

## Le Dragon

### M16 — Audience de Kaelen
- **Ids** : `dragon_audience` (`dragon/dragonDialogues.ts:164-185`) : open ; seals (variantes `bearMasterSpyDefeated` / `bearTrialWon` / défaut) ; request, seraphine, maelor ; « alistair » (dit par Elara) ; mandate (choix) ; accepted / price. Nœud `dragon-audience`.
- **Enjeu** : mandat sans condition ou prix exigé ; le chef lit le Sceau de l'Ours.
- **Répliques clés** :
  - open, Ancien Dragon Kaelen : « Le Clan du Loup a volé le Cristal d’Écho. Il tenait l’équilibre de ces pics depuis avant vos chroniques. Sans lui, la montagne se fend, la neige glisse, et les vallées tremblent. »
  - request : « Le Dragon ne demande pas d’aide ; il en accepte, quand elle est digne. Rapportez le Cristal, et le Sceau du Dragon entendra votre nom. »
  - maelor : « Ou laissons le Loup et le Dragon s’user l’un contre l’autre. Le Cristal ira à qui le tiendra à la fin… Je dis seulement ce que chacun pense en regardant ces pics. »
  - Elara : « Nous ne sommes pas venus vendre l’équilibre d’un autre clan. »
  - price, Kaelen : « Vous chiffrez l’équilibre des Pics comme une marchandise. Prenez votre or. Le Dragon se souviendra de ce qu’il vous a coûté. »
- **Faiblesses** :
  - La réplique de Maelor est presque mot pour mot celle de l'Ours (`bear:186` / `dragon:176`).
  - Gabarit d'audience (M11) : « Alors, étrangers. » revient (`bear:188`, `dragon:178`), tout comme la réplique « Nous ne sommes pas venus… ».
  - « Je dis seulement… » : quatrième occurrence en comptant le messager du Corbeau (`bear:68`).
  - Bon point : « Le Dragon ne demande pas d’aide ; il en accepte, quand elle est digne. » a une vraie voix.
- **Impact** : moyen. **Piste** : un autre angle pour Maelor ici (le Cristal comme levier, déjà dit au repaire) et retirer « Je dis seulement ».

### M17 — Le repaire du Loup (décision-clé)
- **Ids** : `dragon_wolf_lair` (`dragon/dragonDialogues.ts:187-208`) ; `dragon_pre_lair_assault` et `dragon_lair_assault_aftermath`, ou `dragon_pre_lair_seizure` et `dragon_lair_seizure_aftermath` (`134-147`). Nœud `dragon-wolf-lair`.
- **Enjeu** : `dragonCrystalRecovered` (honneur) contre `dragonCrystalKept` ou `dragonWolfAlliance` (force).
- **Répliques clés** :
  - pact, Chef du Clan du Loup : « Les étrangers de la trêve. Le pacte scellé avec notre émissaire tient toujours ? Alors laissez le Cristal où il est, et partagez les vallées avec nous. »
  - maelor : « Ou reprenons-le pour nous. Celui qui tient le Cristal tient le Dragon. »
  - choice, Alistair : « Le repaire attend notre réponse. »
  - alliance / alliance2 : Chef du Loup, « Des étrangers qui tiennent parole. Le Loup n’oubliera pas que vous avez choisi le bon côté. » / Séraphine, « Et les Pics n’oublieront pas ce que nous avons laissé entre ses mains. »
  - Après l'assaut, Kestrel : « Le chef est tombé, mais quelqu’un s’est enfui par le fond du repaire. Pas un guerrier du Loup. »
  - Après la prise, Marian : « Ou il viendra le reprendre, et nous n’aurons pas le droit de nous en plaindre. »
- **Faiblesses** : même squelette que M12 et M22, avec les mêmes formules (« … attend notre réponse », « qui tiennent parole », « n’oubliera pas », « nous n’aurons pas le droit de nous en plaindre », `dragon:146` = `scorpion:146`). L'avant-combat tient en une réplique.
- **Impact** : haut (avec M12 et M22). **Piste** : voir M12.

### M18 — Témoins (pèlerins) et preuve des Ombres (autel du Cristal)
- **Ids** : `dragon_freed_pilgrims` (`dragon/dragonDialogues.ts:221-244`) ; `dragon_crystal_altar` (`246-273`). Nœuds `dragon-freed-pilgrims` et `dragon-crystal-altar`.
- **Enjeu** : témoins (`dragonPilgrimsSilenced` impose l'épreuve) et preuve (`dragonShadowEvidence`).
- **Répliques clés** :
  - open, Pèlerins du Dragon : « Le Loup nous retenait au repaire pour porter ses vivres. Nous avons tout vu : le Cristal, l’autel, l’étranger qui parlait au chef. » Si `dragonVillageProtected` : « On dit que vous avez gardé le hameau des contreforts. Nous en venons presque tous. »
  - protected : « Merci. Nous marcherons avec vous, mais nous parlerons pour nous. »
  - silenced, Marian : « Ils se taisent. Les Pics, eux, ne se tairont pas. »
  - Autel, lion (`shadowRevealed`), Séraphine : « Je l’ai déjà vue. Ce sont les preuves des Ombres que nous avons confiées au Lion, dans les plaines : la même marque, la même froideur. »
  - Autel, ore (`bearDarkOreEvidence`), Intendant Maelor : « Et c’est la même souillure que l’éclat du filon sombre, dans notre coffre depuis les montagnes de l’Ours. »
- **Faiblesses** :
  - La formule des témoins revient (M13).
  - Le rappel des témoins ne lit que l'Ours (`bearMinersProtected` / `bearMinersSilenced`), pas Bois-Clair.
  - Le rappel de l'autel n'a pas de branche `shadowFragments`.
  - Point fort : la chaîne d'échos des preuves (Lion, puis Ours, puis Dragon) est la meilleure du jeu.
- **Impact** : moyen. **Piste** : voir M13 ; ajouter la branche `shadowFragments`.

### M19 — Jugement de Kaelen
- **Ids** : `dragon_judgement` (moteur commun, `DRAGON_FINALE`, `dragon/dragonFinale.ts`). Nœud `dragon-judgement`.
- **Répliques clés** :
  - open, Ancien Dragon Kaelen : « Vous revenez des cimes. Les Pics ont déjà parlé avant vous : leurs pèlerins, leurs bêtes, leur autel fendu. Je les ai écoutés. Je vous écouterai ensuite. »
  - outcome (`dragonCrystalRecovered`) : « Le Cristal d’Écho chante de nouveau sur son autel, parce que vous avez rapporté le Cristal d’Écho aux Pics au lieu d’en chercher le prix. »
  - outcome (`dragonWolfAlliance`) : « Vous deviez rapporter le Cristal, et vous avez laissé le Cristal aux mains du Loup. Les Pics tremblent déjà de votre marché. »
  - noneText : « Le Cristal d’Écho n’a été ni rapporté ni défendu. Je ne scellerai rien sur un vide. »
  - credibility (faible) : « Votre nom est monté jusqu’ici, et il sent la cendre. Ne comptez pas sur lui pour parler à votre place. »
  - intent : « Ce que les Pics ont vu ne changera plus. Dites-moi seulement ce que vous demandez au Dragon. »
- **Faiblesses** :
  - La phrase de l'acte est collée dans l'issue : « Cristal d’Écho » deux fois, « le Cristal » deux fois.
  - `noneText` est identique à celui du Scorpion (« Je ne scellerai rien sur un vide. »).
  - Contradiction dans un même jugement : l'ouverture parle de « leur autel fendu », puis l'issue d'honneur dit « Le Cristal d’Écho chante de nouveau sur son autel ».
  - Gabarit commun (M14).
- **Impact** : haut (avec M14). **Piste** : voir M14, et accorder l'autel fendu avec le Cristal revenu.

### M20 — Issues du Dragon et épilogue
- **Ids** : `dragon_shaman_pre_combat` (1, 2, 3 avec la variante `dragonShamanTraceFound`, 4), `dragon_shaman_aftermath`, `dragon_kaelen_pre_combat`, `dragon_trial_aftermath`, `dragon_epilogue`.
- **Répliques clés** :
  - Chaman 4, Chaman des Ombres : « Vous avez rendu au Dragon son jouet. Vous n’avez pas encore compris qui écoute quand le Cristal résonne. »
  - Après le chaman : Chaman, « Le Cristal… n’était qu’un écho. Ceux que je sers écoutent d’autres échos, partout où vos Sceaux vous mènent. » / Séraphine, « Les Ombres, derrière un troisième clan. Le Loup n’était qu’une main de plus, comme le Corbeau avant lui. »
  - Épreuve : Kaelen, « Vous voulez mon Sceau sans le mériter. Alors prouvez votre force à ceux qui gardent l’équilibre : mes gardiens et moi, contre votre compagnie. » / Elara, « Nous l’assumerons. »
  - Après l'épreuve, Kaelen : « Le Sceau est à vous. Les Pics l’ont vu. Ne comptez plus sur la sagesse du Dragon le jour où vous en aurez besoin. »
  - Chronique, Séraphine : « Trois Sceaux. Le Tournoi des Grands n’est plus très loin, et chaque clan que nous avons croisé se souviendra de la manière dont nous avons avancé. »
- **Faiblesses** :
  - « Vous voulez mon Sceau sans le mériter » est faux quand une compagnie honorable demande l'épreuve d'elle-même (`dragonTrialRequested`) ; c'est le même défaut qu'en M15, en plus net.
  - « Nous l’assumerons. » revient.
  - Répétitions avec l'Ours : « une main de plus, comme le Corbeau avant lui » ; « Ne comptez plus sur… le jour où vous en aurez besoin » (`dragon:157` = `scorpion:168`).
  - Épilogue de force : « le Sceau du Dragon » deux fois dans la phrase.
  - Point fort à garder : « partout où vos Sceaux vous mènent » prépare Maelor.
- **Impact** : haut. **Piste** : voir M15.

---

## Le Scorpion

### M21 — Audience du Grand Inquisiteur
- **Ids** : `scorpion_audience` (`scorpion/scorpionDialogues.ts:175-196`) : open ; seals (variantes `dragonShadowShamanDefeated` / `dragonTrialWon` / défaut) ; request, seraphine, maelor ; « alistair » (dit par Kestrel) ; mandate ; accepted / terms. Nœud `scorpion-audience`.
- **Répliques clés** :
  - open, Grand Inquisiteur : « Le Clan du Phénix garde dans son temple un codex prophétique, plus ancien que nos deux clans. Il pourrait révéler la vraie nature des Ombres Silencieuses. »
  - request : « Le Phénix est trop idéaliste pour comprendre ce qu’il garde. Il prie devant ses flammes purificatrices et laisse dormir le seul texte qui pourrait nous armer. Rapportez-moi ce codex, et le Sceau du Scorpion entendra votre nom. »
  - maelor : « Ou lisons ce codex avant tout le monde. Un savoir que tous les clans convoitent vaut plus que n’importe quel Sceau, pour qui sait à qui le vendre… Je dis seulement ce que chacun pense devant ce marché. »
  - Kestrel : « Nous sommes venus chercher un Sceau, pas un savoir à revendre. »
  - terms, Grand Inquisiteur : « Vous voulez lire avant moi ce que je cherche depuis des années. Soit. Mes érudits noteront aussi cette exigence. »
- **Faiblesses** : troisième audience au même gabarit ; « Je dis seulement… » ; « … entendra votre nom ». Bon point : « vaut plus que n’importe quel Sceau » est une graine de Maelor.
- **Impact** : moyen. **Piste** : voir M11.

### M22 — Le temple du Phénix (décision-clé)
- **Ids** : `scorpion_phoenix_temple` (`scorpion/scorpionDialogues.ts:198-221`), puis les avant-combats et aftermaths (`134-147`). Nœud `scorpion-phoenix-temple`.
- **Enjeu** : `scorpionCodexDelivered` (honneur) contre `scorpionCodexKept` ou `scorpionCodexProtected` (force, alliance du Phénix).
- **Répliques clés** :
  - seraphine (si `scorpionPhoenixOath`) : « Nous avons promis ce codex au Grand Inquisiteur, et juré au Phénix de ne pas le lui livrer. L’une de ces deux paroles va se briser ici. »
  - maelor : « Ou gardons-le. Le seul texte qui parle des Ombres, entre nos mains : le Scorpion devra traiter avec nous, et le Phénix aussi. »
  - choice, Alistair : « Le temple attend notre réponse. »
  - protected : Chef des gardiens, « Des étrangers qui tiennent parole. Le Phénix n’oubliera pas que vous avez laissé sa flamme en paix. » / Séraphine, « Et le Grand Inquisiteur n’oubliera pas que nous revenons les mains vides. »
  - Après la prise : Intendant Maelor, « Le codex est à nous. Le Scorpion et le Phénix devront traiter avec ceux qui le tiennent. » / Marian, « Ou ils s’uniront pour le reprendre, et nous n’aurons pas le droit de nous en plaindre. »
- **Faiblesses** :
  - Squelette commun (M12).
  - Maelor dit deux fois la même idée dans la même suite (« devra traiter avec nous » avant le choix, « devront traiter avec ceux qui le tiennent » après la prise).
  - La variante du serment (« L’une de ces deux paroles va se briser ici. ») est la meilleure réplique de bascule des trois plateaux : un modèle.
- **Impact** : haut (avec M12 et M17). **Piste** : voir M12.

### M23 — Témoins (fidèles) et preuve des Ombres (page souillée)
- **Ids** : `scorpion_temple_witnesses` (`scorpion/scorpionDialogues.ts:234-259`) ; `scorpion_corrupted_texts` (`261-283`). Nœuds `scorpion-temple-witnesses` et `scorpion-corrupted-texts`.
- **Répliques clés** :
  - open (`scorpionCodexProtected`), Fidèles rescapés : « Nous avons quitté le temple derrière vous. Ce que nous y voyons depuis des lunes, il faut que quelqu’un l’entende : l’étranger qui murmurait à nos gardiens des prophéties que personne n’avait jamais lues. »
  - request : « Nous voulons le dire nous-mêmes au Grand Inquisiteur. Que le Scorpion sache que le Phénix n’a pas choisi cette haine seul. »
  - maelor (défaut) : « Des fidèles du Phénix devant le Grand Inquisiteur… Il les écoutera, puis il les gardera. Le Scorpion ne laisse jamais repartir un témoin. »
  - Choix : « Escorter les fidèles jusqu’au Grand Inquisiteur. » / « Les réduire au silence, quel qu’en soit le prix. »
  - protected : « Merci. Nous marcherons avec vous, mais nous parlerons pour nous. »
  - Page, reading, Séraphine : « Quelqu’un a écrit entre les lignes du codex. Pas une prophétie : un ordre, glissé dans la foi des autres. » / maelor : « Une page que personne ne devrait lire. Brûlons-la, et n’en parlons plus. »
- **Faiblesses** :
  - Faute de temps : « Ce que nous y voyons depuis des lunes » (ils ont quitté le temple) appelle « voyions » ou « avons vu ».
  - Formules des témoins (M13).
  - L'idée « le Phénix n’a pas choisi cette haine seul » revient presque mot pour mot dans la bouche de Séraphine après le Prophète (« Le Phénix n’a pas choisi seul sa haine du Scorpion : on la lui a soufflée. »).
  - Bon point : « Brûlons-la » est le seul conseil de Maelor sur une preuve, et la trahison le rappelle (`followedAdvice`).
- **Impact** : moyen. **Piste** : corriger le temps, varier le remerciement, garder une seule des deux formulations sur la haine du Phénix.

### M24 — Jugement du Grand Inquisiteur
- **Ids** : `scorpion_judgement` (moteur commun, `SCORPION_FINALE`, `scorpion/scorpionFinale.ts`). Nœud `scorpion-judgement`.
- **Répliques clés** :
  - open, Grand Inquisiteur : « Vous revenez du temple. Mes érudits ont noté chacun de vos pas dans ce désert, et le désert a gardé le reste. Je les ai lus. Je vous écouterai ensuite. »
  - outcome (`scorpionCodexDelivered`) : « Le codex est sur ma table, parce que vous m’avez rapporté le codex prophétique au lieu de le vendre au plus offrant. »
  - outcome (`scorpionCodexProtected`) : « Vous deviez me rapporter le codex, et vous avez laissé le codex au Phénix, pour un serment fait à ceux qui me le refusent. »
  - breachesLead, Érudit du Scorpion : « Et nos registres consignent ce qui pèse contre vous, car le Grand Inquisiteur pèse la parole autant que les actes : »
  - shadow, Séraphine : « Voici la page souillée que nous avons scellée. Les Ombres ne se contentent pas de voler ou de souiller, Grand Inquisiteur : les Ombres écrivent aussi, et elles écrivent dans la foi des autres. »
  - intent : « Ce qui est consigné ne s’efface pas. Dites-moi seulement ce que vous demandez au Scorpion. »
- **Faiblesses** :
  - « codex » deux fois dans chaque ligne d'issue.
  - « Je les ai lus » : l'antécédent grammatical est « mes érudits », pas leurs notes.
  - `noneText` identique à celui du Dragon ; gabarit commun (M14).
- **Impact** : haut (avec M14). **Piste** : voir M14 ; corriger « Je les ai lus ».

### M25 — Issues du Scorpion et épilogue (le quatrième Sceau)
- **Ids** : `scorpion_prophet_pre_combat` (1, 2, 3 avec la variante `scorpionProphetTraceFound`, 4), `scorpion_prophet_aftermath`, `scorpion_inquisitor_pre_combat`, `scorpion_trial_aftermath`, `scorpion_epilogue`.
- **Répliques clés** :
  - Prophète 4, Prophète des Ombres : « Vous avez rapporté le codex à un clan qui croit lire mieux que les autres. Chaque clan croit cela. C’est pour cela que mes prophéties prennent si bien. »
  - Après le Prophète : Prophète, « Les prophéties… ne sont que des mots. Ceux que je sers n’ont besoin que de mots, et d’un clan prêt à y croire. » / Séraphine, « Les Ombres, derrière un quatrième clan. Le Phénix n’a pas choisi seul sa haine du Scorpion : on la lui a soufflée. »
  - Épreuve : Grand Inquisiteur, « Vous voulez mon Sceau par la force plutôt que par ma confiance. Soit. Seule la vérité, même amère, peut sauver ce monde ; voyons ce que vaut la vôtre. Mes érudits et moi, contre votre compagnie. » / Kestrel, « Nous l’assumerons. »
  - Après l'épreuve : « Le Sceau est à vous. Mes érudits l’ont consigné. Ne comptez plus sur le savoir du Scorpion le jour où vous en aurez besoin. »
  - Épilogue, preuve gardée, Intendant Maelor : « La page souillée voyage avec nous, scellée avec les autres preuves. Les Ombres volent, souillent, et maintenant elles écrivent. Je n’aime pas ce que ce tableau commence à montrer. »
  - Chronique, Séraphine : « Quatre Sceaux. La route du Tournoi des Grands est ouverte, et chaque clan que nous avons croisé se souviendra de la manière dont nous l’avons gagnée. »
- **Faiblesses** :
  - Même défaut d'épreuve qu'en M15 et M20, et « Nous l’assumerons. ».
  - Chronique en formule.
  - « Quatre Sceaux. » ouvre aussi l'arrivée au Tournoi qui suit (M26) : deux fois de suite.
  - La dernière réplique de Maelor avant la trahison est une réplique de gabarit (preuve ou absence de preuve). Rien ne marque qu'il s'agit de sa dernière parole « loyale ».
- **Impact** : haut. **Piste** : voir M15 ; faire de l'épilogue du quatrième Sceau un seuil (chronique propre, sans « Quatre Sceaux » répété).

---

## L'acte final

### M26 — Arrivée au Tournoi
- **Ids** : `finale_arrival`, étapes 1 à 5 (`finale/finaleDialogues.ts:98-105`), drapeau `finaleTournamentEntered`.
- **Enjeu** : l'objectif de toute la campagne est atteint ; dernière réplique de Maelor en allié.
- **Répliques clés** :
  - 1, Alistair : « Quatre Sceaux. L’Arène des Destins nous ouvre ses portes, et toutes les bannières des clans flottent au-dessus des tribunes. »
  - 3, Sage Séraphine : « Ne laissez pas l’orgueil choisir à votre place. Ce Tournoi est une épreuve de force, mais aussi de sagesse. Et quelque chose de sombre plane sur cette arène : je le sens depuis que nous avons passé les portes. »
  - 4, Intendant Maelor : « Écrasez-les tous, sans pitié. Personne ne se souvient de la manière, seulement de la victoire. »
  - 5, Alistair : « Nous nous souviendrons, nous. »
- **Faiblesses** :
  - « épreuve de force, mais aussi de sagesse » revient ensuite dans chacun des trois verdicts (M27).
  - La voix de Maelor bascule d'un coup : calculateur dans les plateaux (« Je dis seulement… »), il devient caricatural ici (« Écrasez-les tous, sans pitié »). C'est peut-être une montée voulue, mais elle n'est pas préparée.
  - Séraphine annonce la menace (« quelque chose de sombre plane ») et affaiblit la surprise.
  - Bon point : la réponse d'Alistair renverse la phrase-thème du jeu.
- **Impact** : moyen. **Piste** : garder un Maelor plus froid, dans sa voix de comptable, et alléger le pressentiment de Séraphine.

### M27 — Verdicts des champions (Corbeau, Loup, Phénix)
- **Ids** : `finale_raven_verdict`, `finale_wolf_verdict`, `finale_phoenix_verdict` (`verdictScene`, `finale/finaleDialogues.ts:75-95`, textes `108-131`). Variantes d'alliance : `bearMinesAbandoned`, `dragonWolfAlliance`, `scorpionCodexProtected`. Nœuds `finale-bout-raven`, `finale-bout-wolf`, `finale-bout-phoenix`.
- **Enjeu** : relever ou humilier le champion. Le geste fixe la relation de clan (ralliement, bannières des fins) et nourrit la trahison.
- **Répliques clés** :
  - 3, Intendant Maelor (identique dans les trois scènes) : « Humiliez-le devant les clans. Qu’ils sachent tous qui nous sommes. Dans cette arène, la victoire justifie tout. »
  - 4, Sage Séraphine (identique dans les trois) : « Le Tournoi est une épreuve de force, mais aussi de sagesse. Un adversaire relevé devant tous peut devenir un allié. »
  - choice, Alistair (identique dans les trois) : « Toute l’arène attend notre geste. »
  - Supplique du Corbeau : « Achevez ce que vous avez commencé. Le Corbeau ne demande rien à personne. » ; supplique du Phénix : « Le Phénix renaît de ses cendres. Faites de moi ce que vous voudrez. »
  - Loup épargné (alliance) : « Le Cristal hier, ma vie aujourd’hui. La dette du Loup envers vous ne fait que grandir. »
- **Faiblesses** :
  - Trois scènes d'affilée partagent trois répliques identiques.
  - « Faites de moi ce que vous voudrez » revient trois fois (supplique d'alliance du Corbeau, supplique du Phénix, captif du Phénix `scorpion:69`).
  - Rien n'évolue d'un combat à l'autre : Maelor et Séraphine ne réagissent pas au geste précédent.
  - Bon point : les variantes d'alliance (« Le Cristal hier, ma vie aujourd’hui. ») sont justes.
- **Impact** : haut. **Piste** : trois versions de Maelor et de Séraphine, qui montent et tiennent compte du geste précédent (par exemple deux humiliations déjà faites).

### M28 — Finale contre le Serpent
- **Ids** : `finale_pre_serpent_final`, étapes 1 et 2 (`finale/finaleDialogues.ts:137-140`), combat `finale_serpent_final`. Nœud `finale-bout-serpent`.
- **Enjeu** : finale du Tournoi, contre le clan qui a brûlé Bois-Clair.
- **Répliques clés** :
  - Arrivée 2, Kestrel : « Le Corbeau, le Loup et le Phénix ont envoyé leurs champions. Le Serpent attend en finale, comme toujours. »
  - 1, Champion du Serpent : « Depuis les plaines du Lion, le Serpent attend ce combat. Venez chercher votre victoire. »
  - 2, Alistair : « Alors finissons-en. »
- **Faiblesses** :
  - La finale du Tournoi tient en deux répliques.
  - Aucun écho du général Serpent : tombé si `serpentGeneralDefeated`, « demeure libre » si `lionTrialWon` (`lionFinale.ts:537`, `558`).
  - Aucun écho de Bois-Clair (les torches des Serpents ouvrent le jeu) ni de `missionSuccess` / `missionGreed`.
  - Aucun compagnon ne parle.
  - « finissons-en » suit de peu le « Finissez-en » du champion du Loup (supplique d'alliance).
- **Impact** : haut. **Piste** : deux ou trois répliques qui lisent les faits du Lion (général tombé ou en fuite, Bois-Clair), sans faire du champion le général (à arbitrer).

### M29 — La trahison
- **Ids** : `finale_betrayal` (`finaleBetrayal`, `finale/finaleDialogues.ts:229-240`) : open, reveal, advice (cinq variantes : conseils de plateau avec ou sans humiliations, conseils seuls, arène seule, aucun), breach (`finaleBreachOpened`), champion, flee, alistair. Brouillon N2 : réplique `boisclair` entre reveal et advice (`missionGreed`, `silencedWitnesses`), et modification d'une variante du défaut.
- **Enjeu** : révélation du traître, ouverture de la brèche, et paiement des conseils suivis.
- **Répliques clés** :
  - open, Kestrel : « Le champion du Serpent tombe… et Maelor s’avance au milieu de l’arène, un artefact à la main. »
  - reveal, Maelor : « Vous avez cherché les Ombres Silencieuses dans chaque clan. Elles marchaient avec vous depuis le premier Sceau. »
  - advice (conseils et arène) : « Vous m’avez écouté plus souvent que vous ne le croyez : ${conseils}. Et dans cette arène encore, ${champions}. Chaque fois, vous avez servi ceux que je sers. »
  - advice (aucun) : « Vous ne m’avez jamais écouté. Peu importe : il me suffisait d’entrer avec vous dans cette arène. »
  - breach / champion / flee : Maelor, « Regardez. » / Séraphine, « La brèche… Elle s’ouvre au cœur de l’arène. Le champion du Serpent se relève, et ce n’est plus un homme. » / Maelor, « Nous nous reverrons au cœur de la brèche. »
  - alistair : « Maelor ! »
- **Faiblesses** :
  - Le mobile (entrer dans l'arène grâce aux Sceaux) n'est dit que dans la variante « aucun conseil suivi ». Les quatre autres ne disent jamais pourquoi il lui fallait l'arène.
  - Aucun compagnon ne réagit à la trahison, sauf Alistair (« Maelor ! »). Marian, qui l'a contredit à chaque plateau (« Nous les entendrons frapper encore longtemps, Maelor. », `bear:88` ; « Ce sont des prières, Maelor. Pas une caisse. », `bear:139`), se tait. Séraphine ne parle que de la brèche.
  - « depuis le premier Sceau » : Maelor est là depuis le camp (« Tu as marché avec nous depuis le début », M32). La formule revient trois fois dans l'acte (`finaleDialogues.ts:158`, `185`, `233`).
  - L'artefact n'est pas identifié (« un artefact à la main »). Sur la route où l'artefact du général a été gardé (`shadowConcealed`, Maelor : « l’artefact et son secret resteront avec nous »), le lien n'est pas fait. Ne l'écrire que si l'opérateur le décide (à arbitrer : canon).
  - Les graines déjà semées ne sont pas rappelées : `ate_maelor_seal_analysis` (« J’ai passé des années à traiter les Sceaux comme des leviers : posséder la marque, gagner l’accès, convertir l’accès en pouvoir. », `content.ts:1148`), les veillées (« Il faudra un jour décider à quoi ils nous servent vraiment », `bear:150`), le doute d'Elara (M01).
- **Ce que N2 ne couvre pas** :
  - Faits du Lion non rappelés : `shadowConcealed` (la réplique de Maelor en M09) et `lionMandateAdvance` (son premier conseil, M02).
  - Pactes de plateau poussés par Maelor (« s’user l’un contre l’autre ») : `bearRavenPact` / `bearMinesAbandoned`, `dragonWolfPact` / `dragonWolfAlliance`.
  - La réaction des compagnons.
  - Le mobile dans les variantes.
  - Un risque de longueur : avec N2, jusqu'à trois longues répliques de Maelor s'enchaînent avant « Regardez. ».
- **Impact** : haut. **Piste** : une réplique de mobile commune à toutes les variantes, une réaction courte d'un ou deux compagnons, et un rappel de l'analyse du Sceau déjà écrite.

### M30 — Chaos de l'arène et capitale
- **Ids** :
  - `finale_arena_chaos` (`finale/finaleDialogues.ts:141-151`, choix `finaleCiviliansProtected` / `finaleCiviliansAbandoned`), `finale_arena_assault_aftermath`.
  - `finale_capital_arrival` ; `finale_trapped_citizens` (choix `finaleCitizensFreed` / `finaleCitizensLeft`).
  - Nœuds `finale-arena-chaos`, `finale-arena-gate`, `finale-trapped-citizens`.
- **Enjeu** : couvrir les civils ou fuir ; dégager des habitants ou gagner du temps.
- **Répliques clés** :
  - chaos 2, Marian : « Les civils ne sortiront jamais seuls. Il faut quelqu’un entre eux et ces choses. »
  - chaos, choix : « Couvrir la fuite des civils. » / « Fuir par les tribunes, sans les attendre. »
  - Après l'assaut : Séraphine, « Le champion est tombé une seconde fois. La brèche, elle, grandit encore. » / Kestrel, « Les portes de l’arène sont libres. Derrière, la capitale brûle. »
  - Capitale 2, Séraphine : « Maelor nous attend au cœur de la brèche. Tout ce que nous avons vu des Ombres, depuis le premier Sceau, mène là. »
  - Habitants dégagés, Habitant de la capitale : « Vous êtes restés. Personne d’autre ne l’aurait fait. »
- **Faiblesses** :
  - Les deux options du chaos lancent le même combat avec le même indice (« Combat contre le champion changé en démon ») : fuir n'évite pas le combat, et le texte ne le dit pas.
  - « depuis le premier Sceau » revient.
  - « Personne d’autre ne l’aurait fait » est générique.
  - La dernière veillée lit `finaleCitizensFreed` / `finaleCitizensLeft`, pas les épilogues (`finaleEpilogues.ts` ne lit que `finaleCiviliansProtected` / `finaleCiviliansAbandoned`).
- **Impact** : moyen. **Piste** : dire dans l'option de fuite que le démon barre aussi les tribunes, et remplacer une occurrence de « depuis le premier Sceau ».

### M31 — Ralliement des clans et dernière veillée
- **Ids** : `finale_allied_rally` (`finale/finaleDialogues.ts:242-278`) ; `finale_last_vigil` (`280-310`). Nœuds `finale-allied-rally` et `finale-last-refuge`.
- **Enjeu** : chaque chef paie la manière dont son Sceau a été obtenu ; dernier moment calme après la trahison.
- **Répliques clés** :
  - lion (`serpentGeneralDefeated`), Chef Alaric : « Le Lion n’a pas oublié votre jugement : les guerriers d’Alaric tiennent parole. »
  - bear (`bearMasterSpyDefeated`), Ancien Ours Borin : « Vous avez rendu leurs galeries à mes mineurs, et les guerriers de Borin tiennent parole. »
  - scorpion (`scorpionShadowProphetDefeated`), Grand Inquisiteur : « Mes érudits ont tout consigné, même ceci : les érudits du Grand Inquisiteur tiennent parole. »
  - close, Séraphine : « Ceux qui marchent avec nous et ceux qui nous attendent dans les rues : chaque clan se souvient de la manière dont nous avons avancé. »
  - Veillée, evidence : « Voici ce que nous savons des Ombres : ${preuves}. La même marque, partout où Maelor nous a suivis. »
  - Veillée 2, Séraphine : « Demain, Maelor, et ce qu’il sert. Je ne sais pas ce qui attend derrière lui. Je sais seulement que nous y entrerons ensemble. »
- **Faiblesses** :
  - « … tiennent parole » sur quatre répliques de suite, chaque chef parlant de lui-même à la troisième personne (« les guerriers d’Alaric », « les guerriers de Borin », « les gardiens de Kaelen », « les érudits du Grand Inquisiteur »).
  - « n’ont pas oublié » quatre fois sur les branches de force.
  - La réplique de clôture reprend la chronique du Dragon.
  - Alaric ignore `shadowRevealed`, alors qu'il avait promis : « Le Lion mettra ses éclaireurs à votre disposition » (`lionFinale.ts:524`).
  - La veillée est le seul temps calme après la trahison, et personne n'y parle de Maelor au-delà de « Demain, Maelor, et ce qu’il sert. ».
- **Impact** : moyen. **Piste** : rendre aux chefs la première personne, varier les quatre formules, et donner à la veillée une réplique de compagnon sur Maelor.

### M32 — La brèche : confrontation, chute, fin de l'acte
- **Ids** : `finale_breach_confrontation` (`finale/finaleDialogues.ts:173-178`), combat `finale_breach` (nœud `finale-breach`), `finale_breach_aftermath` (`179-183`), `finale_act_end` (`184-187`, `completePlateau`).
- **Enjeu** : combat final contre le traître puis l'entité, et fermeture de la brèche.
- **Répliques clés** :
  - 1, Maelor : « Vous voilà. Quatre Sceaux, des clans derrière vous ou contre vous… et toujours la même question : à quoi vous servaient-ils vraiment ? »
  - 2, Sage Séraphine : « Ce qui se tient derrière lui n’a aucun nom que je connaisse. Il faudra l’abattre quand même. »
  - 3, Alistair : « Tu as marché avec nous depuis le début, Maelor. Ici, ça s’arrête. »
  - 4, Maelor : « Alors venez. »
  - Après la chute 1, Kestrel : « Maelor est tombé le premier. Il n’a rien dit de plus. »
  - Fin de l'acte, Séraphine : « Refermer la brèche, maintenant. Ce qui suivra dépendra de tout ce que nous avons fait depuis le premier Sceau. »
- **Faiblesses** :
  - La confrontation finale tient en quatre répliques.
  - La question de Maelor, bon écho des veillées, reste sans réponse. La réponse n'existe que dans la fin du Respect (« c’est pour cela que les Sceaux nous ont été donnés »).
  - Seul Alistair lui parle.
  - Ses derniers mots (« Alors venez. ») sont plats, comme « Il faudra l’abattre quand même. ».
  - La fin de l'acte tient en une réplique, avec « depuis le premier Sceau ».
  - N3 ajoute le sort de Maelor dans les épilogues, rien ici.
- **Impact** : haut. **Piste** : une réponse de la compagnie à la question de Maelor (tirée de ce que les plateaux ont dit des Sceaux), une réplique de Marian ou de Séraphine pour lui, et des derniers mots qui lui ressemblent.

---

## Les fins

### M33 — Fin du Respect
- **Ids** : `finale_epilogue_respect` (`epilogueRespect`, `finale/finaleEpilogues.ts`) : breach, allies, seals, acclaim (premier chef allié, sinon Kestrel), civilians (variantes), alistair, clan, close (`completeEpilogue`). N3 : réplique `maelor` de Kestrel après seals.
- **Répliques clés** :
  - breach, Sage Séraphine : « La brèche se referme. Tous ensemble, maintenant : c’est pour cela que les Sceaux nous ont été donnés. »
  - acclaim (chef allié) : « Les clans vous doivent d’être encore debout. Qu’ils se rassemblent sous votre bannière pour reconstruire ce que la brèche a brûlé. »
  - alistair : « Nous ne reconstruirons pas seuls. Chaque clan portera sa part du fardeau, et la justice vaudra pour tous. »
  - clan, Séraphine : « Votre clan avait perdu ses terres et sa place. Aujourd’hui, il retrouve son honneur, et devient un pilier de la nouvelle alliance. »
  - close, Alistair : « Alors rentrons. Il y a tant à reconstruire. »
- **Faiblesses** :
  - La voix de Séraphine dévie : « Votre clan » ici et dans l'Équilibre, alors qu'elle dit « notre clan » tout le jeu (`acte_ouverture:1`, « Notre clan a perdu ses terres », `content.ts:101` ; épilogue du Lion, « notre clan choisit de devenir »).
  - Les répliques « clan » et « alistair » recopient la feuille de route (§2.6, `docs/content/feuille_de_route_narrative_condensee.md:75` : « Son clan est restauré dans son honneur et devient un pilier de la nouvelle alliance », « les sacrifices sont partagés et la justice prévaut »). On lit un résumé, pas une voix.
  - Aucun bouclage avec l'ouverture (la salle du père, « Un Sceau peut rouvrir une porte… ») ni avec Bois-Clair.
  - `finaleCitizensFreed` n'a pas d'écho.
  - « rentrons » pour un clan sans terre : aucun lieu de retour n'est établi.
  - La réplique du chef allié est la même quel que soit le chef.
- **Ce que N3 ne couvre pas** : la voix de Séraphine, le bouclage, les habitants, « rentrons ».
- **Impact** : haut. **Piste** : rendre « notre clan » à Séraphine, faire écho à sa réplique d'ouverture, et donner à chaque chef possible sa phrase d'acclamation.

### M34 — Fin de l'Équilibre
- **Ids** : `finale_epilogue_balance` (`epilogueBalance`) : breach, banners, seals, why (quatre variantes selon les issues), civilians, peace, clan, close. N3 : `maelor`.
- **Répliques clés** :
  - breach, Sage Séraphine : « La brèche se referme. Le monde tient encore, mais il ne sera plus jamais le même. »
  - why (trois honneurs ou plus, réputation sous 40) : « Trois Sceaux confiés, et pourtant notre nom pèse moins que nos actes : les clans hésitent encore à nous suivre. » (ou « Quatre… »)
  - why (deux et deux) : « Deux Sceaux confiés, deux arrachés : les clans nous respectent autant qu’ils nous craignent. »
  - peace, Alistair : « Alors il faudra négocier. Une paix fragile vaut mieux qu’une guerre de plus, même si elle nous coûte une part de ce que nous croyions. »
  - clan, Séraphine : « Votre clan regagne une part de son honneur. Le reste, il faudra le mériter, dans un monde encore divisé. »
  - close, Kestrel : « Respectés, et craints. Il faudra apprendre à marcher entre les deux. »
- **Faiblesses** :
  - « Le monde… ne sera plus jamais le même » est un cliché.
  - Recopie de la feuille de route (`feuille_de_route…:81`, « Son clan regagne une partie de son honneur… dans un monde encore divisé ») et « Votre clan ».
  - « notre nom pèse moins que nos actes » se lit à double sens : des actes plus lourds que le nom, est-ce un éloge ou un reproche ? Or la conclusion dit l'hésitation des clans.
  - Pas de bouclage.
  - La réplique de clôture de Kestrel est juste.
- **Impact** : moyen. **Piste** : remplacer le cliché, lever le double sens de « why », rendre « notre clan ».

### M35 — Fin de la Crainte et clôture
- **Ids** : `finale_epilogue_fear` (`epilogueFear` : breach, alone, seals, civilians, approach, demand, choice) puis `finale_fear_close` (deux branches de trois répliques) ; combat `finale_last_stand` sur la branche du combat. N3 : `maelor`.
- **Enjeu** : dernier choix du jeu, combattre seuls ou se livrer.
- **Répliques clés** :
  - breach, Sage Séraphine : « La brèche se referme. Les Ombres Silencieuses sont vaincues. »
  - demand, Séraphine : « Ils vous craignent plus que la brèche, Alistair. Ils exigent qu’on vous livre, pour acheter leur paix. »
  - choice, Alistair : « Alors ? », puis « Nous battre, seuls contre tous. » / « Accepter mon destin. »
  - Clôture (combat) : Kestrel, « Mais les clans ont rayé votre nom des leurs. Le clan sans terre n’existe plus : il ne reste que nous. » / Alistair, « Alors nous marcherons sans nom. »
  - Clôture (destin) : Séraphine, « Vous avez accepté votre destin, Alistair, pour que les autres vivent. » / Marian, « Les clans tiendront parole : votre clan vivra, mais déchu, une fois de plus. » / Alistair, « Qu’il vive. C’est assez. »
- **Faiblesses** :
  - La victoire sur les Ombres tombe en une annonce plate, dans la fin où elle devrait avoir un goût amer.
  - Pour la première fois, le jeu nomme Alistair comme celui que les clans réclament, avec le choix à la première personne (« Accepter mon destin. »). Ailleurs, Alistair pose la question à la compagnie (« Votre réponse, alors. », `bear:70`) et pose ici sa propre question (« Alors ? »). Le statut d'Alistair, héros joué ou compagnon, reste une décision ouverte (AGENTS.md, « The Alistair emblem or origin ») : cohérence à vérifier avec l'opérateur.
  - Encore la formule « tenir parole » (Marian).
  - Le serment de Marian à l'ouverture (« si nous faisons du mal en sachant ce que nous faisons, ne comptez pas sur mes soins pour nous donner raison », `content.ts:137`) trouve ici son paiement naturel, et il est absent.
  - Bons points : « Alors nous marcherons sans nom. » et « Qu’il vive. C’est assez. ».
- **Ce que N3 ne couvre pas** : le serment de Marian, la réplique de brèche, la question d'Alistair.
- **Impact** : haut. **Piste** : une réplique de brèche qui dit le prix de cette victoire, un écho du serment de Marian, et faire trancher par l'opérateur qui pose la question finale.

---

## Formules répétées d'un plateau à l'autre

Occurrences relevées par grep dans `src` (tests exclus). Les chemins sans préfixe sont sous `src/campaign/plateaux/`.

| Formule | Occurrences | Remarque |
| --- | --- | --- |
| « Nous marcherons avec vous, mais nous parlerons pour nous. » | `bear/bearDialogues.ts:256`, `dragon/dragonDialogues.ts:241`, `scorpion/scorpionDialogues.ts:256` | Mot à mot, même étape `protected`. |
| « Je dis seulement… » (Maelor) | `bear:68` (« Je dis seulement que l’honneur de l’Ours… »), `bear:186`, `dragon:176`, `scorpion:187` (« … ce que tout le monde pensera / chacun pense… ») | Quatre fois ; trois en fin de réplique d'audience. |
| « Nous l’assumerons. » | `bear:158` (Marian), `dragon:154` (Elara), `scorpion:165` (Kestrel) | Seule réponse aux trois épreuves. |
| « Le Sceau est à vous. » / « le Sceau est à vous » | `bear:161`, `dragon:157`, `scorpion:168` ; Lion `content.ts:986`, `1336`, `lionFinale.ts:540` | Ouvre toutes les défaites d'un chef. |
| « … le Sceau de X entendra votre nom » | `content.ts:305`, `367` (deux fois dans `lion_briefing`), `bear:184`, `dragon:174`, `scorpion:185` | Cinq fois. |
| « … quel qu’en soit le prix » (faire taire) | `content.ts:902`, `bear:254`, `dragon:239`, `scorpion:254` | Libellé du choix. |
| « Des témoins libres pèsent plus lourd qu’un récit que nous ferions nous-mêmes. » | `bear:243`, `dragon:228`, `scorpion:240` | Défaut de Séraphine. |
| « Ou reprenons-les / reprenons-le pour nous » / « Ou gardons-le » | `bear:221`, `dragon:195`, `scorpion:208` | Maelor, décision-clé. |
| « Ou laissons X et Y s’user l’un contre l’autre » | `bear:186`, `dragon:176` | Maelor, audience. |
| « Les galeries / Le repaire / Le temple attend(ent) notre réponse. » | `bear:222`, `dragon:196`, `scorpion:209` | Alistair. |
| « … qui tiennent parole » / « tiennent parole » / « tiendront parole » | `bear:231`, `dragon:80`, `dragon:205`, `scorpion:218`, `finale/finaleDialogues.ts:245`, `250`, `255`, `260`, `finale/finaleEpilogues.ts:229` | Neuf fois, dont quatre de suite au ralliement. |
| « Et X n’oubliera pas… » (Séraphine après une alliance) | `bear:232`, `dragon:206`, `scorpion:219` | Même place. |
| « … est à nous … devra traiter avec nous » et « Ou il viendra… / nous n’aurons pas le droit de nous en plaindre » | `bear:128-129`, `dragon:145-146`, `scorpion:145-146` | Suites de prise. |
| « Alors, étrangers. » | `bear:188`, `dragon:178` | Mandat. |
| « Nous ne sommes pas venus… » / « Nous sommes venus chercher… » | `bear:187`, `dragon:177`, `scorpion:188` | Réplique « clan sans terre ». |
| « Vous osez chiffrer » / « Vous chiffrez » | `content.ts:379`, `bear:193`, `dragon:183` | |
| Indice « … observe votre conduite » | `content.ts:357`, `bear:189`, `dragon:179`, `scorpion:190` | |
| « Vous revenez des/du … ont déjà parlé avant vous … Je vous écouterai ensuite » | `bear/bearFinale.ts` (`opening`), `dragon/dragonFinale.ts`, `scorpion/scorpionFinale.ts` | Ouverture des jugements. |
| « Dites-moi seulement ce que vous demandez à/au… » | les trois `*Finale.ts` (`intent`) ; modèle `lionFinale.ts:444` | |
| « … c’est vrai. Puis vous avez gardé… pour votre clan » | `bear/bearFinale.ts:51`, `dragon/dragonFinale.ts:52`, `scorpion/scorpionFinale.ts:54` | Lignes d'issue. |
| « … absence de témoins » | `bear/bearFinale.ts:60`, `dragon/dragonFinale.ts:61`, `scorpion/scorpionFinale.ts:63` | |
| « Je ne scellerai rien sur un vide. » | `dragon/dragonFinale.ts:55`, `scorpion/scorpionFinale.ts:57` | `noneText` identique. |
| « Mes comptes gardent aussi » | `lionFinale.ts:429`, `bear/bearFinale.ts:78`, `dragon/dragonFinale.ts:79`, `scorpion/scorpionFinale.ts:81` | |
| « Assumer nos actes et réclamer le Sceau. » | `content.ts` (`lion_finale_judgement`), `lionFinale.ts`, `plateauFinale.ts:193` | Même choix aux quatre jugements. |
| « Le Sceau de X est entre vos mains, mais vous avez pris le Sceau de X par l’épreuve. » | `bear/bearFinale.ts:90`, `dragon/dragonFinale.ts:91`, `scorpion/scorpionFinale.ts:93` | Avec « ce Sceau arraché » (trois fois). |
| « … se souviendra / se souvient de la manière dont nous… » | `bear/bearFinale.ts:93`, `dragon/dragonFinale.ts:94`, `scorpion/scorpionFinale.ts:96`, `finale/finaleDialogues.ts:275` | Chroniques et ralliement. |
| « … scellera notre alliance » / « a scellé l’alliance » | `bear:279`, `dragon:290`, `scorpion:300` ; `bear/bearFinale.ts:89`, `dragon/dragonFinale.ts:90`, `scorpion/scorpionFinale.ts:92` | |
| « Ne revenez pas chercher… / Ne comptez plus sur… le jour où vous en aurez besoin » | `bear:161`, `dragon:157`, `scorpion:168` | Chef vaincu. |
| « … n’en était qu’une part / n’était qu’un écho / ne sont que des mots. Ceux que nous servons / je sers… » | `bear:153`, `dragon:149`, `scorpion:160` | À garder : prépare « ceux que je sers » de Maelor (`finale/finaleDialogues.ts:222-225`). |
| « Les Ombres, encore / derrière un troisième / quatrième clan » et « une main de plus » | `bear:154`, `dragon:150`, `scorpion:161` | |
| « Il faudra aller le chercher. » / « Je reconnaîtrai sa piste. » | `bear:282`, `dragon:293`, `scorpion:303` / `dragon:292`, `scorpion:302` | |
| « … est parti avant nous. Il savait… » | `dragon:217`, `scorpion:230` | |
| « coffre doublé de plomb » | `bear:271`, `dragon:270`, `scorpion:280` | |
| « nous ne le saurons que plus tard » / « nous ne saurons jamais » / « nous ne le saurons plus » | `bear:272`, `bear/bearFinale.ts:92`, `dragon:271`, `dragon/dragonFinale.ts:93`, et `scorpion` (« Nous ne saurons jamais ce qu’elle ordonnait ») | |
| « Deux / Trois / Quatre Sceaux, bientôt. » (Maelor, veillées) | `bear:150`, `dragon:283`, `scorpion:293` | Graine de la trahison, utile, mais en formule. |
| « X nous attend demain. Tout ce que nous avons fait… sera posé / consigné devant lui. » et « Il ne nous jugera pas sur nos mots, mais sur… » | `bear:148-149`, `dragon:280-282`, `scorpion:290-292` | Veillées. |
| « … dans notre coffre » (arrivées) | `bear:60`, `dragon:64`, `scorpion:62` | |
| « Faites de moi ce que vous voudrez. » | `finale/finaleDialogues.ts:114`, `128`, `scorpion:69` | |
| « épreuve de force, mais aussi de sagesse » | `finale/finaleDialogues.ts:102` (arrivée), `82` (joué trois fois, un par verdict) | Quatre fois en jeu. |
| « depuis le premier Sceau » | `finale/finaleDialogues.ts:158`, `185`, `233` | |
| « La brèche se referme. » | les trois épilogues (`finale/finaleEpilogues.ts`) | Parallèle voulu, à garder ou à varier. |
| « Bois-Clair brûle sous les torches des Serpents » | `prologue.ts:18`, `content.ts:305` (et le commentaire de `ui/living/boisClairArrival.ts:69`) | Avec `acte_ouverture:7`. |
| « Vos actes parlent plus fort que vos promesses » / « Les actes pèsent plus lourd que les promesses » | `content.ts:911`, `1088` | Même chapitre. |

---

## Ce que les ajouts en cours de validation (N2, N3) ne couvrent pas

- **N2 (`finale_betrayal`, rappel de Bois-Clair)** :
  - Faits du Lion non rappelés : `shadowConcealed`, avec la propre réplique de Maelor (« l’artefact et son secret resteront avec nous »), et `lionMandateAdvance` (son premier conseil).
  - Pactes de plateau poussés par Maelor : `bearRavenPact`, `bearMinesAbandoned`, `dragonWolfPact`, `dragonWolfAlliance`.
  - Graines déjà écrites et non rappelées : `ate_maelor_seal_analysis`, le doute d'Elara.
  - Mobile absent de quatre variantes sur cinq ; aucune réaction de compagnon ; longueur cumulée possible de trois répliques de Maelor.
- **N3 (le sort de Maelor dans les épilogues)** :
  - Rien dans la confrontation de la brèche, qui reste à quatre répliques.
  - La question « à quoi vous servaient-ils vraiment ? » ne reçoit de réponse que dans le Respect.
  - Côté épilogues : la voix de Séraphine (« Votre clan »), l'absence de bouclage avec l'ouverture et Bois-Clair, l'écho manquant de `finaleCitizensFreed` / `finaleCitizensLeft`, le serment de Marian dans la Crainte, la réplique de brèche plate de la Crainte.
- **N1 (embranchements de combat)** : il touche `bear_ore_convoy`, `dragon_terrorized_village` et `scorpion_scholars`. Ces scènes deviendront des moments à enjeu, mais leurs répliques sont déjà proposées mot à mot dans le brouillon ; elles restent hors de cet inventaire.

---

## Top 10 par impact

1. **M29 La trahison** : le mobile n'est dit que dans une variante sur cinq, aucun compagnon ne réagit, et N2 laisse hors champ `shadowConcealed`, `lionMandateAdvance`, les pactes de plateau et l'analyse du Sceau déjà écrite.
2. **M32 La brèche** : quatre répliques pour le combat final, la question de Maelor sans réponse, une fin d'acte d'une ligne, « Alors venez. » comme derniers mots.
3. **M15 / M20 / M25 Épreuves des chefs** : l'avant-combat statique dit « par la force » ou « sans le mériter » même après une reconnaissance refusée ou une épreuve demandée (le Lion distingue les deux cas), la voie d'honneur n'a aucune phrase de reconnaissance, et « Nous l’assumerons. » sert trois fois.
4. **M28 Finale contre le Serpent** : deux répliques, sans écho du général (tombé ou libre) ni de Bois-Clair.
5. **M14 / M19 / M24 Jugements des plateaux** : la phrase de l'acte est collée dans l'issue (« le Cristal d’Écho… le Cristal d’Écho »), l'ouverture, l'intention et les témoins suivent un gabarit, avec des ambiguïtés (« la mienne », « Je les ai lus », autel fendu contre Cristal qui chante sur son autel).
6. **M03 / M04 Bois-Clair** : la contradiction des coffres (« brûlent déjà » ou « partent par la porte basse »), une réplique logistique juste après le choix, et « le sang du Lion » avant la défense.
7. **M33 / M35 Fins** : Séraphine passe à « Votre clan », les lignes recopient la feuille de route, sans bouclage avec l'ouverture ; la brèche de la Crainte est plate, le serment de Marian n'est pas payé, et qui pose la question finale reste à arbitrer.
8. **M27 Verdicts des champions** : mêmes répliques de Maelor, de Séraphine et d'Alistair trois fois de suite, et « Faites de moi ce que vous voudrez » trois fois dans le jeu.
9. **M12 / M17 / M22 Décisions-clés des plateaux** : même squelette, du « Ou reprenons-le pour nous » au « … attend notre réponse » et au « Ou il viendra le reprendre », avec un avant-combat d'une seule réplique.
10. **M01 Ouverture** : doublon mot à mot panneau/Maelor sur les quatre Sceaux, « Bois-Clair brûle » trois fois en deux minutes, la tournure fautive d'Elara et sa graine jamais récoltée.
