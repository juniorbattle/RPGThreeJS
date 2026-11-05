# Passe narrative et feuille de route — OD-2026-11-04-C

**APPROVED DECISION.** Le 2026-11-04, l'opérateur a rempli la [fiche d'arbitrages](https://claude.ai/artifact/Ccau834x8vs3PMrpJB82q5). Ses quinze choix suivent les recommandations, sans note. Les corrections retenues s'appliquent avant le playtest PC (D1). Chaque texte nouveau ou réécrit est d'abord soumis à l'opérateur ; aucun n'entre dans le jeu avant son accord.

## Demande

Le 2026-11-04, l'opérateur demande si « tous nos dialogues sont bien structurés et cohérents ». Il transmet aussi sa feuille de route de la trame narrative complète, versée au projet sous `docs/content/feuille_de_route_narrative_condensee.md.pdf`.

L'audit des 75 dialogues n'a relevé aucun défaut de structure :
- aucun lien rompu ;
- aucun acteur inconnu ;
- aucune étape inatteignable hors des deux déjà documentées (`lion_finale_judgement:1` et `pre_lion_chief:4`) ;
- aucun caractère corrompu.

Les écarts relevés sont de cohérence et de rapport à la feuille de route. La fiche les a rassemblés.

## Choix de l'opérateur

| Id | Sujet | Choix |
| --- | --- | --- |
| A1 | Statut de la feuille de route | Référence, les faits de la démo priment |
| A2 | Nombre de Sceaux | Quatre Sceaux, la démo ne change pas |
| B1 | Le Fou, futur traître | Maelor, rien ne change dans la démo |
| B2 | Le Voyageur mystérieux | Après la démo |
| B3 | Écarts de boss du Lion | Garder la démo telle quelle |
| B4 | Autres clans et démons | Garder le mystère |
| C1 | Porte basse de Bois-Clair | Réécrire le choix, garder la mécanique |
| C2 | Rapport Serpent et « Valmir » | Corriger et retirer « Valmir » |
| C3 | Promesses sans suite | Écho pour les noms, l'émissaire plus tard |
| C4 | Le dragon décrit sa scène | Donner la description à Kestrel |
| C5 | Le Champion parle d'« étrangers » | Reformuler |
| C6 | Neuf petites corrections | Tout corriger |
| C7 | Deux autels au même dilemme | Garder les deux |
| C8 | Quatre anciens dialogues jamais montrés | Les laisser |
| D1 | Calendrier | Maintenant, avant le playtest |

## Conséquences

**Feuille de route (A1, A2, B1 à B4).** La feuille de route devient la référence de direction pour tout le jeu. Là où elle diffère des faits établis dans la démo, la démo prime. Elle est consignée en PDF et en [transcription Markdown](../content/feuille_de_route_narrative_condensee.md), précédée de ce statut et de ses écarts connus.
- **Sceaux.** Le jeu en compte quatre. Le plateau de Sceau à retirer parmi l'Ours, le Dragon, le Scorpion et le Phénix sera choisi plus tard.
- **Le Fou.** Maelor tiendra ce rôle sans qu'un mot de la démo change. Sa réplique sur les Sceaux « leviers » prépare le retournement.
- **Le Voyageur mystérieux.** Il apparaîtra après la démo.
- **Boss du Lion.** La défense de Bois-Clair tient le rôle du premier boss de la voie de l'honneur. Le Champion reste le boss de la voie de la force.
- **Monde.** La démo ne nomme ni les autres clans ni les démons.
- **Aucun effet sur le jeu actuel.** Aucune de ces décisions ne change le code ou les textes de la démo. Le gel des contenus, systèmes et portraits nouveaux reste en vigueur.

**Corrections de la démo (C1 à C6).**
- **C1, porte basse.** La mécanique reste : avidité, 200 or, réputation −10, manquement décisif et épreuve imposée. L'étiquette du choix et la plaidoirie de Maelor disent désormais ce que le jeu fait : emporter les coffres pour le clan.
- **C2, rapport Serpent.** La réplique de l'Oracle colle au combat de la route de Bois-Clair. L'échoppe et la forge sont dites « du refuge ».
- **C3, promesses.** Le jugement fait écho à la liste des morts de Bois-Clair quand elle a été portée. L'émissaire attend la suite du jeu.
- **C4, nid du dragon.** Kestrel dit la description du nid.
- **C5, Champion.** Sa réplique sur les « étrangers » est reformulée.
- **C6, petites corrections.** Les neuf corrections de texte sont appliquées.

C7 et C8 ne changent rien. Les textes exacts sont soumis à l'opérateur avant d'être appliqués (section suivante).

## Textes soumis à l'opérateur

État : **PROPOSED**, en attente de son accord ([fiche des textes](https://claude.ai/artifact/J51tHdeRvRhJPZMdwgFFhN)). Les identifiants renvoient aux dialogues de `src/game/content.ts`, `src/game/campaignGrammarContent.ts` et `src/game/lionFinale.ts`. Les lignes marquées « extension » vont un peu au-delà de la recommandation de la fiche, pour que la scène reste cohérente ; l'opérateur peut les refuser seules.

| Id | Décision | Où | Avant | Après |
| --- | --- | --- | --- | --- |
| T1 | C1 | `village_choice:5`, second choix | Prendre la porte basse et sécuriser réserves et puits. | Prendre la porte basse et emporter les coffres pour le clan. |
| T2 | C1 | `village_choice:4`, Maelor (étiquette « Survie » → « Intérêt du clan ») | Et si nous perdons le grain, les remèdes et l’eau, les survivants que nous tirerons du pont reviendront vers un village incapable de les nourrir. Tenir la porte basse n’est pas sauver notre bourse ; c’est choisir le lendemain au prix de ceux qui partent ce soir. | Je ne vais pas l’habiller autrement : la porte basse, c’est notre bourse. Les coffres du village partent par là. Si nous les reprenons aux Serpents, ils serviront au clan : avec cet or, nous tenons jusqu’au Sceau. Sans lui, nous arriverons devant Alaric en mendiants. |
| T3 | C1, extension | `village_choice:4a`, Alistair | Voilà le piège des Serpents : les deux décisions peuvent se défendre, aucune ne sauvera tout le monde. Donnez l’ordre. (suite inchangée) | Voilà le piège des Serpents : des vies d’un côté, de l’or de l’autre, et pas assez de lames pour les deux. Donnez l’ordre. (suite inchangée) |
| T4 | C1, extension | jugement, issue « porte basse », Alaric | À Bois-Clair, vous avez tenu la porte basse pendant que les captifs partaient vers le nord. Les réserves ont survécu à cette décision. Ceux qui sont partis avec les Serpents aussi. | À Bois-Clair, vous avez pris la porte basse et ses coffres pendant que les captifs partaient vers le nord. Votre bourse a survécu à cette décision. Ceux qui sont partis avec les Serpents aussi. |
| T5 | C2 | `ate_serpent_general_warning:1`, Oracle | Général. La compagnie a franchi le barrage de Valmir. Nos pillards n’ont pas tenu une charge. Ils se battent en formation — pas comme des bandits. | Général. Les bêtes que nous avions rabattues sur la chaussée n’ont pas suffi. La compagnie a forcé la route de Bois-Clair en formation — pas comme des bandits. |
| T6 | C2 | échoppe et forge (`src/ui/ManagementView.ts`) | Échoppe de Valmir ; Forge de Valmir | Échoppe du refuge ; Forge du refuge |
| T7 | C3 | jugement, après l'issue de Bois-Clair, Alaric, si la liste des noms a été portée | (rien) | Vous avez aussi porté la liste des morts de Bois-Clair. Elle sera lue dans cette salle, nom par nom, comme des personnes et non comme un argument : elle ne pèse pas dans ce jugement. |
| T8 | C4 | `mystery_dragon_roost:1` | orateur : Jeune dragon (portrait du dragon, hostile) | orateur : Kestrel (portrait de Kestrel, grave) ; texte inchangé sauf T17 |
| T9 | C5 | `ate_lion_council_doubt:1`, Champion | Des étrangers qui se disent envoyés par le clan déchu. Et on devrait les croire ? (suite inchangée) | Les restes du clan déchu. Et on devrait les croire ? (suite inchangée) |
| T10 | C6 | `pre_serpent_patrol:1`, Kestrel | Trois Serpents fouillent la route… | Deux Serpents fouillent la route… |
| T11 | C6 | `pre_serpent_duelist_trial:2`, duelliste | Une lame. Un adversaire. Pas de tactique, pas de retraite. Si vous survivez, la route est à vous. | Venez tous, si vous voulez : ma lame suffira pour votre compagnie. Pas de retraite. Si vous survivez, la route est à vous. |
| T12 | C6 | `final_refuge:3`, Maelor | Notre renommée nous a précédés, mais Alaric a autre chose : les registres de Bois-Clair, les récits de la route, les voix qui ont choisi de parler et ce que nous portons des Ombres. Un nom ouvre une audience. Il ne réécrit pas ces traces. | réplique retirée ; Maelor garde la première, Séraphine enchaîne sur Marian |
| T13 | C6 | `ate_bois_clair_night_watch:2`, Marian | …ceux qui devront vivre avec ce matin. | …ceux qui devront vivre avec cette nuit. |
| T14 | C6 | `village_choice:6b`, Maelor | Pour l’instant, je tiens la porte avec vous. | Pour l’instant, je tiens la ligne avec vous. |
| T15 | C6 | `pre_village_defense:1`, pillard | Le village brûle déjà. Ceux qui prennent les armes meurent les premiers. | Le pont est tenu. Les captifs passeront de l’autre côté avant que vous ne l’atteigniez. |
| T16 | C6 | `pre_village_raid:2`, brute | Le Lion n’est pas là. Personne ne vient pour Bois-Clair. Prenez ce que vous voulez, et frappez ceux qui regardent. | Ces coffres sont à nous. Vous voulez votre part ? Venez la prendre. |
| T17 | C6 | `mystery_dragon_roost:1` | Au-dessus du vieux sanctuaire, un jeune dragon… | Au-dessus des ruines, un jeune dragon… |
| T18 | C6 | `serpent_informant:1` | orateur : Oracle Serpent | orateur : Oracle déserteur |
| T19 | C6 | `first_refuge_gathering`, trois répliques | Alistair : Nous sommes arrivés. Rassemblons-nous à l’abri ; la route nous a assez dispersés pour aujourd’hui. / Maelor : Ce que nous avons rapporté est en sûreté. Prenons le temps de compter nos réserves et de regarder qui a besoin de repos. / Alistair : Ce refuge nous donne un peu de répit. Soignons les blessés et préparons la suite ensemble. | Alistair (« Refuge du Lion ») : Des palissades, des feux et des voyageurs à l’abri. Pour la première fois depuis l’audience, personne ne nous guette depuis les talus. Rassemblons-nous ; ce répit ne durera pas. / Intendant Maelor (« Comptes du soir ») : J’ai mis à l’abri ce que nous avons rapporté de la route. Comptons nos réserves ce soir : à Bois-Clair, personne n’aura le temps de compter. / Alistair (« Avant Bois-Clair ») : Soignez les blessés et faites reprendre les lames. Bois-Clair brûle encore ; demain, il faudra marcher vite. |

## Limites

- Aucun contrat n'est modifié ; la baseline 85576d6d reste en vigueur.
- Aucun portrait, aucun combat et aucun sprite nouveau n'est créé.
- Aucune mécanique ne change : drapeaux, or, réputation, combats et verdict restent identiques.
- Le changement d'orateur (T8) et le retrait d'une réplique (T12) changent la forme de deux dialogues. Leurs plans de présentation sont ajustés par une surcharge écrite à la main dans `src/cinematics/NarrativePresentationPlans.ts`, comme pour la confrontation Serpent. Les plans générés historiques restent intacts.
