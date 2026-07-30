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
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200",
        active
          ? "bg-brand-primary text-white"
          : "text-text-secondary hover:text-text-primary hover:bg-border/30"
      )}
    >
      <span className="shrink-0 text-current">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">{label}</span>
      {badge && !active && (
        <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-primary">
          {badge}
        </span>
      )}
    </button>
  );
}
