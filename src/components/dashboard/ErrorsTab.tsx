import React from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Clock,
  Expand,
  Flag,
  HelpCircle,
  Plus,
  Search,
  Timer,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { Subject, StudyError } from '../../types';
import { cn } from '../../lib/utils';
import { getSubjectThemeColor } from '../../utils/subjectColors';

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
  updateError?: (id: string, updates: Partial<StudyError>) => void;
  rateErrorReview: (id: string, rating: 'dificil' | 'ok' | 'facil') => void;
}

export interface ErrorSubBlocks {
  erro: string;
  certo?: string;
  dica?: string;
}

export const serializeErrorContent = ({ erro, certo, dica }: ErrorSubBlocks): string => {
  const parts: string[] = [];
  if (erro.trim()) parts.push(`[ERRO]\n${erro.trim()}`);
  if (certo?.trim()) parts.push(`[CERTO]\n${certo.trim()}`);
  if (dica?.trim()) parts.push(`[DICA]\n${dica.trim()}`);
  return parts.join('\n\n');
};

export const parseErrorContent = (rawContent: string): ErrorSubBlocks => {
  if (!rawContent) return { erro: '' };

  const erroMatch = rawContent.match(/\[ERRO\]([\s\S]*?)(?=(\[(?:CERTO|DICA)\])|$)/i);
  const certoMatch = rawContent.match(/\[CERTO\]([\s\S]*?)(?=(\[(?:ERRO|DICA)\])|$)/i);
  const dicaMatch = rawContent.match(/\[DICA\]([\s\S]*?)(?=(\[(?:ERRO|CERTO)\])|$)/i);

  if (erroMatch || certoMatch || dicaMatch) {
    return {
      erro: erroMatch ? erroMatch[1].trim() : '',
      certo: certoMatch ? certoMatch[1].trim() : undefined,
      dica: dicaMatch ? dicaMatch[1].trim() : undefined
    };
  }

  // Suporte alternativo ao formato Erro: / Certo: / Dica:
  const erroColon = rawContent.match(/(?:^|\n)Erro:\s*([\s\S]*?)(?=(?:\n(?:Certo|Dica):)|$)/i);
  const certoColon = rawContent.match(/(?:^|\n)Certo:\s*([\s\S]*?)(?=(?:\n(?:Erro|Dica):)|$)/i);
  const dicaColon = rawContent.match(/(?:^|\n)Dica:\s*([\s\S]*?)(?=(?:\n(?:Erro|Certo):)|$)/i);

  if (erroColon || certoColon || dicaColon) {
    return {
      erro: erroColon ? erroColon[1].trim() : '',
      certo: certoColon ? certoColon[1].trim() : undefined,
      dica: dicaColon ? dicaColon[1].trim() : undefined
    };
  }

  // Compatibilidade com registros legados (texto puro)
  return {
    erro: rawContent.trim()
  };
};

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

interface ErrorCardProps {
  error: StudyError;
  isDueToday: boolean;
  isUpcoming?: boolean;
  rateErrorReview: (id: string, rating: 'dificil' | 'ok' | 'facil') => void;
  deleteError: (id: string) => void;
}

function ErrorCard({
  error,
  isDueToday,
  isUpcoming = false,
  rateErrorReview,
  deleteError
}: ErrorCardProps) {
  const theme = getSubjectThemeColor(error.subjectName);
  const parsed = React.useMemo(() => parseErrorContent(error.content), [error.content]);
  const nextReview = getNextReviewDate(error);

  return (
    <div
      style={{ borderLeftColor: theme.hex }}
      className={cn(
        "relative bg-[#1c1f26] border border-[#282d37] border-l-4 rounded-r-xl rounded-l-none p-4 sm:p-5 transition-all shadow-sm hover:shadow-md flex flex-col justify-between group",
        isUpcoming && "opacity-[0.85] hover:opacity-100"
      )}
    >
      <div>
        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <span
            style={{
              backgroundColor: theme.badgeBg,
              color: theme.badgeText,
              borderColor: theme.badgeBorder
            }}
            className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border max-w-[220px] truncate shadow-xs"
            title={error.subjectName}
          >
            {error.subjectName}
          </span>

          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{formatDate(error.createdAt)}</span>
            <button
              onClick={() => deleteError(error.id)}
              className="p-1 rounded-md text-text-secondary hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Excluir erro"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Sub-blocos com label inline em linhas próprias */}
        <div className="space-y-2 mb-4 text-sm">
          {parsed.erro && (
            <div className="flex items-baseline gap-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/25 shrink-0 select-none">
                Erro
              </span>
              <span className="text-[#f1f5f9] leading-relaxed break-words whitespace-pre-wrap">
                {parsed.erro}
              </span>
            </div>
          )}

          {parsed.certo && (
            <div className="flex items-baseline gap-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0 select-none">
                Certo
              </span>
              <span className="text-[#f1f5f9] leading-relaxed break-words whitespace-pre-wrap">
                {parsed.certo}
              </span>
            </div>
          )}

          {parsed.dica && (
            <div className="flex items-baseline gap-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/25 shrink-0 select-none">
                Dica
              </span>
              <span className="text-[#cbd5e1] leading-relaxed italic break-words whitespace-pre-wrap">
                {parsed.dica}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Faixa de Ação no Rodapé separada por border-top */}
      <div className="pt-3 border-t border-[#262b35] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 text-xs">
          {isDueToday ? (
            <span className="inline-flex items-center gap-1.5 text-amber-400 font-semibold">
              <Clock size={14} className="shrink-0" />
              Revisar hoje
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-text-secondary font-medium">
              <Clock size={14} className="shrink-0" />
              {nextReview ? `Revisar em ${formatDate(nextReview)}` : 'Sem agendamento'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => rateErrorReview(error.id, 'dificil')}
            className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-400 hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-sm"
            title="Marcar como Difícil"
          >
            Difícil
          </button>
          <button
            onClick={() => rateErrorReview(error.id, 'ok')}
            className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-400 hover:bg-amber-500 hover:text-white transition-all active:scale-95 shadow-sm"
            title="Marcar como Ok"
          >
            Ok
          </button>
          <button
            onClick={() => rateErrorReview(error.id, 'facil')}
            className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-sm"
            title="Marcar como Fácil"
          >
            Fácil
          </button>
        </div>
      </div>
    </div>
  );
}

export function ErrorsTab({
  errorSubject,
  setErrorSubject,
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

  // Estados locais para os 3 sub-campos do formulário
  const [fieldErro, setFieldErro] = React.useState('');
  const [fieldCerto, setFieldCerto] = React.useState('');
  const [fieldDica, setFieldDica] = React.useState('');

  const dueTodayCount = React.useMemo(() => errors.filter(isReviewDueToday).length, [errors]);

  // Sincroniza os 3 campos locais com o prop errorText pai
  const syncToParent = React.useCallback(
    (eVal: string, cVal: string, dVal: string) => {
      const serialized = serializeErrorContent({ erro: eVal, certo: cVal, dica: dVal });
      setErrorText(serialized);
    },
    [setErrorText]
  );

  const handleErroChange = (value: string) => {
    setFieldErro(value);
    syncToParent(value, fieldCerto, fieldDica);
  };

  const handleCertoChange = (value: string) => {
    setFieldCerto(value);
    syncToParent(fieldErro, value, fieldDica);
  };

  const handleDicaChange = (value: string) => {
    setFieldDica(value);
    syncToParent(fieldErro, fieldCerto, value);
  };

  const handleFormSubmit = () => {
    if (!errorSubject || !fieldErro.trim() || savingError) return;
    const serialized = serializeErrorContent({
      erro: fieldErro,
      certo: fieldCerto,
      dica: fieldDica
    });
    setErrorText(serialized);
    handleSaveError();
    // Limpa os campos após submissão
    setFieldErro('');
    setFieldCerto('');
    setFieldDica('');
  };

  // Filtragem e ordenação (priorizando erros de hoje, seguidos dos mais recentes)
  const filteredErrors = React.useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return errors.filter(error => {
      const matchesReviewFilter = filter === 'todos' || isReviewDueToday(error);
      const matchesSubject = subjectFilter === 'todos' || error.subjectId === subjectFilter;
      const matchesSearch =
        !normalizedSearch ||
        error.subjectName?.toLowerCase().includes(normalizedSearch) ||
        error.content?.toLowerCase().includes(normalizedSearch);

      return matchesReviewFilter && matchesSubject && matchesSearch;
    });
  }, [errors, filter, search, subjectFilter]);

  const sortedErrors = React.useMemo(() => {
    return [...filteredErrors].sort((a, b) => {
      const aDue = isReviewDueToday(a);
      const bDue = isReviewDueToday(b);
      if (aDue && !bDue) return -1;
      if (!aDue && bDue) return 1;

      const dateA = toDate(a.createdAt)?.getTime() || 0;
      const dateB = toDate(b.createdAt)?.getTime() || 0;
      return dateB - dateA;
    });
  }, [filteredErrors]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter, search, subjectFilter]);

  const totalPages = Math.max(1, Math.ceil(sortedErrors.length / PAGE_SIZE));
  const paginatedErrors = sortedErrors.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Divisão em duas seções
  const dueTodayInPage = React.useMemo(
    () => paginatedErrors.filter(isReviewDueToday),
    [paginatedErrors]
  );
  const upcomingInPage = React.useMemo(
    () => paginatedErrors.filter(error => !isReviewDueToday(error)),
    [paginatedErrors]
  );

  const totalDueToday = React.useMemo(
    () => filteredErrors.filter(isReviewDueToday).length,
    [filteredErrors]
  );
  const totalUpcoming = React.useMemo(
    () => filteredErrors.filter(error => !isReviewDueToday(error)).length,
    [filteredErrors]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      key="errors"
      className="min-h-full bg-[#101218] text-[#f3f4f6] pb-20 p-4 sm:p-6"
    >
      {/* Header da Tela */}
      <header className="bg-[#1c1f26] border border-[#282d37] rounded-2xl overflow-hidden mb-6 shadow-sm">
        <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1.5 tracking-tight">
              Caderno de Erros
            </h2>
            <p className="text-text-secondary text-sm sm:text-base">
              Aprenda com seus erros através da prática espaçada e retenção ativa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="relative p-3 rounded-lg border border-[#282d37] bg-[#13151b] text-text-secondary hover:text-white hover:border-brand-primary/50 transition-all"
              title="Notificações"
            >
              <Bell size={18} />
              {dueTodayCount > 0 && (
                <span className="absolute right-2 top-2 w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
            <button
              className="p-3 rounded-lg border border-[#282d37] bg-[#13151b] text-text-secondary hover:text-white hover:border-brand-primary/50 transition-all"
              title="Cronômetro"
            >
              <Timer size={18} />
            </button>
            <button
              onClick={handleFormSubmit}
              disabled={savingError || !fieldErro.trim() || !errorSubject}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-3 font-bold text-white hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
            >
              <Plus size={18} />
              {savingError ? 'Salvando...' : 'Registrar Erro'}
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Formulário de Criação (3 campos: Erro, Certo, Dica) */}
        <section className="xl:col-span-4 bg-[#1c1f26] border border-[#282d37] rounded-2xl p-5 sm:p-6 h-fit shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
              Novo Registro
            </h3>
            <span className="text-xs text-text-secondary">3 etapas</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
                Disciplina *
              </label>
              <select
                value={errorSubject}
                onChange={event => setErrorSubject(event.target.value)}
                className="w-full bg-[#13151b] border border-[#282d37] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-brand-primary transition-colors text-sm"
              >
                <option value="">Selecione a Disciplina</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo 1: Erro (Obrigatório) */}
            <div>
              <label className="text-xs font-semibold text-rose-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertCircle size={14} />
                O que você errou? *
              </label>
              <textarea
                value={fieldErro}
                onChange={event => handleErroChange(event.target.value)}
                placeholder="Ex: Confundi competência privativa com exclusiva na CF/88..."
                className="w-full h-24 bg-[#13151b] border border-[#282d37] rounded-lg px-3.5 py-2.5 text-white placeholder:text-text-secondary/60 outline-none focus:border-rose-400/70 transition-colors text-sm resize-none"
              />
            </div>

            {/* Campo 2: Certo (Opcional) */}
            <div>
              <label className="text-xs font-semibold text-emerald-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                <CheckCircle2 size={14} />
                Qual é o correto? (Opcional)
              </label>
              <textarea
                value={fieldCerto}
                onChange={event => handleCertoChange(event.target.value)}
                placeholder="Ex: A competência privativa pode ser delegada por lei complementar..."
                className="w-full h-20 bg-[#13151b] border border-[#282d37] rounded-lg px-3.5 py-2.5 text-white placeholder:text-text-secondary/60 outline-none focus:border-emerald-400/70 transition-colors text-sm resize-none"
              />
            </div>

            {/* Campo 3: Dica (Opcional) */}
            <div>
              <label className="text-xs font-semibold text-amber-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                <Lightbulb size={14} />
                Dica ou macete (Opcional)
              </label>
              <textarea
                value={fieldDica}
                onChange={event => handleDicaChange(event.target.value)}
                placeholder="Ex: Macete: Privativa = 'Pode' delegar. Exclusiva = 'Exclui' delegação..."
                className="w-full h-20 bg-[#13151b] border border-[#282d37] rounded-lg px-3.5 py-2.5 text-white placeholder:text-text-secondary/60 outline-none focus:border-amber-400/70 transition-colors text-sm resize-none"
              />
            </div>

            <button
              onClick={handleFormSubmit}
              disabled={savingError || !fieldErro.trim() || !errorSubject}
              className="w-full bg-brand-primary text-white font-bold py-3 rounded-lg hover:bg-brand-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95"
            >
              {savingError ? 'Salvando...' : 'Salvar no Caderno'}
            </button>
          </div>
        </section>

        {/* Listagem de Cards de Erro */}
        <section className="xl:col-span-8 space-y-5">
          {/* Barra de Busca e Filtros */}
          <div className="bg-[#1c1f26] border border-[#282d37] rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Pesquisar por matéria, erro, acerto ou dica..."
                  className="w-full bg-[#13151b] border border-[#282d37] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-text-secondary outline-none focus:border-brand-primary transition-colors text-sm"
                />
              </div>

              <div className="flex gap-2">
                <button
                  className="p-2.5 rounded-lg border border-[#282d37] bg-[#13151b] text-text-secondary hover:text-white hover:border-brand-primary/50 transition-all"
                  title="Expandir"
                >
                  <Expand size={18} />
                </button>
                <button
                  className="p-2.5 rounded-lg border border-[#282d37] bg-[#13151b] text-text-secondary hover:text-white hover:border-brand-primary/50 transition-all"
                  title="Ajuda"
                >
                  <HelpCircle size={18} />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={subjectFilter}
                  onChange={event => setSubjectFilter(event.target.value)}
                  className="bg-[#13151b] border border-[#282d37] rounded-lg px-3 py-2.5 text-white outline-none focus:border-brand-primary transition-colors text-sm"
                >
                  <option value="todos">Todas as matérias</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                <select
                  value={filter}
                  onChange={event => setFilter(event.target.value as 'todos' | 'hoje')}
                  className="bg-[#13151b] border border-[#282d37] rounded-lg px-3 py-2.5 text-white outline-none focus:border-brand-primary transition-colors text-sm"
                >
                  <option value="todos">Todos</option>
                  <option value="hoje">Revisar hoje</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cards agrupados nas duas seções */}
          {filteredErrors.length === 0 ? (
            <div className="bg-[#1c1f26] border border-[#282d37] rounded-2xl p-12 text-center text-text-secondary shadow-sm">
              <p className="text-base font-medium mb-1">Nenhum registro encontrado.</p>
              <p className="text-xs text-text-secondary">
                {filter === 'hoje'
                  ? 'Você não possui revisões agendadas para hoje com os filtros selecionados.'
                  : 'Cadastre seus primeiros erros no formulário ao lado.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Seção 1: Para revisar hoje · N */}
              {dueTodayInPage.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      Para revisar hoje · {totalDueToday}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dueTodayInPage.map(error => (
                      <ErrorCard
                        key={error.id}
                        error={error}
                        isDueToday={true}
                        rateErrorReview={rateErrorReview}
                        deleteError={deleteError}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Seção 2: Próximas revisões */}
              {upcomingInPage.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      Próximas revisões · {totalUpcoming}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcomingInPage.map(error => (
                      <ErrorCard
                        key={error.id}
                        error={error}
                        isDueToday={false}
                        isUpcoming={true}
                        rateErrorReview={rateErrorReview}
                        deleteError={deleteError}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Paginação */}
              <div className="bg-[#1c1f26] border border-[#282d37] rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <span className="font-bold text-white text-sm">Total</span>
                  <span className="ml-2 text-xs text-text-secondary">
                    {filteredErrors.length} {filteredErrors.length === 1 ? 'erro' : 'erros'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-[#282d37] bg-[#13151b] text-white disabled:text-text-secondary disabled:opacity-40 hover:border-brand-primary/50 transition-all"
                    title="Página anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs text-text-secondary">
                    Página <span className="text-white font-bold">{currentPage}</span> de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-[#282d37] bg-[#13151b] text-white disabled:text-text-secondary disabled:opacity-40 hover:border-brand-primary/50 transition-all"
                    title="Próxima página"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dica do Mentor */}
          <div className="bg-[#1c1f26] border border-brand-primary/30 rounded-2xl p-5 shadow-sm">
            <h4 className="font-bold text-brand-primary text-sm mb-1.5 flex items-center gap-2">
              <Lightbulb size={16} />
              Dica do Mentor
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Não copie o enunciado da questão. Foque em registrar com suas próprias palavras o motivo do erro, a regra certa e um macete mnemônico para consolidar na memória de longo prazo.
            </p>
          </div>
        </section>
      </div>

      {/* Floating button */}
      <div className="fixed right-5 bottom-5 z-30 flex flex-col items-end gap-3">
        {dueTodayCount > 0 && (
          <div className="bg-[#1c1f26] border border-[#282d37] rounded-xl shadow-xl px-4 py-3 text-xs text-white">
            Você tem {dueTodayCount} {dueTodayCount === 1 ? 'revisão' : 'revisões'} agendadas para hoje! ✨
          </div>
        )}
        <button
          className="w-12 h-12 rounded-full bg-brand-primary text-white shadow-lg flex items-center justify-center hover:bg-brand-primary/90 transition-all"
          title="Pendências do guia"
        >
          <Flag size={20} />
        </button>
      </div>
    </motion.div>
  );
}
