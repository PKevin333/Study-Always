import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronDown, Clock, Filter, History, ListChecks, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Session, Subject } from '../../types';
import { getSubjectColorHex } from '../../utils/subjectColors';
import { SubjectTag } from '../shared/SubjectTag';

interface HistoryTabProps {
  sessions: Session[];
  subjects: Subject[];
  deleteStudySession: (session: Session) => Promise<boolean>;
}

type StudyType = 'teoria' | 'questoes' | 'revisao';

interface SessionGroup {
  key: string;
  subjectId: string;
  subjectName: string;
  sessions: Session[];
  totalMinutes: number;
  types: Set<StudyType>;
  latestTimestamp: number;
}

interface PeriodGroup {
  key: string;
  label: string;
  order: number;
  groups: SessionGroup[];
}

const studyTypeLabels: Record<StudyType, string> = {
  teoria: 'Teoria',
  questoes: 'Questões',
  revisao: 'Revisão'
};

const normalizeStudyType = (type: string): StudyType => {
  return type === 'questoes' || type === 'revisao' ? type : 'teoria';
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'object' && 'seconds' in value && typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  if (typeof value !== 'string' && typeof value !== 'number') return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateTime = (value: any) => {
  const date = toDate(value);
  if (!date) return 'Data não disponível';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const formatTimeOrDate = (value: any) => {
  const date = toDate(value);
  if (!date) return 'horário indisponível';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate()
    && date.getMonth() === now.getMonth()
    && date.getFullYear() === now.getFullYear();

  if (isToday) {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  }).format(date);
};

const getPeriodInfo = (value: any) => {
  const date = toDate(value);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfWeek = startOfToday - today.getDay() * 24 * 60 * 60 * 1000;
  const timestamp = date?.getTime() || 0;

  if (timestamp >= startOfToday) return { key: 'today', label: 'Hoje', order: 0 };
  if (timestamp >= startOfYesterday) return { key: 'yesterday', label: 'Ontem', order: 1 };
  if (timestamp >= startOfWeek) return { key: 'week', label: 'Esta semana', order: 2 };
  return { key: 'older', label: 'Mais antigo', order: 3 };
};

const formatDuration = (minutes: number) => {
  const safeMinutes = Math.max(0, Math.floor(minutes || 0));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;

  if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
  if (hours > 0) return `${hours}h`;
  return `${mins}min`;
};

export function HistoryTab({ sessions, subjects, deleteStudySession }: HistoryTabProps) {
  const [subjectFilter, setSubjectFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState<'all' | StudyType>('all');
  const [deletingSessionId, setDeletingSessionId] = React.useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());
  const subjectById = React.useMemo(() => new Map(subjects.map(subject => [subject.id, subject])), [subjects]);

  const sortedSessions = React.useMemo(() => {
    return [...sessions].sort((a, b) => {
      const dateA = toDate(a.timestamp)?.getTime() || 0;
      const dateB = toDate(b.timestamp)?.getTime() || 0;
      return dateB - dateA;
    });
  }, [sessions]);

  const filteredSessions = React.useMemo(() => {
    return sortedSessions.filter(session => {
      const matchesSubject = subjectFilter === 'all' || session.subjectId === subjectFilter;
      const matchesType = typeFilter === 'all' || normalizeStudyType(session.type) === typeFilter;
      return matchesSubject && matchesType;
    });
  }, [sortedSessions, subjectFilter, typeFilter]);

  const groupedHistory = React.useMemo<PeriodGroup[]>(() => {
    const periods = new Map<string, Omit<PeriodGroup, 'groups'> & { groups: Map<string, SessionGroup> }>();

    filteredSessions.forEach(session => {
      const periodInfo = getPeriodInfo(session.timestamp);
      const period = periods.get(periodInfo.key) ?? {
        key: periodInfo.key,
        label: periodInfo.label,
        order: periodInfo.order,
        groups: new Map<string, SessionGroup>()
      };
      periods.set(periodInfo.key, period);

      const subjectKey = session.subjectId || session.subjectName || 'unknown';
      const groupKey = `${periodInfo.key}-${subjectKey}`;
      const group = period.groups.get(groupKey) ?? {
        key: groupKey,
        subjectId: session.subjectId,
        subjectName: session.subjectName || 'Disciplina não encontrada',
        sessions: [],
        totalMinutes: 0,
        types: new Set<StudyType>(),
        latestTimestamp: 0
      };

      const timestamp = toDate(session.timestamp)?.getTime() || 0;
      group.sessions.push(session);
      group.totalMinutes += session.durationMinutes || 0;
      group.types.add(normalizeStudyType(session.type));
      group.latestTimestamp = Math.max(group.latestTimestamp, timestamp);
      period.groups.set(groupKey, group);
    });

    return Array.from(periods.values())
      .sort((a, b) => a.order - b.order)
      .map(period => ({
        key: period.key,
        label: period.label,
        order: period.order,
        groups: Array.from(period.groups.values())
          .map(group => ({
            ...group,
            sessions: [...group.sessions].sort((a, b) => {
              const dateA = toDate(a.timestamp)?.getTime() || 0;
              const dateB = toDate(b.timestamp)?.getTime() || 0;
              return dateB - dateA;
            })
          }))
          .sort((a, b) => b.latestTimestamp - a.latestTimestamp)
      }));
  }, [filteredSessions]);

  const totalMinutes = filteredSessions.reduce((total, session) => total + (session.durationMinutes || 0), 0);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(current => {
      const next = new Set(current);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const handleDeleteSession = async (session: Session) => {
    if (deletingSessionId) return;

    const confirmed = window.confirm(
      `Excluir esta sessão de ${formatDuration(session.durationMinutes)} em ${session.subjectName || 'disciplina não encontrada'}? As horas da disciplina serão recalculadas.`
    );
    if (!confirmed) return;

    setDeletingSessionId(session.id);
    try {
      await deleteStudySession(session);
    } finally {
      setDeletingSessionId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      key="history"
      className="pb-20"
    >
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Histórico de Sessões</h2>
          <p className="text-text-secondary text-sm sm:text-base">
            Consulte os estudos registrados pelo cronômetro, ciclo, kanban e plano do dia.
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl px-5 py-3 min-w-[180px]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Total exibido</div>
          <div className="text-xl font-black text-brand-primary">{formatDuration(totalMinutes)}</div>
        </div>
      </header>

      <section className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-brand-primary" />
          <h3 className="font-bold">Filtros</h3>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <select
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
            className="bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-brand-primary"
          >
            <option value="all">Todas as disciplinas</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as 'all' | StudyType)}
            className="bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-brand-primary"
          >
            <option value="all">Todos os tipos</option>
            <option value="teoria">Teoria</option>
            <option value="questoes">Questões</option>
            <option value="revisao">Revisão</option>
          </select>
        </div>
      </section>

      <section className="space-y-6">
        {filteredSessions.length > 0 ? (
          groupedHistory.map(period => (
            <div key={period.key} className="space-y-3">
              <div className="px-1 text-xs font-bold uppercase tracking-wider text-text-secondary">
                {period.label}
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                {period.groups.map((group, groupIndex) => {
                  const isExpanded = expandedGroups.has(group.key);
                  const hasTypeVariation = group.types.size > 1;
                  const primaryType = Array.from(group.types)[0] as StudyType;
                  const groupSubject = subjectById.get(group.subjectId);

                  return (
                    <div
                      key={group.key}
                      className={cn(groupIndex !== period.groups.length - 1 && 'border-b border-border')}
                    >
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.key)}
                        className="w-full p-4 text-left transition-colors hover:bg-background/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex min-w-0 items-center gap-2">
                              <div className="max-w-full flex-1">
                                <SubjectTag
                                  subjectName={group.subjectName}
                                  color={getSubjectColorHex(groupSubject)}
                                />
                              </div>
                              <span className="truncate text-sm text-text-secondary">
                                · {group.sessions.length} {group.sessions.length === 1 ? 'sessão' : 'sessões'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1 text-[11px] text-text-secondary">
                              <span>{hasTypeVariation ? 'Tipos variados' : studyTypeLabels[primaryType]}</span>
                              <span>·</span>
                              <span>última sessão às {formatTimeOrDate(group.sessions[0]?.timestamp)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-text-primary">{formatDuration(group.totalMinutes)}</span>
                            <ChevronDown
                              size={16}
                              className={cn(
                                'text-text-secondary transition-transform',
                                isExpanded && 'rotate-180'
                              )}
                            />
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border bg-background/30">
                          {group.sessions.map(session => {
                            const sessionType = normalizeStudyType(session.type);

                            return (
                              <div
                                key={session.id}
                                className="group/session flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-background/40 sm:flex-row sm:items-center sm:justify-between [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border"
                              >
                                <div className="flex min-w-0 flex-wrap items-center gap-2 text-[11px] text-text-secondary">
                                  <span>{studyTypeLabels[sessionType]}</span>
                                  <span>·</span>
                                  <span className="flex items-center gap-1">
                                    <CalendarDays size={12} />
                                    {formatDateTime(session.timestamp)}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between gap-3 text-sm sm:justify-end">
                                  <div className="flex items-center gap-2 text-text-secondary">
                                    <Clock size={15} />
                                    <span className="font-medium text-text-primary">{formatDuration(session.durationMinutes)}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSession(session)}
                                    disabled={deletingSessionId === session.id}
                                    className="rounded-lg p-2 text-text-secondary opacity-100 transition-all hover:bg-brand-red/10 hover:text-brand-red disabled:opacity-50 sm:opacity-0 sm:group-hover/session:opacity-100"
                                    title="Excluir sessão"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-4">
              {sessions.length > 0 ? <ListChecks size={26} /> : <History size={26} />}
            </div>
            <h3 className="font-bold mb-2">
              {sessions.length > 0 ? 'Nenhum registro encontrado' : 'Nenhuma sessão registrada'}
            </h3>
            <p className="text-sm text-text-secondary max-w-md mx-auto">
              {sessions.length > 0
                ? 'Ajuste os filtros para visualizar outros registros de estudo.'
                : 'Quando você registrar estudos pelo cronômetro, ciclo, kanban ou plano do dia, eles aparecerão aqui.'}
            </p>
          </div>
        )}
      </section>
    </motion.div>
  );
}
