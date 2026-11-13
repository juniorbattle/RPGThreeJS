# Moments animés de l’après-démo et rotation des héros — décisions de l’opérateur (2026-11-13)

Statut : `CURRENT FACT`. Deux décisions prises dans la session « Moments animés des plateaux », livrées et poussées sur `dev`. Le brouillon validé est `docs/content/drafts/PLATEAU_MOMENTS_DRAFT_2026-11-13.md` ; le rapport de livraison, `docs/reports/plateau-moments-2026-11-13.md`.

## OD-2026-11-13-B — Moments animés de l’après-démo

Après l’intégration de l’acte final, l’opérateur a demandé que les moments animés soient traités proprement sur tous les plateaux : « cela concerne tous les chapitres/plateaux concernant les moments animés ».

- **Brouillon validé tel quel** (« Valider tel quel »). Chaque question prend sa recommandation :
  - 1 A : les tables de l’Ours, du Dragon et du Scorpion telles qu’écrites. À l’arrivée, le chef attend devant son siège. À l’issue d’honneur, la compagnie se tient sur les lieux de la traque. À l’issue de force, le chef vaincu se tient devant ses portes ;
  - 2 A : la trahison au Tournoi tenue au contrat. Elle joue sur l’arène de la finale et s’arrête sur la rafale, avant que Maelor s’avance ;
  - 3 A : les trois épilogues tenus au contrat. Ils partagent une aube sur la capitale, la brèche encore ouverte, et s’arrêtent avant qu’elle se referme ;
  - 4 A : une maquette d’abord, l’arrivée chez Borin ;
  - 5 A : les dialogues qui suivent une séquence prennent l’humeur de leur pendant du Lion (`POST_DEMO_SCENE_MOODS`) ;
  - 6 A : les tableaux passent à « approuvé » avec le code qui les lit.
- **Maquette jugée** : « Elle convainc ». Les douze autres séquences ont suivi.
- **Livré** (commits `5bec4fe2`, puis `545d5ade`) :
  - treize tableaux vivants, trois par plateau et quatre pour l’acte final, chacun sur son tableau peint approuvé (`tableau: 'approved'`) ;
  - treize fonds animés pour les dialogues qui les entourent ;
  - une rangée « Tableaux vivants de l’après-démo » dans le labo QA (`/?qa=1`).
- **Comportement** :
  - une séquence joue à la première ouverture en direct, jamais après une reprise ;
  - sans image, le jeu passe droit au dialogue.
- **Cadre** : set 1.20.0, « Post-demo moments » (OD-2026-11-07-I), avec les règles des tableaux vivants des sets 1.13.0 et 1.14.0. Ni légende, ni texte nouveau, ni choix dans une séquence. Aucun son nouveau, aucun champ de sauvegarde, aucune vérité de jeu.
- **Vérifié** :
  - dans le labo QA, les treize séquences jouent jusqu’au bout sans erreur : avec les réglages par défaut, avec le mouvement réduit du jeu, et avec `reducedMotion: 'reduce'` émulé, où le mouvement est gardé comme prévu ;
  - portail des contrats vide, contrats, validateur narratif, types, `qa-job` (26/26), build et `git diff --check` verts. Vitest : 3 393 tests réussis, plus les 10 échecs connus des médias absents d’un worktree neuf.
- **Non vérifié** :
  - le son et le rendu sur le poste de l’opérateur ;
  - un vrai parcours jusqu’à chaque moment, dont les déclencheurs sont couverts par les tests ;
  - le mobile.

  Les taches d’encre peintes des issues d’honneur ne sont pas animées.

## OD-2026-11-13-C — Rotation des héros

Pendant la même session, l’opérateur a ajouté une règle : à chaque plateau, un héros du clan accompagne les conseillers aux rencontres décisives avec le chef, à tour de rôle, comme Alistair au Lion.

- **Choix de l’opérateur** :
  - Ours : Marian ;
  - Dragon : Elara ;
  - Scorpion : Kestrel ;
  - acte final : toute la compagnie, Alistair compris.
- **Portée** : les rencontres avec le chef. Le héros du plateau prend quatre répliques d’Alistair, au mot près :
  - la première de l’arrivée ;
  - l’audience ;
  - « Nous l’assumerons » avant l’épreuve ;
  - la première de la veillée.

  Il entre aussi dans les tableaux vivants de son plateau.
- **Ce qui ne change pas** : le texte. Alistair garde les décisions de la route.
- **Livré** : commit `b88e31cf`, présentation seule.
