import React, { useMemo } from 'react';
import { Shield, Zap, Target, Award, Scroll, Star, History as HistoryIcon, ChevronRight, PlusCircle } from 'lucide-react';
import { calculateStats } from '../utils/rpgSystem'; 
import BadgeList from './BadgeList'; 
import HistoryView from './HistoryView';

// --- COMPONENTE DO ESTADO VAZIO INLINE ---
const EmptyWorkoutState = ({ onStartWorkout }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 mt-4 bg-card border-2 border-dashed border-primary/40 rounded-3xl text-center relative overflow-hidden shadow-sm">
      
      {/* Ícone Central - Contraste aprimorado */}
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/30 relative z-10 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
        <Target size={40} className="text-primary opacity-90" />
        <div className="absolute inset-0 rounded-full border border-primary animate-ping opacity-20"></div>
      </div>

      {/* Texto Tático - Adaptado para Claro/Escuro */}
      <h2 className="text-xl font-black text-main tracking-widest uppercase mb-2 relative z-10">
        Arsenal Vazio
      </h2>
      <p className="text-main/60 text-xs mb-8 max-w-[250px] relative z-10 leading-relaxed font-bold uppercase">
        Nenhum registro de combate detectado. Inicie seu treinamento para calibrar o sistema.
      </p>

      {/* Botão de Chamada para Ação Padrão Ouro */}
      <button
        onClick={onStartWorkout}
        className="flex items-center gap-2 bg-primary text-white font-black uppercase tracking-widest px-6 py-4 rounded-2xl hover:brightness-110 transition-all shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:shadow-[0_0_30px_rgba(var(--primary),0.6)] active:scale-95 relative z-10 animate-pulse"
      >
        <PlusCircle size={20} className="drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]" />
        Iniciar Missão 01
      </button>

    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
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

  // VERIFICA SE O USUÁRIO É NOVO (Histórico Vazio)
  const isNewRecruit = !history || history.length === 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-cyber pb-24">
      
      {/* STATUS IMPONENTE (Aparece sempre, mesmo para nível 1) */}
      <div className="bg-card border-b-2 border-primary/50 p-6 rounded-b-2xl relative overflow-hidden shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-80">Operacional Disponível</span>
            {/* text-white removido. text-main + drop-shadow garante legibilidade universal */}
            <h2 className="text-4xl font-black text-main leading-none drop-shadow-[0_0_10px_rgba(var(--primary),0.2)]">
              NÍVEL {currentLevel}
            </h2>
          </div>
          <div className="text-right">
            {/* text-muted trocado por text-main/60 para não sumir */}
            <span className="text-[10px] font-bold text-main/60 uppercase">XP ACUMULADO</span>
            <p className="text-xl font-black text-secondary drop-shadow-[0_0_5px_rgba(var(--secondary),0.3)]">
              {currentXP.toLocaleString()}
            </p>
          </div>
        </div>
        
        {/* Barra de progresso com bg-input para suportar modo claro */}
        <div className="h-2.5 bg-input rounded-full border border-border relative overflow-hidden shadow-inner">
          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-secondary to-primary transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
        </div>
        
        <div className="flex justify-between mt-2 px-1">
           <span className="text-[7px] font-black text-primary/80 uppercase tracking-wider">RANK: {isNewRecruit ? 'RECRUTA' : 'ELITE'}</span>
           <span className="text-[7px] font-black text-main/60 uppercase tracking-wider">META: {nextLevelXP.toLocaleString()}</span>
        </div>
      </div>

      {/* RENDERIZAÇÃO CONDICIONAL: SE FOR NOVO RECRUTA, MOSTRA O EMPTY STATE */}
      {isNewRecruit ? (
        <div className="px-2">
           <EmptyWorkoutState onStartWorkout={() => setView('add')} />
        </div>
      ) : (
        /* SE NÃO FOR RECRUTA, MOSTRA O RESTO DO DASHBOARD NORMALMENTE */
        <>
          {/* MISSÕES COM DESCRIÇÃO */}
          <div className="px-1 space-y-4">
            <div className="flex items-center gap-2 px-2 border-l-4 border-secondary">
              <Scroll size={20} className="text-secondary" />
              {/* text-main no lugar de text-white */}
              <h3 className="text-sm font-black text-main uppercase tracking-widest">Contratos de Elite</h3>
            </div>
            <div className="grid gap-3">
              {quests.map((quest) => (
                <div key={quest.id} className={`group p-4 rounded-xl border transition-all ${quest.completed ? 'bg-success/5 border-success/30 opacity-60' : 'bg-card border-border shadow-sm hover:border-secondary/50'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg shrink-0 ${quest.completed ? 'bg-success/10 text-success' : 'bg-secondary/10 text-secondary border border-secondary/20'}`}>
                      <Award size={22} />
                    </div>
                    <div>
                      {/* text-main garantido */}
                      <h4 className="text-xs font-black text-main uppercase leading-none">{quest.title}</h4>
                      <p className="text-[10px] text-main/60 font-bold uppercase mt-1.5 leading-relaxed">
                        {quest.description || "Objetivo: Concluir atividade operacional do dia."}
                      </p>
                      <span className="text-[8px] font-black text-secondary uppercase mt-2 block tracking-wider">RECOMPENSA: +{quest.reward} XP</span>
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
              <h3 className="text-sm font-black text-main uppercase tracking-widest">Hall da Fama</h3>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
               <BadgeList history={history} />
            </div>
          </div>

          {/* REGISTROS DE BATALHA (O SEU HISTÓRICO) */}
          <div className="px-1 space-y-4">
            <div className="flex items-center gap-2 px-2 border-l-4 border-success">
              <HistoryIcon size={20} className="text-success" />
              <h3 className="text-sm font-black text-main uppercase tracking-widest">Registros de Batalha</h3>
            </div>
            {/* O bg transparente de fundo foi delegado ao componente HistoryView */}
            <div className="bg-card rounded-2xl border border-border p-2 shadow-sm">
              <HistoryView 
                 history={history} bodyHistory={bodyHistory} deleteEntry={deleteEntry} 
                 updateEntry={updateEntry} setView={setView} isEmbedded={true} 
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardView;