import React, { useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  getAttributeKeyFromSubject,
  RPG_ATTRIBUTE_INFO,
} from '../../utils/rpgProgressionModel';
import ProgressionDetailsSheet from '../rpg/ProgressionDetailsSheet';

const getMetricKey = (item) => item?.metricKey || getAttributeKeyFromSubject(item?.subject);

const TacticalRadar = ({ radarData, maxStat }) => {
  const [activeKey, setActiveKey] = useState(null);
  const activeItem = radarData.find((item) => getMetricKey(item) === activeKey);
  const displayRadarData = radarData.map((item) => {
    const info = RPG_ATTRIBUTE_INFO[getMetricKey(item)];
    return { ...item, publicSubject: info?.name || item.subject };
  });

  const getChartKey = (state) => getMetricKey(state?.activePayload?.[0]?.payload);

  return (
    <section className="space-y-4 rounded-3xl border-2 border-border bg-card p-5 shadow-sm transition-all duration-500">
      <header className="text-center">
        <h3 className="text-sm font-black uppercase tracking-widest text-primary">Mapeamento tático</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">Toque em um atributo para entender o valor.</p>
      </header>

      <div aria-hidden="true" className="relative h-64 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 320, height: 260 }}>
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="55%"
            data={displayRadarData}
            onClick={(state) => {
              const key = getChartKey(state);
              if (key) setActiveKey(key);
            }}
          >
            <PolarGrid stroke="var(--chart-grid)" />
            <PolarAngleAxis dataKey="publicSubject" tick={{ fill: 'var(--chart-text)', fontSize: 11, fontWeight: 800 }} />
            <PolarRadiusAxis angle={30} domain={[0, maxStat]} tick={false} axisLine={false} />
            <Radar
              name="Nível"
              dataKey="A"
              stroke="var(--chart-primary)"
              strokeWidth={3}
              fill="var(--chart-primary)"
              fillOpacity={0.3}
              dot={{ r: 3, fill: 'var(--chart-primary)', fillOpacity: 1 }}
              activeDot={{ r: 5, stroke: 'var(--chart-tooltip-bg)', strokeWidth: 2 }}
            />
            <Tooltip content={() => null} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 min-[380px]:grid-cols-3" aria-label="Atributos do mapeamento tático">
        {radarData.map((item) => {
          const key = getMetricKey(item);
          const info = RPG_ATTRIBUTE_INFO[key];
          if (!key || !info) return null;
          return (
            <button
              key={key}
              type="button"
              aria-haspopup="dialog"
              onClick={() => setActiveKey(key)}
              className="touch-target flex min-h-11 items-center justify-between gap-1 rounded-xl border border-border bg-input/40 px-2 text-left text-[10px] font-black text-main transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-xs"
            >
              <span>{info.name}</span>
              <span className="tabular-nums text-muted">{item.A}</span>
            </button>
          );
        })}
      </div>

      <ProgressionDetailsSheet
        isOpen={Boolean(activeKey && activeItem)}
        onClose={() => setActiveKey(null)}
        title={RPG_ATTRIBUTE_INFO[activeKey]?.name || 'Detalhes'}
        items={activeKey && activeItem ? [{
          key: activeKey,
          info: RPG_ATTRIBUTE_INFO[activeKey],
          valueLabel: activeKey === 'FOCUS' || activeKey === 'DISCIPLINE' ? `${activeItem.A} pontos` : `Nível ${activeItem.A}`,
        }] : []}
      />
    </section>
  );
};

export default TacticalRadar;
