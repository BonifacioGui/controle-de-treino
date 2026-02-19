import React, { useMemo } from 'react';
import { Shield, Zap, Target, Award, Scroll, Star, History as HistoryIcon, ChevronRight } from 'lucide-react';
import { calculateStats } from '../utils/rpgSystem'; 
import BadgeList from './BadgeList'; 
import HistoryView from './HistoryView';

const DashboardView = ({ history, quests, stats, bodyHistory, deleteEntry, updateEntry, setView }) => {
  
  // 🔥 RECUPERANDO O NÍVEL CORRETO DO HISTÓRICO
  const rpgData = useMemo(() => {
    return calculateStats(history || []);
  }, [history]);

  const currentLevel = rpgData.level;
  const currentXP = rpgData.totalXP;
  
  const nextLevelXP = Math.pow(currentLevel, 2) * 3500;
  const prevLevelXP = Math.pow(currentLevel - 1, 2) * 3500;
  const progressPercent = Math.min(100, Math.max(0, ((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-cyber pb-24">
      
      {/* STATUS IMPOENTE */}
      <div className="bg-card border-b-2 border-primary/30 p-6 relative overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-70">Operacional Disponível</span>
            <h2 className="text-4xl font-black text-white italic leading-none text-glow">NÍVEL {currentLevel}</h2>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-muted uppercase">XP ACUMULADO</span>
            <p className="text-xl font-black text-secondary italic">{currentXP.toLocaleString()}</p>
          </div>
        </div>
        <div className="h-2.5 bg-black/60 rounded-full border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-secondary to-primary transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="flex justify-between mt-2 px-1">
           <span className="text-[7px] font-black text-primary/60 uppercase italic">RANK: ELITE</span>
           <span className="text-[7px] font-black text-muted uppercase italic">META: {nextLevelXP.toLocaleString()}</span>
        </div>
      </div>

      {/* MISSÕES COM DESCRIÇÃO */}
      <div className="px-1 space-y-4">
        <div className="flex items-center gap-2 px-2 border-l-4 border-secondary">
          <Scroll size={20} className="text-secondary" />
          <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Contratos de Elite</h3>
        </div>
        <div className="grid gap-3">
          {quests.map((quest) => (
            <div key={quest.id} className={`group p-4 rounded-xl border-2 transition-all ${quest.completed ? 'bg-success/5 border-success/30 opacity-50' : 'bg-card border-border hover:border-primary/50'}`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg shrink-0 ${quest.completed ? 'bg-success/20 text-success' : 'bg-secondary/20 text-secondary'}`}>
                  <Award size={22} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase italic leading-none">{quest.title}</h4>
                  {/* ✅ AGORA COM DESCRIÇÃO DA MISSÃO */}
                  <p className="text-[10px] text-muted font-bold uppercase mt-1 leading-relaxed">
                    {quest.description || "Objetivo: Concluir atividade operacional do dia."}
                  </p>
                  <span className="text-[8px] font-black text-secondary uppercase mt-2 block">RECOMPENSA: +{quest.reward} XP</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HALL DA FAMA (BADGES) */}
      <div className="px-1 space-y-4">
        <div className="flex items-center gap-2 px-2 border-l-4 border-primary">
          <Star size={20} className="text-primary" />
          <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Hall da Fama</h3>
        </div>
        <div className="bg-card/30 p-4 rounded-2xl border border-border/50">
           <BadgeList history={history} />
        </div>
      </div>

      {/* REGISTROS DE BATALHA (O SEU HISTÓRICO) */}
      <div className="px-1 space-y-4">
        <div className="flex items-center gap-2 px-2 border-l-4 border-success">
          <HistoryIcon size={20} className="text-success" />
          <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Registros de Batalha</h3>
        </div>
        <HistoryView 
           history={history} bodyHistory={bodyHistory} deleteEntry={deleteEntry} 
           updateEntry={updateEntry} setView={setView} isEmbedded={true} 
        />
      </div>
    </div>
  );
};

export default DashboardView;