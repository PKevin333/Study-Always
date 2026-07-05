import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Timer, 
  History, 
  Play, 
  BarChart3, 
  AlertCircle, 
  Sparkles 
} from 'lucide-react';
import { StatCard } from '../ui/StatCard';
import { cn } from '../../lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Subject, CycleBlock } from '../../types';

interface DashboardHomeProps {
  user: any;
  profile: any;
  avgAccuracy: number;
  totalHours: number;
  totalQuestions: number;
  sessions: any[];
  cycleBlocks: CycleBlock[];
  prioritySubjects: any[];
  setSelectedSubject: (id: string) => void;
  setActiveTab: (tab: string) => void;
  chartData: any[];
  setTimerActive: (active: boolean) => void;
  dailyAverage: number;
}

export function DashboardHome({
  user,
  profile,
  avgAccuracy,
  totalHours,
  totalQuestions,
  sessions,
  cycleBlocks,
  prioritySubjects,
  setSelectedSubject,
  setActiveTab,
  chartData,
  setTimerActive,
  dailyAverage
}: DashboardHomeProps) {
  const targetContest = profile?.targetExam || profile?.concursoAlvo || (profile?.area === 'controle' ? 'Tribunais de Contas' : 'Área Administrativa');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }} 
      key="dashboard" 
      className="pb-20"
    >
      <header className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Olá, {user?.displayName?.split(' ')[0]}! 👋</h1>
        <p className="text-text-secondary text-sm sm:text-base">Foco total na sua preparação para <span className="text-brand-primary font-bold">{targetContest}</span>.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
        <StatCard 
          icon={<TrendingUp className="text-brand-primary" />} 
          label="Desempenho" 
          value={`${avgAccuracy}%`} 
          trend={avgAccuracy > 0 ? "+2%" : ""} 
          color="green" 
        />
        <StatCard 
          icon={<Clock className="text-brand-blue" />} 
          label="Horas Totais" 
          value={`${totalHours.toFixed(1)}h`} 
          trend={totalHours > 0 ? "+15%" : ""} 
          color="blue" 
        />
        <StatCard 
          icon={<CheckCircle2 className="text-brand-orange" />} 
          label="Questões" 
          value={`${totalQuestions}`} 
          trend={totalQuestions > 10 ? "+10%" : ""} 
          color="orange" 
        />
        <StatCard 
          icon={<Timer className="text-brand-yellow" />} 
          label="Média Diária" 
          value={`${dailyAverage.toFixed(1)}h`} 
          trend={dailyAverage > 0 ? "+5%" : ""} 
          color="yellow" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <History size={18} className="text-brand-primary" /> Ciclo de Hoje
            </h3>
            <div className="space-y-4">
              {cycleBlocks.length > 0 ? (
                cycleBlocks.slice(0, 4).map((block, i) => (
                  <div key={block.id} className="flex items-center gap-4 p-3 rounded-xl bg-background border border-border group hover:border-brand-primary/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-xs">
                      {i + 1}º
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-sm font-bold truncate">{block.subjectName}</div>
                      <div className="flex gap-2 mt-0.5">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                          block.type === 'teoria' ? "bg-brand-blue/10 text-brand-blue" : 
                          block.type === 'questoes' ? "bg-brand-primary/10 text-brand-primary" : "bg-brand-orange/10 text-brand-orange"
                        )}>{block.type}</span>
                        <span className="text-[10px] text-text-secondary">{block.durationMinutes} min</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedSubject(block.subjectId);
                        setActiveTab('timer');
                        setTimerActive(true);
                      }}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-brand-primary/10 text-brand-primary rounded-lg transition-all"
                    >
                      <Play size={16} fill="currentColor" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center bg-brand-primary/5 rounded-2xl border border-dashed border-brand-primary/20">
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary mx-auto mb-3">
                    <History size={20} />
                  </div>
                  <p className="text-xs text-text-secondary mb-4 px-4">Seu ciclo de estudos ainda não foi configurado.</p>
                  <button 
                    onClick={() => setActiveTab('cycle')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-brand-primary/80 transition-all"
                  >
                    Gerar Ciclo Automático
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-blue" /> Atividade Semanal
            </h3>
            <div className="h-64">
              {sessions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorHoras" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis dataKey="name" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #262626', borderRadius: '8px' }}
                      itemStyle={{ color: '#3b82f6' }}
                    />
                    <Area type="monotone" dataKey="horas" stroke="#3b82f6" fillOpacity={1} fill="url(#colorHoras)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-12 h-12 bg-brand-blue/10 rounded-full flex items-center justify-center text-brand-blue mb-4">
                    <BarChart3 size={24} />
                  </div>
                  <p className="text-sm text-text-secondary">Seus dados aparecerão após sua primeira sessão de estudo.</p>
                  <p className="text-[10px] text-text-secondary/60 mt-1">Inicie um bloco no Plano do Dia para começar a registrar seu progresso.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <AlertCircle size={18} className="text-brand-yellow" /> Prioridades de Estudo
            </h3>
            <div className="space-y-4">
              {prioritySubjects.length > 0 ? (
                prioritySubjects.slice(0, 5).map((sub, i) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full", 
                        i === 0 ? "bg-brand-red" : sub.priorityScore > 150 ? "bg-brand-yellow" : "bg-brand-blue"
                      )} />
                      <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">{sub.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-text-secondary">{sub.accuracy}% acerto</span>
                      <span className={cn(
                        "text-xs font-bold",
                        i === 0 ? "text-brand-red" : "text-brand-primary"
                      )}>{Math.round(sub.priorityScore)} pts</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-xs text-text-secondary mb-4">Nenhuma prioridade identificada.</p>
                  <button 
                    onClick={() => setActiveTab('subjects')}
                    className="text-xs font-bold text-brand-primary hover:underline"
                  >
                    Adicionar Disciplinas
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl p-6">
            <h3 className="font-bold text-brand-primary mb-3 flex items-center gap-2">
              <Sparkles size={18} /> Dica de Estudo do Mentor
            </h3>
            <p className="text-sm text-brand-primary/90 leading-relaxed">
              <strong>Técnica do Ciclo:</strong> Nunca estude apenas uma matéria por dia. A alternância mantém seu cérebro em estado de alerta e melhora a retenção a longo prazo. Hoje, tente intercalar as 3 matérias sugeridas no seu ciclo acima.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
