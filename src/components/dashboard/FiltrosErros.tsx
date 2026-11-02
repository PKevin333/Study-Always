import { Search, SlidersHorizontal } from 'lucide-react';
import { ErrorType, Subject } from '../../types';
import { getSubjectColorHex } from '../../utils/subjectColors';
import { cn } from '../../lib/utils';

export type ErrorFilterTab = 'hoje' | 'todos' | 'dominados';

interface FiltrosErrosProps {
  search: string;
  subjectId: string;
  tab: ErrorFilterTab;
  type: ErrorType | 'todos';
  subjects: Subject[];
  counts: Record<ErrorFilterTab, number>;
  onSearchChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onTabChange: (value: ErrorFilterTab) => void;
  onTypeChange: (value: ErrorType | 'todos') => void;
}

const TABS: { value: ErrorFilterTab; label: string }[] = [
  { value: 'hoje', label: 'Revisar hoje' },
  { value: 'todos', label: 'Todos' },
  { value: 'dominados', label: 'Dominados' }
];

export function FiltrosErros({
  search,
  subjectId,
  tab,
  type,
  subjects,
  counts,
  onSearchChange,
  onSubjectChange,
  onTabChange,
  onTypeChange
}: FiltrosErrosProps) {
  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 shadow-sm" aria-label="Filtros do caderno de erros">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input
              value={search}
              onChange={event => onSearchChange(event.target.value)}
              placeholder="Buscar por assunto, conteúdo ou tag..."
              className="h-10 w-full rounded-lg border border-neutral-800 bg-neutral-950 pl-10 pr-4 text-sm text-text-primary outline-none placeholder:text-neutral-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              aria-label="Buscar erros"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal size={17} className="hidden text-text-secondary sm:block" />
            <select
              value={type}
              onChange={event => onTypeChange(event.target.value as ErrorType | 'todos')}
              className="h-10 flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 text-sm text-text-primary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 lg:min-w-44"
              aria-label="Filtrar por tipo de erro"
            >
              <option value="todos">Todos os tipos</option>
              <option value="atencao">Falta de atenção</option>
              <option value="nao_sabia">Não sabia</option>
              <option value="confusao">Confusão</option>
              <option value="pegadinha">Pegadinha</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Situação dos erros">
          {TABS.map(item => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={tab === item.value}
              onClick={() => onTabChange(item.value)}
              className={cn(
                'inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
                tab === item.value
                  ? 'border-brand-primary/40 bg-brand-primary/15 text-violet-200'
                  : 'border-transparent bg-neutral-800 text-neutral-300 hover:text-white'
              )}
            >
              {item.label}
              <span className={cn('rounded-full px-1.5 py-0.5 text-xs tabular-nums', tab === item.value ? 'bg-brand-primary/20 text-violet-200' : 'bg-neutral-900 text-neutral-400')}>
                {counts[item.value]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar por disciplina">
          <button
            type="button"
            onClick={() => onSubjectChange('todos')}
            className={cn(
              'h-9 shrink-0 rounded-lg border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
              subjectId === 'todos' ? 'border-brand-primary/40 bg-brand-primary/15 text-violet-200' : 'border-transparent bg-neutral-800 text-neutral-300 hover:text-white'
            )}
          >
            Todas
          </button>
          {subjects.map(subject => (
            <button
              key={subject.id}
              type="button"
              onClick={() => onSubjectChange(subject.id)}
              className={cn(
                'inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
                subjectId === subject.id ? 'border-brand-primary/40 bg-brand-primary/15 text-violet-200' : 'border-transparent bg-neutral-800 text-neutral-300 hover:text-white'
              )}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getSubjectColorHex(subject) }} />
              {subject.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
