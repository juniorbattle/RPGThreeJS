# Audit audio complet — musique, sons, ambiances et lien avec les VFX

Suite : l'opérateur a tranché le 2026-11-01 ([OD-2026-11-01-B](../autonomy/AUDIO_DIRECTION_OPERATOR_DECISION_2026-11-01.md)). Ce rapport garde son état à la base `87d6a49c`.

| Champ | Valeur |
| --- | --- |
| `TASK` | `AUDIO-AUDIT-2026-11-01` |
| `DOMAIN` | Média, audio, combat |
| `BASELINE` | `dev @ 87d6a49c` |
| `BRANCH` | `dev` |
| `HEAD` | Commit de ce rapport |
| `STATUS` | Review, en attente des arbitrages de l'opérateur |
| `MERGED_IN` | `NONE` (`dev` seulement) |
| `SUPERSEDES` | `NONE` |
| `SUPERSEDED_BY` | `NONE` |
| `PRODUCTION_IMPACT` | `NONE` : aucun code modifié |
| `CANONICAL_DOCS_UPDATED` | `NONE` : la direction reste une proposition tant que l'opérateur n'a pas tranché |
| `EVIDENCE` | Mesures ci-dessous, rendus WAV dans `tmp/audio-audit/` (ignoré). Limites en section 11 |

Demande de l'opérateur, 2026-11-01 : retravailler musiques et sons avec une ligne directrice claire, des inspirations concrètes et une intégration précise, intégrer les SFX aux VFX, « un audit complet sera essentielle ».

## 1. Verdict

CURRENT FACT. Le moteur est sain : il tient ses limites de performance, il est déterministe et aucune erreur de page n'est apparue pendant la capture. Le problème est ailleurs : le joueur entend aujourd'hui surtout une musique forte et courte, et presque rien de ce qui se passe à l'écran.

Les cinq constats qui comptent le plus :

1. **Les effets sonores sont coupés par défaut.** Un nouveau joueur a la musique, mais aucun son de combat ni d'interface tant qu'il ne les active pas dans les réglages (`UiSoundPlayer.enabled = false`).
2. **Les 12 ultimes sont muets.** `soundActionSuppressed` coupe tous les sons de combat de l'action. Le contrat 1.11.0 dit pourtant qu'ils gardent les familles existantes : c'est un écart à corriger.
3. **Les effets visuels ne déclenchent aucun son.** Le crochet `sfx` du combat est vide (`legacyCombatRuntime.js:195`), et aucune des 63 signatures de `fxSkills.ts` n'a de repère sonore. Une banque de 44 sons existe (`CombatSfx.ts`), non branchée. `COMBAT_HD2D.md:126` affirme le contraire et doit être corrigé.
4. **Une fois activés, les sons passent sous la musique.** 14 familles sur 16 sont plus faibles que la musique de combat dans leur bande principale, de 9 dB en médiane. Les impacts sont les plus couverts (-17 dB pour `physical-impact`, -16 dB pour `critical`).
5. **La musique tourne trop court.** La mélodie de combat revient toutes les 14,5 secondes, soit environ 41 fois en 10 minutes de combat.

## 2. Ce que le joueur entend aujourd'hui, réglages d'usine

| Moment | Musique | Ambiance | Effets |
| --- | --- | --- | --- |
| Titre | Oui | Non | Non, coupés par défaut |
| Carte des POI | Oui | Non | Non |
| Dialogue, refuge, gestion, voyage | Oui, la même piste pour tout | Non | Non |
| Combat normal ou élite | Oui, la même piste pour tous | Oui, inaudible sous la musique | Non |
| Combat de boss | Oui | Oui, inaudible sous la musique | Non |
| Ultime, effets activés | Oui | Idem | Aucun son, même activés |

## 3. Cadre contractuel

CURRENT FACT. Set 1.11.0, OD-2026-10-29-B et OD-2026-10-19-B. Presque toute l'ambition demandée sort du contrat actuel : un amendement dédié, relu puis approuvé, doit précéder le code (set 1.12.0). L'opérateur en décide ; aucun document LOCKED n'est modifié ici.

| Besoin | État | Clause |
| --- | --- | --- |
| Réécrire et réaccorder les cinq thèmes | Autorisé | Les agents peuvent écrire et régler la musique générée par code |
| Corriger le niveau de chaque son | Autorisé | Gain par son prévu par OD-2026-10-19-B |
| Rétablir les familles sur les ultimes | Autorisé, et dû | « they keep the existing family cues » |
| Formes plus longues, couches à l'intérieur d'une piste | À confirmer à la relecture | Un seul flux musical, cinq contextes |
| Plus de cinq contextes (humeurs de récit) | Amendement | « Five contexts » |
| Musique qui réagit au tour ou à l'action | Amendement | Le contexte vient seulement de la surface, du lieu et du rang boss |
| Effets actifs par défaut | Amendement | « Effects stay default off » |
| Son par élément ou par compétence | Amendement | « it adds no family » |
| Identité sonore des ultimes | Amendement | DEFERRED |
| Sons de plus d'une seconde | Amendement | Maximum 1 seconde par son |
| Ambiance hors combat | Amendement | Une ambiance par biome de combat |
| Musique enregistrée, achetée, ou par IA | Interdit | Reste interdit, sauf nouvelle décision |

Restent hors de portée quoi qu'il arrive : voix et audio vidéo (DEFERRED), et toute influence de l'audio sur le jeu. Rien dans l'audio ne porte une information indispensable.

## 4. Musique

Capture de la sortie réelle de `MusicDirector`, volume d'usine 0,6, 48 kHz.

| Piste | Mode, tempo | Boucle | Sonie | Écart de sonie | Crête | Énergie sous 250 Hz | Au-dessus de 2 kHz |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Titre | ré dorien, 68 | 28,2 s | -15,3 LUFS | 1,2 LU | -5,8 dB | 25 % | 0 % |
| Carte | sol mixolydien, 96 | 20,0 s | -16,7 LUFS | 1,3 LU | -6,4 dB | 15 % | 0 % |
| Dialogue | fa majeur à 3 temps, 60 | 24,0 s | -20,7 LUFS | 3,6 LU | -10,0 dB | 20 % | 0 % |
| Combat | la mineur, 132 | 14,5 s | -16,6 LUFS | 1,9 LU | -4,0 dB | 80 % | 0 % |
| Boss | ré phrygien, 112 | 17,1 s | -16,2 LUFS | 1,8 LU | -3,6 dB | 80 % | 1 % |

Constats :

- **Forme.** Chaque thème fait 8 mesures. Le compositeur re-voice l'accompagnement à chaque passage, mais la mélodie revient à l'identique ou ornée. Il n'y a ni partie B, ni montée, ni repos.
- **Intensité plate.** L'écart de sonie reste sous 4 LU partout : une piste ne monte ni ne redescend. Rien ne suit la dramaturgie d'un combat.
- **Identité.** Les cinq mélodies sont écrites séparément, sans motif commun pensé comme fil rouge. Rien ne relie le titre « La Voie des Sceaux » au Lion, aux Serpents, à Bois-Clair ou aux Ombres.
- **Palette.** La flûte mène 3 pistes sur 5, les cordes sont partout. Les registres se ressemblent d'une piste calme à l'autre.
- **Cohérence avec le récit.** La même berceuse en fa majeur accompagne le refuge, le prologue, le jugement final et des lignes comme « les flammes coupent la place en deux ». Le ton de la scène n'a aucun effet sur la musique.
- **Coût de la réflexion.** Le combat joue tambours et ostinato à 132 pendant que le joueur réfléchit à son tour, sans différence entre réflexion et action.
- **Combat et boss.** 80 % de l'énergie est sous 250 Hz, là même où vivent les impacts.
- **Fins de combat.** Pas de fanfare de victoire ou de défaite : un son d'une demi-seconde, coupé par défaut, puis un fondu vers la carte.

## 5. Sons

CURRENT FACT.

- **Interface.** 8 sons, bien répartis sur les écrans (`confirm`, `back`, `navigate` surtout). Pas de défaut de couverture relevé.
- **Combat.** 16 familles, 24 fichiers au total avec l'interface, plus 16 versions synthétisées à comparer (comparaison en attente, source « fichier » par défaut).
- **Lancement.** Sur 63 signatures : `light-blade` pour 29, `magic-cast` pour 16, rien pour 15, et une seule pour `heavy-weapon`, `thrust` et `bow-release`. `combatLaunchSound` lit le type d'arme, absent des compétences : la Frappe du Titan part sur un petit coup de lame.
- **Impact.** Deux sons (`physical-impact`, `magic-impact`) pour 16 éléments visuels (ombre, sang, feu, acier, saint, ciel, vent, terre, or, arcane, soin, glace, nature, poison, fumée, contondant).
- **Banque non branchée.** 44 sons de `CombatSfx.ts`, conçus pour suivre les recettes. Trois obstacles : ils ont leur propre contexte audio, 14 voix au lieu de 4, et 9 d'entre eux dépassent 1 seconde (`thunder`, `quake`, `holy`, `void`, `ultimate_hit`, `miracle`, `field_wave`, `victory`, `defeat`).
- **Trous dans le temps.** Une charge dure jusqu'à 1,5 seconde environ. Elle est muette sur un ultime, et sur une signature de boss seul le lancement sonne, au tout début.

## 6. Ambiances

| Biome | Sonie | Combats de `content.ts` |
| --- | --- | --- |
| Route forestière | -35,8 LUFS | 11 |
| Sanctuaire du Lion | -38,8 LUFS | 5 |
| Bois-Clair en feu | -37,0 LUFS | 2 |

Elles sont mono et environ 20 dB sous la musique de combat : elles ne s'entendent presque pas. Aucune ambiance sur la carte, au refuge ou en dialogue.

## 7. Mixage

- **Pas de bus commun.** Effets et musique vont chacun vers la sortie, sans limiteur final ni atténuation de la musique sur les grands moments.
- **Niveaux.** Musique d'usine : crête -3,6 dB. Sons de combat : crête -25 dB à l'usine (0,2 x 0,55 x 0,5).
- **Masquage, indicateur par bande d'octave, fichiers contre musique de combat :** `physical-impact` -16,9 dB, `critical` -15,7, `knockout` -11,8, `magic-impact` -11,6, médiane -9,2. Seuls `light-blade` et `miss` ressortent, parce qu'ils occupent l'aigu où la musique n'a rien. Les versions synthétisées gagnent 1 à 12 dB sur 14 familles sans régler le problème : 12 restent sous la musique.
- **Repère.** Une référence PC donne -18 LUFS pour le jeu complet (documentation Meta). La musique seule est déjà à -16.

## 8. Références vérifiées

CURRENT FACT, sources publiques. Elles donnent des procédés, jamais des mélodies à reprendre.

| Référence | Ce qui est établi | Ce qu'on en tire |
| --- | --- | --- |
| Final Fantasy Tactics (Sakimoto, Iwata) | Partition sombre, au service d'un récit politique, avec usage de leitmotifs | Le ton général et le fil rouge. Le jeu parle de clans, de sceaux et de choix lourds |
| Tactics Ogre: Reborn (Sakimoto) | Partition réenregistrée en orchestre, thèmes connus comme « Fight It Out! » | La tenue tactique. Le rendu orchestral réel reste hors d'atteinte du code |
| Octopath Traveler (Nishiki), le HD-2D de référence | « Battle I » est la piste la plus entendue ; le concept de « Decisive Battle I » mêle orchestre et batterie ; chaque héros a une intro qui s'enchaîne sans couture sur le thème de boss | Soigner d'abord le combat ordinaire. Enchaîner dialogue et boss sans coupure |
| Fire Emblem: Three Houses | Une même pièce existe en version Rain, calme, pendant la carte, et Thunder, percussive, pendant l'action ; « Between Heaven and Earth » les fait alterner (sources de fans) | La réponse directe au tour par tour : réflexion calme, action intense, même thème |
| Triangle Strategy (Senju) | 70 pistes sur 4 CD | Un jeu tactique narratif varie beaucoup ses pistes. Non transposable en volume à une démo |
| Musique adaptative | Couches verticales pour l'intensité, séquences horizontales pour les grands changements, souvent combinées | Le moteur actuel permet les deux |
| Conception de SFX | Attaque, corps, queue ; couches alignées sur le même instant ; un clic clair, un corps, un grave ; le son du sort tombe sur le geste à l'écran | La grammaire proposée ci-dessous |

Ce que ces sources n'établissent pas : aucune durée de boucle recommandée, aucune mesure de fatigue d'écoute, aucun chiffre Sony à jour. Les objectifs de durée et de sonie ci-dessous sont donc des hypothèses à valider à l'oreille.

Sources : [Final Fantasy Tactics, Wikipédia](https://en.wikipedia.org/wiki/Music_of_the_Final_Fantasy_Tactics_series), [analyse State of the Arc](https://www.castfox.net/podcast/state-of-the-arc-podcast-507329/episode/breaking-down-the-music-of-final-fantasy-tactics-state-of-the-arc-podcast-418470), [Tactics Ogre: Reborn](https://www.gonintendo.com/comments/4612), [Nishiki sur Decisive Battle I](https://gamingaudionews.com/2018/10/24/octopath-traveler-composer-yasunori-nishiki-on-writing-decisive-battle-i/), [Nishiki sur Battle I](https://www.gonintendo.com/stories/316063-octopath-traveler-s-composer-shares-detailed-thoughts-on-the-proc), [bibliothèque Three Houses](https://joekrausemusic.mymusicstaff.com/Fire-Emblem--Three-Houses), [Three Houses, guide musical](https://samurai-gamers.com/fire-emblem-three-houses/music-library/), [Triangle Strategy](https://www.siliconera.com/triangle-strategy-soundtrack-includes-4-discs-worth-of-music/), [structures hybrides GDC 2021](https://www.gamedeveloper.com/game-platforms/hybrid-horizontal-vertical-structure-for-game-music-composers-from-spyder-to-sackboy-gdc-2021-), [musique adaptative](https://en.wikipedia.org/wiki/Adaptive_music), [concevoir des SFX](https://violetrecording.com/how-to-design-sound-effects-for-games/), [sons d'armes](https://violetrecording.com/how-to-design-weapon-sounds/), [sonie Meta](https://developers.meta.com/horizon/documentation/unity/audio-loudness-meter-overview/).

## 9. Direction proposée

PROPOSED FUTURE DESIGN. Rien de ceci n'est décidé. Aucun élément n'ajoute de canon : ce sont des couleurs sonores sur des noms déjà présents dans le jeu.

**Ton général.** Une chronique grave de clan déchu, tenue et sobre, où l'espoir passe par la mélodie. Tactics Ogre et Final Fantasy Tactics pour la retenue, Octopath pour l'élan des boss.

**Musique, six règles :**

1. **Un fil rouge.** Un motif court de la Voie des Sceaux traverse toutes les pistes, transformé : entier au titre, à la harpe au refuge, aux cuivres graves face au boss.
2. **Des couleurs de camp.** Lion : cuivres et quintes. Serpents : demi-tons et mode phrygien. Bois-Clair : luth, flûte, tambour sur cadre. Ombres : chœur et silence.
3. **Le tour respire.** Une même piste de combat a un niveau Réflexion et un niveau Action.
4. **Une vraie forme.** Parties A, B et C, environ 1 min 30 pour le combat et la carte, avec des passages sans mélodie.
5. **Le récit choisit l'humeur.** Refuge, Tension, Drame, marqués par scène sans toucher au texte.
6. **La musique laisse la place.** Moins de grave en combat, et une musique qui s'efface sur les ultimes.

**Sons, une grammaire à trois couches :**

- **Attaque** : le geste ou l'arme, qui suit le type réel de la compétence.
- **Corps** : l'élément de la recette, parmi les 16 déjà définis côté visuel.
- **Poids** : le grave, selon le coût en PA et la taille de l'unité.

Les couches sont rendues d'avance en un seul son, ce qui garde le plafond de 4 voix. Les repères se posent sur les recettes, synchronisés sur `impactAt`, plus la charge et la vague pour les ultimes. Les 12 ultimes et les 8 signatures de boss sont faits sur mesure, les autres sortent de la grammaire.

**Mixage, cibles provisoires à valider à l'oreille :** musique de combat vers -22 LUFS, impacts nettement au-dessus d'elle dans leur bande, ambiance vers -30 LUFS, un limiteur final commun, une atténuation de 3 à 4 dB de la musique sur les ultimes.

**Limite assumée.** Le code ne rendra pas un orchestre réel. Le meilleur rendu visé est celui d'un orchestre séquencé, à l'esprit des jeux tactiques de l'ère PlayStation, qui s'accorde bien au pixel art.

## 10. Plan proposé

| Lot | Contenu | Cadre |
| --- | --- | --- |
| 0 | Rétablir les sons des ultimes, donner le bon lancement à chaque compétence, rééquilibrer musique et effets, corriger `COMBAT_HD2D.md` | Contrat actuel |
| 1 | Amendement 1.12.0 selon la fiche | Opérateur |
| 2 | Bus commun, limiteur, atténuation, effets par défaut | Après amendement |
| 3 | Motif, cinq thèmes réécrits, formes, niveaux Réflexion et Action, fanfares | Après amendement |
| 4 | Grammaire sonore, repères sur les 63 signatures et les 14 attaques ennemies, ultimes | Après amendement |
| 5 | Humeurs de récit, ambiances hors combat | Après amendement |
| 6 | Laboratoire d'écoute, validation à l'oreille, réglages finaux | Opérateur |

## 11. Limites de cet audit

- **Je n'entends rien.** Tout jugement esthétique ici découle de mesures et de la lecture du code. Seule ton écoute tranche.
- **Masquage.** C'est un indicateur par bande sur la moyenne de la musique, pas un modèle psychoacoustique.
- **Musique.** Deux passages capturés par piste, avec la graine par défaut.
- **Ultimes muets et effets coupés.** Lus dans le code, pas observés sur une session de campagne avec son réel.
- **Durée des combats.** Les « 41 retours » supposent 10 minutes : la vraie durée viendra du test PC.
- **Sources.** Celles sur Three Houses sont des sites de fans. L'entretien de Nishiki sur le HD-2D n'a pas pu être lu (page introuvable).

Méthode : `MusicDirector` réel enregistré dans Chromium par un AudioWorklet, sonie selon ITU-R BS.1770 avec portes, spectre par FFT.
