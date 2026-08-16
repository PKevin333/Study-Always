import React from 'react';
import { Sparkles } from 'lucide-react';
import { designTokens } from '../../styles/designTokens';

interface MentorTipCalloutProps {
  title: string;
  children: React.ReactNode;
}

export function MentorTipCallout({ title, children }: MentorTipCalloutProps) {
  return (
    <div className={`${designTokens.sectionCardDense} border-brand-primary/20 bg-brand-primary/5`}>
      <h4 className="mb-2 flex items-center gap-2 font-bold text-brand-primary">
        <Sparkles size={18} />
        {title}
      </h4>
      <div className="text-sm leading-relaxed text-brand-primary/90">
        {children}
      </div>
    </div>
  );
}
