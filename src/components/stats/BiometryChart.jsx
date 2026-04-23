import React, { useState } from 'react';
import { AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Filter } from 'lucide-react';

const BiometryChart = ({ data }) => {
  const [bioChartFilter, setBioChartFilter] = useState('macro');

  // 🔥 Lixo jogado fora: O gráfico agora é 100% blindado com CSS nativo!

  const renderBioChart = () => {
    switch (bioChartFilter) {
      case 'arms':
        return (
          <>
            <Area type="monotone" dataKey="arm_l" name="Braço Esq." stroke="rgb(var(--primary))" fill="rgb(var(--primary))" fillOpacity={0.2} connectNulls />
            <Area type="monotone" dataKey="arm_r" name="Braço Dir." stroke="rgb(var(--secondary))" fill="rgb(var(--secondary))" fillOpacity={0.2} connectNulls />
          </>
        );
      case 'legs':
        return (
          <>
            <Area type="monotone" dataKey="leg_l" name="Perna Esq." stroke="rgb(var(--primary))" fill="rgb(var(--primary))" fillOpacity={0.2} connectNulls />
            <Area type="monotone" dataKey="leg_r" name="Perna Dir." stroke="rgb(var(--secondary))" fill="rgb(var(--secondary))" fillOpacity={0.2} connectNulls />
          </>
        );
      case 'calves':
        return (
          <>
            <Area type="monotone" dataKey="calf_l" name="Panturrilha Esq." stroke="rgb(var(--primary))" fill="rgb(var(--primary))" fillOpacity={0.2} connectNulls />
            <Area type="monotone" dataKey="calf_r" name="Panturrilha Dir." stroke="rgb(var(--secondary))" fill="rgb(var(--secondary))" fillOpacity={0.2} connectNulls />
          </>
        );
      case 'trunk':
        return (
          <>
            <Line type="monotone" dataKey="peito" name="Peito" stroke="rgb(var(--primary))" strokeWidth={2} dot={{ r: 2 }} connectNulls />
            <Line type="monotone" dataKey="ombro" name="Ombro" stroke="var(--text-main)" strokeWidth={2} dot={{ r: 2 }} connectNulls />
            <Line type="monotone" dataKey="cintura" name="Cintura" stroke="rgb(var(--secondary))" strokeWidth={2} dot={{ r: 2 }} connectNulls />
            <Line type="monotone" dataKey="quadril" name="Quadril" stroke="rgb(var(--warning))" strokeWidth={2} dot={{ r: 2 }} connectNulls />
          </>
        );
      case 'macro':
      default:
        return (
          <>
            <Area type="monotone" dataKey="peso" name="Peso Bruto" stroke="var(--text-muted)" fill="var(--text-muted)" fillOpacity={0.1} connectNulls />
            <Line type="monotone" dataKey="lean_mass" name="Massa Magra" stroke="rgb(var(--success))" strokeWidth={3} dot={{ r: 3 }} connectNulls />
          </>
        );
    }
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
              <Activity size={12} className="text-primary" /> PROGRESSÃO BIOMÉTRICA
          </h3>
          
          <div className="relative">
            <select 
              value={bioChartFilter} 
              onChange={(e) => setBioChartFilter(e.target.value)}
              className="appearance-none bg-input border border-primary/50 text-primary text-[9px] font-black uppercase tracking-widest py-1 pl-2 pr-6 rounded outline-none focus:border-primary cursor-pointer"
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
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
              <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" fontSize={10} tickLine={false} width={30} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(var(--primary), 0.5)', fontSize: '10px', borderRadius: '8px' }} 
                itemStyle={{ fontWeight: 'bold', color: 'var(--text-main)' }}
                formatter={(value, name) => [`${value} kg/cm`, name]}
              />
              {renderBioChart()}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted text-[10px] uppercase opacity-50 text-center px-4 border-2 border-dashed border-border rounded-xl">
            Nenhum dado biométrico registrado no Dossiê ainda.
          </div>
        )}
      </div>
    </section>
  );
};

export default BiometryChart;