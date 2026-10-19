import React from 'react';
import { motion } from 'framer-motion';
import { BookOpenCheck, Lightbulb, Plus, Sparkles } from 'lucide-react';
import { StudyError, StudyErrorDraft, Subject, ErrorType } from '../../types';
import { ErroModal } from './ErroModal';
import { ErroCard } from './ErroCard';
import { ErrorFilterTab, FiltrosErros } from './FiltrosErros';
import {
  getErrorContent,
  getErrorCreatedAt,
  getErrorSubjectName,
  isErrorDominated,
  isErrorDueToday,
  toErrorDate
} from './errorUtils';

interface ErrorsTabProps {
  userId: string;
  subjects: Subject[];
  errors: StudyError[];
  savingError: boolean;
  errorsLoading?: boolean;
  saveError: (draft: StudyErrorDraft) => Promise<boolean>;
  deleteError: (id: string) => Promise<boolean>;
  updateError: (id: string, updates: Partial<StudyErrorDraft>) => Promise<boolean>;
  rateErrorReview: (id: string, rating: 'dificil' | 'ok' | 'facil') => Promise<boolean>;
}

const PAGE_SIZE = 8;

function ErrorSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-[#352d40] border-l-4 border-l-violet-500 bg-[#1a1621] p-6" aria-hidden="true">
      <div className="flex justify-between gap-4">
        <div className="w-full space-y-3">
          <div className="h-3 w-40 rounded bg-white/10" />
          <div className="h-5 w-2/3 rounded bg-white/10" />
        </div>
        <div className="h-8 w-20 rounded bg-white/10" />
      </div>
      <div className="mt-6 space-y-2">
        <div className="h-3 rounded bg-white/10" />
        <div className="h-3 rounded bg-white/10" />
        <div className="h-3 w-4/5 rounded bg-white/10" />
      </div>
      <div className="mt-6 h-12 rounded-xl bg-white/5" />
    </div>
  );
}

export function ErrorsTab({
  userId,
  subjects,
  errors,
  savingError,
  errorsLoading = false,
  saveError,
  deleteError,
  updateError,
  rateErrorReview
}: ErrorsTabProps) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingError, setEditingError] = React.useState<StudyError | null>(null);
  const [search, setSearch] = React.useState('');
  const [subjectFilter, setSubjectFilter] = React.useState('todos');
  const [tab, setTab] = React.useState<ErrorFilterTab>('todos');
  const [typeFilter, setTypeFilter] = React.useState<ErrorType | 'todos'>('todos');
  const [page, setPage] = React.useState(1);

  const subjectById = React.useMemo(() => new Map(subjects.map(subject => [subject.id, subject])), [subjects]);
  const counts = React.useMemo(() => ({
    hoje: errors.filter(isErrorDueToday).length,
    todos: errors.length,
    dominados: errors.filter(isErrorDominated).length
  }), [errors]);

  const filteredErrors = React.useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
    return errors
      .filter(error => {
        const statusMatches = tab === 'todos' || (tab === 'hoje' ? isErrorDueToday(error) : isErrorDominated(error));
        const subjectMatches = subjectFilter === 'todos' || error.subjectId === subjectFilter;
        const typeMatches = typeFilter === 'todos' || error.tipoErro === typeFilter;
        const searchableText = [
          getErrorSubjectName(error),
          error.assunto,
          getErrorContent(error),
          ...(error.tags || [])
        ].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');
        return statusMatches && subjectMatches && typeMatches && (!normalizedSearch || searchableText.includes(normalizedSearch));
      })
      .sort((a, b) => {
        const dueDifference = Number(isErrorDueToday(b)) - Number(isErrorDueToday(a));
        if (dueDifference !== 0) return dueDifference;
        return (toErrorDate(getErrorCreatedAt(b))?.getTime() || 0) - (toErrorDate(getErrorCreatedAt(a))?.getTime() || 0);
      });
  }, [errors, search, subjectFilter, tab, typeFilter]);

  React.useEffect(() => setPage(1), [search, subjectFilter, tab, typeFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredErrors.length / PAGE_SIZE));
  const visibleErrors = filteredErrors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditingError(null);
    setModalOpen(true);
  };

  const openEdit = (error: StudyError) => {
    setEditingError(error);
    setModalOpen(true);
  };

  const handleSave = async (draft: StudyErrorDraft) => {
    if (editingError) return updateError(editingError.id, draft);
    return saveError(draft);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="min-h-full bg-[#100d15] p-4 pb-20 text-[#f3f4f6] sm:p-6 sm:pb-20"
    >
      <header className="relative mb-6 overflow-hidden rounded-3xl border border-[#3a2d49] bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_42%),#1a1621] p-5 shadow-xl shadow-black/10 sm:p-7">
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full border border-violet-400/10" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
              <BookOpenCheck size={22} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Caderno de Erros</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
              Transforme cada falha em uma revisão objetiva e acompanhe o que já foi dominado.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 font-bold text-white shadow-lg shadow-brand-primary/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1621]"
          >
            <Plus size={18} /> Registrar Erro
          </button>
        </div>
      </header>

      <FiltrosErros
        search={search}
        subjectId={subjectFilter}
        tab={tab}
        type={typeFilter}
        subjects={subjects}
        counts={counts}
        onSearchChange={setSearch}
        onSubjectChange={setSubjectFilter}
        onTabChange={setTab}
        onTypeChange={setTypeFilter}
      />

      <main className="mt-5 space-y-4">
        {errorsLoading ? (
          <><ErrorSkeleton /><ErrorSkeleton /><ErrorSkeleton /></>
        ) : visibleErrors.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-[#4a3d5a] bg-[#1a1621] px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
              <Sparkles size={28} />
            </div>
            <h3 className="mt-5 text-lg font-bold text-white">
              {errors.length === 0 ? 'Seu caderno está pronto para começar' : 'Nenhum registro com esses filtros'}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
              {errors.length === 0
                ? 'Registre o motivo de um erro, anexe a questão e deixe o ciclo de revisão cuidar do restante.'
                : 'Tente limpar a busca ou selecionar outra disciplina, situação ou tipo de erro.'}
            </p>
            {errors.length === 0 ? (
              <button type="button" onClick={openCreate} className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
                <Plus size={16} /> Registrar primeiro erro
              </button>
            ) : null}
          </section>
        ) : (
          visibleErrors.map(error => (
            <ErroCard
              key={error.id}
              error={error}
              subject={subjectById.get(error.subjectId)}
              onEdit={openEdit}
              onDelete={deleteError}
              onRate={rateErrorReview}
            />
          ))
        )}
      </main>

      {!errorsLoading && filteredErrors.length > PAGE_SIZE ? (
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-[#352d40] bg-[#1a1621] px-4 py-3 text-xs text-text-secondary">
          <span>{filteredErrors.length} registros · página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page === 1} className="h-9 rounded-lg border border-[#3b3247] px-3 font-bold text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">Anterior</button>
            <button type="button" onClick={() => setPage(value => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="h-9 rounded-lg border border-[#3b3247] px-3 font-bold text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">Próxima</button>
          </div>
        </div>
      ) : null}

      <aside className="mt-6 flex items-start gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] p-4 text-sm text-slate-300">
        <Lightbulb size={18} className="mt-0.5 shrink-0 text-violet-300" />
        <p><strong className="text-violet-200">Dica do Mentor:</strong> registre por que você errou e qual sinal ajudará a reconhecer a resposta certa na próxima vez.</p>
      </aside>

      <ErroModal
        open={modalOpen}
        userId={userId}
        subjects={subjects}
        editingError={editingError}
        saving={savingError}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </motion.div>
  );
}
