import React, { useId, useState } from 'react';
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
import ProgressionDetails from '../rpg/ProgressionDetails';

const getMetricKey = (item) => item?.metricKey || getAttributeKeyFromSubject(item?.subject);

const TacticalRadar = ({ radarData, maxStat }) => {
  const detailsId = useId();
  const [pinnedKey, setPinnedKey] = useState(null);
  const [previewKey, setPreviewKey] = useState(null);
  const activeKey = previewKey || pinnedKey;
  const activeItem = radarData.find((item) => getMetricKey(item) === activeKey);

  const togglePinned = (key) => {
    const closing = pinnedKey === key;
    setPinnedKey(closing ? null : key);
    if (closing) setPreviewKey(null);
  };

  const getChartKey = (state) => getMetricKey(state?.activePayload?.[0]?.payload);

  return (
    <section
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        setPinnedKey(null);
        setPreviewKey(null);
      }}
      className="space-y-4 rounded-3xl border-2 border-border bg-card p-5 shadow-sm transition-all duration-500"
    >
      <header className="text-center">
        <h3 className="text-sm font-black uppercase tracking-widest text-primary">Mapeamento tático</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">Toque em um atributo, passe o mouse ou use Tab para entender o valor.</p>
      </header>

      <div aria-hidden="true" className="relative h-64 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 320, height: 260 }}>
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="55%"
            data={radarData}
            onMouseMove={(state) => {
              const key = getChartKey(state);
              if (key) setPreviewKey(key);
            }}
            onMouseLeave={() => setPreviewKey(null)}
            onClick={(state) => {
              const key = getChartKey(state);
              if (key) setPinnedKey((current) => current === key ? null : key);
            }}
          >
            <PolarGrid stroke="var(--chart-grid)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--chart-text)', fontSize: 11, fontWeight: 800 }} />
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
          const active = activeKey === key;
          if (!key || !info) return null;
          return (
            <button
              key={key}
              type="button"
              aria-expanded={active}
              aria-controls={detailsId}
              onClick={() => togglePinned(key)}
              onFocus={() => setPreviewKey(key)}
              onBlur={() => setPreviewKey((current) => current === key ? null : current)}
              onPointerEnter={(event) => event.pointerType === 'mouse' && setPreviewKey(key)}
              onPointerLeave={(event) => event.pointerType === 'mouse' && setPreviewKey((current) => current === key ? null : current)}
              className={`touch-target flex min-h-11 items-center justify-between gap-1 rounded-xl border px-2 text-left text-[10px] font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-xs ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-input/40 text-main hover:border-primary/40'}`}
            >
              <span>{item.subject}</span>
              <span className="tabular-nums text-muted">{item.A}</span>
            </button>
          );
        })}
      </div>

      {activeKey && activeItem && (
        <div aria-live="polite">
          <ProgressionDetails
            id={detailsId}
            info={RPG_ATTRIBUTE_INFO[activeKey]}
            valueLabel={activeKey === 'FOCUS' || activeKey === 'DISCIPLINE' ? `${activeItem.A} pontos` : `Nível ${activeItem.A}`}
          />
        </div>
      )}
    </section>
  );
};

export default TacticalRadar;
