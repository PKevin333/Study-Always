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
  getDoc,
  limit,
  orderBy,
  arrayUnion,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db, auth, storage } from '../firebase';
import { deleteObject, ref as storageRef } from 'firebase/storage';
import { 
  Subject, 
  CycleBlock, 
  DailyBlock, 
  Topic, 
  StudyError,
  StudyErrorDraft,
  Session,
  CalendarTask,
  OperationType 
} from '../types';
import { handleFirestoreError } from '../utils/firestore';
import { getTodayLocalDate } from '../utils/date';
import { sanitizeCycleIndex } from '../utils/cycle';
import { getSubjectColorId } from '../utils/subjectColors';
import { serializeAccentPreference } from '../utils/themePreferences';
import {
  getOptionalUrlError,
  MAX_CALENDAR_NOTES_LENGTH,
  MAX_CALENDAR_TITLE_LENGTH,
  MAX_ERROR_CONTENT_LENGTH,
  MAX_PROFILE_NAME_LENGTH,
  MAX_TARGET_EXAM_LENGTH,
} from '../utils/inputValidation';

import { getMentorAdvice } from '../services/geminiService';
import { calcularSRS } from '../utils/srsCalculator';
import { toast } from '../components/shared/ToastViewport';

const FIRESTORE_WRITE_TIMEOUT_MS = 15000;

const withWriteTimeout = async <T,>(promise: Promise<T>, message: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), FIRESTORE_WRITE_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const allowedCycleFocuses = ['teoria', 'questoes', 'revisao', 'equilibrado'] as const;
const allowedCycleAutonomies = ['sugerido', 'parcial', 'manual'] as const;
const allowedCalendarCategories = ['estudo', 'revisao', 'questoes', 'simulado', 'outro'] as const;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isStudyType = (value: unknown): value is 'teoria' | 'questoes' | 'revisao' =>
  value === 'teoria' || value === 'questoes' || value === 'revisao';

const isPermissionDenied = (error: unknown) => {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';
  return code === 'permission-denied' || code === 'firestore/permission-denied';
};

export const persistirRevisaoSRS = async (
  userId: string,
  erroId: string,
  dadosAtualizados: {
    intervalo: number;
    facilidade: number;
    proximaRevisao: Date;
    qualidade: number;
    nivel: number;
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
    historico: arrayUnion({ data: new Date(), qualidade: dadosAtualizados.qualidade }),
    nivel: dadosAtualizados.nivel
  });
};

export function useDashboardActions(user: any, subjects: Subject[], cycleBlocks: CycleBlock[], questionRecords: any[], profile: any, errors: StudyError[]) {
  const [savingError, setSavingError] = useState(false);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [mentorAdvice, setMentorAdvice] = useState<{ title: string, content: string, actionPoints: string[] } | null>(null);
  const [savingRecord, setSavingRecord] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const resolveSubjectForSession = async (subjectId: string, fallbackName?: string | null) => {
    const cachedSubject = subjects.find((subject) => subject.id === subjectId);
    if (cachedSubject) {
      return {
        id: cachedSubject.id,
        name: cachedSubject.name,
        totalHours: cachedSubject.totalHours || 0
      };
    }

    if (!user || !subjectId) return null;

    try {
      const subjectSnap = await getDoc(doc(db, `users/${user.uid}/subjects`, subjectId));
      if (!subjectSnap.exists()) {
        return fallbackName ? { id: subjectId, name: fallbackName, totalHours: 0 } : null;
      }

      const data = subjectSnap.data() as Partial<Subject>;
      return {
        id: subjectSnap.id,
        name: data.name || fallbackName || 'Disciplina',
        totalHours: data.totalHours || 0
      };
    } catch (error) {
      console.error('Error resolving subject for session:', error);
      return fallbackName ? { id: subjectId, name: fallbackName, totalHours: 0 } : null;
    }
  };

  const fetchMentorAdvice = async (sessions: any[]) => {
    if (!profile) return;
    setLoadingAdvice(true);
    try {
      const normalizedSessions = sessions.map((session) => ({
        subjectId: session.subjectId,
        subjectName: session.subjectName,
        durationMinutes: session.durationMinutes,
        type: session.type,
        timestamp: session.timestamp?.toDate
          ? session.timestamp.toDate().toISOString()
          : session.timestamp instanceof Date
            ? session.timestamp.toISOString()
            : session.timestamp || null
      }));
      const advice = await getMentorAdvice(profile, subjects, normalizedSessions);
      setMentorAdvice(advice);
    } catch (err) {
      console.error("Error fetching mentor advice:", err);
    } finally {
      setLoadingAdvice(false);
    }
  };

  // Subjects
  const syncSubjectTopicProgress = async (subjectId: string) => {
    if (!user || !subjectId) return;
    const topicsPath = `users/${user.uid}/subjects/${subjectId}/topics`;
    const topicsSnap = await getDocs(collection(db, topicsPath));
    const totalTopics = topicsSnap.size;
    const completedTopics = topicsSnap.docs.filter(topic => topic.data().status === 'concluido').length;
    const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    await updateDoc(doc(db, `users/${user.uid}/subjects`, subjectId), {
      completedTopics,
      totalTopics,
      progressPercent
    });
  };

  const addSubject = async (name: string, group: number, color?: string) => {
    if (!user) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.warning('Informe o nome da disciplina antes de adicionar.');
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
        lastStudied: null,
        color: color || getSubjectColorId({ id: `${Date.now()}-${trimmedName}` }),
        completedTopics: 0,
        totalTopics: 0,
        progressPercent: 0
      });
      toast.success(`${trimmedName} foi adicionada às disciplinas.`);
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
  const addCycleBlock = async (subjectId: string, subjectName: string, type: string, duration: number, dayOfWeek?: number) => {
    if (!user) return;
    // [FIX]: evita criar bloco inválido quando não há disciplina selecionada/ativa.
    if (!subjectId || !subjectName || duration <= 0) {
      toast.warning('Selecione uma disciplina ativa antes de adicionar um bloco ao ciclo.');
      return;
    }
    const path = `users/${user.uid}/cycleBlocks`;
    try {
      const sameDayBlocks = Number.isInteger(dayOfWeek)
        ? cycleBlocks.filter(block => block.dayOfWeek === dayOfWeek)
        : cycleBlocks.filter(block => block.dayOfWeek === undefined || block.dayOfWeek === null);
      await addDoc(collection(db, path), {
        subjectId,
        subjectName,
        type,
        durationMinutes: duration,
        order: sameDayBlocks.length,
        ...(Number.isInteger(dayOfWeek) ? { dayOfWeek } : {})
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
      const sameDayBlocks = Number.isInteger(data.dayOfWeek)
        ? cycleBlocks.filter(item => item.dayOfWeek === data.dayOfWeek)
        : cycleBlocks.filter(item => item.dayOfWeek === undefined || item.dayOfWeek === null);
      await addDoc(collection(db, path), {
        ...data,
        order: sameDayBlocks.length
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

  const saveCycleDayBlocks = async (
    dayOfWeek: number,
    blocks: Array<{
      subjectId: string;
      type: string;
      durationMinutes: number;
    }>
  ) => {
    if (!user) return false;
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      toast.warning('Selecione um dia da semana válido.');
      return false;
    }

    const normalizedBlocks = blocks.map((block, index) => {
      const subject = subjects.find(s => s.id === block.subjectId);
      const duration = Math.max(5, Math.floor(Number(block.durationMinutes) || 0));
      const type = ['teoria', 'questoes', 'revisao'].includes(block.type) ? block.type : 'teoria';

      return {
        subject,
        subjectId: block.subjectId,
        subjectName: subject?.name || '',
        type,
        durationMinutes: duration,
        order: index,
        dayOfWeek,
        difficulty: subject?.studentLevel === 'Iniciante' ? 'facil' : 'media'
      };
    });

    if (normalizedBlocks.some(block => !block.subject || !block.subjectId || block.durationMinutes < 5)) {
      toast.warning('Revise as matérias e durações antes de salvar o ciclo.');
      return false;
    }

    const path = `users/${user.uid}/cycleBlocks`;
    try {
      const batch = writeBatch(db);
      const collectionRef = collection(db, path);
      cycleBlocks
        .filter(block => block.dayOfWeek === dayOfWeek)
        .forEach(block => batch.delete(doc(db, path, block.id)));

      normalizedBlocks.forEach(({ subject, ...block }) => {
        const blockRef = doc(collectionRef);
        batch.set(blockRef, block);
      });

      await batch.commit();
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      return false;
    }
  };

  const generateCycle = async (dailyTime: number, blocksPerDay: number, cycleFocus: string) => {
    if (!user) return;
    const activeSubjects = subjects.filter(s => s.status === 'active');
    // [FIX]: gerar ciclo sem matéria ativa apagava os blocos existentes e não recriava nada.
    if (activeSubjects.length === 0) {
      toast.warning('Ative ao menos uma disciplina antes de gerar o ciclo.');
      return;
    }
    if (blocksPerDay <= 0) {
      toast.warning('Informe ao menos um bloco de estudo por dia.');
      return;
    }

    setIsGenerating(true);

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
  const saveError = async (draft: StudyErrorDraft): Promise<boolean> => {
    if (!user) return false;
    const trimmedText = draft.conteudo.trim();
    // [FIX]: garante que chamadas fora da UI não gravem erro sem disciplina ou conteúdo.
    if (!draft.subjectId || !trimmedText) {
      toast.warning('Selecione a disciplina e descreva o erro antes de salvar.');
      return false;
    }
    if (trimmedText.length > MAX_ERROR_CONTENT_LENGTH) {
      toast.warning(`A anotação do erro deve ter no máximo ${MAX_ERROR_CONTENT_LENGTH} caracteres.`);
      return false;
    }
    setSavingError(true);
    const path = `users/${user.uid}/errors`;
    try {
      const now = new Date();
      const subjectName = subjects.find(s => s.id === draft.subjectId)?.name || draft.disciplina;
      const payload = {
        subjectId: draft.subjectId,
        subjectName,
        content: trimmedText,
        disciplina: subjectName,
        assunto: draft.assunto || null,
        tipoErro: draft.tipoErro,
        conteudo: trimmedText,
        anexos: draft.anexos,
        tags: draft.tags,
        criadoEm: serverTimestamp(),
        nivel: draft.nivel,
        date: now.toISOString(),
        createdAt: serverTimestamp(),
        reviewed: false,
        nextReview: now, // Support legacy view
        proximaRevisao: serverTimestamp(), // SRS: Review immediately
        intervalo: 1, // Default interval: 1 day
        facilidade: 2.5, // Default ease factor
        totalRevisoes: 0
      };
      try {
        await addDoc(collection(db, path), payload);
        toast.success('Erro registrado no caderno.');
        return true;
      } catch (error) {
        // Vercel does not deploy Firebase rules. Keep basic registration working
        // while the expanded error schema is being deployed separately.
        if (!isPermissionDenied(error) || draft.anexos.length > 0) throw error;

        console.warn('Expanded error schema was denied; retrying with the legacy-compatible payload.');
        await addDoc(collection(db, path), {
          subjectId: draft.subjectId,
          subjectName,
          content: trimmedText,
          date: now.toISOString(),
          createdAt: serverTimestamp(),
          reviewed: false,
          nextReview: now,
          proximaRevisao: serverTimestamp(),
          intervalo: 1,
          facilidade: 2.5,
          totalRevisoes: 0
        });
        toast.success('Erro registrado no caderno.');
        return true;
      }
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, path);
      } catch {
        // The modal owns the user-facing message; avoid converting a handled
        // Firestore rejection into an unrelated attachment error.
      }
      return false;
    } finally {
      setSavingError(false);
    }
  };

  const rateErrorReview = async (errorId: string, rating: 'dificil' | 'ok' | 'facil') => {
    if (!user) return false;
    const error = errors.find(e => e.id === errorId);
    if (!error) return false;

    const path = `users/${user.uid}/errors/${errorId}`;
    try {
      let qualidade: 0 | 1 | 2 | 3 | 4 | 5 = 3;

      if (rating === 'dificil') {
        qualidade = 1;
      } else if (rating === 'ok') {
        qualidade = 3;
      } else if (rating === 'facil') {
        qualidade = 5;
      }

      const srsResult = calcularSRS(error, qualidade);
      const currentLevel = error.nivel || 1;
      const nextLevel = rating === 'facil'
        ? Math.min(5, currentLevel + 1)
        : rating === 'dificil'
          ? Math.max(1, currentLevel - 1)
          : currentLevel;

      await persistirRevisaoSRS(user.uid, errorId, {
        intervalo: srsResult.intervalo,
        facilidade: srsResult.facilidade,
        proximaRevisao: srsResult.proximaRevisao,
        qualidade: srsResult.qualidade,
        nivel: nextLevel
      });
      toast.success('Revisão registrada e próxima data atualizada.');
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
      return false;
    }
  };

  const deleteError = async (id: string): Promise<boolean> => {
    if (!user) return false;
    const path = `users/${user.uid}/errors/${id}`;
    try {
      await deleteDoc(doc(db, path));
      toast.success('Registro excluído do Caderno de Erros.');
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
      return false;
    }
  };

  const updateError = async (id: string, updates: Partial<StudyErrorDraft & StudyError>): Promise<boolean> => {
    if (!user) return false;
    const path = `users/${user.uid}/errors/${id}`;
    const allowedUpdates: Partial<StudyError> = {};

    if (typeof updates.content === 'string') {
      const trimmedContent = updates.content.trim();
      if (!trimmedContent) {
        toast.warning('A anotação do erro não pode ficar vazia.');
        return false;
      }
      if (trimmedContent.length > MAX_ERROR_CONTENT_LENGTH) {
        toast.warning(`A anotação do erro deve ter no máximo ${MAX_ERROR_CONTENT_LENGTH} caracteres.`);
        return false;
      }
      allowedUpdates.content = trimmedContent;
      allowedUpdates.conteudo = trimmedContent;
    }

    if (typeof updates.conteudo === 'string') {
      const trimmedContent = updates.conteudo.trim();
      if (!trimmedContent || trimmedContent.length > MAX_ERROR_CONTENT_LENGTH) return false;
      allowedUpdates.conteudo = trimmedContent;
      allowedUpdates.content = trimmedContent;
    }

    if (typeof updates.subjectId === 'string' && subjects.some(subject => subject.id === updates.subjectId)) {
      const subjectName = subjects.find(subject => subject.id === updates.subjectId)?.name || updates.disciplina || 'Desconhecida';
      allowedUpdates.subjectId = updates.subjectId;
      allowedUpdates.subjectName = subjectName;
      allowedUpdates.disciplina = subjectName;
    }

    if ('assunto' in updates) {
      allowedUpdates.assunto = updates.assunto?.trim() || '';
    }

    if (updates.tipoErro && ['atencao', 'nao_sabia', 'confusao', 'pegadinha'].includes(updates.tipoErro)) {
      allowedUpdates.tipoErro = updates.tipoErro;
    }

    if (Array.isArray(updates.anexos) && updates.anexos.length <= 5) {
      allowedUpdates.anexos = updates.anexos;
    }

    if (Array.isArray(updates.tags)) {
      allowedUpdates.tags = updates.tags.slice(0, 10);
    }

    if (isFiniteNumber(updates.nivel)) {
      allowedUpdates.nivel = Math.min(5, Math.max(1, Math.round(updates.nivel)));
    }

    if (typeof updates.reviewed === 'boolean') {
      allowedUpdates.reviewed = updates.reviewed;
    }

    if (updates.nextReview !== undefined) {
      allowedUpdates.nextReview = updates.nextReview;
    }

    if (updates.proximaRevisao !== undefined) {
      allowedUpdates.proximaRevisao = updates.proximaRevisao;
    }

    if (isFiniteNumber(updates.intervalo)) {
      allowedUpdates.intervalo = updates.intervalo;
    }

    if (isFiniteNumber(updates.facilidade)) {
      allowedUpdates.facilidade = updates.facilidade;
    }

    if (isFiniteNumber(updates.totalRevisoes)) {
      allowedUpdates.totalRevisoes = updates.totalRevisoes;
    }

    if (Array.isArray(updates.historico)) {
      allowedUpdates.historico = updates.historico;
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return false;
    }

    try {
      await updateDoc(doc(db, path), allowedUpdates);
      toast.success('Registro atualizado.');
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
      return false;
    }
  };

  // Question Records
  const addQuestionRecord = async (subjectId: string, topic: string, total: number, correct: number): Promise<boolean> => {
    if (!user) return false;
    const trimmedTopic = topic.trim();
    // [FIX]: total zero/negativo ou acertos maiores que o total geram NaN e são rejeitados pelas regras.
    if (!subjectId || !trimmedTopic || total <= 0 || correct < 0 || correct > total) {
      toast.warning('Informe disciplina, assunto, total de questões e acertos válidos.');
      return false;
    }
    if (savingRecord) return false;
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
        topic: trimmedTopic,
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
      toast.success('Resultado de questões registrado.');
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      return false;
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
      toast.warning('Selecione uma disciplina antes de adicionar o conteúdo.');
      return false;
    }
    if (!trimmedName) {
      toast.warning('Informe o nome do conteúdo antes de adicionar.');
      return false;
    }

    const path = `users/${user.uid}/subjects/${subjectId}/topics`;
    try {
      // [FIX]: mantém o payload igual ao contrato mínimo validado nas regras do Firestore.
      await addDoc(collection(db, path), {
        name: trimmedName,
        status: 'nao_iniciado',
        order
      });
      await syncSubjectTopicProgress(subjectId);
      toast.success('Tópico adicionado à disciplina.');
      return true;
    } catch (err) {
      console.error('Erro ao adicionar tópico:', { err, path });
      toast.error('Não foi possível salvar o tópico. Verifique sua conexão e tente novamente.');
      return false;
    }
  };

  const updateTopic = async (subjectId: string, topicId: string, updates: Partial<Topic>) => {
    if (!user) return false;
    const path = `users/${user.uid}/subjects/${subjectId}/topics/${topicId}`;
    try {
      await updateDoc(doc(db, path), updates);
      if ('status' in updates) {
        await syncSubjectTopicProgress(subjectId);
      }
      return true;
    } catch (err) {
      console.error('Erro ao atualizar tópico:', { err, path });
      toast.error('Não foi possível atualizar o tópico. Verifique sua conexão e tente novamente.');
      return false;
    }
  };

  const deleteTopic = async (subjectId: string, topicId: string) => {
    if (!user) return false;
    const path = `users/${user.uid}/subjects/${subjectId}/topics/${topicId}`;
    try {
      await deleteDoc(doc(db, path));
      await syncSubjectTopicProgress(subjectId);
      toast.success('Tópico excluído.');
      return true;
    } catch (err) {
      console.error('Erro ao excluir tópico:', { err, path });
      toast.error('Não foi possível excluir o tópico. Verifique sua conexão e tente novamente.');
      return false;
    }
  };

  const handleSaveProfile = async (name: string, photo: string, cover: string, targetContest: string) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    const trimmedName = name.trim();
    const trimmedPhoto = photo.trim();
    const trimmedCover = cover.trim();
    const trimmedTargetContest = targetContest.trim();
    const photoError = getOptionalUrlError(trimmedPhoto);
    const coverError = getOptionalUrlError(trimmedCover);

    if (trimmedName.length > MAX_PROFILE_NAME_LENGTH) {
      toast.warning(`O nome de exibição deve ter no máximo ${MAX_PROFILE_NAME_LENGTH} caracteres.`);
      return false;
    }
    if (trimmedTargetContest.length > MAX_TARGET_EXAM_LENGTH) {
      toast.warning(`O concurso alvo deve ter no máximo ${MAX_TARGET_EXAM_LENGTH} caracteres.`);
      return false;
    }
    if (photoError) {
      toast.warning(photoError);
      return false;
    }
    if (coverError) {
      toast.warning(coverError);
      return false;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: trimmedName,
        photoURL: trimmedPhoto,
        coverURL: trimmedCover,
        // [FIX]: permite personalizar o concurso alvo exibido no perfil em vez de prender o usuário em "Tribunal de Contas".
        targetExam: trimmedTargetContest || 'Área Administrativa',
        concursoAlvo: trimmedTargetContest || 'Área Administrativa'
      });
      toast.success('Perfil atualizado com sucesso.');
      return true;
    } catch (error) {
      console.error("Error saving profile:", error);
      handleFirestoreError(error, OperationType.UPDATE, path);
      return false;
    }
  };

  const clearAllErrors = async (): Promise<boolean> => {
    if (!user) return false;
    const path = `users/${user.uid}/errors`;

    try {
      while (true) {
        const snapshot = await getDocs(query(collection(db, path), limit(400)));
        if (snapshot.empty) break;

        const batch = writeBatch(db);
        const attachmentUrls: string[] = [];
        snapshot.docs.forEach(errorDoc => {
          batch.delete(errorDoc.ref);
          const attachments = errorDoc.data().anexos;
          if (Array.isArray(attachments)) {
            attachments.forEach(attachment => {
              if (attachment && typeof attachment.url === 'string') {
                attachmentUrls.push(attachment.url);
              }
            });
          }
        });

        await batch.commit();

        const cleanupResults = await Promise.allSettled(
          attachmentUrls.map(url => deleteObject(storageRef(storage, url)))
        );
        const failedCleanupCount = cleanupResults.filter(result => result.status === 'rejected').length;
        if (failedCleanupCount > 0) {
          console.warn(`${failedCleanupCount} anexo(s) não puderam ser removidos do Storage.`);
        }
      }

      toast.success('Caderno de Erros limpo com sucesso.');
      return true;
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.DELETE, path);
      } catch {
        // The confirmation modal displays the user-facing error.
      }
      return false;
    }
  };

  const updateAccentColorPreference = async (accentColor: string) => {
    if (!user) return false;
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        accentColor: serializeAccentPreference(accentColor as Parameters<typeof serializeAccentPreference>[0])
      });
      return true;
    } catch (error) {
      console.error('Error saving accent color:', error);
      handleFirestoreError(error, OperationType.UPDATE, path);
      return false;
    }
  };

  const generateDailyPlan = async (dailyTime: number, blocksPerDay: number): Promise<DailyBlock[]> => {
    if (!user) return [];
    if (cycleBlocks.length === 0) {
      toast.warning("Você não possui um Ciclo Base configurado.\nVá para a aba 'Ciclo de Estudos' e gere ou adicione blocos antes de criar o plano diário.", { duration: 7000 });
      return [];
    }
    const activeSubjectIds = new Set(subjects.filter(subject => subject.status === 'active').map(subject => subject.id));
    const visibleCycleBlocks = cycleBlocks.filter(block => activeSubjectIds.has(block.subjectId));
    if (visibleCycleBlocks.length === 0) {
      toast.warning('Ative ao menos uma disciplina presente no ciclo antes de gerar o plano do dia.');
      return [];
    }

    const safeBlocksPerDay = Math.min(20, Math.max(1, Math.floor(Number.isFinite(blocksPerDay) ? blocksPerDay : 0)));
    setIsGenerating(true);
    
    const today = getTodayLocalDate();
    const currentIndex = sanitizeCycleIndex(profile?.currentCycleIndex || 0, visibleCycleBlocks);
    
    try {
      // [FIX]: batch atomico evita apagar o plano atual antes de confirmar que os novos blocos foram criados.
      const qDaily = query(collection(db, `users/${user.uid}/dailyBlocks`), where('date', '==', today));
      const snap = await getDocs(qDaily);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      const generatedBlocks: DailyBlock[] = [];
      const dailyBlocksCollection = collection(db, `users/${user.uid}/dailyBlocks`);

      for (let i = 0; i < safeBlocksPerDay; i++) {
        const blockIndex = (currentIndex + i) % visibleCycleBlocks.length;
        const cycleBlock = visibleCycleBlocks[blockIndex];
        const blockRef = doc(dailyBlocksCollection);
        const blockType = ['teoria', 'questoes', 'revisao'].includes(cycleBlock.type) ? cycleBlock.type : 'teoria';
        const fallbackDuration = Math.max(1, Math.round((Number.isFinite(dailyTime) && dailyTime > 0 ? dailyTime : 60) / safeBlocksPerDay));
        const blockData = {
          subjectId: cycleBlock.subjectId,
          subjectName: cycleBlock.subjectName,
          type: blockType,
          durationMinutes: Number.isFinite(cycleBlock.durationMinutes) && cycleBlock.durationMinutes > 0 ? cycleBlock.durationMinutes : fallbackDuration,
          order: i,
          status: 'pendente' as const,
          date: today
        };

        batch.set(blockRef, blockData);
        generatedBlocks.push({ id: blockRef.id, ...blockData });
      }

      await batch.commit();
      toast.success(`${generatedBlocks.length} blocos adicionados ao Plano do Dia.`);
      return generatedBlocks;
    } catch (err) {
      console.error("Error generating daily plan:", err);
      toast.error('Não foi possível gerar o plano do dia. Verifique sua conexão e tente novamente.');
      return [];
    } finally {
      setIsGenerating(false);
    }
  };

  const finishStudySession = async (activeSessionBlock: any, selectedSubject: string, seconds: number, sessionType: string = 'teoria') => {
    if (!user) return;
    if (!activeSessionBlock && !selectedSubject) return;
    
    const validSeconds = typeof seconds === 'number' ? seconds : 0;
    const actualMinutes = Math.floor(validSeconds / 60);
    if (actualMinutes < 1) return;

    const subjectId = activeSessionBlock?.subjectId || selectedSubject;
    const subDoc = await resolveSubjectForSession(subjectId, activeSessionBlock?.subjectName || null);
    if (!subDoc) {
      toast.error('Não foi possível localizar a disciplina desta sessão. Atualize a página e tente novamente.');
      return false;
    }
    const normalizedType = isStudyType(sessionType) ? sessionType : 'teoria';
    const persistedType = isStudyType(activeSessionBlock?.type) ? activeSessionBlock.type : normalizedType;

    try {
      // 1. Save Session
      // sessions = fonte de verdade do tempo estudado
      // NÃO calcular tempo a partir de dailyBlocks ou cycleBlocks
      const sessionRef = doc(collection(db, `users/${user.uid}/sessions`));
      await setDoc(sessionRef, {
        // [FIX]: as regras exigem userId para criar sessões.
        userId: user.uid,
        subjectId: subjectId,
        subjectName: subDoc.name,
        durationMinutes: actualMinutes,
        type: persistedType,
        timestamp: serverTimestamp()
      });

      // 2. Update Daily Block if exists
      if (activeSessionBlock) {
        try {
          await updateDoc(doc(db, `users/${user.uid}/dailyBlocks`, activeSessionBlock.id), { 
            status: 'concluido',
            actualMinutes
          });
        } catch (error) {
          console.error('Error updating daily block after saving session:', error);
        }
        
        // [FIX]: blocos manuais podem existir sem ciclo base; módulo por zero gravava índice inválido.
        if (cycleBlocks.length > 0) {
          const nextIndex = ((profile?.currentCycleIndex || 0) + 1) % cycleBlocks.length;
          try {
            await updateDoc(doc(db, 'users', user.uid), { currentCycleIndex: nextIndex });
          } catch (error) {
            console.error('Error advancing cycle index after saving session:', error);
          }
        }
      }

      // 3. Update Subject Stats
      try {
        const subjectRef = doc(db, `users/${user.uid}/subjects`, subjectId);
        await updateDoc(subjectRef, {
          totalHours: (subDoc.totalHours || 0) + (actualMinutes / 60),
          lastStudied: serverTimestamp()
        });
      } catch (error) {
        console.error('Error updating subject stats after saving session:', error);
      }
      toast.success(`${actualMinutes} min de estudo registrados.`);
      return true;
    } catch (err) {
      console.error("Error finishing study session:", err);
      toast.error('Não foi possível registrar o tempo estudado. Verifique a conexão e tente novamente.');
      return false;
    }
  };

  const recordManualStudySession = async (subjectId: string, minutes: number, type: string = 'teoria') => {
    if (!user) return false;
    const normalizedMinutes = Math.floor(minutes);
    if (!subjectId || !Number.isFinite(normalizedMinutes) || normalizedMinutes < 1) {
      toast.warning('Selecione uma disciplina e informe um tempo válido.');
      return false;
    }

    const subDoc = await resolveSubjectForSession(subjectId);
    if (!subDoc) {
      toast.error('Disciplina não encontrada. Atualize a página e tente novamente.');
      return false;
    }

    const sessionType = isStudyType(type) ? type : 'teoria';

    try {
      const sessionRef = doc(collection(db, `users/${user.uid}/sessions`));
      await setDoc(sessionRef, {
        userId: user.uid,
        subjectId,
        subjectName: subDoc.name,
        durationMinutes: normalizedMinutes,
        type: sessionType,
        timestamp: serverTimestamp()
      });

      try {
        await updateDoc(doc(db, `users/${user.uid}/subjects`, subjectId), {
          totalHours: (subDoc.totalHours || 0) + (normalizedMinutes / 60),
          lastStudied: serverTimestamp()
        });
      } catch (error) {
        console.error('Error updating subject stats after manual session:', error);
      }

      toast.success(`${normalizedMinutes} min de estudo registrados.`);
      return true;
    } catch (err) {
      console.error('Error recording manual study session:', err);
      toast.error('Não foi possível registrar o estudo. Verifique sua conexão e tente novamente.');
      return false;
    }
  };

  const deleteStudySession = async (session: Session) => {
    if (!user) return false;
    if (!session?.id) return false;

    const normalizedMinutes = Math.max(0, Math.floor(session.durationMinutes || 0));
    const subDoc = subjects.find(s => s.id === session.subjectId);

    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, `users/${user.uid}/sessions`, session.id));

      if (subDoc) {
        const nextTotalHours = Math.max(0, (subDoc.totalHours || 0) - (normalizedMinutes / 60));
        batch.update(doc(db, `users/${user.uid}/subjects`, session.subjectId), {
          totalHours: nextTotalHours
        });
      }

      await batch.commit();
      toast.success('Sessão removida do histórico.');
      return true;
    } catch (err) {
      console.error('Error deleting study session:', err);
      toast.error('Não foi possível excluir a sessão. Verifique sua conexão e tente novamente.');
      return false;
    }
  };

  const updateCycleSettings = async (updates: Record<string, unknown>) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    const allowedUpdates: Record<string, unknown> = {};

    if (isFiniteNumber(updates.dailyTimeMinutes)) {
      allowedUpdates.dailyTimeMinutes = Math.max(30, Math.round(updates.dailyTimeMinutes));
    }

    if (isFiniteNumber(updates.dailyTimeMaxMinutes)) {
      allowedUpdates.dailyTimeMaxMinutes = Math.max(60, Math.round(updates.dailyTimeMaxMinutes));
    }

    if (isFiniteNumber(updates.blocksPerDay)) {
      allowedUpdates.blocksPerDay = Math.max(1, Math.round(updates.blocksPerDay));
    }

    if (isFiniteNumber(updates.blockDurationMinutes)) {
      allowedUpdates.blockDurationMinutes = Math.max(1, Math.round(updates.blockDurationMinutes));
    }

    if (
      typeof updates.cycleFocus === 'string' &&
      allowedCycleFocuses.includes(updates.cycleFocus as typeof allowedCycleFocuses[number])
    ) {
      allowedUpdates.cycleFocus = updates.cycleFocus;
    }

    if (
      typeof updates.cycleAutonomy === 'string' &&
      allowedCycleAutonomies.includes(updates.cycleAutonomy as typeof allowedCycleAutonomies[number])
    ) {
      allowedUpdates.cycleAutonomy = updates.cycleAutonomy;
    }

    if (isFiniteNumber(updates.currentCycleIndex)) {
      allowedUpdates.currentCycleIndex = Math.max(0, Math.round(updates.currentCycleIndex));
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), allowedUpdates);
    } catch (error) {
      console.error("Error updating cycle settings:", error);
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const addCalendarTask = async (task: Omit<CalendarTask, 'id' | 'userId' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return false;
    const trimmedTitle = task.title.trim();
    const trimmedNotes = task.notes?.trim() || '';
    if (!trimmedTitle) {
      toast.warning('Informe o título da tarefa antes de salvar.');
      return false;
    }
    if (trimmedTitle.length > MAX_CALENDAR_TITLE_LENGTH) {
      toast.warning(`O título da tarefa deve ter no máximo ${MAX_CALENDAR_TITLE_LENGTH} caracteres.`);
      return false;
    }
    if (trimmedNotes.length > MAX_CALENDAR_NOTES_LENGTH) {
      toast.warning(`A observação deve ter no máximo ${MAX_CALENDAR_NOTES_LENGTH} caracteres.`);
      return false;
    }
    if (!allowedCalendarCategories.includes(task.category)) {
      toast.warning('Selecione uma categoria válida para a tarefa.');
      return false;
    }

    const path = `users/${user.uid}/calendarTasks`;
    try {
      await withWriteTimeout(addDoc(collection(db, path), {
        userId: user.uid,
        title: trimmedTitle,
        date: task.date,
        time: task.time || '',
        category: task.category,
        notes: trimmedNotes,
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }), 'Tempo limite excedido ao salvar a tarefa no calendário.');
      toast.success('Tarefa adicionada ao calendário.');
      return true;
    } catch (err) {
      console.error('Error adding calendar task:', err);
      toast.error('Não foi possível salvar a tarefa. Verifique sua conexão e tente novamente.');
      return false;
    }
  };

  const updateCalendarTask = async (id: string, updates: Partial<CalendarTask>) => {
    if (!user || !id) return false;
    const path = `users/${user.uid}/calendarTasks/${id}`;
    const allowedUpdates: Partial<CalendarTask> = {};

    if (typeof updates.title === 'string') {
      const trimmedTitle = updates.title.trim();
      if (!trimmedTitle) {
        toast.warning('O título da tarefa não pode ficar vazio.');
        return false;
      }
      if (trimmedTitle.length > MAX_CALENDAR_TITLE_LENGTH) {
        toast.warning(`O título da tarefa deve ter no máximo ${MAX_CALENDAR_TITLE_LENGTH} caracteres.`);
        return false;
      }
      allowedUpdates.title = trimmedTitle;
    }

    if (typeof updates.date === 'string') {
      allowedUpdates.date = updates.date;
    }

    if (typeof updates.time === 'string') {
      allowedUpdates.time = updates.time;
    }

    if (
      typeof updates.category === 'string' &&
      allowedCalendarCategories.includes(updates.category as CalendarTask['category'])
    ) {
      allowedUpdates.category = updates.category as CalendarTask['category'];
    }

    if (typeof updates.notes === 'string') {
      const trimmedNotes = updates.notes.trim();
      if (trimmedNotes.length > MAX_CALENDAR_NOTES_LENGTH) {
        toast.warning(`A observação deve ter no máximo ${MAX_CALENDAR_NOTES_LENGTH} caracteres.`);
        return false;
      }
      allowedUpdates.notes = trimmedNotes;
    }

    if (typeof updates.completed === 'boolean') {
      allowedUpdates.completed = updates.completed;
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return false;
    }

    try {
      await withWriteTimeout(updateDoc(doc(db, path), {
        ...allowedUpdates,
        updatedAt: serverTimestamp()
      }), 'Tempo limite excedido ao atualizar a tarefa no calendário.');
      toast.success('Tarefa atualizada.');
      return true;
    } catch (err) {
      console.error('Error updating calendar task:', err);
      toast.error('Não foi possível atualizar a tarefa. Verifique sua conexão e tente novamente.');
      return false;
    }
  };

  const deleteCalendarTask = async (id: string) => {
    if (!user || !id) return false;
    const path = `users/${user.uid}/calendarTasks/${id}`;
    try {
      await withWriteTimeout(deleteDoc(doc(db, path)), 'Tempo limite excedido ao excluir a tarefa do calendário.');
      toast.success('Tarefa excluída do calendário.');
      return true;
    } catch (err) {
      console.error('Error deleting calendar task:', err);
      toast.error('Não foi possível excluir a tarefa. Verifique sua conexão e tente novamente.');
      return false;
    }
  };

  const completeOnboarding = async (data: { level: string, hours: number, subjects: string[] }) => {
    if (!user) return;
    setIsGenerating(true);
    try {
      const today = getTodayLocalDate();
      const dailyTimeMinutes = data.hours * 60;
      const blocksPerDay = data.hours >= 4 ? 4 : 2;
      const normalizedSubjects = data.subjects
        .map((subject) => subject.trim())
        .filter(Boolean)
        .filter((subject, index, all) => all.findIndex((item) => item.toLowerCase() === subject.toLowerCase()) === index);

      if (normalizedSubjects.length === 0) {
        toast.warning('Selecione ao menos uma disciplina para concluir o cadastro inicial.');
        return false;
      }

      const subLevel = data.level === 'iniciante' ? 'Iniciante' : 'Intermediário';
      const userRef = doc(db, 'users', user.uid);
      const batch = writeBatch(db);

      // 1. Create/Update Profile base without completing onboarding yet.
      batch.set(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        studentLevel: data.level,
        dailyTimeMinutes: dailyTimeMinutes,
        blocksPerDay: blocksPerDay,
        onboardingCompleted: false,
        createdAt: serverTimestamp(),
        accentColor: 'green',
        area: 'administrativa', // Default area
        currentCycleIndex: 0
      }, { merge: true });

      // 2. Prepare subjects and collect their generated ids before persisting.
      const addedSubjects: { id: string, name: string, studentLevel: string }[] = [];
      const subjectsCollection = collection(db, `users/${user.uid}/subjects`);
      for (let i = 0; i < normalizedSubjects.length; i++) {
        const name = normalizedSubjects[i];
        const subjectRef = doc(subjectsCollection);
        batch.set(subjectRef, {
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
          lastStudied: null,
          completedTopics: 0,
          totalTopics: 0,
          progressPercent: 0
        });
        addedSubjects.push({ id: subjectRef.id, name, studentLevel: subLevel });
      }

      // 3. Prepare initial cycle and today's plan.
      if (addedSubjects.length > 0) {
        const duration = Math.round(dailyTimeMinutes / blocksPerDay);
        const cycleCollection = collection(db, `users/${user.uid}/cycleBlocks`);
        const dailyCollection = collection(db, `users/${user.uid}/dailyBlocks`);
        for (let i = 0; i < blocksPerDay; i++) {
          const subject = addedSubjects[i % addedSubjects.length];
          const type = i % 2 === 0 ? 'teoria' : 'questoes';
          
          batch.set(doc(cycleCollection), {
            subjectId: subject.id,
            subjectName: subject.name,
            type,
            durationMinutes: duration,
            order: i,
            difficulty: subject.studentLevel === 'Iniciante' ? 'facil' : 'media'
          });

          // 4. Also add it to today's plan.
          batch.set(doc(dailyCollection), {
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

      // 5. Mark onboarding complete only after all dependent writes are ready.
      batch.set(userRef, {
        onboardingCompleted: true
      }, { merge: true });

      await batch.commit();
      toast.success('Cadastro inicial concluído. Seu plano já está pronto.');
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
    saveCycleDayBlocks,
    generateCycle,
    addDailyBlock,
    updateDailyBlock,
    deleteDailyBlock,
    saveError,
    rateErrorReview,
    deleteError,
    clearAllErrors,
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
    updateAccentColorPreference,
    fetchMentorAdvice,
    generateDailyPlan,
    finishStudySession,
    recordManualStudySession,
    deleteStudySession,
    updateCycleSettings,
    addCalendarTask,
    updateCalendarTask,
    deleteCalendarTask,
    completeOnboarding
  };
}
