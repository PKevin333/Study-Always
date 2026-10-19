import { StudyError } from '../../types';

export const toErrorDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (typeof value === 'object' && value !== null && 'seconds' in value && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getErrorContent = (error: StudyError) => error.conteudo || error.content || '';
export const getErrorSubjectName = (error: StudyError) => error.disciplina || error.subjectName || 'Disciplina removida';
export const getErrorCreatedAt = (error: StudyError) => error.criadoEm || error.createdAt;
export const getErrorNextReview = (error: StudyError) => error.proximaRevisao || error.nextReview;

export const isErrorDueToday = (error: StudyError) => {
  const date = toErrorDate(getErrorNextReview(error) || getErrorCreatedAt(error));
  if (!date) return false;
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  return date <= todayEnd;
};

export const isErrorDominated = (error: StudyError) => Boolean(error.reviewed) && (error.nivel || 0) >= 4;

export const formatErrorDate = (value: unknown) => {
  const date = toErrorDate(value);
  return date ? new Intl.DateTimeFormat('pt-BR').format(date) : 'Sem data';
};
