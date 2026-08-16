import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, Plus, Trash2, Target, MessageSquare } from 'lucide-react';
import { Subject, Topic } from '../../types';
import { cn } from '../../lib/utils';
import { designTokens } from '../../styles/designTokens';

interface TopicsTabProps {
  selectedSubjectForTopics: Subject | null;
  setActiveTab: (tab: string) => void;
  topics: Topic[];
  newTopicName: string;
  setNewTopicName: (name: string) => void;
  addTopic: () => Promise<boolean>;
  updateTopic: (id: string, updates: Partial<Topic>) => void;
  deleteTopic: (id: string) => void;
}

export function TopicsTab({
  selectedSubjectForTopics,
  setActiveTab,
  topics,
  newTopicName,
  setNewTopicName,
  addTopic,
  updateTopic,
  deleteTopic
}: TopicsTabProps) {
  // [FIX]: impede clique duplo/Enter repetido enquanto a escrita no Firestore está pendente.
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  if (!selectedSubjectForTopics) return null;

  const handleAddTopic = async () => {
    if (isAddingTopic) return;
    setIsAddingTopic(true);
    try {
      await addTopic();
    } finally {
      setIsAddingTopic(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.98 }} 
      key="topics" 
      className={designTokens.page}
    >
      <header className={designTokens.pageHeader}>
        <div>
          <button 
            onClick={() => setActiveTab('subjects')} 
            className="text-xs text-brand-primary font-bold flex items-center gap-1 mb-2 hover:underline"
          >
            <ChevronUp className="-rotate-90" size={14} /> Voltar para Disciplinas
          </button>
          <h2 className={designTokens.pageTitle}>{selectedSubjectForTopics.name}</h2>
          <p className={designTokens.pageIntro}>Controle de conteúdo e progresso detalhado.</p>
        </div>
        <div className="flex w-full items-center gap-6 rounded-2xl border border-border bg-card px-6 py-3 sm:w-auto">
          <div className="text-center flex-1 sm:flex-none">
            <div className={`${designTokens.microBadge} mb-1 text-text-secondary`}>Concluído</div>
            <div className="text-lg font-bold text-brand-primary">{selectedSubjectForTopics.progressPercent || 0}%</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center flex-1 sm:flex-none">
            <div className={`${designTokens.microBadge} mb-1 text-text-secondary`}>Tópicos</div>
            <div className="text-lg font-bold">{topics.filter(t => t.status === 'concluido').length}/{topics.length}</div>
          </div>
        </div>
      </header>

      <div className={`grid grid-cols-1 lg:grid-cols-3 ${designTokens.sectionGrid}`}>
        <div className={`lg:col-span-2 ${designTokens.pageSectionStack}`}>
          <div className={designTokens.sectionCard}>
            <h3 className={`${designTokens.cardTitle} mb-6 flex items-center gap-2`}>
              <Plus size={18} className="text-brand-primary" /> Adicionar Novo Tópico
            </h3>
            <div className={`flex ${designTokens.toolbarGap}`}>
              <input 
                type="text" 
                placeholder="Nome do tópico (ex: Crase, Regência...)"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTopic();
                  }
                }}
                disabled={isAddingTopic}
                className={`flex-1 ${designTokens.input}`}
              />
              <button 
                onClick={handleAddTopic}
                disabled={isAddingTopic}
                className="bg-brand-primary text-white px-6 rounded-xl font-bold hover:bg-brand-primary/80 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isAddingTopic ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </div>

          <div className={designTokens.listStack}>
            {topics.length === 0 ? (
              <div className="rounded-3xl border border-border border-dashed bg-card py-20 text-center text-text-secondary">
                Nenhum tópico cadastrado para esta matéria.
              </div>
            ) : (
              topics.map((topic, i) => (
                <div key={topic.id} className={cn(
                  `${designTokens.itemCard} flex items-center gap-4 bg-card transition-all`,
                  topic.status === 'concluido' ? "opacity-60" : "hover:border-brand-primary/30"
                )}>
                  <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-[10px] font-bold text-text-secondary shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input 
                      type="text" 
                      value={topic.name}
                      onChange={(e) => updateTopic(topic.id, { name: e.target.value })}
                      className="w-full truncate bg-transparent text-sm font-bold outline-none focus:text-brand-primary"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[
                        { id: 'nao_iniciado', label: 'Não Iniciado', color: 'text-text-secondary bg-text-secondary/10' },
                        { id: 'em_estudo', label: 'Em Estudo', color: 'text-brand-blue bg-brand-blue/10' },
                        { id: 'concluido', label: 'Concluído', color: 'text-brand-primary bg-brand-primary/10' },
                        { id: 'revisar', label: 'Revisar', color: 'text-brand-orange bg-brand-orange/10' },
                      ].map(s => (
                        <button 
                          key={s.id}
                          // [FIX]: envia só campos aceitos pelo contrato mínimo das regras de tópicos.
                          onClick={() => updateTopic(topic.id, { status: s.id as Topic['status'] })}
                          className={cn(
                            `${designTokens.microBadge} rounded px-2 py-1 transition-all`,
                            topic.status === s.id ? s.color : "text-text-secondary hover:bg-border"
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteTopic(topic.id)}
                    className="p-2 text-text-secondary hover:text-brand-red transition-all shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={designTokens.pageSectionStack}>
          <div className={designTokens.sectionCard}>
            <h3 className={`${designTokens.cardTitle} mb-4 flex items-center gap-2`}>
              <Target size={18} className="text-brand-primary" /> Status do Conteúdo
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-background border border-border">
                <span className="text-xs text-text-secondary">Pendente</span>
                <span className="text-sm font-bold text-brand-red">{topics.filter(t => t.status === 'nao_iniciado').length}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-background border border-border">
                <span className="text-xs text-text-secondary">Em Estudo</span>
                <span className="text-sm font-bold text-brand-blue">{topics.filter(t => t.status === 'em_estudo').length}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-background border border-border">
                <span className="text-xs text-text-secondary">Para Revisar</span>
                <span className="text-sm font-bold text-brand-orange">{topics.filter(t => t.status === 'revisar').length}</span>
              </div>
            </div>
          </div>

          <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-3xl p-6">
            <h4 className="font-bold text-brand-blue mb-2 flex items-center gap-2">
              <MessageSquare size={16} /> Dica de Mentor
            </h4>
            <p className="text-xs text-brand-blue/80 leading-relaxed">
              Não avance para o próximo tópico se ainda tiver muitas dúvidas no atual. O status "Revisar" é seu melhor amigo para garantir que a base está sólida.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
