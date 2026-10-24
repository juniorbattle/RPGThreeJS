# Bois-Clair sacrifié : réalisation v4 autorisée

Décision directe de l'opérateur dans le chat01a167b9-2df2-7192-9ff1-fa652a2816ba,24octobre2026. Exécution manuelle autorisée par « Okay go » après clarification du découpage ci-dessous. Ce go autorise la nouvelle version du seul pilote ; il n'accepte ni la v3 artistiquement, ni la future v4, ni la généralisation ou le runtime.

## Retour et direction retenue

L'opérateur juge la succession de bras croisés/décroisés narrativement illisible. Les attitudes de peur/protection/réticence de l'habitante sont conservées comme référence. C'est Maelor qui doit évoluer : il tente de la tranquilliser ; constate que cela ne suffit pas ; laisse retomber les bras ; comprend le coût humain et assume la priorité donnée au clan. Ne pas remplacer cette intention par des remords, un effondrement ou une réconciliation.

La scène doit d'abord constater les dégâts de Bois-Clair à travers plusieurs cadrages, rejoindre les deux personnages pour rendre leur rapport intelligible, puis conclure par un élément concret du bilan. La proposition de conclure sur les coffres déjà acquis par le clan a été présentée avant le go. Aucun contenu, quantité ou transfert de ces coffres n'est inventé. Les boîtes/coffres fermés déjà visibles au bas gauche du décor approuvé fournissent le motif visuel ; ils ne changent pas de place ni de propriétaire à l'image.

L'effet demandé de « semi-flipbook » est réalisé dans le langage approuvé : illustrations complètes porteuses d'intentions distinctes, fondus courts entiers et tenues motivées. Ce n'est pas une reconstruction en poses intermédiaires, une interpolation, un morphing ou une animation corporelle continue. Cadrages variés ; axe et géographie constants ; coupe lorsque le changement d'échelle ferait doubler les silhouettes. La direction reste dans set1.9.0 ; aucune modification LOCKED nécessaire.

## Source et frontière

Source actuelle dev300d78dfde7bed43e6ef7c1cbb603e0d72431960. `src/cinematics/Cin6aPresentation.ts` exige victoire village_raid et missionGreed=true. `GameApp.resolveCombat` attribue les gains et résout la rencontre avant l'after-montage. `src/game/content.ts`, village_raid_aftermath:1, établit que les coffres sont acquis et que les habitants n'osent plus s'opposer ; les deux choix sur les provisions restent futurs. Les dégâts sont déjà présents : aucune cause nouvelle ni attaque de destruction jouée.

V4 séparée sous tools/cinematics/candidates/illustrated-sequences/bois_clair_sacrificed/v4/. Les v1/v2/v3, tous médias, prompts et reçus restent byte-identiques. La v3 conserve sa preuve technique et son statut READY historique ; le présent retour opérateur rouvre son art en ART_NEEDS_CORRECTION, enregistré séparément sans réécrire ses reçus. La v4 possède ses propres états/provenance/preuve. Camp et six autres scènes inchangés.

Verrou avant écriture ; génération imagegen intégrée uniquement après inspection des mastersV2/décor et fiches. Prévision :7images initiales nouvelles +1réemploi exact du décor ; plafond10initiales/2corrections ciblées. Un scénario lecteur compatible, sans campagne entière ni nouveau framework. Revue des images, paires et lecture sans légendes distincte de la preuve technique. L'acceptation artistique finale des images ET du montage reste opérateur avant généralisation.

Le scheduler est observé **PAUSED**, cadence90min/modelgpt-6.1-sol/xhigh inchangés ; TOMLSHA25b8b9af6a771b342b9c7c495c0fb78ebe24f333875aa403a1327f9bacc3cc07 au préflight. Aucune activation ou autre mutation demandée.
