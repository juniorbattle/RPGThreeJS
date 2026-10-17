# RPGThreeJS — La Voie des Sceaux

Démo narrative et tactique HD-2D sous Three.js. La campagne relie les dialogues, le clan et les combats par une carte de 33 POI fixes, trois atlas et deux élites mobiles indépendantes. Les sauvegardes sont en V6.

```bash
npm install
npm run dev
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

- Pour tester le build de production, ouvrir [la campagne locale](http://127.0.0.1:4173/) après les deux dernières commandes. Utiliser un port libre ; `--strictPort` évite de changer silencieusement d'adresse.
- `/` : entrée de campagne, carte POI, dialogues, refuges et combats intégrés. Le bouton Continuer reprend une sauvegarde existante dans ce navigateur et à cette adresse.
- `/legacy-combat.html` : entrée technique du moteur tactique ; le parcours de playtest passe par la campagne.
- [Parcours de playtest PC et limites connues](docs/project/PC_PLAYTEST.md). La démo reste en préparation pour le playtest final opérateur ; la passe mobile finale suit la stabilité PC.

Principes actuels :

- une seule arme équipée par héros et deux emplacements d'accessoires ;
- déploiement et résolution tactique selon la rencontre ;
- progression par armes et accessoires, sans niveau ni XP ;
- déplacements, attentes et exploration sur les connexions autorisées de la carte POI ;
- butin temporaire sécurisé aux refuges et perdu en cas de défaite ;
- réputation globale data-driven influençant prix et événements ;
- préparation et services aux refuges selon leur disponibilité ;
- inspection des unités au survol et aperçu contextuel des actions ;
- arrière-plans atmosphériques ancrés à la caméra, sans raycast ni collision.
