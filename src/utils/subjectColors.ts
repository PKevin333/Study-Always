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

const colorHexMap: Record<string, string> = {
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

export const getSubjectColorClass = (subject?: Pick<Subject, 'id' | 'color'> | null) => {
  return colorClassMap[getSubjectColorId(subject)];
};

export const getSubjectColorHex = (subject?: Pick<Subject, 'id' | 'color'> | null) => {
  if (subject?.color?.startsWith('#')) return subject.color;
  return colorHexMap[getSubjectColorId(subject)] || '#64748b';
};

export interface SubjectThemeColor {
  hex: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const SUBJECT_THEME_MAP: Record<string, SubjectThemeColor> = {
  // Raciocínio Lógico = violeta
  raciocinio_logico: {
    hex: '#8b5cf6',
    badgeBg: 'rgba(139, 92, 246, 0.15)',
    badgeText: '#c4b5fd',
    badgeBorder: 'rgba(139, 92, 246, 0.3)'
  },
  // Português = coral
  portugues: {
    hex: '#f87171',
    badgeBg: 'rgba(248, 113, 113, 0.15)',
    badgeText: '#fca5a5',
    badgeBorder: 'rgba(248, 113, 113, 0.3)'
  },
  // Química = verde-água
  quimica: {
    hex: '#14b8a6',
    badgeBg: 'rgba(20, 184, 166, 0.15)',
    badgeText: '#5eead4',
    badgeBorder: 'rgba(20, 184, 166, 0.3)'
  },
  // Física = âmbar
  fisica: {
    hex: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeText: '#fcd34d',
    badgeBorder: 'rgba(245, 158, 11, 0.3)'
  },
  // Informática = azul
  informatica: {
    hex: '#3b82f6',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
    badgeText: '#93c5fd',
    badgeBorder: 'rgba(59, 130, 246, 0.3)'
  },
  // Redação = rosa
  redacao: {
    hex: '#ec4899',
    badgeBg: 'rgba(236, 72, 153, 0.15)',
    badgeText: '#f472b6',
    badgeBorder: 'rgba(236, 72, 153, 0.3)'
  },
  // Disciplinas adicionais de concursos
  direito_constitucional: {
    hex: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeText: '#6ee7b7',
    badgeBorder: 'rgba(16, 185, 129, 0.3)'
  },
  direito_administrativo: {
    hex: '#6366f1',
    badgeBg: 'rgba(99, 102, 241, 0.15)',
    badgeText: '#a5b4fc',
    badgeBorder: 'rgba(99, 102, 241, 0.3)'
  },
  controle_externo: {
    hex: '#06b6d4',
    badgeBg: 'rgba(6, 182, 212, 0.15)',
    badgeText: '#67e8f9',
    badgeBorder: 'rgba(6, 182, 212, 0.3)'
  },
  afo: {
    hex: '#f97316',
    badgeBg: 'rgba(249, 115, 22, 0.15)',
    badgeText: '#fdba74',
    badgeBorder: 'rgba(249, 115, 22, 0.3)'
  }
};

const DEFAULT_THEME_PALETTE: SubjectThemeColor[] = [
  SUBJECT_THEME_MAP.raciocinio_logico,
  SUBJECT_THEME_MAP.portugues,
  SUBJECT_THEME_MAP.quimica,
  SUBJECT_THEME_MAP.fisica,
  SUBJECT_THEME_MAP.informatica,
  SUBJECT_THEME_MAP.redacao,
  SUBJECT_THEME_MAP.direito_constitucional,
  SUBJECT_THEME_MAP.direito_administrativo,
  SUBJECT_THEME_MAP.controle_externo,
  SUBJECT_THEME_MAP.afo
];

export const getSubjectThemeColor = (name?: string | null): SubjectThemeColor => {
  if (!name) return DEFAULT_THEME_PALETTE[0];
  const normalized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (
    normalized.includes('raciocinio') ||
    normalized.includes('logico') ||
    normalized.includes('rlm') ||
    normalized.includes('matematica')
  ) {
    return SUBJECT_THEME_MAP.raciocinio_logico;
  }
  if (
    normalized.includes('portugues') ||
    normalized.includes('lingua portuguesa') ||
    normalized.includes('gramatica')
  ) {
    return SUBJECT_THEME_MAP.portugues;
  }
  if (normalized.includes('quimica')) {
    return SUBJECT_THEME_MAP.quimica;
  }
  if (normalized.includes('fisica')) {
    return SUBJECT_THEME_MAP.fisica;
  }
  if (
    normalized.includes('informatica') ||
    normalized.includes('computacao') ||
    normalized.includes('tecnologia da informacao') ||
    normalized.includes('ti')
  ) {
    return SUBJECT_THEME_MAP.informatica;
  }
  if (normalized.includes('redacao') || normalized.includes('discursiva')) {
    return SUBJECT_THEME_MAP.redacao;
  }
  if (normalized.includes('constitucional')) {
    return SUBJECT_THEME_MAP.direito_constitucional;
  }
  if (normalized.includes('administrativo')) {
    return SUBJECT_THEME_MAP.direito_administrativo;
  }
  if (normalized.includes('controle') || normalized.includes('auditoria')) {
    return SUBJECT_THEME_MAP.controle_externo;
  }
  if (normalized.includes('afo') || normalized.includes('orcament') || normalized.includes('contabil')) {
    return SUBJECT_THEME_MAP.afo;
  }

  // Fallback determinístico pelo nome da matéria
  const hash = normalized.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DEFAULT_THEME_PALETTE[Math.abs(hash) % DEFAULT_THEME_PALETTE.length];
};
