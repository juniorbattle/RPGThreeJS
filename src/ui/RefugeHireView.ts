import type { RefugeHireOffer } from '../game/refugeRecruitment';

/**
 * OD-2026-11-11-F (F2): the refuge's list of heroes met but not recruited. Presentation only: it shows the offers that
 * RunSystem computed and returns the one the player picks, or null; refugeRecruitment.ts decides and applies.
 */
export class RefugeHireView {
  private element: HTMLElement | null = null;
  private settle: ((unitId: string | null) => void) | null = null;

  constructor(private readonly root: HTMLElement) {}

  open(offers: readonly RefugeHireOffer[], gold: number): Promise<string | null> {
    this.close();
    const section = document.createElement('section');
    section.className = 'refuge-hire ui-screen';
    section.setAttribute('role', 'dialog');
    section.setAttribute('aria-modal', 'true');
    section.setAttribute('aria-labelledby', 'refuge-hire-title');
    const card = document.createElement('div');
    card.className = 'refuge-hire__card';
    const title = document.createElement('h2');
    title.id = 'refuge-hire-title';
    title.textContent = 'Engager un compagnon';
    const lead = document.createElement('p');
    lead.className = 'refuge-hire__lead';
    lead.textContent = `Des héros que la compagnie a rencontrés sans les recruter attendent au refuge. Or disponible : ${gold}.`;
    const list = document.createElement('div');
    list.className = 'refuge-hire__list';
    for (const offer of offers) {
      const row = document.createElement('div');
      row.className = 'refuge-hire__offer';
      const name = document.createElement('b');
      name.textContent = `${offer.name} · ${offer.className}`;
      const detail = document.createElement('small');
      detail.textContent = `Rencontré : ${offer.metAt} · ${offer.price} or${offer.reputationMin ? ` · réputation ${offer.reputationMin}` : ''}`;
      const hire = document.createElement('button');
      hire.type = 'button';
      hire.dataset.hire = offer.unitId;
      hire.textContent = offer.blocked ?? `Engager ${offer.name}`;
      hire.disabled = Boolean(offer.blocked);
      hire.addEventListener('click', () => this.finish(offer.unitId));
      row.append(name, detail, hire);
      list.append(row);
    }
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'refuge-hire__back';
    back.textContent = 'Retour au refuge';
    back.addEventListener('click', () => this.finish(null));
    card.append(title, lead, list, back);
    section.append(card);
    section.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { event.preventDefault(); this.finish(null); return; }
      if (event.key !== 'Tab') return;
      const focusable = [...section.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
      if (!focusable.length) return;
      const first = focusable[0]!, last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    this.root.append(section);
    this.element = section;
    (section.querySelector<HTMLButtonElement>('[data-hire]:not(:disabled)') ?? back).focus();
    return new Promise((resolve) => { this.settle = resolve; });
  }

  close(): void {
    this.element?.remove();
    this.element = null;
    const settle = this.settle;
    this.settle = null;
    settle?.(null);
  }

  private finish(unitId: string | null): void {
    const settle = this.settle;
    this.settle = null;
    this.element?.remove();
    this.element = null;
    settle?.(unitId);
  }
}
