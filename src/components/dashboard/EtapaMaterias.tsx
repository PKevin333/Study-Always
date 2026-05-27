import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Pencil, X, CheckCircle2, ChevronRight } from 'lucide-react';
import { Materia } from '../../types';
import { cn } from '../../lib/utils';

export const MATERIAS_BASE = [
  { id: 'base-1', nome: 'Português' },
  { id: 'base-2', nome: 'Direito Administrativo' },
  { id: 'base-3', nome: 'Direito Constitucional' },
  { id: 'base-4', nome: 'Raciocínio Lógico' },
  { id: 'base-5', nome: 'Informática' }
];

interface EtapaMateriasProps {
  onConfirmar: (materias: Omit<Materia, 'id' | 'criadaEm'>[]) => void;
}

export function EtapaMaterias({ onConfirmar }: EtapaMateriasProps) {
  const [modo, setModo] = useState<'base' | 'custom'>('base');
  const [selecionadasBase, setSelecionadasBase] = useState<string[]>(MATERIAS_BASE.map(m => m.id));
  const [materiasCustom, setMateriasCustom] = useState<string[]>([]);
  const [inputCustom, setInputCustom] = useState('');

  const toggleBase = (id: string) => {
    if (selecionadasBase.includes(id)) {
      setSelecionadasBase(selecionadasBase.filter(s => s !== id));
    } else {
      setSelecionadasBase([...selecionadasBase, id]);
    }
  };

  const handleAddCustom = (e?: React.FormEvent) => {
    e?.preventDefault();
    const name = inputCustom.trim();
    if (!name) return;
    if (materiasCustom.length >= 20) return;
    if (materiasCustom.find(m => m.toLowerCase() === name.toLowerCase())) {
        return; // evita duplicado
    }
    setMateriasCustom([...materiasCustom, name]);
    setInputCustom('');
  }

  const removeCustom = (name: string) => {
    setMateriasCustom(materiasCustom.filter(m => m !== name));
  }

  const canContinue = modo === 'base' ? selecionadasBase.length > 0 : materiasCustom.length > 0;

  const handleContinuar = () => {
    if (!canContinue) return;
    
    if (modo === 'base') {
      const result = selecionadasBase.map(id => {
        const base = MATERIAS_BASE.find(m => m.id === id)!;
        return {
           nome: base.nome,
           origem: 'base' as const,
           ativa: true
        };
      });
      onConfirmar(result);
    } else {
      const result = materiasCustom.map(nome => ({
         nome,
         origem: 'custom' as const,
         ativa: true
      }));
      onConfirmar(result);
    }
  }

  return (
    <div className="space-y-8 pb-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Disciplinas do Ciclo</h2>
        <p className="text-text-secondary">Escolha como deseja começar sua jornada de estudos.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setModo('base')}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all text-center",
            modo === 'base' 
              ? "border-brand-primary bg-brand-primary/5" 
              : "border-border bg-background hover:border-brand-primary/30"
          )}
        >
          <div className={cn("p-3 rounded-xl", modo === 'base' ? "bg-brand-primary/10 text-brand-primary" : "bg-card text-text-secondary")}>
             <BookOpen size={24} />
          </div>
          <div>
            <div className={cn("font-bold mb-1", modo === 'base' ? "text-brand-primary" : "text-text-primary")}>Usar matérias base</div>
            <div className="text-xs text-text-secondary">Matérias pré-definidas para concursos</div>
          </div>
        </button>

        <button
          onClick={() => setModo('custom')}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all text-center",
            modo === 'custom' 
              ? "border-brand-primary bg-brand-primary/5" 
              : "border-border bg-background hover:border-brand-primary/30"
          )}
        >
           <div className={cn("p-3 rounded-xl", modo === 'custom' ? "bg-brand-primary/10 text-brand-primary" : "bg-card text-text-secondary")}>
             <Pencil size={24} />
          </div>
          <div>
            <div className={cn("font-bold mb-1", modo === 'custom' ? "text-brand-primary" : "text-text-primary")}>Criar minhas matérias</div>
            <div className="text-xs text-text-secondary">Monte sua lista personalizada</div>
          </div>
        </button>
      </div>

      <div className="min-h-[220px]">
        <AnimatePresence mode="wait">
          {modo === 'base' ? (
            <motion.div
              key="base"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MATERIAS_BASE.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => toggleBase(m.id)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all",
                      selecionadasBase.includes(m.id) 
                        ? "bg-brand-primary/10 border-brand-primary" 
                        : "bg-background border-border hover:border-brand-primary/30"
                    )}
                  >
                    <span className={cn("font-bold", selecionadasBase.includes(m.id) ? "text-brand-primary" : "text-text-primary")}>
                      {m.nome}
                    </span>
                    {selecionadasBase.includes(m.id) && <CheckCircle2 size={18} className="text-brand-primary" />}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="custom"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <form onSubmit={handleAddCustom} className="flex gap-2">
                <input
                  type="text"
                  value={inputCustom}
                  onChange={(e) => setInputCustom(e.target.value)}
                  placeholder="Nome da matéria (ex: Informática)"
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
                />
                <button 
                  type="submit" 
                  disabled={!inputCustom.trim()}
                  className="bg-brand-primary text-white font-bold px-6 rounded-xl hover:bg-brand-primary/80 disabled:opacity-50 transition-colors"
                >
                  Adicionar
                </button>
              </form>
              
              <div className="space-y-2">
                <AnimatePresence>
                  {materiasCustom.map(mNome => (
                    <motion.div
                      key={mNome}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3"
                    >
                      <span className="font-bold text-text-primary">{mNome}</span>
                      <button 
                         onClick={() => removeCustom(mNome)}
                         className="text-text-secondary hover:text-red-500 transition-colors"
                      >
                         <X size={18} />
                      </button>
                    </motion.div>
                  ))}
                  {materiasCustom.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="text-center py-6 text-sm text-text-secondary"
                    >
                      Nenhuma matéria adicionada ainda.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {materiasCustom.length >= 20 && (
                <p className="text-xs text-red-500 text-center">Limite de 20 matérias atingido.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
         <button
            onClick={handleContinuar}
            disabled={!canContinue}
            className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-primary/80 transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
          >
            Continuar
            <ChevronRight size={20} />
          </button>
      </div>
    </div>
  );
}
