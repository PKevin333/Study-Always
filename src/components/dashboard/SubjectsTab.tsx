import React from 'react';
import { motion } from 'framer-motion';
import { Plus, BookMarked, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Subject } from '../../types';
import { getSubjectColorClass, getSubjectColorId, SUBJECT_COLOR_OPTIONS } from '../../utils/subjectColors';
import { designTokens } from '../../styles/designTokens';

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

const groupConfig = {
  1: { label: 'Começar Agora', dot: 'bg-emerald-400' },
  2: { label: 'Incluir Depois', dot: 'bg-amber-400' },
  3: { label: 'Para Finalizar', dot: 'bg-sky-400' }
} as const;

const statusStyles = {
  active: 'bg-emerald-500/12 text-emerald-300',
  optional: 'bg-amber-500/12 text-amber-300',
  future: 'bg-white/8 text-text-secondary'
} as const;

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
      className={designTokens.page}
    >
      <div className={designTokens.pageHeader}>
        <h2 className={designTokens.pageTitle}>Gerenciar Disciplinas</h2>
        <div className={`flex w-full flex-wrap sm:w-auto ${designTokens.toolbarGap}`}>
          <input
            type="text"
            placeholder="Nova matéria..."
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition-all focus:border-brand-primary sm:flex-none"
          />
          <select
            value={newSubjectGroup}
            onChange={(e) => setNewSubjectGroup(parseInt(e.target.value, 10))}
            className="rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none"
          >
            <option value={1}>Grupo 1</option>
            <option value={2}>Grupo 2</option>
            <option value={3}>Grupo 3</option>
          </select>
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card px-2 py-2">
            {SUBJECT_COLOR_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setNewSubjectColor(option.id)}
                className={cn(
                  'h-5 w-5 rounded-full border border-white/10 transition-all',
                  option.className,
                  newSubjectColor === option.id && 'ring-2 ring-brand-primary ring-offset-2 ring-offset-card'
                )}
                title={option.label}
                aria-label={`Selecionar cor ${option.label}`}
              />
            ))}
          </div>
          <button
            onClick={handleAddSubject}
            className="rounded-xl bg-brand-primary p-2 text-white transition-colors hover:bg-brand-primary/80"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-3 ${designTokens.sectionGrid}`}>
        {[1, 2, 3].map((groupNum) => {
          const groupKey = groupNum as 1 | 2 | 3;
          const groupSubjects = subjects.filter((subject) => subject.group === groupNum);

          return (
            <div key={groupNum} className={designTokens.sectionCardDense}>
              <div className="mb-5 flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 rounded-full', groupConfig[groupKey].dot)} />
                <h3 className={designTokens.cardTitle}>{groupConfig[groupKey].label}</h3>
                <span className="text-sm text-text-secondary">({groupSubjects.length})</span>
              </div>

              <div className={`min-h-[220px] ${designTokens.listStack}`}>
                {groupSubjects.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background/25 px-4 py-8 text-center text-sm text-text-secondary">
                    Crie uma disciplina ou mova uma existente para este grupo.
                  </div>
                ) : (
                  groupSubjects.map((sub) => {
                    const progress = Math.max(0, sub.progressPercent || 0);
                    const completedTopics = sub.completedTopics || 0;
                    const totalTopics = sub.totalTopics || 0;

                    return (
                      <div
                        key={sub.id}
                        className={cn(
                          `${designTokens.itemCardCompact} bg-background/65 transition-all`,
                          sub.status === 'active' ? 'opacity-100' : 'opacity-75'
                        )}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex items-center gap-2">
                            <span className={cn('h-2.5 w-2.5 flex-shrink-0 rounded-full', getSubjectColorClass(sub))} />
                            <span className="truncate text-sm font-medium text-text-primary">{sub.name}</span>
                          </div>

                          <button
                            onClick={() => toggleSubjectStatus(sub.id, sub.status)}
                            className={cn(
                              'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                              statusStyles[sub.status]
                            )}
                            title="Alterar status"
                          >
                            {sub.status === 'active' ? 'Ativa' : sub.status === 'optional' ? 'Opcional' : 'Futura'}
                          </button>
                        </div>

                        <div className="mb-4 h-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={cn('h-full rounded-full transition-all', getSubjectColorClass(sub))}
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <p className="min-w-0 text-xs text-text-secondary">
                            {completedTopics} de {totalTopics} tópicos
                            {progress > 0 ? ` • ${Math.round(progress)}%` : ''}
                          </p>

                          <div className="relative flex items-center gap-1">
                            <button
                              onClick={() => setOpenColorSubjectId((current) => (current === sub.id ? null : sub.id))}
                              className={cn(
                                'h-[26px] w-[26px] rounded-full border border-white/10 transition-all hover:ring-2 hover:ring-brand-primary/40',
                                getSubjectColorClass(sub)
                              )}
                              title="Alterar cor"
                              aria-label={`Alterar cor de ${sub.name}`}
                            />
                            {openColorSubjectId === sub.id && (
                              <div className="absolute right-0 top-8 z-20 grid w-40 grid-cols-4 gap-2 rounded-lg border border-white/10 bg-card p-3 shadow-lg">
                                {SUBJECT_COLOR_OPTIONS.map((option) => (
                                  <button
                                    key={option.id}
                                    onClick={() => handleUpdateSubjectColor(sub.id, option.id)}
                                    className={cn(
                                      'h-6 w-6 rounded-full border border-white/10 transition-all',
                                      option.className,
                                      getSubjectColorId(sub) === option.id &&
                                        'ring-2 ring-brand-primary ring-offset-2 ring-offset-card'
                                    )}
                                    title={`Usar ${option.label}`}
                                    aria-label={`Usar cor ${option.label} em ${sub.name}`}
                                  />
                                ))}
                              </div>
                            )}
                            <button
                              onClick={() => moveSubject(sub.id, 'up')}
                              className="flex h-[26px] w-[26px] items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
                              title="Mover para cima"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              onClick={() => moveSubject(sub.id, 'down')}
                              className="flex h-[26px] w-[26px] items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
                              title="Mover para baixo"
                            >
                              <ChevronDown size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedSubjectForTopics(sub);
                                setActiveTab('topics');
                              }}
                              className="flex h-[26px] w-[26px] items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-white/5 hover:text-brand-blue"
                              title="Editar tópicos"
                            >
                              <BookMarked size={14} />
                            </button>
                            <button
                              onClick={() => deleteSubject(sub.id)}
                              className="flex h-[26px] w-[26px] items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-white/5 hover:text-brand-red"
                              title="Excluir disciplina"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
