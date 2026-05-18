import React, { useMemo, useState } from 'react';
import { Award, Target, CheckCircle2, Zap, Terminal, Swords, Calendar, ShieldAlert } from 'lucide-react';
import { calculateStats } from '../../utils/rpgSystem'; 
import EmptyWorkoutState from '../workout/EmptyWorkoutState';

const QuestLogView = ({ history, quests, setView, onClaimReward }) => {
  
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
      
      {/* 🔥 STATUS IMPONENTE (INTOCADO - EXATAMENTE COMO NO SEU CÓDIGO ORIGINAL) */}
      <div className="bg-card dark:bg-[#050B14] border-b-2 border-yellow-500/50 p-6 relative overflow-hidden shadow-[0_4px_20px_rgba(250,204,21,0.1)] transition-colors duration-300">
        <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px]"></div>
        <div className="absolute top-[-50%] right-[-10%] w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex justify-between items-center mb-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={10} className="text-yellow-600 dark:text-yellow-500 animate-pulse dark:drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />
              <span className="text-[9px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-[0.4em] opacity-80">
                Operacional Disponível
              </span>
            </div>
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
        <>
          {/* 🔥 SEÇÃO 1: MISSÕES E RECOMPENSAS (NOVO DESIGN TÁTICO) */}
          <div className="px-3 space-y-4">
            <div className="flex items-center gap-3 px-2 border-l-4 border-primary shadow-[-4px_0_10px_-2px_rgba(var(--primary),0.4)]">
              <Target size={22} className="text-primary drop-shadow-[0_0_5px_rgba(var(--primary),0.8)]" />
              <h3 className="text-sm font-black text-main dark:text-white uppercase tracking-[0.2em]">Contratos de Elite</h3>
            </div>
            
            <div className="grid gap-3">
              {quests && quests.length > 0 ? (
                quests.map((quest) => {
                  // Controle simples de resgate no localStorage
                  const isClaimed = localStorage.getItem(`quest_claimed_${quest.id}`) === 'true';

                  return (
                    <div 
                      key={quest.id} 
                      className={`group relative p-4 transition-all duration-300 ${
                        isClaimed 
                          ? 'bg-input/50 border border-border/50 opacity-60 grayscale-[50%]' 
                          : quest.completed 
                          ? 'bg-primary/5 border border-primary/40 shadow-[0_0_15px_rgba(var(--primary),0.1)]'
                          : 'bg-card border border-border hover:border-primary/60 hover:shadow-[0_0_15px_rgba(var(--primary),0.1)]'
                      }`}
                      style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Bloco de Ícone e Texto */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg shrink-0 flex items-center justify-center border ${
                            quest.completed && !isClaimed 
                              ? 'bg-primary/20 text-primary border-primary/50 shadow-[0_0_10px_rgba(var(--primary),0.4)]' 
                              : 'bg-input text-secondary border-secondary/30 group-hover:border-secondary/60'
                          }`}>
                            {quest.completed ? <CheckCircle2 size={18} /> : <Award size={18} />}
                          </div>
                          
                          <div className="min-w-0">
                            <h4 className={`text-sm font-black uppercase leading-tight mb-0.5 truncate ${quest.completed && !isClaimed ? 'text-primary' : 'text-main dark:text-white'}`}>
                              {quest.title}
                            </h4>
                            <p className="text-[9px] text-muted font-bold uppercase truncate">
                              {quest.description || "Objetivo: Concluir atividade operacional do dia."}
                            </p>
                          </div>
                        </div>

                        {/* Bloco do Botão / Status */}
                        <div className="shrink-0 text-right pl-2 border-l border-border/50">
                          {isClaimed ? (
                            <div className="flex flex-col items-center">
                              <span className="text-[8px] font-mono font-black text-muted uppercase tracking-widest mb-1">XP PAGO</span>
                              <CheckCircle2 size={14} className="text-muted/60" />
                            </div>
                          ) : quest.completed ? (
                            <button 
                              onClick={() => {
                                localStorage.setItem(`quest_claimed_${quest.id}`, 'true');
                                if (onClaimReward) onClaimReward(quest.reward);
                                window.dispatchEvent(new Event('quest_update'));
                              }}
                              className="bg-yellow-500 hover:bg-yellow-400 text-black px-2 py-1.5 rounded-sm shadow-[0_0_10px_rgba(250,204,21,0.5)] active:scale-95 transition-all animate-pulse"
                            >
                              <span className="text-[9px] font-black uppercase tracking-wider block leading-none mb-0.5">COLETAR</span>
                              <span className="text-[10px] font-mono font-black block leading-none">+{quest.reward} XP</span>
                            </button>
                          ) : (
                            <div className="flex flex-col items-end">
                              <span className="text-[8px] font-mono font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest mb-0.5">RECOMPENSA</span>
                              <span className="text-[11px] font-black text-yellow-600 dark:text-yellow-500">+{quest.reward} XP</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 flex flex-col items-center justify-center text-center border border-dashed border-border rounded-xl bg-card/50 relative" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
                  <Target size={28} className="text-muted/40 mb-3" />
                  <p className="text-[10px] text-muted uppercase font-black tracking-widest">Nenhuma missão detectada.</p>
                </div>
              )}
            </div>
          </div>

          {/* 🔥 SEÇÃO 2: BATTLE LOG (DIÁRIO DE OPERAÇÕES) */}
          <div className="px-3 space-y-4 pt-4">
            <div className="flex items-center gap-3 px-2 border-l-4 border-secondary shadow-[-4px_0_10px_-2px_rgba(var(--secondary),0.4)]">
              <Swords size={22} className="text-secondary drop-shadow-[0_0_5px_rgba(var(--secondary),0.8)]" />
              <h3 className="text-sm font-black text-main dark:text-white uppercase tracking-[0.2em]">Histórico de Operações</h3>
            </div>

            <div className="space-y-3">
              {history && history.slice(0, 5).map((log, index) => (
                <div 
                  key={index}
                  className="bg-card border border-border p-3 rounded-lg relative overflow-hidden flex justify-between items-center transition-all hover:border-secondary/40 group"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-secondary/50 group-hover:bg-secondary transition-colors"></div>
                  
                  <div className="pl-2 space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-muted font-mono text-[8px] font-black uppercase tracking-widest">
                      <Calendar size={10} />
                      {log.date} <span className="text-secondary/50 mx-1">||</span> STATUS: OK
                    </div>
                    <h4 className="text-sm font-black text-main dark:text-white uppercase truncate tracking-tighter">
                      {log.title || 'OPERAÇÃO TÁTICA'}
                    </h4>
                    <div className="flex gap-3 text-[9px] text-muted font-bold uppercase">
                      <span>Carga: <span className="text-main dark:text-white">{log.totalVolume ? log.totalVolume.toLocaleString() : '0'}KG</span></span>
                      <span>Séries: <span className="text-main dark:text-white">{log.completedSets || 0}</span></span>
                    </div>
                  </div>

                  {log.prsBroken > 0 && (
                    <div className="shrink-0 ml-3 flex flex-col items-center justify-center bg-yellow-500/10 border border-yellow-500/30 p-2 rounded">
                      <span className="text-[14px] font-black text-yellow-500 leading-none">{log.prsBroken}</span>
                      <span className="text-[7px] font-black text-yellow-500/80 uppercase tracking-widest mt-1">NOVO PR</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default QuestLogView;