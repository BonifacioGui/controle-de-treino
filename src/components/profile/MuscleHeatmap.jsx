import React, { useMemo, useState } from 'react';
import { Activity, User, Users } from 'lucide-react';

// Dicionário Tático (Traduzido para o Português para o HUD)
const muscleMap = {
  "Supino Reto": "peito", "Supino Inclinado": "peito", "Crossover": "peito", "Peck Deck": "peito", "Crucifixo com Halteres": "peito",
  "Puxada Neutra": "costas", "Remada Baixa": "costas", "Serrote": "costas", "Puxada Frontal": "costas", "Remada": "costas",
  "Desenvolvimento": "ombros", "Elevação Lateral": "ombros", "Crucifixo Inverso": "ombros", "Face Pull": "ombros", "Elevação Frontal": "ombros",
  "Rosca Direta": "braços", "Rosca Martelo": "braços", "Rosca Alternada": "braços", "Rosca 45º": "braços",
  "Tríceps Francês": "braços", "Tríceps Corda": "braços", "Tríceps Testa": "braços",
  "Prancha": "core", "Prancha Lateral": "core", "Vacuum": "core", "Abdominal Infra": "core",
  "Leg Press": "quadríceps", "Agachamento Hack": "quadríceps", "Cadeira Extensora": "quadríceps", "Agachamento Isométrico": "quadríceps", "Leg Press 45º": "quadríceps",
  "Mesa Flexora": "posteriores", "Stiff": "posteriores", "Elevação Pélvica": "posteriores", "Cadeira Abdutora": "posteriores",
  "Panturrilha": "panturrilhas"
};

const MuscleHeatmap = ({ history }) => {
  // Estado para controlar o biotipo (male/female)
  const [gender, setGender] = useState('male');

  // Analisa os últimos 7 dias
  const heatData = useMemo(() => {
    // 🔥 TRADUZIDO
    const data = { peito: 0, costas: 0, ombros: 0, braços: 0, core: 0, quadríceps: 0, posteriores: 0, panturrilhas: 0 };
    if (!history) return data;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    history.forEach(session => {
      const [d, m, y] = session.date.split('/');
      const sessionDate = new Date(`${y}-${m}-${d}`);

      if (sessionDate >= oneWeekAgo && session.exercises) {
        session.exercises.forEach(ex => {
          if (!ex.done) return;
          // Normaliza o nome para buscar no mapa
          let cleanName = ex.name.split('(')[0].trim();
          const muscle = muscleMap[cleanName] || muscleMap[Object.keys(muscleMap).find(k => cleanName.toLowerCase().includes(k.toLowerCase()))];
          
          if (muscle) {
            const setsDone = ex.sets ? ex.sets.filter(s => s.reps && s.weight).length : 0;
            const fallbackSets = ex.sets ? ex.sets.length : 3; 
            data[muscle] += (setsDone > 0 ? setsDone : fallbackSets);
          }
        });
      }
    });
    return data;
  }, [history]);

  // Funções de Estilo Tático
  const getHeatColor = (sets, target = 12) => {
    const percentage = Math.min(100, (sets / target) * 100);
    // 🔥 AJUSTE: Cor inativa mais suave para não parecer "sujo" no modo claro
    if (percentage === 0) return 'rgba(100, 116, 139, 0.2)'; 
    if (percentage < 50) return 'rgba(var(--primary), 0.4)'; // Azul fraco
    if (percentage < 100) return 'rgba(var(--primary), 0.8)'; // Azul forte
    return 'rgba(239, 68, 68, 0.9)'; // Vermelho (Sobrecarga)
  };

  const getGlowClass = (sets, target = 12) => {
    if (sets >= target) return 'neon-pulse-red'; // Classe para pulsar vermelho
    if (sets > 0) return 'neon-pulse-blue'; // Classe para brilho azul constante
    return '';
  };

  // Props comuns para os polígonos SVG
  const polyProps = (muscle) => ({
    fill: getHeatColor(heatData[muscle]),
    stroke: heatData[muscle] >= 12 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(var(--primary), 0.5)',
    strokeWidth: "1",
    className: `transition-all duration-500 ${getGlowClass(heatData[muscle])}`
  });

  return (
    // 🔥 AJUSTE: Sombra adaptável
    <div className="bg-card border-2 border-border p-5 rounded-3xl shadow-lg dark:shadow-[0_0_30px_rgba(0,0,0,0.5)] mt-6 relative overflow-hidden transition-colors duration-300">
      
      {/* Efeito de fundo de grid tático - Dinâmico para claro/escuro */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(var(--primary),0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--primary),0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none transition-colors duration-300"></div>
      
      {/* Header com Seletor de Biotipo */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2 drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]">
          <Activity size={18} /> Scanner Biométrico (7D)
        </h3>
        
        <div className="flex items-center gap-1 bg-input/80 p-1 rounded-lg border border-border">
          <button 
            onClick={() => setGender('male')}
            // 🔥 AJUSTE: text-main no escuro/claro
            className={`p-1.5 rounded-md transition-all ${gender === 'male' ? 'bg-primary text-black shadow-sm dark:shadow-[0_0_10px_rgba(var(--primary),0.5)]' : 'text-muted hover:text-main dark:hover:text-primary'}`}
          >
            <User size={16} />
          </button>
          <button 
            onClick={() => setGender('female')}
            className={`p-1.5 rounded-md transition-all ${gender === 'female' ? 'bg-primary text-black shadow-sm dark:shadow-[0_0_10px_rgba(var(--primary),0.5)]' : 'text-muted hover:text-main dark:hover:text-primary'}`}
          >
            <Users size={16} />
          </button>
        </div>
      </div>

      <div className="flex justify-center items-center py-4 relative z-10">
        {/* SVG ESTILIZADO CYBERPUNK */}
        <svg viewBox="0 0 200 300" className="w-56 h-auto filter drop-shadow-md dark:drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">
          {/* Definições de Efeitos Visuais */}
          <defs>
            <pattern id="scanlines" patternUnits="userSpaceOnUse" width="4" height="4">
              {/* 🔥 AJUSTE: Linhas mais suaves para não sujar o fundo claro */}
              <line x1="0" y1="0" x2="200" y2="0" stroke="rgba(0,0,0,0.15)" strokeWidth="2" className="dark:stroke-[rgba(0,0,0,0.4)]"/>
            </pattern>
            <linearGradient id="hologram-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(var(--primary), 0.05)" />
              <stop offset="50%" stopColor="rgba(var(--primary), 0.2)" />
              <stop offset="100%" stopColor="rgba(var(--primary), 0.05)" />
            </linearGradient>
          </defs>

          {/* Camada de Fundo do Holograma */}
          <rect x="20" y="0" width="160" height="300" fill="url(#hologram-gradient)" rx="20" opacity="0.8" />

          {/* Renderização Condicional dos Biotipos */}
          {gender === 'male' ? (
            <g className="male-wireframe">
               {/* CABEÇA */}
               {/* 🔥 AJUSTE: stroke dinâmico e fill mais suave */}
               <polygon points="90,20 110,20 115,40 100,50 85,40" fill="rgba(100,116,139,0.3)" stroke="rgba(var(--primary),0.4)"/>
               {/* OMBROS */}
               <polygon points="65,55 135,55 145,75 135,85 65,85 55,75" {...polyProps('ombros')}/>
               {/* PEITO */}
               <polygon points="70,60 130,60 125,100 100,110 75,100" {...polyProps('peito')}/>
               {/* COSTAS */}
               <polygon points="60,80 70,80 75,120 60,120" {...polyProps('costas')}/>
               <polygon points="140,80 130,80 125,120 140,120" {...polyProps('costas')}/>
               {/* CORE */}
               <polygon points="77,115 123,115 118,155 100,165 82,155" {...polyProps('core')}/>
               {/* BRAÇOS */}
               <rect x="40" y="80" width="18" height="45" rx="4" {...polyProps('braços')}/>
               <rect x="142" y="80" width="18" height="45" rx="4" {...polyProps('braços')}/>
               <rect x="35" y="130" width="15" height="40" rx="3" {...polyProps('braços')}/>
               <rect x="150" y="130" width="15" height="40" rx="3" {...polyProps('braços')}/>
               {/* QUADRÍCEPS */}
               <polygon points="78,170 98,170 95,230 73,230" {...polyProps('quadríceps')}/>
               <polygon points="102,170 122,170 127,230 105,230" {...polyProps('quadríceps')}/>
               {/* POSTERIORES */}
               <polygon points="68,175 76,175 71,225 63,220" {...polyProps('posteriores')}/>
               <polygon points="132,175 124,175 129,225 137,220" {...polyProps('posteriores')}/>
               {/* PANTURRILHAS */}
               <polygon points="76,240 92,240 88,290 73,290" {...polyProps('panturrilhas')}/>
               <polygon points="108,240 124,240 127,290 112,290" {...polyProps('panturrilhas')}/>
            </g>
          ) : (
            <g className="female-wireframe">
              {/* CABEÇA */}
              <polygon points="92,25 108,25 112,42 100,50 88,42" fill="rgba(100,116,139,0.3)" stroke="rgba(var(--primary),0.4)"/>
              {/* OMBROS */}
              <polygon points="75,55 125,55 132,70 125,80 75,80 68,70" {...polyProps('ombros')}/>
              {/* PEITO */}
              <polygon points="80,60 120,60 115,85 100,95 85,85" {...polyProps('peito')}/>
              {/* COSTAS */}
              <polygon points="70,75 78,75 82,110 70,110" {...polyProps('costas')}/>
              <polygon points="130,75 122,75 118,110 130,110" {...polyProps('costas')}/>
              {/* CORE */}
              <polygon points="80,105 120,105 125,145 100,155 75,145" {...polyProps('core')}/>
              {/* BRAÇOS */}
              <rect x="52" y="75" width="14" height="42" rx="4" {...polyProps('braços')}/>
              <rect x="134" y="75" width="14" height="42" rx="4" {...polyProps('braços')}/>
              <rect x="48" y="122" width="12" height="38" rx="3" {...polyProps('braços')}/>
              <rect x="140" y="122" width="12" height="38" rx="3" {...polyProps('braços')}/>
              {/* QUADRÍCEPS */}
              <polygon points="73,160 98,160 94,225 70,225" {...polyProps('quadríceps')}/>
              <polygon points="102,160 127,160 130,225 106,225" {...polyProps('quadríceps')}/>
              {/* POSTERIORES */}
              <polygon points="65,165 73,165 69,220 60,215" {...polyProps('posteriores')}/>
              <polygon points="135,165 127,165 131,220 140,215" {...polyProps('posteriores')}/>
              {/* PANTURRILHAS */}
              <polygon points="74,235 90,235 86,285 70,285" {...polyProps('panturrilhas')}/>
              <polygon points="110,235 126,235 130,285 114,285" {...polyProps('panturrilhas')}/>
            </g>
          )}

          {/* Overlay de Scanlines para efeito de tela */}
          <rect x="20" y="0" width="160" height="300" fill="url(#scanlines)" rx="20" opacity="0.4" style={{ mixBlendMode: 'overlay' }} />
          
          {/* Linha de Scanner animada */}
          <line x1="20" y1="10" x2="180" y2="10" stroke="rgba(var(--primary),0.6)" strokeWidth="2" className="animate-scanline" />
        </svg>

        {/* LEGENDA FLUTUANTE HUD MELHORADA */}
        {/* 🔥 AJUSTE: bg-card/80 dark:bg-black/40 para não ficar uma mancha preta no dia */}
        <div className="absolute right-2 top-16 flex flex-col gap-2 text-[8px] font-mono uppercase tracking-widest text-muted text-right bg-card/80 dark:bg-black/40 p-2 rounded-lg border border-border shadow-sm backdrop-blur-md z-20 transition-colors">
          <div className="flex items-center gap-1 justify-end text-red-500 font-bold drop-shadow-sm">
            <Activity size={10} className="animate-pulse" /> Sobrecarga (+100%)
          </div>
          <div className="flex items-center gap-1 justify-end text-primary drop-shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_rgba(var(--primary),1)]"></span> Ativado
          </div>
          <div className="flex items-center gap-1 justify-end opacity-50">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span> Descanso
          </div>
        </div>
      </div>

      {/* DADOS BRUTOS (Compacto) */}
      <div className="grid grid-cols-4 gap-1.5 mt-2 pt-3 border-t border-border/30 relative z-10">
        {Object.entries(heatData).map(([muscle, sets]) => {
          const isOverload = sets >= 12;
          return (
          // 🔥 AJUSTE: bg-input e bg-red-500/10 no claro para leitura
          <div key={muscle} className={`text-center rounded-lg py-1.5 border transition-colors ${isOverload ? 'bg-red-500/10 border-red-500/50 shadow-sm' : 'bg-input/50 dark:bg-input/20 border-border/50'}`}>
            <p className="text-[7px] font-black text-muted uppercase leading-tight mb-0.5">{muscle}</p>
            <p className={`text-[11px] font-black leading-none ${isOverload ? 'text-red-500 dark:text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.3)] animate-pulse' : 'text-primary'}`}>
              {sets}
            </p>
          </div>
        )})}
      </div>
      
      {/* ESTILOS CSS INJETADOS PARA ANIMAÇÃO */}
      <style jsx>{`
        .neon-pulse-blue {
          filter: drop-shadow(0 0 6px rgba(var(--primary), 0.6));
        }
        .neon-pulse-red {
          animation: pulse-red 2s infinite;
        }
        @keyframes pulse-red {
          0% { filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.6)); fill: rgba(239, 68, 68, 0.8); }
          50% { filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.9)); fill: rgba(239, 68, 68, 1); }
          100% { filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.6)); fill: rgba(239, 68, 68, 0.8); }
        }
        .animate-scanline {
          animation: scan 3s linear infinite;
        }
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(280px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default MuscleHeatmap;