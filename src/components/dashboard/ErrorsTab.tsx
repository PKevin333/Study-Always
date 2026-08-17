import React from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Expand,
  Flag,
  HelpCircle,
  History,
  Plus,
  Search,
  Timer,
  Trash2
} from 'lucide-react';
import { Subject, StudyError } from '../../types';
import { cn } from '../../lib/utils';
import { getSubjectColorHex } from '../../utils/subjectColors';
import { MentorTipCallout } from '../shared/MentorTipCallout';
import { SubjectTag } from '../shared/SubjectTag';
import { designTokens } from '../../styles/designTokens';

interface ErrorsTabProps {
  errorSubject: string;
  setErrorSubject: (id: string) => void;
  errorText: string;
  setErrorText: (text: string) => void;
  handleSaveError: () => void;
  savingError: boolean;
  subjects: Subject[];
  errors: StudyError[];
  deleteError: (id: string) => void;
  updateError: (id: string, updates: Partial<StudyError>) => void;
  rateErrorReview: (id: string, rating: 'dificil' | 'ok' | 'facil') => void;
}

const PAGE_SIZE = 8;

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'object' && 'seconds' in value && typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  if (typeof value !== 'string' && typeof value !== 'number') return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value: unknown) => {
  const date = toDate(value);
  if (!date) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

const formatReviewStatus = (value: unknown) => {
  const date = toDate(value);
  if (!date) {
    return {
      label: 'Sem revisão agendada',
      helper: null
    };
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfReview = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfReview.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return {
      label: 'Revisar hoje',
      helper: formatDate(date)
    };
  }

  if (diffDays === 1) {
    return {
      label: 'Revisar amanhã',
      helper: formatDate(date)
    };
  }

  return {
    label: `Revisar em ${diffDays} dias`,
    helper: formatDate(date)
  };
};

const getNextReviewDate = (error: StudyError) => {
  return error.proximaRevisao || error.nextReview;
};

const isReviewDueToday = (error: StudyError) => {
  const reviewDate = toDate(getNextReviewDate(error) || error.createdAt);
  if (!reviewDate) return false;

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  return reviewDate <= todayEnd;
};

export function ErrorsTab({
  errorSubject,
  setErrorSubject,
  errorText,
  setErrorText,
  handleSaveError,
  savingError,
  subjects,
  errors,
  deleteError,
  rateErrorReview
}: ErrorsTabProps) {
  const [filter, setFilter] = React.useState<'todos' | 'hoje'>('todos');
  const [subjectFilter, setSubjectFilter] = React.useState('todos');
  const [search, setSearch] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const subjectById = React.useMemo(() => new Map(subjects.map(subject => [subject.id, subject])), [subjects]);

  const dueTodayCount = React.useMemo(() => errors.filter(isReviewDueToday).length, [errors]);

  const filteredErrors = React.useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return errors.filter(error => {
      const matchesReviewFilter = filter === 'todos' || isReviewDueToday(error);
      const matchesSubject = subjectFilter === 'todos' || error.subjectId === subjectFilter;
      const matchesSearch = !normalizedSearch
        || error.subjectName?.toLowerCase().includes(normalizedSearch)
        || error.content?.toLowerCase().includes(normalizedSearch);

      return matchesReviewFilter && matchesSubject && matchesSearch;
    });
  }, [errors, filter, search, subjectFilter]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter, search, subjectFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredErrors.length / PAGE_SIZE));
  const paginatedErrors = filteredErrors.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      key="errors"
      className={`min-h-full bg-background ${designTokens.page}`}
    >
      <header className="bg-card border-b border-border rounded-3xl overflow-hidden mb-6">
        <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className={`${designTokens.pageTitle} text-text-primary`}>Caderno de Erros</h2>
            <p className={designTokens.pageIntro}>
              Registre seus erros para revisão inteligente e prática espaçada.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="relative p-3 rounded-lg border border-border text-text-secondary hover:text-brand-primary hover:border-brand-primary/50 transition-all"
              title="Notificações"
            >
              <Bell size={18} />
              {dueTodayCount > 0 && (
                <span className="absolute right-2 top-2 w-2.5 h-2.5 rounded-full bg-brand-primary" />
              )}
            </button>
            <button
              className="p-3 rounded-lg border border-border text-text-secondary hover:text-brand-primary hover:border-brand-primary/50 transition-all"
              title="Cronômetro"
            >
              <Timer size={18} />
            </button>
            <button
              onClick={handleSaveError}
              disabled={savingError || !errorText.trim() || !errorSubject}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-3 font-bold text-white hover:bg-brand-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Plus size={18} />
              {savingError ? 'Salvando...' : 'Registrar Erro'}
            </button>
          </div>
        </div>
      </header>

      <div className={`grid grid-cols-1 xl:grid-cols-12 ${designTokens.sectionGrid}`}>
        <section className={`xl:col-span-4 h-fit ${designTokens.sectionCardDense}`}>
          <h3 className={`${designTokens.cardTitle} mb-4 text-text-primary`}>Novo Registro</h3>
          <div className="space-y-4">
            <select
              value={errorSubject}
              onChange={(event) => setErrorSubject(event.target.value)}
              className={designTokens.inputOnCard}
            >
              <option value="">Selecione a Disciplina</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
            <textarea
              value={errorText}
              onChange={(event) => setErrorText(event.target.value)}
              placeholder="O que você errou? Seja objetivo, use bullets."
              className={`${designTokens.inputOnCard} h-36 resize-none placeholder:text-text-secondary`}
            />
            <button
              onClick={handleSaveError}
              disabled={savingError || !errorText.trim() || !errorSubject}
              className="w-full rounded-xl bg-brand-primary py-3 font-bold text-white transition-all hover:bg-brand-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingError ? 'Salvando...' : 'Salvar no Caderno'}
            </button>
          </div>
        </section>

        <section className={`xl:col-span-8 ${designTokens.listStackRelaxed}`}>
          <div className={`${designTokens.sectionCardDense} p-4`}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Pesquisar por matéria ou conteúdo"
                  className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-text-primary outline-none placeholder:text-text-secondary focus:border-brand-primary"
                />
              </div>

              <div className="flex gap-2">
                <button
                  className="p-3 rounded-lg border border-border text-text-secondary hover:text-brand-primary hover:border-brand-primary/50 transition-all"
                  title="Expandir"
                >
                  <Expand size={18} />
                </button>
                <button
                  className="p-3 rounded-lg border border-border text-text-secondary hover:text-brand-primary hover:border-brand-primary/50 transition-all"
                  title="Ajuda"
                >
                  <HelpCircle size={18} />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={subjectFilter}
                  onChange={(event) => setSubjectFilter(event.target.value)}
                  className="rounded-xl border border-border bg-card px-3 py-3 text-text-primary outline-none focus:border-brand-primary"
                >
                  <option value="todos">Todas as matérias</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value as 'todos' | 'hoje')}
                  className="rounded-xl border border-border bg-card px-3 py-3 text-text-primary outline-none focus:border-brand-primary"
                >
                  <option value="todos">Todos</option>
                  <option value="hoje">Revisar hoje</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {paginatedErrors.length === 0 ? (
              <div className={`${designTokens.sectionCardDense} py-12 text-center text-text-secondary`}>
                Você ainda não tem registros no seu caderno de erros.
              </div>
            ) : (
              paginatedErrors.map(error => {
                const nextReview = getNextReviewDate(error);
                const reviewStatus = formatReviewStatus(nextReview);

                return (
                  <article key={error.id} className={`${designTokens.itemCard} bg-card`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <SubjectTag
                          subjectName={error.subjectName}
                          color={getSubjectColorHex(subjectById.get(error.subjectId))}
                        />
                        <p className={designTokens.metaText}>
                          criado em {formatDate(error.createdAt)}
                        </p>
                      </div>

                      <button
                        onClick={() => deleteError(error.id)}
                        className="rounded-lg p-2 text-text-secondary transition-all hover:bg-brand-red/10 hover:text-brand-red"
                        title="Excluir"
                        aria-label="Excluir erro"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-4 rounded-xl border border-border/70 bg-background/40 p-4">
                      <p className="whitespace-pre-line text-sm leading-relaxed text-text-primary">
                        {error.content}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-center gap-2 text-sm text-text-secondary">
                        <History size={15} className="shrink-0 text-brand-primary" />
                        <span className="font-medium text-text-primary">{reviewStatus.label}</span>
                        {reviewStatus.helper && (
                          <span className="truncate text-text-secondary">· {reviewStatus.helper}</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => rateErrorReview(error.id, 'dificil')}
                          className="rounded-lg border border-brand-red/40 px-3 py-2 text-xs font-bold text-brand-red transition-all hover:bg-brand-red/10"
                          title="Difícil"
                        >
                          Difícil
                        </button>
                        <button
                          onClick={() => rateErrorReview(error.id, 'ok')}
                          className="rounded-lg border border-brand-yellow/40 px-3 py-2 text-xs font-bold text-brand-yellow transition-all hover:bg-brand-yellow/10"
                          title="Ok"
                        >
                          Ok
                        </button>
                        <button
                          onClick={() => rateErrorReview(error.id, 'facil')}
                          className="rounded-lg border border-brand-green/40 px-3 py-2 text-xs font-bold text-brand-green transition-all hover:bg-brand-green/10"
                          title="Fácil"
                        >
                          Fácil
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}

            <div className="flex flex-col justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center">
              <div>
                <span className="font-bold text-text-primary">Total</span>
                <span className="ml-2 text-sm text-text-secondary">{filteredErrors.length} erros</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-border text-text-primary disabled:text-text-secondary disabled:opacity-50 hover:border-brand-primary/50 transition-all"
                  title="Página anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-text-secondary">
                  Página <span className="text-text-primary font-bold">{currentPage}</span> de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-border text-text-primary disabled:text-text-secondary disabled:opacity-50 hover:border-brand-primary/50 transition-all"
                  title="Próxima página"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <MentorTipCallout title="Dica do Mentor">
            <p className="text-xs leading-relaxed">
              Não copie o enunciado da questão. Foque em anotar por que você errou e qual regra precisa revisar.
            </p>
          </MentorTipCallout>
        </section>
      </div>

      <div className="fixed right-5 bottom-5 z-30 flex flex-col items-end gap-3">
        {dueTodayCount > 0 && (
          <div className="bg-card border border-border rounded-xl shadow-lg px-4 py-3 text-sm text-text-primary">
            Você tem tarefas do guia para concluir! ✨
          </div>
        )}
        <button
          className="w-12 h-12 rounded-full bg-brand-primary text-white shadow-lg flex items-center justify-center hover:bg-brand-primary/80 transition-all"
          title="Pendências do guia"
        >
          <Flag size={20} />
        </button>
      </div>
    </motion.div>
  );
}
