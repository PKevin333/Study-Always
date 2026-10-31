import React from 'react';
import { cn } from '../../lib/utils';
import { designTokens } from '../../styles/designTokens';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  color?: 'green' | 'blue' | 'orange' | 'yellow' | 'red';
  variant?: 'default' | 'compact';
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  color = 'green',
  variant = 'default'
}: StatCardProps) {
  const colorClasses = {
    green: "text-brand-primary bg-brand-primary/10",
    blue: "text-brand-blue bg-brand-blue/10",
    orange: "text-brand-orange bg-brand-orange/10",
    yellow: "text-brand-yellow bg-brand-yellow/10",
    red: "text-brand-red bg-brand-red/10",
  };

  if (variant === 'compact') {
    const toneClass = {
      green: 'text-brand-green bg-brand-green/5 border-brand-green/10',
      blue: 'text-brand-blue bg-brand-blue/5 border-brand-blue/10',
      orange: 'text-brand-orange bg-brand-orange/5 border-brand-orange/10',
      yellow: 'text-brand-yellow bg-brand-yellow/5 border-brand-yellow/10',
      red: 'text-brand-red bg-brand-red/5 border-brand-red/10'
    }[color];

    return (
      <div className={cn(`${designTokens.itemCardCompact} border`, toneClass)}>
        <div className="mb-3 flex items-center justify-between">
          <span className={designTokens.microBadge}>{label}</span>
          {icon}
        </div>
        <div className="text-2xl font-black text-text-primary">{value}</div>
      </div>
    );
  }

  return (
    <div className="group rounded-[1.5rem] border border-border bg-card p-4 shadow-[var(--app-shadow)] transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-primary/30 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-white">
          {React.cloneElement(icon as React.ReactElement, { 
            size: 18, 
            className: (icon as React.ReactElement).props.className + " sm:w-6 sm:h-6" 
          })}
        </div>
        {trend && (
          <span className={cn("text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full", colorClasses[color])}>
            {trend}
          </span>
        )}
      </div>
      <div className="mb-1 truncate text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">{label}</div>
      <div className="truncate text-2xl font-black tracking-tight text-text-primary sm:text-3xl">{value}</div>
    </div>
  );
}
