import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, ListChecks, Search } from 'lucide-react';
import { DailyBlock, Session, Subject } from '../../types';
import { getSubjectBadgeClass } from '../../utils/subjectColors';

interface CalendarTabProps {
  sessions: Session[];
  dailyBlocks: DailyBlock[];
  subjects: Subject[];
  setActiveTab: (tab: string) => void;
}

type CalendarView = 'month' | 'agenda';

interface CalendarEvent {
  id: string;
  dateKey: string;
  subjectId: string;
  subjectName: string;
  type: string;
  durationMinutes: number;
  source: 'Plano' | 'Sessão';
  status?: DailyBlock['status'];
  order: number;
}

interface CalendarDay {
  date: Date;
  dateKey: string;
  inCurrentMonth: boolean;
  isToday: boolean;
}

const weekDays = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];

const pad = (value: number) => String(value).padStart(2, '0');

const getDateKey = (date: Date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const parseCalendarDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const timestamp = value as { toDate?: unknown; seconds?: unknown };
  if (typeof timestamp.toDate === 'function') {
    const parsed = timestamp.toDate();
    return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
  }
  if (typeof timestamp.seconds === 'number') {
    return new Date(timestamp.seconds * 1000);
  }

  return null;
};

const buildMonthDays = (monthDate: Date): CalendarDay[] => {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());
  const todayKey = getDateKey(new Date());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const dateKey = getDateKey(date);

    return {
      date,
      dateKey,
      inCurrentMonth: date.getMonth() === monthDate.getMonth(),
      isToday: dateKey === todayKey,
    };
  });
};

const formatMonthTitle = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date).toUpperCase();
};

const formatSelectedDate = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(date);
};

const normalizeType = (type: string) => {
  const map: Record<string, string> = {
    teoria: 'TEORIA',
    questoes: 'QUESTÕES',
    revisão: 'REVISÃO',
    revisao: 'REVISÃO',
  };

  return map[type] ?? type.toUpperCase();
};

export function CalendarTab({ sessions, dailyBlocks, subjects, setActiveTab }: CalendarTabProps) {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [view, setView] = useState<CalendarView>('month');
  const [searchTerm, setSearchTerm] = useState('');

  const subjectById = useMemo(() => {
    return new Map(subjects.map((subject) => [subject.id, subject]));
  }, [subjects]);

  const subjectByName = useMemo(() => {
    return new Map(subjects.map((subject) => [subject.name.toLowerCase(), subject]));
  }, [subjects]);

  const events = useMemo<CalendarEvent[]>(() => {
    const planEvents = dailyBlocks.map((block) => ({
      id: `daily-${block.id}`,
      dateKey: block.date,
      subjectId: block.subjectId,
      subjectName: block.subjectName,
      type: block.type,
      durationMinutes: block.durationMinutes,
      source: 'Plano' as const,
      status: block.status,
      order: block.order,
    }));

    const sessionEvents = sessions.reduce<CalendarEvent[]>((acc, session, index) => {
      const date = parseCalendarDate(session.timestamp);
      if (!date) return acc;

      acc.push({
        id: `session-${session.id}`,
        dateKey: getDateKey(date),
        subjectId: session.subjectId,
        subjectName: session.subjectName,
        type: session.type,
        durationMinutes: session.durationMinutes,
        source: 'Sessão',
        status: 'concluido',
        order: index,
      });

      return acc;
    }, []);

    return [...planEvents, ...sessionEvents].sort((a, b) => {
      if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
      if (a.source !== b.source) return a.source.localeCompare(b.source);
      return a.order - b.order;
    });
  }, [dailyBlocks, sessions]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return events;

    return events.filter((event) => {
      return [
        event.subjectName,
        normalizeType(event.type),
        event.source,
        `${event.durationMinutes} min`,
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [events, searchTerm]);

  const eventsByDate = useMemo(() => {
    return filteredEvents.reduce<Map<string, CalendarEvent[]>>((acc, event) => {
      const currentEvents = acc.get(event.dateKey) ?? [];
      currentEvents.push(event);
      acc.set(event.dateKey, currentEvents);
      return acc;
    }, new Map());
  }, [filteredEvents]);

  const monthDays = useMemo(() => buildMonthDays(currentMonth), [currentMonth]);
  const selectedDateKey = getDateKey(selectedDate);
  const selectedEvents = eventsByDate.get(selectedDateKey) ?? [];
  const monthEventCount = monthDays.reduce((total, day) => total + (eventsByDate.get(day.dateKey)?.length ?? 0), 0);
  const monthStudyMinutes = monthDays.reduce((total, day) => {
    return total + (eventsByDate.get(day.dateKey)?.reduce((sum, event) => sum + event.durationMinutes, 0) ?? 0);
  }, 0);

  const goToMonth = (direction: number) => {
    setCurrentMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + direction, 1));
  };

  const goToToday = () => {
    const nextToday = new Date();
    setCurrentMonth(new Date(nextToday.getFullYear(), nextToday.getMonth(), 1));
    setSelectedDate(nextToday);
  };

  const getSubjectForEvent = (event: CalendarEvent) => {
    return subjectById.get(event.subjectId) ?? subjectByName.get(event.subjectName.toLowerCase()) ?? null;
  };

  const renderEventPill = (event: CalendarEvent, compact = false) => {
    const subject = getSubjectForEvent(event);

    return (
      <div
        key={event.id}
        className="flex items-center gap-2 rounded-lg border border-border bg-background/70 px-2 py-1 text-xs text-text-primary"
        title={`${event.subjectName} • ${normalizeType(event.type)} • ${event.durationMinutes} min`}
      >
        <span className={`max-w-[110px] truncate rounded-full border px-2 py-0.5 text-[10px] font-bold ${getSubjectBadgeClass(subject)}`}>
          {event.subjectName}
        </span>
        {!compact && (
          <>
            <span className="text-text-secondary">{normalizeType(event.type)}</span>
            <span className="ml-auto text-text-secondary">{event.durationMinutes} min</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-text-primary">
            <CalendarDays className="h-8 w-8 text-brand-primary" />
            Calendário
          </h1>
          <p className="mt-2 text-text-secondary">
            Veja planos, sessões registradas e volume de estudo por dia.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar matéria, tipo..."
              className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary outline-none transition-colors focus:border-brand-primary sm:w-72"
            />
          </div>

          <div className="flex rounded-xl border border-border bg-card p-1">
            {(['month', 'agenda'] as CalendarView[]).map((option) => (
              <button
                key={option}
                onClick={() => setView(option)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  view === option
                    ? 'bg-brand-primary text-white'
                    : 'text-text-secondary hover:bg-border/30 hover:text-text-primary'
                }`}
              >
                {option === 'month' ? 'Mês' : 'Agenda'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 text-text-secondary">
            <ListChecks className="h-5 w-5 text-brand-primary" />
            <span className="text-sm font-semibold uppercase tracking-wide">Eventos no mês</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-text-primary">{monthEventCount}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 text-text-secondary">
            <Clock className="h-5 w-5 text-brand-primary" />
            <span className="text-sm font-semibold uppercase tracking-wide">Tempo planejado/registrado</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-text-primary">{Math.round(monthStudyMinutes / 60)}h</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Dia selecionado</div>
          <p className="mt-3 text-lg font-bold capitalize text-text-primary">{formatSelectedDate(selectedDate)}</p>
          <p className="mt-1 text-sm text-text-secondary">{selectedEvents.length} evento(s)</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToMonth(-1)}
              className="rounded-lg border border-border p-2 text-text-secondary transition-colors hover:bg-border/30 hover:text-text-primary"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => goToMonth(1)}
              className="rounded-lg border border-border p-2 text-text-secondary transition-colors hover:bg-border/30 hover:text-text-primary"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={goToToday}
              className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Hoje
            </button>
          </div>

          <h2 className="text-center text-xl font-bold tracking-wide text-text-primary">{formatMonthTitle(currentMonth)}</h2>

          <button
            onClick={() => setActiveTab('daily')}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-brand-primary transition-colors hover:bg-border/30"
          >
            Abrir Plano do Dia
          </button>
        </div>

        {view === 'month' ? (
          <div className="overflow-x-auto">
            <div className="min-w-[920px]">
              <div className="grid grid-cols-7 border-b border-border bg-background/60">
                {weekDays.map((day) => (
                  <div key={day} className="border-r border-border px-3 py-2 text-center text-sm font-bold text-text-primary last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {monthDays.map((day) => {
                  const dayEvents = eventsByDate.get(day.dateKey) ?? [];
                  const isSelected = day.dateKey === selectedDateKey;

                  return (
                    <button
                      key={day.dateKey}
                      onClick={() => setSelectedDate(day.date)}
                      className={`min-h-[128px] border-b border-r border-border p-2 text-left transition-colors last:border-r-0 hover:bg-border/20 ${
                        isSelected ? 'bg-brand-primary/10' : 'bg-card'
                      } ${!day.inCurrentMonth ? 'text-text-secondary opacity-50' : 'text-text-primary'}`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                          day.isToday ? 'bg-brand-primary text-white' : ''
                        }`}>
                          {day.date.getDate()}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[11px] font-bold text-brand-primary">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => renderEventPill(event, true))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs font-semibold text-text-secondary">+{dayEvents.length - 3} evento(s)</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <div key={event.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-text-secondary">
                      {new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' }).format(new Date(`${event.dateKey}T12:00:00`))}
                    </div>
                    {renderEventPill(event)}
                  </div>
                  <span className="w-fit rounded-full border border-border bg-background px-3 py-1 text-xs font-bold text-text-secondary">
                    {event.source}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-text-secondary">Nenhum evento encontrado para o filtro atual.</div>
            )}
          </div>
        )}
      </div>

      {view === 'month' && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-text-primary">Agenda do dia</h3>
              <p className="text-sm capitalize text-text-secondary">{formatSelectedDate(selectedDate)}</p>
            </div>
            <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary">
              {selectedEvents.length} evento(s)
            </span>
          </div>

          <div className="space-y-2">
            {selectedEvents.length > 0 ? (
              selectedEvents.map((event) => (
                <div key={event.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                  {renderEventPill(event)}
                  <span className="w-fit rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-text-secondary">
                    {event.source}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center text-text-secondary">
                Nenhum plano ou sessão registrado nesse dia.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
