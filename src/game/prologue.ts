export interface ProloguePanel {
  id: 'prologue_fall' | 'prologue_seals' | 'prologue_lion' | 'prologue_shadow' | 'prologue_departure';
  /** Shown one after the other by `OpeningSequence` (OD-2026-11-02-A). */
  lines: readonly string[];
}

export const prologuePanels: readonly ProloguePanel[] = [
  {
    id: 'prologue_fall',
    lines: ['Votre nom fut jadis prononcé parmi les grands.', 'Puis vinrent la défaite, les serments rompus et les bannières brisées.'],
  },
  {
    id: 'prologue_seals',
    lines: ['Les Sceaux ne répondent ni aux titres ni au sang. Ils jugent les actes.', 'Pour entrer au Tournoi des Grands, il nous faut les quatre Sceaux des quatre seigneurs.'],
  },
  {
    id: 'prologue_lion',
    lines: ['Bois-Clair brûle sous les torches des Serpents.'],
  },
  {
    id: 'prologue_shadow',
    lines: ['Des marques anciennes apparaissent dans la cendre, et des silhouettes sans bannière marchent derrière les clans comme une seconde guerre.'],
  },
  {
    id: 'prologue_departure',
    lines: ['Chaque détour peut sauver une vie, remplir un coffre, attirer une recrue ou réveiller un danger.'],
  },
];
