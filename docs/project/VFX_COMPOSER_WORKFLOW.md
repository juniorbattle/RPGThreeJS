# Composer VFX — enchaîner les actions de la démo

Mode d'emploi pour l'opérateur, auteur des effets dans le lab ([OD-2026-10-25-B](../autonomy/COMBAT_VFX_PRIORITY_OPERATOR_DECISION_2026-10-25.md)). Point de départ : [couverture des 34 actions](../reports/combat-vfx-coverage-2026-10-25.md).

## Ouvrir le lab

1. `npm run dev`, puis `http://localhost:5173/?qa=1&vfxlab=1`.
2. **QA rencontres**, choisir les options, puis une rencontre. Après le briefing, le combat s'ouvre avec le **VFX PRESET COMPOSER** à gauche.
3. Le filtre **DEMO SCOPE** limite la liste aux 34 actions réellement atteignables en démo.

## Lire la liste

Chaque action porte une marque :

| Marque | État | Sens |
| --- | --- | --- |
| ○ | REMAINING | rien de composé. Ouvrir une action ne compte pas comme travail, même si son brouillon arrive pré-rempli avec l'ancienne planche retirée. |
| ◐ | IN PROGRESS | modifié, pas encore sauvegardé |
| ● | READY | sauvegardé (SAVE DRAFT), pas encore publié |
| ✓ | PUBLISHED | publié dans le jeu |

**NEXT TO COMPOSE ▶** et **◀ PREV** passent à l'action non publiée suivante ou précédente, dans l'ordre de la liste. Le tableau **DEMO WORKLOAD** donne le total par groupe.

## Pour chaque action

1. Un emplacement marqué **NOT A CARTOONCOFFEE SOURCE** porte une planche retirée : **REPLACE** et choisir un candidat CartoonCoffee. À la première lecture, le serveur de dev copie le candidat depuis le pack (`MEGA_PACK_ROOT`), en local et jamais commité.
2. Régler la taille, la vitesse, la position ou la trajectoire, la phase et l'impact (flash, secousse). Au besoin, ajouter des beats et **+ ADD UNIT MOTION + POSE** : c'est le seul chemin qui active les poses `dash`, `attack` et `cast` dans le Combat Stage.
3. Vérifier avec **PLAY VISUALS ONLY**, **PLAY FULL PRESET**, puis **PLAY IN COMBAT STAGE** pour les actions de route STAGE. Pour le mouvement réduit, relancer une rencontre avec **GRAPHISMES : Réduit** dans QA rencontres, ou activer la réduction des animations du système.
4. **SAVE DRAFT** (●), puis **PUBLISH PRESET** (✓), ou plus tard **PUBLISH ALL SAVED**. La publication écrit `src/combat/vfx/generated/published-vfx-presets.json`.
5. **NEXT TO COMPOSE ▶**.

Ordre conseillé par famille :
1. contact ;
2. projectiles ;
3. soins, bénédictions et altérations ;
4. déplacements ;
5. signatures de boss.

## À savoir

- **Publications de Claude :** depuis le lot contact, Claude compose et publie aussi des actions. Une action déjà publiée s’ouvre dans le lab avec sa composition publiée, sauf si ton navigateur garde un vrai brouillon local pour elle, qui passe alors en premier. Retoucher puis republier remplace la publication.
- **Brouillons :** ils vivent dans le `localStorage` du navigateur utilisé. **EXPORT DRAFTS / BACKUP** avant de vider le navigateur ou d'en changer.
- **Substitut procédural :** tant qu'une action n'est pas publiée et que sa planche de base est retirée, le combat affiche un substitut procédural (arc, étoile d'impact, étincelles, fumée, particules ou anneau) au même endroit et au même moment. Il signale une action à composer : ce n'est pas un effet final. Les K.O., les critiques et les attaques de base ennemies, dont la planche est aussi retirée, l'affichent également.
- **Après une série de publications**, signaler la série à Claude pour la vérification :
  - `npm run vfx:validate-published` ;
  - les tests VFX ;
  - un combat de contrôle en mouvement normal et réduit ;
  - le commit sur `dev`.
- **Clones et autres machines :** les PNG CartoonCoffee restent sur ta machine. Ailleurs, une action publiée garde sa logique mais pas son image.
