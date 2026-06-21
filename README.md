# RPGThreeJS — La Voie des Sceaux

Vertical slice HD-2D sous Three.js. Le runtime principal orchestre la carte narrative, les dialogues, le clan et la sauvegarde v4. Le combat tactique reste une entrée Vite dédiée, initialisée par un contrat `postMessage` validé.

```bash
npm install
npm run dev
npm test
npm run build
```

- `/` : campagne narrative.
- `/legacy-combat.html` : arène tactique de référence, avec déploiement du clan sur la grille et décor hybride parallax.

Principes actuels :

- une ou deux armes équipées selon le profil de l’unité ;
- déploiement variable de trois à cinq unités selon la rencontre ;
- XP, niveaux, formation et consommables synchronisés après une victoire ;
- boutique accessible uniquement depuis un nœud marchand ;
- navigation bidirectionnelle entre les nœuds adjacents déjà parcourus ;
- inspection des unités au survol et aperçu contextuel des actions ;
- décors de carte et d’arène générés spécifiquement pour le projet.
