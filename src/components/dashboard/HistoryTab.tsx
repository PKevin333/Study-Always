import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, Filter, History, ListChecks } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Session, Subject } from '../../types';

interface HistoryTabProps {
  sessions: Session[];
  subjects: Subject[];
}

type StudyType = 'teoria' | 'questoes' | 'revisao';

const studyTypeLabels: Record<StudyType, string> = {
  teoria: 'Teoria',
  questoes: 'Questões',
  revisao: 'Revisão'
};

const studyTypeClasses: Record<StudyType, string> = {
  teoria: 'bg-brand-blue/10 text-brand-blue',
  questoes: 'bg-brand-primary/10 text-brand-primary',
  revisao: 'bg-brand-orange/10 text-brand-orange'
};

const normalizeStudyType = (type: string): StudyType => {
  return type === 'questoes' || type === 'revisao' ? type : 'teoria';
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (typeof value === 'object' && 'seconds' in value && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }

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

const formatDuration = (minutes: number) => {
  const safeMinutes = Math.max(0, Math.floor(minutes || 0));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;

  if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
  if (hours > 0) return `${hours}h`;
  return `${mins}min`;
};

export function HistoryTab({ sessions, subjects }: HistoryTabProps) {
  const [subjectFilter, setSubjectFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState<'all' | StudyType>('all');

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

  const totalMinutes = filteredSessions.reduce((total, session) => total + (session.durationMinutes || 0), 0);

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

      <section className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-brand-primary" />
          <h3 className="font-bold">Filtros</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

      <section className="space-y-3">
        {filteredSessions.length > 0 ? (
          filteredSessions.map(session => {
            const sessionType = normalizeStudyType(session.type);

            return (
              <div
                key={session.id}
                className="bg-card border border-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={cn(
                      'text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded',
                      studyTypeClasses[sessionType]
                    )}>
                      {studyTypeLabels[sessionType]}
                    </span>
                    <span className="text-[10px] text-text-secondary flex items-center gap-1">
                      <CalendarDays size={12} />
                      {formatDateTime(session.timestamp)}
                    </span>
                  </div>
                  <h3 className="font-bold truncate">{session.subjectName || 'Disciplina não encontrada'}</h3>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Clock size={16} />
                    <span className="font-bold text-text-primary">{formatDuration(session.durationMinutes)}</span>
                  </div>
                </div>
              </div>
            );
          })
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
