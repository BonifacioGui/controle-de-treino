import React, { useState } from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';

// Dicionário de decodificação dos atributos
const attributeLabels = {
  'FOR': { full: 'FORÇA', desc: 'Capacidade de carga e explosão muscular.' },
  'DES': { full: 'DESTREZA', desc: 'Precisão na execução e agilidade entre séries.' },
  'VIT': { full: 'VITALIDADE', desc: 'Resistência cardiovascular e recuperação.' },
  'CAR': { full: 'CARISMA', desc: 'Estética corporal e presença de palco (Ganhos Visuais).' },
  'FOCO': { full: 'FOCO', desc: 'Consistência e assiduidade na última semana.' },
  'DISCIPLINA': { full: 'DISCIPLINA', desc: 'Sua resiliência ao longo de todo o histórico.' }
};

const TacticalRadar = ({ radarData, maxStat }) => {
  // Estado para o atributo selecionado (hover ou toque)
  const [activeAttr, setActiveAttr] = useState(null);

  // 🔥 AJUSTE: Sincronização Segura de Cores para SVG
  const theme = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') || 'driver' : 'driver';
  
  const colors = {
    driver: { p: '#22d3ee', s: '#ec4899', t: '#94a3b8' }, // primary, secondary, text/muted
    light:  { p: '#0284c7', s: '#db2777', t: '#475569' }  
  }[theme] || { p: '#22d3ee', s: '#ec4899', t: '#94a3b8' };

  return (
    <div className="bg-card border-2 border-border rounded-3xl p-5 shadow-sm space-y-4 transition-all duration-500">
      
      {/* HEADER DO RADAR COM HUD DINÂMICO */}
      <div className="text-center min-h-[50px] flex flex-col justify-center">
        {!activeAttr ? (
          <h3 className="text-sm font-black text-primary uppercase tracking-widest animate-in fade-in duration-500">
            Mapeamento Tático
          </h3>
        ) : (
          <div className="animate-in slide-in-from-top-1 duration-300">
            <h3 className="text-sm font-black text-secondary uppercase tracking-widest">
              {attributeLabels[activeAttr]?.full}
            </h3>
            <p className="text-[8px] font-bold text-muted uppercase tracking-tighter italic">
              {attributeLabels[activeAttr]?.desc}
            </p>
          </div>
        )}
      </div>
      
      <div className="h-60 w-full -ml-2 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart 
            cx="50%" 
            cy="50%" 
            outerRadius="70%" 
            data={radarData}
            onMouseMove={(state) => {
              if (state && state.activePayload) {
                setActiveAttr(state.activePayload[0].payload.subject);
              }
            }}
            onMouseLeave={() => setActiveAttr(null)}
          >
            {/* 🔥 AJUSTE: Uso do código HEX seguro em vez de interpolação CSS no SVG */}
            <PolarGrid stroke={colors.p} strokeOpacity={0.2} />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: colors.t, fontSize: 10, fontWeight: 900 }} // 🔥 AJUSTE: Cor do eixo adaptável
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, maxStat]} 
              tick={false} 
              axisLine={false} 
            />
            <Radar 
              name="Nível" 
              dataKey="A" 
              stroke={colors.p} // 🔥 AJUSTE: Cor Segura
              strokeWidth={3} 
              fill={colors.p} // 🔥 AJUSTE: Cor Segura
              fillOpacity={0.3} 
              dot={{ r: 3, fill: colors.p, fillOpacity: 1 }}
              activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
            />
            <Tooltip content={() => null} />
          </RadarChart>
        </ResponsiveContainer>

        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 opacity-30 pointer-events-none">
           <span className="text-[6px] font-black text-muted">TAB: INTERAÇÃO PARA DETALHES</span>
        </div>
      </div>
    </div>
  );
};

export default TacticalRadar;