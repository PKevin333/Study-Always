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
        "group relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200",
        active
          ? "bg-brand-primary/10 text-brand-primary"
          : "text-text-secondary hover:bg-[var(--surface-muted)] hover:text-text-primary"
      )}
    >
      {active ? <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-brand-primary" aria-hidden="true" /> : null}
      <span className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
        active
          ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/20"
          : "bg-[var(--surface-muted)] text-text-secondary group-hover:bg-brand-primary/10 group-hover:text-brand-primary"
      )}>
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">{label}</span>
      {badge && (
        <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-primary">
          {badge}
        </span>
      )}
    </button>
  );
}
