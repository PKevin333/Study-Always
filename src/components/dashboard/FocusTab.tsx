import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw, Target, Trash2 } from 'lucide-react';
import { Subject, DailyBlock, CycleBlock } from '../../types';
import { Modal } from '../shared/Modal';
import { toast } from '../shared/ToastViewport';

interface FocusTabProps {
  generateWeaknessPlan: () => void;
  focusItems: { focar: any[], manter: any[], dominado: any[] };
  showWeaknessPlan: boolean;
  setShowWeaknessPlan: (show: boolean) => void;
  weaknessPlan: any[];
  setWeaknessPlan: (plan: any[]) => void;
  subjects: Subject[];
  dailyBlocks: DailyBlock[];
  setActiveTab: (tab: string) => void;
  setSelectedSubject: (id: string) => void;
  cycleBlocks: CycleBlock[];
  setIgnoredFocusTopics: React.Dispatch<React.SetStateAction<string[]>>;
  addDailyBlock: (block: Partial<DailyBlock>) => void;
  addCycleBlock: (subjectId: string, subjectName: string, type: string, duration: number, dayOfWeek?: number) => void;
  focusSourceCount: number;
  ignoredFocusCount: number;
  clearAllFocusItems: () => void;
  restoreFocusItems: () => void;
}

export function FocusTab({
  generateWeaknessPlan,
  focusItems,
  showWeaknessPlan,
  setShowWeaknessPlan,
  weaknessPlan,
  setWeaknessPlan,
  subjects,
  dailyBlocks,
  setActiveTab,
  setSelectedSubject,
  cycleBlocks,
  setIgnoredFocusTopics,
  addDailyBlock,
  addCycleBlock,
  focusSourceCount,
  ignoredFocusCount,
  clearAllFocusItems,
  restoreFocusItems
}: FocusTabProps) {
  const [clearModalOpen, setClearModalOpen] = React.useState(false);

  const ignoreFocusItem = (key: string) => {
    setIgnoredFocusTopics(current => current.includes(key) ? current : [...current, key]);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }} 
      key="focus" 
      className="pb-20"
    >
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Foco de Estudo</h2>
          <p className="text-text-secondary text-sm sm:text-base">Identifique rapidamente o que revisar com base no seu desempenho real.</p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          {ignoredFocusCount > 0 ? (
            <button
              type="button"
              onClick={restoreFocusItems}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-[var(--surface-muted)] px-4 text-sm font-bold text-text-secondary transition hover:text-brand-primary sm:flex-none"
            >
              <RotateCcw size={17} /> Restaurar ocultados
            </button>
          ) : null}
          {focusSourceCount > 0 ? (
            <button
              type="button"
              onClick={() => setClearModalOpen(true)}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold text-brand-red transition hover:bg-brand-red/10 sm:flex-none"
            >
              <Trash2 size={17} /> Limpar foco
            </button>
          ) : null}
          <button
            onClick={generateWeaknessPlan}
            disabled={focusItems.focar.length === 0}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-brand-primary px-5 font-bold text-white transition-colors hover:bg-brand-primary/80 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Target size={18} />
            Atacar pontos fracos
          </button>
        </div>
      </header>

      {showWeaknessPlan && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-10 bg-brand-red/5 border border-brand-red/20 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-brand-red flex items-center gap-2">
              <Target size={24} />
              Plano de Foco em Pontos Fracos
            </h3>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowWeaknessPlan(false)}
                className="text-text-secondary hover:text-text-primary transition-colors text-sm font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            {weaknessPlan.map((block, i) => (
              <div key={block.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-background border border-brand-red/20 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center text-brand-red font-bold text-xs">
                    {i + 1}º
                  </div>
                  <div>
                    <div className="font-bold">{block.subjectName}</div>
                    <div className="text-sm text-text-secondary">{block.topic}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto">
                  <select 
                    value={block.type}
                    onChange={(e) => {
                      const newPlan = [...weaknessPlan];
                      newPlan[i].type = e.target.value;
                      setWeaknessPlan(newPlan);
                    }}
                    className="bg-background border border-border rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-wider"
                  >
                    <option value="teoria">Teoria</option>
                    <option value="questoes">Questões</option>
                    <option value="revisao">Revisão</option>
                  </select>
                  <input 
                    type="number" 
                    value={block.durationMinutes}
                    onChange={(e) => {
                      const newPlan = [...weaknessPlan];
                      newPlan[i].durationMinutes = parseInt(e.target.value) || 0;
                      setWeaknessPlan(newPlan);
                    }}
                    className="bg-background border border-border rounded-lg px-2 py-1 text-sm font-bold w-16 text-right"
                  />
                  <span className="text-sm text-text-secondary">min</span>
                  <button 
                    onClick={() => {
                      const newPlan = [...weaknessPlan];
                      newPlan.splice(i, 1);
                      setWeaknessPlan(newPlan);
                    }}
                    className="p-2 text-text-secondary hover:text-brand-red hover:bg-brand-red/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-4 mb-6 p-4 rounded-xl bg-background border border-border border-dashed">
            <select id="weak-add-subject" className="bg-card border border-border rounded-xl px-4 py-2 flex-1">
              <option value="">Selecione a matéria...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input id="weak-add-topic" type="text" placeholder="Assunto" className="bg-card border border-border rounded-xl px-4 py-2 flex-1" />
            <select id="weak-add-type" className="bg-card border border-border rounded-xl px-4 py-2 w-full lg:w-32">
              <option value="teoria">Teoria</option>
              <option value="questoes">Questões</option>
              <option value="revisao">Revisão</option>
            </select>
            <input id="weak-add-time" type="number" placeholder="Min" className="bg-card border border-border rounded-xl px-4 py-2 w-full lg:w-24" defaultValue={30} />
            <button 
              onClick={() => {
                const subjectSelect = document.getElementById('weak-add-subject') as HTMLSelectElement;
                const topicInput = document.getElementById('weak-add-topic') as HTMLInputElement;
                const typeSelect = document.getElementById('weak-add-type') as HTMLSelectElement;
                const timeInput = document.getElementById('weak-add-time') as HTMLInputElement;
                
                if (!subjectSelect.value || !topicInput.value) return;
                
                const subjectName = subjects.find(s => s.id === subjectSelect.value)?.name || '';
                
                setWeaknessPlan([...weaknessPlan, {
                  id: `weak-manual-${Date.now()}`,
                  subjectId: subjectSelect.value,
                  subjectName,
                  topic: topicInput.value,
                  type: typeSelect.value,
                  durationMinutes: parseInt(timeInput.value) || 30
                }]);
                
                topicInput.value = '';
              }}
              className="bg-brand-primary text-white px-4 py-2 rounded-xl font-bold hover:bg-brand-primary/80 transition-colors"
            >
              Adicionar
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4">
            <button 
              onClick={async () => {
                for (const block of weaknessPlan) {
                  addDailyBlock({
                    subjectId: block.subjectId,
                    subjectName: block.subjectName,
                    type: block.type,
                    durationMinutes: block.durationMinutes
                  });
                }
                toast.success('Plano adicionado ao Plano do Dia.');
                setShowWeaknessPlan(false);
                setActiveTab('daily');
              }}
              className="bg-background border border-border text-text-primary px-6 py-3 rounded-xl font-bold hover:bg-border transition-colors"
            >
              Salvar no Plano do Dia
            </button>
            <button 
              onClick={() => {
                if (weaknessPlan.length > 0) {
                  setSelectedSubject(weaknessPlan[0].subjectId);
                  setActiveTab('timer');
                }
              }}
              className="bg-brand-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-primary/80 transition-colors"
            >
              Iniciar Estudo Agora
            </button>
          </div>
        </motion.div>
      )}

      <div className="space-y-8">
        <section>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-red"></div>
            Focar Agora
          </h3>
          <p className="text-sm text-text-secondary mb-4">Assuntos com baixo desempenho, muitos erros ou esquecidos.</p>
          
          {focusItems.focar.length === 0 ? (
            <div className="p-6 bg-card border border-border rounded-2xl text-center text-text-secondary">
              Nenhum assunto crítico no momento. Bom trabalho!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {focusItems.focar.map(item => (
                <div key={item.key} className="bg-card border border-brand-red/30 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-brand-red/10 text-brand-red uppercase">{item.reason}</span>
                      <span className="text-lg font-bold text-brand-red">{Math.round(item.percentage)}%</span>
                    </div>
                    <h4 className="font-bold text-lg mb-1">{item.topic}</h4>
                    <p className="text-sm text-text-secondary mb-1">{item.subjectName}</p>
                    
                    <div className="flex gap-4 text-xs text-text-secondary mb-4">
                      <div><span className="font-bold text-text-primary">{item.errors}</span> erros</div>
                      <div><span className="font-bold text-text-primary">{Math.round(item.daysSinceLastStudy)}</span> dias sem ver</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-auto">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setSelectedSubject(item.subjectId);
                          setActiveTab('timer');
                        }}
                        className="flex-1 bg-brand-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-brand-primary/80 transition-colors"
                      >
                        Estudar
                      </button>
                      <button 
                        onClick={async () => {
                          addCycleBlock(
                            item.subjectId,
                            item.subjectName,
                            'revisao',
                            30
                          );
                          toast.success(`${item.subjectName} foi adicionado ao ciclo de estudos.`);
                        }}
                        className="flex-1 bg-brand-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-brand-primary/80 transition-colors"
                      >
                        + Ciclo
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          ignoreFocusItem(item.key);
                          toast.success('Marcado como revisado. O assunto saiu temporariamente das prioridades.');
                        }}
                        className="flex-1 bg-background border border-border text-text-secondary text-xs font-bold py-2 rounded-lg hover:bg-border transition-colors"
                      >
                        Já Revisei
                      </button>
                      <button 
                        onClick={() => ignoreFocusItem(item.key)}
                        className="flex flex-1 items-center justify-center gap-1.5 bg-background border border-border text-text-secondary text-xs font-bold py-2 rounded-lg hover:bg-brand-red/10 hover:text-brand-red transition-colors"
                      >
                        <Trash2 size={14} /> Remover do foco
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal
        open={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        title="Limpar o Foco de Estudo?"
        footer={(
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setClearModalOpen(false)}
              className="h-10 rounded-md bg-[var(--surface-muted)] px-4 text-sm font-bold text-text-primary"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                clearAllFocusItems();
                setClearModalOpen(false);
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-red px-4 text-sm font-bold text-white hover:brightness-110"
            >
              <Trash2 size={16} /> Limpar tudo
            </button>
          </div>
        )}
      >
        <div className="flex items-start gap-3 bg-brand-red/5 p-4">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-brand-red" />
          <div>
            <p className="text-sm font-semibold text-text-primary">Todos os assuntos serão removidos da lista de foco.</p>
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">
              Seus resultados de questões e o histórico de desempenho não serão apagados. Você poderá restaurar os assuntos depois.
            </p>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
