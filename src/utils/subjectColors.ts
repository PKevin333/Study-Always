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

export const SUBJECT_NEUTRAL_COLOR = '#94a3b8';
const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const colorClassMap = SUBJECT_COLOR_OPTIONS.reduce<Record<string, string>>((acc, option) => {
  acc[option.id] = option.className;
  return acc;
}, {});

const colorHexMap: Record<SubjectColorId, string> = {
  purple: '#9333ea',
  blue: '#2563eb',
  red: '#dc2626',
  green: '#16a34a',
  yellow: '#facc15',
  gold: '#f59e0b',
  pink: '#db2777',
  teal: '#0d9488',
  indigo: '#4f46e5',
  orange: '#ea580c',
  cyan: '#06b6d4',
  slate: '#334155'
};

const legacyClassToColorIdMap = SUBJECT_COLOR_OPTIONS.reduce<Record<string, SubjectColorId>>((acc, option) => {
  acc[option.className] = option.id;
  return acc;
}, {});

const normalizeStoredSubjectColor = (color?: string | null): SubjectColorId | string | null => {
  if (!color) return null;

  const trimmedColor = color.trim();
  if (!trimmedColor) return null;

  if (trimmedColor in colorHexMap) {
    return trimmedColor as SubjectColorId;
  }

  if (trimmedColor in legacyClassToColorIdMap) {
    return legacyClassToColorIdMap[trimmedColor];
  }

  if (HEX_COLOR_REGEX.test(trimmedColor)) {
    return trimmedColor;
  }

  return null;
};

export const getSubjectColorId = (subject?: Pick<Subject, 'id' | 'color'> | null): SubjectColorId => {
  const normalizedColor = normalizeStoredSubjectColor(subject?.color);

  if (normalizedColor && normalizedColor in colorClassMap) {
    return normalizedColor as SubjectColorId;
  }

  if (!subject?.id) return 'purple';
  const index = subject.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % SUBJECT_COLOR_OPTIONS.length;
  return SUBJECT_COLOR_OPTIONS[index].id;
};

export const getSubjectColorClass = (subject?: Pick<Subject, 'id' | 'color'> | null) => {
  return colorClassMap[getSubjectColorId(subject)];
};

export const getSubjectColorHex = (subject?: Pick<Subject, 'color'> | null) => {
  const normalizedColor = normalizeStoredSubjectColor(subject?.color);

  if (!normalizedColor) {
    return SUBJECT_NEUTRAL_COLOR;
  }

  if (normalizedColor in colorHexMap) {
    return colorHexMap[normalizedColor as SubjectColorId];
  }

  if (HEX_COLOR_REGEX.test(normalizedColor)) {
    return normalizedColor;
  }

  return SUBJECT_NEUTRAL_COLOR;
};
