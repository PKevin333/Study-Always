import React from 'react';
import { cn } from '../../lib/utils';

interface SubjectTagProps {
  subjectName: string;
  color?: string;
  size?: 'sm' | 'md';
}

const FALLBACK_COLOR = '#94a3b8';

export function SubjectTag({ subjectName, color, size = 'md' }: SubjectTagProps) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span
        className={cn(
          'rounded-full flex-shrink-0',
          size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'
        )}
        style={{ backgroundColor: color || FALLBACK_COLOR }}
        aria-hidden="true"
      />
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
