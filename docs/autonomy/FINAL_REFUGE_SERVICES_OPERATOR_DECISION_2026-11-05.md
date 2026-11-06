# Services du refuge final — OD-2026-11-05-E

**PROPOSED.** Amendement 1.15.0 / `PRODUCTION-CONTRACTS-FINAL-REFUGE-SERVICES-1`, soumis à l'opérateur sur la [fiche d'arbitrages](https://claude.ai/artifact/U69ndhhrdAk9WFvKPpRwjQ). Les contrats restent intacts jusqu'à son approbation.

## Demande

- Le 2026-11-05, OD-2026-11-05-D constate que rien ne se dépense après le second refuge. L'or, le minerai et les gemmes de la région III, et donc de ses combats facultatifs, ne servent à rien.
- Pour l'opérateur, ces combats doivent être un enjeu : on y gagne de l'argent, au risque de blesser ses héros.
- À la question « Préparer un amendement de contrat pour ouvrir l'échoppe au refuge final ? », il répond « Oui, prépare-le ».

## Pourquoi un amendement

Trois contrats verrouillés gardent le refuge final purement narratif :

- `CAMPAIGN_AND_STATE.md`, ligne 21 : « Do not convert the final refuge into an interactive hub or alter its node type ».
- `CAMPAIGN_AND_STATE.md`, ligne 31 : le feu de camp avant le jugement est « a narrative boundary, not a new Traversal, ninth video or automatic full refuge-management hub ».
- `CAMPAIGN_AND_STATE.md`, ligne 13, et `TRAVERSAL.md`, ligne 21 : le refuge final narratif reste inchangé.

Ces règles viennent d'OD-2026-10-03-A (playtest manuel), qui a imposé ce temps de préparation avant le jugement. L'amendement ne touche qu'à l'interdiction des services ; tout le reste demeure.

## Ce que verrait le joueur

1. Comme aujourd'hui, les Signes des Ombres mènent directement au refuge final, et son dialogue joue sans changement : Maelor, Séraphine, Marian, Alistair.
2. **Nouveau** : juste après ce dialogue, une halte s'ouvre sur le décor approuvé du refuge final, avec les services des deux autres refuges :
   - l'échoppe et sa forge ;
   - l'amélioration des sorts ;
   - la compagnie ;
   - le repos payant.
3. « Continuer » reprend le chemin actuel : l'écran « Préparation — Avant le jugement », puis la carte, d'où l'on part au jugement d'Alaric. Tant que le jugement n'a pas commencé, revenir au refuge final rouvre la halte sans rejouer le dialogue.

Règles de cette halte :

- Elle reprend les mêmes systèmes que les refuges 1 et 2 : stock de l'échoppe partagé, prix selon la réputation, recettes, coût du repos (15 or par blessé). Ni repos gratuit ni réassort.
- Le nœud reste de type `story`, avec les mêmes identifiants et les mêmes liaisons. La halte n'ajoute aucun champ de sauvegarde : sa réouverture vient de l'état « résolu » du nœud, qui existe déjà.
- Aucun texte, aucun choix, aucune récompense, aucune image nouvelle : la halte reprend le titre « Refuge avant le Sceau », l'indication déjà écrite du nœud (« Rassembler le dossier complet avant de comparaître devant Alaric. ») et le décor `final-refuge-tableau.png`.
- Le jugement d'Alaric et son rôle de sommet narratif ne changent pas.

Le décor proposé est le tableau approuvé du refuge final. On y voit un camp sous la bannière du Lion, un feu, un râtelier d'armes, une table de préparation et des ruines au clair de lune.

## Décisions demandées à l'opérateur

| Id | Sujet | Recommandation | Autres options |
| --- | --- | --- | --- |
| A1 | Services | Ceux des deux autres refuges : échoppe et forge, sorts, compagnie, repos payant | sans le repos, pour garder les blessures de la région III jusqu'au jugement ; l'échoppe et la forge seulement |
| A2 | Moment | Juste après le dialogue du refuge final, puis à chaque retour avant le jugement | avant le dialogue |
| A3 | Décor | Le tableau approuvé du refuge final | le décor du second refuge |
| A4 | Stock | Le stock de l'échoppe, partagé avec les deux autres refuges | un réassort pour la veillée ; il faudrait un amendement plus large, car c'est une récompense nouvelle |
| A5 | Garen | Il garde sa Lance du Griffon à l'arrivée (OD-2026-11-05-D) | il arrive avec sa lance novice et s'équipe à la halte |
| B1 | Texte d'amendement | J'approuve le texte relu tel quel, si mes choix suivent les recommandations | le réécrire selon mes choix, puis me le soumettre |

Pourquoi garder Garen ainsi : il rejoint la compagnie tard et combat toute la région III. Avec une lance novice, il n'aurait qu'un sort pendant ces combats. L'or de la région III trouve de toute façon son usage pour les autres héros.

## Texte d'amendement soumis

Le diff réel est enregistré dans [FINAL_REFUGE_SERVICES_AMENDMENT_1.15.0.patch](FINAL_REFUGE_SERVICES_AMENDMENT_1.15.0.patch). Il touche CAMPAIGN_AND_STATE, TRAVERSAL, le README et le manifeste : 24 lignes ajoutées, 5 modifiées. Ni la constitution ni les autres contrats ne changent.

- **CAMPAIGN_AND_STATE** :
  - nouvelle section *Final refuge services — OD-2026-11-05-E*, qui décrit la halte avec les choix recommandés ;
  - ligne 21 : « Never alter the final refuge's node type; its only services are those of set 1.15.0 above. » ;
  - ligne 31 : le feu de camp reste une frontière narrative, et le set 1.15.0 n'ajoute après lui que les services existants des refuges ;
  - ligne 13 : la phrase historique renvoie au set 1.15.0.
- **TRAVERSAL**, ligne 21 : le refuge final garde son temps narratif, suivi seulement des services du set 1.15.0.
- **README** : un paragraphe d'historique pour le set 1.15.0.
- **Manifeste** : `contractSetVersion` passe à 1.15.0, avec une entrée `approvedAmendments` pour `PRODUCTION-CONTRACTS-FINAL-REFUGE-SERVICES-1`.
  - `approvedAt` porte la date de préparation, à corriger si l'approbation tombe un autre jour.

Appliqué dans une copie de travail isolée, le correctif passe le validateur de contrats et `git diff --check`. `git apply --check` le confirme sur `dev`.

## Relecture indépendante

Relecture `contracts-guardian` du diff réel et de cette proposition, le 2026-11-05 : aucun point bloquant.

- **Couverture** : les quatre clauses qui interdisaient des services au refuge final sont amendées (CAMPAIGN_AND_STATE lignes 13, 21 et 31, TRAVERSAL ligne 21). PRESENTATION_AND_MEDIA ligne 30 et la constitution (« Refuges prepare the party ») restent compatibles.
- **Portée** : ni récompense ni canon nouveau ; le type du nœud, les identifiants, la sauvegarde, l'ordre du récit et le jugement d'Alaric ne changent pas.
- **Manifeste et README** : conformes au précédent 1.14.0.
- **Faisabilité** : la halte des refuges (`GameApp.ts`, lignes 1141 à 1181) peut s'ouvrir entre le dialogue et la résolution du nœud, sans toucher au type ni aux liaisons.
- **Commandes** : `git apply --check`, `git diff --check` et le validateur de contrats passent.

Avertissements, et ce qui en a été fait :

- **W1, corrigé.** Après le dialogue, le jeu montre l'écran « Préparation — Avant le jugement », puis la carte. Il ne passe pas directement au jugement. Le texte disait l'inverse ; il dit désormais que « Continuer » reprend le chemin actuel vers le jugement.
- **W2, corrigé.** « Une fois, sans champ de sauvegarde » était ambigu. La halte se rouvre à chaque retour avant le jugement, et sa réouverture vient de l'état « résolu » du nœud, sans drapeau nouveau.
- **W3, noté.** `approvedAt` porte la date de préparation ; il sera corrigé si l'approbation tombe un autre jour.
- **W4, pour la mise en œuvre.** `cin2CampaignBridge.test.ts` vérifie que le nœud reste `story`, ce qui reste vrai. Il découpe aussi la branche des refuges : à surveiller si le code de la halte est partagé. L'ambiance de refuge (PRESENTATION_AND_MEDIA, lignes 84 et 93) s'appliquera à la halte.

Le correctif est régénéré avec ces corrections et revalidé.

## Ordre de travail

1. Relecture indépendante du diff réel.
2. Choix et approbation du texte par l'opérateur, sur la fiche d'arbitrages.
3. Commit de l'amendement, puis commit opérationnel qui enregistre son SHA comme nouvelle baseline immuable.
4. Ensuite seulement, la halte dans le jeu, avec ses tests et une vérification en jeu, avant le playtest PC.

## Ce qui ne change pas

- Le nœud `lion-final-refuge`, son type `story`, ses identifiants, ses liaisons et le dialogue `final_refuge`.
- L'ordre fin de route, préparation, puis jugement, ainsi que le jugement d'Alaric.
- Les sauvegardes V6 et les propriétaires de la vérité.
- Zéro vidéo, aucune image générée, aucun canon nouveau.
- Le scheduler reste en pause.
