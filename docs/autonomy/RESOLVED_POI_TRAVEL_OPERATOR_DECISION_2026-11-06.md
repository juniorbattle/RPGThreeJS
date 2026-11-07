# Voyage vers les lieux résolus — OD-2026-11-06-A

**APPROVED DECISION.** Le 2026-11-06, l'opérateur a rempli la [fiche d'arbitrages](https://claude.ai/artifact/BwMyERiU4nuhVnvR329ZXB) : ses six choix suivent les recommandations, et il approuve le texte de l'amendement 1.16.0 / `PRODUCTION-CONTRACTS-POI-RESOLVED-TRAVEL-1` tel quel (B1). Les contrats portent ce texte ; la baseline immuable est fixée par le commit opérationnel qui suit celui de l'amendement.

## Demande

Le 2026-11-06, pendant le playtest PC, l'opérateur écrit : « sur la carte de POI, si nous avons déjà visité et résolu un POI on peut y accéder de n'importe où, ce qui nous facilitera le déplacement ».

## Choix de l'opérateur

| Id | Sujet | Choix |
| --- | --- | --- |
| A1 | Destinations | Tout lieu résolu |
| A2 | Coût | Un tour, comme un pas |
| A3 | Menaces | Le chemin évite les menaces |
| A4 | Animation | Le pion suit le chemin |
| A5 | Portée | Toutes les régions |
| B1 | Amendement | J'approuve le texte tel quel |

Aucune note n'accompagne ces choix. Le voyage décrit ci-dessous, tel que corrigé après la relecture, est donc approuvé.

## Pourquoi un amendement

Le contrat verrouillé `TRAVERSAL.md`, ligne 19, l'interdit : « Move in both directions on connected, unlocked edges only. No remote-click teleport ». `CAMPAIGN_AND_STATE.md`, ligne 17, confie à RunSystem un déplacement de proche en proche (« connected bidirectional movement »).

Le reste du contrat permet déjà ce voyage, s'il compte comme un seul déplacement :

- les menaces mobiles avancent d'au plus une case par déplacement engagé (Lot E, `TRAVERSAL.md` ligne 9) ;
- un lieu occupé offre Combat ou repli avant tout engagement (ligne 11) ;
- un lieu résolu se traverse sans rien rejouer (ligne 19).

## Ce que verrait le joueur

1. Sur la carte, il sélectionne un lieu résolu, même loin de sa position. Le bouton « Se rendre » est disponible, avec la mention « Voyage rapide · 1 tour ».
2. Le pion suit le chemin le plus court, d'un lieu à l'autre, puis arrive. En mouvement réduit, il est placé directement.
3. À l'arrivée, rien ne se rejoue. Un refuge réutilisable rouvre ses services, et le refuge final rouvre sa halte avant le jugement.
4. Les menaces mobiles avancent d'au plus une case, comme après un pas.

Règles de ce voyage :

- **La destination.** Tout lieu résolu, quelle que soit sa région.
- **Le chemin.** Il emprunte des liaisons ouvertes, y compris les raccourcis d'un contournement. Chaque lieu traversé doit être résolu ou neutralisé, et aucun ne doit être occupé par une menace mobile. Un lieu facultatif contourné est sauté : on n'y entre jamais. Sans un tel chemin, le voyage n'est pas proposé, et l'on marche comme aujourd'hui.
- **Une destination occupée.** Si une menace occupe la destination, le choix existant Combat ou repli s'offre avant tout engagement. Après un repli ou une victoire, la compagnie reste à son point de départ.
- **Après une rencontre par l'arrière.** Le point sûr du repli est le dernier lieu du chemin avant la destination, s'il remplit la règle du Lot E (visité, inerte, voisin, sans menace). Sinon, la menace ne peut pas entrer, comme le Lot E le prévoit déjà.
- **Aucun champ de sauvegarde.** La position, les visites et le tour restent les faits existants.
- **Ce qui ne change pas.** Les lieux non résolus, verrouillés ou neutralisés suivent leurs règles actuelles. Les verrous de causalité, les choix exclusifs et les liens de reprise ne changent pas.

## Décisions demandées à l'opérateur

| Id | Sujet | Recommandation | Autres options |
| --- | --- | --- | --- |
| A1 | Destinations | Tout lieu résolu | seulement les refuges et les jalons principaux résolus |
| A2 | Coût | Un tour, comme un pas : chaque menace avance d'au plus une case | autant de tours que de pas sur le chemin (amendement plus large, car le Lot E limite les menaces à une case par déplacement) |
| A3 | Menaces | Le chemin évite les lieux occupés par une menace ; sans chemin libre, on marche | seule la destination compte |
| A4 | Animation | Le pion suit le chemin, vite ; en mouvement réduit, placement direct | rideau noir, puis arrivée |
| A5 | Portée | Toutes les régions | la région affichée seulement |
| B1 | Texte d'amendement | J'approuve le texte relu tel quel, si mes choix suivent les recommandations | le réécrire selon mes choix, puis me le soumettre |

Pourquoi ces recommandations :

- **Un tour.** Le voyage reste aussi simple qu'un pas, et le contrat des menaces ne change pas.
- **Un chemin libre.** Les menaces gardent leur rôle : on ne saute pas par-dessus une menace pour l'éviter.

## Texte d'amendement soumis

Le diff réel est enregistré dans [RESOLVED_POI_TRAVEL_AMENDMENT_1.16.0.patch](RESOLVED_POI_TRAVEL_AMENDMENT_1.16.0.patch). Il touche TRAVERSAL, CAMPAIGN_AND_STATE, le README et le manifeste : 22 lignes ajoutées, 3 modifiées. Ni la constitution ni les autres contrats ne changent.

- **TRAVERSAL** :
  - nouvelle section *Travel to resolved POIs — OD-2026-11-06-A*, avant celle du Lot E, qui décrit ce voyage avec les choix recommandés ;
  - ligne 19 : « Move in both directions on connected, unlocked edges; set 1.16.0 above adds only travel to resolved POIs over such edges. No other remote-click teleport and no bypass of an obligatory unresolved event. »
- **CAMPAIGN_AND_STATE**, ligne 17 : RunSystem valide aussi le voyage vers les lieux résolus du set 1.16.0.
- **README** : un paragraphe d'historique pour le set 1.16.0.
- **Manifeste** : `contractSetVersion` passe à 1.16.0, avec une entrée `approvedAmendments` pour `PRODUCTION-CONTRACTS-POI-RESOLVED-TRAVEL-1`.
  - `approvedAt` porte la date de préparation, à corriger si l'approbation tombe un autre jour.

Appliqué dans une copie de travail isolée, le correctif passe le validateur de contrats et `git diff --check`. `git apply --check` le confirme sur `dev`.

## Relecture indépendante

Relecture `contracts-guardian` du diff réel et de cette proposition, le 2026-11-06 : aucun point bloquant.

- **Couverture** : les deux clauses qui imposaient le déplacement de proche en proche sont amendées (TRAVERSAL ligne 19, CAMPAIGN_AND_STATE ligne 17). La constitution (ligne 13, la carte reste la seule navigation), AUTHORING_AND_QA ligne 21, le Lot E (lignes 9 et 11), POI V2 et la revalidation par RunSystem (TRAVERSAL ligne 15) restent compatibles.
- **Portée** : ni canon, ni récompense, ni champ de sauvegarde, ni identifiant, ni lieu nouveaux ; RunSystem reste le propriétaire, la carte ne fait que demander.
- **Faisabilité** : un sélecteur dérivé du chemin dans `selectPoiMap`, une fonction de voyage à côté d'`enterPoi` qui enregistre le déplacement depuis l'avant-dernier lieu du chemin (`recordPoiMovement`), et une animation du pion sur plusieurs tronçons. Aucun champ nouveau.
- **Commandes** : `git apply --check`, `git diff --check` et le validateur de contrats passent, sur l'arbre actuel et sur l'arbre amendé.

Avertissements, et ce qui en a été fait :

- **W1, corrigé.** Le dernier lieu du chemin n'est pas toujours un point sûr au sens du Lot E (visité, inerte, voisin, sans menace). Le texte applique désormais la règle du Lot E : à défaut, la menace ne peut pas entrer.
- **W2, corrigé.** « Légitimement contourné » était ambigu, car un lieu facultatif contourné reste disponible. Le chemin passe par les raccourcis du contournement et ne traverse que des lieux résolus ou neutralisés ; le lieu contourné est sauté.
- **W3, corrigé.** « Région découverte » n'ajoutait rien, puisqu'un lieu résolu a été visité. Le texte dit « tout lieu résolu » ; A5 reste un choix.
- **W4, corrigé.** Les numéros de ligne du Lot E sont rectifiés (9 et 11).
- **Précision ajoutée.** Après un repli ou une victoire devant une destination occupée, la compagnie reste à son point de départ.

Le correctif est régénéré avec ces corrections et revalidé.

## Approbation

Le 2026-11-06 au soir (heure de Toronto), l'opérateur répond « Fiche remplie » ; sur la fiche, B1 vaut « J'approuve le texte tel quel ». Le correctif relu est appliqué tel quel à TRAVERSAL, CAMPAIGN_AND_STATE, au README et au manifeste (set 1.16.0). `approvedAt` porte déjà le 2026-11-06. Le validateur de contrats et `git diff --check` passent sur l'arbre amendé.

## Ordre de travail

1. Relecture indépendante du diff réel.
2. Choix et approbation du texte par l'opérateur, sur la fiche d'arbitrages.
3. Commit de l'amendement, puis commit opérationnel qui enregistre son SHA comme nouvelle baseline immuable.
4. Ensuite seulement, le voyage dans le jeu, avec ses tests et une vérification en jeu.

## Ce qui ne change pas

- Les 33 lieux, leurs identifiants, leurs liaisons et leurs contenus.
- Les deux menaces mobiles, leurs zones et leur rythme d'une case par déplacement.
- Le choix Combat ou repli, les rencontres, les récompenses et leur unicité.
- Les sauvegardes V6 et les propriétaires de la vérité : RunSystem valide chaque voyage, la carte ne fait que le demander.
- Le scheduler reste en pause.
