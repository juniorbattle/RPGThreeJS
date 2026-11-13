# Embranchements de combat des plateaux et répliques de Maelor — brouillon (2026-11-13)

Statut : `DRAFT`, soumis à l'opérateur question par question. Rien de ce brouillon n'entre dans le jeu avant sa validation mot à mot.
Décision appliquée : [OD-2026-11-13-F](../../autonomy/COMPLETENESS_REVIEW_OPERATOR_DECISION_2026-11-13.md), arbitrages N1, N2, N3 et N5. Bilan : `docs/reports/game-completeness-review-2026-11-13.md`, §3.
Sources des répliques : les scènes canon des plateaux, les faits établis du Lion (`src/game/content.ts`) et les décisions de l'opérateur. Aucun clan, lieu, personnage, objet ni savoir nouveau.

Convention : les lignes marquées **NOUVEAU** ou **MODIFIÉ** sont à valider mot à mot. Les autres sont reprises telles quelles du jeu.

## 0. Principe commun aux trois embranchements (N1)

- **Le temps choisi** est, dans chaque plateau, la scène où un adversaire armé se tient déjà devant la compagnie : l'escorte du convoi (Ours), le raid du Loup (Dragon), les érudits et leur prisonnier (Scorpion). Ce sont trois temps différents du gabarit (5, 4 et 3), pas le même temps répété.
- **Une branche combat, l'autre l'évite à son prix.** Les deux choix existants restent, avec leurs textes, leurs drapeaux et leur réputation. Le choix qui combat garde ses effets et lance en plus un combat, après une réplique d'annonce. L'autre garde son prix actuel (or renoncé, réputation perdue, manquement devant le chef) ; le Dragon le rend visible par une réplique.
- **Après la victoire, la même scène se rouvre** sur l'issue du combat, puis sur la rencontre du héros recrutable qu'elle accueille déjà (Gunnar, Lyra, Eldwin). Les répliques de ces rencontres ne changent pas : sur la branche du combat, elles se jouent après le combat au lieu d'avant, ce qui les rend exactes (« Cette nuit, vous avez monté la garde avec moi », « Vous avez pris le minerai. Bonne prise. »). La scène rouverte garde son image et son humeur musicale.
- **Combats** : unités et arène existantes du plateau, rang normal, récompense en or modeste et réputation 0 (l'échelle de l'après-démo, OD-2026-11-08-A : un combat ordinaire ne donne pas de réputation). Les bornes de réputation ne bougent pas. Une défaite ramène au dernier point de sauvegarde, comme pour tout combat.
- **Drapeaux** : aucun drapeau de choix ne change. Chaque combat ajoute un seul fait de victoire, technique (`bearConvoyEscortDefeated`, `dragonVillageRaidRepelled`, `scorpionScholarsDefeated`), qui sert à rouvrir la scène après la victoire. La sauvegarde V6 n'est pas touchée : ce sont trois clés booléennes de plus dans `flags`.
- **Jugement du chef** : les poids (`conductWeights`), les actes nommés (`deeds`), les faits de force et le fait d'honneur restent les mêmes. À choix égaux, le verdict est donc identique : ni la voie d'honneur ni celle de force ne changent de condition. Le jugement continue de lire le drapeau du choix (`plateauFinale.ts:86-101`), avec la phrase qu'il dit déjà.

## 1. Ours — temps 5, « Convoi de minerai »

Nœud `bear-ore-convoy` (région II, événement requis, ton « cupidité »). Le gabarit du Lion est celui du nid du jeune dragon : combattre pour le butin, ou y renoncer.

- **Branche combat** : « Saisir le minerai pour le clan. » L'escorte ne s'enfuit plus : elle défend les chariots.
- **Branche esquive** : « Marquer le convoi et prévenir Borin. » Prix : la compagnie renonce aux 3 minerais, aux 40 or et à l'or du combat.

Scène `bear_ore_convoy` :
- `open` (Kestrel), `maelor` (Maelor, avec l'écho de Bois-Clair), `seraphine` (Séraphine) et la question d'Alistair « Le convoi passe bientôt. » : inchangés.
- Choix 1 : « Marquer le convoi et prévenir Borin. » — inchangé (indice : « Borin saura ce que le Corbeau emporte »).
- Choix 2 : « Saisir le minerai pour le clan. » — effets inchangés, plus le combat. **MODIFIÉ**, indices : « 3 minerais et 40 or » ; « Combat contre l’escorte du Corbeau » ; « Un convoi détourné ».
- `reported` (Kestrel) : inchangé, puis la rencontre de Gunnar (branche « marqué ») inchangée.
- **NOUVEAU** `escort` (Kestrel, sévère) : « Les gardes ne s’enfuient pas. Ils se serrent autour des chariots, lames tirées. »

Combat `bear_convoy_escort` :
- arène : `bear_mountain_pass`, le col enneigé des sentiers de l'Ours ;
- ennemis : deux Éclaireurs du Corbeau (les gardes) et un Mineur du Corbeau (le conducteur) : `raven_scout`, `raven_miner`, `raven_scout` ;
- **NOUVEAU**, libellé : « Escorte du convoi » ; objectif : « Venez à bout de l’escorte du Corbeau et prenez le minerai du convoi. » ;
- récompense : 20 or, réputation 0.

Après la victoire, la scène se rouvre :
- **MODIFIÉ** `seized` (Kestrel) : « Les chariots sont à nous. Ce minerai sent la pierre froide… et autre chose. » C'est la réplique actuelle sans sa première phrase, « Les gardes s’enfuient sans combattre. »
- puis la rencontre de Gunnar (branche « saisi ») inchangée.

Drapeaux et jugement :
- `bearConvoyReported` (+1) et `bearConvoySeized` (−1) restent. Borin dit toujours « vous avez signalé le convoi du Corbeau » ou « le minerai du convoi détourné pour votre clan ».
- Nouveau fait technique `bearConvoyEscortDefeated`, posé par la victoire.
- Carte `bear.consequences.json` : l’option 1 de `bear.ore_convoy` mène à ce fait (`leadsTo`), déclaré `system`.

Alternative, si l'opérateur veut le combat sur la branche d'honneur : temps 8, « Mineurs libérés ». Escorter les mineurs jusqu'à Borin coûterait un combat contre les traqueurs du Corbeau, déjà présents là comme rencontre facultative. Les faire taire l'éviterait. Ce temps existe aussi au Dragon et au Scorpion, d'où la recommandation du convoi.

## 2. Dragon — temps 4, « Hameau terrorisé »

Nœud `dragon-terrorized-village` (région I, événement requis). Le Loup descend chaque nuit, et le choix dit déjà « repousser le prochain raid ». C'est le gabarit du troll, du duelliste ou de l'informateur du Lion : le choix honorable coûte un combat.

- **Branche combat** : « Monter la garde et repousser le prochain raid. »
- **Branche esquive** : « Faire payer notre protection. » Prix inchangé : 60 or gagnés, mais −2 de réputation et un manquement devant Kaelen (« le hameau a payé deux fois, au Loup puis à vous »). Le prix devient visible : le Loup ne recule qu'une nuit.

Scène `dragon_terrorized_village` :
- Répliques 1 à 4 et la question d'Alistair « Que faisons-nous pour ce hameau ? » : inchangées.
- Choix 1 : « Monter la garde et repousser le prochain raid. » — effets inchangés, plus le combat. **MODIFIÉ**, indices : « Combat contre les pillards du Loup » ; « Le hameau protégé ». L'ancien indice était « Une nuit de garde ».
- Choix 2 : « Faire payer notre protection. » — inchangé (indices : « 60 or » ; « Un hameau qui paie deux fois »).
- **NOUVEAU** `raid` (Kestrel, sévère) : « Des torches sur le sentier, et des loups devant les hommes. Le Loup descend, comme chaque nuit. Cette fois, nous l’attendons. »
- **NOUVEAU** `extorted_night` (Kestrel), sur la branche esquive : « Le Loup a vu nos feux et il a tourné bride sans combattre. Pour cette nuit, du moins. »
- puis `extorted` (Marian) inchangé, et la rencontre de Lyra (branche « rançonné ») inchangée.

Combat `dragon_village_raid` :
- arène : `dragon_peak_trail`, le sentier des contreforts ;
- ennemis : deux Pillards du Loup et un Loup : `wolf_raider`, `wolf`, `wolf_raider` ;
- **NOUVEAU**, libellé : « Raid sur le hameau » ; objectif : « Repoussez le raid du Loup avant qu’il n’atteigne le hameau. » ;
- récompense : 25 or, réputation 0.

Après la victoire, la scène se rouvre :
- **MODIFIÉ** `protected` (Villageois des contreforts, reconnaissant) : « Le Loup a goûté vos lames et il a tourné bride. C’est la première nuit que nous dormons depuis des semaines. » La réplique actuelle disait « a vu vos feux ».
- puis la rencontre de Lyra (branche « protégé ») inchangée : « Cette nuit, vous avez monté la garde avec moi… »

Drapeaux et jugement :
- `dragonVillageProtected` (+1) et `dragonVillageExtorted` (−2) restent, avec leurs échos : la veillée (le pain et le bois montés du hameau) et les pèlerins (« vous avez gardé le hameau des contreforts »).
- Nouveau fait technique `dragonVillageRaidRepelled`.
- Carte `dragon.consequences.json` : l’option 0 de `dragon.village` mène à ce fait.

## 3. Scorpion — temps 3, « Érudits du Scorpion »

Nœud `scorpion-scholars` (région I, événement requis). C'est le gabarit de l'informateur du Lion : protéger quelqu'un face à ses geôliers, ou le leur laisser contre de l'or. La différence : les geôliers sont les érudits du clan qui vous mandate. Le Grand Inquisiteur nomme déjà ce mérite « vous avez arraché un fidèle du Phénix aux érudits du Scorpion ».

- **Branche combat** : « Libérer le fidèle du Phénix. »
- **Branche esquive** : « Le laisser aux érudits. » Prix inchangé : 50 or, −2 de réputation, un manquement devant le Grand Inquisiteur et Eldwin fermé pour toute la partie.

Scène `scorpion_scholars` :
- Répliques 1 à 5 et la question d'Alistair « Que faisons-nous ? » : inchangées.
- Choix 1 : « Libérer le fidèle du Phénix. » — effets inchangés, plus le combat. **MODIFIÉ**, indices : « Combat contre les érudits du Scorpion » ; « Un fidèle libre » ; « Le Grand Inquisiteur l’apprendra ».
- Choix 2 : « Le laisser aux érudits. » — inchangé, avec ses répliques et la rencontre d'Eldwin (branche « laissé »).
- **NOUVEAU** `refusal` (Érudit du Scorpion, hostile) : « Ce témoin appartient au Grand Inquisiteur. Si vous le voulez, il faudra nous le prendre. »

Combat `scorpion_scholars_camp` :
- arène : `scorpion_dune_track`, la piste des caravanes, où se tient le camp ;
- ennemis : trois Érudits du Scorpion (`scorpion_scholar`). Eldwin, qui « s’est tenu à l’écart », reste à l'écart ;
- **NOUVEAU**, libellé : « Camp des érudits » ; objectif : « Arrachez le fidèle du Phénix aux érudits du Scorpion. » ;
- récompense : 30 or, réputation 0.

Après la victoire, la scène se rouvre :
- `freed` (Fidèle captif) et `freed2` (Érudit) : texte inchangé. L'érudit passe de « hostile » à « blessé ».
- puis la rencontre d'Eldwin (branche « libéré ») inchangée.

Drapeaux et jugement :
- `scorpionFaithfulFreed` (+1 au jugement) et `scorpionFaithfulAbandoned` (−2) restent, avec l'écho de la cellule du Prophète (« Le fidèle que vous avez arraché aux érudits… »).
- Nouveau fait technique `scorpionScholarsDefeated`.
- Carte `scorpion.consequences.json` : l'option 0 de `scorpion.scholars` mène à ce fait.

## 4. Vérification prévue (N1)

- Tests de navigation : chaque branche de chaque embranchement, combat lancé ou non, scène rouverte après la victoire, rencontre du héros jouée une seule fois et au bon endroit.
- Tests de drapeaux : verdict identique à choix égaux.
- Tests d'échos : `narrative:validate` sans erreur.
- Pilotes de plateau.
- Navigateur, avec un vrai geste, sur les deux branches de chaque embranchement.

## 5. N2 — la trahison rappelle les choix du Lion

Aujourd'hui, `finale_betrayal` (`finaleDialogues.ts`) lit quatre faits de plateau dans la réplique `advice`. Proposition : une réplique **NOUVELLE** `boisclair` de Maelor, entre `reveal` et `advice`, qui ne paraît que si le Lion a suivi son conseil :
- `missionGreed` : la porte basse et les coffres, quand Maelor disait « la porte basse, c’est notre bourse » ;
- `silencedWitnesses` : les témoins réduits au silence, quand il disait « Il n’y a plus de silence à acheter. Il faudra désormais l’imposer. »

Mots exacts selon les faits :
- les deux : « Tout a commencé à Bois-Clair. Je vous ai dit que la porte basse était notre bourse, et vous avez emporté les coffres. Puis, quand les survivants ont voulu parler, vous leur avez imposé le silence. »
- `missionGreed` seul : « Tout a commencé à Bois-Clair. Je vous ai dit que la porte basse était notre bourse, et vous avez emporté les coffres pendant que les captifs partaient au nord. »
- `silencedWitnesses` seul : « Tout a commencé à Bois-Clair. Quand les survivants ont voulu parler, il n’y avait plus de silence à acheter : vous leur avez imposé le silence. »
- aucun des deux : pas de réplique, et la scène reste celle d'aujourd'hui.

**MODIFIÉ**, une seule variante de `advice`. Quand la réplique de Bois-Clair paraît mais qu'aucun conseil de plateau ni aucune humiliation d'arène n'a été suivi, le texte actuel « Vous ne m’avez jamais écouté. Peu importe : il me suffisait d’entrer avec vous dans cette arène. » la contredirait. Il devient : « Depuis, vous ne m’avez plus écouté. Peu importe : il me suffisait d’entrer avec vous dans cette arène. » Toutes les autres variantes de `advice` restent.

Échos : deux échos `final_act` dans `lion.consequences.json`.
- `missionGreed` → `finale_betrayal:boisclair`, phrase-cause « vous avez emporté les coffres ».
- `silencedWitnesses` → la même étape, phrase-cause « vous leur avez imposé le silence ».

Alternative : ajouter seulement deux éléments à la liste des conseils de `advice` (« les coffres de Bois-Clair emportés pour le clan », « les témoins de Bois-Clair réduits au silence »), sans réplique propre. Plus court, mais Bois-Clair s'y noie parmi les plateaux.

## 6. N3 — le sort de Maelor dans les épilogues

Aujourd'hui, seul `finale_breach_aftermath` dit « Maelor est tombé le premier. Il n’a rien dit de plus. » Les épilogues ne le nomment pas. Proposition : une réplique **NOUVELLE** `maelor` de Kestrel, celle qui l'a vu tomber. Elle se place dans chacun des trois épilogues, juste après le rappel des Sceaux. Sa première phrase est commune ; sa fin dit comment les clans regardent la compagnie à travers son traître, et varie donc selon la fin.

- Respect (`finale_epilogue_respect`) : « Maelor n’est pas ressorti de la brèche. Elle s’est refermée sur lui, et les clans ne retiendront de lui qu’un nom qu’on ne prononce plus. »
- Équilibre (`finale_epilogue_balance`) : « Maelor n’est pas ressorti de la brèche. Elle s’est refermée sur lui, mais certains clans se demandent encore combien de ses conseils nous avons suivis. »
- Crainte (`finale_epilogue_fear`) : « Maelor n’est pas ressorti de la brèche. Elle s’est refermée sur lui. Pour les clans, il était des nôtres jusqu’au bout, et c’est aussi pour cela qu’ils nous craignent. »

Alternative : la seule première phrase, la même dans les trois fins : « Maelor n’est pas ressorti de la brèche. Elle s’est refermée sur lui. »

La réplique ne dépend d'aucun choix : elle ne pose ni ne lit de drapeau. L'humeur de chaque épilogue reste la sienne.

## 7. N5 — trame des crédits (sans aucun nom ni rôle)

Rien n'est écrit dans `src/ui/credits.ts`. L'opérateur fournira le texte final, mot à mot. Trame proposée, une rubrique par groupe, une ligne vide entre les groupes (le format de `CREDITS_LINES`) :

1. Titre du jeu.
2. Conception, récit et direction.
3. Écriture des dialogues.
4. Images : personnages, tableaux, cartes.
5. Musique et sons.
6. Programmation et outils.
7. Outils de création employés (assistance, génération d'images, musique codée).
8. Essais et retours.
9. Remerciements.
10. Mot de fin.

Variante courte : 1, 2, 4, 5, 6, 9 et 10.

## 8. Relecture du gardien des contrats (2026-11-13)

Le sous-agent `contracts-guardian` a relu ce plan avant toute implémentation.
- Garde vide, `contracts:validate` vert. Aucun conflit bloquant avec le set 1.23.0, aucun amendement nécessaire.
- La scène rouverte est un builder pur. Il lit un fait posé par le chemin de vérité existant (`combatVictoryFacts`, `GameApp.resolveCombat`). La sauvegarde V6 ne change pas (`flags` est un enregistrement de booléens).
- La réputation des combats est 0 : les bornes ne bougent pas. Le jugement et la règle « deux boss sur la voie d'honneur, un sur celle de force » sont intacts.

Réserves prises en compte dans ce brouillon :
- la réplique `escort` ne dit plus ce que le minerai vaut pour le Corbeau ;
- `extorted_night` ne promet plus un retour du Loup qu'aucun mécanisme ne porte ;
- la variante « silence seul » de N2 ne prête plus à Maelor un conseil qu'il n'a pas donné (en 3b, il constate, il ne conseille pas).

Conditions retenues pour l'implémentation :
- un test « fait de victoire absent : scène avec choix ; présent : version d'après sans choix ni combat » ;
- un test d'égalité des verdicts à choix égaux ;
- les trois faits de victoire déclarés `system` et jamais lus par le jugement ;
- l'adaptation de `heroMeetings.test.ts` ;
- les ids de dialogue, de nœud et de scène inchangés, sans nouvelle clé d'humeur ;
- le contrôle de l'économie avec l'or ajouté.

## 9. Validations de l'opérateur (2026-11-13)

L'opérateur a répondu question par question, dans la session de récit, avec les répliques exactes de ce brouillon sous les yeux (après les réserves du gardien).
- N1, Ours (convoi, combat sur « Saisir le minerai pour le clan ») : « Valider tel quel ».
- N1, Dragon (hameau, combat sur « Monter la garde et repousser le prochain raid », avec la réplique d'esquive) : « Valider tel quel ».
- N1, Scorpion (érudits, combat contre trois érudits sur « Libérer le fidèle du Phénix ») : « Valider tel quel ».
- N2, trahison : « Réplique Bois-Clair », les trois variantes et la retouche de repli de `advice`.
- N3, clôture : « Varie selon la fin », les trois répliques ci-dessus.
- N5, crédits : « Trame complète », dix rubriques. Rien n'est écrit dans `src/ui/credits.ts` : le texte final viendra de l'opérateur, mot à mot.

Statut : N1, N2 et N3 sont validés mot à mot et implémentés dans le jeu. N5 reste une trame.
