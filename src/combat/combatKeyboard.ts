/** Native controls own their activation; battlefield shortcuts handle unclaimed keys. */
export function shouldHandleCombatShortcut(event: Pick<KeyboardEvent, 'key' | 'target' | 'defaultPrevented'>): boolean {
  if (event.defaultPrevented) return false;
  if (event.key.toLowerCase() === 'escape') return true;
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return true;
  if ((target as HTMLElement).isContentEditable) return false;
  return !target.closest('button, input, textarea, select, a[href], summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="textbox"], [role="combobox"], [role="slider"], [role="spinbutton"]');
}

/** Inspection owns its native scrolling; the battlefield still blocks wheel input. */
export function shouldPreventCombatWheel(event: Pick<WheelEvent, 'target'>): boolean {
  return !(event.target instanceof Element && event.target.closest('#panel'));
}

/** Visual grid navigation only; activation/legality stay with tactical combat. */
export function nextCombatCursor(cell: { gx: number; gz: number }, key: string, width: number, depth: number): { gx: number; gz: number } {
  const dx = key === 'ArrowLeft' ? -1 : key === 'ArrowRight' ? 1 : 0;
  const dz = key === 'ArrowUp' ? -1 : key === 'ArrowDown' ? 1 : 0;
  return { gx: Math.max(0, Math.min(width - 1, cell.gx + dx)), gz: Math.max(0, Math.min(depth - 1, cell.gz + dz)) };
}
