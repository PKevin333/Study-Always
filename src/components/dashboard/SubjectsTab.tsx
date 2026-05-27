import React from 'react';
import { motion } from 'framer-motion';
import { Plus, BookMarked, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Subject } from '../../types';

interface SubjectsTabProps {
  newSubjectName: string;
  setNewSubjectName: (name: string) => void;
  newSubjectGroup: number;
  setNewSubjectGroup: (group: number) => void;
  addCustomSubject: () => void;
  subjects: Subject[];
  setSelectedSubjectForTopics: (sub: Subject) => void;
  setActiveTab: (tab: string) => void;
  moveSubject: (id: string, direction: 'up' | 'down') => void;
  toggleSubjectStatus: (id: string, currentStatus: string) => void;
  deleteSubject: (id: string) => void;
}

export function SubjectsTab({
  newSubjectName,
  setNewSubjectName,
  newSubjectGroup,
  setNewSubjectGroup,
  addCustomSubject,
  subjects,
  setSelectedSubjectForTopics,
  setActiveTab,
  moveSubject,
  toggleSubjectStatus,
  deleteSubject
}: SubjectsTabProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 10 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -10 }} 
      key="subjects"
      className="pb-20"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl font-bold">Gerenciar Disciplinas</h2>
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Nova matéria..." 
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            className="flex-1 sm:flex-none bg-card border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-brand-primary"
          />
          <select 
            value={newSubjectGroup}
            onChange={(e) => setNewSubjectGroup(parseInt(e.target.value))}
            className="bg-card border border-border rounded-xl px-4 py-2 text-sm outline-none"
          >
            <option value={1}>Grupo 1</option>
            <option value={2}>Grupo 2</option>
            <option value={3}>Grupo 3</option>
          </select>
          <button onClick={addCustomSubject} className="bg-brand-primary text-white p-2 rounded-xl hover:bg-brand-primary/80">
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(groupNum => (
          <div key={groupNum} className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold mb-6 flex items-center justify-between">
              <span className="text-text-primary">{groupNum === 1 ? 'Começar Agora' : groupNum === 2 ? 'Incluir Depois' : 'Para Finalizar'}</span>
              <span className="text-xs text-text-secondary bg-border px-2 py-1 rounded-full">G{groupNum}</span>
            </h3>
            <div className="space-y-3">
              {subjects.filter(s => s.group === groupNum).map((sub) => (
                <div key={sub.id} className={cn(
                  "p-4 rounded-xl border transition-all",
                  sub.status === 'active' ? "bg-background border-brand-primary/30" : "bg-background/50 border-border opacity-60"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm">{sub.name}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { setSelectedSubjectForTopics(sub); setActiveTab('topics'); }} className="p-1 hover:text-brand-blue" title="Ver Conteúdos"><BookMarked size={14} /></button>
                      <button onClick={() => moveSubject(sub.id, 'up')} className="p-1 hover:text-brand-primary"><ChevronUp size={14} /></button>
                      <button onClick={() => moveSubject(sub.id, 'down')} className="p-1 hover:text-brand-primary"><ChevronDown size={14} /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden mr-3">
                      <div className="h-full bg-brand-primary" style={{ width: `${sub.progressPercent || 0}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-text-secondary">{sub.progressPercent || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => toggleSubjectStatus(sub.id, sub.status)}
                      className={cn(
                        "text-[10px] uppercase font-bold px-2 py-1 rounded-full",
                        sub.status === 'active' ? "bg-brand-primary/10 text-brand-primary" : 
                        sub.status === 'optional' ? "bg-brand-yellow/10 text-brand-yellow" : "bg-text-secondary/10 text-text-secondary"
                      )}
                    >
                      {sub.status === 'active' ? 'Ativa' : sub.status === 'optional' ? 'Opcional' : 'Futura'}
                    </button>
                    <button onClick={() => deleteSubject(sub.id)} className="text-text-secondary hover:text-brand-red transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
