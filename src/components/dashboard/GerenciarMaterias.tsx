import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Materia } from '../../types';
import { useMaterias } from '../../hooks/useMaterias';

interface GerenciarMateriasProps {
  userId: string;
}

export function GerenciarMaterias({ userId }: GerenciarMateriasProps) {
  const { materias, loading, adicionarMateria, renomearMateria, toggleAtiva, excluirMateria } = useMaterias(userId);
  
  const [isAdding, setIsAdding] = useState(false);
  const [addInput, setAddInput] = useState('');
  
  // States for line-level interactions
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<{ id: string, msg: string } | null>(null);

  const materiasAtivasCount = materias.filter(m => m.ativa).length;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nome = addInput.trim();
    if (!nome) return;
    if (materias.length >= 20) {
      alert("Você atingiu o limite máximo de 20 matérias.");
      return;
    }
    if (materias.some(m => m.nome.toLowerCase() === nome.toLowerCase())) {
      alert("Esta matéria já existe.");
      return;
    }

    setProcessingId('add');
    try {
      await adicionarMateria(nome, 'custom');
      setAddInput('');
      setIsAdding(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao adicionar matéria.');
    } finally {
      setProcessingId(null);
    }
  };

  const startEditing = (m: Materia) => {
    setEditingId(m.id);
    setEditInput(m.nome);
    setDeletingId(null);
    setErrorMsg(null);
  };

  const handleEditSubmit = async (id: string) => {
    const novoNome = editInput.trim();
    if (!novoNome) {
      setEditingId(null);
      return;
    }
    
    // Check if changed
    const materia = materias.find(m => m.id === id);
    if (materia?.nome === novoNome) {
      setEditingId(null);
      return;
    }

    // Check duplicate
    if (materias.some(m => m.id !== id && m.nome.toLowerCase() === novoNome.toLowerCase())) {
      setErrorMsg({ id, msg: 'Nome duplicado' });
      return;
    }

    setProcessingId(id);
    setErrorMsg(null);
    try {
      await renomearMateria(id, novoNome);
      setEditingId(null);
    } catch (err: any) {
      setErrorMsg({ id, msg: 'Erro ao salvar' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggle = async (id: string, atualAtiva: boolean) => {
    setProcessingId(id);
    setErrorMsg(null);
    try {
      await toggleAtiva(id, !atualAtiva);
    } catch (err: any) {
      setErrorMsg({ id, msg: 'Erro ao alterar status' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    setProcessingId(id);
    setErrorMsg(null);
    try {
      await excluirMateria(id);
      setDeletingId(null);
    } catch (err: any) {
      setErrorMsg({ id, msg: 'Erro ao excluir' });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && materias.length === 0) {
    return (
      <div className="flex justify-center items-center py-10 text-brand-primary">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <section className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold">Minhas Matérias</h3>
          <p className="text-sm text-text-secondary">{materiasAtivasCount} matérias ativas</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          disabled={materias.length >= 20}
          className="bg-brand-primary text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-brand-primary/80 transition-colors shadow-lg shadow-brand-primary/20 disabled:opacity-50"
        >
          <Plus size={16} />
          Adicionar matéria
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-border bg-brand-primary/5"
          >
            <form onSubmit={handleAddSubmit} className="p-6 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                autoFocus
                placeholder="Nome da nova matéria"
                value={addInput}
                onChange={(e) => setAddInput(e.target.value)}
                disabled={processingId === 'add'}
                className="flex-1 bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-brand-primary transition-all"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setIsAdding(false); setAddInput(''); }}
                  disabled={processingId === 'add'}
                  className="px-4 py-3 rounded-xl border border-border bg-background hover:bg-border transition-colors font-bold text-text-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!addInput.trim() || processingId === 'add'}
                  className="px-6 py-3 rounded-xl bg-brand-primary text-white font-bold hover:bg-brand-primary/80 transition-colors shadow-md shadow-brand-primary/20 min-w-[120px] flex justify-center items-center"
                >
                  {processingId === 'add' ? <Loader2 size={20} className="animate-spin" /> : 'Adicionar'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6">
        {materias.length === 0 ? (
          <div className="text-center py-10 text-text-secondary">
            <p>Nenhuma matéria cadastrada.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {materias.map((materia) => {
              const isProcessing = processingId === materia.id;
              const isEditing = editingId === materia.id;
              const isDeleting = deletingId === materia.id;
              const hasError = errorMsg?.id === materia.id;

              return (
                <div key={materia.id} className="flex flex-col">
                  <div className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all gap-4",
                    materia.ativa ? "bg-background border-border" : "bg-background/50 border-border opacity-70",
                    (isEditing || isDeleting) && "border-brand-primary/50 bg-brand-primary/5"
                  )}>
                    
                    {/* LEFTSIDE: NOME E BADGE */}
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editInput}
                          onChange={(e) => setEditInput(e.target.value)}
                          disabled={isProcessing}
                          className="flex-1 bg-background border border-brand-primary rounded-lg px-3 py-2 outline-none w-full sm:w-auto"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSubmit(materia.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                      ) : (
                        <>
                          <span className={cn("font-bold truncate", !materia.ativa && "line-through text-text-secondary")}>
                            {materia.nome}
                          </span>
                          <span className={cn(
                            "text-[10px] uppercase font-bold px-2 py-1 rounded-full whitespace-nowrap",
                            materia.origem === 'base' ? "bg-gray-500/10 text-gray-400" : "bg-brand-blue/10 text-brand-blue"
                          )}>
                            {materia.origem}
                          </span>
                        </>
                      )}
                    </div>

                    {/* RIGHTSIDE: ACTIONS */}
                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                      
                      {isDeleting ? (
                        <div className="flex items-center gap-2 bg-brand-red/10 px-3 py-2 rounded-lg">
                          <span className="text-xs font-bold text-brand-red mr-2">Tem certeza?</span>
                          <button
                            onClick={() => setDeletingId(null)}
                            disabled={isProcessing}
                            className="p-1 text-text-secondary hover:bg-background rounded-md transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleDeleteConfirm(materia.id)}
                            disabled={isProcessing}
                            className="p-1 px-3 bg-brand-red text-white text-sm font-bold rounded-md hover:bg-red-600 transition-colors flex justify-center items-center h-7 min-w-[70px]"
                          >
                            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : 'Excluir'}
                          </button>
                        </div>
                      ) : isEditing ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingId(null)}
                            disabled={isProcessing}
                            className="p-2 text-text-secondary hover:bg-border rounded-lg transition-colors"
                          >
                            <X size={18} />
                          </button>
                          <button
                            onClick={() => handleEditSubmit(materia.id)}
                            disabled={isProcessing}
                            className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors flex items-center justify-center min-w-[34px]"
                          >
                            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(materia)}
                            disabled={isProcessing}
                            className="p-2 text-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
                            title="Editar nome"
                          >
                            <Pencil size={18} />
                          </button>
                          
                          {/* Trash - Only if custom, otherwise hidden */}
                          <div className={cn(materia.origem === 'base' && "invisible w-9")}>
                            <button
                              onClick={() => setDeletingId(materia.id)}
                              disabled={isProcessing}
                              className="p-2 text-text-secondary hover:text-brand-red hover:bg-brand-red/10 rounded-lg transition-colors"
                              title="Excluir matéria"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          
                          <div className="w-px h-6 bg-border mx-1"></div>

                          {/* Tailwind Toggle Switch */}
                          <button
                            onClick={() => handleToggle(materia.id, materia.ativa)}
                            disabled={isProcessing}
                            className={cn(
                              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                              materia.ativa ? "bg-brand-primary" : "bg-border",
                              isProcessing && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <span
                              className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                materia.ativa ? "translate-x-6" : "translate-x-1"
                              )}
                            />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {hasError && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-brand-red font-bold px-2">
                       <AlertCircle size={12} /> {errorMsg.msg}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
