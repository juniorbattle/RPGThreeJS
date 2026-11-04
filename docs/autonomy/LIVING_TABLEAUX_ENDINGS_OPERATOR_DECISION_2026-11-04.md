# Tableaux vivants de l'audience et des fins — OD-2026-11-04-B

**APPROVED DECISION.** Le 2026-11-04, l'opérateur a rempli la [fiche d'arbitrages](https://claude.ai/artifact/Hh6x3k5BZh3WjyR9HVXEJm) : ses huit choix suivent les recommandations, et il approuve le texte de l'amendement 1.14.0 / `PRODUCTION-CONTRACTS-LIVING-TABLEAUX-2` tel quel (D1). Les contrats portent ce texte ; la baseline immuable est fixée par le commit opérationnel qui suit celui de l'amendement.

## Demande

Le 2026-11-04, après la livraison des quatre tableaux vivants de [OD-2026-11-04-A](LIVING_TABLEAUX_OPERATOR_DECISION_2026-11-04.md), l'opérateur répond « Oui » à la question « Je prépare l'amendement pour ajouter l'audience d'Alaric ? », et ajoute : « je pense que les événements de fin peuvent être intéressants à travailler afin d'animer nos events majeurs jusqu'au bout ».

## Choix de l'opérateur

| Id | Sujet | Choix |
| --- | --- | --- |
| A1 | Moments | L'audience et les deux fins de route |
| A2 | Durée | 30 s pour l'audience, 40 s pour les fins |
| A3 | Fond animé | `lion_briefing`, les deux dialogues d'après-combat et l'épilogue |
| B1 | Audience | Alaric debout devant le trône, la compagnie entre, quelques gardes lointains en silhouette |
| B2 | Fin Serpent | La compagnie immobile, la caméra remonte vers la lune |
| B3 | Fin de l'épreuve | Alaric sur les marches, Alistair, Séraphine et Maelor sur la mosaïque |
| C1 | Méthode | Les trois ensemble, jugées dans le labo QA |
| D1 | Amendement | J'approuve le texte tel quel |

Aucune note n'accompagne ces choix. Le tableau des moments et les plans ci-dessous, tels que corrigés après la relecture, sont donc approuvés.

## Pourquoi un amendement

Le set 1.13.0 liste les moments de façon exhaustive : Bois-Clair (arrivée, sauvé, sacrifié) et le jugement. Ajouter un moment demande donc un amendement. La méthode, le lecteur commun, le fond animé et les règles (aucune légende, aucun canon nouveau, quatre acteurs, figurants bornés, première ouverture en direct seulement, humeur du dialogue suivant) sont déjà approuvés et livrés : l'amendement ajoute surtout des moments à la liste.

## Moments proposés

Sur les huit identités historiques, quatre sont déjà vivantes. L'audience et les deux fins de route en ajoutent trois. La huitième, `camp_departure`, n'est pas proposée : la séquence d'ouverture de OD-2026-11-02-A porte déjà le départ du camp. `serpent_general_reveal` n'est pas une identité historique et appartient au combat (entrée du boss) : non proposé.

| Moment | Place exacte | Tableau peint existant | Établi à ce point | Dit ensuite, à ne pas montrer d'avance |
| --- | --- | --- | --- | --- |
| `alaric_audience_arrival` | avant `lion_briefing` (nœud `lion-audience`), par le déclencheur existant | `alaric-audience-tableau.png` : salle du trône de jour, vitraux, bannières, tapis rouge, deux lions de pierre | le clan vaincu, sa bannière recousue, quatre combattants ; la compagnie quitte le camp pour l'audience (`camp_departure`) | Bois-Clair qui brûle, la mission, le Sceau, l'avance réclamée |
| `serpent_route_ending` | après une victoire `serpent_captain` qui achève la poursuite, après `serpent_general_aftermath`, avant `epilogue`, par le déclencheur existant | `serpent-finale-tableau-aftermath.png` : ruines de nuit sous la lune, bannière Serpent déchirée, braseros, brume sur la vallée | le général vaincu, l'artefact récupéré marqué des Ombres, la preuve confiée à Alaric ou tue (choix déjà résolu) | le Sceau tenu en main, les éclaireurs du Lion ou le secret gardé, « le premier Sceau est acquis » |
| `lion_trial_route_ending` | après une victoire `lion_chief` qui achève l'épreuve, après `lion_trial_aftermath`, avant `epilogue`, par le déclencheur existant | `lion-trial-tableau-aftermath.png` : terrasse au couchant, mosaïque du lion, lions de pierre, bannières étoilées | le champion vaincu, le Sceau gagné selon la loi martiale, Alaric accepte, le général Serpent en fuite | le Sceau tenu en main, l'alliance prudente ou le secret, « le premier Sceau est acquis » |

Les deux fins prennent la place du moment statique de la Journey qui joue aujourd'hui entre le dialogue d'après-combat et l'épilogue, comme les issues de Bois-Clair. Ce moment statique reste le repli si la séquence ne peut pas s'afficher.

## Plans proposés

**Audience, 26 s environ.**
- Plan 1, 10 s. La salle vide : rais de lumière par les vitraux, bougies et braseros qui vacillent, bannières qui bougent à peine. La caméra glisse le long du tapis vers le trône.
- Plan 2, 16 s. Alaric attend debout devant le trône, en haut des marches. Alistair, Séraphine et Maelor entrent depuis le spectateur sur le tapis rouge et s'arrêtent au pied des marches. Quelques gardes immobiles, lointains et sans lumière, en silhouette de part et d'autre (figurants). Aucun dialogue ne les établit : ce sont des figurants de décor, bornés, et l'option « sans gardes » reste ouverte. La séquence finit avant qu'Alaric parle.

**Fin de la poursuite Serpent, 32 s environ.**
- Plan 1, 12 s. La lune passe derrière les nuages, la brume monte de la vallée et de la cascade, les braseros rougeoient, la bannière Serpent déchirée bat au vent. La caméra descend lentement de la lune vers l'esplanade.
- Plan 2, 20 s. Alistair, Séraphine et Maelor se tiennent sur la mosaïque, immobiles, la bannière Serpent déchirée battant au-dessus d'eux ; la caméra remonte lentement vers la lune. Personne ne quitte l'esplanade : aucune source ne le dit. Aucun artefact visible : dans la branche où la preuve est confiée à Alaric, le montrer dans les mains de Séraphine contredirait le dialogue.

**Fin de l'épreuve du Lion, 32 s environ.**
- Plan 1, 12 s. Le soleil couchant, les nuages qui glissent, la brume des cascades, les braseros et les bannières étoilées qui bougent.
- Plan 2, 20 s. Alistair, Séraphine et Maelor debout sur la mosaïque du lion ; Alaric regarde depuis le haut des marches. Le champion n'apparaît pas : sa défaite est dite, mais un geste (genou à terre, soumission) ne l'est pas. Personne ne remet ni ne tient le Sceau.

**Fond animé.** `lion_briefing` garde la lumière et les flammes de la salle ; `serpent_general_aftermath` et `lion_trial_aftermath`, juste avant leur fin, gardent la lune, la brume ou le couchant de leur tableau ; l'épilogue garde la salle du jugement. En jeu, l'épilogue s'affiche sur `lion-judgement-epilogue-tableau.png` (pack d'environnements de production), octet pour octet la même image que `lion-judgement-tableau.png` : le fond du jugement existe déjà ; `epilogue.webp` n'est que l'ancienne illustration de dialogue. Chaque fond dessine sur le tableau de son propre dialogue, jamais sur la salle à la place des ruines ou de la terrasse. Aucune figure dans les fonds.

**Mouvement réduit, musique, distribution.** Comme le set 1.13.0 : caméra fixe et apparitions en fondu ; humeur du dialogue suivant (`lion_briefing`, puis `epilogue` pour les deux fins) ; quatre acteurs au plus, figurants derrière eux, douze au plus.

## Décisions demandées à l'opérateur

| Id | Sujet | Recommandation | Autres options |
| --- | --- | --- | --- |
| A1 | Moments | L'audience et les deux fins de route | ajouter aussi le feu de camp du dernier refuge ; l'audience seule |
| A2 | Durée | 30 s au plus pour l'audience, 40 s pour les fins | 30 s partout |
| A3 | Fond animé | `lion_briefing`, les deux dialogues d'après-combat des fins et l'épilogue | seulement `lion_briefing` et l'épilogue |
| B1 | Audience | Alaric debout devant le trône, la compagnie entre sur le tapis, quelques gardes lointains en silhouette | Alaric assis sur le trône ; sans gardes |
| B2 | Fin Serpent | La compagnie immobile sur la mosaïque, la caméra remonte vers la lune, aucun artefact visible | caméra fixe sur l'esplanade |
| B3 | Fin de l'épreuve | Alaric sur les marches, Alistair, Séraphine et Maelor sur la mosaïque, sans le champion | la compagnie seule au couchant ; le champion vaincu à terre au bord de la mosaïque, sans geste |
| C1 | Méthode | Les trois séquences livrées ensemble, jugées dans le laboratoire QA, retouchées sur demande | l'audience d'abord, en maquette |
| D1 | Texte d'amendement | J'approuve le texte relu tel quel, si mes choix suivent les recommandations | réécrire selon mes choix puis me le soumettre |

## Texte d'amendement soumis

Le diff réel est enregistré dans [LIVING_TABLEAUX_AMENDMENT_1.14.0.patch](LIVING_TABLEAUX_AMENDMENT_1.14.0.patch). Il touche PRESENTATION_AND_MEDIA, le README et le manifeste (23 lignes ajoutées, 7 modifiées), ni la constitution ni les autres contrats. Dans PRESENTATION_AND_MEDIA, section *Living tableaux* :

- un paragraphe d'en-tête qui nomme le set 1.14.0 ;
- les trois moments ajoutés à la liste exhaustive ;
- une phrase qui dit qu'une séquence d'issue ou de fin prend la place du moment statique de la Journey (une image de transition, pas un tableau de dialogue), qui reste son repli ; c'est déjà le cas pour Bois-Clair ;
- 40 s pour les deux fins ;
- la règle de canon des trois moments : l'audience finit avant qu'Alaric parle et ne montre ni Bois-Clair ni le Sceau ; une fin joue après la résolution du choix des Ombres, ne montre que les faits établis de sa route, ni le Sceau ni ce que l'épilogue dit en premier ;
- le fond animé permis aussi sur le dialogue d'après-combat juste avant une fin ;
- pas de nouvelle maquette.

Appliqué dans une copie de travail isolée, il passe le validateur de contrats et `git diff --check`.

## Relecture indépendante (2026-11-04)

Relecture `contracts-guardian` du diff réel et de cette proposition : PASS sur le texte du contrat (choix recommandés, règles du set 1.13.0 et de OD-2026-10-24-A tenues, déclencheurs exacts, manifeste et README cohérents, validateur et porte sur `a936cd05`). Corrections reprises avant de soumettre la fiche :

- **Bloquant, fin Serpent.** « La compagnie quitte l'esplanade » n'est dit par aucune source : la compagnie reste immobile.
- **Bloquant, fin de l'épreuve.** « Le champion un genou à terre » ajoute un geste de soumission que le dialogue ne dit pas : le champion n'apparaît pas ; l'option « vaincu, à terre, sans geste » reste au choix.
- **Avertissement, texte.** La phrase sur le moment statique de la Journey précise désormais « a transition still, not a dialogue tableau », pour ne pas contredire « replaces no … tableau ». Le correctif est régénéré et revalidé.
- **Avertissement, audience.** Les gardes ne sont établis par aucun dialogue : figurants lointains, sans lumière, bornés, ou retirés (option B1).
- **Avertissement, fonds.** Vérifier en jeu que chaque fond dessine sur le tableau de son propre dialogue ; l'image de l'épilogue en jeu est vérifiée (section Plans).

## Approbation

Le 2026-11-04, l'opérateur répond « Fiche remplie » ; sur la fiche, D1 vaut « J'approuve le texte tel quel ». Le correctif relu est appliqué tel quel à PRESENTATION_AND_MEDIA, au README et au manifeste (set 1.14.0). Le validateur de contrats passe sur l'arbre amendé.

## Ordre de travail

1. Relecture indépendante du diff réel.
2. Choix et approbation du texte par l'opérateur, sur la fiche d'arbitrages.
3. Commit de l'amendement, puis commit opérationnel de la nouvelle baseline.
4. Les trois séquences et leurs fonds, avant le playtest PC.

## Ce qui ne change pas

Zéro vidéo active, aucune image générée ni illustration nouvelle, pas de MiniMax. Les huit identités historiques et toutes les archives restent. Ni choix, ni issue, ni récompense, ni sauvegarde V6 ne changent. Le sommet d'Alaric, les quatre acteurs, le mouvement réduit, le clavier et le focus restent tenus. Le scheduler reste en pause.
