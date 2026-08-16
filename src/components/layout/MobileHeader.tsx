import React from 'react';
import { Target, X, Menu } from 'lucide-react';
import { designTokens } from '../../styles/designTokens';

interface MobileHeaderProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export function MobileHeader({ isMobileMenuOpen, setIsMobileMenuOpen }: MobileHeaderProps) {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-2">
        <div className={`${designTokens.brandMark} bg-brand-primary`}>
          <Target className={`text-white ${designTokens.brandMarkIcon}`} />
        </div>
        <span className="font-bold text-lg tracking-tight">Study Always</span>
      </div>
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="p-2 hover:bg-background rounded-xl transition-colors"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>
  );
}
