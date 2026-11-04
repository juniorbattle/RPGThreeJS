# Tableaux vivants aux moments clés — OD-2026-11-04-A

**APPROVED DECISION.** Le 2026-11-04, l'opérateur a rempli la [fiche d'arbitrages des tableaux vivants](https://claude.ai/artifact/BYnM5CGndEWtVVSYwBD1nk), issue de la [proposition d'amendement](LIVING_TABLEAUX_AMENDMENT_PROPOSAL_2026-11-04.md), puis a approuvé le texte de l'amendement dédié 1.13.0 / `PRODUCTION-CONTRACTS-LIVING-TABLEAUX-1` (section Approbation). Les contrats portent désormais ce texte ; la baseline immuable est fixée par le commit opérationnel qui suit celui de l'amendement.

## Choix de l'opérateur

| Id | Sujet | Choix |
| --- | --- | --- |
| A1 | Moments | Arrivée et issue de Bois-Clair, et jugement |
| A2 | Forme | Les deux : séquence, puis fond animé |
| A3 | Durée | 20 à 30 s, jusqu'à 40 s pour le jugement |
| A4 | Calendrier | Avant le playtest PC |
| B1 | Texte | Aucune légende |
| B2 | Figurants | Figurants en décor, hors du compte, définis et bornés |
| B3 | Jugement | Avant qu'Alaric ne parle |
| C1 | Ouverture | L'ouverture garde sa décision, seul le code est partagé |
| C2 | Méthode | Maquette de l'arrivée à Bois-Clair d'abord |
| C3 | Musique | L'humeur du dialogue qui suit |
| D1 | Amendement | Oui, réécrire puis me soumettre le texte |

Aucune note n'accompagne ces choix ; tous suivent la recommandation de la fiche.

## Ce que ces choix fixent

- **Moments.** Quatre séquences : l'arrivée à Bois-Clair (`bois_clair_arrival`, avant `village_choice`), Bois-Clair sauvé (`bois_clair_saved`, après une victoire de `village_defense`, avant `village_defense_aftermath`), Bois-Clair sacrifié (`bois_clair_sacrificed`, après une victoire de `village_raid`, avant `village_raid_aftermath`) et le jugement (`lion_judgement`, avant `lion_finale_judgement`). Un joueur en voit trois par partie.
- **Forme.** Chaque séquence précède le dialogue. Pendant le dialogue, le fond du tableau garde sa lumière, son feu, sa fumée et ses figurants lointains.
- **Durée.** 30 secondes au plus, 40 pour le jugement. Un clic ou Entrée passe au plan suivant ou au dialogue.
- **Canon.** Aucune légende ni phrase nouvelle. Une séquence ne montre que les faits établis à ce point de la route (tableau de la [proposition](LIVING_TABLEAUX_AMENDMENT_PROPOSAL_2026-11-04.md)) et rien de ce que le dialogue suivant dit en premier. Les issues précèdent un choix encore ouvert ; le jugement s'arrête avant qu'Alaric ne parle, Alaric seul, sans le champion.
- **Distribution.** Quatre acteurs du récit au plus. Les figurants sont du décor : sans réplique, sans focus ni relation de regard, derrière les acteurs, douze au plus.
- **Ouverture.** Elle reste régie par OD-2026-11-02-A, avec sa durée et ses légendes approuvées. Seul le code du lecteur est partagé.
- **Musique.** La séquence prend l'humeur de son dialogue par la table existante. Aucune piste ni son nouveau.

## Ordre de travail

1. Texte d'amendement 1.13.0 réécrit selon ces choix, sous forme de diff réel (`LIVING_TABLEAUX_AMENDMENT_1.13.0.patch`), sans toucher `docs/contracts`.
2. Relecture indépendante de ce diff.
3. Approbation du texte par l'opérateur.
4. Commit de l'amendement, puis commit opérationnel de la nouvelle baseline (`AGENTS.md`, skill `contracts-compliance`).
5. Maquette de l'arrivée à Bois-Clair, jugée en mouvement par l'opérateur (C2).
6. Si elle convainc, les trois autres séquences et le fond animé, avant le playtest PC (A4).

## Question ouverte, tranchée

Le même jour, l'opérateur ajoute : « si tu penses que ces tableaux vivants sont trop compliqués et demandant on peut annuler ». Claude juge le chantier faisable : le moteur et les fonds existent, et le vrai coût tient aux allers-retours de retouche et au report du playtest PC. Il recommande de continuer avec la maquette comme point d'arrêt. L'opérateur répond « Oui, continuer » : si la maquette ne convainc pas en mouvement, le chantier s'arrête là.

## Texte d'amendement soumis

Le diff réel est enregistré dans [LIVING_TABLEAUX_AMENDMENT_1.13.0.patch](LIVING_TABLEAUX_AMENDMENT_1.13.0.patch). Il touche la constitution, PRESENTATION_AND_MEDIA, AUTHORING_AND_QA, AUTONOMOUS_WORK_PROTOCOL, le README et le manifeste (39 lignes ajoutées, 5 modifiées). `docs/contracts` n'est pas modifié avant l'approbation. Appliqué dans une copie de travail isolée, il passe le validateur de contrats et `git diff --check`.

Relecture indépendante `contracts-guardian` du diff réel, le 2026-11-04 : PASS sur les onze choix et sur les cinq points bloquants du premier brouillon. Sa seule condition est reprise : la séquence du jugement montre Alaric seul, sans le champion. Deux avertissements n'appellent pas de changement : le commit de l'amendement ne doit pas précéder l'approbation de l'opérateur, et la phrase de la constitution couvre le fond animé de façon large.

## Approbation

Le 2026-11-04, à la question « Tu approuves le texte de l'amendement 1.13.0 ? », l'opérateur répond : « J'approuve ». Le correctif relu est appliqué tel quel à la constitution, à PRESENTATION_AND_MEDIA, AUTHORING_AND_QA et AUTONOMOUS_WORK_PROTOCOL, au README et au manifeste (set 1.13.0). Le validateur de contrats passe sur l'arbre amendé. La suite est la maquette de l'arrivée à Bois-Clair (C2).

## Maquette de l'arrivée à Bois-Clair

`CURRENT FACT` Livrée le 2026-11-04 sur le serveur de développement : `/?qa=1`, QA rencontres, bouton « Tableau vivant · Bois-Clair ». Elle n'est pas branchée au jeu. Le lecteur commun (`src/ui/living/LivingTableauPlayer.ts`) emprunte à l'ouverture ses outils de dessin, sa caméra et son calque ; l'ouverture garde son propre lecteur.

- **Plan 1, 9 s.** Les toits et la colline brûlent ; la caméra descend vers la porte. Quatre pillards sortent de la porte avec leurs torches et traversent la place.
- **Plan 2, 14 s.** La place vue depuis la brèche de la palissade du premier plan. Alistair, Marian et Kestrel entrent par la brèche, depuis le spectateur, et s'arrêtent sur la place, tournés vers la gauche. La villageoise sort de l'ombre du marché, fait quelques pas et s'arrête face à eux. Trois pillards passent au fond.
- **Lumière.** Les personnages sont éclairés de dos par le village en feu, avec leur ombre portée vers le spectateur.
- **Mouvement réduit.** La caméra reste fixe, les personnages apparaissent en fondu à leur place, les pillards ne passent pas ; feu, braises et fumée restent animés.
- **Musique.** L'humeur du dialogue `village_choice`, par la table existante.
- **Ce qu'elle ne montre pas.** Enfants, captifs, coffres, chapelle, puits : le dialogue les dit en premier. Aucune légende.

Vérifications : tests du lecteur et du script (durée, quatre acteurs pris dans la distribution du dialogue, figurants bornés, aucune légende, Passer, Échap, image manquante, mouvement réduit), suite complète, build, validateur de contrats et porte sur `a936cd05`. Captures inspectées en mouvement normal et réduit (`tmp/opening-audit/lv1` à `lv3`, ignoré).

À juger par l'opérateur en mouvement : si la maquette convainc, les trois autres séquences et le fond animé suivent, avant le playtest PC.

## Verdict sur la maquette et livraison

Le 2026-11-04, l'opérateur répond « Elle convainc » à la maquette de l'arrivée. Les trois autres séquences et le fond animé suivent, dans le jeu.

`CURRENT FACT` Livré le 2026-11-04 :

- **Bois-Clair sauvé, 20 s.** Place apaisée au crépuscule, brasero et torches allumés, fumée légère. Alistair et Maelor se tiennent sur la place ; la villageoise fait quelques pas vers eux ; quelques villageois restent à distance ; les derniers Serpents fuient par la porte, entre la palissade tombée et la charrette.
- **Bois-Clair sacrifié, 20 s.** Ruines, braises, petites flammes et fumée lourde. Maelor près de la charrette, la villageoise à l'écart, trois villageois au loin. Personne ne charge ni ne distribue rien.
- **Jugement, 28 s.** Plan 1 : bannières et trône, Alaric attend seul. Plan 2 : la compagnie (Alistair, Séraphine, Maelor) entre depuis le spectateur et s'arrête au pied des marches ; la séquence finit avant qu'Alaric parle.
- **Dans le jeu.** L'arrivée et le jugement jouent quand le moment s'ouvre en direct (`resolveRunNode` hors reprise), avant leur dialogue ; les issues jouent après la victoire, par le déclencheur existant, avant leur dialogue d'après-combat, à la place du moment statique de la Journey. Une reprise ou une revisite résolue ouvre le dialogue directement. Aucun champ de sauvegarde.
- **Fond animé.** Les quatre dialogues (`village_choice`, `village_defense_aftermath`, `village_raid_aftermath`, `lion_finale_judgement`) montrent les mêmes tableaux que leurs séquences : leur décor garde lumière, feu, fumée et braises, dessinés dans le calque du décor pour en suivre le cadrage, le filtre et la respiration. Aucune figure.
- **Laboratoire QA.** Un bouton par séquence (`/?qa=1`, QA rencontres).

Vérifications : tests du lecteur, des scripts (durées, distributions, figurants bornés, aucune légende) et du branchement (première ouverture, reprise sans séquence, issues après victoire seulement, rien après une défaite), suite complète, build, contrats et porte. Parcours réel : arrivée jouée en 24 s puis dialogue sur son fond animé ; Échap passe ; reprise après rechargement sans séquence. Captures des quatre séquences inspectées. Non vu : temps réel avec le son sur le poste de l'opérateur.

## Ce qui ne change pas

Zéro vidéo active, aucune image générée ni illustration nouvelle, aucune vidéo ni image clé générée, pas de MiniMax. Les huit identités historiques et toutes les archives restent. Ni choix, ni issue, ni récompense, ni sauvegarde V6 ne changent. Les quatre acteurs visibles, le sommet d'Alaric, le mouvement réduit, le clavier et le focus restent tenus. Le scheduler reste en pause.
