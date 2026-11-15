/**
 * Translates what the DOM shows while English is on (OD-2026-11-15-C, A1): text nodes and the attributes a player
 * reads, as they appear, through the French-keyed catalog. It keeps each French original so French comes back exactly
 * when the player switches back. Nothing here reads or writes game state; in French it is never installed.
 */
export const READABLE_ATTRIBUTES = Object.freeze(['aria-label', 'title', 'alt', 'placeholder', 'aria-description',
  'aria-roledescription', 'aria-valuetext', 'data-final-text']);

/** Subtrees the translator leaves alone: code, the dialogue typewriter (translated whole by DialogueView), opt-outs. */
const SKIPPED = 'script, style, textarea, [translate="no"], [data-i18n-skip], .dialogue__text-reveal';

interface Pair { fr: string; en: string }

export class DomTranslator {
  private readonly texts = new WeakMap<Text, Pair>();
  private readonly attributes = new WeakMap<Element, Map<string, Pair>>();
  private observer: MutationObserver | null = null;

  constructor(private readonly doc: Document, private readonly translate: (text: string) => string) {}

  get active(): boolean { return this.observer !== null; }

  start(): void {
    if (this.observer) return;
    this.translateTree(this.doc.documentElement);
    const View = this.doc.defaultView?.MutationObserver ?? MutationObserver;
    this.observer = new View((records) => this.onMutations(records));
    this.observer.observe(this.doc.documentElement, {
      subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...READABLE_ATTRIBUTES],
    });
  }

  /** Stops and puts every French original back where the text still shows its English. */
  stop(): void {
    if (!this.observer) return;
    this.observer.disconnect();
    this.observer = null;
    this.walk(this.doc.documentElement, (text) => {
      const pair = this.texts.get(text);
      if (pair && text.data === pair.en) text.data = pair.fr;
    }, (element) => {
      const pairs = this.attributes.get(element);
      if (!pairs) return;
      for (const [name, pair] of pairs) if (element.getAttribute(name) === pair.en) element.setAttribute(name, pair.fr);
    });
  }

  translateTree(node: Node): void {
    this.walk(node, (text) => this.translateText(text), (element) => {
      for (const name of READABLE_ATTRIBUTES) if (element.hasAttribute(name)) this.translateAttribute(element, name);
    });
  }

  private onMutations(records: MutationRecord[]): void {
    for (const record of records) {
      if (record.type === 'childList') record.addedNodes.forEach((node) => this.translateTree(node));
      else if (record.type === 'characterData') this.translateText(record.target as Text);
      else if (record.type === 'attributes' && record.attributeName) this.translateAttribute(record.target as Element, record.attributeName);
    }
  }

  private translateText(text: Text): void {
    const parent = text.parentElement;
    if (!parent || !text.isConnected || parent.closest(SKIPPED)) return;
    const value = text.data;
    if (this.texts.get(text)?.en === value) return;
    const english = this.translate(value);
    if (english === value) return;
    this.texts.set(text, { fr: value, en: english });
    text.data = english;
  }

  private translateAttribute(element: Element, name: string): void {
    if (element.closest(SKIPPED) && !(name === 'data-final-text' && element.classList.contains('dialogue__text'))) return;
    const value = element.getAttribute(name);
    if (value === null) return;
    const pairs = this.attributes.get(element) ?? new Map<string, Pair>();
    if (pairs.get(name)?.en === value) return;
    const english = this.translate(value);
    if (english === value) return;
    pairs.set(name, { fr: value, en: english });
    this.attributes.set(element, pairs);
    element.setAttribute(name, english);
  }

  private walk(root: Node, onText: (text: Text) => void, onElement: (element: Element) => void): void {
    if (root.nodeType === 3) { onText(root as Text); return; }
    if (root.nodeType !== 1) return;
    const element = root as Element;
    if (element.closest(SKIPPED)) return;
    onElement(element);
    const walker = this.doc.createTreeWalker(element, 1 | 4, {
      acceptNode: (node) => node.nodeType === 1 && (node as Element).matches(SKIPPED) ? 2 : 1,
    });
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.nodeType === 3) onText(node as Text);
      else onElement(node as Element);
    }
  }
}
