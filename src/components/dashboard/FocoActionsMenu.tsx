import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import type { FocusActionHandlers, FocusViewItem } from './focusViewUtils';

interface FocoActionsMenuProps extends FocusActionHandlers {
  item: FocusViewItem;
}

const FocoActionsMenu: React.FC<FocoActionsMenuProps> = ({
  item,
  onAddToCycle,
  onMarkReviewed,
  onRemove,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const runAction = (action: (focusItem: FocusViewItem) => void) => {
    action(item);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-neutral-100 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:hover:bg-neutral-800"
        aria-label={`Mais ações para ${item.topic}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MoreHorizontal size={18} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-30 w-48 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-md"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => runAction(onAddToCycle)}
            className="flex h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-text-primary transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:hover:bg-neutral-800"
          >
            <Plus size={16} aria-hidden="true" />
            + Ciclo
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => runAction(onMarkReviewed)}
            className="flex h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-text-primary transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:hover:bg-neutral-800"
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            Já Revisei
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => runAction(onRemove)}
            className="flex h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-text-secondary transition-colors hover:bg-red-500/10 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <Trash2 size={16} aria-hidden="true" />
            Remover do foco
          </button>
        </div>
      )}
    </div>
  );
};

export default FocoActionsMenu;
