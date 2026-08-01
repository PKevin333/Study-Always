import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { CalendarTask } from '../../types';

interface CalendarTabProps {
  tasks: CalendarTask[];
  addCalendarTask: (task: Omit<CalendarTask, 'id' | 'userId' | 'completed' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateCalendarTask: (id: string, updates: Partial<CalendarTask>) => Promise<boolean>;
  deleteCalendarTask: (id: string) => Promise<boolean>;
  setActiveTab: (tab: string) => void;
}

type CalendarView = 'month' | 'agenda';
type CalendarTaskCategory = CalendarTask['category'];

const weekDays = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
const categoryLabels: Record<CalendarTaskCategory, string> = {
  estudo: 'Estudo',
  revisao: 'Revisão',
  questoes: 'Questões',
  simulado: 'Simulado',
  outro: 'Outro',
};

const categoryClassNames: Record<CalendarTaskCategory, string> = {
  estudo: 'bg-brand-blue/10 text-brand-blue',
  revisao: 'bg-brand-green/10 text-brand-green',
  questoes: 'bg-brand-orange/10 text-brand-orange',
  simulado: 'bg-brand-magenta/10 text-brand-magenta',
  outro: 'bg-border/40 text-text-secondary',
};

const pad = (value: number) => String(value).padStart(2, '0');

const getDateKey = (date: Date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const parseDateKey = (dateKey: string) => {
  return new Date(`${dateKey}T12:00:00`);
};

const formatMonthTitle = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date).toUpperCase();
};

const formatSelectedDate = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(date);
};

const buildMonthDays = (monthDate: Date) => {
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

export function CalendarTab({
  tasks,
  addCalendarTask,
  updateCalendarTask,
  deleteCalendarTask,
}: CalendarTabProps) {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [view, setView] = useState<CalendarView>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<CalendarTaskCategory>('estudo');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const selectedDateKey = getDateKey(selectedDate);
  const monthDays = useMemo(() => buildMonthDays(currentMonth), [currentMonth]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const sortedTasks = [...tasks].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return String(a.time || '').localeCompare(String(b.time || ''));
    });

    if (!normalizedSearch) return sortedTasks;

    return sortedTasks.filter((task) => {
      return [
        task.title,
        task.notes || '',
        categoryLabels[task.category],
        task.time || '',
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [searchTerm, tasks]);

  const tasksByDate = useMemo(() => {
    return filteredTasks.reduce<Map<string, CalendarTask[]>>((acc, task) => {
      const currentTasks = acc.get(task.date) ?? [];
      currentTasks.push(task);
      acc.set(task.date, currentTasks);
      return acc;
    }, new Map());
  }, [filteredTasks]);

  const selectedTasks = tasksByDate.get(selectedDateKey) ?? [];
  const monthTaskCount = monthDays.reduce((total, day) => total + (tasksByDate.get(day.dateKey)?.length ?? 0), 0);
  const pendingTaskCount = filteredTasks.filter((task) => !task.completed).length;

  const handleCreateTask = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || saving) return;

    setSaving(true);
    setFeedback(null);

    try {
      const saved = await addCalendarTask({
        title: trimmedTitle,
        date: selectedDateKey,
        time,
        category,
        notes,
      });

      if (saved) {
        setTitle('');
        setTime('');
        setCategory('estudo');
        setNotes('');
        setFeedback({ type: 'success', message: 'Tarefa adicionada ao calendário.' });
      } else {
        setFeedback({ type: 'error', message: 'Não foi possível salvar a tarefa. Verifique sua conexão e permissões do Firestore.' });
      }
    } catch (error) {
      console.error('Erro ao criar tarefa no calendário:', error);
      setFeedback({ type: 'error', message: 'Não foi possível salvar a tarefa. Verifique sua conexão e tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  const goToMonth = (direction: number) => {
    setCurrentMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + direction, 1));
  };

  const goToToday = () => {
    const nextToday = new Date();
    setCurrentMonth(new Date(nextToday.getFullYear(), nextToday.getMonth(), 1));
    setSelectedDate(nextToday);
  };

  const renderTask = (task: CalendarTask, compact = false) => {
    if (compact) {
      return (
        <div
          key={task.id}
          className={`min-w-0 rounded-lg border border-border bg-background/80 px-2 py-1.5 text-left ${
            task.completed ? 'opacity-60' : ''
          }`}
          title={task.title}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${
              task.category === 'estudo' ? 'bg-brand-blue' :
              task.category === 'revisao' ? 'bg-brand-green' :
              task.category === 'questoes' ? 'bg-brand-orange' :
              task.category === 'simulado' ? 'bg-brand-magenta' :
              'bg-border'
            }`} />
            <span className={`truncate text-xs font-semibold text-text-primary ${task.completed ? 'line-through' : ''}`}>
              {task.time ? `${task.time} ` : ''}{task.title}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        key={task.id}
        className={`rounded-xl border border-border bg-background p-3 transition-opacity ${
          task.completed ? 'opacity-60' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={() => updateCalendarTask(task.id, { completed: !task.completed })}
            className={`mt-0.5 rounded-full transition-colors ${
              task.completed ? 'text-brand-primary' : 'text-text-secondary hover:text-brand-primary'
            }`}
            aria-label={task.completed ? 'Marcar tarefa como pendente' : 'Marcar tarefa como concluída'}
          >
            <CheckCircle2 className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className={`truncate font-semibold text-text-primary ${task.completed ? 'line-through' : ''}`}>
                {task.title}
              </p>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${categoryClassNames[task.category]}`}>
                {categoryLabels[task.category]}
              </span>
            </div>

            {!compact && (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                {task.time && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {task.time}
                  </span>
                )}
                {task.notes && <span className="truncate">{task.notes}</span>}
              </div>
            )}
          </div>

          {!compact && (
            <button
              onClick={() => deleteCalendarTask(task.id)}
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-border/30 hover:text-brand-red"
              aria-label="Excluir tarefa"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
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
            Organize tarefas livres, compromissos e revisões que você quiser acompanhar.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar tarefa..."
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
          <span className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Tarefas no mês</span>
          <p className="mt-3 text-3xl font-bold text-text-primary">{monthTaskCount}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <span className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Pendentes</span>
          <p className="mt-3 text-3xl font-bold text-text-primary">{pendingTaskCount}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <span className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Dia selecionado</span>
          <p className="mt-3 text-lg font-bold capitalize text-text-primary">{formatSelectedDate(selectedDate)}</p>
          <p className="mt-1 text-sm text-text-secondary">{selectedTasks.length} tarefa(s)</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
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

            <span className="text-sm font-semibold text-text-secondary">Clique em um dia para adicionar tarefas</span>
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
                    const dayTasks = tasksByDate.get(day.dateKey) ?? [];
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
                          {dayTasks.length > 0 && (
                            <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[11px] font-bold text-brand-primary">
                              {dayTasks.length}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          {dayTasks.slice(0, 3).map((task) => renderTask(task, true))}
                          {dayTasks.length > 3 && (
                            <div className="text-xs font-semibold text-text-secondary">+{dayTasks.length - 3} tarefa(s)</div>
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
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <div key={task.id} className="p-4">
                    <div className="mb-2 text-sm font-semibold capitalize text-text-secondary">
                      {formatSelectedDate(parseDateKey(task.date))}
                    </div>
                    {renderTask(task)}
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-text-secondary">Nenhuma tarefa encontrada.</div>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <form onSubmit={handleCreateTask} className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-brand-primary" />
              <h3 className="font-bold text-text-primary">Nova tarefa</h3>
            </div>
            <p className="mb-4 text-sm capitalize text-text-secondary">{formatSelectedDate(selectedDate)}</p>

            <div className="space-y-3">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex: resolver questões de português"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary outline-none transition-colors focus:border-brand-primary"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  type="time"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition-colors focus:border-brand-primary"
                />
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as CalendarTaskCategory)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition-colors focus:border-brand-primary"
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Observação opcional"
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary outline-none transition-colors focus:border-brand-primary"
              />

              <button
                type="submit"
                disabled={!title.trim() || saving}
                className="w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Adicionar tarefa'}
              </button>

              {feedback && (
                <div className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                  feedback.type === 'success'
                    ? 'border-brand-green/30 bg-brand-green/10 text-brand-green'
                    : 'border-brand-red/30 bg-brand-red/10 text-brand-red'
                }`}>
                  {feedback.message}
                </div>
              )}
            </div>
          </form>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4">
              <h3 className="font-bold text-text-primary">Tarefas do dia</h3>
              <p className="text-sm capitalize text-text-secondary">{formatSelectedDate(selectedDate)}</p>
            </div>

            <div className="space-y-3">
              {selectedTasks.length > 0 ? (
                selectedTasks.map((task) => renderTask(task))
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center text-sm text-text-secondary">
                  Nenhuma tarefa criada para esse dia.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
