import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import FocoActionsMenu from './FocoActionsMenu';
import {
  getPerformanceTone,
  type FocusActionHandlers,
  type FocusSort,
  type FocusViewItem,
  type SortDirection,
} from './focusViewUtils';

interface FocoTableProps extends FocusActionHandlers {
  items: FocusViewItem[];
  sort: FocusSort;
  direction: SortDirection;
  onSort: (sort: FocusSort) => void;
}

interface SortHeaderProps {
  label: string;
  value: FocusSort;
  activeSort: FocusSort;
  direction: SortDirection;
  onSort: (sort: FocusSort) => void;
  align?: 'left' | 'right';
}

const SortHeader: React.FC<SortHeaderProps> = ({
  label,
  value,
  activeSort,
  direction,
  onSort,
  align = 'left',
}) => {
  const isActive = activeSort === value;
  const Icon = isActive ? (direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th
      scope="col"
      aria-sort={isActive ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`sticky top-0 z-10 bg-card px-4 py-3 ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <button
        type="button"
        onClick={() => onSort(value)}
        className={`inline-flex h-10 items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          align === 'right' ? 'justify-end' : ''
        }`}
      >
        {label}
        <Icon size={14} aria-hidden="true" />
      </button>
    </th>
  );
};

const FocoTable: React.FC<FocoTableProps> = ({ items, sort, direction, onSort, ...actions }) => (
  <div className="max-h-[560px] overflow-auto rounded-xl border border-border bg-card shadow-sm">
    <table className="w-full min-w-[900px] border-collapse">
      <thead>
        <tr className="border-b border-border">
          <SortHeader label="Assunto" value="topic" activeSort={sort} direction={direction} onSort={onSort} />
          <th scope="col" className="sticky top-0 z-10 bg-card px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Disciplina
          </th>
          <SortHeader label="Desempenho" value="performance" activeSort={sort} direction={direction} onSort={onSort} align="right" />
          <SortHeader label="Erros" value="errors" activeSort={sort} direction={direction} onSort={onSort} align="right" />
          <SortHeader label="Dias sem ver" value="days" activeSort={sort} direction={direction} onSort={onSort} align="right" />
          <th scope="col" className="sticky top-0 z-10 bg-card px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Status
          </th>
          <th scope="col" className="sticky top-0 z-10 bg-card px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Ações
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const tone = getPerformanceTone(item.percentage);
          return (
            <tr
              key={item.key}
              className="h-[52px] border-b border-border/70 transition-colors even:bg-neutral-50/60 hover:bg-accent/5 dark:even:bg-neutral-900/60"
            >
              <td className="max-w-xs px-4 py-2 text-sm font-semibold text-text-primary">
                <span className="block truncate">{item.topic}</span>
              </td>
              <td className="px-4 py-2 text-sm text-text-secondary">{item.subjectName}</td>
              <td className="px-4 py-2 text-right">
                <div className="ml-auto w-32">
                  <span className={`block text-sm font-semibold tabular-nums ${tone.text}`}>{item.percentage}%</span>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                    <span className={`block h-full rounded-full ${tone.accent}`} style={{ width: `${Math.max(0, Math.min(100, item.percentage))}%` }} />
                  </span>
                </div>
              </td>
              <td className="px-4 py-2 text-right text-sm tabular-nums text-text-primary">{item.errors}</td>
              <td className="px-4 py-2 text-right text-sm tabular-nums text-text-primary">{item.daysSinceLastStudy}</td>
              <td className="px-4 py-2">
                <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${tone.badge}`}>{item.reason}</span>
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => actions.onStudy(item)}
                    className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    Estudar
                  </button>
                  <FocoActionsMenu item={item} {...actions} />
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default FocoTable;
