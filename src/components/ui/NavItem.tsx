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
        "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
        active
          ? "bg-brand-primary text-white"
          : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-white"
      )}
    >
      {active ? <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-brand-primary" aria-hidden="true" /> : null}
      <span className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all duration-200",
        active
          ? "bg-white/15 text-white"
          : "text-[var(--sidebar-muted)] group-hover:text-brand-primary"
      )}>
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">{label}</span>
      {badge && (
        <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
