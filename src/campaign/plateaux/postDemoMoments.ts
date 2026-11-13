/**
 * Set 1.20.0 (PRESENTATION_AND_MEDIA "Post-demo moments", OD-2026-11-07-I): the shape of a post-demo moment table. Each
 * plateau has its arrival, before its chief's first dialogue, and its honour and force outcomes, each after its
 * post-combat dialogue and before its epilogue; the final act has its Tournament betrayal and its three epilogues. A
 * moment lists the established facts its living tableau may show, never what the following dialogue says first, and
 * names the approved painting it plays on. The tables were validated by the operator on 2026-11-13
 * (PLATEAU_MOMENTS_DRAFT_2026-11-13, « Valider tel quel »). A moment the tables leave out does not play. Presentation only.
 */
export interface PostDemoMoment {
  readonly id: string;
  /** The dialogue the living tableau precedes; it takes that dialogue's mood. */
  readonly beforeDialogueId: string;
  /** For an outcome, the post-combat dialogue it follows. */
  readonly afterDialogueId?: string;
  /** The scene whose approved painting the living tableau plays on. */
  readonly sceneId: string;
  readonly maxSeconds: 30 | 40;
  readonly facts: readonly string[];
  readonly status: 'proposed' | 'approved';
  /** Approved once the plateau's final images are integrated (`hasProvisionalArt` false): a test keeps the two together. */
  readonly tableau: 'provisional' | 'approved';
}

/** A moment plays only once approved and on an approved tableau; until then, its dialogue plays directly. */
export function postDemoMomentPlays(moment: PostDemoMoment): boolean {
  return moment.status === 'approved' && moment.tableau === 'approved';
}
