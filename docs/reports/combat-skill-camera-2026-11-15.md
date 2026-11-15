# Focus caméra gradué pendant les actions de combat (2026-11-15)

| Champ | Valeur |
| --- | --- |
| TASK | Focus caméra gradué des actions de combat (run `claude-combat-skill-camera-20261115T1738Z`, identifiant réservé OD-2026-11-15-B, non consigné dans le registre) |
| DOMAIN | Combat, présentation (caméra d'action de l'arène) |
| BASELINE | `901ba350` sur `dev`, rebasé sur `9bc10292` (contrats 1.24.0, baseline `133814bac45cc31c8eda7aa0fa1acb16a9ca7e35`) |
| BRANCH | `claude/combat-skill-camera-ce2e06`, publié sur `dev` |
| HEAD | le commit de ce rapport ; code en `e425eb65` |
| STATUS | merged |
| MERGED_IN | `dev` |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Caméra et lumière pendant les actions de combat seulement (`src/combat/camera/`, `presentActionEnter`/`presentActionExit`). Aucun changement de dégâts, PA, statuts, issue, sauvegarde ni des messages `level` de la musique. |
| CANONICAL_DOCS_UPDATED | NONE (l'état et la priorité reviennent à la session principale) |
| EVIDENCE | Pilotes Playwright sans fenêtre, ignorés : `tmp/camera-focus/drive.mjs` (horloge simulée à 60 i/s, avant/après) et `tmp/camera-focus/lab.mjs` (labo `/?qa=1`). Captures copiées dans le dossier de notes partagé (`combat-skill-camera-captures/`). |

## Ce qui existait (mesuré)

`CURRENT FACT` avant ce changement :
- attaques, compétences ordinaires, compétences d'élite et de boss, Furie : toutes le même rapprochement (`action`, 0,32 s, retour 0,45 s) ;
- les 12 Ultimes et les 8 signatures : le projecteur (arène assombrie, bandeaux, titre, caméra basse, coup sur l'impact) ;
- en mouvement réduit, la caméra bougeait quand même pour toutes les actions (0,2 s ; 0,3 s pour le projecteur), et la petite respiration de la caméra continuait.
- **Ultimes des héros** : toujours fermés en campagne (`isUltimateUnlockedForHero` renvoie `false`). Seul le labo QA (« Toutes compétences ») les ouvre.
- Défaut latent non corrigé : le renfort de vignette du projecteur écrit dans `Grade.uniforms`, que le `ShaderPass` a cloné ; il ne s'affiche donc jamais. Le corriger changerait le look accepté du projecteur : décision de l'opérateur.

## Ce qui change

| Niveau | Actions | Caméra | Lumière |
| --- | --- | --- | --- |
| basic | attaques de base (y compris d'élite et de boss), objets | inchangée | inchangée |
| skill | compétences ordinaires des héros et ennemis (et soutiens de clan) | un peu plus près (0,68–0,84 de la distance), entrée 0,55 s et retour 0,5 s en sinus | inchangée |
| marked | compétences des élites et des boss, Furie | plus près et plus bas (0,58–0,74), entrée 0,65 s, retour 0,55 s | bords assombris (vignette 1,4), arène à 0,8 |
| spotlight | Ultimes des héros, signatures (quel que soit le lanceur) | inchangé | inchangé |

L'action démarre toujours après 0,32 s ; la caméra continue de glisser pendant le geste. Mouvement réduit (réglage du jeu, set 1.22.0) : la caméra ne bouge plus du tout, respiration comprise ; mêmes temps qu'avant ; seuls la lumière du focus marqué et le décor du projecteur restent. Note : la consigne disait que la réduction de l'OS devait aussi compter ; le contrat UI en vigueur (set 1.22.0) dit l'inverse, et c'est lui qui est suivi.

## Vérifications

- Durée de l'action entière, défaut (avant → après) : attaque 1593 → 1595 ms ; compétence 1871 → 1893 ; zone 1995 → 2022 ; compétence d'élite 1846 → 1922 ; compétence de boss 2058 → 2139 ; Furie 1907 → 1986 ; Ultime et signature identiques. Premier résultat affiché jamais plus tard.
- Réduit : aucune caméra ne bouge (distance fixe à 16,2) ; durées égales ou plus courtes qu'avant.
- Réduction de l'OS émulée seule : le mouvement reste, comme le veut le contrat.
- Labo `/?qa=1`, « Toutes compétences » + « AP plein », combats `serpent_captain` (Ultime du Lion, signature, Furie, Maléfice du boss) et `bear_corrupted_beast` (compétence d'élite, signature d'élite, compétence de héros), en défaut puis avec le réglage réduit stocké comme Réglages : niveaux attendus, 57–60 i/s, aucune erreur console ni requête en échec.
- Images/s avant/après en passes alternées : 55–60 des deux côtés.
- Tests ciblés 92/92 ; `npm test` : 3601 réussis, 5 ignorés, les 5 échecs hérités de `tools/cinematics` ; `node:test` 26/26 ; `tsc`, build, `contracts:validate`, `git diff --check`, garde des contrats vide.

## Ce qui n'est pas vérifié

- Pas de test sur le navigateur ou le GPU de l'opérateur ; acceptation artistique en jeu par l'opérateur.
- Les combats lancés depuis `data-qa-postdemo` (sauvegardes chargées) n'ont pas été parcourus ; un combat de l'après-démo l'a été par sa carte du labo.
- OD-2026-11-15-B n'est pas consigné dans `OPERATOR_DECISIONS.md` (limite d'usage atteinte).
