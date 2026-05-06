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

  // 🔥 Lixo jogado fora: Removemos a detecção de tema via JS! 

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
      
      {/* Aumentamos para h-64 para garantir o espaço do gráfico */}
      <div className="h-64 w-full -ml-2 relative">
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
            {/* Sugando as variáveis nativas do Tailwind/CSS */}
            <PolarGrid stroke="rgb(var(--primary))" strokeOpacity={0.2} />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: "var(--text-muted)", fontSize: 10, fontWeight: 900 }} 
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
              stroke="rgb(var(--primary))" 
              strokeWidth={3} 
              fill="rgb(var(--primary))" 
              fillOpacity={0.3} 
              dot={{ r: 3, fill: "rgb(var(--primary))", fillOpacity: 1 }}
              activeDot={{ r: 5, stroke: "var(--bg-card)", strokeWidth: 2 }}
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