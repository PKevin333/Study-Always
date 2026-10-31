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
      "group relative min-h-32 overflow-hidden rounded-lg p-5 text-white shadow-md transition-transform duration-200 hover:-translate-y-0.5",
      color === 'blue' && 'bg-gradient-to-br from-blue-500 to-cyan-500',
      color === 'orange' && 'bg-gradient-to-br from-amber-400 to-orange-500',
      color === 'green' && 'bg-gradient-to-br from-emerald-500 to-teal-500',
      color === 'yellow' && 'bg-gradient-to-br from-yellow-400 to-amber-500',
      color === 'red' && 'bg-gradient-to-br from-rose-500 to-red-500',
      color === 'purple' && 'bg-gradient-to-br from-violet-500 to-indigo-500'
    )}>
      <div className="relative z-10 mb-5 flex items-start justify-between">
        <div className="absolute -bottom-16 -right-4 text-white/25 transition-transform duration-300 group-hover:scale-105">
          {React.cloneElement(icon as React.ReactElement, { 
            size: 88,
            className: 'text-current'
          })}
        </div>
        {trend && (
          <span className="ml-auto rounded bg-white/15 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            {trend}
          </span>
        )}
      </div>
      <div className="relative z-10 mb-2 truncate text-xs font-bold text-white/85">{label}</div>
      <div className="relative z-10 truncate text-3xl font-black tracking-tight text-white">{value}</div>
    </div>
  );
}
