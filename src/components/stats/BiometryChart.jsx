import React, { useState } from 'react';
import { AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Filter } from 'lucide-react';

const BiometryChart = ({ data }) => {
  const [bioChartFilter, setBioChartFilter] = useState('macro');


  const renderBioChart = () => {
    switch (bioChartFilter) {
      case 'arms':
        return (
          <>
            <Area type="monotone" dataKey="arm_l" name="Braço Esq." stroke="var(--chart-primary)" fill="var(--chart-primary)" fillOpacity={0.2} connectNulls />
            <Area type="monotone" dataKey="arm_r" name="Braço Dir." stroke="var(--chart-secondary)" fill="var(--chart-secondary)" fillOpacity={0.2} connectNulls />
          </>
        );
      case 'legs':
        return (
          <>
            <Area type="monotone" dataKey="leg_l" name="Perna Esq." stroke="var(--chart-primary)" fill="var(--chart-primary)" fillOpacity={0.2} connectNulls />
            <Area type="monotone" dataKey="leg_r" name="Perna Dir." stroke="var(--chart-secondary)" fill="var(--chart-secondary)" fillOpacity={0.2} connectNulls />
          </>
        );
      case 'calves':
        return (
          <>
            <Area type="monotone" dataKey="calf_l" name="Panturrilha Esq." stroke="var(--chart-primary)" fill="var(--chart-primary)" fillOpacity={0.2} connectNulls />
            <Area type="monotone" dataKey="calf_r" name="Panturrilha Dir." stroke="var(--chart-secondary)" fill="var(--chart-secondary)" fillOpacity={0.2} connectNulls />
          </>
        );
      case 'trunk':
        return (
          <>
            <Line type="monotone" dataKey="peito" name="Peito" stroke="var(--chart-primary)" strokeWidth={2} dot={{ r: 2 }} connectNulls />
            <Line type="monotone" dataKey="ombro" name="Ombro" stroke="var(--text-main)" strokeWidth={2} dot={{ r: 2 }} connectNulls />
            <Line type="monotone" dataKey="cintura" name="Cintura" stroke="var(--chart-secondary)" strokeWidth={2} dot={{ r: 2 }} connectNulls />
            <Line type="monotone" dataKey="quadril" name="Quadril" stroke="var(--chart-warning)" strokeWidth={2} dot={{ r: 2 }} connectNulls />
          </>
        );
      case 'macro':
      default:
        return (
          <>
            <Area type="monotone" dataKey="peso" name="Peso Bruto" stroke="var(--text-muted)" fill="var(--text-muted)" fillOpacity={0.1} connectNulls />
            <Line type="monotone" dataKey="lean_mass" name="Massa Magra" stroke="var(--chart-success)" strokeWidth={3} dot={{ r: 3 }} connectNulls />
          </>
        );
    }
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-muted uppercase tracking-[0.16em] flex items-center gap-2">
              <Activity size={12} className="text-primary" /> PROGRESSÃO BIOMÉTRICA
          </h3>
          
          <div className="relative">
            <select 
              value={bioChartFilter} 
              onChange={(e) => setBioChartFilter(e.target.value)}
              className="min-h-11 appearance-none bg-input border border-primary/50 text-primary text-xs font-black uppercase tracking-wide py-1 pl-3 pr-8 rounded-lg outline-none focus:border-primary cursor-pointer"
            >
              <option value="macro">Peso vs M. Magra</option>
              <option value="arms">Braços (Esq/Dir)</option>
              <option value="legs">Pernas (Esq/Dir)</option>
              <option value="calves">Panturrilhas (Esq/Dir)</option>
              <option value="trunk">Tronco</option>
            </select>
            <Filter size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
          </div>
      </div>

      {/* Aumentamos para h-56 para manter o padrão e evitar sumiço no celular */}
      <div className="bg-card border border-border p-3 rounded-2xl h-56 w-full min-w-0 backdrop-blur-md relative shadow-inner overflow-hidden">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 320, height: 200 }}>
            <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" stroke="var(--chart-text)" fontSize={11} tickLine={false} />
              <YAxis domain={['auto', 'auto']} stroke="var(--chart-text)" fontSize={11} tickLine={false} width={42} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', color: 'var(--text-main)', fontSize: '12px', borderRadius: '10px' }}
                labelStyle={{ color: 'var(--chart-text)' }}
                itemStyle={{ fontWeight: 'bold', color: 'var(--text-main)' }}
                formatter={(value, name) => [`${value} kg/cm`, name]}
              />
              {renderBioChart()}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted text-xs uppercase text-center px-4 border-2 border-dashed border-border rounded-xl">
            Nenhum dado biométrico registrado no Dossiê ainda.
          </div>
        )}
      </div>
    </section>
  );
};

export default BiometryChart;
