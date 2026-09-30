import React from 'react';
import { Activity, Ruler, Scale, Target } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const MetricCard = ({ icon, label, value, suffix = '', title }) => (
  <div className="min-w-0 rounded-2xl border border-border bg-input/50 p-2 text-center shadow-sm dark:bg-input">
    {icon}
    <p className="truncate text-[11px] font-black uppercase tracking-wide text-muted" title={title}>
      {label}
    </p>
    <p className="text-lg font-black text-main">
      {value}
      {value !== '--' && suffix && <span className="ml-0.5 text-[10px] font-bold text-muted">{suffix}</span>}
    </p>
  </div>
);

const BiometricsDashboard = ({
  age,
  currentWeight,
  latestBio,
  imc,
  rcq,
  donutData,
}) => {
  const bodyFat = latestBio?.bf ?? '--';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 min-[360px]:grid-cols-3 sm:grid-cols-5">
        <MetricCard icon={<Activity aria-hidden="true" className="mx-auto mb-1 text-primary/70" size={14} />} label="Idade" value={age} />
        <MetricCard icon={<Scale aria-hidden="true" className="mx-auto mb-1 text-primary/70" size={14} />} label="Peso" value={currentWeight} suffix="kg" />
        <MetricCard icon={<Ruler aria-hidden="true" className="mx-auto mb-1 text-primary/70" size={14} />} label="IMC" value={imc} title="Índice de Massa Corporal" />
        <MetricCard icon={<Target aria-hidden="true" className="mx-auto mb-1 text-primary/70" size={14} />} label="BF" value={bodyFat} suffix="%" title="Percentual de gordura corporal" />
        <MetricCard icon={<Activity aria-hidden="true" className="mx-auto mb-1 text-primary/70" size={14} />} label="RCQ" value={rcq} title="Relação Cintura-Quadril" />
      </div>

      {donutData && (
        <div className="flex items-center justify-between rounded-3xl border-2 border-border bg-card p-4 shadow-sm transition-colors">
          <div className="flex-1">
            <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-primary">Máquina Física</h3>
            <div className="space-y-2">
              {donutData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    aria-hidden="true"
                    className="h-3 w-3 rounded-full shadow-sm"
                    style={{ backgroundColor: entry.color }}
                  />
                  <div>
                    <p className="text-[11px] font-black uppercase leading-none tracking-wide text-muted">
                      {entry.name}{entry.name === 'Massa Gorda' ? ` (${bodyFat}%)` : ''}
                    </p>
                    <p className="text-sm font-black text-main">{entry.value} kg</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-28 w-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 96, height: 96 }}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', color: 'var(--text-main)', borderRadius: '10px', fontSize: '12px' }}
                  itemStyle={{ color: 'var(--chart-primary)', fontWeight: 'bold' }}
                  formatter={(value) => [`${value} kg`]}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-black text-main">{latestBio.weight}</span>
              <span className="-mt-1 text-[11px] font-bold uppercase text-muted">KG</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiometricsDashboard;
