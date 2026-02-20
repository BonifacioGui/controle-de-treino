import React, { useMemo, useState } from 'react';
import { Activity, User, Users } from 'lucide-react';

// Dicionário Tático (Permanece o mesmo)
const muscleMap = {
  "Supino Reto": "chest", "Supino Inclinado": "chest", "Crossover": "chest", "Peck Deck": "chest", "Crucifixo com Halteres": "chest",
  "Puxada Neutra": "back", "Remada Baixa": "back", "Serrote": "back", "Puxada Frontal": "back", "Remada": "back",
  "Desenvolvimento": "shoulders", "Elevação Lateral": "shoulders", "Crucifixo Inverso": "shoulders", "Face Pull": "shoulders", "Elevação Frontal": "shoulders",
  "Rosca Direta": "arms", "Rosca Martelo": "arms", "Rosca Alternada": "arms", "Rosca 45º": "arms",
  "Tríceps Francês": "arms", "Tríceps Corda": "arms", "Tríceps Testa": "arms",
  "Prancha": "core", "Prancha Lateral": "core", "Vacuum": "core", "Abdominal Infra": "core",
  "Leg Press": "quads", "Agachamento Hack": "quads", "Cadeira Extensora": "quads", "Agachamento Isométrico": "quads", "Leg Press 45º": "quads",
  "Mesa Flexora": "hamstrings", "Stiff": "hamstrings", "Elevação Pélvica": "hamstrings", "Cadeira Abdutora": "hamstrings",
  "Panturrilha": "calves"
};

const MuscleHeatmap = ({ history }) => {
  // Estado para controlar o biotipo (male/female)
  const [gender, setGender] = useState('male');

  // Analisa os últimos 7 dias
  const heatData = useMemo(() => {
    const data = { chest: 0, back: 0, shoulders: 0, arms: 0, core: 0, quads: 0, hamstrings: 0, calves: 0 };
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
    if (percentage === 0) return 'rgba(50, 50, 70, 0.3)'; // Cinza escuro inativo
    if (percentage < 50) return 'rgba(var(--primary), 0.4)'; // Azul fraco
    if (percentage < 100) return 'rgba(var(--primary), 0.8)'; // Azul forte
    return 'rgba(255, 50, 50, 0.9)'; // Vermelho (Sobrecarga)
  };

  const getGlowClass = (sets, target = 12) => {
    if (sets >= target) return 'neon-pulse-red'; // Classe para pulsar vermelho
    if (sets > 0) return 'neon-pulse-blue'; // Classe para brilho azul constante
    return '';
  };

  // Props comuns para os polígonos SVG
  const polyProps = (muscle) => ({
    fill: getHeatColor(heatData[muscle]),
    stroke: heatData[muscle] >= 12 ? 'rgba(255, 100, 100, 0.8)' : 'rgba(var(--primary), 0.5)',
    strokeWidth: "1",
    className: `transition-all duration-500 ${getGlowClass(heatData[muscle])}`
  });

  return (
    <div className="bg-card border-2 border-border p-5 rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.5)] mt-6 relative overflow-hidden">
      {/* Efeito de fundo de grid tático */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--primary),0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--primary),0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
      
      {/* Header com Seletor de Biotipo */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2 drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]">
          <Activity size={18} /> Scanner Biométrico (7D)
        </h3>
        
        <div className="flex items-center gap-1 bg-input/50 p-1 rounded-lg border border-border">
          <button 
            onClick={() => setGender('male')}
            className={`p-1.5 rounded-md transition-all ${gender === 'male' ? 'bg-primary text-black shadow-[0_0_10px_rgba(var(--primary),0.5)]' : 'text-muted hover:text-primary'}`}
          >
            <User size={16} />
          </button>
          <button 
            onClick={() => setGender('female')}
            className={`p-1.5 rounded-md transition-all ${gender === 'female' ? 'bg-primary text-black shadow-[0_0_10px_rgba(var(--primary),0.5)]' : 'text-muted hover:text-primary'}`}
          >
            <Users size={16} />
          </button>
        </div>
      </div>

      <div className="flex justify-center items-center py-4 relative z-10">
        {/* SVG ESTILIZADO CYBERPUNK */}
        <svg viewBox="0 0 200 300" className="w-56 h-auto filter drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">
          {/* Definições de Efeitos Visuais */}
          <defs>
            <pattern id="scanlines" patternUnits="userSpaceOnUse" width="4" height="4">
              <line x1="0" y1="0" x2="200" y2="0" stroke="rgba(0,0,0,0.3)" strokeWidth="2"/>
            </pattern>
            <linearGradient id="hologram-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(var(--primary), 0.1)" />
              <stop offset="50%" stopColor="rgba(var(--primary), 0.3)" />
              <stop offset="100%" stopColor="rgba(var(--primary), 0.1)" />
            </linearGradient>
          </defs>

          {/* Camada de Fundo do Holograma */}
          <rect x="20" y="0" width="160" height="300" fill="url(#hologram-gradient)" rx="20" opacity="0.5" />

          {/* Renderização Condicional dos Biotipos */}
          {gender === 'male' ? (
            <g className="male-wireframe">
               {/* CABEÇA */}
               <polygon points="90,20 110,20 115,40 100,50 85,40" fill="rgba(50,50,70,0.5)" stroke="rgba(var(--primary),0.3)"/>
               {/* OMBROS (Largos) */}
               <polygon points="65,55 135,55 145,75 135,85 65,85 55,75" {...polyProps('shoulders')}/>
               {/* PEITO */}
               <polygon points="70,60 130,60 125,100 100,110 75,100" {...polyProps('chest')}/>
               {/* COSTAS (Asas) */}
               <polygon points="60,80 70,80 75,120 60,120" {...polyProps('back')}/>
               <polygon points="140,80 130,80 125,120 140,120" {...polyProps('back')}/>
               {/* CORE (Estreito embaixo) */}
               <polygon points="77,115 123,115 118,155 100,165 82,155" {...polyProps('core')}/>
               {/* BRAÇOS */}
               <rect x="40" y="80" width="18" height="45" rx="4" {...polyProps('arms')}/>
               <rect x="142" y="80" width="18" height="45" rx="4" {...polyProps('arms')}/>
               <rect x="35" y="130" width="15" height="40" rx="3" {...polyProps('arms')}/>
               <rect x="150" y="130" width="15" height="40" rx="3" {...polyProps('arms')}/>
               {/* QUADRÍCEPS */}
               <polygon points="78,170 98,170 95,230 73,230" {...polyProps('quads')}/>
               <polygon points="102,170 122,170 127,230 105,230" {...polyProps('quads')}/>
               {/* POSTERIOR */}
               <polygon points="68,175 76,175 71,225 63,220" {...polyProps('hamstrings')}/>
               <polygon points="132,175 124,175 129,225 137,220" {...polyProps('hamstrings')}/>
               {/* PANTURRILHAS */}
               <polygon points="76,240 92,240 88,290 73,290" {...polyProps('calves')}/>
               <polygon points="108,240 124,240 127,290 112,290" {...polyProps('calves')}/>
            </g>
          ) : (
            <g className="female-wireframe">
              {/* CABEÇA */}
              <polygon points="92,25 108,25 112,42 100,50 88,42" fill="rgba(50,50,70,0.5)" stroke="rgba(var(--primary),0.3)"/>
              {/* OMBROS (Mais estreitos) */}
              <polygon points="75,55 125,55 132,70 125,80 75,80 68,70" {...polyProps('shoulders')}/>
              {/* PEITO (Formato distinto) */}
              <polygon points="80,60 120,60 115,85 100,95 85,85" {...polyProps('chest')}/>
              {/* COSTAS */}
              <polygon points="70,75 78,75 82,110 70,110" {...polyProps('back')}/>
              <polygon points="130,75 122,75 118,110 130,110" {...polyProps('back')}/>
              {/* CORE (Cintura mais fina, quadril mais largo) */}
              <polygon points="80,105 120,105 125,145 100,155 75,145" {...polyProps('core')}/>
              {/* BRAÇOS (Mais finos) */}
              <rect x="52" y="75" width="14" height="42" rx="4" {...polyProps('arms')}/>
              <rect x="134" y="75" width="14" height="42" rx="4" {...polyProps('arms')}/>
              <rect x="48" y="122" width="12" height="38" rx="3" {...polyProps('arms')}/>
              <rect x="140" y="122" width="12" height="38" rx="3" {...polyProps('arms')}/>
              {/* QUADRÍCEPS (Coxas mais largas no topo) */}
              <polygon points="73,160 98,160 94,225 70,225" {...polyProps('quads')}/>
              <polygon points="102,160 127,160 130,225 106,225" {...polyProps('quads')}/>
              {/* POSTERIOR */}
              <polygon points="65,165 73,165 69,220 60,215" {...polyProps('hamstrings')}/>
              <polygon points="135,165 127,165 131,220 140,215" {...polyProps('hamstrings')}/>
              {/* PANTURRILHAS */}
              <polygon points="74,235 90,235 86,285 70,285" {...polyProps('calves')}/>
              <polygon points="110,235 126,235 130,285 114,285" {...polyProps('calves')}/>
            </g>
          )}

          {/* Overlay de Scanlines para efeito de tela */}
          <rect x="20" y="0" width="160" height="300" fill="url(#scanlines)" rx="20" opacity="0.3" style={{ mixBlendMode: 'overlay' }} />
          
          {/* Linha de Scanner animada (opcional, para mais efeito) */}
          <line x1="20" y1="10" x2="180" y2="10" stroke="rgba(var(--primary),0.5)" strokeWidth="2" className="animate-scanline opacity-50" />
        </svg>

        {/* LEGENDA FLUTUANTE HUD MELHORADA */}
        <div className="absolute right-2 top-16 flex flex-col gap-2 text-[8px] font-mono uppercase tracking-widest text-muted text-right bg-black/40 p-2 rounded-lg border border-border/50 backdrop-blur-sm z-20">
          <div className="flex items-center gap-1 justify-end text-red-400 font-bold">
            <Activity size={10} className="animate-pulse" /> Sobrecarga (+100%)
          </div>
          <div className="flex items-center gap-1 justify-end text-primary">
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_rgba(var(--primary),1)]"></span> Ativado
          </div>
          <div className="flex items-center gap-1 justify-end opacity-50">
            <span className="w-2 h-2 rounded-full bg-muted"></span> Descanso
          </div>
        </div>
      </div>

      {/* DADOS BRUTOS (Compacto) */}
      <div className="grid grid-cols-4 gap-1 mt-2 pt-3 border-t border-border/30 relative z-10">
        {Object.entries(heatData).map(([muscle, sets]) => {
          const isOverload = sets >= 12;
          return (
          <div key={muscle} className={`text-center rounded-lg py-1 border ${isOverload ? 'bg-red-900/20 border-red-500/50' : 'bg-input/20 border-border/30'}`}>
            <p className="text-[7px] font-black text-muted uppercase">{muscle}</p>
            <p className={`text-[10px] font-black leading-none ${isOverload ? 'text-red-400 drop-shadow-[0_0_5px_rgba(255,50,50,0.5)] animate-pulse' : 'text-primary'}`}>
              {sets}
            </p>
          </div>
        )})}
      </div>
      
      {/* ESTILOS CSS INJETADOS PARA ANIMAÇÃO */}
      <style jsx>{`
        .neon-pulse-blue {
          filter: drop-shadow(0 0 8px rgba(var(--primary), 0.7));
        }
        .neon-pulse-red {
          animation: pulse-red 2s infinite;
        }
        @keyframes pulse-red {
          0% { filter: drop-shadow(0 0 5px rgba(255, 50, 50, 0.7)); fill: rgba(255, 50, 50, 0.8); }
          50% { filter: drop-shadow(0 0 15px rgba(255, 50, 50, 1)); fill: rgba(255, 70, 70, 1); }
          100% { filter: drop-shadow(0 0 5px rgba(255, 50, 50, 0.7)); fill: rgba(255, 50, 50, 0.8); }
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