import React from 'react';
import { motion } from 'framer-motion';
import {
  RotateCcw,
  Sparkles,
  Target,
  Clock,
  BookOpen,
  AlertCircle,
  History,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Play,
  Lightbulb,
  Info
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Subject, CycleBlock } from '../../types';
import { getSubjectColorHex } from '../../utils/subjectColors';
import { getStudyTypeBadgeClasses, StudyTypeBadge } from '../shared/StudyTypeBadge';
import { SubjectTag } from '../shared/SubjectTag';
import { designTokens } from '../../styles/designTokens';

const WEEK_DAYS = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' }
];

interface CycleTabProps {
  subjects: Subject[];
  cycleBlocks: CycleBlock[];
  isGenerating: boolean;
  generateCycle: () => void;
  updateCycleSettings: (updates: any) => void;
  cycleFocus: string;
  dailyTime: number;
  dailyTimeMax: number;
  blocksPerDay: number;
  getValidationAlerts: () => any[];
  deleteBlock: (id: string) => void;
  updateBlock: (id: string, updates: any) => void;
  duplicateBlock: (block: any) => void;
  addCycleBlock: (subjectId: string, subjectName: string, type: string, duration: number, dayOfWeek?: number) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  recordManualStudySession: (subjectId: string, minutes: number, type: string) => Promise<boolean>;
}

export function CycleTab({
  subjects,
  cycleBlocks,
  isGenerating,
  generateCycle,
  updateCycleSettings,
  cycleFocus,
  dailyTime,
  dailyTimeMax,
  blocksPerDay,
  getValidationAlerts,
  deleteBlock,
  updateBlock,
  duplicateBlock,
  addCycleBlock,
  updateSubject,
  recordManualStudySession
}: CycleTabProps) {
  const [savingBlockId, setSavingBlockId] = React.useState<string | null>(null);
  const [savedBlockId, setSavedBlockId] = React.useState<string | null>(null);
  const [selectedCycleDay, setSelectedCycleDay] = React.useState(new Date().getDay());
  const feedbackTimerRef = React.useRef<number | null>(null);

  const hasWeeklyBlocks = React.useMemo(
    () => cycleBlocks.some(block => block.dayOfWeek !== undefined && block.dayOfWeek !== null),
    [cycleBlocks]
  );
  const validationAlerts = React.useMemo(() => getValidationAlerts(), [getValidationAlerts]);
  const blockingAlert = React.useMemo(
    () => validationAlerts.find(alert => alert.type === 'warning') || null,
    [validationAlerts]
  );
  const suggestionAlerts = React.useMemo(
    () => validationAlerts.filter(alert => alert.type !== 'warning'),
    [validationAlerts]
  );
  const subjectById = React.useMemo(() => new Map(subjects.map(subject => [subject.id, subject])), [subjects]);

  const visibleCycleBlocks = React.useMemo(() => {
    const blocks = hasWeeklyBlocks
      ? cycleBlocks.filter(block => block.dayOfWeek === selectedCycleDay)
      : cycleBlocks.filter(block => block.dayOfWeek === undefined || block.dayOfWeek === null);

    return [...blocks].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [cycleBlocks, hasWeeklyBlocks, selectedCycleDay]);

  React.useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const handleRecordBlock = async (block: CycleBlock) => {
    if (savingBlockId) return;

    setSavingBlockId(block.id);
    try {
      const saved = await recordManualStudySession(
        block.subjectId,
        block.durationMinutes,
        block.type
      );

      if (saved) {
        setSavedBlockId(block.id);
        if (feedbackTimerRef.current !== null) {
          window.clearTimeout(feedbackTimerRef.current);
        }
        feedbackTimerRef.current = window.setTimeout(() => {
          setSavedBlockId(current => current === block.id ? null : current);
        }, 2500);
      }
    } finally {
      setSavingBlockId(null);
    }
  };

  const handleAddBlock = () => {
    const lastBlock = visibleCycleBlocks[visibleCycleBlocks.length - 1];
    const firstSubject = subjects.find(subject => subject.status === 'active') || subjects[0];
    const subjectId = lastBlock?.subjectId || firstSubject?.id;
    const subjectName = lastBlock?.subjectName || firstSubject?.name;

    if (!subjectId || !subjectName) return;
    addCycleBlock(subjectId, subjectName, 'teoria', 60, selectedCycleDay);
  };

  const handleDailyTimeChange = (minutes: number) => {
    const nextMinutes = Math.min(dailyTimeMax, Math.max(30, minutes));
    updateCycleSettings({ dailyTimeMinutes: nextMinutes });
  };

  const handleDailyTimeMaxChange = (hours: number) => {
    const nextMaxMinutes = Math.min(960, Math.max(60, Math.round(hours * 60)));
    updateCycleSettings({
      dailyTimeMaxMinutes: nextMaxMinutes,
      dailyTimeMinutes: Math.min(dailyTime, nextMaxMinutes)
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      key="cycle"
      className={designTokens.page}
    >
      <header className={designTokens.pageHeader}>
        <div>
          <h2 className={designTokens.pageTitle}>Ciclo de Estudos</h2>
          <p className={designTokens.pageIntro}>Monte seu plano flexível com orientação inteligente.</p>
        </div>
        <div className={`flex w-full sm:w-auto ${designTokens.toolbarGap}`}>
          <button
            onClick={generateCycle}
            disabled={isGenerating}
            className="w-full sm:w-auto bg-brand-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-primary/80 transition-all disabled:opacity-50"
          >
            {isGenerating ? <RotateCcw className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Gerar Ciclo Sugerido
          </button>
        </div>
      </header>

      <div className={`grid grid-cols-1 items-start lg:grid-cols-12 ${designTokens.sectionGrid}`}>
        <div className="space-y-5 self-start lg:col-span-4">
          <div className={designTokens.sectionCard}>
            <h3 className={`${designTokens.cardTitle} mb-4 flex items-center gap-2`}>
              <Target size={18} className="text-brand-primary" /> Foco do Estudo
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'teoria', label: 'Mais Teoria', desc: 'Foco em aprender novos conceitos.' },
                { id: 'questoes', label: 'Mais Questões', desc: 'Foco em fixação e prática.' },
                { id: 'revisao', label: 'Mais Revisão', desc: 'Foco em manutenção do conhecimento.' },
                { id: 'equilibrado', label: 'Equilibrado', desc: 'Mix ideal para evolução constante.' },
              ].map((focus) => (
                <button
                  key={focus.id}
                  onClick={() => updateCycleSettings({ cycleFocus: focus.id })}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-all duration-150",
                    cycleFocus === focus.id
                      ? "border-brand-primary bg-brand-primary/10"
                      : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800 [html[data-theme=light]_&]:border-neutral-200 [html[data-theme=light]_&]:bg-neutral-50 [html[data-theme=light]_&]:hover:bg-neutral-100"
                  )}
                >
                  <div className={cn("mb-1 text-sm font-bold", cycleFocus === focus.id ? "text-brand-primary [html[data-theme=dark]_&]:text-violet-300" : "text-text-primary")}>{focus.label}</div>
                  <div className="text-xs leading-relaxed text-neutral-500 [html[data-theme=dark]_&]:text-neutral-400">{focus.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className={designTokens.sectionCard}>
            <h3 className={`${designTokens.cardTitle} mb-6 flex items-center gap-2`}>
              <Clock size={18} className="text-brand-primary" /> Disponibilidade
            </h3>
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 [html[data-theme=dark]_&]:text-neutral-400">Horas por Dia</label>
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 [html[data-theme=dark]_&]:text-neutral-400">
                    Máx.
                    <input
                      type="number"
                      min={1}
                      max={16}
                      step={0.5}
                      value={Number((dailyTimeMax / 60).toFixed(1))}
                      onChange={(e) => handleDailyTimeMaxChange(Number(e.target.value) || 1)}
                      className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-right text-sm font-semibold text-text-primary outline-none focus:border-brand-primary"
                    />
                    h
                  </label>
                </div>
                <input
                  type="range"
                  min="30"
                  max={dailyTimeMax}
                  step="30"
                  value={dailyTime}
                  onChange={(e) => handleDailyTimeChange(parseInt(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-brand-primary [html[data-theme=dark]_&]:bg-neutral-800"
                />
                <div className="flex justify-between mt-2 text-sm font-bold">
                  <span>{Math.floor(dailyTime / 60)}h {dailyTime % 60 > 0 ? `${dailyTime % 60}min` : ''}</span>
                  <span className="text-text-secondary">Máx: {Math.floor(dailyTimeMax / 60)}h{dailyTimeMax % 60 ? ` ${dailyTimeMax % 60}min` : ''}</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-500 [html[data-theme=dark]_&]:text-neutral-400">Blocos de Estudo</label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <button
                      key={n}
                      onClick={() => updateCycleSettings({ blocksPerDay: n })}
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-all duration-150",
                        blocksPerDay === n
                          ? "border-brand-primary bg-brand-primary text-white"
                          : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800 [html[data-theme=light]_&]:border-neutral-200 [html[data-theme=light]_&]:bg-neutral-50 [html[data-theme=light]_&]:text-neutral-600 [html[data-theme=light]_&]:hover:bg-neutral-100"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={designTokens.sectionCard}>
            <h3 className={`${designTokens.cardTitle} mb-4 flex items-center gap-2`}>
              <BookOpen size={18} className="text-brand-primary" /> Matérias Ativas
            </h3>
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar [scrollbar-width:thin]">
              {subjects.map(sub => (
                <div
                  key={sub.id}
                  className={cn(
                    "flex items-center justify-between rounded-xl border border-l-4 p-3 transition-all",
                    sub.status === 'active'
                      ? "border-brand-primary bg-card"
                      : "border-border bg-background opacity-70"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={sub.status === 'active'}
                      onChange={() => updateSubject(sub.id, { status: sub.status === 'active' ? 'optional' : 'active' })}
                      className="w-4 h-4 rounded border-border text-brand-primary focus:ring-brand-primary"
                    />
                    <div className="min-w-0">
                      <SubjectTag subjectName={sub.name} color={getSubjectColorHex(sub)} size="sm" />
                      <div className="mt-1 text-xs text-text-secondary">G{sub.group} • {sub.studentLevel}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5 self-start lg:col-span-8">
          {(blockingAlert || suggestionAlerts.length > 0) && (
            <div className="space-y-3">
              {blockingAlert && (
                <div className="flex items-center gap-3 rounded-xl border border-brand-red/30 bg-brand-red/8 p-4 text-brand-red">
                  <AlertCircle size={18} />
                  <span className="text-xs font-semibold">{blockingAlert.message}</span>
                </div>
              )}

              {suggestionAlerts.length > 0 && (
                <details className="overflow-hidden rounded-[10px] border border-brand-primary/20 bg-brand-primary/10 px-4 text-text-secondary">
                  <summary className="flex min-h-[42px] cursor-pointer list-none items-center gap-2 text-[13px] font-semibold text-brand-primary">
                    <Lightbulb size={16} className="text-brand-primary" />
                    <span>{suggestionAlerts.length} sugestões para melhorar seu ciclo</span>
                  </summary>
                  <div className="mt-3 space-y-2 pl-6">
                    {suggestionAlerts.map((alert, i) => (
                      <p key={i} className="text-[13px] leading-relaxed text-neutral-500 [html[data-theme=dark]_&]:text-neutral-400">
                        {alert.message}
                      </p>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}

          <div className={`${designTokens.sectionCard} p-4 sm:p-8`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className={`${designTokens.cardTitle} flex items-center gap-2`}>
                  <History size={22} className="text-brand-primary" /> Prévia do Ciclo
                </h3>
                <p className="mt-1 text-xs text-text-secondary">
                  {hasWeeklyBlocks ? 'Editando o ciclo do dia selecionado.' : 'Ciclo base legado usado como fallback em todos os dias.'}
                </p>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Deseja resetar o ciclo atual?')) {
                    visibleCycleBlocks.forEach(block => deleteBlock(block.id));
                  }
                }}
                className="w-full sm:w-auto text-xs text-text-secondary hover:text-brand-red flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg hover:bg-brand-red/5 transition-all"
              >
                <RotateCcw size={14} /> Resetar
              </button>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {WEEK_DAYS.map(day => (
                <button
                  key={day.value}
                  onClick={() => setSelectedCycleDay(day.value)}
                  className={cn(
                    "h-9 rounded-lg border px-3 text-xs font-bold transition-all",
                    selectedCycleDay === day.value
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-border text-text-secondary hover:border-brand-primary/50 hover:text-brand-primary"
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>

            {visibleCycleBlocks.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-border rounded-full flex items-center justify-center mx-auto mb-4">
                  <History size={32} className="text-text-secondary" />
                </div>
                <h4 className="font-bold mb-2">Nenhum bloco neste dia</h4>
                <p className="text-sm text-text-secondary mb-6">Adicione um bloco manual ou gere uma sugestão inteligente.</p>
                <button
                  onClick={handleAddBlock}
                  className="bg-brand-primary text-white px-6 py-2 rounded-xl font-bold text-sm"
                >
                  Adicionar Bloco
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleCycleBlocks.map((block, i) => (
                  <motion.div
                    layout
                    key={block.id}
                    className={`${designTokens.itemCard} group relative bg-background p-4 sm:p-4 hover:border-brand-primary/50 transition-all`}
                  >
                    <div className="absolute left-4 top-4 flex h-5 w-5 items-center justify-center rounded-md bg-brand-primary/15 text-xs font-bold text-brand-primary">
                      {i + 1}
                    </div>

                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 pl-7">
                        <select
                          value={block.subjectId}
                          onChange={(e) => {
                            const sub = subjects.find(s => s.id === e.target.value);
                            if (sub) updateBlock(block.id, { subjectId: sub.id, subjectName: sub.name });
                          }}
                          className="bg-transparent font-bold text-sm outline-none w-full appearance-none cursor-pointer hover:text-brand-primary"
                        >
                          {subjects.filter(s => s.status === 'active').map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <div className="flex gap-2 mt-1">
                          <div className="max-w-[180px]">
                            <SubjectTag
                              subjectName={block.subjectName}
                              color={getSubjectColorHex(subjectById.get(block.subjectId))}
                              size="sm"
                            />
                          </div>
                          <select
                            value={block.type}
                            onChange={(e) => updateBlock(block.id, { type: e.target.value })}
                            className={cn(getStudyTypeBadgeClasses(block.type, 'cursor-pointer appearance-none rounded-md bg-brand-primary/10 text-xs uppercase tracking-wider text-brand-primary outline-none [html[data-theme=dark]_&]:text-violet-300'))}
                          >
                            <option value="teoria">Teoria</option>
                            <option value="questoes">Questões</option>
                            <option value="revisao">Revisão</option>
                          </select>
                          <StudyTypeBadge type="outro" label="Manual" className="rounded-md bg-neutral-100 text-xs uppercase tracking-wider text-neutral-600 [html[data-theme=dark]_&]:bg-neutral-800 [html[data-theme=dark]_&]:text-neutral-300" />
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => duplicateBlock(block)} className="p-1.5 hover:bg-card rounded-lg text-text-secondary hover:text-brand-blue" title="Duplicar">
                          <Plus size={14} />
                        </button>
                        <button onClick={() => deleteBlock(block.id)} className="p-1.5 hover:bg-card rounded-lg text-text-secondary hover:text-brand-red" title="Excluir">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-text-secondary" />
                        <input
                          type="number"
                          min={5}
                          step={5}
                          value={block.durationMinutes}
                          onChange={(e) => updateBlock(block.id, { durationMinutes: parseInt(e.target.value) })}
                          className="w-8 bg-transparent text-base font-semibold leading-none text-text-primary outline-none"
                        />
                        <span className="text-[13px] text-neutral-500 [html[data-theme=dark]_&]:text-neutral-400">min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRecordBlock(block)}
                          disabled={savingBlockId === block.id || block.durationMinutes < 1}
                          className={cn(
                            "flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition-all disabled:opacity-50",
                            savedBlockId === block.id
                              ? "border-brand-green bg-brand-green text-white"
                              : "border-brand-primary bg-transparent text-brand-primary hover:bg-brand-primary/10"
                          )}
                          title="Registrar como estudado"
                        >
                          <Play size={13} fill="currentColor" />
                          {savingBlockId === block.id
                            ? 'Registrando...'
                            : savedBlockId === block.id
                              ? 'Registrado'
                              : 'Registrar'}
                        </button>
                        <button
                          disabled={i === 0}
                          onClick={() => {
                            const prev = visibleCycleBlocks[i - 1];
                            updateBlock(block.id, { order: i - 1 });
                            updateBlock(prev.id, { order: i });
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-20 [html[data-theme=dark]_&]:text-neutral-400 [html[data-theme=dark]_&]:hover:bg-neutral-800 [html[data-theme=dark]_&]:hover:text-neutral-200"
                          aria-label="Mover bloco para cima"
                          title="Mover bloco para cima"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          disabled={i === visibleCycleBlocks.length - 1}
                          onClick={() => {
                            const next = visibleCycleBlocks[i + 1];
                            updateBlock(block.id, { order: i + 1 });
                            updateBlock(next.id, { order: i });
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-20 [html[data-theme=dark]_&]:text-neutral-400 [html[data-theme=dark]_&]:hover:bg-neutral-800 [html[data-theme=dark]_&]:hover:text-neutral-200"
                          aria-label="Mover bloco para baixo"
                          title="Mover bloco para baixo"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                <button
                  onClick={handleAddBlock}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 p-5 text-[13px] text-neutral-500 transition-all hover:border-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary [html[data-theme=dark]_&]:border-neutral-700 [html[data-theme=dark]_&]:text-neutral-400"
                >
                  <Plus size={24} />
                  <span className="text-[13px] font-bold">Adicionar Bloco</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-[10px] border border-neutral-200 bg-neutral-50 p-4 text-[13px] leading-[1.6] text-neutral-500 [html[data-theme=dark]_&]:border-neutral-800 [html[data-theme=dark]_&]:bg-neutral-900 [html[data-theme=dark]_&]:text-neutral-400">
            <Info size={15} className="mt-0.5 shrink-0 text-neutral-500 [html[data-theme=dark]_&]:text-neutral-400" />
            <p>
              Diferente de um cronograma fixo, o ciclo é uma sequência. Se você parar no bloco 2 hoje, amanhã começa pelo bloco 3. Isso evita o sentimento de matéria acumulada e garante que você estude tudo na proporção correta.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
