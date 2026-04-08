import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Flame } from 'lucide-react';

const VolumeChart = ({ data }) => {
  // Detecta o tema para sincronizar as cores do Recharts
  const theme = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') || 'driver' : 'driver';
  
  const colors = {
    driver: { p: '#22d3ee', t: '#94a3b8', bg: '#0f172a' }, 
    light:  { p: '#0284c7', t: '#475569', bg: '#ffffff' }  
  }[theme] || { p: '#22d3ee', t: '#94a3b8', bg: '#0f172a' };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
          <Flame size={12} className="text-primary" /> TONELAGEM (VOLUME TOTAL)
        </h3>
      </div>
      
      <div className="bg-card border border-border p-3 rounded-2xl h-48 w-full min-w-0 backdrop-blur-md relative shadow-inner overflow-hidden">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <XAxis 
                dataKey="date" 
                stroke={colors.t} 
                fontSize={10} 
                tickLine={false} 
              />
              <YAxis 
                stroke={colors.t} 
                fontSize={10} 
                tickLine={false} 
                width={35} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: colors.bg, 
                  border: `1px solid ${colors.p}`, 
                  fontSize: '10px',
                  borderRadius: '8px'
                }}
                itemStyle={{ color: colors.p, fontWeight: 'bold' }}
                formatter={(value) => [`${value} kg`, 'Volume']}
              />
              {/* Gráfico em estilo 'step' para mostrar os picos de esforço de cada treino */}
              <Area 
                type="stepAfter" 
                dataKey="volume" 
                stroke={colors.p} 
                fill={colors.p} 
                fillOpacity={0.2} 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted text-[10px] uppercase opacity-50 text-center px-4">
            A aguardar registos de treino para calcular volume.
          </div>
        )}
      </div>
    </section>
  );
};

export default VolumeChart;