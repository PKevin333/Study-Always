import React from 'react';
import { motion } from 'framer-motion';
import { 
  Timer as TimerIcon, 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Clock, 
  History,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Subject } from '../../types';
import { formatTime } from '../../utils/firestore';

interface TimerTabProps {
  timerMode: 'study' | 'shortBreak' | 'longBreak';
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
}

export function TimerTab({
  timerMode,
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
  finishStudySession
}: TimerTabProps) {
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const progress = ((totalTimeForMode - timeLeft) / totalTimeForMode) * 100;

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

  const applyPreset = (preset: 'pomodoro' | 'medium' | 'deep') => {
    setTimerPreset(preset);
    if (preset === 'pomodoro') {
      setStudyTime(25);
      setShortBreakTime(5);
      setLongBreakTime(15);
      setCyclesBeforeLongBreak(4);
      if (timerMode === 'study') {
        setTimeLeft(25 * 60);
        setTotalTimeForMode(25 * 60);
      }
    } else if (preset === 'medium') {
      setStudyTime(40);
      setShortBreakTime(5);
      setLongBreakTime(20);
      setCyclesBeforeLongBreak(4);
      if (timerMode === 'study') {
        setTimeLeft(40 * 60);
        setTotalTimeForMode(40 * 60);
      }
    } else if (preset === 'deep') {
      setStudyTime(50);
      setShortBreakTime(10);
      setLongBreakTime(20);
      setCyclesBeforeLongBreak(4);
      if (timerMode === 'study') {
        setTimeLeft(50 * 60);
        setTotalTimeForMode(50 * 60);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }} 
      key="timer" 
      className="max-w-4xl mx-auto pb-20"
    >
      <div className="bg-card border border-border rounded-[2.5rem] p-6 sm:p-12 shadow-2xl relative overflow-hidden">
        {/* Background Glow */}
        <div className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 opacity-10 blur-[120px] transition-colors duration-1000",
          timerMode === 'study' ? "bg-brand-primary" : "bg-brand-blue"
        )} />

        <div className="relative z-10 flex flex-col items-center">
          {/* Header Section */}
          <div className="w-full flex flex-col items-center mb-10">
            <div className="flex items-center gap-2 mb-6">
              <div className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-colors",
                timerMode === 'study' ? "bg-brand-primary/10 text-brand-primary" : "bg-brand-blue/10 text-brand-blue"
              )}>
                {timerMode === 'study' ? 'Sessão de Estudo' : timerMode === 'shortBreak' ? 'Pausa Curta' : 'Pausa Longa'}
              </div>
              <div className="px-3 py-1.5 rounded-full bg-background border border-border text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                Ciclo {currentCycle}/{cyclesBeforeLongBreak}
              </div>
            </div>

            <div className="w-full max-w-sm">
              {activeSessionBlock ? (
                <div className="w-full bg-brand-primary/5 border border-brand-primary/20 rounded-2xl px-6 py-4 text-center">
                  <div className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1">Meta do Plano do Dia</div>
                  <div className="font-bold text-lg">{activeSessionBlock.subjectName}</div>
                </div>
              ) : (
                <select 
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={timerActive}
                  className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-center font-bold text-lg outline-none focus:border-brand-primary transition-all appearance-none cursor-pointer hover:bg-card disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Selecione a Disciplina</option>
                  {subjects.filter(s => s.status === 'active').map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Timer Circle */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 mb-12">
            <svg className="w-full h-full -rotate-90 transform">
              <circle
                cx="50%"
                cy="50%"
                r="48%"
                className="stroke-background fill-none"
                strokeWidth="6"
              />
              <motion.circle
                cx="50%"
                cy="50%"
                r="48%"
                className={cn(
                  "fill-none transition-colors duration-1000",
                  timerMode === 'study' ? "stroke-brand-primary" : "stroke-brand-blue"
                )}
                strokeWidth="6"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 1000" }}
                animate={{ strokeDasharray: `${(progress / 100) * 1000} 1000` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl sm:text-7xl font-black tracking-tighter tabular-nums mb-2">
                {formatTime(timeLeft)}
              </div>
              <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                {!timerActive ? 'Pausado' : timerMode === 'study' ? 'Foco Total' : 'Descanso Ativo'}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6 sm:gap-10 mb-8">
            <button 
              onClick={handleResetClick}
              className="p-4 rounded-2xl bg-background border border-border text-text-secondary hover:text-brand-red hover:border-brand-red/30 transition-all"
              title="Reiniciar"
            >
              <RotateCcw size={24} />
            </button>

            <button 
              onClick={() => setTimerActive(!timerActive)}
              className={cn(
                "w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] flex items-center justify-center text-white shadow-2xl transition-all transform hover:scale-105 active:scale-95",
                timerMode === 'study' ? "bg-brand-primary shadow-brand-primary/40" : "bg-brand-blue shadow-brand-blue/40"
              )}
            >
              {timerActive ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
            </button>

            <button 
              onClick={skipPhase}
              className="p-4 rounded-2xl bg-background border border-border text-text-secondary hover:text-brand-primary hover:border-brand-primary/30 transition-all"
              title="Pular Fase"
            >
              <Zap size={24} />
            </button>
          </div>

          {/* Reset Confirmation Overlay */}
          {showResetConfirm && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-50 flex items-center justify-center p-6"
            >
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
              <div className="relative bg-card border border-border rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center">
                <div className="w-16 h-16 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-red">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Reiniciar Cronômetro?</h3>
                <p className="text-text-secondary text-sm mb-8">
                  O tempo de estudo atual será perdido e não será registrado. Deseja continuar?
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
            </motion.div>
          )}

          {/* Manual Finish Button */}
          {timerMode === 'study' && seconds >= 60 && (
            <button
              onClick={finishStudySession}
              className="mb-12 px-6 py-2 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs font-bold hover:bg-brand-primary hover:text-white transition-all flex items-center gap-2"
            >
              <CheckCircle2 size={14} />
              Finalizar Sessão Agora ({Math.floor(seconds / 60)} min)
            </button>
          )}

          {/* Presets */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: 'pomodoro', label: 'Pomodoro', time: '25/5', icon: <TimerIcon size={16} /> },
              { id: 'medium', label: 'Foco Médio', time: '40/5', icon: <Clock size={16} /> },
              { id: 'deep', label: 'Foco Profundo', time: '50/10', icon: <History size={16} /> }
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id as any)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all group",
                  timerPreset === preset.id ? "bg-brand-primary/10 border-brand-primary" : "bg-background border-border hover:border-brand-primary/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    timerPreset === preset.id ? "bg-brand-primary text-white" : "bg-card text-text-secondary group-hover:text-brand-primary"
                  )}>
                    {preset.icon}
                  </div>
                  <div className="text-left">
                    <div className={cn("text-xs font-bold", timerPreset === preset.id ? "text-brand-primary" : "text-text-primary")}>{preset.label}</div>
                    <div className="text-[10px] text-text-secondary">{preset.time} min</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
