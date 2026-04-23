import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Flame } from 'lucide-react';

const VolumeChart = ({ data }) => {
  // 🔥 Lixo jogado fora: Removemos a detecção de tema via JS! O seu CSS puro vai resolver sozinho.

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
          <Flame size={12} className="text-primary" /> TONELAGEM (VOLUME TOTAL)
        </h3>
      </div>
      
      {/* Aumentamos para h-56 para dar um respiro e garantir que o Recharts não encolha */}
      <div className="bg-card border border-border p-3 rounded-2xl h-56 w-full min-w-0 backdrop-blur-md relative shadow-inner overflow-hidden">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              
              {/* Sugando as variáveis nativas do Tailwind/CSS */}
              <XAxis 
                dataKey="date" 
                stroke="var(--text-muted)" 
                fontSize={10} 
                tickLine={false} 
              />
              <YAxis 
                stroke="var(--text-muted)" 
                fontSize={10} 
                tickLine={false} 
                width={35} 
              />
              
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-card)', 
                  border: '1px solid rgba(var(--primary), 0.5)', 
                  fontSize: '10px',
                  borderRadius: '8px',
                  color: 'var(--text-main)'
                }}
                itemStyle={{ color: 'rgb(var(--primary))', fontWeight: 'bold' }}
                formatter={(value) => [`${value} kg`, 'Volume']}
              />
              
              {/* Gráfico puxando o Ciano ou Azul direto da variável primary */}
              <Area 
                type="stepAfter" 
                dataKey="volume" 
                stroke="rgb(var(--primary))" 
                fill="rgb(var(--primary))" 
                fillOpacity={0.2} 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted text-[10px] uppercase opacity-50 text-center px-4 border-2 border-dashed border-border rounded-xl">
            Aguardando registros de treino para calcular volume.
          </div>
        )}
      </div>
    </section>
  );
};

export default VolumeChart;