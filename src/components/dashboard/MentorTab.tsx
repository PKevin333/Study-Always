import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Sparkles, AlertCircle } from 'lucide-react';

interface MentorTabProps {
  fetchMentorAdvice: () => void;
  loadingAdvice: boolean;
  mentorAdvice: { title: string, content: string, actionPoints: string[] } | null;
}

export function MentorTab({
  fetchMentorAdvice,
  loadingAdvice,
  mentorAdvice
}: MentorTabProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }} 
      key="mentor" 
      className="max-w-4xl mx-auto pb-20"
    >
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Mentor Estratégico</h2>
          <p className="text-text-secondary text-sm sm:text-base">Análise personalizada da sua preparação com base em dados reais.</p>
        </div>
        <button 
          onClick={fetchMentorAdvice}
          disabled={loadingAdvice}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl hover:border-brand-primary transition-all disabled:opacity-50 w-full sm:w-auto justify-center"
        >
          <RotateCcw size={16} className={loadingAdvice ? "animate-spin" : ""} />
          <span className="text-sm font-medium">Nova Análise</span>
        </button>
      </header>

      {loadingAdvice ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Sparkles className="text-brand-primary w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">Analisando seu desempenho...</h3>
          <p className="text-text-secondary">O mentor está revisando suas métricas e traçando sua estratégia.</p>
        </div>
      ) : mentorAdvice ? (
        <div className="space-y-8">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sparkles size={120} className="text-brand-primary" />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold mb-6 uppercase tracking-wider">
                Orientação Estratégica
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-6 text-white leading-tight">{mentorAdvice.title}</h3>
              <div className="text-base sm:text-lg text-text-secondary leading-relaxed mb-10 whitespace-pre-wrap">
                {mentorAdvice.content}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mentorAdvice.actionPoints.map((point, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 hover:border-brand-primary/30 transition-all">
                <div className="w-8 h-8 bg-brand-primary text-white rounded-lg flex items-center justify-center font-bold mb-4">
                  {i + 1}
                </div>
                <p className="text-sm font-medium leading-relaxed">{point}</p>
              </div>
            ))}
          </div>

          <div className="bg-brand-yellow/5 border border-brand-yellow/20 rounded-2xl p-6 flex gap-4 items-start">
            <AlertCircle className="text-brand-yellow shrink-0" size={20} />
            <p className="text-sm text-brand-yellow/90">
              <strong>Nota do Mentor:</strong> Esta análise é baseada exclusivamente nos seus dados de estudo. A constância é o único caminho real para a aprovação. Não pule etapas.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl p-12 text-center">
          <p className="text-text-secondary">Inicie seus estudos para que o mentor possa analisar sua evolução.</p>
        </div>
      )}
    </motion.div>
  );
}
