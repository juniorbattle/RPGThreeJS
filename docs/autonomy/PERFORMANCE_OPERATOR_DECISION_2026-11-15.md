# Performances de la Voie des Sceaux — OD-2026-11-15-A

## La demande

Le 2026-11-15, l'opérateur demande, mot à mot : « ok qu'en est il de l'optimisation/performances du jeu ». La session principale confie la tâche à une session latérale : mesurer les performances réelles du build de production, proposer les optimisations sur une fiche d'arbitrages, puis n'appliquer que ce que l'opérateur valide.

## La mesure

Build de production (`npm run build`, `vite preview`), pilote Playwright `tools/perf/measure-performance.mjs` sur Chromium avec le vrai GPU du PC de l'opérateur (Radeon 780M intégrée, écran 2560 × 1600 à 175 %), sauvegardes V6 produites par le pilote QA de campagne (`tools/perf/make-perf-saves.ts`).

- **Fluidité.** Machine au repos, l'écran titre, l'ouverture, les tableaux vivants, le refuge, la carte et trois combats (loups, Général Serpent, Brèche) tiennent 59 à 60 images par seconde. Sous charge CPU, les combats tombent vers 40 images par seconde : le GPU intégré partage son énergie avec le processeur. Deux à-coups uniques de 0,7 à 1 s, au premier dialogue et à la première Compagnie, viennent de la compilation des shaders d'un effet CSS à son premier usage.
- **Chargement.** L'écran titre s'affiche en 0,24 s pour 1,43 Mo. Le premier combat d'une partie reprise télécharge 19,1 Mo et attend 89 sprites (8,2 Mo) de toutes les unités du jeu avant sa première image.
- **Build.** `dist` pèse 317 Mo : 138 images (89,5 Mio) n'y sont jamais demandées par le jeu, et 29 grandes images peintes chargées restent en PNG (86,3 Mio). Le JS du combat pèse 2 424 Ko, dont 1,8 Mo de rapports JSON du lab VFX Composer, qui ne tourne qu'en développement.
- **Mémoire.** Le tas JS est rendu après chaque combat, mais le processus de rendu garde environ 40 Mo de plus par combat (allocateur `partition_alloc`), ni par le contexte WebGL ni par le son.
- **Mobile (estimation).** Téléphone simulé, CPU ralenti 4 fois : combat ordinaire à 28 images par seconde, limité par le calcul.

Tableaux complets, avant et après : [le rapport](../reports/performance-2026-11-15.md).

## La fiche

La fiche d'arbitrages a été publiée en page privée : [Performances de la Voie des Sceaux](https://claude.ai/artifact/PKqjEkKX1FjBotvUDFSb5T). Elle comptait 10 cartes, avec des comparaisons à 100 % pour le WebP. L'opérateur l'a remplie et a répondu « Fiche remplie ». Aucune note n'accompagne les choix ; chaque choix est l'option recommandée.

| Carte | Sujet | Choix de l'opérateur, mot à mot |
| --- | --- | --- |
| P1 | Retirer du build les 138 images que le jeu ne charge jamais | « Exclure les 138 du build » |
| P2 | Convertir en WebP les 29 grandes images peintes encore en PNG | « WebP qualité 95 » |
| P3 | Ne plus attendre les sprites de tout le jeu avant chaque combat | « Attendre seulement ce combat, le reste en arrière-plan » |
| P4 | Sortir du combat de production les données du lab VFX | « Tables vides en production, lab DEV gardé » |
| P5 | Découper davantage le JavaScript | « Ne pas découper davantage » |
| F1 | Résolution de rendu du combat | « Garder 1,5 » |
| F2 | À-coups uniques au premier affichage | « Ne rien changer » |
| M1 | Le processus de rendu garde 40 Mo par combat | « Tâche dédiée avant la passe mobile » |
| D1 | Solder le reste de la dette maintenant ? | « Laisser à la passe dette » |
| MB1 | Ce que donne un téléphone moyen | « Garder pour la passe mobile » |

## Ce qui est décidé

1. **Images jamais chargées (P1).** Les 138 images que le jeu ne demande jamais sortent du build de production, sur le modèle des assets VFX locaux déjà retirés (`LOCAL_ONLY_PUBLIC_DIRS`). Elles restent dans le dépôt pour les outils et les tests qui les lisent. Les 33 images incertaines restent dans le build.
2. **WebP (P2).** Les 29 grandes images peintes chargées en PNG passent en WebP qualité 95, le réglage de l'après-démo, à résolution identique et sans retouche. Les registres prennent les nouveaux chemins et empreintes. Les sprites en pixel art restent en PNG.
3. **Sprites du combat (P3).** Le combat n'attend plus que les sprites des unités qu'il déploie avant sa première image ; les autres se chargent en arrière-plan.
4. **Lab VFX (P4).** Dans le build de production seulement, les trois tables JSON du lab VFX Composer sont remplacées par des tables vides. Le lab de développement reste intact.
5. **Sans changement.** Le JavaScript n'est pas découpé davantage (P5), le plafond de résolution du combat reste à 1,5 (F1) et les à-coups uniques restent tels quels (F2).
6. **Plus tard.** La croissance de 40 Mo par combat devient une tâche dédiée avant la passe mobile (M1). Le reste de la dette (C2, C13, CombatSfx, C18) reste à la passe dette technique (D1, OD-2026-11-13-F). Le profilage du combat sur mobile reste à la passe mobile (MB1).

## Résultat de M1

Livré le même jour (48f684ff, 818bf566, [rapport](../reports/combat-memory-2026-11-15.md)). Les 40 Mo par combat ne venaient pas du jeu : Playwright et le pilote de mesure activaient le domaine DevTools `Network` avec les tampons par défaut de Chromium, qui gardent le contenu de chaque réponse tant que la page vit, et chaque combat recharge l'iframe du combat. Mesuré sans ces tampons, le processus de rendu monte sur les premiers combats puis reste plat. Seuls les outils de mesure changent : aucun fichier du jeu, aucune vérité de jeu, aucune sauvegarde.

## Cadre

- **Contrats.** Aucun contrat n'est touché.
- **Contenu.** Aucune image nouvelle, aucune retouche artistique : le WebP garde la résolution et le cadrage de chaque image. Aucun texte, aucun canon.
- **Vérité du jeu.** Présentation et livraison seules. Aucun champ de sauvegarde, identifiants durables inchangés, sauvegardes V6 intactes.
