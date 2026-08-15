import React from 'react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { WeeklyActivityData } from '../../hooks/useDashboardLogic';

interface WeeklyActivityChartProps {
  data: WeeklyActivityData;
}

type TooltipRow = {
  color: string;
  dataKey: string;
  value: number;
};

function WeeklyActivityTooltip({
  active,
  payload,
  label,
  subjectNames
}: {
  active?: boolean;
  payload?: Array<{ color?: string; dataKey?: string; value?: number }>;
  label?: string;
  subjectNames: Map<string, string>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const rows = payload
    .filter((item): item is TooltipRow => Boolean(item.dataKey) && Number(item.value) > 0)
    .map(item => ({
      color: item.color || 'var(--text-secondary)',
      dataKey: item.dataKey,
      value: Number(item.value)
    }))
    .sort((a, b) => b.value - a.value);

  if (rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-card px-3 py-2 shadow-xl">
      <p className="mb-2 text-xs font-semibold text-text-primary">{label}</p>
      <div className="space-y-1.5">
        {rows.map(row => (
          <div key={row.dataKey} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-text-secondary">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
              <span className="truncate">{subjectNames.get(row.dataKey) || 'Disciplina'}</span>
            </span>
            <span className="font-semibold text-text-primary">{row.value.toFixed(1)}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeeklyActivityChart({ data }: WeeklyActivityChartProps) {
  const subjectNames = React.useMemo(() => {
    return new Map(data.subjects.map(subject => [subject.subjectId, subject.name]));
  }, [data.subjects]);

  const topSubjects = data.subjects.slice(0, 3);
  const otherSubjects = data.subjects.slice(3);
  const otherSubjectsHours = otherSubjects.reduce((acc, subject) => acc + subject.totalHours, 0);

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-bold leading-none text-text-primary">{data.totalHours.toFixed(1)}h</p>
          <p className="mt-1 text-xs text-text-secondary">Últimos 7 dias corridos</p>
        </div>
        <p className="text-right text-xs text-text-secondary">
          {data.subjects.length} {data.subjects.length === 1 ? 'disciplina ativa' : 'disciplinas ativas'}
        </p>
      </div>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.days} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap="28%">
            <XAxis
              dataKey="name"
              stroke="var(--text-secondary)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              content={
                <WeeklyActivityTooltip subjectNames={subjectNames} />
              }
            />
            {data.subjects.map((subject, index) => (
              <Bar
                key={subject.subjectId}
                dataKey={subject.subjectId}
                stackId="weekly-activity"
                fill={subject.color}
                radius={index === data.subjects.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                maxBarSize={38}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-2">
        {topSubjects.map(subject => (
          <div key={subject.subjectId} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: subject.color }} />
              <span className="truncate text-text-secondary">{subject.name}</span>
            </span>
            <span className="font-semibold text-text-primary">{subject.totalHours.toFixed(1)}h</span>
          </div>
        ))}

        {otherSubjects.length > 0 && (
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              <span className="truncate text-text-secondary">+{otherSubjects.length} outras</span>
            </span>
            <span className="font-semibold text-text-primary">{otherSubjectsHours.toFixed(1)}h</span>
          </div>
        )}
      </div>
    </>
  );
}
