# Écran titre de la Voie des Sceaux — OD-2026-11-15-D

## La demande

Le 2026-11-15, la session principale confie à une session latérale une passe sur l'écran titre, son menu et son design, avant le test final de l'opérateur sur PC et la vidéo de présentation : un audit (1920×1080, 1366×768, 620 et 390×844, souris, clavier, manette), la correction des défauts évidents, puis une fiche d'arbitrages pour les vrais choix de design. La séquence d'ouverture de 55 s (OD-2026-11-02-A) ne change pas.

## L'audit et les corrections déjà faites

Les défauts évidents sont corrigés avant la fiche (rapport [title-screen-pass-2026-11-15](../reports/title-screen-pass-2026-11-15.md)) :
- les boutons du titre passent de 40 à 48 px de haut sur PC ;
- le focus clavier et manette prend un anneau laiton au lieu de l'anneau gris du navigateur ;
- le focus revient sur « Nouvelle chronique » après la confirmation, sur « Crédits » en sortant des crédits ;
- les réglages, la confirmation et les crédits se fondent au lieu de couper ;
- le décor du titre est préchargé.

Le rideau noir couvre déjà entièrement le départ du titre vers l'ouverture et vers « Continuer ». Les réglages ont déjà la musique, son volume et sa coupure à côté des effets, et le mouvement réduit, désactivé par défaut.

## La fiche

Publiée en page privée : [Écran titre · arbitrages](https://claude.ai/artifact/3hZ6NgQNtiB88gPEXSZ7gi), captures avant et maquettes après prises sur l'écran réel. L'opérateur a répondu « Sheet filled » : chaque choix est l'option recommandée, sans note.

| Carte | Sujet | Choix retenu |
| --- | --- | --- |
| R1 | Corrections de l'audit | Reçu |
| D1 | Disposition du menu | Colonne centrée sous le titre, la même sur PC et sur téléphone |
| D2 | Ordre des entrées | « Continuer » en tête quand une chronique existe, caché sans sauvegarde ; puis Nouvelle chronique, Réglages, Crédits |
| D3 | Image de fond | Le camp du Lion au départ, image existante (`lion-phase/dialogue/camp_departure.webp`) ; aucune image nouvelle |
| D4 | Titre et logo | Cartouche laiton dessiné en code : filets autour de « Chroniques d'Élyndra », filet à losange sous le titre ; l'étoile ✦ disparaît ; aucun emblème (celui d'Alistair reste ouvert) |
| D5 | Animation d'attente | Lente dérive du décor et voile de brume, en CSS seul, immobiles en mouvement réduit |
| D6 | Place du choix de langue | Réglages › Affichage, un groupe « Langue » au-dessus de « Mouvement » ; la session traduction (OD-2026-11-15-C) câble le contrôle |
| I1 | Crédits | Plus tard : l'entrée reste cachée jusqu'au texte de l'opérateur |

## L'accroche

Après la fiche, l'opérateur juge la phrase « Un RPG tactique où chaque serment laisse une trace. » pas optimale. Parmi quatre propositions, il retient : « Honneur ou force : chaque Sceau se gagne à votre façon. »

## Ce qui ne change pas

Aucun contrat touché, aucun canon nouveau, aucune image générée, aucun champ de sauvegarde. La séquence d'ouverture, le rideau partagé et les réglages hors sauvegarde restent tels quels. Le mouvement réduit reste le seul réglage du jeu (set 1.22.0).
