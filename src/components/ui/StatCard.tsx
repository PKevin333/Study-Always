import React from 'react';
import { cn } from '../../lib/utils';
import { designTokens } from '../../styles/designTokens';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  color?: 'green' | 'blue' | 'orange' | 'yellow' | 'red' | 'purple';
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
    purple: "text-white bg-white/15",
  };

  if (variant === 'compact') {
    const toneClass = {
      green: 'text-brand-green bg-brand-green/5 border-brand-green/10',
      blue: 'text-brand-blue bg-brand-blue/5 border-brand-blue/10',
      orange: 'text-brand-orange bg-brand-orange/5 border-brand-orange/10',
      yellow: 'text-brand-yellow bg-brand-yellow/5 border-brand-yellow/10',
      red: 'text-brand-red bg-brand-red/5 border-brand-red/10',
      purple: 'text-purple-500 bg-purple-500/5 border-purple-500/10'
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
    <div className={cn(
      "group relative min-h-36 overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-shadow duration-200 hover:shadow-[var(--shadow-surface)]"
    )}>
      <div className="relative z-10 mb-5 flex items-start justify-between">
        <div className="absolute -right-2 -top-2 text-neutral-200 transition-transform duration-300 group-hover:scale-105 [html[data-theme=dark]_&]:text-neutral-800">
          {React.cloneElement(icon as React.ReactElement, { 
            size: 72,
            className: 'text-current'
          })}
        </div>
        {trend && (
          <span className="relative z-10 ml-auto rounded-md bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-600 [html[data-theme=dark]_&]:bg-neutral-800 [html[data-theme=dark]_&]:text-neutral-300">
            {trend}
          </span>
        )}
      </div>
      <div className="relative z-10 mb-2 truncate text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</div>
      <div className={cn(
        "relative z-10 truncate font-editorial text-4xl font-semibold leading-none tracking-[-0.025em] text-text-primary tabular-nums",
        color === 'blue' && 'text-brand-primary'
      )}>{value}</div>
    </div>
  );
}
