import React from 'react';
import { motion } from 'framer-motion';
import { Plus, BookMarked, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Subject } from '../../types';
import { getSubjectBadgeClass, getSubjectColorClass, getSubjectColorId, SUBJECT_COLOR_OPTIONS } from '../../utils/subjectColors';

interface SubjectsTabProps {
  newSubjectName: string;
  setNewSubjectName: (name: string) => void;
  newSubjectGroup: number;
  setNewSubjectGroup: (group: number) => void;
  addCustomSubject: (color?: string) => void;
  subjects: Subject[];
  updateSubject: (id: string, updates: Partial<Subject>) => void;
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
  updateSubject,
  setSelectedSubjectForTopics,
  setActiveTab,
  moveSubject,
  toggleSubjectStatus,
  deleteSubject
}: SubjectsTabProps) {
  const [newSubjectColor, setNewSubjectColor] = React.useState(SUBJECT_COLOR_OPTIONS[0].id);
  const [openColorSubjectId, setOpenColorSubjectId] = React.useState<string | null>(null);

  const handleAddSubject = () => {
    addCustomSubject(newSubjectColor);
  };

  const handleUpdateSubjectColor = (subjectId: string, color: string) => {
    updateSubject(subjectId, { color });
    setOpenColorSubjectId(null);
  };

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
          <div className="flex items-center gap-1 bg-card border border-border rounded-xl px-2 py-2">
            {SUBJECT_COLOR_OPTIONS.map(option => (
              <button
                key={option.id}
                onClick={() => setNewSubjectColor(option.id)}
                className={cn(
                  "w-5 h-5 rounded-full border border-border transition-all",
                  option.className,
                  newSubjectColor === option.id && "ring-2 ring-brand-primary ring-offset-2 ring-offset-card"
                )}
                title={option.label}
                aria-label={`Selecionar cor ${option.label}`}
              />
            ))}
          </div>
          <button onClick={handleAddSubject} className="bg-brand-primary text-white p-2 rounded-xl hover:bg-brand-primary/80">
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
              {subjects.filter(subject => subject.group === groupNum).map((sub) => (
                <div key={sub.id} className={cn(
                  "p-4 rounded-xl border transition-all",
                  sub.status === 'active' ? "bg-background border-brand-primary/30" : "bg-background/50 border-border opacity-60"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn(
                      "inline-flex max-w-[170px] items-center rounded-full border px-2.5 py-1 text-xs font-bold shadow-sm",
                      getSubjectBadgeClass(sub)
                    )}>
                      <span className="truncate">{sub.name}</span>
                    </span>
                    <div className="relative flex gap-1">
                      <button
                        onClick={() => setOpenColorSubjectId(current => current === sub.id ? null : sub.id)}
                        className={cn(
                          "w-5 h-5 rounded-full border border-border shadow-sm transition-all hover:ring-2 hover:ring-brand-primary/50",
                          getSubjectColorClass(sub)
                        )}
                        title="Alterar cor"
                        aria-label={`Alterar cor de ${sub.name}`}
                      />
                      {openColorSubjectId === sub.id && (
                        <div className="absolute right-0 top-7 z-20 grid w-40 grid-cols-4 gap-2 rounded-lg border border-border bg-card p-3 shadow-lg">
                          {SUBJECT_COLOR_OPTIONS.map(option => (
                            <button
                              key={option.id}
                              onClick={() => handleUpdateSubjectColor(sub.id, option.id)}
                              className={cn(
                                "w-6 h-6 rounded-full border border-border transition-all",
                                option.className,
                                getSubjectColorId(sub) === option.id && "ring-2 ring-brand-primary ring-offset-2 ring-offset-card"
                              )}
                              title={`Usar ${option.label}`}
                              aria-label={`Usar cor ${option.label} em ${sub.name}`}
                            />
                          ))}
                        </div>
                      )}
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
                  <div className="mb-3 flex items-center justify-between text-xs text-text-secondary">
                    <span>Conteúdos concluídos</span>
                    <span className="font-bold">{sub.completedTopics || 0}/{sub.totalTopics || 0}</span>
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
