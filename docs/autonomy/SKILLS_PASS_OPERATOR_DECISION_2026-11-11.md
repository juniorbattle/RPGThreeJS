# Passe sur les compétences du combat — OD-2026-11-11-C

- **Date** : 2026-11-11 (America/Toronto).
- **Source** :
  - Demande de l'opérateur : « refaire une passe sur nos compétences/attaques, car certaines actions ne sont pas configurées ou bien exécutées et on peut avoir du mal à comprendre ; il faut s'assurer que toutes nos actions soient parfaites. »
  - [Rapport de la passe](../reports/playtest-skills-2026-11-11.md), section 5 : dix points soumis à l'opérateur, D1 à D10.
  - Réponses de l'opérateur du 2026-11-11 dans la session `playtest-skills` :
    - D1 à D6 : « validé » (les recommandations) ;
    - D7 : « vraiment élargi » ;
    - D8 : « que propose la rune de vigueur ? » (question, voir plus bas) ;
    - D9 : « refuser, je suis d'accord » ;
    - D10 : « On garde ».
  - Sur l'estompage des unités pendant le ciblage : « on peut les laisser à 0,82 si les hors portées sont déjà à 0,42 ».
  - Ordre d'intégration : « OK POUSSE dans dev ».
- **Numéro** : OD-2026-11-11-C. La session `playtest-combat` a pris A et B (cycle des boss, Furie) sur sa branche, pas encore intégrée.
- **Statut** : ACTIVE, sans amendement. Ce sont des réglages de compétences, de ciblage et de textes, soumis à l'opérateur avant d'être construits, comme le veut COMBAT_AND_VFX section 1.20.0. Le choix est le même que pour OD-2026-11-11-A.

## Décisions

`APPROVED DECISION`

1. **D1, tir ami.** Une zone offensive lancée par un héros épargne les alliés du héros. Gardent le tir ami :
   - les compétences écrites « peut toucher les alliés » (Vague de Flammes, Grenade Incendiaire, Météore, Barrage) ;
   - les zones ennemies ;
   - les objets (Bombe).

   Une compétence à cible unique validée sur un allié le frappe toujours ; D1 ne vise que les zones.
2. **D2, Pacte de Sang.** Garder « sacrifie 15 % des PV pour Force 2 tours », sans vol de vie.
3. **D3, Charge +2.** Puissance +2.
4. **D4, Coup Sournois +2.** Le bonus de critique (+80 %, plafond 90 %) ne vaut que sur un coup porté de dos.
5. **D5, Cercle Écarlate +1.** Puissance +2 et soin +4 PV.
6. **D6, lance.** L'attaque de base garde le contact, diagonales comprises. Les descriptions des lances ne promettent plus de portée.
7. **D7, Vague de Flammes +2.** Le cône passe de 4 à 9 cases.
8. **D9, case vide.** Une action à cible unique validée sur une case où elle n'affecterait aucune unité est refusée, sans dépense de PA. Restent valides sur une case vide :
   - les zones, les déplacements et les actions sur soi ;
   - le déplacement seul de Pas d'Ombre et de Repli de Hampe.
9. **D10, Repli de Hampe.** Garder son déplacement seul sur une case vide.
10. **Estompage du ciblage.** Inchangé : 1 pour la cible survolée, 0,82 pour une cible valide, 0,42 hors portée.

## Ouvert

`UNDECIDED` **D8, Sceau du Sage.** Il remplace Purification (3 PA) par la Rune de Vigueur (2 PA), que la règle des paliers ouvre dès T1. La réponse à la question de l'opérateur est dans le rapport, section 9. Les deux options :

- **A** : garder.
- **B** : une compétence remplaçante garde le palier de celle qu'elle remplace.

La recommandation est B. Rien n'est changé avant sa réponse.

## Mise en œuvre

Elle est décrite dans le rapport, sections 3 et 9 : fichiers, tests, et preuves au laboratoire QA. Elle est intégrée à `dev` sur l'ordre de l'opérateur.
