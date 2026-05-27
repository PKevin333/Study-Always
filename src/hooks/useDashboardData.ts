import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, limit, where } from 'firebase/firestore';
import { getTodayLocalDate } from '../utils/date';
import { 
  Subject, 
  Session, 
  StudyError, 
  CycleBlock, 
  DailyBlock, 
  QuestionRecord, 
  Topic 
} from '../types';

export function useDashboardData(user: any, selectedSubjectForTopics: Subject | null) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [errors, setErrors] = useState<StudyError[]>([]);
  const [cycleBlocks, setCycleBlocks] = useState<CycleBlock[]>([]);
  const [dailyBlocks, setDailyBlocks] = useState<DailyBlock[]>([]);
  const [questionRecords, setQuestionRecords] = useState<QuestionRecord[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    if (!user || !db) return;
    // sessions = fonte de verdade do tempo estudado
    // NÃO calcular tempo a partir de dailyBlocks ou cycleBlocks
    const q = query(collection(db, `users/${user.uid}/sessions`), orderBy('timestamp', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session)));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, `users/${user.uid}/subjects`), orderBy('order'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !db) return;
    // errors:
    // - reviewed: boolean → indica se já foi revisado
    // - nextReview: date → agendamento futuro
    // - caso lógica de revisão evolua → separar em coleção reviews
    const q = query(collection(db, `users/${user.uid}/errors`), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setErrors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyError)));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, `users/${user.uid}/cycleBlocks`), orderBy('order'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCycleBlocks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CycleBlock)));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !db) return;
    const today = getTodayLocalDate();
    const q = query(collection(db, `users/${user.uid}/dailyBlocks`), where('date', '==', today), orderBy('order'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDailyBlocks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyBlock)));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !db) return;
    // questionRecords = fonte de verdade de desempenho
    // subjects.accuracy é apenas cache derivado
    const q = query(collection(db, `users/${user.uid}/questionRecords`), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQuestionRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuestionRecord)));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !db || !selectedSubjectForTopics) {
      setTopics([]);
      return;
    }
    const q = query(collection(db, `users/${user.uid}/subjects/${selectedSubjectForTopics.id}/topics`), orderBy('order'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTopics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic)));
    });
    return () => unsubscribe();
  }, [user, selectedSubjectForTopics]);

  const errorMap = useMemo(() => {
    const map: Record<string, { subjectName: string, topic: string, total: number, correct: number, errors: number }> = {};
    
    questionRecords.forEach(record => {
      const key = `${record.subjectId}-${record.topic}`;
      if (!map[key]) {
        map[key] = {
          subjectName: record.subjectName,
          topic: record.topic,
          total: 0,
          correct: 0,
          errors: 0
        };
      }
      map[key].total += record.total;
      map[key].correct += record.correct;
      map[key].errors += record.errors;
    });

    const processed = Object.values(map).map(item => ({
      ...item,
      percentage: item.total > 0 ? (item.correct / item.total) * 100 : 0
    }));

    return processed.sort((a, b) => {
      if (a.percentage === b.percentage) {
        return b.errors - a.errors;
      }
      return a.percentage - b.percentage;
    });
  }, [questionRecords]);

  const worstTopics = useMemo(() => {
    const withEnoughQuestions = errorMap.filter(t => t.total >= 5);
    if (withEnoughQuestions.length > 0) {
      return withEnoughQuestions.slice(0, 3);
    }
    return errorMap.slice(0, 3);
  }, [errorMap]);

  return {
    subjects,
    sessions,
    errors,
    cycleBlocks,
    dailyBlocks,
    questionRecords,
    topics,
    errorMap,
    worstTopics
  };
}
