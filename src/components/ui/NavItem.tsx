import React from 'react';
import { cn } from '../../lib/utils';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  onClick: () => void;
}

export function NavItem({ icon, label, active, badge, onClick }: NavItemProps) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "group w-full flex items-center gap-3 px-2.5 py-2 rounded-xl transition-all duration-200",
        active
          ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/20"
          : "text-text-secondary hover:text-text-primary hover:bg-border/30"
      )}
    >
      <span className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
        active
          ? "border-white/20 bg-white/15 text-white"
          : "border-border bg-card text-text-secondary group-hover:border-brand-primary/30 group-hover:bg-brand-primary/10 group-hover:text-brand-primary"
      )}>
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">{label}</span>
      {badge && !active && (
        <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-primary">
          {badge}
        </span>
      )}
    </button>
  );
}
