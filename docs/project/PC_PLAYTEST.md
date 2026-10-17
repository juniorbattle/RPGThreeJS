# Préparation du playtest PC

État au 17 octobre 2026 : candidat de travail sur `dev`, acceptation finale opérateur ouverte. La navigation POI V2/Lot E est livrée dans les portées du [rapport Lot E](../reports/lot-e-final-2026-10-15.md). La [file de finition](../autonomy/DEMO_COMPLETION_PLAN.md) distingue les corrections vérifiées des critères encore ouverts.

## Lancer la campagne

Depuis le dépôt, exécuter `npm install` si nécessaire, puis `npm run build` et `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`. Ouvrir `http://127.0.0.1:4173/` dans un navigateur PC. Si le port est occupé, choisir un autre port libre et garder cette adresse pendant le test : les sauvegardes du navigateur dépendent aussi de l'origine et du profil utilisés.

Pour un nouveau parcours, utiliser un profil de navigateur distinct afin de conserver la partie habituelle. Pour vérifier une reprise, revenir à la même adresse dans le même profil et utiliser Continuer. Le parcours normal part du menu et reste dans la campagne, y compris pendant le combat intégré.

## Parcours et observations utiles

1. Suivre l'ouverture et l'audience, gagner le combat initial, puis rejoindre le Croisement et le premier refuge. Observer les objectifs, la lecture des dialogues et le retour de focus à chaque changement de surface.
2. Pendant les combats, essayer déploiement, déplacement, cible autorisée ou refusée, validation, Retour/Escape, Annuler le déplacement et Attendre. Alterner clavier et pointeur. Après l'attente et les tours ennemis, vérifier qu'une action alliée disponible reçoit un focus visible.
3. Explorer les branches autorisées, coffres et rencontres facultatives. Observer la lisibilité des routes, des intentions des élites et du choix Combat/Repli. Noter les coûts, récompenses et difficultés ressenties sans modifier les paramètres de combat.
4. Au refuge, utiliser les services disponibles, quitter puis reprendre à la même adresse. Observer recrutement, équipement, ressources, position et objectifs conservés. Poursuivre vers Bois-Clair, les témoins, la préparation et le jugement selon les choix réellement faits.
5. Tester séparément la préférence de réduction des animations du système et celle du jeu. Signaler un texte tronqué, un contrôle inaccessible ou une perte de focus, avec la taille de fenêtre et le mode utilisé.

Pour chaque problème, noter le commit (`git rev-parse HEAD`), le navigateur, la taille de fenêtre, le lieu, les actions immédiatement précédentes, le résultat attendu et le résultat observé. Une capture aide à retrouver le contexte. Garder la sauvegarde existante et noter l'adresse utilisée.

## Acceptation encore ouverte

L'économie, les récompenses/coûts, les formations et le rythme des élites, les atlas et le confort matériel attendent le playtest opérateur. L'image nocturne de Bois-Clair reste un blocage d'asset externe identifié. La remasterisation vidéo est un chantier manuel externe ; l'audio reste différé.

Les preuves automatisées conservées certifient leurs frontières précises, pas l'équilibre global, toutes les combinaisons de campagne ou un lecteur d'écran réel. La vérification des noms accessibles utilise les rôles et noms exposés au navigateur. La passe mobile finale et l'acceptation globale de la démo restent ouvertes.
