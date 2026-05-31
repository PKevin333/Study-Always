import { useState } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp,
  setDoc,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  arrayUnion,
  increment
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  Subject, 
  CycleBlock, 
  DailyBlock, 
  Topic, 
  StudyError,
  OperationType 
} from '../types';
import { handleFirestoreError } from '../utils/firestore';
import { getTodayLocalDate } from '../utils/date';
import { sanitizeCycleIndex } from '../utils/cycle';

import { getMentorAdvice } from '../services/geminiService';
import { calcularSRS } from '../utils/srsCalculator';

export const persistirRevisaoSRS = async (
  userId: string,
  erroId: string,
  dadosAtualizados: {
    intervalo: number;
    facilidade: number;
    proximaRevisao: Date;
    qualidade: number;
  }
) => {
  const path = `users/${userId}/errors/${erroId}`;
  
  await updateDoc(doc(db, path), {
    reviewed: true,
    intervalo: dadosAtualizados.intervalo,
    facilidade: dadosAtualizados.facilidade,
    proximaRevisao: dadosAtualizados.proximaRevisao,
    nextReview: dadosAtualizados.proximaRevisao, // Campo legado para segurança
    totalRevisoes: increment(1),
    historico: arrayUnion({ data: new Date(), qualidade: dadosAtualizados.qualidade })
  });
};

export function useDashboardActions(user: any, subjects: Subject[], cycleBlocks: CycleBlock[], questionRecords: any[], profile: any, errors: StudyError[]) {
  const [savingError, setSavingError] = useState(false);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [mentorAdvice, setMentorAdvice] = useState<{ title: string, content: string, actionPoints: string[] } | null>(null);
  const [savingRecord, setSavingRecord] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchMentorAdvice = async (sessions: any[]) => {
    if (!profile) return;
    setLoadingAdvice(true);
    try {
      const advice = await getMentorAdvice(profile, subjects, sessions);
      setMentorAdvice(advice);
    } catch (err) {
      console.error("Error fetching mentor advice:", err);
    } finally {
      setLoadingAdvice(false);
    }
  };

  // Subjects
  const addSubject = async (name: string, group: number) => {
    if (!user) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      alert('Informe o nome da disciplina antes de adicionar.');
      return;
    }
    const path = `users/${user.uid}/subjects`;
    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        name: trimmedName,
        group,
        status: 'active',
        weight: 3,
        order: subjects.length,
        studentLevel: 'Iniciante',
        performancePercent: 0,
        studyFrequency: 0,
        dynamicPriority: 3,
        totalHours: 0,
        questionsSolved: 0,
        accuracy: 0,
        lastStudied: null
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    if (!user) return;
    const path = `users/${user.uid}/subjects/${id}`;
    try {
      await updateDoc(doc(db, path), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteSubject = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/subjects/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const toggleSubjectStatus = async (id: string, currentStatus: string) => {
    if (!user) return;
    const nextStatus = currentStatus === 'active' ? 'optional' : currentStatus === 'optional' ? 'future' : 'active';
    await updateSubject(id, { status: nextStatus as any });
  };

  const moveSubject = async (id: string, direction: 'up' | 'down') => {
    if (!user) return;
    const index = subjects.findIndex(s => s.id === id);
    if (direction === 'up' && index > 0) {
      const other = subjects[index - 1];
      await updateSubject(id, { order: index - 1 });
      await updateSubject(other.id, { order: index });
    } else if (direction === 'down' && index < subjects.length - 1) {
      const other = subjects[index + 1];
      await updateSubject(id, { order: index + 1 });
      await updateSubject(other.id, { order: index });
    }
  };

  // Cycle Blocks
  const addCycleBlock = async (subjectId: string, subjectName: string, type: string, duration: number) => {
    if (!user) return;
    const path = `users/${user.uid}/cycleBlocks`;
    try {
      await addDoc(collection(db, path), {
        subjectId,
        subjectName,
        type,
        durationMinutes: duration,
        order: cycleBlocks.length
      });
      
      // Validação do currentCycleIndex após mutação
      const newBlocksCount = cycleBlocks.length + 1;
      const sanitizedIndex = sanitizeCycleIndex(profile?.currentCycleIndex || 0, new Array(newBlocksCount));
      if (sanitizedIndex !== (profile?.currentCycleIndex || 0)) {
        await updateDoc(doc(db, 'users', user.uid), { currentCycleIndex: sanitizedIndex });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const updateBlock = async (id: string, updates: any) => {
    if (!user) return;
    const path = `users/${user.uid}/cycleBlocks/${id}`;
    try {
      await updateDoc(doc(db, path), updates);
      
      // Validação do currentCycleIndex após mutação (caso tenha afetado a estrutura)
      const sanitizedIndex = sanitizeCycleIndex(profile?.currentCycleIndex || 0, cycleBlocks);
      if (sanitizedIndex !== (profile?.currentCycleIndex || 0)) {
        await updateDoc(doc(db, 'users', user.uid), { currentCycleIndex: sanitizedIndex });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteBlock = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/cycleBlocks/${id}`;
    try {
      await deleteDoc(doc(db, path));
      
      // Validação do currentCycleIndex após mutação (remoção)
      const newBlocksCount = Math.max(0, cycleBlocks.length - 1);
      const sanitizedIndex = sanitizeCycleIndex(profile?.currentCycleIndex || 0, new Array(newBlocksCount));
      if (sanitizedIndex !== (profile?.currentCycleIndex || 0)) {
        await updateDoc(doc(db, 'users', user.uid), { currentCycleIndex: sanitizedIndex });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const duplicateBlock = async (block: any) => {
    if (!user) return;
    const { id, ...data } = block;
    const path = `users/${user.uid}/cycleBlocks`;
    try {
      await addDoc(collection(db, path), {
        ...data,
        order: cycleBlocks.length
      });
      
      // Validação do currentCycleIndex após mutação (adição por duplicação)
      const newBlocksCount = cycleBlocks.length + 1;
      const sanitizedIndex = sanitizeCycleIndex(profile?.currentCycleIndex || 0, new Array(newBlocksCount));
      if (sanitizedIndex !== (profile?.currentCycleIndex || 0)) {
        await updateDoc(doc(db, 'users', user.uid), { currentCycleIndex: sanitizedIndex });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const generateCycle = async (dailyTime: number, blocksPerDay: number, cycleFocus: string) => {
    if (!user) return;
    setIsGenerating(true);
    
    const activeSubjects = subjects.filter(s => s.status === 'active');
    const sorted = [...activeSubjects].sort((a, b) => {
      if (a.group !== b.group) return a.group - b.group;
      return (a.order || 0) - (b.order || 0);
    });
    
    const limitCount = profile?.studentLevel === 'iniciante' ? 5 : 8;
    const suggestedSubjects = sorted.slice(0, limitCount);
    const duration = Math.round(dailyTime / blocksPerDay);
    
    try {
      // Clear existing blocks
      for (const block of cycleBlocks) {
        await deleteDoc(doc(db, `users/${user.uid}/cycleBlocks`, block.id));
      }

      // Reset index on new cycle generation
      await updateDoc(doc(db, 'users', user.uid), { currentCycleIndex: 0 });

      // Create new blocks
      for (let i = 0; i < blocksPerDay; i++) {
        const subject = suggestedSubjects[i % suggestedSubjects.length];
        if (!subject) continue;

        let type = 'teoria';
        if (cycleFocus === 'questoes') type = 'questoes';
        else if (cycleFocus === 'revisao') type = 'revisao';
        else if (cycleFocus === 'equilibrado') {
          if (i % 2 === 0) type = 'teoria';
          else type = 'questoes';
        }

        await addDoc(collection(db, `users/${user.uid}/cycleBlocks`), {
          subjectId: subject.id,
          subjectName: subject.name,
          type,
          durationMinutes: duration,
          order: i,
          difficulty: subject.studentLevel === 'iniciante' ? 'facil' : 'media'
        });
      }
    } catch (err) {
      console.error("Error generating cycle:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Daily Blocks
  const addDailyBlock = async (block: Partial<DailyBlock>) => {
    if (!user) return;
    const path = `users/${user.uid}/dailyBlocks`;
    try {
      await addDoc(collection(db, path), {
        ...block,
        status: 'pendente',
        date: getTodayLocalDate(),
        order: Date.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const updateDailyBlock = async (id: string, updates: Partial<DailyBlock>) => {
    if (!user) return;
    const path = `users/${user.uid}/dailyBlocks/${id}`;
    try {
      await updateDoc(doc(db, path), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteDailyBlock = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/dailyBlocks/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Errors
  const saveError = async (subjectId: string, text: string) => {
    if (!user) return;
    setSavingError(true);
    const path = `users/${user.uid}/errors`;
    try {
      const now = new Date();
      await addDoc(collection(db, path), {
        subjectId,
        subjectName: subjects.find(s => s.id === subjectId)?.name || 'Desconhecida',
        content: text,
        date: now.toISOString(),
        createdAt: serverTimestamp(),
        reviewed: false,
        nextReview: now, // Support legacy view
        proximaRevisao: serverTimestamp(), // SRS: Review immediately
        intervalo: 1, // Default interval: 1 day
        facilidade: 2.5, // Default ease factor
        totalRevisoes: 0
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setSavingError(false);
    }
  };

  const rateErrorReview = async (errorId: string, rating: 'dificil' | 'ok' | 'facil') => {
    if (!user) return;
    const error = errors.find(e => e.id === errorId);
    if (!error) return;

    const path = `users/${user.uid}/errors/${errorId}`;
    try {
      let intervalo = error.intervalo || 1;
      let facilidade = error.facilidade || 2.5;
      const totalRevisoes = error.totalRevisoes || 0;
      
      let qualidade: 0 | 1 | 2 | 3 | 4 | 5 = 3;

      if (rating === 'dificil') {
        qualidade = 1;
      } else if (rating === 'ok') {
        qualidade = 3;
      } else if (rating === 'facil') {
        qualidade = 5;
      }

      const srsResult = calcularSRS(error, qualidade);

      await persistirRevisaoSRS(user.uid, errorId, {
        intervalo: srsResult.intervalo,
        facilidade: srsResult.facilidade,
        proximaRevisao: srsResult.proximaRevisao,
        qualidade: srsResult.qualidade
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteError = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/errors/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const updateError = async (id: string, updates: Partial<StudyError>) => {
    if (!user) return;
    const path = `users/${user.uid}/errors/${id}`;
    try {
      await updateDoc(doc(db, path), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Question Records
  const addQuestionRecord = async (subjectId: string, topic: string, total: number, correct: number) => {
    if (!user) return;
    setSavingRecord(true);
    // questionRecords = fonte de verdade de desempenho
    // subjects.accuracy é apenas cache derivado
    const path = `users/${user.uid}/questionRecords`;
    try {
      const errorsCount = total - correct;
      const percentage = (correct / total) * 100;
      const subjectName = subjects.find(s => s.id === subjectId)?.name || 'Desconhecida';

      await addDoc(collection(db, path), {
        subjectId,
        subjectName,
        topic,
        total,
        correct,
        errors: errorsCount,
        percentage,
        date: new Date().toISOString()
      });

      // Update subject stats
      const subjectRef = doc(db, `users/${user.uid}/subjects`, subjectId);
      const subDoc = subjects.find(s => s.id === subjectId);
      if (subDoc) {
        const newTotalSolved = (subDoc.questionsSolved || 0) + total;
        const subjectRecords = questionRecords.filter(r => r.subjectId === subjectId);
        const totalAllTime = subjectRecords.reduce((acc, r) => acc + r.total, 0) + total;
        const correctAllTime = subjectRecords.reduce((acc, r) => acc + r.correct, 0) + correct;
        const newAccuracy = totalAllTime > 0 ? (correctAllTime / totalAllTime) * 100 : 0;

        await updateDoc(subjectRef, {
          questionsSolved: newTotalSolved,
          accuracy: newAccuracy
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setSavingRecord(false);
    }
  };

  const deleteQuestionRecord = async (recordId: string, subjectId: string, total: number) => {
    if (!user) return;
    const path = `users/${user.uid}/questionRecords/${recordId}`;
    try {
      await deleteDoc(doc(db, path));
      
      // Recalculate subject stats
      const subjectRef = doc(db, `users/${user.uid}/subjects`, subjectId);
      const subDoc = subjects.find(s => s.id === subjectId);
      if (subDoc) {
        const subjectRecords = questionRecords.filter(r => r.id !== recordId && r.subjectId === subjectId);
        const totalAllTime = subjectRecords.reduce((acc, r) => acc + r.total, 0);
        const correctAllTime = subjectRecords.reduce((acc, r) => acc + r.correct, 0);
        const newAccuracy = totalAllTime > 0 ? (correctAllTime / totalAllTime) * 100 : 0;
        const newTotalSolved = Math.max(0, (subDoc.questionsSolved || 0) - total);

        await updateDoc(subjectRef, {
          questionsSolved: newTotalSolved,
          accuracy: newAccuracy
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Topics
  const addTopic = async (subjectId: string, name: string, order: number) => {
    if (!user) return false;
    const trimmedName = name.trim();
    if (!subjectId) {
      alert('Selecione uma disciplina antes de adicionar o conteúdo.');
      return false;
    }
    if (!trimmedName) {
      alert('Informe o nome do conteúdo antes de adicionar.');
      return false;
    }

    const path = `users/${user.uid}/subjects/${subjectId}/topics`;
    try {
      await addDoc(collection(db, path), {
        name: trimmedName,
        status: 'nao_iniciado',
        order
      });
      return true;
    } catch (err) {
      console.error('Erro ao adicionar tópico:', { err, path });
      alert('Não foi possível salvar o tópico. Verifique as permissões do Firestore e tente novamente.');
      return false;
    }
  };

  const updateTopic = async (subjectId: string, topicId: string, updates: Partial<Topic>) => {
    if (!user) return false;
    const path = `users/${user.uid}/subjects/${subjectId}/topics/${topicId}`;
    try {
      await updateDoc(doc(db, path), updates);
      return true;
    } catch (err) {
      console.error('Erro ao atualizar tópico:', { err, path });
      alert('Não foi possível atualizar o tópico. Verifique as permissões do Firestore e tente novamente.');
      return false;
    }
  };

  const deleteTopic = async (subjectId: string, topicId: string) => {
    if (!user) return false;
    const path = `users/${user.uid}/subjects/${subjectId}/topics/${topicId}`;
    try {
      await deleteDoc(doc(db, path));
      return true;
    } catch (err) {
      console.error('Erro ao excluir tópico:', { err, path });
      alert('Não foi possível excluir o tópico. Verifique as permissões do Firestore e tente novamente.');
      return false;
    }
  };

  const handleSaveProfile = async (name: string, photo: string, cover: string) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: name,
        photoURL: photo,
        coverURL: cover
      });
      return true;
    } catch (error) {
      console.error("Error saving profile:", error);
      handleFirestoreError(error, OperationType.UPDATE, path);
      return false;
    }
  };

  const generateDailyPlan = async (dailyTime: number, blocksPerDay: number) => {
    if (!user) return;
    if (cycleBlocks.length === 0) {
      alert("⚠️ Você não possui um Ciclo Base configurado.\n\nVá para a aba 'O Ciclo Base' e gere ou adicione blocos de estudo antes de gerar o plano diário.");
      return;
    }
    setIsGenerating(true);
    
    const today = getTodayLocalDate();
    const currentIndex = profile?.currentCycleIndex || 0;
    
    try {
      // Limpa blocos existentes do dia antes de regerar
      const qDaily = query(collection(db, `users/${user.uid}/dailyBlocks`), where('date', '==', today));
      const snap = await getDocs(qDaily);
      const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);

      for (let i = 0; i < blocksPerDay; i++) {
        const blockIndex = (currentIndex + i) % cycleBlocks.length;
        const cycleBlock = cycleBlocks[blockIndex];
        
        await addDoc(collection(db, `users/${user.uid}/dailyBlocks`), {
          subjectId: cycleBlock.subjectId,
          subjectName: cycleBlock.subjectName,
          type: cycleBlock.type,
          durationMinutes: cycleBlock.durationMinutes,
          order: i,
          status: 'pendente',
          date: today
        });
      }
    } catch (err) {
      console.error("Error generating daily plan:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const finishStudySession = async (activeSessionBlock: any, selectedSubject: string, seconds: number) => {
    if (!user) return;
    if (!activeSessionBlock && !selectedSubject) return;
    
    const validSeconds = typeof seconds === 'number' ? seconds : 0;
    const actualMinutes = Math.floor(validSeconds / 60);
    if (actualMinutes < 1) return;

    const subjectId = activeSessionBlock?.subjectId || selectedSubject;
    const subDoc = subjects.find(s => s.id === subjectId);
    if (!subDoc) return;

    try {
      // 1. Save Session
      // sessions = fonte de verdade do tempo estudado
      // NÃO calcular tempo a partir de dailyBlocks ou cycleBlocks
      await addDoc(collection(db, `users/${user.uid}/sessions`), {
        subjectId: subjectId,
        subjectName: subDoc.name,
        durationMinutes: actualMinutes,
        type: activeSessionBlock?.type || 'teoria',
        timestamp: serverTimestamp()
      });

      // 2. Update Daily Block if exists
      if (activeSessionBlock) {
        await updateDoc(doc(db, `users/${user.uid}/dailyBlocks`, activeSessionBlock.id), { 
          status: 'concluido',
          actualMinutes
        });
        
        // Update Cycle Position
        const nextIndex = ((profile?.currentCycleIndex || 0) + 1) % cycleBlocks.length;
        await updateDoc(doc(db, 'users', user.uid), { currentCycleIndex: nextIndex });
      }

      // 3. Update Subject Stats
      const subjectRef = doc(db, `users/${user.uid}/subjects`, subjectId);
      await updateDoc(subjectRef, {
        totalHours: (subDoc.totalHours || 0) + (actualMinutes / 60),
        lastStudied: serverTimestamp()
      });
      return true;
    } catch (err) {
      console.error("Error finishing study session:", err);
      return false;
    }
  };

  const updateCycleSettings = async (updates: any) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), updates);
    } catch (error) {
      console.error("Error updating cycle settings:", error);
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const completeOnboarding = async (data: { level: string, hours: number, subjects: string[] }) => {
    if (!user) return;
    setIsGenerating(true);
    try {
      const today = getTodayLocalDate();
      const dailyTimeMinutes = data.hours * 60;
      const blocksPerDay = data.hours >= 4 ? 4 : 2;

      // 1. Create/Update Profile
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        studentLevel: data.level,
        dailyTimeMinutes: dailyTimeMinutes,
        blocksPerDay: blocksPerDay,
        onboardingCompleted: true,
        createdAt: serverTimestamp(),
        theme: 'dark',
        accentColor: 'green',
        area: 'administrativa', // Default area
        currentCycleIndex: 0
      }, { merge: true });

      // 2. Add Subjects and collect their data
      const addedSubjects: { id: string, name: string, studentLevel: string }[] = [];
      for (let i = 0; i < data.subjects.length; i++) {
        const name = data.subjects[i];
        const path = `users/${user.uid}/subjects`;
        const subLevel = data.level === 'iniciante' ? 'Iniciante' : 'Intermediário';
        const docRef = await addDoc(collection(db, path), {
          userId: user.uid,
          name,
          group: 1,
          status: 'active',
          weight: 3,
          order: i,
          studentLevel: subLevel,
          performancePercent: 0,
          studyFrequency: 0,
          dynamicPriority: 3,
          totalHours: 0,
          questionsSolved: 0,
          accuracy: 0,
          lastStudied: null
        });
        addedSubjects.push({ id: docRef.id, name, studentLevel: subLevel });
      }

      // 3. Generate initial cycle
      if (addedSubjects.length > 0) {
        const duration = Math.round(dailyTimeMinutes / blocksPerDay);
        for (let i = 0; i < blocksPerDay; i++) {
          const subject = addedSubjects[i % addedSubjects.length];
          const type = i % 2 === 0 ? 'teoria' : 'questoes';
          
          await addDoc(collection(db, `users/${user.uid}/cycleBlocks`), {
            subjectId: subject.id,
            subjectName: subject.name,
            type,
            durationMinutes: duration,
            order: i,
            difficulty: subject.studentLevel === 'Iniciante' ? 'facil' : 'media'
          });

          // 4. Also add it to today's plan
          await addDoc(collection(db, `users/${user.uid}/dailyBlocks`), {
            subjectId: subject.id,
            subjectName: subject.name,
            type,
            durationMinutes: duration,
            order: i,
            status: 'pendente',
            date: today
          });
        }
      }
      
      return true;
    } catch (err) {
      console.error("Error completing onboarding:", err);
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    addSubject,
    updateSubject,
    deleteSubject,
    toggleSubjectStatus,
    moveSubject,
    addCycleBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    generateCycle,
    addDailyBlock,
    updateDailyBlock,
    deleteDailyBlock,
    saveError,
    rateErrorReview,
    deleteError,
    updateError,
    savingError,
    addQuestionRecord,
    deleteQuestionRecord,
    savingRecord,
    addTopic,
    updateTopic,
    deleteTopic,
    isGenerating,
    mentorAdvice,
    loadingAdvice,
    setMentorAdvice,
    setLoadingAdvice,
    handleSaveProfile,
    fetchMentorAdvice,
    generateDailyPlan,
    finishStudySession,
    updateCycleSettings,
    completeOnboarding
  };
}
