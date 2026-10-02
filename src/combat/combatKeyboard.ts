/** Native controls own their activation; battlefield shortcuts handle unclaimed keys. */
export function shouldHandleCombatShortcut(event: Pick<KeyboardEvent, 'key' | 'target' | 'defaultPrevented'>): boolean {
  if (event.defaultPrevented) return false;
  if (event.key.toLowerCase() === 'escape') return true;
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return true;
  if ((target as HTMLElement).isContentEditable) return false;
  return !target.closest('button, input, textarea, select, a[href], summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="textbox"], [role="combobox"], [role="slider"], [role="spinbutton"]');
}
