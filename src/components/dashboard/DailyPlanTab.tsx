import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, 
  BookOpen,
  Play, 
  SkipForward, 
  Clock, 
  ChevronRight,
  Plus,
  Zap,
  Trophy,
  ArrowRight,
  History,
  AlertCircle,
  MoreVertical,
  ListChecks,
  RefreshCw,
  Pencil,
  Trash2,
  TriangleAlert,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { DailyBlock, Subject } from '../../types';
import { getSubjectColorHex } from '../../utils/subjectColors';
import { DailyBlockForm } from '../shared/DailyBlockForm';
import { Modal } from '../shared/Modal';
import { StudyTypeBadge, getStudyTypeBadgeLabel } from '../shared/StudyTypeBadge';
import { SubjectTag } from '../shared/SubjectTag';
import { designTokens } from '../../styles/designTokens';

type StudyBlockType = 'teoria' | 'questoes' | 'revisao';

interface DailyPlanTabProps {
  dailyBlocks: DailyBlock[];
  generateDailyPlan: () => void;
  isGenerating: boolean;
  startStudySession: (block: any) => void;
  updateDailyBlock: (id: string, updates: Partial<DailyBlock>) => void;
  deleteDailyBlock: (id: string) => void;
  subjects: Subject[];
  addDailyBlock: (block: Partial<DailyBlock>) => Promise<void>;
  overdueReviewsCount: number;
  setActiveTab: (tab: string) => void;
  dailyTime: number;
}

interface BlockActionsMenuProps {
  block: DailyBlock;
  isOpen: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function BlockActionsMenu({
  block,
  isOpen,
  menuRef,
  onToggle,
  onEdit,
  onDelete
}: BlockActionsMenuProps) {
  return (
    <div className="relative" ref={isOpen ? menuRef : null}>
      <button
        onClick={onToggle}
        className="rounded-lg p-2 text-text-secondary hover:bg-background hover:text-text-primary transition-all"
        title="Mais opções"
      >
        <MoreVertical size={18} />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-11 z-20 w-44 rounded-xl border border-border bg-card p-1.5 shadow-xl">
          <button
            onClick={onEdit}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-primary hover:bg-background transition-all"
          >
            <Pencil size={15} />
            Editar
          </button>
          <button
            onClick={onDelete}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-red hover:bg-brand-red/10 transition-all"
          >
            <Trash2 size={15} />
            Excluir bloco
          </button>
        </div>
      )}
    </div>
  );
}

export function DailyPlanTab({
  dailyBlocks,
  generateDailyPlan,
  isGenerating,
  startStudySession,
  updateDailyBlock,
  deleteDailyBlock,
  subjects,
  addDailyBlock,
  overdueReviewsCount,
  setActiveTab,
  dailyTime
}: DailyPlanTabProps) {
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [isAddingBlock, setIsAddingBlock] = React.useState(false);
  const [openMenuBlockId, setOpenMenuBlockId] = React.useState<string | null>(null);
  const [editingBlock, setEditingBlock] = React.useState<DailyBlock | null>(null);
  const [deleteTargetBlock, setDeleteTargetBlock] = React.useState<DailyBlock | null>(null);
  const [pendingDeletedIds, setPendingDeletedIds] = React.useState<string[]>([]);
  const [newBlock, setNewBlock] = React.useState<{
    subjectId: string;
    type: StudyBlockType;
    durationMinutes: number;
  }>({
    subjectId: '',
    type: 'teoria',
    durationMinutes: 60
  });
  const [editForm, setEditForm] = React.useState<{
    subjectId: string;
    type: StudyBlockType;
    durationMinutes: number;
  }>({
    subjectId: '',
    type: 'teoria',
    durationMinutes: 60
  });
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const isSubjectAvailable = (subject: Subject) => {
    return subject.status === 'active';
  };

  const filterBlock = (block: DailyBlock) => {
    const subject = subjects.find(s => s.id === block.subjectId);
    // [FIX]: usa a mesma regra do seletor; antes um bloco podia ser salvo e sumir por filtros diferentes entre subjects/materias.
    if (subject) return isSubjectAvailable(subject);

    // [FIX]: blocos antigos sem subjectId conhecido continuam visíveis; esconder por nome em outra coleção fazia cards sumirem.
    return true;
  };

  const filteredBlocks = dailyBlocks.filter(block => !pendingDeletedIds.includes(block.id)).filter(filterBlock);
  const allFilteredOut = dailyBlocks.length > 0 && filteredBlocks.length === 0;

  const sortedBlocks = [...filteredBlocks].sort((a, b) => a.order - b.order);
  const subjectById = React.useMemo(() => new Map(subjects.map(subject => [subject.id, subject])), [subjects]);
  const completedCount = filteredBlocks.filter(b => b.status === 'concluido').length;
  const totalCount = filteredBlocks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isDayFinished = totalCount > 0 && completedCount === totalCount;
  const plannedMinutes = filteredBlocks.reduce((acc, block) => acc + (block.durationMinutes || 0), 0);
  const canAddMoreBlocks = totalCount > 0 && plannedMinutes < dailyTime;

  // Find the next block to be studied (first pending one)
  const nextBlockId = sortedBlocks.find(b => b.status === 'pendente')?.id;

  React.useEffect(() => {
    if (!openMenuBlockId) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuBlockId(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenuBlockId(null);
        setDeleteTargetBlock(null);
        setEditingBlock(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openMenuBlockId]);

  React.useEffect(() => {
    if (!editingBlock && !deleteTargetBlock) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setEditingBlock(null);
        setDeleteTargetBlock(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [editingBlock, deleteTargetBlock]);

  React.useEffect(() => {
    if (pendingDeletedIds.length === 0) return;

    const existingIds = new Set(dailyBlocks.map(block => block.id));
    const timer = window.setTimeout(() => {
      setPendingDeletedIds(current => current.filter(id => existingIds.has(id)));
    }, 4000);

    setPendingDeletedIds(current => current.filter(id => existingIds.has(id)));

    return () => window.clearTimeout(timer);
  }, [dailyBlocks, pendingDeletedIds]);

  const handleSkip = (block: DailyBlock) => {
    const maxOrder = Math.max(...dailyBlocks.map(b => b.order), 0);
    updateDailyBlock(block.id, { order: maxOrder + 1 });
  };

  const handleComplete = (block: DailyBlock) => {
    updateDailyBlock(block.id, { status: 'concluido' });
  };

  const handleAddManual = async () => {
    if (!newBlock.subjectId || isAddingBlock) return;
    const subject = subjects.find(s => s.id === newBlock.subjectId);
    if (!subject) return;

    setIsAddingBlock(true);
    try {
      await addDailyBlock({
        subjectId: subject.id,
        subjectName: subject.name,
        // [FIX]: mantém o tipo do bloco dentro dos valores aceitos pelas regras do Firestore.
        type: newBlock.type,
        durationMinutes: newBlock.durationMinutes
      });
      setShowAddModal(false);
      setNewBlock({ subjectId: '', type: 'teoria', durationMinutes: 60 });
    } finally {
      setIsAddingBlock(false);
    }
  };

  const openEditModal = (block: DailyBlock) => {
    setEditingBlock(block);
    setEditForm({
      subjectId: block.subjectId,
      type: (block.type as StudyBlockType) || 'teoria',
      durationMinutes: block.durationMinutes || 60
    });
    setOpenMenuBlockId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingBlock) return;
    const subject = subjects.find(item => item.id === editForm.subjectId);
    await updateDailyBlock(editingBlock.id, {
      subjectId: editForm.subjectId,
      subjectName: subject?.name || editingBlock.subjectName,
      type: editForm.type,
      durationMinutes: editForm.durationMinutes
    });
    setEditingBlock(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetBlock) return;

    const targetId = deleteTargetBlock.id;
    setPendingDeletedIds(current => [...current, targetId]);
    setDeleteTargetBlock(null);
    await deleteDailyBlock(targetId);
  };

  const getBlockTypeIcon = (type: string) => {
    if (type === 'questoes') return ListChecks;
    if (type === 'revisao') return RefreshCw;
    return BookOpen;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }} 
      className={`relative mx-auto max-w-4xl ${designTokens.page}`}
    >
      {/* Add Block Modal */}
      <AnimatePresence>
        {deleteTargetBlock && (
          <Modal open={Boolean(deleteTargetBlock)} onClose={() => setDeleteTargetBlock(null)} hideCloseButton>
            <div className="mb-5 flex items-center gap-3 text-brand-red">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-red/10">
                <TriangleAlert size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary">Excluir este bloco?</h3>
                <p className="text-sm text-text-secondary">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">
              O bloco <span className="font-semibold text-text-primary">{deleteTargetBlock.subjectName}</span> será removido do plano do dia e o progresso diário será atualizado imediatamente.
            </p>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setDeleteTargetBlock(null)}
                className="flex-1 rounded-xl border border-border px-4 py-3 font-bold hover:bg-background transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 rounded-xl bg-brand-red px-4 py-3 font-bold text-white hover:bg-brand-red/80 transition-all"
              >
                Excluir
              </button>
            </div>
          </Modal>
        )}

        <DailyBlockForm
          open={Boolean(editingBlock)}
          title="Editar Bloco"
          subjects={subjects.filter(isSubjectAvailable)}
          subjectId={editForm.subjectId}
          type={editForm.type}
          durationMinutes={editForm.durationMinutes}
          onClose={() => setEditingBlock(null)}
          onSubmit={handleSaveEdit}
          onSubjectChange={(subjectId) => setEditForm({ ...editForm, subjectId })}
          onTypeChange={(type) => setEditForm({ ...editForm, type })}
          onDurationChange={(durationMinutes) => setEditForm({ ...editForm, durationMinutes })}
          submitLabel="Salvar"
          submitDisabled={!editForm.subjectId || editForm.durationMinutes <= 0}
        />

        <DailyBlockForm
          open={showAddModal}
          title="Novo Bloco Manual"
          subjects={subjects.filter(isSubjectAvailable)}
          subjectId={newBlock.subjectId}
          type={newBlock.type}
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

      <header className="mb-8">
        <div className={`${designTokens.pageHeader} mb-6`}>
          <div>
            <h2 className={designTokens.pageTitle}>Plano do Dia</h2>
            <p className={designTokens.pageIntro}>Sua jornada de hoje. Foco na execução, um passo de cada vez.</p>
          </div>
          
          {totalCount === 0 ? (
            <div className="flex flex-col items-end gap-2">
              <button 
                onClick={() => setShowAddModal(true)}
                className="w-full sm:w-auto px-5 py-3 border border-border rounded-xl font-bold text-text-secondary hover:text-brand-primary hover:border-brand-primary/50 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Adicionar Manualmente
              </button>
              <button 
                onClick={generateDailyPlan}
                disabled={isGenerating}
                className="bg-brand-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-primary/80 transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/20"
              >
                {isGenerating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Zap size={20} />}
                Gerar Plano de Hoje
              </button>
              <p className={`${designTokens.microBadge} animate-pulse text-brand-primary`}>
                Clique aqui para começar seu dia →
              </p>
            </div>
          ) : (
            <div className={`flex items-center ${designTokens.toolbarGap}`}>
               <button 
                onClick={() => setShowAddModal(true)}
                className="p-3 border border-border rounded-xl text-text-secondary hover:text-brand-primary hover:border-brand-primary/50 transition-all"
                title="Adicionar Bloco Manual"
              >
                <Plus size={20} />
              </button>
              <button 
                onClick={generateDailyPlan}
                disabled={isGenerating}
                className="text-sm font-bold text-brand-primary hover:underline disabled:opacity-50"
              >
                Regerar Plano
              </button>
            </div>
          )}
        </div>

        {overdueReviewsCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-6 bg-brand-primary/10 border border-brand-primary/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
                <History size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-brand-primary">Revisões Acumuladas</h4>
                <p className="text-text-secondary text-sm">Você tem <span className="font-bold text-brand-primary">{overdueReviewsCount} itens</span> no Caderno de Erros aguardando revisão.</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('errors')}
              className="w-full md:w-auto px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/80 transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2"
            >
              Revisar Agora <ArrowRight size={18} />
            </button>
          </motion.div>
        )}

        {totalCount > 0 && (
          <div className={`${designTokens.sectionCard} relative overflow-hidden rounded-3xl`}>
            {isDayFinished && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-brand-green/5 pointer-events-none"
              />
            )}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className={`${designTokens.microBadge} text-text-secondary`}>Progresso Diário</span>
                {isDayFinished && (
                  <span className="flex items-center gap-1 text-xs font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full">
                    <Trophy size={12} /> Dia Finalizado!
                  </span>
                )}
              </div>
              <span className="text-sm font-bold text-brand-primary">
                {completedCount} de {totalCount} blocos · {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="h-3 bg-background rounded-full overflow-hidden border border-border">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className={cn(
                  "h-full transition-all duration-500",
                  isDayFinished ? "bg-brand-green shadow-[0_0_10px_rgba(var(--brand-green-rgb),0.5)]" : "bg-brand-primary shadow-[0_0_10px_rgba(var(--brand-primary-rgb),0.5)]"
                )}
              />
            </div>
          </div>
        )}
      </header>

      <div className={designTokens.listStackRelaxed}>
        {isDayFinished && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-brand-green/10 border border-brand-green/30 rounded-3xl p-8 text-center mb-8"
          >
            <div className="w-16 h-16 bg-brand-green/20 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-green">
              <Trophy size={32} />
            </div>
            <h3 className="text-2xl font-bold text-brand-green mb-2">Missão Cumprida!</h3>
            <p className="text-text-secondary max-w-md mx-auto">
              Você concluiu todos os blocos planejados para hoje. Sua constância é o que te levará à aprovação. Descanse e prepare-se para amanhã!
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {sortedBlocks.map((block, index) => {
            const isCurrent = block.status === 'em_andamento';
            const isCompleted = block.status === 'concluido';
            const isPending = block.status === 'pendente';
            const isNext = block.id === nextBlockId;
            const TypeIcon = getBlockTypeIcon(block.type);
            
            return (
              <motion.div
                layout
                key={block.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  `${designTokens.itemCard} group relative flex items-center gap-4 transition-all`,
                  isCurrent 
                    ? "bg-brand-primary/5 border-brand-primary shadow-md ring-1 ring-brand-primary/20" 
                  : isCompleted 
                      ? "bg-background/50 border-border opacity-60" 
                      : isNext
                        ? "bg-card border-brand-primary/40 shadow-sm"
                        : "bg-card border-border hover:border-brand-primary/30"
                )}
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-border bg-background text-text-secondary">
                  <TypeIcon size={20} className={cn(
                    block.type === 'teoria' && 'text-brand-blue',
                    block.type === 'questoes' && 'text-brand-primary',
                    block.type === 'revisao' && 'text-brand-orange'
                  )} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`mb-1 flex flex-wrap items-center gap-2 ${designTokens.metaText}`}>
                    <StudyTypeBadge type={block.type as StudyBlockType} label={getStudyTypeBadgeLabel(block.type as StudyBlockType)} />
                    <span>·</span>
                    <span className="font-medium flex items-center gap-1">
                      <Clock size={12} /> {block.durationMinutes} min
                    </span>
                    {isNext && !isCurrent && (
                      <span className={`${designTokens.microBadge} rounded bg-brand-primary/10 px-2 py-0.5 text-brand-primary`}>
                        Próximo
                      </span>
                    )}
                  </div>
                  <div className={cn("truncate", isCompleted && "line-through opacity-60")}>
                    <SubjectTag
                      subjectName={block.subjectName}
                      color={getSubjectColorHex(subjectById.get(block.subjectId))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isPending && (
                    <>
                      <button 
                        onClick={() => handleComplete(block)}
                        className="p-2 text-text-secondary hover:text-brand-green hover:bg-brand-green/10 rounded-lg transition-all"
                        title="Marcar como concluído"
                      >
                        <CheckCircle2 size={20} />
                      </button>
                      <button 
                        onClick={() => handleSkip(block)}
                        className="p-2 text-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all"
                        title="Pular para o final"
                      >
                        <SkipForward size={20} />
                      </button>
                      <button 
                        onClick={() => startStudySession(block)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-md",
                          isNext 
                            ? "bg-brand-primary text-white hover:bg-brand-primary/80 shadow-brand-primary/20" 
                            : "bg-brand-primary text-white hover:bg-brand-primary/80 shadow-brand-primary/20"
                        )}
                      >
                        <Play size={18} fill="currentColor" />
                        <span className="hidden sm:inline">Iniciar</span>
                      </button>
                      <BlockActionsMenu
                        block={block}
                        isOpen={openMenuBlockId === block.id}
                        menuRef={menuRef}
                        onToggle={() => setOpenMenuBlockId(current => current === block.id ? null : block.id)}
                        onEdit={() => openEditModal(block)}
                        onDelete={() => {
                          setDeleteTargetBlock(block);
                          setOpenMenuBlockId(null);
                        }}
                      />
                    </>
                  )}
                  
                  {isCurrent && (
                    <button 
                      onClick={() => startStudySession(block)}
                      className="flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-primary/80 transition-all shadow-lg shadow-brand-primary/30 scale-105"
                    >
                      <Play size={20} fill="currentColor" />
                      <span>Continuar Estudo</span>
                      <ChevronRight size={20} />
                    </button>
                  )}

                  {isCompleted && (
                    <BlockActionsMenu
                      block={block}
                      isOpen={openMenuBlockId === block.id}
                      menuRef={menuRef}
                      onToggle={() => setOpenMenuBlockId(current => current === block.id ? null : block.id)}
                      onEdit={() => openEditModal(block)}
                      onDelete={() => {
                        setDeleteTargetBlock(block);
                        setOpenMenuBlockId(null);
                      }}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {canAddMoreBlocks && !isGenerating && !allFilteredOut && (
          <div className="rounded-3xl border-2 border-dashed border-border bg-card/50 p-6 text-center">
            <p className="text-sm font-medium text-text-primary">Ainda cabe mais um bloco no seu dia.</p>
            <p className="mt-1 text-xs text-text-secondary">
              Você planejou {plannedMinutes} min de {dailyTime} min disponíveis.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-text-secondary hover:border-brand-primary/50 hover:text-brand-primary transition-all"
            >
              <Plus size={16} />
              Adicionar mais um bloco
            </button>
          </div>
        )}

        {isGenerating && totalCount === 0 ? (
          <div className="text-center py-20 bg-card border-2 border-dashed border-border rounded-3xl">
            <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-primary">
              <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-xl font-bold mb-2">Gerando plano do dia</h3>
            <p className="text-text-secondary max-w-xs mx-auto">
              Preparando os blocos com base no seu ciclo de estudos.
            </p>
          </div>
        ) : allFilteredOut ? (
          <div className="text-center py-20 bg-card border-2 border-dashed border-border rounded-3xl">
            <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-primary">
              <AlertCircle size={40} />
            </div>
            <h3 className="text-xl font-bold mb-2">Nenhum bloco disponível</h3>
            <p className="text-text-secondary mb-8 max-w-xs mx-auto">
              Nenhuma matéria ativa para hoje. Ative matérias nas configurações.
            </p>
            <button 
              onClick={() => setActiveTab('settings')}
              className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-primary/80 transition-all shadow-lg shadow-brand-primary/20"
            >
              Ir para Configurações
            </button>
          </div>
        ) : totalCount === 0 && !isGenerating && !allFilteredOut ? (
          <div className="text-center py-20 bg-card border-2 border-dashed border-border rounded-3xl">
            <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-primary">
              <Zap size={40} />
            </div>
            <h3 className="text-xl font-bold mb-2">Nenhum plano para hoje</h3>
            <p className="text-text-secondary mb-8 max-w-xs mx-auto">
              Gere seu plano diário com base no seu ciclo de estudos para começar a evoluir.
            </p>
            <button 
              onClick={generateDailyPlan}
              disabled={isGenerating}
              className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-primary/80 transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
            >
              {isGenerating ? 'Gerando...' : 'Gerar Plano Agora'}
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="mt-3 px-8 py-3 rounded-xl border border-border font-bold text-text-secondary hover:text-brand-primary hover:border-brand-primary/50 transition-all"
            >
              Adicionar Bloco Manual
            </button>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
