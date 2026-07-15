import React from 'react';
import { motion } from 'framer-motion';
import { 
  RotateCcw, 
  Sparkles, 
  Target, 
  Clock, 
  BookOpen, 
  AlertCircle, 
  History, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Subject, CycleBlock } from '../../types';

interface CycleTabProps {
  subjects: Subject[];
  cycleBlocks: CycleBlock[];
  isGenerating: boolean;
  generateCycle: () => void;
  updateCycleSettings: (updates: any) => void;
  cycleFocus: string;
  dailyTime: number;
  blocksPerDay: number;
  getValidationAlerts: () => any[];
  deleteBlock: (id: string) => void;
  updateBlock: (id: string, updates: any) => void;
  duplicateBlock: (block: any) => void;
  addCycleBlock: (subjectId: string, subjectName: string, type: string, duration: number) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  recordManualStudySession: (subjectId: string, minutes: number, type: string) => Promise<boolean>;
}

export function CycleTab({
  subjects,
  cycleBlocks,
  isGenerating,
  generateCycle,
  updateCycleSettings,
  cycleFocus,
  dailyTime,
  blocksPerDay,
  getValidationAlerts,
  deleteBlock,
  updateBlock,
  duplicateBlock,
  addCycleBlock,
  updateSubject,
  recordManualStudySession
}: CycleTabProps) {
  const [savingBlockId, setSavingBlockId] = React.useState<string | null>(null);
  const [savedBlockId, setSavedBlockId] = React.useState<string | null>(null);
  const feedbackTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const handleRecordBlock = async (block: CycleBlock) => {
    if (savingBlockId) return;

    setSavingBlockId(block.id);
    try {
      const saved = await recordManualStudySession(
        block.subjectId,
        block.durationMinutes,
        block.type
      );

      if (saved) {
        setSavedBlockId(block.id);
        if (feedbackTimerRef.current !== null) {
          window.clearTimeout(feedbackTimerRef.current);
        }
        feedbackTimerRef.current = window.setTimeout(() => {
          setSavedBlockId(current => current === block.id ? null : current);
        }, 2500);
      }
    } finally {
      setSavingBlockId(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }} 
      key="cycle" 
      className="pb-20"
    >
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Ciclo de Estudos</h2>
          <p className="text-text-secondary text-sm sm:text-base">Monte seu plano flexível com orientação inteligente.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={generateCycle}
            disabled={isGenerating}
            className="w-full sm:w-auto bg-brand-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-primary/80 transition-all disabled:opacity-50"
          >
            {isGenerating ? <RotateCcw className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Gerar Ciclo Sugerido
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Settings */}
        <div className="lg:col-span-4 space-y-8">
          {/* Focus */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Target size={18} className="text-brand-primary" /> Foco do Estudo
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'teoria', label: 'Mais Teoria', desc: 'Foco em aprender novos conceitos.' },
                { id: 'questoes', label: 'Mais Questões', desc: 'Foco em fixação e prática.' },
                { id: 'revisao', label: 'Mais Revisão', desc: 'Foco em manutenção do conhecimento.' },
                { id: 'equilibrado', label: 'Equilibrado', desc: 'Mix ideal para evolução constante.' },
              ].map((focus) => (
                <button
                  key={focus.id}
                  onClick={() => updateCycleSettings({ cycleFocus: focus.id })}
                  className={cn(
                    "text-left p-4 rounded-xl border transition-all",
                    cycleFocus === focus.id ? "bg-brand-primary/10 border-brand-primary" : "bg-background border-border hover:border-brand-primary/30"
                  )}
                >
                  <div className={cn("text-sm font-bold mb-1", cycleFocus === focus.id ? "text-brand-primary" : "text-text-primary")}>{focus.label}</div>
                  <div className="text-[10px] text-text-secondary leading-tight">{focus.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <Clock size={18} className="text-brand-yellow" /> Disponibilidade
            </h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] text-text-secondary block mb-2 uppercase font-bold tracking-wider">Horas por Dia</label>
                <input 
                  type="range" min="30" max="480" step="30"
                  value={dailyTime}
                  onChange={(e) => updateCycleSettings({ dailyTimeMinutes: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-brand-primary"
                />
                <div className="flex justify-between mt-2 text-sm font-bold">
                  <span>{Math.floor(dailyTime / 60)}h {dailyTime % 60 > 0 ? `${dailyTime % 60}min` : ''}</span>
                  <span className="text-text-secondary">Máx: 8h</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-text-secondary block mb-2 uppercase font-bold tracking-wider">Blocos de Estudo</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <button
                      key={n}
                      onClick={() => updateCycleSettings({ blocksPerDay: n })}
                      className={cn(
                        "flex-1 py-2 rounded-lg border font-bold text-xs transition-all",
                        blocksPerDay === n ? "bg-brand-primary text-white border-brand-primary" : "bg-background border-border text-text-secondary hover:border-brand-primary/30"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Active Subjects */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-brand-blue" /> Matérias Ativas
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {subjects.map(sub => (
                <div 
                  key={sub.id} 
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all",
                    sub.status === 'active' ? "bg-brand-primary/5 border-brand-primary/20" : "bg-background border-border opacity-60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={sub.status === 'active'}
                      onChange={() => updateSubject(sub.id, { status: sub.status === 'active' ? 'optional' : 'active' })}
                      className="w-4 h-4 rounded border-border text-brand-primary focus:ring-brand-primary"
                    />
                    <div>
                      <div className="text-xs font-bold">{sub.name}</div>
                      <div className="text-[10px] text-text-secondary">G{sub.group} • {sub.studentLevel}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Cycle Preview */}
        <div className="lg:col-span-8 space-y-6">
          {/* Validation Alerts */}
          {getValidationAlerts().length > 0 && (
            <div className="space-y-2">
              {getValidationAlerts().map((alert, i) => (
                <div key={i} className={cn(
                  "p-4 rounded-xl border flex gap-3 items-center",
                  alert.type === 'warning' ? "bg-brand-red/5 border-brand-red/20 text-brand-red" : "bg-brand-blue/5 border-brand-blue/20 text-brand-blue"
                )}>
                  <AlertCircle size={18} />
                  <span className="text-xs font-medium">{alert.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Cycle Preview */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <History size={22} className="text-brand-primary" /> Prévia do Ciclo
              </h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => {
                    if (window.confirm('Deseja resetar o ciclo atual?')) {
                      cycleBlocks.forEach(b => deleteBlock(b.id));
                    }
                  }}
                  className="w-full sm:w-auto text-xs text-text-secondary hover:text-brand-red flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg hover:bg-brand-red/5 transition-all"
                >
                  <RotateCcw size={14} /> Resetar
                </button>
              </div>
            </div>

            {cycleBlocks.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-border rounded-full flex items-center justify-center mx-auto mb-4">
                  <History size={32} className="text-text-secondary" />
                </div>
                <h4 className="font-bold mb-2">Nenhum ciclo gerado</h4>
                <p className="text-sm text-text-secondary mb-6">Clique no botão acima para gerar uma sugestão inteligente.</p>
                <button 
                  onClick={generateCycle}
                  className="bg-brand-primary text-white px-6 py-2 rounded-xl font-bold text-sm"
                >
                  Gerar Agora
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cycleBlocks.map((block, i) => (
                  <motion.div 
                    layout
                    key={block.id} 
                    className="group bg-background border border-border rounded-xl p-5 hover:border-brand-primary/50 transition-all relative"
                  >
                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-brand-primary rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-lg">
                      {i + 1}
                    </div>
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <select 
                          value={block.subjectId}
                          onChange={(e) => {
                            const sub = subjects.find(s => s.id === e.target.value);
                            if (sub) updateBlock(block.id, { subjectId: sub.id, subjectName: sub.name });
                          }}
                          className="bg-transparent font-bold text-sm outline-none w-full appearance-none cursor-pointer hover:text-brand-primary"
                        >
                          {subjects.filter(s => s.status === 'active').map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <div className="flex gap-2 mt-1">
                          <select 
                            value={block.type}
                            onChange={(e) => updateBlock(block.id, { type: e.target.value })}
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded outline-none appearance-none cursor-pointer",
                              block.type === 'teoria' ? "bg-brand-blue/10 text-brand-blue" : 
                              block.type === 'questoes' ? "bg-brand-primary/10 text-brand-primary" : "bg-brand-orange/10 text-brand-orange"
                            )}
                          >
                            <option value="teoria">Teoria</option>
                            <option value="questoes">Questões</option>
                            <option value="revisao">Revisão</option>
                          </select>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-green/10 text-brand-green">
                            Manual
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => duplicateBlock(block)} className="p-1.5 hover:bg-card rounded-lg text-text-secondary hover:text-brand-blue" title="Duplicar">
                          <Plus size={14} />
                        </button>
                        <button onClick={() => deleteBlock(block.id)} className="p-1.5 hover:bg-card rounded-lg text-text-secondary hover:text-brand-red" title="Excluir">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-text-secondary" />
                        <input 
                          type="number" 
                          value={block.durationMinutes}
                          onChange={(e) => updateBlock(block.id, { durationMinutes: parseInt(e.target.value) })}
                          className="w-12 bg-transparent text-xs font-bold outline-none"
                        />
                        <span className="text-[10px] text-text-secondary">min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRecordBlock(block)}
                          disabled={savingBlockId === block.id || block.durationMinutes < 1}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all disabled:opacity-50",
                            savedBlockId === block.id
                              ? "bg-brand-green text-white"
                              : "bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white"
                          )}
                          title="Registrar como estudado"
                        >
                          <CheckCircle2 size={13} />
                          {savingBlockId === block.id
                            ? 'Registrando...'
                            : savedBlockId === block.id
                              ? 'Registrado'
                              : 'Registrar'}
                        </button>
                        <button 
                          disabled={i === 0}
                          onClick={() => {
                            const prev = cycleBlocks[i-1];
                            updateBlock(block.id, { order: i - 1 });
                            updateBlock(prev.id, { order: i });
                          }}
                          className="p-1 hover:text-brand-primary disabled:opacity-20"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button 
                          disabled={i === cycleBlocks.length - 1}
                          onClick={() => {
                            const next = cycleBlocks[i+1];
                            updateBlock(block.id, { order: i + 1 });
                            updateBlock(next.id, { order: i });
                          }}
                          className="p-1 hover:text-brand-primary disabled:opacity-20"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                <button 
                  onClick={() => {
                    const lastBlock = cycleBlocks[cycleBlocks.length - 1];
                    addCycleBlock(
                      lastBlock?.subjectId || subjects[0]?.id,
                      lastBlock?.subjectName || subjects[0]?.name,
                      'teoria',
                      60
                    );
                  }}
                  className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-text-secondary hover:border-brand-primary/50 hover:text-brand-primary transition-all"
                >
                  <Plus size={24} />
                  <span className="text-xs font-bold">Adicionar Bloco</span>
                </button>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-2xl p-6 flex gap-4 items-start">
            <div className="w-10 h-10 bg-brand-blue/10 rounded-xl flex items-center justify-center text-brand-blue shrink-0">
              <MessageSquare size={20} />
            </div>
            <div>
              <h4 className="font-bold text-brand-blue mb-1">Como funciona o Ciclo?</h4>
              <p className="text-xs text-brand-blue/80 leading-relaxed">
                Diferente de um cronograma fixo, o ciclo é uma sequência. Se você parar no bloco 2 hoje, amanhã começa pelo bloco 3. Isso evita o sentimento de "matéria acumulada" e garante que você estude tudo na proporção correta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
