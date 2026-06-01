import { useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../firebase';
import { getTodayLocalDate } from '../utils/date';

export function useDashboardEffects(
  user: any,
  state: any,
  actions: any
) {
  const {
    setSessions,
    setSubjects,
    setErrors,
    setCycleBlocks,
    setDailyBlocks,
    setQuestionRecords,
    setTopics,
    selectedSubjectForTopics,
    timerActive,
    setTimeLeft,
    timeLeft,
    setSeconds,
    seconds,
    timerMode,
    setTimerActive,
    currentCycle,
    setCurrentCycle,
    cyclesBeforeLongBreak,
    setTimerMode,
    studyTime,
    shortBreakTime,
    longBreakTime,
    setTotalTimeForMode,
    activeSessionBlock,
    selectedSubject
  } = state;

  const { finishStudySession } = actions;

  // Sessions
  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, `users/${user.uid}/sessions`), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // Subjects
  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, `users/${user.uid}/subjects`), orderBy('order'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // Errors
  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, `users/${user.uid}/errors`), orderBy('date', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setErrors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // Cycle Blocks
  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, `users/${user.uid}/cycleBlocks`), orderBy('order'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCycleBlocks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // Daily Blocks
  useEffect(() => {
    if (!user || !db) return;
    const today = getTodayLocalDate();
    const q = query(collection(db, `users/${user.uid}/dailyBlocks`), where('date', '==', today));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const blocks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      blocks.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      setDailyBlocks(blocks);
    }, (error) => {
      console.error('Error fetching dailyBlocks:', error);
    });
    return () => unsubscribe();
  }, [user]);

  // Question Records
  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, `users/${user.uid}/questionRecords`), orderBy('date', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQuestionRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // Topics
  useEffect(() => {
    if (!user || !db || !selectedSubjectForTopics) {
      // [FIX]: limpa tópicos ao sair de uma disciplina para não exibir dados antigos em troca de contexto.
      setTopics([]);
      return;
    }
    const q = query(collection(db, `users/${user.uid}/subjects/${selectedSubjectForTopics.id}/topics`), orderBy('order'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTopics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error('Error fetching topics:', error);
      setTopics([]);
    });
    return () => unsubscribe();
  }, [user, selectedSubjectForTopics, setTopics]);

  // Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev: number) => prev - 1);
        if (timerMode === 'study') {
          setSeconds((prev: number) => prev + 1);
        }
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      
      // Handle phase transition
      if (timerMode === 'study') {
        // Register session
        finishStudySession(activeSessionBlock, selectedSubject, seconds);
        setSeconds(0);
        
        if (currentCycle >= cyclesBeforeLongBreak) {
          setTimerMode('longBreak');
          setTimeLeft(longBreakTime * 60);
          setTotalTimeForMode(longBreakTime * 60);
          setCurrentCycle(1);
        } else {
          setTimerMode('shortBreak');
          setTimeLeft(shortBreakTime * 60);
          setTotalTimeForMode(shortBreakTime * 60);
        }
      } else {
        setTimerMode('study');
        setTimeLeft(studyTime * 60);
        setTotalTimeForMode(studyTime * 60);
        if (timerMode === 'shortBreak') {
          setCurrentCycle((prev: number) => prev + 1);
        }
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, timerMode, currentCycle, cyclesBeforeLongBreak, studyTime, shortBreakTime, longBreakTime, activeSessionBlock, selectedSubject, seconds, finishStudySession, setCurrentCycle, setSeconds, setTimeLeft, setTimerActive, setTimerMode, setTotalTimeForMode]);
}
