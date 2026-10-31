import React from 'react';
import { Target, X, Menu } from 'lucide-react';
import { designTokens } from '../../styles/designTokens';

interface MobileHeaderProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export function MobileHeader({ isMobileMenuOpen, setIsMobileMenuOpen }: MobileHeaderProps) {
  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur-xl lg:hidden">
      <div className="flex items-center gap-2">
        <div className={`${designTokens.brandMark} bg-brand-primary shadow-lg shadow-brand-primary/20`}>
          <Target className={`text-white ${designTokens.brandMarkIcon}`} />
        </div>
        <div>
          <span className="block text-lg font-black leading-none tracking-tight">Study Always</span>
          <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.18em] text-text-secondary">Seu plano de estudos</span>
        </div>
      </div>
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="rounded-xl border border-border bg-[var(--surface-muted)] p-2 transition-colors hover:border-brand-primary/40 hover:text-brand-primary"
        aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>
  );
}
