import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  Palette,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  Timer as TimerIcon,
  Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Subject } from '../../types';
import { formatTime } from '../../utils/firestore';
import { Modal } from '../shared/Modal';
import { StudyTypeBadge } from '../shared/StudyTypeBadge';
import { SwatchPicker } from '../shared/SwatchPicker';
import { designTokens } from '../../styles/designTokens';

type StudySessionType = 'teoria' | 'questoes' | 'revisao';
type TimerMode = 'study' | 'shortBreak' | 'longBreak';
type PomodoroColor = 'red' | 'green' | 'blue' | 'orange';

interface TimerTabProps {
  timerMode: TimerMode;
  setTimerMode: (mode: TimerMode) => void;
  timeLeft: number;
  totalTimeForMode: number;
  timerActive: boolean;
  setTimerActive: (active: boolean) => void;
  resetTimer: () => void;
  skipPhase: () => void;
  currentCycle: number;
  cyclesBeforeLongBreak: number;
  subjects: Subject[];
  selectedSubject: string;
  setSelectedSubject: (id: string) => void;
  timerPreset: string;
  setTimerPreset: (preset: 'pomodoro' | 'medium' | 'deep' | 'custom') => void;
  timerStudyType: StudySessionType;
  setTimerStudyType: (type: StudySessionType) => void;
  setStudyTime: (time: number) => void;
  setShortBreakTime: (time: number) => void;
  setLongBreakTime: (time: number) => void;
  setCyclesBeforeLongBreak: (cycles: number) => void;
  setTimeLeft: (time: number) => void;
  setTotalTimeForMode: (time: number) => void;
  studyTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  seconds: number;
  activeSessionBlock: any;
  finishStudySession: () => Promise<void>;
  recordManualStudySession: (subjectId: string, minutes: number, type: string) => Promise<boolean>;
}

const modeOptions: { id: TimerMode; label: string; helper: string }[] = [
  { id: 'study', label: 'Pomodoro', helper: 'Hora de focar' },
  { id: 'shortBreak', label: 'Pausa Curta', helper: 'Recupere o ritmo' },
  { id: 'longBreak', label: 'Pausa Longa', helper: 'Descanso maior' }
];

const studyTypeOptions: { id: StudySessionType; label: string }[] = [
  { id: 'teoria', label: 'Teoria' },
  { id: 'questoes', label: 'Questões' },
  { id: 'revisao', label: 'Revisão' }
];

const colorOptions: { id: PomodoroColor; label: string; swatch: string }[] = [
  { id: 'red', label: 'Vermelho', swatch: 'bg-brand-red' },
  { id: 'green', label: 'Verde', swatch: 'bg-brand-primary' },
  { id: 'blue', label: 'Azul', swatch: 'bg-brand-blue' },
  { id: 'orange', label: 'Laranja', swatch: 'bg-brand-orange' }
];

const colorStyles: Record<PomodoroColor, {
  panel: string;
  activeTab: string;
  text: string;
  button: string;
  soft: string;
  stroke: string;
  ring: string;
}> = {
  red: {
    panel: 'from-brand-red/20 via-brand-red/10 to-transparent',
    activeTab: 'bg-brand-red text-white shadow-brand-red/20',
    text: 'text-brand-red',
    button: 'bg-brand-red hover:bg-brand-red/80 shadow-brand-red/30',
    soft: 'bg-brand-red/10 border-brand-red/20 text-brand-red',
    stroke: 'stroke-brand-red',
    ring: 'ring-brand-red'
  },
  green: {
    panel: 'from-brand-primary/20 via-brand-primary/10 to-transparent',
    activeTab: 'bg-brand-primary text-white shadow-brand-primary/20',
    text: 'text-brand-primary',
    button: 'bg-brand-primary hover:bg-brand-primary/80 shadow-brand-primary/30',
    soft: 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary',
    stroke: 'stroke-brand-primary',
    ring: 'ring-brand-primary'
  },
  blue: {
    panel: 'from-brand-blue/20 via-brand-blue/10 to-transparent',
    activeTab: 'bg-brand-blue text-white shadow-brand-blue/20',
    text: 'text-brand-blue',
    button: 'bg-brand-blue hover:bg-brand-blue/80 shadow-brand-blue/30',
    soft: 'bg-brand-blue/10 border-brand-blue/20 text-brand-blue',
    stroke: 'stroke-brand-blue',
    ring: 'ring-brand-blue'
  },
  orange: {
    panel: 'from-brand-orange/20 via-brand-orange/10 to-transparent',
    activeTab: 'bg-brand-orange text-white shadow-brand-orange/20',
    text: 'text-brand-orange',
    button: 'bg-brand-orange hover:bg-brand-orange/80 shadow-brand-orange/30',
    soft: 'bg-brand-orange/10 border-brand-orange/20 text-brand-orange',
    stroke: 'stroke-brand-orange',
    ring: 'ring-brand-orange'
  }
};

export function TimerTab({
  timerMode,
  setTimerMode,
  timeLeft,
  totalTimeForMode,
  timerActive,
  setTimerActive,
  resetTimer,
  skipPhase,
  currentCycle,
  cyclesBeforeLongBreak,
  subjects,
  selectedSubject,
  setSelectedSubject,
  timerPreset,
  setTimerPreset,
  timerStudyType,
  setTimerStudyType,
  setStudyTime,
  setShortBreakTime,
  setLongBreakTime,
  setCyclesBeforeLongBreak,
  setTimeLeft,
  setTotalTimeForMode,
  studyTime,
  shortBreakTime,
  longBreakTime,
  seconds,
  activeSessionBlock,
  finishStudySession,
  recordManualStudySession
}: TimerTabProps) {
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const [manualSubject, setManualSubject] = React.useState('');
  const [manualMinutes, setManualMinutes] = React.useState(60);
  const [manualType, setManualType] = React.useState<StudySessionType>('teoria');
  const [savingManualSession, setSavingManualSession] = React.useState(false);
  const [pomodoroColor, setPomodoroColor] = React.useState<PomodoroColor>('red');

  const styles = colorStyles[pomodoroColor];
  const activeMode = modeOptions.find(mode => mode.id === timerMode) || modeOptions[0];
  const canChangeMode = !timerActive && seconds === 0;
  const canStart = timerActive || timerMode !== 'study' || Boolean(activeSessionBlock || selectedSubject);

  const handleManualSessionSave = async () => {
    if (savingManualSession) return;
    setSavingManualSession(true);
    try {
      const saved = await recordManualStudySession(manualSubject, manualMinutes, manualType);
      if (saved) {
        setManualMinutes(60);
        setManualType('teoria');
      }
    } finally {
      setSavingManualSession(false);
    }
  };

  const handleResetClick = () => {
    if (timerActive || seconds > 0) {
      setShowResetConfirm(true);
    } else {
      resetTimer();
    }
  };

  const confirmReset = () => {
    resetTimer();
    setShowResetConfirm(false);
  };

  const getDurationForMode = (mode: TimerMode) => {
    if (mode === 'shortBreak') return shortBreakTime;
    if (mode === 'longBreak') return longBreakTime;
    return studyTime;
  };

  const selectMode = (mode: TimerMode) => {
    if (!canChangeMode) return;
    const nextDuration = getDurationForMode(mode) * 60;
    setTimerMode(mode);
    setTimeLeft(nextDuration);
    setTotalTimeForMode(nextDuration);
  };

  const updateDuration = (mode: TimerMode, minutes: number) => {
    if (!canChangeMode) return;
    const safeMinutes = Math.min(180, Math.max(1, Math.floor(minutes || 0)));
    setTimerPreset('custom');

    if (mode === 'study') setStudyTime(safeMinutes);
    if (mode === 'shortBreak') setShortBreakTime(safeMinutes);
    if (mode === 'longBreak') setLongBreakTime(safeMinutes);

    if (timerMode === mode) {
      setTimeLeft(safeMinutes * 60);
      setTotalTimeForMode(safeMinutes * 60);
    }
  };

  const updateCycles = (cycles: number) => {
    if (!canChangeMode) return;
    setTimerPreset('custom');
    setCyclesBeforeLongBreak(Math.min(12, Math.max(1, Math.floor(cycles || 0))));
  };

  const applyPreset = (preset: 'pomodoro' | 'medium' | 'deep') => {
    if (!canChangeMode) return;

    const presetDurations = {
      pomodoro: { study: 25, shortBreak: 5, longBreak: 15, cycles: 4 },
      medium: { study: 40, shortBreak: 5, longBreak: 20, cycles: 4 },
      deep: { study: 50, shortBreak: 10, longBreak: 20, cycles: 4 }
    }[preset];
    const nextModeDuration = presetDurations[timerMode] * 60;

    setTimerPreset(preset);
    setStudyTime(presetDurations.study);
    setShortBreakTime(presetDurations.shortBreak);
    setLongBreakTime(presetDurations.longBreak);
    setCyclesBeforeLongBreak(presetDurations.cycles);
    setTimeLeft(nextModeDuration);
    setTotalTimeForMode(nextModeDuration);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      key="timer"
      className={`mx-auto max-w-6xl ${designTokens.page}`}
    >
      <header className={`${designTokens.pageHeader} xl:flex-row xl:items-end`}>
        <div>
          <h2 className={designTokens.pageTitle}>Cronômetro Pomodoro</h2>
          <p className={designTokens.pageIntro}>
            Organize foco, pausas e registros de estudo sem sair do seu fluxo.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2">
          <TimerIcon size={16} className="text-brand-primary" />
          <span className="text-xs font-bold text-text-secondary">Ciclo {currentCycle}/{cyclesBeforeLongBreak}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
        <section className="relative h-fit self-start overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl sm:p-6 xl:sticky xl:top-6 xl:col-span-5">
          <div className={cn('absolute inset-x-0 top-0 h-40 bg-gradient-to-b opacity-80', styles.panel)} />

          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="flex justify-center">
              <div className="inline-flex max-w-full overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-950/70 p-1">
                {modeOptions.map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => selectMode(mode.id)}
                    disabled={!canChangeMode}
                    className={cn(
                      'h-9 whitespace-nowrap rounded-lg px-4 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50',
                      timerMode === mode.id
                        ? styles.activeTab
                        : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center flex flex-col items-center gap-4">
              <div className={cn('inline-flex rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider', styles.soft)}>
                {activeMode.helper}
              </div>
              <div className={cn('text-[64px] font-semibold leading-none tracking-tight tabular-nums sm:text-[72px]', styles.text)}>
                {formatTime(timeLeft)}
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleResetClick}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-300 transition-all hover:border-brand-red/30 hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  title="Reiniciar"
                >
                  <RotateCcw size={20} />
                </button>

                <button
                  onClick={() => setTimerActive(!timerActive)}
                  disabled={!canStart}
                  className={cn(
                    'flex h-11 min-w-[140px] items-center justify-center gap-2 rounded-lg px-8 text-base font-black text-white shadow-xl transition-all hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
                    styles.button
                  )}
                >
                  {timerActive ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}
                  {timerActive ? 'Pausar' : seconds > 0 ? 'Continuar' : 'Iniciar'}
                </button>

                <button
                  onClick={skipPhase}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-300 transition-all hover:border-brand-primary/30 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  title="Pular fase"
                >
                  <Zap size={20} />
                </button>
              </div>

              {!canStart && (
                <p className="text-xs text-text-secondary">
                  Selecione uma disciplina antes de iniciar uma sessão de estudo.
                </p>
              )}

              {timerMode === 'study' && seconds >= 60 && (
                <button
                  onClick={finishStudySession}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-primary/40 bg-brand-primary/10 px-5 py-2.5 text-xs font-bold text-brand-primary transition-all hover:bg-brand-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <CheckCircle2 size={14} />
                  Finalizar sessão agora ({Math.floor(seconds / 60)} min)
                </button>
              )}
            </div>
          </div>

          <Modal open={showResetConfirm} onClose={() => setShowResetConfirm(false)} hideCloseButton maxWidthClassName="max-w-sm">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                <AlertTriangle size={32} />
              </div>
              <h3 className="mb-2 text-xl font-bold">Reiniciar cronômetro?</h3>
              <p className="mb-8 text-sm text-text-secondary">
                O tempo de estudo atual será perdido e não será registrado.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-border font-bold hover:bg-background transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmReset}
                  className="flex-1 px-4 py-3 rounded-xl bg-brand-red text-white font-bold hover:bg-brand-red/80 transition-all"
                >
                  Reiniciar
                </button>
              </div>
            </div>
          </Modal>
        </section>

        <aside className="space-y-5 xl:col-span-7">
          <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 shadow-sm sm:p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Clock size={18} className="text-brand-primary" /> Sessão Atual
            </h3>

            {activeSessionBlock ? (
              <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-center">
                <div className="mb-1 text-xs font-bold uppercase tracking-widest text-neutral-400">Plano do Dia</div>
                <div className="font-bold text-lg">{activeSessionBlock.subjectName}</div>
                <div className="mt-2">
                  <StudyTypeBadge type={activeSessionBlock.type} label={studyTypeOptions.find(option => option.id === activeSessionBlock.type)?.label || 'Teoria'} />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={timerActive}
                  className="h-10 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 outline-none transition-all focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione a disciplina</option>
                  {subjects.filter(subject => subject.status === 'active').map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>

                <div className="grid grid-cols-3 gap-2">
                  {studyTypeOptions.map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setTimerStudyType(option.id)}
                      disabled={timerActive}
                      className={cn(
                        'h-9 rounded-lg border px-3 text-xs font-bold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-50',
                        timerStudyType === option.id
                          ? 'border-brand-primary bg-brand-primary text-white'
                          : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-brand-primary/40 hover:text-brand-primary'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 shadow-sm sm:p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Settings2 size={18} className="text-brand-primary" /> Ajustes do Pomodoro
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3 mb-5">
              {[
                { id: 'pomodoro', label: 'Pomodoro', time: '25/5', icon: <TimerIcon size={16} /> },
                { id: 'medium', label: 'Foco Médio', time: '40/5', icon: <Clock size={16} /> },
                { id: 'deep', label: 'Foco Profundo', time: '50/10', icon: <History size={16} /> }
              ].map(preset => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id as 'pomodoro' | 'medium' | 'deep')}
                  disabled={!canChangeMode}
                  className={cn(
                    'group flex items-center justify-between rounded-lg border bg-neutral-900 p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-50',
                    timerPreset === preset.id ? 'border-brand-primary bg-brand-primary/10' : 'border-neutral-800 hover:border-brand-primary/30'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('rounded-lg p-2 transition-colors', timerPreset === preset.id ? 'bg-brand-primary text-white' : 'bg-neutral-950 text-neutral-400 group-hover:text-brand-primary')}>
                      {preset.icon}
                    </div>
                    <div className="text-left">
                      <div className={cn('text-xs font-bold', timerPreset === preset.id ? 'text-brand-primary' : 'text-text-primary')}>{preset.label}</div>
                      <div className="text-xs text-neutral-400">{preset.time} min</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Foco</span>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={studyTime}
                  onChange={(e) => updateDuration('study', parseInt(e.target.value, 10))}
                  disabled={!canChangeMode}
                  className="h-10 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Pausa curta</span>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={shortBreakTime}
                  onChange={(e) => updateDuration('shortBreak', parseInt(e.target.value, 10))}
                  disabled={!canChangeMode}
                  className="h-10 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Pausa longa</span>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={longBreakTime}
                  onChange={(e) => updateDuration('longBreak', parseInt(e.target.value, 10))}
                  disabled={!canChangeMode}
                  className="h-10 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Ciclos</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={cyclesBeforeLongBreak}
                  onChange={(e) => updateCycles(parseInt(e.target.value, 10))}
                  disabled={!canChangeMode}
                  className="h-10 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 shadow-sm sm:p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Palette size={18} className="text-brand-primary" /> Cor do Pomodoro
            </h3>
            <SwatchPicker
              options={colorOptions.map(option => ({
                value: option.id,
                label: option.label,
                swatchClassName: cn(option.swatch, 'border border-neutral-800 ring-brand-primary'),
                iconColor: 'white'
              }))}
              value={pomodoroColor}
              onChange={setPomodoroColor}
              showLabels={false}
            />
          </section>
        </aside>
      </div>

      <section className="mt-5 rounded-xl border border-neutral-800 bg-neutral-900 p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-sm">Registrar estudo manual</h3>
            <p className="text-xs text-text-secondary">Use quando você já estudou fora do cronômetro.</p>
          </div>
          <CheckCircle2 size={20} className="text-brand-primary" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_140px] gap-3">
          <select
            value={manualSubject}
            onChange={(e) => setManualSubject(e.target.value)}
            disabled={savingManualSession}
            className="h-10 rounded-lg border border-neutral-800 bg-neutral-950 px-4 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Disciplina estudada</option>
            {subjects.filter(subject => subject.status === 'active').map(subject => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>

          <input
            type="number"
            min={1}
            value={manualMinutes}
            onChange={(e) => setManualMinutes(parseInt(e.target.value, 10) || 0)}
            disabled={savingManualSession}
            className="h-10 rounded-lg border border-neutral-800 bg-neutral-950 px-4 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          />

          <select
            value={manualType}
            onChange={(e) => setManualType(e.target.value as StudySessionType)}
            disabled={savingManualSession}
            className="h-10 rounded-lg border border-neutral-800 bg-neutral-950 px-4 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="teoria">Teoria</option>
            <option value="questoes">Questões</option>
            <option value="revisao">Revisão</option>
          </select>
        </div>

        <button
          onClick={handleManualSessionSave}
          disabled={savingManualSession || !manualSubject || manualMinutes <= 0}
          className="mt-4 h-10 w-full rounded-lg bg-brand-primary px-4 font-bold text-white transition-all hover:bg-brand-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {savingManualSession ? 'Registrando...' : 'Registrar tempo estudado'}
        </button>
      </section>
    </motion.div>
  );
}
