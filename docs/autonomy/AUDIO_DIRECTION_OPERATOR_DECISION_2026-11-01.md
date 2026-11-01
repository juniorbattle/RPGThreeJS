# Direction audio de la démo — OD-2026-11-01-B

**APPROVED DECISION.** Le 2026-11-01, l'opérateur a rempli la [fiche d'arbitrages audio](https://claude.ai/artifact/UGe8DMGDn7BURNtcWv3UsK) issue de l'[audit audio](../reports/audio-audit-2026-11-01.md). Cette décision fixe la direction et l'ordre de travail. Elle ne modifie aucun contrat par elle-même : l'extension demandée passe par l'amendement dédié 1.12.0, approuvé le même jour (section Amendement 1.12.0). Rien ici ne vaut validation à l'oreille.

## Choix de l'opérateur

| Id | Sujet | Choix |
| --- | --- | --- |
| A1 | Amendement audio 1.12.0 | Oui, selon mes choix ci-dessous |
| A2 | Calendrier | Avant le test PC |
| A3 | Source | Code uniquement |
| B1 | Référence principale | Tactique sombre, élan Octopath pour les boss. Note : « mais Breath Of Fire 3 est aussi une magnifique reference » |
| B2 | Motifs | Thème des Sceaux et couleurs de camp |
| B3 | Combat | Deux niveaux, réflexion et action |
| B4 | Forme | Environ 1 min 30 |
| B5 | Récit | Trois humeurs |
| B6 | Fins | Fanfares et entrée de boss |
| C1 | Effets par défaut | Actifs dès le premier clic |
| C2 | Son des compétences | Grammaire à trois couches |
| C3 | Ultimes et signatures de boss | Sur mesure pour les 20 |
| C4 | Comparaison fichiers et synthèse | Abandonner la comparaison |
| C5 | Ambiances | Remonter et étendre |
| D1 | Validation | Laboratoire d'écoute |

Ajout de l'opérateur, même jour : « ce que j'aime, c'est les transitions, donc durant une melodie qui se boucle, il y a une partie d'une son qui passe vers une transition et change le rythme ou tonalite de la musique afin de revenir sur sa boucle ». Exemples donnés : Breath of Fire 3, Chrono Cross, Final Fantasy 8. Son message s'arrête sur « mais » : une suite reste possible.

## Ligne directrice

**Ton.** Une chronique grave de clan déchu, tenue et sobre, où l'espoir passe par la mélodie. Base tactique sombre (Final Fantasy Tactics, Tactics Ogre), élan orchestre et batterie d'Octopath pour les boss.

**Musique :**

1. **Le pont.** Règle voulue par l'opérateur, valable pour toute piste qui boucle : à un moment écrit, la mélodie passe par une transition qui change le rythme ou la tonalité, puis une reprise prépare le retour à la boucle. Le pont est la signature de la bande-son, pas un ornement.
2. **Le fil rouge.** Un motif court des Sceaux traverse toutes les pistes, transformé selon le lieu.
3. **Les couleurs de camp.** Lion : cuivres et quintes. Serpents : demi-tons et mode phrygien. Bois-Clair : luth, flûte, tambour sur cadre. Ombres : chœur et silence. Aucun ajout au canon : ce sont des timbres sur des noms déjà présents dans le jeu.
4. **La couleur Breath of Fire 3.** Une bande-son d'inspiration jazz (Yoshino Aoki, Akari Kaida). Hypothèse de travail à confirmer : accords enrichis et rythmes syncopés dans les pistes de vie (carte, refuge), là où la base tactique sombre laisse de la place.
5. **Le tour respire.** Une même piste de combat a un niveau Réflexion et un niveau Action.
6. **Une vraie forme.** Environ 1 min 30 pour le combat et la carte, en parties distinctes, avec des passages sans mélodie.
7. **Le récit choisit l'humeur.** Refuge, Tension, Drame, marqués par scène sans toucher au texte.
8. **Les fins comptent.** Fanfares de victoire et de défaite, entrée de boss enchaînée sur le dialogue.
9. **La musique laisse la place.** Moins de grave en combat, et une musique qui s'efface sur les ultimes.

**Sons :**

1. **Grammaire à trois couches.** Geste, élément, poids, rendus d'avance en un seul son et calés sur la recette visuelle.
2. **Sur mesure pour les 20.** Les 12 ultimes et les 8 signatures de boss ont charge, coup et vague.
3. **Effets actifs au premier clic**, comme la musique.
4. **Ambiances** remontées et étendues à la carte et au refuge.

**Validation.** Un laboratoire d'écoute dans les outils QA. Seule l'écoute de l'opérateur valide. La comparaison entre fichiers et synthèse est abandonnée : les fichiers restent en secours.

**Source.** Code uniquement. Le rendu visé est un orchestre séquencé, pas un orchestre réel.

**Inspirations.** Des procédés, jamais une mélodie reprise.

## Ordre de travail

| Lot | Contenu | Cadre |
| --- | --- | --- |
| 0 | Rétablir les sons des ultimes, donner le bon lancement à chaque compétence, rééquilibrer musique, effets et ambiances, corriger `COMBAT_HD2D.md` | Contrat actuel |
| 1 | Amendement 1.12.0 | Texte relu, puis approuvé par l'opérateur |
| 2 | Bus commun, limiteur, atténuation, effets actifs par défaut | Après l'amendement |
| 3 | Moteur à sections, motif, ponts, thèmes réécrits, deux niveaux de combat, fanfares | Après l'amendement |
| 4 | Grammaire sonore, repères sur les recettes, les 20 sur mesure | Après l'amendement |
| 5 | Humeurs de récit, ambiances hors combat | Après l'amendement |
| 6 | Laboratoire d'écoute, validation, réglages finaux | Opérateur |

Ce chantier passe avant le test PC (A2) : il précède le playtest complet de la ligne d'arrivée OD-2026-10-25-C.

## Inchangé

Vérité du jeu, sauvegardes V6, récompenses, canon, voix et audio vidéo (toujours DEFERRED), planificateur en pause, `main`.

## Sources

[Breath of Fire III, Wikipédia](https://en.wikipedia.org/wiki/Breath_of_Fire_III), [Chrono Cross, Square Enix Music Online](https://squareenixmusic.com/reviews/group/chronocross.html). Aucune source publique consultée ne détaille les modulations de ces trois jeux : les exemples de ponts seront fixés à l'écoute de l'opérateur.

## Livraison

Lots 2 à 6 livrés sur `dev`, run `claude-audio-direction-20261101T1918Z`. [Rapport et preuves](../reports/audio-direction-2026-11-01.md). Rien ne vaut validation à l'oreille.

Écoute dans le laboratoire : lancer le serveur de développement, ouvrir `/?qa=1`, QA rencontres, Laboratoire d'écoute, cliquer une fois puis attendre « Tout est prêt ». Une fiche d'avis se remplit en bas, à copier et renvoyer.

| Priorité | À écouter | La question |
| --- | --- | --- |
| 1 | Pont de Combat, de Carte, de Refuge, puis laisser boucler | Est-ce la transition que vous aimez ? Le retour se fait-il naturellement ? |
| 2 | Début de Titre | Le motif des Sceaux tient-il en quatre notes ? |
| 3 | Combat et Boss, en alternant Réflexion et Action | Réfléchit-on mieux ? L'écart est-il assez net ? |
| 4 | Carte et Refuge | La couleur jazz inspirée de Breath of Fire 3 convient-elle ? C'est une hypothèse. |
| 5 | Tension, Drame, Entrée de boss, les deux fanfares | Le ton est-il juste ? |
| 6 | Les 12 ultimes et les 8 signatures de boss | Chacun a-t-il sa charge, son coup et sa vague ? |
| 7 | Compétences courantes, attaques ennemies, ambiances | Le geste et l'élément s'entendent-ils ? L'ambiance est-elle assez présente ? |

## Amendement 1.12.0

Tâche dédiée `PRODUCTION-CONTRACTS-AUDIO-DIRECTION-1`.

| Document | Changement |
| --- | --- |
| Constitution | Dans ce périmètre seulement : neuf contextes, effets actifs mais silencieux avant le premier geste, fin des limites de 16 familles et d'une seconde pour les sons nommés, réserve sur les ultimes levée sans en activer aucun. Voix et audio vidéo restent DEFERRED. |
| `PRESENTATION_AND_MEDIA` | Neuf contextes, humeurs de récit, sections et ponts, deux niveaux de combat, entrée de boss, limiteur, atténuation, effets actifs mais armés, ambiances de carte et de refuge. |
| `COMBAT_AND_VFX` | Sons composés à trois couches, repères sur les recettes, sons sur mesure des 20, plafonds de voix inchangés, comparaison retirée. |
| `UI_AND_ACCESSIBILITY` | Effets affichés comme actifs par défaut, contrôles inchangés, laboratoire réservé au développement. |
| `AUTHORING_AND_QA` | Preuves requises, et laboratoire comme surface de validation. |
| `AUTONOMOUS_WORK_PROTOCOL` | Périmètre des agents. Interdictions sur l'IA et les pistes externes inchangées. |
| README, manifest | Entrée du set 1.12.0. |

Ordre : relecture indépendante du diff réel, approbation de l'opérateur, commit de l'amendement, commit opérationnel qui fixe la nouvelle base, puis le code.

Deux relectures indépendantes ont conclu BLOCKED : la portée des choix était couverte, mais le texte laissait des contradictions, des limites invérifiables, et sa première forme empêchait la fanfare de jouer sur une vraie victoire. Il a été réécrit en conséquence. Il autorise le son des ultimes sans en activer aucun : cette décision reste ouverte.

Valeurs proposées par Claude et approuvées avec le texte : fanfare de 8 s au plus, entrée de boss de 6 s au plus, atténuation de 6 dB au plus, sons sur mesure de 2,5 s au plus, un changement de niveau par 500 ms, retour à Réflexion après 15 s, limiteur à -1 dBFS, 160 sons et 32 Mo au plus, 0,5 s de marge après la recette, fin de l'atténuation en 1 s, deux voix de signature au plus, humeur Refuge pour une scène sans humeur. Le pic de 0,2 reprend celui des fichiers actuels.

Approbation de l'opérateur, 2026-11-01. À la question « J'applique l'amendement 1.12.0 avec ces valeurs ? », réponse verbatim : « Okay go sur une nouvelle sous-session ». Elle vaut approbation du texte relu et des valeurs ci-dessus.

Reviewed amendment committed as `29aa94862f9cd5f2c73ba9569660ed26c41ceaf8`; this following operational checkpoint establishes it as the immutable set 1.12.0 baseline before runtime.
