import React from 'react';
import { motion } from 'framer-motion';
import { Target, Trash2 } from 'lucide-react';
import { Subject, DailyBlock, CycleBlock } from '../../types';

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
  addCycleBlock: (subjectId: string, subjectName: string, type: string, duration: number) => void;
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
  addCycleBlock
}: FocusTabProps) {
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
        <button
          onClick={generateWeaknessPlan}
          disabled={focusItems.focar.length === 0}
          className="w-full sm:w-auto bg-brand-red text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-red/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Target size={20} />
          Atacar pontos fracos
        </button>
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
                className="text-text-secondary hover:text-white transition-colors text-sm font-bold"
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
                alert("Plano adicionado ao Plano do Dia!");
                setShowWeaknessPlan(false);
                setActiveTab('daily');
              }}
              className="bg-background border border-border text-white px-6 py-3 rounded-xl font-bold hover:bg-border transition-colors"
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
              className="bg-brand-red text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-red/80 transition-colors"
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
                      <div><span className="font-bold text-white">{item.errors}</span> erros</div>
                      <div><span className="font-bold text-white">{Math.round(item.daysSinceLastStudy)}</span> dias sem ver</div>
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
                          alert(`${item.subjectName} adicionado ao ciclo de estudos!`);
                        }}
                        className="flex-1 bg-brand-blue text-white text-xs font-bold py-2 rounded-lg hover:bg-brand-blue/80 transition-colors"
                      >
                        + Ciclo
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setIgnoredFocusTopics(prev => [...prev, item.key]);
                          alert(`Marcado como revisado. O assunto foi removido das prioridades temporariamente.`);
                        }}
                        className="flex-1 bg-background border border-border text-text-secondary text-xs font-bold py-2 rounded-lg hover:bg-border transition-colors"
                      >
                        Já Revisei
                      </button>
                      <button 
                        onClick={() => setIgnoredFocusTopics(prev => [...prev, item.key])}
                        className="flex-1 bg-background border border-border text-text-secondary text-xs font-bold py-2 rounded-lg hover:bg-border transition-colors"
                      >
                        Ignorar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}
