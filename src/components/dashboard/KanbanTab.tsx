import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, MoreHorizontal, Play, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DailyBlock, Subject } from '../../types';
import { getSubjectColorHex } from '../../utils/subjectColors';
import { DailyBlockForm } from '../shared/DailyBlockForm';
import { StudyTypeBadge } from '../shared/StudyTypeBadge';
import { SubjectTag } from '../shared/SubjectTag';
import { designTokens } from '../../styles/designTokens';

interface KanbanTabProps {
  dailyBlocks: DailyBlock[];
  generateDailyPlan: () => void;
  isGenerating: boolean;
  startStudySession: (block: any) => void;
  updateDailyBlock: (id: string, updates: Partial<DailyBlock>) => void;
  deleteDailyBlock: (id: string) => void;
  subjects: Subject[];
  addDailyBlock: (block: Partial<DailyBlock>) => Promise<void>;
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
  const [draggedBlock, setDraggedBlock] = React.useState<DailyBlock | null>(null);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [isAddingBlock, setIsAddingBlock] = React.useState(false);
  const [newBlock, setNewBlock] = React.useState({
    subjectId: '',
    type: 'teoria',
    durationMinutes: 60
  });

  const isSubjectAvailable = (subject: Subject) => {
    return subject.status === 'active';
  };

  const activeSubjects = subjects.filter(isSubjectAvailable);
  const subjectById = React.useMemo(() => new Map(subjects.map(subject => [subject.id, subject])), [subjects]);

  const filterBlock = (block: DailyBlock) => {
    const matchingSubject = subjects.find(item => item.id === block.subjectId);
    // [FIX]: usa a mesma regra do seletor; antes o usuário podia adicionar um bloco que era salvo e escondido logo após o snapshot.
    if (matchingSubject) return isSubjectAvailable(matchingSubject);

    // [FIX]: blocos antigos sem subjectId conhecido continuam visíveis; esconder por nome em outra coleção fazia cards sumirem.
    return true;
  };

  const handleAddManual = async () => {
    if (!newBlock.subjectId || newBlock.durationMinutes <= 0 || isAddingBlock) return;

    const subject = subjects.find(item => item.id === newBlock.subjectId);
    if (!subject) return;

    setIsAddingBlock(true);
    try {
      await addDailyBlock({
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
    } finally {
      setIsAddingBlock(false);
    }
  };

  const filteredBlocks = dailyBlocks.filter(filterBlock);
  const trelloVars = {
    '--trello-list-bg': '#F1F2F4',
    '--trello-card-bg': '#FFFFFF',
    '--trello-card-text': '#172B4D',
    '--trello-muted-text': '#5E6C84',
    '--trello-soft-bg': 'rgba(9,30,66,0.08)',
    '--trello-hover-bg': 'rgba(9,30,66,0.06)',
    '--trello-card-shadow': '0 1px 1px rgba(9,30,66,0.25)',
    '--trello-card-shadow-hover': '0 1px 3px rgba(9,30,66,0.25), 0 0 0 1px rgba(9,30,66,0.13)'
  } as React.CSSProperties;
  const columns = [
    { id: 'pendente', label: 'A Fazer', accent: 'border-t-brand-magenta', icon: <Circle size={16} /> },
    { id: 'em_andamento', label: 'Em Progresso', accent: 'border-t-brand-primary', icon: <Play size={16} /> },
    { id: 'concluido', label: 'Concluído', accent: 'border-t-brand-green', icon: <CheckCircle2 size={16} /> }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      key="kanban"
      className={`${designTokens.page} flex h-full flex-col`}
    >
      <AnimatePresence>
        <DailyBlockForm
          open={showAddModal}
          title="Novo Bloco no Kanban"
          subjects={activeSubjects}
          subjectId={newBlock.subjectId}
          type={newBlock.type as 'teoria' | 'questoes' | 'revisao'}
          durationMinutes={newBlock.durationMinutes}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddManual}
          onSubjectChange={(subjectId) => setNewBlock({ ...newBlock, subjectId })}
          onTypeChange={(type) => setNewBlock({ ...newBlock, type })}
          onDurationChange={(durationMinutes) => setNewBlock({ ...newBlock, durationMinutes })}
          submitLabel={isAddingBlock ? 'Adicionando...' : 'Adicionar'}
          submitDisabled={isAddingBlock || !newBlock.subjectId || newBlock.durationMinutes <= 0}
          durationPresets={[30, 40, 50, 60]}
        />
      </AnimatePresence>

      <header className={`${designTokens.pageHeader} mb-6 xl:flex-row xl:items-end`}>
        <div>
          <h2 className={designTokens.pageTitle}>Quadro Kanban</h2>
          <p className={designTokens.pageIntro}>Organize visualmente seus blocos de estudo do dia.</p>
        </div>
        <div className={`flex w-full flex-col sm:flex-row xl:w-auto ${designTokens.toolbarGap}`}>
          <button
            onClick={generateDailyPlan}
            disabled={isGenerating}
            className="w-full sm:w-auto bg-brand-primary text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-primary/80 transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/20"
          >
            {isGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Plus size={18} />}
            Gerar Plano do Dia
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto border border-border bg-card px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-text-secondary hover:text-brand-primary hover:border-brand-primary/50 transition-all"
          >
            <Plus size={18} />
            Adicionar Bloco
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto pb-4 -mx-2 px-2" style={trelloVars}>
        <div className="flex gap-4 min-w-max h-full items-start font-sans">
          {columns.map(column => {
            const columnBlocks = filteredBlocks.filter(block => block.status === column.id).sort((a, b) => a.order - b.order);

            return (
              <div
                key={column.id}
                className={cn(
                  'w-[272px] rounded-xl flex flex-col max-h-full border-t-[3px] shadow-sm',
                  column.accent
                )}
                style={{ backgroundColor: 'var(--trello-list-bg)' }}
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
                <div className="px-3 py-2 flex justify-between items-center gap-2">
                  <div className="min-w-0 flex items-center gap-2">
                    <span className={cn(
                      'shrink-0',
                      column.id === 'pendente' ? 'text-brand-magenta' :
                      column.id === 'em_andamento' ? 'text-brand-primary' : 'text-brand-green'
                    )}>
                      {column.icon}
                    </span>
                    <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--trello-card-text)' }}>{column.label}</h3>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--trello-soft-bg)', color: 'var(--trello-muted-text)' }}
                    >
                      {columnBlocks.length}
                    </span>
                  </div>
                  <button
                    className="shrink-0 p-1 rounded hover:bg-[var(--trello-soft-bg)] transition-colors"
                    title="Opções da coluna"
                  >
                    <MoreHorizontal size={16} color="var(--trello-muted-text)" />
                  </button>
                </div>

                <div className="px-2 pb-2 flex-1 overflow-y-auto space-y-2 min-h-[220px]">
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
                          'rounded-lg px-3 py-2 cursor-grab active:cursor-grabbing transition-transform duration-100 relative overflow-hidden group',
                          draggedBlock?.id === block.id ? 'opacity-70 rotate-2 shadow-2xl' : 'hover:-translate-y-0.5'
                        )}
                        style={{
                          backgroundColor: 'var(--trello-card-bg)',
                          boxShadow: draggedBlock?.id === block.id ? '0 8px 16px rgba(9,30,66,0.3)' : 'var(--trello-card-shadow)',
                          color: 'var(--trello-card-text)'
                        }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.boxShadow = 'var(--trello-card-shadow-hover)';
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.boxShadow = draggedBlock?.id === block.id ? '0 8px 16px rgba(9,30,66,0.3)' : 'var(--trello-card-shadow)';
                        }}
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <StudyTypeBadge type={block.type as 'teoria' | 'questoes' | 'revisao'} />

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold" style={{ color: 'var(--trello-muted-text)' }}>{block.durationMinutes}m</span>
                            <button
                              onClick={() => deleteDailyBlock(block.id)}
                              className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-brand-red transition-all"
                              title="Excluir bloco"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="mb-2">
                          <SubjectTag
                            subjectName={block.subjectName}
                            color={getSubjectColorHex(subjectById.get(block.subjectId))}
                          />
                        </div>

                        {column.id === 'pendente' && (
                          <button
                            onClick={() => startStudySession(block)}
                            className="w-full mt-2 bg-brand-primary/10 text-brand-primary text-xs font-bold py-2 rounded-lg hover:bg-brand-primary hover:text-white transition-colors flex items-center justify-center gap-1"
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
                      className="w-full py-2.5 px-3 rounded-lg text-left transition-colors flex items-center gap-2"
                      style={{ color: 'var(--trello-muted-text)' }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.backgroundColor = 'var(--trello-hover-bg)';
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Plus size={16} />
                      <span className="text-sm font-semibold">Adicionar bloco</span>
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
