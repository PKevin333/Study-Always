import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  LineChart as LineChartIcon,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  XCircle
} from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Subject, QuestionRecord } from '../../types';
import { cn } from '../../lib/utils';

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

type PeriodFilter = 'today' | '7d' | '30d' | 'all';

const periodOptions: { id: PeriodFilter; label: string }[] = [
  { id: 'today', label: 'Hoje' },
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
  { id: 'all', label: 'Sempre' }
];

const parseRecordDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatShortDate = (value: string) => {
  const parsed = parseRecordDate(value);
  if (!parsed) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(parsed);
};

const formatFullDate = (value: string) => {
  const parsed = parseRecordDate(value);
  if (!parsed) return 'Data não disponível';
  return new Intl.DateTimeFormat('pt-BR').format(parsed);
};

const getRecordAccuracy = (record: QuestionRecord) => {
  return record.total > 0 ? Math.round((record.correct / record.total) * 100) : 0;
};

const getAccuracyClass = (accuracy: number) => {
  if (accuracy >= 70) return 'text-brand-green';
  if (accuracy >= 50) return 'text-brand-yellow';
  return 'text-brand-red';
};

const filterRecordsByPeriod = (records: QuestionRecord[], period: PeriodFilter) => {
  if (period === 'all') return records;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = new Date(todayStart);

  if (period === 'today') {
    return records.filter(record => {
      const date = parseRecordDate(record.date);
      return date ? date >= todayStart : false;
    });
  }

  startDate.setDate(todayStart.getDate() - (period === '7d' ? 6 : 29));
  return records.filter(record => {
    const date = parseRecordDate(record.date);
    return date ? date >= startDate : false;
  });
};

function StatCard({
  label,
  value,
  icon,
  tone = 'default'
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: 'default' | 'green' | 'red' | 'primary';
}) {
  const toneClass = {
    default: 'text-text-secondary bg-background border-border',
    green: 'text-brand-green bg-brand-green/5 border-brand-green/10',
    red: 'text-brand-red bg-brand-red/5 border-brand-red/10',
    primary: 'text-brand-primary bg-brand-primary/5 border-brand-primary/10'
  }[tone];

  return (
    <div className={cn('rounded-2xl border p-4', toneClass)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-black text-text-primary">{value}</div>
    </div>
  );
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
  const [periodFilter, setPeriodFilter] = React.useState<PeriodFilter>('all');
  const isInvalidRecord = !newRecordSubject || !newRecordTopic.trim() || newRecordTotal <= 0 || newRecordCorrect < 0 || newRecordCorrect > newRecordTotal;

  const filteredRecords = React.useMemo(() => {
    return filterRecordsByPeriod(questionRecords, periodFilter);
  }, [questionRecords, periodFilter]);

  const totals = React.useMemo(() => {
    const total = filteredRecords.reduce((acc, record) => acc + record.total, 0);
    const correct = filteredRecords.reduce((acc, record) => acc + record.correct, 0);
    const errors = Math.max(0, total - correct);
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return { total, correct, errors, accuracy };
  }, [filteredRecords]);

  const chartData = React.useMemo(() => {
    const grouped = new Map<string, { date: string; total: number; correct: number }>();

    filteredRecords.forEach(record => {
      const parsed = parseRecordDate(record.date);
      const key = parsed ? parsed.toISOString().slice(0, 10) : record.date;
      const current = grouped.get(key) || { date: key, total: 0, correct: 0 };
      current.total += record.total;
      current.correct += record.correct;
      grouped.set(key, current);
    });

    return Array.from(grouped.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => ({
        name: formatShortDate(item.date),
        total: item.total,
        accuracy: item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0
      }));
  }, [filteredRecords]);

  const subjectHighlights = React.useMemo(() => {
    const grouped = new Map<string, { subjectName: string; total: number; correct: number }>();

    filteredRecords.forEach(record => {
      const current = grouped.get(record.subjectId) || {
        subjectName: record.subjectName,
        total: 0,
        correct: 0
      };
      current.total += record.total;
      current.correct += record.correct;
      grouped.set(record.subjectId, current);
    });

    return Array.from(grouped.values())
      .map(item => ({
        ...item,
        accuracy: item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);
  }, [filteredRecords]);

  const pieData = [
    { name: 'Acertos', value: totals.correct, color: '#22c55e' },
    { name: 'Erros', value: totals.errors, color: '#ef4444' }
  ].filter(item => item.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      key="performance"
      className="pb-20"
    >
      <header className="mb-8 flex flex-col xl:flex-row xl:items-end justify-between gap-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Desempenho em Questões</h2>
          <p className="text-text-secondary text-sm sm:text-base">
            Registre resoluções, acompanhe acertos e identifique onde seu rendimento está evoluindo.
          </p>
        </div>

        <div className="inline-flex bg-card border border-border rounded-2xl p-1 overflow-x-auto max-w-full">
          {periodOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setPeriodFilter(option.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all',
                periodFilter === option.id
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Questões" value={totals.total} icon={<ClipboardList size={18} />} tone="primary" />
        <StatCard label="Acertos" value={totals.correct} icon={<CheckCircle2 size={18} />} tone="green" />
        <StatCard label="Erros" value={totals.errors} icon={<XCircle size={18} />} tone="red" />
        <StatCard label="Média" value={`${totals.accuracy}%`} icon={<Target size={18} />} />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-6">
          <section className="bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  <Plus size={18} className="text-brand-primary" /> Novo Registro de Questões
                </h3>
                <p className="text-xs text-text-secondary mt-1">Registre uma lista, simulado ou bloco de questões resolvido.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <select
                value={newRecordSubject}
                onChange={(e) => setNewRecordSubject(e.target.value)}
                className="bg-background border border-border rounded-2xl px-4 py-3 outline-none focus:border-brand-primary transition-all"
              >
                <option value="">Selecione a Disciplina</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Assunto (ex: Crase, Licitações...)"
                value={newRecordTopic}
                onChange={(e) => setNewRecordTopic(e.target.value)}
                className="bg-background border border-border rounded-2xl px-4 py-3 outline-none focus:border-brand-primary transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-2">Total de Questões</label>
                <input
                  type="number"
                  min={0}
                  value={newRecordTotal}
                  onChange={(e) => setNewRecordTotal(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-background border border-border rounded-2xl px-4 py-3 outline-none focus:border-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-2">Acertos</label>
                <input
                  type="number"
                  min={0}
                  value={newRecordCorrect}
                  onChange={(e) => setNewRecordCorrect(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-background border border-border rounded-2xl px-4 py-3 outline-none focus:border-brand-primary transition-all"
                />
              </div>
            </div>

            <button
              onClick={addQuestionRecord}
              disabled={savingRecord || isInvalidRecord}
              className="w-full bg-brand-primary text-white py-3.5 rounded-2xl font-bold hover:bg-brand-primary/80 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20"
            >
              <Plus size={20} /> {savingRecord ? 'Salvando...' : 'Registrar Desempenho'}
            </button>
          </section>

          <section className="bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  <LineChartIcon size={18} className="text-brand-primary" /> Evolução no Período
                </h3>
                <p className="text-xs text-text-secondary mt-1">Volume resolvido e percentual de acerto por data.</p>
              </div>
              <span className="text-xs font-bold text-text-secondary">{filteredRecords.length} registros</span>
            </div>

            <div className="h-72">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--card-color)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                      labelStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Line type="monotone" dataKey="total" name="Questões" stroke="var(--brand-primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="accuracy" name="% Acerto" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary">
                  <BarChart3 size={34} className="mb-3 text-brand-primary" />
                  <p className="text-sm">Sem dados para o período selecionado.</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-sm">
            <h3 className="font-bold mb-5">Histórico Recente</h3>
            <div className="space-y-3">
              {filteredRecords.length === 0 ? (
                <div className="py-10 text-center text-text-secondary">Nenhum registro encontrado para este período.</div>
              ) : (
                filteredRecords.map(record => {
                  const accuracy = getRecordAccuracy(record);

                  return (
                    <div
                      key={record.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-background border border-border hover:border-brand-primary/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-[10px] text-brand-primary font-bold uppercase tracking-wider px-2 py-1 rounded bg-brand-primary/10">
                            {record.subjectName}
                          </span>
                          <span className="text-[10px] text-text-secondary">{formatFullDate(record.date)}</span>
                        </div>
                        <div className="font-bold text-sm truncate">{record.topic}</div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-5">
                        <div className="text-right">
                          <div className="text-sm font-bold">{record.correct}/{record.total}</div>
                          <div className={cn('text-xs font-bold', getAccuracyClass(accuracy))}>{accuracy}%</div>
                        </div>
                        <button
                          onClick={() => deleteQuestionRecord(record.id, record.subjectId, record.total)}
                          className="p-2 rounded-lg text-text-secondary hover:text-brand-red hover:bg-brand-red/10 transition-colors"
                          title="Excluir registro"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <aside className="xl:col-span-4 space-y-6">
          <section className="bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-sm">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-primary" /> Visão Geral
            </h3>

            <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
              <div className="h-36">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" innerRadius={42} outerRadius={62} paddingAngle={3}>
                        {pieData.map(item => (
                          <Cell key={item.name} fill={item.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full rounded-full border border-dashed border-border flex items-center justify-center text-xs text-text-secondary">
                    0%
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs text-text-secondary mb-1">Média de Acerto</div>
                <div className="text-4xl font-black text-brand-primary mb-4">{totals.accuracy}%</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Acertos</span>
                    <span className="font-bold text-brand-green">{totals.correct}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Erros</span>
                    <span className="font-bold text-brand-red">{totals.errors}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-sm">
            <h3 className="font-bold mb-5">Disciplinas Mais Praticadas</h3>
            <div className="space-y-4">
              {subjectHighlights.length > 0 ? (
                subjectHighlights.map(item => (
                  <div key={item.subjectName}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-sm font-bold truncate">{item.subjectName}</span>
                      <span className={cn('text-xs font-bold', getAccuracyClass(item.accuracy))}>{item.accuracy}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-background overflow-hidden border border-border">
                      <div
                        className="h-full bg-brand-primary rounded-full"
                        style={{ width: `${Math.min(100, item.accuracy)}%` }}
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-text-secondary">{item.total} questões resolvidas</div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-sm text-text-secondary">
                  Registre questões para ver suas disciplinas mais praticadas.
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </motion.div>
  );
}
