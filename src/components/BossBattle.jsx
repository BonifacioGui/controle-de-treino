import React, { useEffect, useState } from 'react';
import { Skull, Zap, Trophy } from 'lucide-react';

const BOSS_LEVELS = [
  { name: "SCAVENGER", hp: 5000, image: "https://i.imgur.com/8Q5k5tW.png", color: "from-gray-500 to-gray-900" }, // Iniciante
  { name: "CYBER-ORK", hp: 10000, image: "https://i.imgur.com/rN5w5xT.png", color: "from-green-500 to-green-900" }, // Intermediário
  { name: "MECHA-GOLEM", hp: 20000, image: "https://i.imgur.com/4z6yX9q.png", color: "from-blue-600 to-blue-900" }, // Avançado
  { name: "IRON TITAN", hp: 35000, image: "https://i.imgur.com/0g2z5xP.png", color: "from-purple-600 to-purple-900" }, // Monstro
  { name: "ADAM SMASHER", hp: 50000, image: "https://i.imgur.com/7b3z5xR.png", color: "from-red-600 to-red-900" } // Lenda
];

const BossBattle = ({ currentVolume }) => {
  const [selectedBoss, setSelectedBoss] = useState(BOSS_LEVELS[0]);
  const [damageAnim, setDamageAnim] = useState(false);

  // Seleciona o Boss automaticamente baseado no seu volume atual (escala de dificuldade)
  useEffect(() => {
    const boss = BOSS_LEVELS.find(b => currentVolume < b.hp * 1.2) || BOSS_LEVELS[BOSS_LEVELS.length - 1];
    // Mantém o boss mais difícil que você já alcançou no treino para não "rebaixar"
    setSelectedBoss(prev => (boss.hp > prev.hp ? boss : prev));
  }, [currentVolume]);

  // Animação de Dano quando o volume aumenta
  useEffect(() => {
    if (currentVolume > 0) {
        setDamageAnim(true);
        const timer = setTimeout(() => setDamageAnim(false), 300);
        return () => clearTimeout(timer);
    }
  }, [currentVolume]);

  const progress = Math.min(100, (currentVolume / selectedBoss.hp) * 100);
  const isDefeated = currentVolume >= selectedBoss.hp;

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden border-2 transition-all duration-300 mb-6 group ${damageAnim ? 'border-red-500 scale-[1.02] translate-x-1' : 'border-border bg-black/60'}`}>
      
      {/* BACKGROUND DO BOSS */}
      <div className={`absolute inset-0 bg-gradient-to-r ${selectedBoss.color} opacity-20 group-hover:opacity-30 transition-opacity`}></div>
      
      <div className="relative p-4 flex items-center gap-4">
        {/* ÍCONE / AVATAR DO BOSS */}
        <div className={`relative w-16 h-16 rounded-xl flex items-center justify-center border-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden ${isDefeated ? 'border-success' : 'border-primary'}`}>
           {isDefeated ? (
             <div className="bg-success/20 w-full h-full flex items-center justify-center animate-pulse">
                <Trophy size={32} className="text-success" />
             </div>
           ) : (
             <div className={`w-full h-full bg-gradient-to-br ${selectedBoss.color} flex items-center justify-center`}>
                <Skull size={32} className={`text-white drop-shadow-md ${damageAnim ? 'animate-ping' : ''}`} />
             </div>
           )}
        </div>

        {/* BARRA DE VIDA E INFO */}
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-end">
            <h3 className="text-sm font-black italic uppercase tracking-widest text-white drop-shadow-md">
                {isDefeated ? "BOSS ELIMINADO" : `ALVO: ${selectedBoss.name}`}
            </h3>
            <span className={`text-xs font-mono font-bold ${isDefeated ? 'text-success' : 'text-red-400'}`}>
                {Math.round(currentVolume)} / <span className="text-muted">{selectedBoss.hp} HP</span>
            </span>
          </div>

          {/* BARRA DE HP (Ao contrário: Cheia é vida, vazia é morte) */}
          <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700 relative shadow-inner">
             {/* Vida Restante (Vermelha) */}
             <div 
               className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-700 ease-out absolute top-0 left-0"
               style={{ width: `${Math.max(0, 100 - progress)}%` }} // Diminui conforme progrid
             ></div>
             
             {/* Dano Causado (Efeito visual) */}
             <div 
                className="h-full w-full absolute top-0 left-0 bg-transparent"
                style={{ 
                    background: `linear-gradient(90deg, transparent ${100 - progress}%, #00ff00 ${100 - progress}%, #00ff00 ${100 - progress + 2}%, transparent ${100 - progress + 5}%)`,
                    opacity: 0.5 
                }}
             ></div>
          </div>
          
          <div className="flex justify-between items-center text-[8px] uppercase tracking-[0.2em] text-muted font-bold">
            <span>Dano: Volume Total</span>
            {isDefeated && <span className="text-success animate-pulse flex items-center gap-1"><Zap size={8}/> VITÓRIA</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BossBattle;