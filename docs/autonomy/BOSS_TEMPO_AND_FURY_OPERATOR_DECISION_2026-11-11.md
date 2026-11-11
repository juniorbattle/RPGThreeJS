# Cycle des boss et élites, Furie — OD-2026-11-11-A et B

- **Date** : 2026-11-11 (America/Toronto).
- **Source** :
  - Retours du test PC de l'opérateur sur le jeu complet intégré dans `dev` (`4d8e1d0d`). Boss et élites « très inactifs », qui « ne respectent pas la pattern définie et sont trop souvent essoufflés/brisés », alors qu'ils sont censés monter progressivement en impact avec un ultime. « Il serait bien qu'ils attaquent parfois 2 fois par tour. »
  - Réponses de l'opérateur du 2026-11-11 dans la session `playtest-combat`, après [le rapport](../reports/playtest-combat-2026-11-11.md) :
    - « partons sur un cycle de 4 tours, 1 action légère, attaque lourde au 2e, avertissement charge au 3e, ultime 4e » ;
    - sur la Furie proposée : « Oui je suis d'accord avec cette idée » ;
    - puis deux choix, tous deux recommandés : régénération des boss et élites à 3 PA par tour, et amendement puis construction de la Furie dans cette session.
- **Relecture** : contracts-guardian, PASS WITH WARNINGS. Les précisions demandées sont reprises dans le texte : exception explicite à la règle 1.20.0, déclenchement après la première action offensive du tour, sans déplacement, définitions des actions offensives et de soutien, gloses des états.
- **Statut** :
  - **A** est ACTIVE et sans amendement : ce sont des réglages de l'IA et du moteur, qu'aucun contrat ne fixe.
  - **B** est une règle de combat nouvelle. COMBAT_AND_VFX, section 1.20.0, veut qu'elle soit « proposed to the operator, not built ». Elle passe donc par l'amendement dédié 1.21.0, `PRODUCTION-CONTRACTS-BOSS-FURY-1`, que l'opérateur a demandé dans cette session.

## Constat

`CURRENT FACT` Avant la décision, après la première correction du 2026-11-11 :
- Un boss ou une élite suivait un cycle de 5 tours, réglé par une recharge d'ultime de 5 et une réserve de PA (`bossApReserve`, `src/combat/combatTempo.ts`).
- Boss et élites régénèrent 2 PA par tour (1 pour les autres unités) et récupèrent +1 PA s'ils finissent leur tour avec des PA.
- Une unité peut déjà enchaîner plusieurs actions dans un tour si ses PA le permettent ; aucune action n'est gratuite.

Avec 2 PA par tour, un cycle de 4 tours (action légère, attaque lourde de 4 PA, charge, ultime de 5 PA) ne se finance pas après un ultime qui a vidé la réserve, sauf à finir un tour à 0 PA, donc Essoufflé.

## OD-2026-11-11-A — cycle de 4 tours

`APPROVED DECISION`
1. Le cycle d'un boss ou d'une élite dure **4 tours** : action légère, attaque lourde, avertissement « CHARGE », ultime. La recharge de l'ultime vaut 4 au début du combat, après chaque ultime et après un tour sauté (« Brisé » interrompt toujours la charge).
2. Boss et élites régénèrent **3 PA** par tour au lieu de 2. Les autres unités gardent 1 PA. Le tutoriel « Boss & Élites » le dit en texte.
3. Le reste ne change pas : réserve de PA, souffle, plafond de 5 PA, coûts, dégâts, portées, kits.

## OD-2026-11-11-B — Furie

`APPROVED DECISION`, appliquée par l'amendement 1.21.0.
1. **Qui.** Les boss et les élites.
2. **Quand.** Tant que ses PV sont **sous la moitié** de ses PV maximum.
3. **Quoi.** Une fois par tour au plus, après la première action offensive qu'elle résout dans ce tour, l'unité enchaîne une **attaque de base gratuite**, sans se déplacer, sur une cible à portée, s'il y en a une. Le moteur décide et résout cette attaque ; l'IA choisit seulement la cible :
   - 0 PA, sans compter dans l'escalade des attaques ;
   - elle peut rater, critiquer et tuer comme une attaque de base ;
   - le +1 PA d'une élimination s'applique.
4. **Jamais** :
   - le tour où l'unité lance son ultime ;
   - si elle est Brisée, Entravée ou Muette ;
   - après une action de soutien.
5. **Annonce en texte.**
   - Un état « Furie », lisible sans couleur, figure sur l'unité et dans sa fiche ;
   - le journal note l'entrée en Furie et chaque attaque de Furie.
   - Aucun son, effet ou recette nouveau : l'attaque joue la présentation existante de l'attaque de base.
6. **Rien n'est sauvegardé.** La Furie se déduit des PV courants. L'attaque de Furie de chaque tour est un fait transitoire du combat.

## Vérification attendue

- Tests ciblés du moteur :
  - seuil de PV ;
  - une fois par tour ;
  - exclusions (ultime, Brisé, Entravé, Muet, soutien) ;
  - coût nul et escalade intacte ;
  - +1 PA d'élimination ;
  - annonce en texte.
- Une trace de combat réel dans le laboratoire QA.
- L'acceptation de jeu (fréquence, dureté) reste à l'opérateur, en jeu.
