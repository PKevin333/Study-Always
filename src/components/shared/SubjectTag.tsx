import React from 'react';
import { cn } from '../../lib/utils';

interface SubjectTagProps {
  subjectName: string;
  color?: string;
  size?: 'sm' | 'md';
}

const FALLBACK_COLOR = '#94a3b8';
const MONO_VARIANTS = ['circle', 'square', 'diamond', 'ring'] as const;

const getIdentityVariant = (subjectName: string, color?: string) => {
  const seed = `${subjectName}:${color || FALLBACK_COLOR}`;
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return MONO_VARIANTS[hash % MONO_VARIANTS.length];
};

export function SubjectIdentityMark({
  subjectName,
  color,
  size = 'md'
}: SubjectTagProps) {
  const variant = getIdentityVariant(subjectName, color);

  return (
    <span
      className={cn(
        'flex-shrink-0 rounded-full',
        size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5',
        '[html[data-theme=bw]_&]:bg-black [html[data-theme=bw]_&]:border [html[data-theme=bw]_&]:border-black',
        variant === 'square' && '[html[data-theme=bw]_&]:rounded-[2px]',
        variant === 'diamond' && '[html[data-theme=bw]_&]:rounded-[2px] [html[data-theme=bw]_&]:rotate-45',
        variant === 'ring' && '[html[data-theme=bw]_&]:bg-transparent [html[data-theme=bw]_&]:border-2'
      )}
      style={{ backgroundColor: color || FALLBACK_COLOR }}
      aria-hidden="true"
    />
  );
}

export function SubjectTag({ subjectName, color, size = 'md' }: SubjectTagProps) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <SubjectIdentityMark subjectName={subjectName} color={color} size={size} />
      <span
        className={cn(
          'truncate font-medium text-text-primary',
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}
      >
        {subjectName}
      </span>
    </span>
  );
}
