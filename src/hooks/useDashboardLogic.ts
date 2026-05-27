import { useMemo } from 'react';
import { Subject, CycleBlock, DailyBlock, QuestionRecord, StudyError } from '../types';
import { getTodayLocalDate } from '../utils/date';

export function useDashboardLogic(
  subjects: Subject[],
  cycleBlocks: CycleBlock[],
  dailyBlocks: DailyBlock[],
  questionRecords: QuestionRecord[],
  sessions: any[],
  ignoredFocusTopics: string[],
  profile: any,
  dailyTime: number,
  blocksPerDay: number,
  errors: StudyError[]
) {
  const totalHours = useMemo(() => subjects.reduce((acc, s) => acc + (s.totalHours || 0), 0), [subjects]);
  const totalQuestions = useMemo(() => subjects.reduce((acc, s) => acc + (s.questionsSolved || 0), 0), [subjects]);
  
  const overdueReviewsCount = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of today
    
    return errors.filter(error => {
      const reviewDate = error.proximaRevisao?.toDate 
        ? error.proximaRevisao.toDate() 
        : error.nextReview?.toDate 
          ? error.nextReview.toDate() 
          : new Date(error.nextReview || error.createdAt);
      
      return reviewDate <= now;
    }).length;
  }, [errors]);
  
  const avgAccuracy = useMemo(() => {
    // Primary source of truth for overall accuracy is the set of all question records
    const total = questionRecords.reduce((acc, r) => acc + r.total, 0);
    const correct = questionRecords.reduce((acc, r) => acc + r.correct, 0);
    
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  }, [questionRecords]);

  const prioritySubjects = useMemo(() => {
    return subjects
      .filter(s => s.status === 'active')
      .map(s => ({
        ...s,
        priorityScore: (s.weight || 1) * 10 + (100 - (s.accuracy || 0)) + (10 - (s.studyFrequency || 0))
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }, [subjects]);

  const errorMap = useMemo(() => {
    const map: Record<string, { subjectId: string, subjectName: string, topic: string, total: number, correct: number, errors: number, lastStudied: number }> = {};
    
    questionRecords.forEach(record => {
      const key = `${record.subjectId}-${record.topic}`;
      if (!map[key]) {
        map[key] = {
          subjectId: record.subjectId,
          subjectName: record.subjectName,
          topic: record.topic,
          total: 0,
          correct: 0,
          errors: 0,
          lastStudied: 0
        };
      }
      map[key].total += record.total;
      map[key].correct += record.correct;
      map[key].errors += record.errors;
      const recordDate = new Date(record.date).getTime();
      if (recordDate > map[key].lastStudied) {
        map[key].lastStudied = recordDate;
      }
    });

    return Object.values(map).map(item => ({
      ...item,
      percentage: item.total > 0 ? (item.correct / item.total) * 100 : 0
    })).sort((a, b) => a.percentage - b.percentage);
  }, [questionRecords]);

  const focusItems = useMemo(() => {
    const now = Date.now();
    const processed = errorMap.map(item => {
      const daysSinceLastStudy = (now - item.lastStudied) / (1000 * 60 * 60 * 24);
      
      let category: 'focar' | 'manter' | 'dominado' = 'manter';
      let reason = '';
      let priorityScore = 0;

      if (item.percentage < 50) {
        category = 'focar';
        reason = 'Baixo desempenho';
        priorityScore = 100 - item.percentage + item.errors;
      } else if (item.errors >= 10 && item.percentage < 70) {
        category = 'focar';
        reason = 'Muitos erros recentes';
        priorityScore = 80 + item.errors;
      } else if (daysSinceLastStudy > 14) {
        category = 'focar';
        reason = 'Muito tempo sem revisar';
        priorityScore = 70 + daysSinceLastStudy;
      } else if (item.percentage >= 70) {
        category = 'dominado';
      } else {
        category = 'manter';
      }

      return {
        ...item,
        daysSinceLastStudy,
        category,
        reason,
        priorityScore,
        key: `${item.subjectId}-${item.topic}`
      };
    });

    const focar = processed.filter(i => i.category === 'focar' && !ignoredFocusTopics.includes(i.key)).sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5);
    const manter = processed.filter(i => i.category === 'manter' && !ignoredFocusTopics.includes(i.key)).sort((a, b) => b.percentage - a.percentage);
    const dominado = processed.filter(i => i.category === 'dominado' && !ignoredFocusTopics.includes(i.key)).sort((a, b) => b.percentage - a.percentage);

    return { focar, manter, dominado };
  }, [errorMap, ignoredFocusTopics]);

  const getValidationAlerts = useMemo(() => {
    const alerts = [];
    const totalTime = cycleBlocks.reduce((acc, b) => acc + b.durationMinutes, 0);
    
    if (totalTime > dailyTime) {
      alerts.push({ type: 'warning', message: `Tempo total (${totalTime}min) excede o disponível (${dailyTime}min).` });
    }
    
    const theoryCount = cycleBlocks.filter(b => b.type === 'teoria').length;
    if (theoryCount > cycleBlocks.length * 0.7) {
      alerts.push({ type: 'info', message: "Muito foco em teoria. Considere adicionar mais blocos de questões." });
    }

    const reviewCount = cycleBlocks.filter(b => b.type === 'revisao').length;
    if (reviewCount === 0 && cycleBlocks.length > 3) {
      alerts.push({ type: 'info', message: "Falta de revisão. Adicione ao menos um bloco de revisão no ciclo." });
    }

    return alerts;
  }, [cycleBlocks, dailyTime]);

  const chartData = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      return {
        name: days[d.getDay()],
        dateStr,
        horas: 0
      };
    });

    sessions.forEach(session => {
      if (!session.timestamp) return;
      const sessionDate = session.timestamp?.toDate ? session.timestamp.toDate() : new Date(session.timestamp);
      const year = sessionDate.getFullYear();
      const month = String(sessionDate.getMonth() + 1).padStart(2, '0');
      const day = String(sessionDate.getDate()).padStart(2, '0');
      const sessionDateStr = `${year}-${month}-${day}`;
      const dayData = last7Days.find(d => d.dateStr === sessionDateStr);
      if (dayData) {
        dayData.horas += (session.durationMinutes || 0) / 60;
      }
    });

    return last7Days.map(({ name, horas }) => ({ name, horas: parseFloat(horas.toFixed(1)) }));
  }, [sessions]);

  const dailyAverage = useMemo(() => {
    if (sessions.length === 0) return 0;
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const uniqueDays = new Set(sessions.map(s => {
      if (!s.timestamp) return null;
      const d = s.timestamp?.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }).filter(Boolean)).size;
    
    return uniqueDays > 0 ? (totalMinutes / 60) / uniqueDays : 0;
  }, [sessions]);

  return {
    totalHours,
    totalQuestions,
    avgAccuracy,
    prioritySubjects,
    focusItems,
    getValidationAlerts,
    chartData,
    dailyAverage,
    overdueReviewsCount
  };
}
