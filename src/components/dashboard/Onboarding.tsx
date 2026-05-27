import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  Zap, 
  CheckCircle2, 
  ChevronRight, 
  Target,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Subject } from '../../types';
import { EtapaMaterias } from './EtapaMaterias';

interface OnboardingProps {
  onComplete: (data: { level: string, hours: number, subjects: string[] }) => void;
  isGenerating: boolean;
}

const SUGGESTED_SUBJECTS = [
  "Português",
  "Direito Administrativo",
  "Direito Constitucional",
  "Raciocínio Lógico",
  "Informática"
];

export function Onboarding({ onComplete, isGenerating }: OnboardingProps) {
  const [step, setStep] = React.useState(1);
  const [level, setLevel] = React.useState('iniciante');
  const [hours, setHours] = React.useState(2);
  const [selectedSubjects, setSelectedSubjects] = React.useState<string[]>(SUGGESTED_SUBJECTS);

  const toggleSubject = (name: string) => {
    if (selectedSubjects.includes(name)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== name));
    } else {
      setSelectedSubjects([...selectedSubjects, name]);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete({ level, hours, subjects: selectedSubjects });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-md" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-card border border-border rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-background">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: `${(step / 3) * 100}%` }}
            className="h-full bg-brand-primary transition-all duration-500"
          />
        </div>

        <div className="p-8 sm:p-12">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-primary">
                    <Target size={32} />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Bem-vindo ao seu Mentor!</h2>
                  <p className="text-text-secondary">Vamos configurar sua base para começar com o pé direito.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Seu Nível Atual</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'iniciante', label: 'Iniciante', desc: 'Começando do zero' },
                        { id: 'intermediario', label: 'Intermediário', desc: 'Já tenho uma base' }
                      ].map((l) => (
                        <button
                          key={l.id}
                          onClick={() => setLevel(l.id)}
                          className={cn(
                            "flex flex-col items-start p-4 rounded-xl border transition-all text-left",
                            level === l.id 
                              ? "bg-brand-primary/10 border-brand-primary" 
                              : "bg-background border-border hover:border-brand-primary/30"
                          )}
                        >
                          <span className={cn("font-bold", level === l.id ? "text-brand-primary" : "text-text-primary")}>{l.label}</span>
                          <span className="text-xs text-text-secondary">{l.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Horas Disponíveis / Dia</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4, 6, 8].map((h) => (
                        <button
                          key={h}
                          onClick={() => setHours(h)}
                          className={cn(
                            "py-3 rounded-xl border font-bold transition-all",
                            hours === h 
                              ? "bg-brand-primary/10 border-brand-primary text-brand-primary" 
                              : "bg-background border-border text-text-secondary hover:border-brand-primary/30"
                          )}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                <EtapaMaterias 
                  onConfirmar={(materiasSetup) => {
                    // For now, we only support string[] in onComplete (legacy)
                    // The instruction said: onConfirmar vai entregar a lista para o onboarding pai salvar
                    // But wait, the instruction on part 2 says: "O componente não salva no Firebase — apenas monta e entrega a lista para o onboarding pai salvar."
                    // Let's store that structured array into Onboarding State so step 3/handleNext can use it.
                    setSelectedSubjects(materiasSetup as any); 
                    setStep(3);
                  }}
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-primary">
                    <Sparkles size={40} className="animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Tudo Pronto!</h2>
                  <p className="text-text-secondary">
                    Vou gerar seu ciclo de estudos e seu plano para hoje com base nas suas escolhas.
                  </p>
                </div>

                <div className="bg-background border border-border rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-text-secondary uppercase tracking-widest">Nível</div>
                      <div className="font-bold capitalize">{level}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                      <Clock size={20} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-text-secondary uppercase tracking-widest">Tempo Diário</div>
                      <div className="font-bold">{hours} horas ({selectedSubjects.length} matérias)</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

            {step !== 2 && (
              <div className="mt-12 flex justify-between items-center">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        step >= i ? "w-8 bg-brand-primary" : "w-2 bg-border"
                      )} 
                    />
                  ))}
                </div>
                
                <button
                  onClick={handleNext}
                  disabled={isGenerating}
                  className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-brand-primary/80 transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {step === 3 ? 'Começar Agora' : 'Próximo'}
                      <ChevronRight size={20} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
      </motion.div>
    </div>
  );
}
