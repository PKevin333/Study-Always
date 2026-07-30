import { Subject } from '../types';

export const SUBJECT_COLOR_OPTIONS = [
  { id: 'purple', label: 'Roxo', className: 'bg-purple-600 text-white' },
  { id: 'blue', label: 'Azul', className: 'bg-blue-600 text-white' },
  { id: 'red', label: 'Vermelho', className: 'bg-red-600 text-white' },
  { id: 'green', label: 'Verde', className: 'bg-green-600 text-white' },
  { id: 'yellow', label: 'Amarelo', className: 'bg-yellow-400 text-slate-950' },
  { id: 'gold', label: 'Dourado', className: 'bg-amber-500 text-slate-950' },
  { id: 'pink', label: 'Rosa', className: 'bg-pink-600 text-white' },
  { id: 'teal', label: 'Teal', className: 'bg-teal-600 text-white' },
  { id: 'indigo', label: 'Índigo', className: 'bg-indigo-600 text-white' },
  { id: 'orange', label: 'Laranja', className: 'bg-orange-600 text-white' },
  { id: 'cyan', label: 'Ciano', className: 'bg-cyan-500 text-slate-950' },
  { id: 'slate', label: 'Grafite', className: 'bg-slate-700 text-white' }
] as const;

export type SubjectColorId = typeof SUBJECT_COLOR_OPTIONS[number]['id'];

const colorClassMap = SUBJECT_COLOR_OPTIONS.reduce<Record<string, string>>((acc, option) => {
  acc[option.id] = option.className;
  return acc;
}, {});

const bwOverride = '[html[data-theme=bw]_&]:bg-card [html[data-theme=bw]_&]:text-text-primary [html[data-theme=bw]_&]:border-border';

export const getSubjectColorId = (subject?: Pick<Subject, 'id' | 'color'> | null): SubjectColorId => {
  if (subject?.color && colorClassMap[subject.color]) {
    return subject.color as SubjectColorId;
  }

  if (!subject?.id) return 'purple';
  const index = subject.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % SUBJECT_COLOR_OPTIONS.length;
  return SUBJECT_COLOR_OPTIONS[index].id;
};

export const getSubjectBadgeClass = (subject?: Pick<Subject, 'id' | 'color'> | null) => {
  return `${colorClassMap[getSubjectColorId(subject)]} ${bwOverride}`;
};

