import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Play, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DailyBlock, Subject } from '../../types';
import { useAuth } from '../../AuthContext';
import { useMaterias } from '../../hooks/useMaterias';

interface KanbanTabProps {
  dailyBlocks: DailyBlock[];
  generateDailyPlan: () => void;
  isGenerating: boolean;
  startStudySession: (block: any) => void;
  updateDailyBlock: (id: string, updates: Partial<DailyBlock>) => void;
  deleteDailyBlock: (id: string) => void;
  subjects: Subject[];
  addDailyBlock: (block: Partial<DailyBlock>) => void;
}

export function KanbanTab({
  dailyBlocks,
  generateDailyPlan,
  isGenerating,
  startStudySession,
  updateDailyBlock,
  deleteDailyBlock,
  subjects,
  addDailyBlock
}: KanbanTabProps) {
  const { user } = useAuth();
  const { materias } = useMaterias(user?.uid || '');
  const [draggedBlock, setDraggedBlock] = React.useState<DailyBlock | null>(null);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [newBlock, setNewBlock] = React.useState({
    subjectId: '',
    type: 'teoria',
    durationMinutes: 60
  });

  const activeSubjects = subjects.filter(subject => subject.status === 'active');

  const filterBlock = (block: DailyBlock) => {
    const matchingMateria = materias.find(item => item.nome.toLowerCase() === block.subjectName.toLowerCase());
    if (matchingMateria && !matchingMateria.ativa) return false;

    const matchingSubject = subjects.find(item => item.id === block.subjectId);
    if (matchingSubject && matchingSubject.status !== 'active') return false;

    return true;
  };

  const handleAddManual = () => {
    if (!newBlock.subjectId || newBlock.durationMinutes <= 0) return;

    const subject = subjects.find(item => item.id === newBlock.subjectId);
    if (!subject) return;

    addDailyBlock({
      subjectId: subject.id,
      subjectName: subject.name,
      type: newBlock.type as DailyBlock['type'],
      durationMinutes: newBlock.durationMinutes
    });

    setShowAddModal(false);
    setNewBlock({
      subjectId: '',
      type: 'teoria',
      durationMinutes: 60
    });
  };

  const filteredBlocks = dailyBlocks.filter(filterBlock);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      key="kanban"
      className="pb-20 h-full flex flex-col"
    >
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-card border border-border rounded-[2rem] p-8 shadow-2xl w-full max-w-md"
            >
              <h3 className="text-2xl font-bold mb-6">Novo Bloco no Kanban</h3>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">Disciplina</label>
                  <select
                    value={newBlock.subjectId}
                    onChange={(e) => setNewBlock({ ...newBlock, subjectId: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-brand-primary transition-all"
                  >
                    <option value="">Selecione uma disciplina</option>
                    {activeSubjects.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">Tipo de Estudo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['teoria', 'questoes', 'revisao'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setNewBlock({ ...newBlock, type })}
                        className={cn(
                          'py-2 rounded-lg text-xs font-bold border transition-all capitalize',
                          newBlock.type === type
                            ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                            : 'bg-background border-border text-text-secondary hover:border-brand-primary/30'
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">Duração (minutos)</label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[30, 40, 50, 60].map((minutes) => (
                      <button
                        key={minutes}
                        onClick={() => setNewBlock({ ...newBlock, durationMinutes: minutes })}
                        className={cn(
                          'py-2 rounded-lg text-xs font-bold border transition-all',
                          newBlock.durationMinutes === minutes
                            ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                            : 'bg-background border-border text-text-secondary hover:border-brand-primary/30'
                        )}
                      >
                        {minutes}'
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={newBlock.durationMinutes}
                    onChange={(e) => setNewBlock({ ...newBlock, durationMinutes: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-brand-primary transition-all text-center font-bold"
                    placeholder="Outro tempo..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-border font-bold hover:bg-background transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddManual}
                    disabled={!newBlock.subjectId || newBlock.durationMinutes <= 0}
                    className="flex-1 px-4 py-3 rounded-xl bg-brand-primary text-white font-bold hover:bg-brand-primary/80 transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/20"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Quadro Kanban</h2>
        <p className="text-text-secondary text-sm sm:text-base">Organize visualmente seus blocos de estudo do dia.</p>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4">
          <button
            onClick={generateDailyPlan}
            disabled={isGenerating}
            className="w-full sm:w-auto bg-brand-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-primary/80 transition-all disabled:opacity-50"
          >
            {isGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Plus size={18} />}
            Gerar Plano do Dia
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto border border-border px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-text-secondary hover:text-brand-primary hover:border-brand-primary/50 transition-all"
          >
            <Plus size={18} />
            Adicionar Bloco
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max h-full items-start">
          {[
            { id: 'pendente', label: 'A Fazer', color: 'border-border', bg: 'bg-card' },
            { id: 'em_andamento', label: 'Em Progresso', color: 'border-brand-primary/50', bg: 'bg-brand-primary/5' },
            { id: 'concluido', label: 'Concluido', color: 'border-brand-green/50', bg: 'bg-brand-green/5' }
          ].map(column => {
            const columnBlocks = filteredBlocks.filter(block => block.status === column.id).sort((a, b) => a.order - b.order);

            return (
              <div
                key={column.id}
                className={cn('w-80 rounded-2xl border flex flex-col max-h-full', column.color, column.bg)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedBlock && draggedBlock.status !== column.id) {
                    updateDailyBlock(draggedBlock.id, { status: column.id as DailyBlock['status'] });
                  }
                  setDraggedBlock(null);
                }}
              >
                <div className="p-4 border-b border-border/50 flex justify-between items-center">
                  <h3 className="font-bold">{column.label}</h3>
                  <span className="text-xs font-bold bg-background px-2 py-1 rounded-full text-text-secondary">
                    {columnBlocks.length}
                  </span>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-3 min-h-[200px]">
                  <AnimatePresence>
                    {columnBlocks.map(block => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={block.id}
                        draggable
                        onDragStart={(e: any) => {
                          setDraggedBlock(block);
                          e.dataTransfer.setData('text/plain', block.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => setDraggedBlock(null)}
                        className={cn(
                          'bg-background border border-border rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-brand-primary/30 transition-colors shadow-sm relative overflow-hidden',
                          draggedBlock?.id === block.id ? 'opacity-50' : ''
                        )}
                      >
                        <div className="flex justify-between items-start mb-2 pl-2">
                          <span className={cn(
                            'text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded',
                            block.type === 'teoria' ? 'bg-brand-blue/10 text-brand-blue' :
                            block.type === 'questoes' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-orange/10 text-brand-orange'
                          )}>{block.type}</span>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-text-secondary">{block.durationMinutes}m</span>
                            <button
                              onClick={() => deleteDailyBlock(block.id)}
                              className="text-text-secondary hover:text-brand-red transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <h4 className="font-bold text-sm mb-1 pl-2">{block.subjectName}</h4>

                        {column.id === 'pendente' && (
                          <button
                            onClick={() => startStudySession(block)}
                            className="w-full mt-3 bg-brand-primary/10 text-brand-primary text-xs font-bold py-2 rounded-lg hover:bg-brand-primary hover:text-white transition-colors flex items-center justify-center gap-1"
                          >
                            <Play size={12} /> Iniciar
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {column.id === 'pendente' && (
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="w-full py-3 border-2 border-dashed border-border rounded-xl text-text-secondary hover:border-brand-primary/50 hover:text-brand-primary transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      <span className="text-xs font-bold">Novo Bloco</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
