import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Timer, 
  History, 
  Play, 
  BarChart3, 
  AlertCircle, 
  Sparkles,
  ChevronRight,
  Info,
  GripVertical,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { StatCard } from '../ui/StatCard';
import { cn } from '../../lib/utils';
import {
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Subject, CycleBlock } from '../../types';
import { getSubjectBadgeClass } from '../../utils/subjectColors';

const WEEK_DAYS = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' }
];

type CycleDraftBlock = {
  id: string;
  subjectId: string;
  type: CycleBlock['type'];
  durationMinutes: number;
};

interface DashboardHomeProps {
  user: any;
  profile: any;
  avgAccuracy: number;
  totalHours: number;
  totalQuestions: number;
  sessions: any[];
  subjects: Subject[];
  cycleBlocks: CycleBlock[];
  prioritySubjects: any[];
  setSelectedSubject: (id: string) => void;
  setActiveTab: (tab: string) => void;
  chartData: any[];
  setTimerActive: (active: boolean) => void;
  dailyAverage: number;
  recordManualStudySession: (subjectId: string, minutes: number, type: string) => Promise<boolean>;
  saveCycleDayBlocks: (dayOfWeek: number, blocks: Array<{ subjectId: string; type: string; durationMinutes: number }>) => Promise<boolean>;
}

export function DashboardHome({
  user,
  profile,
  avgAccuracy,
  totalHours,
  totalQuestions,
  sessions,
  subjects,
  cycleBlocks,
  prioritySubjects,
  setSelectedSubject,
  setActiveTab,
  chartData,
  setTimerActive,
  dailyAverage,
  recordManualStudySession,
  saveCycleDayBlocks
}: DashboardHomeProps) {
  const targetContest = profile?.targetExam || profile?.concursoAlvo || (profile?.area === 'controle' ? 'Tribunais de Contas' : 'Área Administrativa');

  const [savingQuickSession, setSavingQuickSession] = React.useState<string | null>(null);
  const [completedBlockIds, setCompletedBlockIds] = React.useState<Set<string>>(new Set());
  const [isCycleEditorOpen, setIsCycleEditorOpen] = React.useState(false);
  const [selectedCycleDay, setSelectedCycleDay] = React.useState(new Date().getDay());
  const [draftBlocks, setDraftBlocks] = React.useState<CycleDraftBlock[]>([]);
  const [draggedDraftId, setDraggedDraftId] = React.useState<string | null>(null);
  const [savingCycleDay, setSavingCycleDay] = React.useState(false);
  const weeklyHours = chartData.map(item => Number(item.horas || 0));
  const nonZeroHours = weeklyHours.filter(value => value > 0);
  const minHours = nonZeroHours.length > 0 ? Math.min(...nonZeroHours) : 0;
  const maxHours = weeklyHours.length > 0 ? Math.max(...weeklyHours) : 0;
  const yPadding = Math.max(0.2, (maxHours - minHours || maxHours || 1) * 0.2);
  const yDomain: [number, number] = [
    minHours > yPadding ? Number((minHours - yPadding).toFixed(1)) : 0,
    Number((maxHours + yPadding).toFixed(1))
  ];
  const todayDay = new Date().getDay();
  const subjectById = React.useMemo(() => new Map(subjects.map(subject => [subject.id, subject])), [subjects]);

  const getBlocksForDay = React.useCallback((dayOfWeek: number) => {
    const dayBlocks = cycleBlocks.filter(block => block.dayOfWeek === dayOfWeek);
    if (dayBlocks.length > 0) return dayBlocks;
    return cycleBlocks.filter(block => block.dayOfWeek === undefined || block.dayOfWeek === null);
  }, [cycleBlocks]);

  const todayCycleBlocks = React.useMemo(() => {
    return getBlocksForDay(todayDay).sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [getBlocksForDay, todayDay]);

  const syncDraftBlocks = React.useCallback((dayOfWeek: number) => {
    const blocks = getBlocksForDay(dayOfWeek)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(block => ({
        id: block.id,
        subjectId: block.subjectId,
        type: block.type,
        durationMinutes: block.durationMinutes || 60
      }));

    setDraftBlocks(blocks);
  }, [getBlocksForDay]);

  const openCycleEditor = () => {
    setSelectedCycleDay(todayDay);
    syncDraftBlocks(todayDay);
    setIsCycleEditorOpen(true);
  };

  const changeCycleDay = (dayOfWeek: number) => {
    setSelectedCycleDay(dayOfWeek);
    syncDraftBlocks(dayOfWeek);
  };

  const addDraftBlock = () => {
    const firstSubject = subjects.find(subject => subject.status === 'active') || subjects[0];
    setDraftBlocks(current => [
      ...current,
      {
        id: `draft-${Date.now()}`,
        subjectId: firstSubject?.id || '',
        type: 'teoria',
        durationMinutes: 60
      }
    ]);
  };

  const updateDraftBlock = (id: string, updates: Partial<CycleDraftBlock>) => {
    setDraftBlocks(current => current.map(block => block.id === id ? { ...block, ...updates } : block));
  };

  const removeDraftBlock = (id: string) => {
    setDraftBlocks(current => current.filter(block => block.id !== id));
  };

  const moveDraftBlock = (fromId: string, toId: string) => {
    setDraftBlocks(current => {
      const fromIndex = current.findIndex(block => block.id === fromId);
      const toIndex = current.findIndex(block => block.id === toId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return current;

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleSaveCycleDay = async () => {
    if (savingCycleDay) return;
    setSavingCycleDay(true);
    try {
      const saved = await saveCycleDayBlocks(selectedCycleDay, draftBlocks);
      if (saved) setIsCycleEditorOpen(false);
    } finally {
      setSavingCycleDay(false);
    }
  };

  const handleQuickComplete = async (block: CycleBlock) => {
    if (savingQuickSession) return;
    setSavingQuickSession(block.id);
    try {
      const saved = await recordManualStudySession(block.subjectId, block.durationMinutes || 60, block.type);
      if (saved) {
        setCompletedBlockIds(current => new Set(current).add(block.id));
      }
    } finally {
      setSavingQuickSession(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }} 
      key="dashboard" 
      className="pb-20"
    >
      <header className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Olá, {user?.displayName?.split(' ')[0]}! 👋</h1>
        <p className="text-text-secondary text-sm sm:text-base">Foco total na sua preparação para <span className="text-brand-primary font-bold">{targetContest}</span>.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatCard 
          icon={<TrendingUp className="text-brand-primary" />} 
          label="Desempenho" 
          value={`${avgAccuracy}%`} 
          trend={avgAccuracy > 0 ? "+2%" : ""} 
          color="green" 
        />
        <StatCard 
          icon={<Clock className="text-brand-primary" />}
          label="Horas Totais" 
          value={`${totalHours.toFixed(1)}h`} 
          trend={totalHours > 0 ? "+15%" : ""} 
          color="green"
        />
        <StatCard 
          icon={<CheckCircle2 className="text-brand-primary" />}
          label="Questões" 
          value={`${totalQuestions}`} 
          trend={totalQuestions > 10 ? "+10%" : ""} 
          color="green"
        />
        <StatCard 
          icon={<Timer className="text-brand-primary" />}
          label="Média Diária" 
          value={`${dailyAverage.toFixed(1)}h`} 
          trend={dailyAverage > 0 ? "+5%" : ""} 
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-card border border-brand-primary/20 rounded-3xl p-6 shadow-lg shadow-brand-primary/5">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  <History size={18} className="text-brand-primary" /> Ciclo de Hoje
                </h3>
                <p className="text-xs text-text-secondary mt-1">Sua ação imediata para continuar o estudo de hoje.</p>
              </div>
              <button
                onClick={openCycleEditor}
                className="text-xs font-bold text-brand-primary hover:underline whitespace-nowrap"
              >
                Ajustar ciclo
              </button>
            </div>
            <div className="space-y-4">
              {todayCycleBlocks.length > 0 ? (
                todayCycleBlocks.slice(0, 4).map((block, i) => {
                  const isCompleted = completedBlockIds.has(block.id);

                  return (
                  <div key={block.id} className="flex items-center gap-4 p-3 rounded-xl bg-background border border-border group hover:border-brand-primary/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-xs">
                      {i + 1}º
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <span className={cn(
                        "inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-bold shadow-sm",
                        getSubjectBadgeClass(subjectById.get(block.subjectId)),
                        isCompleted && "line-through"
                      )}>
                        <span className="truncate">{block.subjectName}</span>
                      </span>
                      <div className="flex gap-2 mt-0.5">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                          block.type === 'teoria' ? "bg-brand-blue/10 text-brand-blue" : 
                          block.type === 'questoes' ? "bg-brand-primary/10 text-brand-primary" : "bg-brand-orange/10 text-brand-orange"
                        )}>{block.type}</span>
                        <span className="text-[10px] text-text-secondary">{block.durationMinutes} min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQuickComplete(block)}
                        disabled={savingQuickSession === block.id || isCompleted}
                        className="p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-brand-green/10 text-brand-green rounded-lg transition-all disabled:opacity-50"
                        title="Marcar como estudado"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSubject(block.subjectId);
                          setActiveTab('timer');
                          setTimerActive(true);
                        }}
                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-brand-primary/10 text-brand-primary rounded-lg transition-all"
                        title="Iniciar cronômetro"
                      >
                        <Play size={16} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                  );
                })
              ) : (
                <div className="py-8 text-center bg-brand-primary/5 rounded-2xl border border-dashed border-brand-primary/20">
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary mx-auto mb-3">
                    <History size={20} />
                  </div>
                  <p className="text-xs text-text-secondary mb-4 px-4">Seu ciclo de estudos ainda não foi configurado.</p>
                  <button 
                    onClick={() => setActiveTab('cycle')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-brand-primary/80 transition-all"
                  >
                    Gerar Ciclo Automático
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-primary" /> Atividade Semanal
            </h3>
            <div className="h-64">
              {sessions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} domain={yDomain} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--card-color)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--brand-primary)' }}
                      formatter={(value: number) => [`${value}h`, 'Horas']}
                    />
                    <Bar dataKey="horas" fill="var(--brand-primary)" radius={[8, 8, 0, 0]} maxBarSize={42} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-12 h-12 bg-brand-blue/10 rounded-full flex items-center justify-center text-brand-blue mb-4">
                    <BarChart3 size={24} />
                  </div>
                  <p className="text-sm text-text-secondary">Seus dados aparecerão após sua primeira sessão de estudo.</p>
                  <p className="text-[10px] text-text-secondary/60 mt-1">Inicie um bloco no Plano do Dia para começar a registrar seu progresso.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-5 space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  <AlertCircle size={18} className="text-brand-primary" /> Prioridades de Estudo
                </h3>
                <p className="text-xs text-text-secondary mt-1">Prioridade combina peso, desempenho em questões e horas estudadas.</p>
              </div>
              <div className="group relative">
                <Info size={16} className="text-text-secondary" />
                <div className="hidden group-hover:block absolute right-0 top-6 z-10 w-64 rounded-xl border border-border bg-card p-3 text-xs text-text-secondary shadow-xl">
                  Vermelho: prioridade alta. Amarelo: atenção intermediária. Azul: acompanhamento normal.
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mb-5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-red" /> Alta</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-yellow" /> Média</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-blue" /> Normal</span>
            </div>
            <div className="space-y-4">
              {prioritySubjects.length > 0 ? (
                prioritySubjects.slice(0, 5).map((sub, i) => (
                  <div key={sub.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-background border border-border">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full", 
                        i === 0 ? "bg-brand-red" : sub.priorityScore > 150 ? "bg-brand-yellow" : "bg-brand-blue"
                      )} />
                      <span className={cn(
                        "inline-flex max-w-[150px] sm:max-w-none items-center rounded-full border px-2.5 py-1 text-xs font-bold shadow-sm",
                        getSubjectBadgeClass(sub)
                      )}>
                        <span className="truncate">{sub.name}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-text-secondary">
                        {sub.questionTotal > 0 ? `${sub.accuracy}% acerto` : 'Sem questões'}
                      </span>
                      <span className={cn(
                        "text-xs font-bold",
                        i === 0 ? "text-brand-red" : "text-brand-primary"
                      )}>{Math.round(sub.priorityScore)} pts</span>
                      <button
                        onClick={() => {
                          setSelectedSubject(sub.id);
                          setActiveTab('timer');
                        }}
                        disabled={savingQuickSession === sub.id}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 disabled:opacity-50"
                        title="Abrir cronômetro"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-xs text-text-secondary mb-4">Nenhuma prioridade identificada.</p>
                  <button 
                    onClick={() => setActiveTab('subjects')}
                    className="text-xs font-bold text-brand-primary hover:underline"
                  >
                    Adicionar Disciplinas
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-brand-primary mb-3 flex items-center gap-2">
              <Sparkles size={18} /> Dica de Estudo do Mentor
            </h3>
            <p className="text-sm text-brand-primary/90 leading-relaxed">
              <strong>Técnica do Ciclo:</strong> Nunca estude apenas uma matéria por dia. A alternância mantém seu cérebro em estado de alerta e melhora a retenção a longo prazo. Hoje, tente intercalar as 3 matérias sugeridas no seu ciclo acima.
            </p>
          </div>
        </div>
      </div>

      {isCycleEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-6">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Ajustar ciclo do dia</h3>
                <p className="mt-1 text-xs text-text-secondary">
                  Cada dia da semana salva sua própria sequência de matérias.
                </p>
              </div>
              <button
                onClick={() => setIsCycleEditorOpen(false)}
                className="rounded-lg border border-border p-2 text-text-secondary hover:text-brand-primary hover:border-brand-primary/50 transition-all"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[calc(90vh-148px)] overflow-y-auto p-5 custom-scrollbar">
              <div className="mb-5 flex flex-wrap gap-2">
                {WEEK_DAYS.map(day => (
                  <button
                    key={day.value}
                    onClick={() => changeCycleDay(day.value)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-bold transition-all",
                      selectedCycleDay === day.value
                        ? "border-brand-primary bg-brand-primary text-white"
                        : "border-border bg-card text-text-secondary hover:border-brand-primary/50 hover:text-brand-primary"
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {draftBlocks.map((block, index) => (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={() => setDraggedDraftId(block.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (draggedDraftId) moveDraftBlock(draggedDraftId, block.id);
                      setDraggedDraftId(null);
                    }}
                    className="grid grid-cols-[auto_1fr] gap-3 rounded-xl border border-border bg-background p-3 sm:grid-cols-[auto_1.4fr_1fr_0.7fr_auto] sm:items-center"
                  >
                    <div className="flex items-center gap-2 text-text-secondary">
                      <GripVertical size={18} />
                      <span className="text-xs font-bold text-brand-primary">{index + 1}</span>
                    </div>

                    <select
                      value={block.subjectId}
                      onChange={(event) => updateDraftBlock(block.id, { subjectId: event.target.value })}
                      className="min-w-0 rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-primary"
                    >
                      <option value="">Matéria</option>
                      {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                      ))}
                    </select>

                    <select
                      value={block.type}
                      onChange={(event) => updateDraftBlock(block.id, { type: event.target.value as CycleBlock['type'] })}
                      className={cn(
                        "rounded-lg border border-border px-3 py-2 text-xs font-bold uppercase tracking-wider outline-none focus:border-brand-primary",
                        block.type === 'teoria'
                          ? "bg-brand-blue/10 text-brand-blue"
                          : block.type === 'questoes'
                            ? "bg-brand-primary/10 text-brand-primary"
                            : "bg-brand-orange/10 text-brand-orange"
                      )}
                    >
                      <option value="teoria">TEORIA</option>
                      <option value="revisao">REVISÃO</option>
                      <option value="questoes">EXERCÍCIOS</option>
                    </select>

                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={block.durationMinutes}
                      onChange={(event) => updateDraftBlock(block.id, { durationMinutes: Number(event.target.value) })}
                      className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold text-text-primary outline-none focus:border-brand-primary"
                      aria-label="Duração em minutos"
                    />

                    <button
                      onClick={() => removeDraftBlock(block.id)}
                      className="rounded-lg border border-border p-2 text-text-secondary hover:border-brand-red/50 hover:bg-brand-red/10 hover:text-brand-red transition-all"
                      title="Remover matéria"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                {draftBlocks.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center text-sm text-text-secondary">
                    Nenhuma matéria configurada para este dia.
                  </div>
                )}

                <button
                  onClick={addDraftBlock}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-3 text-sm font-bold text-text-secondary hover:border-brand-primary/50 hover:text-brand-primary transition-all"
                >
                  <Plus size={18} />
                  Adicionar matéria
                </button>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border p-5 sm:flex-row sm:justify-end">
              <button
                onClick={() => setIsCycleEditorOpen(false)}
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-bold text-text-secondary hover:text-text-primary hover:border-brand-primary/50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCycleDay}
                disabled={savingCycleDay}
                className="rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-primary/80 disabled:opacity-50 transition-all"
              >
                {savingCycleDay ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
