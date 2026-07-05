import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  Play, 
  SkipForward, 
  Clock, 
  ChevronRight,
  Plus,
  Zap,
  Trophy,
  ArrowRight,
  History,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { DailyBlock, Subject } from '../../types';

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
  setActiveTab
}: DailyPlanTabProps) {
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [isAddingBlock, setIsAddingBlock] = React.useState(false);
  const [newBlock, setNewBlock] = React.useState<{
    subjectId: string;
    type: StudyBlockType;
    durationMinutes: number;
  }>({
    subjectId: '',
    type: 'teoria',
    durationMinutes: 60
  });

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

  const filteredBlocks = dailyBlocks.filter(filterBlock);
  const allFilteredOut = dailyBlocks.length > 0 && filteredBlocks.length === 0;

  const sortedBlocks = [...filteredBlocks].sort((a, b) => a.order - b.order);
  const completedCount = filteredBlocks.filter(b => b.status === 'concluido').length;
  const totalCount = filteredBlocks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isDayFinished = totalCount > 0 && completedCount === totalCount;

  // Find the next block to be studied (first pending one)
  const nextBlockId = sortedBlocks.find(b => b.status === 'pendente')?.id;

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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }} 
      className="max-w-4xl mx-auto pb-20 relative"
    >
      {/* Add Block Modal */}
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
              <h3 className="text-2xl font-bold mb-6">Novo Bloco Manual</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">Disciplina</label>
                  <select 
                    value={newBlock.subjectId}
                    onChange={(e) => setNewBlock({ ...newBlock, subjectId: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-brand-primary transition-all"
                  >
                    <option value="">Selecione uma matéria</option>
                    {subjects.filter(isSubjectAvailable).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">Tipo de Estudo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['teoria', 'questoes', 'revisao'] as StudyBlockType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setNewBlock({ ...newBlock, type })}
                        className={cn(
                          "py-2 rounded-lg text-xs font-bold border transition-all capitalize",
                          newBlock.type === type 
                            ? "bg-brand-primary/10 border-brand-primary text-brand-primary" 
                            : "bg-background border-border text-text-secondary hover:border-brand-primary/30"
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
                    {[30, 40, 50, 60].map((min) => (
                      <button
                        key={min}
                        onClick={() => setNewBlock({ ...newBlock, durationMinutes: min })}
                        className={cn(
                          "py-2 rounded-lg text-xs font-bold border transition-all",
                          newBlock.durationMinutes === min 
                            ? "bg-brand-primary/10 border-brand-primary text-brand-primary" 
                            : "bg-background border-border text-text-secondary hover:border-brand-primary/30"
                        )}
                      >
                        {min}'
                      </button>
                    ))}
                  </div>
                  <input 
                    type="number" 
                    value={newBlock.durationMinutes}
                    onChange={(e) => setNewBlock({ ...newBlock, durationMinutes: parseInt(e.target.value) || 0 })}
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
                    // [FIX]: bloqueia cliques consecutivos para não criar blocos duplicados enquanto salva.
                    disabled={isAddingBlock || !newBlock.subjectId || newBlock.durationMinutes <= 0}
                    className="flex-1 px-4 py-3 rounded-xl bg-brand-primary text-white font-bold hover:bg-brand-primary/80 transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/20"
                  >
                    {isAddingBlock ? 'Adicionando...' : 'Adicionar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Plano do Dia</h2>
            <p className="text-text-secondary">Sua jornada de hoje. Foco na execução, um passo de cada vez.</p>
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
              <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest animate-pulse">
                Clique aqui para começar seu dia →
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3">
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
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
            {isDayFinished && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-brand-green/5 pointer-events-none"
              />
            )}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">Progresso Diário</span>
                {isDayFinished && (
                  <span className="flex items-center gap-1 text-xs font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full">
                    <Trophy size={12} /> Dia Finalizado!
                  </span>
                )}
                {!isDayFinished && (
                  <span className="text-[10px] text-brand-primary font-bold animate-pulse ml-2">
                    Seu progresso aparece aqui
                  </span>
                )}
              </div>
              <span className="text-sm font-bold text-brand-primary">
                {completedCount} de {totalCount} blocos ({Math.round(progressPercent)}%)
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

      <div className="space-y-4">
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
            
            return (
              <motion.div
                layout
                key={block.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "group relative flex items-center gap-4 p-4 sm:p-6 rounded-2xl border transition-all",
                  isCurrent 
                    ? "bg-brand-primary/5 border-brand-primary shadow-md ring-1 ring-brand-primary/20" 
                    : isCompleted 
                      ? "bg-background/50 border-border opacity-60 grayscale-[0.5]" 
                      : isNext
                        ? "bg-card border-brand-primary/40 shadow-sm"
                        : "bg-card border-border hover:border-brand-primary/30"
                )}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0 relative">
                  {isCompleted ? (
                    <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                      <CheckCircle2 size={24} />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary animate-pulse">
                      <Clock size={24} />
                    </div>
                  ) : (
                    <div className={cn(
                      "w-10 h-10 rounded-full bg-background border-2 flex items-center justify-center text-text-secondary transition-colors",
                      isNext ? "border-brand-primary/50 text-brand-primary" : "border-border group-hover:border-brand-primary/50"
                    )}>
                      <Circle size={20} />
                    </div>
                  )}
                  
                  {isNext && !isCurrent && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary rounded-full border-2 border-card flex items-center justify-center"
                    >
                      <ArrowRight size={10} className="text-white" />
                    </motion.div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                      block.type === 'teoria' ? "bg-brand-blue/10 text-brand-blue" : 
                      block.type === 'questoes' ? "bg-brand-primary/10 text-brand-primary" : "bg-brand-orange/10 text-brand-orange"
                    )}>
                      {block.type}
                    </span>
                    <span className="text-xs text-text-secondary font-medium flex items-center gap-1">
                      <Clock size={12} /> {block.durationMinutes} min
                    </span>
                    {isNext && !isCurrent && (
                      <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">
                        Próximo
                      </span>
                    )}
                  </div>
                  <h4 className={cn(
                    "font-bold text-lg truncate",
                    isCompleted ? "text-text-secondary line-through" : "text-text-primary"
                  )}>
                    {block.subjectName}
                  </h4>
                </div>

                {/* Actions */}
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
                          "flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-md relative",
                          isNext 
                            ? "bg-brand-primary text-white hover:bg-brand-primary/80 shadow-brand-primary/20 animate-pulse" 
                            : "bg-background border border-border text-text-primary hover:border-brand-primary/50"
                        )}
                      >
                        <Play size={18} fill={isNext ? "currentColor" : "none"} />
                        <span className="hidden sm:inline">Iniciar</span>
                        {isNext && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-brand-primary text-white text-[10px] px-2 py-1 rounded shadow-lg">
                            Clique aqui para começar →
                          </div>
                        )}
                      </button>
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
                    <button 
                      onClick={() => updateDailyBlock(block.id, { status: 'pendente' })}
                      className="text-xs font-bold text-brand-primary hover:underline"
                    >
                      Refazer
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {allFilteredOut ? (
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
              className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-primary/80 transition-all shadow-lg shadow-brand-primary/20"
            >
              Gerar Plano Agora
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
