import { useState, useEffect } from 'react';

interface TimerProps {
  studyTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  cyclesBeforeLongBreak: number;
  onPhaseComplete: (mode: 'study' | 'shortBreak' | 'longBreak', seconds: number) => void;
}

export function useStudyTimer({
  studyTime,
  shortBreakTime,
  longBreakTime,
  cyclesBeforeLongBreak,
  onPhaseComplete
}: TimerProps) {
  const [timerActive, setTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState<'study' | 'shortBreak' | 'longBreak'>('study');
  const [timeLeft, setTimeLeft] = useState(studyTime * 60);
  const [totalTimeForMode, setTotalTimeForMode] = useState(studyTime * 60);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
        if (timerMode === 'study') {
          setSeconds(s => s + 1);
        }
      }, 1000);
    } else if (timerActive && timeLeft === 0) {
      handlePhaseTransition();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, timerMode]);

  const handlePhaseTransition = () => {
    setTimerActive(false);
    const completedMode = timerMode;
    const completedSeconds = seconds;

    if (timerMode === 'study') {
      if (currentCycle % cyclesBeforeLongBreak === 0) {
        setTimerMode('longBreak');
        setTimeLeft(longBreakTime * 60);
        setTotalTimeForMode(longBreakTime * 60);
      } else {
        setTimerMode('shortBreak');
        setTimeLeft(shortBreakTime * 60);
        setTotalTimeForMode(shortBreakTime * 60);
      }
      setCurrentCycle(prev => prev + 1);
    } else {
      setTimerMode('study');
      setTimeLeft(studyTime * 60);
      setTotalTimeForMode(studyTime * 60);
      setSeconds(0);
    }

    onPhaseComplete(completedMode, completedSeconds);
  };

  const skipPhase = () => {
    handlePhaseTransition();
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimerMode('study');
    setTimeLeft(studyTime * 60);
    setTotalTimeForMode(studyTime * 60);
    setSeconds(0);
    setCurrentCycle(1);
  };

  const toggleTimer = () => setTimerActive(!timerActive);

  return {
    timerActive,
    timerMode,
    timeLeft,
    totalTimeForMode,
    currentCycle,
    seconds,
    setSeconds,
    toggleTimer,
    skipPhase,
    resetTimer,
    setTimeLeft,
    setTotalTimeForMode,
    setTimerMode,
    setCurrentCycle
  };
}
