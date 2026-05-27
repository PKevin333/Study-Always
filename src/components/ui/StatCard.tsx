import React from 'react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  color: 'green' | 'blue' | 'orange' | 'yellow' | 'red';
}

export function StatCard({ icon, label, value, trend, color }: StatCardProps) {
  const colorClasses = {
    green: "text-brand-primary bg-brand-primary/10",
    blue: "text-brand-blue bg-brand-blue/10",
    orange: "text-brand-orange bg-brand-orange/10",
    yellow: "text-brand-yellow bg-brand-yellow/10",
    red: "text-brand-red bg-brand-red/10",
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 hover:border-brand-primary/30 transition-colors group">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="p-1.5 sm:p-2 bg-background rounded-lg group-hover:bg-opacity-80 transition-colors">
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
      <div className="text-[10px] sm:text-sm text-text-secondary mb-1 truncate">{label}</div>
      <div className="text-lg sm:text-2xl font-bold truncate">{value}</div>
    </div>
  );
}
