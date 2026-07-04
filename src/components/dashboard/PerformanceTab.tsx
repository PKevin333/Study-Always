import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import { Subject, QuestionRecord } from '../../types';

interface PerformanceTabProps {
  newRecordSubject: string;
  setNewRecordSubject: (id: string) => void;
  newRecordTopic: string;
  setNewRecordTopic: (topic: string) => void;
  newRecordTotal: number;
  setNewRecordTotal: (total: number) => void;
  newRecordCorrect: number;
  setNewRecordCorrect: (correct: number) => void;
  addQuestionRecord: () => Promise<boolean>;
  savingRecord: boolean;
  subjects: Subject[];
  questionRecords: QuestionRecord[];
  deleteQuestionRecord: (id: string, subjectId: string, total: number) => void;
}

export function PerformanceTab({
  newRecordSubject,
  setNewRecordSubject,
  newRecordTopic,
  setNewRecordTopic,
  newRecordTotal,
  setNewRecordTotal,
  newRecordCorrect,
  setNewRecordCorrect,
  addQuestionRecord,
  savingRecord,
  subjects,
  questionRecords,
  deleteQuestionRecord
}: PerformanceTabProps) {
  const isInvalidRecord = !newRecordSubject || !newRecordTopic.trim() || newRecordTotal <= 0 || newRecordCorrect < 0 || newRecordCorrect > newRecordTotal;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }} 
      key="performance" 
      className="pb-20"
    >
      <header className="mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Desempenho em Questões</h2>
        <p className="text-text-secondary text-sm sm:text-base">Registre e acompanhe sua evolução e taxa de acerto.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold mb-4">Novo Registro de Questões</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <select 
                value={newRecordSubject}
                onChange={(e) => setNewRecordSubject(e.target.value)}
                className="bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-brand-primary"
              >
                <option value="">Selecione a Disciplina</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input 
                type="text" 
                placeholder="Assunto (ex: Crase, Licitações...)"
                value={newRecordTopic}
                onChange={(e) => setNewRecordTopic(e.target.value)}
                className="bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-brand-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Total de Questões</label>
                <input 
                  type="number" 
                  value={newRecordTotal}
                  onChange={(e) => setNewRecordTotal(parseInt(e.target.value) || 0)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Acertos</label>
                <input 
                  type="number" 
                  value={newRecordCorrect}
                  onChange={(e) => setNewRecordCorrect(parseInt(e.target.value) || 0)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-brand-primary"
                />
              </div>
            </div>
            <button 
              onClick={addQuestionRecord}
              // [FIX]: evita registros duplicados por cliques consecutivos enquanto a escrita no Firestore está pendente.
              disabled={savingRecord || isInvalidRecord}
              className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold hover:bg-brand-primary/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={20} /> {savingRecord ? 'Salvando...' : 'Registrar Desempenho'}
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold mb-6">Histórico Recente</h3>
            <div className="space-y-4">
              {questionRecords.length === 0 ? (
                <div className="py-10 text-center text-text-secondary">Nenhum registro encontrado.</div>
              ) : (
                questionRecords.map(record => (
                  <div key={record.id} className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
                    <div className="flex-1">
                      <div className="text-xs text-brand-primary font-bold uppercase mb-1">{record.subjectName}</div>
                      <div className="font-bold text-sm mb-1">{record.topic}</div>
                      <div className="text-[10px] text-text-secondary">{new Date(record.date).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm font-bold">{record.correct}/{record.total}</div>
                        {(() => {
                          const accuracy = record.total > 0 ? Math.round((record.correct / record.total) * 100) : 0;
                          return (
                            <div className={`text-xs font-bold ${accuracy >= 70 ? 'text-brand-green' : accuracy >= 50 ? 'text-brand-yellow' : 'text-brand-red'}`}>
                              {accuracy}%
                            </div>
                          );
                        })()}
                      </div>
                      <button onClick={() => deleteQuestionRecord(record.id, record.subjectId, record.total)} className="text-text-secondary hover:text-brand-red transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-primary" /> Visão Geral
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs text-text-secondary mb-1">Média de Acerto</div>
                  <div className="text-3xl font-bold text-brand-primary">
                    {questionRecords.length > 0 
                      ? Math.round(questionRecords.reduce((acc, r) => acc + (r.total > 0 ? (r.correct / r.total) * 100 : 0), 0) / questionRecords.length) 
                      : 0}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-secondary mb-1">Total Questões</div>
                  <div className="text-xl font-bold">
                    {questionRecords.reduce((acc, r) => acc + r.total, 0)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
                <div className="p-3 rounded-xl bg-brand-green/5 border border-brand-green/10">
                  <div className="flex items-center gap-2 text-brand-green mb-1">
                    <CheckCircle2 size={14} />
                    <span className="text-[10px] font-bold uppercase">Acertos</span>
                  </div>
                  <div className="text-lg font-bold">{questionRecords.reduce((acc, r) => acc + r.correct, 0)}</div>
                </div>
                <div className="p-3 rounded-xl bg-brand-red/5 border border-brand-red/10">
                  <div className="flex items-center gap-2 text-brand-red mb-1">
                    <XCircle size={14} />
                    <span className="text-[10px] font-bold uppercase">Erros</span>
                  </div>
                  <div className="text-lg font-bold">{questionRecords.reduce((acc, r) => acc + r.total - r.correct, 0)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
