import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Flame } from 'lucide-react';

const VolumeChart = ({ data }) => {

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black text-muted uppercase tracking-[0.16em] flex items-center gap-2">
          <Flame size={12} className="text-primary" /> TONELAGEM (VOLUME TOTAL)
        </h3>
      </div>
      
      {/* Aumentamos para h-56 para dar um respiro e garantir que o Recharts não encolha */}
      <div className="bg-card border border-border p-3 rounded-2xl h-56 w-full min-w-0 backdrop-blur-md relative shadow-inner overflow-hidden">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 320, height: 200 }}>
            <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              
              {/* Sugando as variáveis nativas do Tailwind/CSS */}
              <XAxis 
                dataKey="date" 
                stroke="var(--chart-text)"
                fontSize={11}
                tickLine={false} 
              />
              <YAxis 
                stroke="var(--chart-text)"
                fontSize={11}
                tickLine={false} 
                width={46}
              />
              
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--chart-tooltip-bg)',
                  border: '1px solid var(--chart-tooltip-border)',
                  fontSize: '12px',
                  borderRadius: '10px',
                  color: 'var(--text-main)'
                }}
                labelStyle={{ color: 'var(--chart-text)' }}
                itemStyle={{ color: 'var(--chart-primary)', fontWeight: 'bold' }}
                formatter={(value) => [`${value} kg`, 'Volume']}
              />
              
              {/* Gráfico puxando o Ciano ou Azul direto da variável primary */}
              <Area 
                type="stepAfter" 
                dataKey="volume" 
                stroke="var(--chart-primary)"
                fill="var(--chart-primary)"
                fillOpacity={0.2} 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted text-xs uppercase text-center px-4 border-2 border-dashed border-border rounded-xl">
            Aguardando registros de treino para calcular volume.
          </div>
        )}
      </div>
    </section>
  );
};

export default VolumeChart;
