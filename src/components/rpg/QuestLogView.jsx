import React, { useMemo } from 'react';
import { Award, Target, CheckCircle2, Zap, Terminal } from 'lucide-react';
import { calculateStats } from '../../utils/rpgSystem'; 
import EmptyWorkoutState from '../workout/EmptyWorkoutState';

const QuestLogView = ({ history, quests, setView }) => {
  
  const rpgData = useMemo(() => {
    return calculateStats(history || []);
  }, [history]);

  const currentLevel = rpgData.level || 1;
  const currentXP = rpgData.xp || 0;
  
  const nextLevelXP = Math.pow(currentLevel, 2) * 3500;
  const prevLevelXP = Math.pow(currentLevel - 1, 2) * 3500;
  
  const xpDenom = nextLevelXP - prevLevelXP;
  const progressPercent = xpDenom > 0 ? Math.min(100, Math.max(0, ((currentXP - prevLevelXP) / xpDenom) * 100)) : 0;

  const isNewRecruit = !history || history.length === 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-cyber pb-24">
      
      {/* 🔥 STATUS IMPONENTE (Adaptável Light/Dark) */}
      <div className="bg-card dark:bg-[#050B14] border-b-2 border-yellow-500/50 p-6 relative overflow-hidden shadow-[0_4px_20px_rgba(250,204,21,0.1)] transition-colors duration-300">
        
        {/* Scanlines sutis adaptativas */}
        <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px]"></div>
        
        {/* Brilho de fundo dourado */}
        <div className="absolute top-[-50%] right-[-10%] w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex justify-between items-center mb-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={10} className="text-yellow-600 dark:text-yellow-500 animate-pulse dark:drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />
              <span className="text-[9px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-[0.4em] opacity-80">
                Operacional Disponível
              </span>
            </div>
            {/* Gradiente ajustado para leitura no modo claro e escuro */}
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-500 via-yellow-600 to-yellow-800 dark:from-yellow-300 dark:via-yellow-500 dark:to-yellow-700 leading-none drop-shadow-[0_0_5px_rgba(250,204,21,0.2)] dark:drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">
              NÍVEL {currentLevel}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-black text-muted uppercase tracking-widest flex justify-end gap-1 items-center">
              <Terminal size={8} className="text-yellow-600/50 dark:text-yellow-500/50" /> XP ACUMULADO
            </span>
            <p className="text-xl font-black text-yellow-600 dark:text-yellow-400 drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">
              {currentXP.toLocaleString()}
            </p>
          </div>
        </div>
        
        {/* BARRA DE ENERGIA DOURADA (XP) */}
        <div className="relative z-10">
          <div className="h-2.5 bg-black/10 dark:bg-[#0a0f16] rounded-full border border-yellow-500/30 overflow-hidden shadow-inner dark:shadow-[inset_0_0_5px_rgba(0,0,0,0.8)]">
            <div 
              className="h-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-300 dark:from-yellow-700 dark:via-yellow-400 dark:to-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.6)] dark:shadow-[0_0_15px_rgba(250,204,21,0.8)] transition-all duration-1000 ease-out relative" 
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/60 blur-[2px]"></div>
            </div>
          </div>
          <div className="flex justify-between mt-2 px-1">
             <span className="text-[8px] font-black text-yellow-600/90 dark:text-yellow-500/80 uppercase tracking-widest">
               RANK: <span className="text-main dark:text-white font-extrabold dark:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{isNewRecruit ? 'RECRUTA' : 'ELITE'}</span>
             </span>
             <span className="text-[8px] font-black text-muted uppercase tracking-widest">
               META: {nextLevelXP.toLocaleString()}
             </span>
          </div>
        </div>
      </div>

      {isNewRecruit ? (
        <div className="px-2">
           <EmptyWorkoutState onStartWorkout={() => setView('workout')} />
        </div>
      ) : (
        /* 🔥 MISSÕES */
        <div className="px-3 space-y-5">
          <div className="flex items-center gap-3 px-2 border-l-4 border-[#00f3ff] shadow-[0_0_0_rgba(0,0,0,0)] dark:shadow-[-4px_0_10px_-2px_rgba(0,243,255,0.4)]">
            <Target size={22} className="text-[#00c8ff] dark:text-[#00f3ff] drop-shadow-sm dark:drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]" />
            <h3 className="text-sm font-black text-main dark:text-white uppercase tracking-[0.2em]">Contratos de Elite</h3>
          </div>
          
          <div className="grid gap-4">
            {quests && quests.length > 0 ? (
              quests.map((quest) => (
                <div 
                  key={quest.id} 
                  className={`group relative p-4 transition-all duration-300 ${
                    quest.completed 
                      ? 'bg-cyan-50/50 dark:bg-[#00f3ff]/5 border border-cyan-200 dark:border-[#00f3ff]/30 opacity-70 grayscale-[30%]' 
                      : 'bg-card dark:bg-[#050505] border border-border dark:border-[#00f3ff]/20 hover:border-cyan-400 dark:hover:border-[#00f3ff]/60 hover:shadow-md dark:hover:shadow-[0_0_15px_rgba(0,243,255,0.15)]'
                  }`}
                  style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                >
                  {!quest.completed && (
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00f3ff]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg shrink-0 flex items-center justify-center border ${
                      quest.completed 
                        ? 'bg-cyan-100 dark:bg-[#00f3ff]/20 text-[#00c8ff] dark:text-[#00f3ff] border-[#00f3ff]/30 dark:border-[#00f3ff]/50 dark:shadow-[0_0_10px_rgba(0,243,255,0.4)]' 
                        : 'bg-input dark:bg-black/50 text-fuchsia-600 dark:text-[#ff00ff] border-fuchsia-200 dark:border-[#ff00ff]/30 group-hover:border-fuchsia-400 dark:group-hover:border-[#ff00ff]/60 dark:group-hover:shadow-[0_0_10px_rgba(255,0,255,0.3)]'
                    }`}>
                      {quest.completed ? <CheckCircle2 size={24} /> : <Award size={24} />}
                    </div>
                    
                    <div className="flex-1 pt-0.5">
                      <h4 className={`text-sm font-black uppercase leading-tight mb-1 ${quest.completed ? 'text-[#00c8ff] dark:text-[#00f3ff]' : 'text-main dark:text-white'}`}>
                        {quest.title}
                      </h4>
                      <p className="text-[10px] text-muted font-bold uppercase leading-relaxed mb-3">
                        {quest.description || "Objetivo: Concluir atividade operacional do dia."}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        {/* A recompensa liga o Ciano das Missões ao Dourado do Level Up! */}
                        <span className={`text-[9px] font-black uppercase flex items-center gap-1 ${
                          quest.completed 
                            ? 'text-yellow-600/50 dark:text-yellow-500/50' 
                            : 'text-yellow-600 dark:text-yellow-500 dark:drop-shadow-[0_0_5px_rgba(250,204,21,0.4)]'
                        }`}>
                          RECOMPENSA: +{quest.reward} XP
                        </span>
                        
                        {quest.completed && (
                          <span className="text-[8px] font-black text-[#00c8ff] dark:text-[#00f3ff] uppercase tracking-widest bg-cyan-100 dark:bg-[#00f3ff]/10 px-2 py-0.5 rounded border border-cyan-200 dark:border-[#00f3ff]/30">
                            PAGO
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 flex flex-col items-center justify-center text-center border border-dashed border-border dark:border-[#00f3ff]/30 rounded-xl bg-card dark:bg-[#050505]/50 relative overflow-hidden"
                   style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
                <Target size={32} className="text-muted/50 dark:text-[#00f3ff]/30 mb-3" />
                <p className="text-[11px] text-muted-foreground dark:text-[#00f3ff]/70 uppercase font-black tracking-widest">Nenhuma missão detectada hoje.</p>
                <p className="text-[9px] text-muted font-bold uppercase mt-1">Aguarde novas ordens de comando.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestLogView;