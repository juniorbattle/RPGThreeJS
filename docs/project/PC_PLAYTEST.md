# Préparation du playtest PC

État au 17 octobre 2026 : candidat de travail sur `dev`, acceptation finale opérateur ouverte. La navigation POI V2/Lot E est livrée dans les portées du [rapport Lot E](../reports/lot-e-final-2026-10-15.md). La [file de finition](../autonomy/DEMO_COMPLETION_PLAN.md) distingue les corrections vérifiées des critères encore ouverts.

## Lancer la campagne

Depuis le dépôt, exécuter `npm install` si nécessaire, puis `npm run build` et `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`. Ouvrir `http://127.0.0.1:4173/` dans un navigateur PC. Si le port est occupé, choisir un autre port libre et garder cette adresse pendant le test : les sauvegardes du navigateur dépendent aussi de l'origine et du profil utilisés.

Pour un nouveau parcours, utiliser un profil de navigateur distinct afin de conserver la partie habituelle. Pour vérifier une reprise, revenir à la même adresse dans le même profil et utiliser Continuer. Le parcours normal part du menu et reste dans la campagne, y compris pendant le combat intégré.

## Parcours et observations utiles

1. Suivre l'ouverture et l'audience, gagner le combat initial, puis rejoindre le Croisement et le premier refuge. Observer les objectifs, la lecture des dialogues et le retour de focus à chaque changement de surface.
2. Pendant les combats, essayer déploiement, déplacement, cible autorisée ou refusée, validation, Retour/Escape, Annuler le déplacement et Attendre. Alterner clavier et pointeur. Après l'attente et les tours ennemis, vérifier qu'une action alliée disponible reçoit un focus visible. Au résultat, lire les **PV en fin de combat** de chaque participant : « Debout » ne signifie pas pleine santé. Un K.O. y garde ses 0 PV de fin de combat ; la récupération existante à 1 PV après victoire intervient au retour dans la campagne. Comparer ensuite l'équipe disponible, les soins et le repos avant une autre rencontre.
3. Explorer les branches autorisées, coffres et rencontres facultatives. Observer la lisibilité des routes, des intentions des élites et du choix Combat/Repli. Noter les coûts, récompenses et difficultés ressenties sans modifier les paramètres de combat.
4. Au refuge, utiliser les services disponibles, quitter puis reprendre à la même adresse. Observer recrutement, équipement, ressources, position et objectifs conservés. Poursuivre vers Bois-Clair, les témoins, la préparation et le jugement selon les choix réellement faits.
5. Tester séparément la préférence de réduction des animations du système et celle du jeu. Signaler un texte tronqué, un contrôle inaccessible ou une perte de focus, avec la taille de fenêtre et le mode utilisé.

Pour chaque problème, noter le commit (`git rev-parse HEAD`), le navigateur, la taille de fenêtre, le lieu, les actions immédiatement précédentes, le résultat attendu et le résultat observé. Une capture aide à retrouver le contexte. Garder la sauvegarde existante et noter l'adresse utilisée.

## Revue prioritaire : acceptation globale, équilibre et art

[OD-2026-10-17-A](../autonomy/PC_ACCEPTANCE_AND_MEDIA_ROADMAP_OPERATOR_DECISION_2026-10-17.md) place cette revue avant la frontière mobile restante. Pour chaque ligne, consigner **accepté**, **défaut observé** ou **ajustement proposé**, avec le lieu, la capture/sauvegarde et l'observation qui justifient le verdict. Un champ vide reste à juger ; aucun résultat automatique ne le transforme en acceptation humaine.

| Axe | Ce qui est établi | Ce qu'il faut maintenant juger sur PC |
| --- | --- | --- |
| Démo globale | Parcours gagnés, deux fins et reprises V6 dans les portées conservées ; source courante et changements récents vérifiés séparément. | Comprend-on l'objectif et la prochaine action ? Le rythme reste-t-il agréable de l'ouverture au jugement ? Un défaut empêche-t-il ou dégrade-t-il la partie ? |
| Difficulté et préparation | Vraies victoires et défaites conservées, sans statistiques affaiblies ; recrutement, équipement, soins et repos par menus existants. | Le joueur comprend-il une défaite et peut-il raisonnablement se préparer/reprendre ? Les rencontres ordinaires et les deux élites ont-elles un intérêt et une difficulté adaptés ? |
| Économie et détours | Catalogue Lot E et coûts existants implémentés ; butin temporaire sécurisé aux frontières existantes. | Les choix d'aide/exploration, recrutement, équipement et repos donnent-ils des arbitrages utiles ? Les détours sont-ils intéressants sans devenir obligatoires ? |
| Atlas et art | Trois atlas intégrés, 33 POI fixes et deux élites mobiles ; cibles et états accessibles testés dans leurs portées. | Routes, catégories, relief, étiquettes et menaces se lisent-ils sans confusion ? Cohérence visuelle entre régions, tableaux et personnages ? |
| Narration et confort | Textes canoniques et staging conservés ; focus/contrôles/noms accessibles PC vérifiés dans les portées documentées. | Qui parle et à qui ? Transitions et dialogues lisibles, sans gêne ni perte de contrôle à l'usage clavier/pointeur ? |

Le [bilan économique Lot E](../reports/lot-e-final-2026-10-15.md) fournit des points de départ, pas un verdict : plafond facultatif brut de **980 or** ; soldes terminaux observés **560 / 850 / 1167 or** sur des lignées, dépenses et graines différentes. Ces chiffres ne forment pas une comparaison contrôlée d'équilibrage. Les deux défaites conservées (Sentinelle avec équipe novice, Chasseurs avec deux membres à 1 PV) doivent être replacées dans leur préparation réelle avant de proposer une correction.

Point de revue concret : **la préparation avant les Chasseurs du Sceau**. La tentative perdue déployait Marian, Alistair, Cedric et Elara, ces deux derniers à 1 PV. La continuation gagnée avait payé 30 or de repos et déployait Marian, Alistair, Garen et Cedric ; Garen et Cedric finissent K.O. puis récupèrent à 1 PV selon la règle existante. La variante est la même (`poi_seal_hunters_a`), mais les équipes et leur santé diffèrent : ce sont des exemples de préparation, pas une mesure contrôlée de difficulté. Juger maintenant la lisibilité des PV/soins/repos et le coût ressenti de cette préparation, avant tout ajustement proposé.

Prochaine action de revue : prendre la lignée complétiste et ses captures conservées dans le rapport Lot E, confronter préparation/rencontres/atlas à cette grille, puis ouvrir **un seul écart joueur concret** à corriger ou une décision précise à juger. Réutiliser les preuves compatibles ; ne pas rejouer la campagne pour accumuler des validations identiques.

## Acceptation encore ouverte

L'économie, les récompenses/coûts, les formations et le rythme des élites, les atlas et le confort matériel attendent le playtest opérateur. L'image nocturne de Bois-Clair reste un blocage d'asset externe identifié. La remasterisation vidéo est un chantier manuel externe ; l'audio reste différé.

Les preuves automatisées conservées certifient leurs frontières précises, pas l'équilibre global, toutes les combinaisons de campagne ou un lecteur d'écran réel. La vérification des noms accessibles utilise les rôles et noms exposés au navigateur. La passe mobile finale et l'acceptation globale de la démo restent ouvertes.
