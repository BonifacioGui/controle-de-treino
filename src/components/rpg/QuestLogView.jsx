import React, { useMemo } from 'react';
import { Award, Scroll } from 'lucide-react';
import { calculateStats } from '../../utils/rpgSystem'; 
import EmptyWorkoutState from '../workout/EmptyWorkoutState';

const QuestLogView = ({ history, quests, setView }) => {
  
  const rpgData = useMemo(() => {
    return calculateStats(history || []);
  }, [history]);

  // 🔥 Proteção ativada usando a variável 'xp' correta
  const currentLevel = rpgData.level || 1;
  const currentXP = rpgData.xp || 0;
  
  const nextLevelXP = Math.pow(currentLevel, 2) * 3500;
  const prevLevelXP = Math.pow(currentLevel - 1, 2) * 3500;
  const progressPercent = Math.min(100, Math.max(0, ((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100));

  const isNewRecruit = !history || history.length === 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-cyber pb-24">
      
      {/* STATUS IMPONENTE */}
      <div className="bg-card border-b-2 border-primary/30 p-6 relative overflow-hidden shadow-md dark:shadow-2xl transition-colors duration-300">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-70">Operacional Disponível</span>
            <h2 className="text-4xl font-black text-main dark:text-white leading-none text-glow">NÍVEL {currentLevel}</h2>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-muted uppercase">XP ACUMULADO</span>
            <p className="text-xl font-black text-secondary ">{currentXP.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="h-2.5 bg-input dark:bg-black/60 rounded-full border border-border dark:border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-secondary to-primary transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="flex justify-between mt-2 px-1">
           <span className="text-[7px] font-black text-primary/60 uppercase ">RANK: {isNewRecruit ? 'RECRUTA' : 'ELITE'}</span>
           <span className="text-[7px] font-black text-muted uppercase ">META: {nextLevelXP.toLocaleString()}</span>
        </div>
      </div>

      {isNewRecruit ? (
        <div className="px-2">
           <EmptyWorkoutState onStartWorkout={() => setView('workout')} />
        </div>
      ) : (
        /* MISSÕES (CONTRATOS DE ELITE) */
        <div className="px-1 space-y-4">
          <div className="flex items-center gap-2 px-2 border-l-4 border-secondary">
            <Scroll size={20} className="text-secondary" />
            <h3 className="text-sm font-black text-main dark:text-white uppercase tracking-widest ">Contratos de Elite</h3>
          </div>
          
          <div className="grid gap-3">
            {quests && quests.length > 0 ? (
              quests.map((quest) => (
                <div key={quest.id} className={`group p-4 rounded-xl border-2 transition-all ${quest.completed ? 'bg-success/5 border-success/30 opacity-50' : 'bg-card border-border hover:border-primary/50'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg shrink-0 ${quest.completed ? 'bg-success/20 text-success' : 'bg-secondary/20 text-secondary'}`}>
                      <Award size={22} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-main dark:text-white uppercase leading-none">{quest.title}</h4>
                      <p className="text-[10px] text-muted font-bold uppercase mt-1 leading-relaxed">
                        {quest.description || "Objetivo: Concluir atividade operacional do dia."}
                      </p>
                      <span className="text-[8px] font-black text-secondary uppercase mt-2 block">RECOMPENSA: +{quest.reward} XP</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center border-2 border-dashed border-border rounded-xl bg-card/30">
                <p className="text-xs text-muted uppercase font-bold tracking-widest">Nenhuma missão ativa detectada hoje.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestLogView;