# Tableaux vivants aux moments clés — OD-2026-11-04-A

**APPROVED DECISION (choix) ; amendement en attente d'approbation.** Le 2026-11-04, l'opérateur a rempli la [fiche d'arbitrages des tableaux vivants](https://claude.ai/artifact/BYnM5CGndEWtVVSYwBD1nk), issue de la [proposition d'amendement](LIVING_TABLEAUX_AMENDMENT_PROPOSAL_2026-11-04.md). Ces choix fixent le contenu de l'amendement 1.13.0. Ils ne modifient aucun contrat par eux-mêmes : le texte réécrit selon ces choix doit être relu sur son diff réel, puis approuvé par l'opérateur, avant le commit de l'amendement et la nouvelle baseline.

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

## Question ouverte

Le même jour, l'opérateur ajoute : « si tu penses que ces tableaux vivants sont trop compliqués et demandant on peut annuler ». Le diff d'amendement n'est pas encore rédigé : il attend sa réponse à l'évaluation de Claude (continuer avec la maquette comme point d'arrêt, ou annuler).

## Ce qui ne change pas

Zéro vidéo active, aucune image générée ni illustration nouvelle, aucune vidéo ni image clé générée, pas de MiniMax. Les huit identités historiques et toutes les archives restent. Ni choix, ni issue, ni récompense, ni sauvegarde V6 ne changent. Les quatre acteurs visibles, le sommet d'Alaric, le mouvement réduit, le clavier et le focus restent tenus. Le scheduler reste en pause.
