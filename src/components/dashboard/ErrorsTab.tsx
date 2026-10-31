import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, BookOpenCheck, Lightbulb, Plus, Sparkles, Trash2 } from 'lucide-react';
import { StudyError, StudyErrorDraft, Subject, ErrorType } from '../../types';
import { Modal } from '../shared/Modal';
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
  clearAllErrors: () => Promise<boolean>;
  updateError: (id: string, updates: Partial<StudyErrorDraft>) => Promise<boolean>;
  rateErrorReview: (id: string, rating: 'dificil' | 'ok' | 'facil') => Promise<boolean>;
}

const PAGE_SIZE = 8;

function ErrorSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-lg border-l-4 border-l-brand-primary bg-card p-6 shadow-sm" aria-hidden="true">
      <div className="flex justify-between gap-4">
        <div className="w-full space-y-3">
          <div className="h-3 w-40 rounded bg-[var(--surface-muted)]" />
          <div className="h-5 w-2/3 rounded bg-[var(--surface-muted)]" />
        </div>
        <div className="h-8 w-20 rounded bg-[var(--surface-muted)]" />
      </div>
      <div className="mt-6 space-y-2">
        <div className="h-3 rounded bg-[var(--surface-muted)]" />
        <div className="h-3 rounded bg-[var(--surface-muted)]" />
        <div className="h-3 w-4/5 rounded bg-[var(--surface-muted)]" />
      </div>
      <div className="mt-6 h-12 rounded-xl bg-[var(--surface-muted)]" />
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
  clearAllErrors,
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
  const [clearModalOpen, setClearModalOpen] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);
  const [clearError, setClearError] = React.useState('');

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

  const handleClearAll = async () => {
    setClearing(true);
    setClearError('');
    const cleared = await clearAllErrors();
    setClearing(false);

    if (cleared) {
      setClearModalOpen(false);
      setPage(1);
      return;
    }

    setClearError('Não foi possível limpar o caderno. Verifique sua conexão e tente novamente.');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mx-auto min-h-full w-full max-w-[1480px] pb-20 text-text-primary"
    >
      <header className="mb-6 border-b border-border pb-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-brand-primary">
              <BookOpenCheck size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.18em]">Revisão inteligente</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">Caderno de Erros</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">
              Transforme cada falha em uma revisão objetiva e acompanhe o que já foi dominado.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {errors.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setClearError('');
                  setClearModalOpen(true);
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold text-brand-red transition hover:bg-brand-red/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
              >
                <Trash2 size={17} /> Limpar caderno
              </button>
            ) : null}
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-primary px-5 text-sm font-bold text-white shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              <Plus size={18} /> Registrar Erro
            </button>
          </div>
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
          <section className="rounded-lg bg-card px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
              <Sparkles size={28} />
            </div>
            <h3 className="mt-5 text-lg font-bold text-text-primary">
              {errors.length === 0 ? 'Seu caderno está pronto para começar' : 'Nenhum registro com esses filtros'}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
              {errors.length === 0
                ? 'Registre o motivo de um erro, anexe a questão e deixe o ciclo de revisão cuidar do restante.'
                : 'Tente limpar a busca ou selecionar outra disciplina, situação ou tipo de erro.'}
            </p>
            {errors.length === 0 ? (
              <button type="button" onClick={openCreate} className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-brand-primary px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
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
        <div className="mt-5 flex items-center justify-between px-1 py-3 text-xs text-text-secondary">
          <span>{filteredErrors.length} registros · página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page === 1} className="h-9 rounded-md bg-[var(--surface-muted)] px-3 font-bold text-text-primary disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">Anterior</button>
            <button type="button" onClick={() => setPage(value => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="h-9 rounded-md bg-[var(--surface-muted)] px-3 font-bold text-text-primary disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">Próxima</button>
          </div>
        </div>
      ) : null}

      <aside className="mt-6 flex items-start gap-3 border-l-2 border-brand-primary bg-brand-primary/5 px-4 py-3 text-sm text-text-secondary">
        <Lightbulb size={18} className="mt-0.5 shrink-0 text-brand-primary" />
        <p><strong className="text-text-primary">Dica do Mentor:</strong> registre por que você errou e qual sinal ajudará a reconhecer a resposta certa na próxima vez.</p>
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

      <Modal
        open={clearModalOpen}
        onClose={() => {
          if (!clearing) setClearModalOpen(false);
        }}
        title="Limpar todo o caderno?"
        maxWidthClassName="max-w-lg"
        footer={(
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setClearModalOpen(false)}
              disabled={clearing}
              className="h-11 rounded-xl border border-border px-5 text-sm font-bold text-text-primary transition hover:bg-[var(--surface-muted)] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={clearing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-wait disabled:opacity-60"
            >
              <Trash2 size={17} /> {clearing ? 'Excluindo...' : `Excluir ${errors.length} registros`}
            </button>
          </div>
        )}
      >
        <div className="flex items-start gap-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
          <AlertTriangle className="mt-0.5 shrink-0 text-brand-red" size={22} />
          <div>
            <p className="text-sm leading-relaxed text-text-primary">
              Todos os registros do Caderno de Erros e seus anexos serão excluídos permanentemente.
            </p>
            <p className="mt-2 text-xs text-text-secondary">
              Disciplinas, sessões, calendário, perfil e configurações não serão alterados. Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>
        {clearError ? <p className="mt-3 text-sm font-medium text-brand-red" role="alert">{clearError}</p> : null}
      </Modal>
    </motion.div>
  );
}
