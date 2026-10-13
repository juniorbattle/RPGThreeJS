# RPGThreeJS — La Voie des Sceaux

Vertical slice HD-2D sous Three.js. Le runtime principal orchestre une run narrative ramifiée, la carte stratégique, les dialogues, le clan et la sauvegarde v5. Le combat de mêlée tactique reste une entrée Vite dédiée, initialisée par un contrat `postMessage` validé.

```bash
npm install
npm run dev
npm test
npm run build
```

- `/` : run narrative, bandeau de voyage et carte stratégique.
- `/legacy-combat.html` : arène compacte 8 × 4, avec déploiement du clan et décor hybride.

Principes actuels :

- une ou deux armes équipées selon le profil de l’unité ;
- quatre alliés contre trois ou quatre ennemis sur une grille entièrement praticable ;
- progression par armes et accessoires, sans niveau ni XP ;
- parcours seedé de douze étapes avec branches, refuges et révélation progressive ;
- butin temporaire sécurisé aux refuges et perdu en cas de défaite ;
- réputation globale data-driven influençant prix et événements ;
- boutique accessible uniquement depuis un nœud marchand ;
- inspection des unités au survol et aperçu contextuel des actions ;
- arrière-plans atmosphériques ancrés à la caméra, sans raycast ni collision.
