import React from 'react';
import { cn } from '../../lib/utils';
import { designTokens } from '../../styles/designTokens';

export type StudyTypeBadgeValue =
  | 'teoria'
  | 'questoes'
  | 'revisao'
  | 'estudo'
  | 'simulado'
  | 'outro';

const labelMap: Record<StudyTypeBadgeValue, string> = {
  teoria: 'Teoria',
  questoes: 'Questões',
  revisao: 'Revisão',
  estudo: 'Estudo',
  simulado: 'Simulado',
  outro: 'Outro'
};

const toneMap: Record<StudyTypeBadgeValue, string> = {
  teoria: 'bg-brand-blue/10 text-brand-blue',
  questoes: 'bg-brand-primary/10 text-brand-primary',
  revisao: 'bg-brand-orange/10 text-brand-orange',
  estudo: 'bg-brand-blue/10 text-brand-blue',
  simulado: 'bg-brand-magenta/10 text-brand-magenta',
  outro: 'bg-border/40 text-text-secondary'
};

export const getStudyTypeBadgeLabel = (type: StudyTypeBadgeValue) => {
  return labelMap[type];
};

export const getStudyTypeBadgeClasses = (type: StudyTypeBadgeValue, className?: string) => {
  return cn(designTokens.microBadge, 'rounded px-2 py-0.5', toneMap[type], className);
};

interface StudyTypeBadgeProps {
  type: StudyTypeBadgeValue;
  className?: string;
  label?: string;
}

export function StudyTypeBadge({ type, className, label }: StudyTypeBadgeProps) {
  return (
    <span className={getStudyTypeBadgeClasses(type, className)}>
      {label || getStudyTypeBadgeLabel(type)}
    </span>
  );
}
