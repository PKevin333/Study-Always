import React from 'react';
import { ArrowDown, ArrowUp, LayoutGrid, List as ListIcon, Search, Table2 } from 'lucide-react';
import type { FocusSort, FocusView, SortDirection } from './focusViewUtils';

interface SubjectCount {
  id: string;
  name: string;
  count: number;
}

interface FocoToolbarProps {
  view: FocusView;
  onViewChange: (view: FocusView) => void;
  search: string;
  onSearchChange: (value: string) => void;
  selectedSubject: string;
  onSubjectChange: (subjectId: string) => void;
  subjectCounts: SubjectCount[];
  sort: FocusSort;
  onSortChange: (sort: FocusSort) => void;
  direction: SortDirection;
  onDirectionToggle: () => void;
  count: number;
}

const viewOptions = [
  { value: 'cards' as const, label: 'Cards', icon: LayoutGrid },
  { value: 'list' as const, label: 'Lista', icon: ListIcon },
  { value: 'table' as const, label: 'Tabela', icon: Table2 },
];

const FocoToolbar: React.FC<FocoToolbarProps> = ({
  view,
  onViewChange,
  search,
  onSearchChange,
  selectedSubject,
  onSubjectChange,
  subjectCounts,
  sort,
  onSortChange,
  direction,
  onDirectionToggle,
  count,
}) => {
  const handleViewKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % viewOptions.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + viewOptions.length) % viewOptions.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = viewOptions.length - 1;
    else return;

    event.preventDefault();
    onViewChange(viewOptions[nextIndex].value);
    const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs?.[nextIndex]?.focus();
  };

  const totalCount = subjectCounts.reduce((total, subject) => total + subject.count, 0);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div
          role="tablist"
          aria-label="Modo de visualização"
          className="inline-flex h-10 shrink-0 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800"
        >
          {viewOptions.map((option, index) => {
            const Icon = option.icon;
            const isSelected = view === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => onViewChange(option.value)}
                onKeyDown={(event) => handleViewKeyDown(event, index)}
                className={`flex min-w-24 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isSelected
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                {option.label}
              </button>
            );
          })}
        </div>

        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Buscar por assunto</span>
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por assunto"
            className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="whitespace-nowrap">Ordenar por</span>
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as FocusSort)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm font-medium text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="performance">Desempenho</option>
              <option value="days">Dias sem ver</option>
              <option value="errors">Erros</option>
              <option value="topic">Assunto</option>
            </select>
          </label>
          <button
            type="button"
            onClick={onDirectionToggle}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-neutral-100 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:hover:bg-neutral-800"
            aria-label={direction === 'asc' ? 'Ordenação crescente' : 'Ordenação decrescente'}
            title={direction === 'asc' ? 'Ordenação crescente' : 'Ordenação decrescente'}
          >
            {direction === 'asc' ? <ArrowUp size={17} /> : <ArrowDown size={17} />}
          </button>
          <span className="ml-auto whitespace-nowrap text-sm font-semibold tabular-nums text-text-secondary xl:ml-0">
            {count} {count === 1 ? 'assunto' : 'assuntos'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Filtrar por disciplina">
        <button
          type="button"
          onClick={() => onSubjectChange('all')}
          className={`h-10 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            selectedSubject === 'all'
              ? 'bg-accent/10 text-accent'
              : 'bg-neutral-100 text-text-secondary hover:text-text-primary dark:bg-neutral-800'
          }`}
        >
          Todas <span className="ml-1 tabular-nums opacity-70">{totalCount}</span>
        </button>
        {subjectCounts.map((subject) => (
          <button
            key={subject.id}
            type="button"
            onClick={() => onSubjectChange(subject.id)}
            className={`h-10 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              selectedSubject === subject.id
                ? 'bg-accent/10 text-accent'
                : 'bg-neutral-100 text-text-secondary hover:text-text-primary dark:bg-neutral-800'
            }`}
          >
            {subject.name} <span className="ml-1 tabular-nums opacity-70">{subject.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FocoToolbar;
