import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, History } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Subject, StudyError } from '../../types';

interface ErrorsTabProps {
  errorSubject: string;
  setErrorSubject: (id: string) => void;
  errorText: string;
  setErrorText: (text: string) => void;
  handleSaveError: () => void;
  savingError: boolean;
  subjects: Subject[];
  errors: StudyError[];
  deleteError: (id: string) => void;
  updateError: (id: string, updates: Partial<StudyError>) => void;
  rateErrorReview: (id: string, rating: 'dificil' | 'ok' | 'facil') => void;
}

export function ErrorsTab({
  errorSubject,
  setErrorSubject,
  errorText,
  setErrorText,
  handleSaveError,
  savingError,
  subjects,
  errors,
  deleteError,
  rateErrorReview
}: ErrorsTabProps) {
  const [filter, setFilter] = React.useState<'todos' | 'hoje'>('todos');

  const filteredErrors = React.useMemo(() => {
    if (filter === 'todos') return errors;
    
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    
    return errors.filter(error => {
      const reviewDate = error.proximaRevisao?.toDate 
        ? error.proximaRevisao.toDate() 
        : error.nextReview?.toDate 
          ? error.nextReview.toDate() 
          : new Date(error.nextReview || error.createdAt);
      
      return reviewDate <= now;
    });
  }, [errors, filter]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }} 
      key="errors"
      className="pb-20"
    >
      <header className="mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Caderno de Erros</h2>
        <p className="text-text-secondary text-sm sm:text-base">Registre seus erros para revisão inteligente e prática espaçada.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold mb-4">Novo Registro de Erro</h3>
            <div className="space-y-4">
              <select 
                value={errorSubject}
                onChange={(e) => setErrorSubject(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-brand-primary"
              >
                <option value="">Selecione a Disciplina</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <textarea 
                value={errorText}
                onChange={(e) => setErrorText(e.target.value)}
                placeholder="O que você errou? (Seja objetivo, use bullets)" 
                className="w-full h-32 bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-brand-primary resize-none"
              />
              <button 
                onClick={handleSaveError}
                disabled={savingError || !errorText || !errorSubject}
                className="w-full bg-brand-primary text-white font-bold py-3 rounded-xl hover:bg-brand-primary/80 transition-all disabled:opacity-50"
              >
                {savingError ? 'Salvando...' : 'Salvar no Caderno'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold">Erros Registrados</h3>
              <div className="flex bg-background border border-border rounded-lg p-1">
                <button 
                  onClick={() => setFilter('todos')}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded-md transition-all",
                    filter === 'todos' ? "bg-brand-primary text-white" : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  Todos
                </button>
                <button 
                  onClick={() => setFilter('hoje')}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1",
                    filter === 'hoje' ? "bg-brand-primary text-white" : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  <History size={12} /> Revisar Hoje
                </button>
              </div>
            </div>

            {filteredErrors.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border border-dashed rounded-2xl text-text-secondary">
                {filter === 'hoje' ? 'Nenhuma revisão pendente para hoje!' : 'Nenhum erro registrado ainda.'}
              </div>
            ) : (
              filteredErrors.map(error => (
                <div key={error.id} className="bg-card border border-border rounded-2xl p-6 transition-all hover:border-brand-primary/30 group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-brand-primary/10 text-brand-primary uppercase">
                        {error.subjectName}
                      </span>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="text-[10px] text-text-secondary">
                          Criado: {error.createdAt?.toDate ? error.createdAt.toDate().toLocaleDateString('pt-BR') : new Date(error.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                        {error.proximaRevisao && (
                          <div className="text-[10px] text-brand-primary font-bold">
                            Próxima Revisão: {error.proximaRevisao?.toDate ? error.proximaRevisao.toDate().toLocaleDateString('pt-BR') : new Date(error.proximaRevisao).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteError(error.id)}
                      className="p-2 text-text-secondary hover:text-brand-red opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap mb-6">
                    {error.content}
                  </p>

                  <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Avaliar desempenho:</span>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => rateErrorReview(error.id, 'dificil')}
                        className="flex-1 sm:flex-none px-3 py-2 bg-brand-red/10 text-brand-red hover:bg-brand-red text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1"
                        title="Difícil: Revisar amanhã"
                      >
                        😓 Difícil
                      </button>
                      <button 
                        onClick={() => rateErrorReview(error.id, 'ok')}
                        className="flex-1 sm:flex-none px-3 py-2 bg-brand-orange/10 text-brand-orange hover:bg-brand-orange text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1"
                        title="Ok: Revisão em dobro"
                      >
                        😐 Ok
                      </button>
                      <button 
                        onClick={() => rateErrorReview(error.id, 'facil')}
                        className="flex-1 sm:flex-none px-3 py-2 bg-brand-green/10 text-brand-green hover:bg-brand-green text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1"
                        title="Fácil: Revisão espaçada"
                      >
                        😊 Fácil
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-3xl p-6">
            <h4 className="font-bold text-brand-primary mb-2">Dica do Mentor</h4>
            <p className="text-xs text-brand-primary/80 leading-relaxed">
              Não copie o enunciado da questão. Foque em anotar o <strong>porquê</strong> você errou e qual a <strong>regra/conceito</strong> que você esqueceu. O objetivo é que você consiga revisar este erro em menos de 30 segundos.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
