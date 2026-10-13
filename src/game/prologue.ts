export interface ProloguePanel {
  id: 'prologue_fall' | 'prologue_seals' | 'prologue_lion' | 'prologue_shadow' | 'prologue_departure';
  eyebrow: string;
  title: string;
  body: string;
}

export const prologuePanels: readonly ProloguePanel[] = [
  {
    id: 'prologue_fall',
    eyebrow: 'Chronique oubliée',
    title: 'Le clan déchu',
    body: 'Votre nom fut jadis prononcé parmi les grands. Puis vinrent la défaite, les serments rompus et les bannières brisées. Il ne resta qu’une compagnie sans terre, tolérée sur les routes et regardée comme un avertissement.',
  },
  {
    id: 'prologue_seals',
    eyebrow: 'La voie des Sceaux',
    title: 'Regagner une place',
    body: 'Les Sceaux ne répondent ni aux titres ni au sang. Ils jugent les actes. En les rassemblant, votre clan peut réclamer de nouveau une place dans l’ordre ancien — ou devenir quelque chose que les anciens clans redoutent.',
  },
  {
    id: 'prologue_lion',
    eyebrow: 'Phase du Lion',
    title: 'L’épreuve d’Alaric',
    body: 'Le Vieux Lion accepte de vous entendre. Sa première demande est simple à dire, difficile à porter : Bois-Clair brûle sous les torches des Serpents. Sauvez ce qui peut encore l’être.',
  },
  {
    id: 'prologue_shadow',
    eyebrow: 'Sous les routes',
    title: 'Ce qui manipule',
    body: 'Mais les raids ne suivent pas seulement la faim ou la haine. Des marques anciennes apparaissent dans la cendre, et des silhouettes sans bannière marchent derrière les clans comme une seconde guerre.',
  },
  {
    id: 'prologue_departure',
    eyebrow: 'Premier pas',
    title: 'Choisir la route',
    body: 'À l’aube, la compagnie quitte le camp. Chaque détour peut sauver une vie, remplir un coffre, attirer une recrue ou réveiller un danger. La chronique commence par un choix de route.',
  },
];
