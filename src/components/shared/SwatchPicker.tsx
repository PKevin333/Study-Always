import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { designTokens } from '../../styles/designTokens';

export interface SwatchOption<T extends string> {
  value: T;
  label: string;
  fill?: string;
  swatchClassName?: string;
  iconColor?: string;
}

interface SwatchPickerProps<T extends string> {
  options: SwatchOption<T>[];
  value: T;
  onChange: (value: T) => void;
  showLabels?: boolean;
}

export function SwatchPicker<T extends string>({
  options,
  value,
  onChange,
  showLabels = true
}: SwatchPickerProps<T>) {
  return (
    <div className={cn('flex flex-wrap', showLabels ? 'gap-6' : 'gap-3')}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn('group flex flex-col items-center', showLabels ? 'gap-3' : 'gap-0')}
            title={option.label}
            aria-label={option.label}
          >
            <span
              className={cn(
                designTokens.swatch,
                'shadow-lg',
                option.swatchClassName,
                selected ? 'scale-110 ring-2 ring-offset-2 ring-offset-background' : 'opacity-70 hover:scale-105 hover:opacity-100'
              )}
              style={option.fill ? { backgroundColor: option.fill, borderColor: option.fill } : undefined}
            >
              {selected && <Check size={20} style={option.iconColor ? { color: option.iconColor } : undefined} />}
            </span>
            {showLabels && (
              <span className={cn('text-xs font-bold transition-colors', selected ? 'text-brand-primary' : 'text-text-secondary')}>
                {option.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
