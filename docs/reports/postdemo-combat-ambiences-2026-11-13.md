# Ambiances de combat de l’après-démo

| Champ | Valeur |
| --- | --- |
| TASK | POSTDEMO-COMBAT-AMBIENCES-2026-11-13 |
| DOMAIN | Audio (présentation : ambiances synthétisées des combats), Ours, Dragon, Scorpion, acte final |
| BASELINE | `3be080ab` sur `dev` ; jeu de contrats 1.22.0, baseline immuable `5a61d319e449e8328fe63449516b554da96f43b7` |
| BRANCH | `claude/silly-banach-72f872` (worktree `wizardly-golick-53b32b`, créée depuis `dev`), publiée sur `origin/dev` |
| HEAD | le commit qui porte ce rapport (code, tests, outils et rapport) ; l’empreinte « avant » est le commit `3b6c843e`, posé sur `3be080ab` avant toute modification du son |
| STATUS | merged |
| MERGED_IN | `origin/dev` (poussée normale, OD-2026-10-12-A) |
| SUPERSEDES | NONE |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Les vingt arènes de l’après-démo jouent chacune l’une des six ambiances synthétisées de la liste fermée du jeu 1.20.0 au lieu d’emprunter celles du Lion. Présentation seule : aucune résolution, aucun résultat, aucune récompense, aucune sauvegarde ; aucun état audio sérialisé. Les trois ambiances de combat du Lion, la carte, le refuge, la musique et les cues sont identiques à l’octet (test). Le laboratoire d’écoute (dev, `/?qa=1`) gagne une section « Ambiances des plateaux ». |
| CANONICAL_DOCS_UPDATED | NONE : la session parente consigne le résultat dans l’état autonome et les décisions. Aucun contrat, aucun canon, aucun champ de sauvegarde. |
| EVIDENCE | Tests ci-dessous ; mesures hors ligne `tools/audio/ambience-check.mjs` (résultat dans `tmp/postdemo-ambiences/measures.json`, dossier ignoré) ; contrôle navigateur à vrais clics `tools/audio/ambience-lab-check.mjs` (`tmp/postdemo-ambiences-lab.txt`) ; six extraits WAV de 30 s dans `tmp/postdemo-ambiences/` (ignorés, non promus). Aucune mesure ne vaut écoute : seule l’oreille de l’opérateur accepte. |

## 1. Ce qui manquait

Le jeu 1.20.0 (`COMBAT_AND_VFX.md`, « Sound and FX ») ajoute à la liste fermée du jeu 1.11.0 une ambience synthétisée par nouveau biome de combat : les montagnes de l’Ours, les pics du Dragon, le désert du Scorpion, l’arène du Tournoi, la capitale corrompue et la brèche. Aucune n’existait : chaque arène de l’après-démo empruntait par son `ArenaTheme.sound` la route forestière, Bois-Clair en feu ou le sanctuaire du Lion. On entendait donc les grillons et la cloche de nuit du Lion dans les galeries de l’Ours, le temple du Phénix et le cœur de la brèche, et le vent de la forêt verte sur la piste des dunes et au Tournoi.

## 2. Les six ambiances

Synthèse Web Audio seule (`src/audio/music/ambiencePostDemo.ts`), déterministe à partir de sa définition et de sa graine (un hachage de son nom : aucune ne partage le bruit ou la suite d’accents d’une autre, ni d’une ambiance de la démo). Chaque lit lit six secondes de bruit blanc semé, chaque couche à son propre décalage ; la couleur et le niveau de chaque couche ondulent sur deux sinus lents à des fréquences incommensurables, si bien que rien ne se répète et qu’il n’y a pas de couture de boucle. Les accents sont semés et planifiés à l’avance sur l’horloge audio. Les identités suivent celles validées pour les images (`IDENTITY` de `tools/art/finalImagesStaging.ts`, lu seulement).

| Ambiance | Couches | Accents |
| --- | --- | --- |
| `bear_mountains` | le corps du vent sur le granit (passe-bas grave), son hurlement le long des crêtes (bande étroite qui glisse), la neige poussée dans les rafales (souffle aigu qui suit les rafales), le souffle bas d’un brasero | crépitements du brasero, une poutre d’étai qui grince, une chaîne de treuil qui cogne, des éboulis lointains |
| `dragon_peaks` | le chuchotement de la mer de nuages (deux lits larges, gauche et droite), un vent haut et mince, l’air raréfié, deux crêtes qui sifflent (bandes très étroites) | une cloche de bronze à travers la vallée (partiels inharmoniques de cloche, battant, écho en trois répétitions), parfois sonnée deux fois ; de petites clochettes d’ermitage |
| `scorpion_desert` | un vent sec sur les dunes, sa poussée grave, le sable soufflé avec les rafales | des grains qui glissent sur la face d’une dune, une dune qui gronde au loin (bourdon grave de plusieurs secondes), un insecte qui stridule dans la chaleur |
| `tournament_arena` | l’air libre au-dessus des gradins ; la rumeur des gradins : trois bandes de bruit qui bougent trop lentement et trop doucement pour porter une syllabe | la foule qui monte et retombe, parfois des applaudissements ; une bannière de clan qui claque ; les drisses qui tintent contre les mâts |
| `corrupted_capital` | le vent dans les rues de brique, sa note creuse à travers les murs crevés, la ville qui brûle au-delà des toits, la présence basse de l’encre (accord grave dissonant) | des braises, des pans de maçonnerie qui cèdent (son direct et écho dans la rue) |
| `breach` | l’air froid du cratère, des feux loin derrière, la profondeur de la déchirure (accord sub-grave), son liseré blanc et froid (sinus aigus tremblants) | la brèche qui prend son souffle, l’encre qui tombe goutte à goutte sur les pavés, le sol qui cède sous l’encre |

**Aucune voix.** Pas de parole, de mot ni de chant. La foule du Tournoi est du bruit filtré en trois bandes, dont les mouvements (moins d’un hertz) sont bien plus lents que des syllabes, avec des houles et des applaudissements : une texture sans mots. Je la signale tout de même à l’opérateur, comme la consigne le demandait en cas de doute.

## 3. Quelle arène joue quelle ambiance

| Arène | Ambiance | Pourquoi |
| --- | --- | --- |
| `bear_mountain_pass`, `bear_hall_terrace` | `bear_mountains` | plateau de l’Ours |
| `bear_mine_galleries` | `bear_mountains` | les galeries sont creusées dans la même montagne : son vent dans les puits, les braseros, les chaînes du treuil |
| `dragon_peak_trail`, `dragon_snowy_summit`, `dragon_hall_esplanade` | `dragon_peaks` | plateau du Dragon |
| `dragon_wolf_cave` | `dragon_peaks` | le repaire du Loup est dans les pics du Dragon : leur vent à l’entrée, leurs cloches au loin de l’autre côté de la vallée |
| `scorpion_dune_track`, `scorpion_dune_crest`, `scorpion_phoenix_ruins`, `scorpion_records_court` | `scorpion_desert` | plateau du Scorpion |
| `scorpion_phoenix_temple`, `scorpion_ash_sanctuary` | `scorpion_desert` | le temple et le sanctuaire du Phénix sont dans le même désert (`IDENTITY.scorpion`) : son vent sec par les portes |
| `finale_destiny_arena` | `tournament_arena` | l’Arène des Destins le jour du Tournoi |
| `finale_arena_breach` | `breach` | la même arène la nuit de la trahison : les gradins sont vides et brûlent, la brèche se dresse sur le sable. Pas de foule : la brèche |
| `finale_breach_heart` | `breach` | le cœur de la brèche |
| `finale_burning_streets`, `finale_smoke_square`, `finale_rampart_reserve` | `corrupted_capital` | la capitale en feu, sous la fumée, ses remparts |
| `finale_breach_scar` | `corrupted_capital` | le cratère une fois la brèche refermée : il ne reste que la ville qu’elle a marquée, pas le son de la déchirure |

La règle de l’acte final : l’arène du Tournoi pour le jour du Tournoi, la brèche partout où la déchirure est ouverte sur le terrain, la capitale corrompue ailleurs dans la ville. Seules les six ambiances de la liste fermée sont utilisées ; aucune septième n’est construite.

**À proposer à l’opérateur s’il le souhaite (non construit) :** trois arènes s’écartent de leur lieu exact. Le repaire du Loup entend les cloches du Dragon dans une caverne qui n’en a pas. Le temple et le sanctuaire du Phénix sont des intérieurs avec un vent du désert. Le cratère refermé garde les feux lointains et les braises de la capitale alors que l’arène indique « ni feu ». Si l’oreille de l’opérateur le demande, une ambiance « intérieur » ou « après la brèche » serait une septième ambiance, donc un amendement à proposer et non à construire.

## 4. Ce qui ne change pas

- `src/audio/music/ambience.ts` garde, pour les cinq lits de la démo, leur graine (`0xa3b1 + longueur du nom × 977`), leur bruit de deux secondes, leur code et l’ordre de leurs appels. Seuls changent l’horloge des accents, devenue un paramètre (la même horloge audio et les mêmes minuteurs de la page par défaut, une horloge virtuelle pour les rendus hors ligne), et l’aiguillage des six nouveaux biomes.
- `src/audio/lionAudioUnchanged.test.ts` et `src/audio/lionAudio.digests.json`. Un contexte audio enregistreur (`src/audio/traceAudio.ts`) note chaque nœud, chaque propriété, chaque paramètre, chaque automation, connexion, démarrage, arrêt et chaque octet de tampon. Il a servi à enregistrer, sur `3be080ab` et avant toute modification (commit `3b6c843e`), l’empreinte de cinq choses :
  - les trois ambiances de combat du Lion, la carte et le refuge, sur deux minutes de leur horloge puis leur arrêt ;
  - les neuf contextes musicaux (définition écrite et deux tours du générateur) ;
  - les 83 échantillons de la banque ;
  - les trois salles ;
  - les 158 cues de la table (graphe complet).

  Après le changement, le même test redonne exactement les mêmes empreintes.
- Les arènes : `arenaUnchanged.test.ts` lit chaque thème avec le son qu’il avait à l’enregistrement de son empreinte. Les empreintes au pixel de l’Ours, du Dragon et du Scorpion restent celles enregistrées, et le test passe sans changement : aucun pixel n’a bougé.
- Aucun fichier de la musique (`themes.ts`, `compose.ts`, `MusicDirector.ts`, `moods.ts`, cues) n’est modifié ; seul le test de correspondance scène → ambiance de `music.test.ts` change.

## 5. Vérifications

Mesures hors ligne (`node tools/audio/ambience-check.mjs http://localhost:5177/`, Chromium headless, 48 kHz). Chaque lit est rendu sur une horloge virtuelle à travers la chaîne du jeu : bus d'ambiance (×2,2), volume musique (courbe du `MusicDirector`) et limiteur final (`createMix`). La sonie est la sonie BS.1770 pondérée K, non fenêtrée, mesurée au volume musique par défaut (0,6) et après le fondu d'entrée.

| Lit | Sonie (LUFS) | Pic (dBFS) | Pic, mix le plus fort, défaut / max (dBFS) | Construction (ms, hors ligne / en direct) | Accent le plus lent (ms) | Tâches longues en direct |
| --- | --- | --- | --- | --- | --- | --- |
| `forest_route` (démo) | −28,72 | −19,61 | — | 5,1 | 0,3 | — |
| `bois_clair_burning` (démo) | −29,08 | −15,78 | — | 3,2 | 0,4 | — |
| `lion_sanctum` (démo) | −31,72 | −21,57 | — | 3,7 | 0,6 | — |
| `map` (démo) | −30,28 | −21,72 | — | 7,1 | 0,1 | — |
| `refuge` (démo) | −30,51 | −18,39 | — | 4,9 | 0,2 | — |
| `bear_mountains` | −29,80 | −15,76 | −1,28 / −1,16 | 17,9 / 4,3 | 0,6 | aucune |
| `dragon_peaks` | −29,72 | −16,19 | −1,27 / −1,17 | 6,5 / 9,6 | 0,5 | aucune |
| `scorpion_desert` | −29,80 | −17,80 | −1,24 / −1,16 | 5,9 / 5,1 | 2,7 | aucune |
| `tournament_arena` | −29,80 | −17,12 | −1,26 / −1,17 | 5,6 / 4,6 | 1,7 | aucune |
| `corrupted_capital` | −29,75 | −17,77 | −1,28 / −1,14 | 4,3 / 5,2 | 0,4 | aucune |
| `breach` | −29,83 | −17,32 | −1,28 / −1,19 | 5,8 / 2,6 | 0,3 | aucune |

- **Sonie.** Les cinq lits de la démo vont de −28,7 à −31,7 LUFS. Chaque nouveau lit a un gain propre (`LEVEL`), réglé sur la moyenne des trois lits de combat du Lion, −29,8 LUFS. Avant réglage, ils allaient de −26,8 (la brèche, dominée par son accord sub-grave, que j'ai baissé au profit de l'air du cratère et du liseré) à −37,3 (l'arène du Tournoi).
- **Limiteur (règle « Mix » du jeu 1.12.0).** Le mix le plus fort réunit la vraie piste de boss au niveau Action, enregistrée sur le moteur réel au volume par défaut puis au volume maximal, le lit, et quatre voix du cue de signature `sig.boss_apocalypse.blow` à leur pic toutes les 0,75 s. Il reste sous le plafond de −1 dBFS dans les douze cas (pire : −1,14 dBFS).
- **Fil principal.** Construire un lit coûte au plus 17,9 ms à froid hors ligne et 9,6 ms en direct ; aucun accent sur deux minutes ne dépasse 2,7 ms ; aucune tâche longue n'apparaît pendant six secondes de lecture en direct de chaque lit. Tout reste sous la limite de 50 ms.
- **Profils.** Les profils par octave diffèrent de ceux de la démo : l'Ours concentre le grave et l'aigu de la neige soufflée et creuse les médiums ; le désert est le plus brillant ; la capitale et la brèche sont dominées par le grave ; le Dragon et le Tournoi sont centrés dans les médiums avec des aigus. Ce n'est pas une preuve d'identité sonore : seule l'oreille en juge.
- **Extraits.** Six WAV de 30 s (stéréo, 16 bits, 48 kHz), rendus au volume musique maximal à travers la même chaîne, dans `tmp/postdemo-ambiences/` (ignoré, non promu), envoyés à l'opérateur.

Contrôle navigateur à vrais clics (`node tools/audio/ambience-lab-check.mjs http://localhost:5177/`, Playwright, sans drapeau d'autolecture). Chaque lit est reconnu à son tampon de bruit, dont les premiers échantillons viennent de sa graine.

- **Laboratoire.** Après le clic sur « QA rencontres », le laboratoire d'écoute annonce « Tout est prêt ». Après « Arrêter tout », chacun des six boutons « Jouer » de la section « Ambiances des plateaux » démarre son propre lit, et la sortie se mesure entre −29,8 et −33,1 dB RMS.
- **Un combat par biome.** `bear_pass_beasts` démarre `bear_mountains`, `dragon_lair_assault` (repaire du Loup) `dragon_peaks`, `scorpion_temple_assault` (temple du Phénix) `scorpion_desert`, `finale_raven_bout` `tournament_arena`, `finale_demon_square` `corrupted_capital` et `finale_arena_assault` `breach`. Aucun lit de la démo ne démarre dans ces combats.
- **Erreurs.** Aucune erreur de page, aucune requête de média manquant.
- **Panneau du navigateur.** Celui de l'application ne s'est pas dessiné (fenêtre masquée) : aucune capture d'écran.

Tests et validation :

- **Garde des contrats.** `git diff --exit-code 5a61d319e449e8328fe63449516b554da96f43b7 HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md` n'affiche rien. `npm run -s contracts:validate` valide les 8 contrats verrouillés et les 8 identifiants médias historiques.
- **Types et build.** `npx tsc --noEmit` passe. `npm run -s build` passe (seulement l'avertissement habituel sur la taille des morceaux).
- **Suite vitest complète.** 3 406 tests passent, puis 3 407 après la fusion d’`origin/dev` (`6b9647d5` : poses de combat du Dragon, du Scorpion et de l’acte final, noms d’armes du Corbeau ; aucun fichier commun), où la garde, le validateur, `tsc`, le build et `qa-job` ont été relancés avec le même résultat. Les 10 échecs sont tous connus d'un worktree neuf : il y manque des médias ignorés par Git (`public/assets/vfx/megapack-runtime/*.png` pour `spritesheetPng.test.ts`, des fichiers `tmp/cinematics/…` pour trois tests historiques de `tools/cinematics/`). Aucun ne touche l'audio ni les arènes.
- **`node --test tools/qa/qa-job.test.mjs`**, lancé seul : 26 sur 26.
- **Tests ciblés.**
  - `src/audio/lionAudioUnchanged.test.ts` (nouveau) : le son de la démo est identique à l'octet ; les empreintes ont été enregistrées avant le changement.
  - `src/audio/music/ambience.test.ts` (nouveau) : liste fermée, chaque arène sur l'une des neuf, déterminisme, onze lits distincts, sources et minuteurs arrêtés.
  - `music.test.ts` et `arenaThemes.test.ts` : la nouvelle correspondance.
  - `arenaUnchanged.test.ts` : les pixels sont inchangés, avec les empreintes enregistrées.
  - `AudioListeningLab.test.ts` : onze lignes d'ambiance, dont les six des plateaux.
  - `cues.test.ts`, `CombatBridgeAudio.test.ts` et `finaleArenas.test.ts` passent.
- **`git diff --check`** est propre.

**Non vérifié.** Le rendu sonore lui-même, c'est-à-dire si chaque ambiance sonne juste, se distingue à l'oreille, colle à son plateau et s'accorde avec la musique : seule l'écoute de l'opérateur en juge. Ni le passage d'un combat à l'autre en jeu complet (fondu enchaîné entre deux lits), ni un appareil mobile n'ont été vérifiés.

## 6. Écoute de l’opérateur

Le 2026-11-13, après avoir écouté les six ambiances dans le laboratoire, l’opérateur a répondu : « tout est bon on reviendra plus tard ». Il ne demande aucune retouche pour l’instant. Les six ambiances et la correspondance des arènes restent telles que construites, y compris les trois écarts de lieu signalés à la section 3 ; aucune septième ambiance n’est proposée. L’opérateur se réserve une nouvelle écoute plus tard : ce retour n’est pas une acceptation artistique définitive. Les retouches qu’il demandera alors suivront la même méthode : mesures hors ligne (`tools/audio/ambience-check.mjs --quick`), test d’identité à l’octet maintenu au vert, contrôle navigateur.
