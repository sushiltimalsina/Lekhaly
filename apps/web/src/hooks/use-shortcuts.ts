import { useEffect } from 'react';

type ShortcutHandler = (e: KeyboardEvent) => void;

export function useShortcuts(shortcuts: Record<string, ShortcutHandler>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      const activeElement = document.activeElement;
      const isInput = activeElement instanceof HTMLInputElement || 
                      activeElement instanceof HTMLTextAreaElement ||
                      (activeElement as HTMLElement)?.isContentEditable;

      if (isInput && !(event.key === 'Escape')) return;

      const keys = [];
      if (event.ctrlKey || event.metaKey) keys.push('mod');
      if (event.altKey) keys.push('alt');
      if (event.shiftKey) keys.push('shift');
      keys.push(event.key.toLowerCase());

      const shortcutKey = keys.join('+');
      
      if (shortcuts[shortcutKey]) {
        event.preventDefault();
        shortcuts[shortcutKey](event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
