import React from 'react';
import { CalendarClock, Check, Pencil, Trash2 } from 'lucide-react';
import { ErrorType, StudyError, Subject } from '../../types';
import { getSubjectColorHex } from '../../utils/subjectColors';
import { AnexosGrid } from './AnexosGrid';
import {
  formatErrorDate,
  getErrorContent,
  getErrorCreatedAt,
  getErrorNextReview,
  getErrorSubjectName,
  isErrorDueToday
} from './errorUtils';
import { cn } from '../../lib/utils';

interface ErroCardProps {
  key?: React.Key;
  error: StudyError;
  subject?: Subject;
  onEdit: (error: StudyError) => void;
  onDelete: (id: string) => Promise<boolean> | boolean | void;
  onRate: (id: string, rating: 'dificil' | 'ok' | 'facil') => Promise<boolean> | boolean | void;
}

const TYPE_LABELS: Record<ErrorType, { label: string; classes: string }> = {
  atencao: { label: 'Falta de atenção', classes: 'border-amber-400/30 bg-amber-400/10 text-amber-300' },
  nao_sabia: { label: 'Não sabia', classes: 'border-rose-400/30 bg-rose-400/10 text-rose-300' },
  confusao: { label: 'Confusão', classes: 'border-sky-400/30 bg-sky-400/10 text-sky-300' },
  pegadinha: { label: 'Pegadinha', classes: 'border-violet-400/30 bg-violet-400/10 text-violet-300' }
};

export function ErroCard({ error, subject, onEdit, onDelete, onRate }: ErroCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [activeRating, setActiveRating] = React.useState<'dificil' | 'ok' | 'facil' | null>(null);
  const content = getErrorContent(error);
  const title = error.assunto?.trim() || content.split('\n').find(line => line.trim())?.replace(/^\[(ERRO|CERTO|DICA)\]\s*/i, '') || 'Registro sem título';
  const canExpand = content.length > 260 || content.split('\n').length > 4;
  const type = TYPE_LABELS[error.tipoErro || 'atencao'];
  const color = getSubjectColorHex(subject || { id: error.subjectId, color: undefined });
  const dueToday = isErrorDueToday(error);

  const handleRate = async (rating: 'dificil' | 'ok' | 'facil') => {
    setActiveRating(rating);
    await onRate(error.id, rating);
    window.setTimeout(() => setActiveRating(null), 1400);
  };

  const handleDelete = async () => {
    if (window.confirm('Excluir este registro? Esta ação não pode ser desfeita.')) {
      await onDelete(error.id);
    }
  };

  return (
    <article
      className="relative overflow-hidden rounded-lg bg-card shadow-sm transition hover:shadow-md"
      style={{ borderLeftWidth: 5, borderLeftColor: color }}
    >
      <div className="p-5 sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                {getErrorSubjectName(error)}
              </span>
              <span className={cn('rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider', type.classes)}>
                {type.label}
              </span>
            </div>
            <h3 className="break-words text-base font-semibold leading-snug text-text-primary sm:text-lg">{title}</h3>
            <p className="mt-1 text-xs text-text-secondary">Criado em {formatErrorDate(getErrorCreatedAt(error))}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(error)}
              className="rounded-lg p-2 text-text-secondary transition hover:bg-violet-500/10 hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label="Editar registro"
            >
              <Pencil size={17} />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg p-2 text-text-secondary transition hover:bg-rose-500/10 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label="Excluir registro"
            >
              <Trash2 size={17} />
            </button>
          </div>
        </header>

        <div className="mt-4">
          <p className={cn('whitespace-pre-line break-words text-sm leading-6 text-text-secondary', !expanded && canExpand && 'line-clamp-4')}>
            {content}
          </p>
          {canExpand ? (
            <button
              type="button"
              onClick={() => setExpanded(value => !value)}
              className="mt-2 text-xs font-bold text-brand-primary hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-expanded={expanded}
            >
              {expanded ? 'Ver menos' : 'Ver mais'}
            </button>
          ) : null}
        </div>

        {error.tags?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {error.tags.map(tag => <span key={tag} className="rounded bg-[var(--surface-muted)] px-2.5 py-1 text-[11px] text-text-secondary">#{tag}</span>)}
          </div>
        ) : null}

        <AnexosGrid anexos={error.anexos} />
      </div>

      <footer className="flex flex-col gap-3 bg-[var(--surface-muted)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className={cn('flex items-center gap-2 text-xs font-semibold', dueToday ? 'text-amber-300' : 'text-text-secondary')}>
          <CalendarClock size={16} />
          {dueToday ? 'Revisar hoje' : `Próxima revisão: ${formatErrorDate(getErrorNextReview(error))}`}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex">
          {([
            ['dificil', 'Difícil', 'border-rose-500/40 text-rose-300 hover:bg-rose-500 hover:text-white'],
            ['ok', 'Ok', 'border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-slate-950'],
            ['facil', 'Fácil', 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-white']
          ] as const).map(([rating, label, classes]) => (
            <button
              key={rating}
              type="button"
              onClick={() => handleRate(rating)}
              className={cn(
                'inline-flex h-9 min-w-20 items-center justify-center gap-1 rounded-lg border bg-transparent px-3 text-xs font-bold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
                classes,
                activeRating === rating && 'scale-[0.98] bg-white/10'
              )}
              aria-label={`Avaliar revisão como ${label}`}
            >
              {activeRating === rating ? <Check size={14} /> : null}{label}
            </button>
          ))}
        </div>
      </footer>
    </article>
  );
}
