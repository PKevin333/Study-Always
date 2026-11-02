import React from 'react';
import FocoActionsMenu from './FocoActionsMenu';
import { getPerformanceTone, type FocusActionHandlers, type FocusViewItem } from './focusViewUtils';

interface FocoListProps extends FocusActionHandlers {
  items: FocusViewItem[];
}

const FocoList: React.FC<FocoListProps> = ({ items, ...actions }) => (
  <div className="overflow-visible rounded-xl border border-border bg-card shadow-sm">
    {items.map((item, index) => {
      const tone = getPerformanceTone(item.percentage);
      return (
        <div
          key={item.key}
          className={`relative flex min-h-16 items-center gap-4 px-4 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900 ${
            index < items.length - 1 ? 'border-b border-border' : ''
          }`}
        >
          <span className={`absolute inset-y-2 left-0 w-[3px] rounded-r-full ${tone.accent}`} aria-hidden="true" />

          <div className="min-w-0 flex-1 pl-2">
            <p className="truncate text-sm font-semibold text-text-primary">{item.topic}</p>
            <p className="truncate text-xs text-text-secondary">{item.subjectName}</p>
          </div>

          <div className="hidden items-center gap-6 text-xs text-text-secondary sm:flex">
            <span><strong className="font-semibold tabular-nums text-text-primary">{item.errors}</strong> erros</span>
            <span><strong className="font-semibold tabular-nums text-text-primary">{item.daysSinceLastStudy}</strong> dias sem ver</span>
          </div>

          <span className={`min-w-16 text-right font-serif text-2xl font-semibold tabular-nums ${tone.text}`}>
            {item.percentage}%
          </span>

          <button
            type="button"
            onClick={() => actions.onStudy(item)}
            className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Estudar
          </button>
          <FocoActionsMenu item={item} {...actions} />
        </div>
      );
    })}
  </div>
);

export default FocoList;
