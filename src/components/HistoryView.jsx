import React, { useState } from 'react';
import { Scale, Trash2, Activity, Database, ChevronRight, ChevronDown, Calendar, Folder, FolderOpen } from 'lucide-react';

// --- HELPER: Calcular número da semana do ano ---
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
};

// --- HELPER: Agrupar Dados (Mês -> Semana -> Treinos) ---
const groupHistoryByDate = (history) => {
  const groups = {};

  history.forEach(session => {
    const [day, month, year] = session.date.split('/');
    const dateObj = new Date(year, month - 1, day);
    
    // Chave do Mês (ex: "JANEIRO 2026")
    const monthKey = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
    
    // Chave da Semana (ex: "SEMANA 05")
    const weekNum = getWeekNumber(dateObj);
    const weekKey = `SEMANA ${weekNum}`;

    if (!groups[monthKey]) groups[monthKey] = {};
    if (!groups[monthKey][weekKey]) groups[monthKey][weekKey] = [];

    groups[monthKey][weekKey].push(session);
  });

  return groups;
};

// --- COMPONENTE 4: O EXERCÍCIO (Último Nível) ---
const ExerciseItem = ({ exercise }) => {
  return (
    <div className="flex items-center justify-between p-2 border-b border-border last:border-0 hover:bg-input/30 transition-colors">
      <span className={`text-[10px] font-bold uppercase truncate ${exercise.done ? "text-main" : "text-muted line-through"}`}>
        {exercise.name}
      </span>
      
      <div className="flex gap-1">
        {Array.isArray(exercise.sets) ? (
          <div className="flex gap-1">
             {/* Mostra o melhor set ou o último */}
             {exercise.sets.slice(-1).map((set, k) => (
                <span key={k} className="text-[9px] font-black text-success border border-border px-1 rounded bg-card">
                  {set.weight}kg
                </span>
             ))}
          </div>
        ) : (
          <span className="text-[9px] text-muted">OK</span>
        )}
      </div>
    </div>
  );
};

// --- COMPONENTE 3: O DIA/TREINO (Card que expande) ---
const DayAccordion = ({ session, deleteEntry }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-2">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isOpen ? 'bg-input border-primary/50 shadow-[0_0_10px_rgba(var(--primary),0.1)]' : 'bg-card border-border hover:border-primary/30'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90 text-primary' : 'text-muted'}`}>
            <ChevronRight size={14} />
          </div>
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wide ${isOpen ? 'text-primary' : 'text-main'}`}>
              {session.dayName}
            </h4>
            <span className="text-[9px] text-muted font-bold tracking-widest">{session.date}</span>
          </div>
        </div>

        {/* Botão Deletar (Só aparece se aberto ou no hover) */}
        <button 
          onClick={(e) => { e.stopPropagation(); deleteEntry(session.id, 'workout'); }}
          className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Conteúdo do Treino (Exercícios) */}
      {isOpen && (
        <div className="ml-4 pl-4 border-l-2 border-primary/20 mt-2 space-y-1 animate-in slide-in-from-top-2 fade-in duration-200">
          {session.note && (
             <div className="text-[9px] text-warning italic p-2 bg-warning/5 rounded mb-2 border border-warning/20">
               "{session.note}"
             </div>
          )}
          
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {session.exercises.map((ex, i) => (
              <ExerciseItem key={i} exercise={ex} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE 2: A SEMANA (Pasta) ---
const WeekAccordion = ({ weekTitle, sessions, deleteEntry }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="ml-2 mb-2">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 cursor-pointer text-muted hover:text-secondary transition-colors group select-none"
      >
        {isOpen ? <FolderOpen size={14} className="text-secondary" /> : <Folder size={14} />}
        <span className="text-[10px] font-black uppercase tracking-widest group-hover:tracking-[0.2em] transition-all">
          {weekTitle} <span className="text-[9px] opacity-50 ml-1">({sessions.length} Treinos)</span>
        </span>
      </div>

      {isOpen && (
        <div className="pl-2 mt-1 animate-in slide-in-from-left-2 fade-in">
          {sessions.map(session => (
            <DayAccordion key={session.id} session={session} deleteEntry={deleteEntry} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE 1: O MÊS (Raiz) ---
const MonthAccordion = ({ monthTitle, weeksData, deleteEntry }) => {
  // Começa aberto para facilitar
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-4">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-primary/10 border-l-4 border-primary p-3 rounded-r-lg cursor-pointer hover:bg-primary/20 transition-all select-none"
      >
        <Calendar size={16} className="text-primary" />
        <h3 className="text-sm font-black text-primary uppercase tracking-widest flex-1">
          {monthTitle}
        </h3>
        <ChevronDown size={16} className={`text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="mt-2 pl-2 border-l border-primary/10 ml-2 space-y-2">
          {Object.entries(weeksData).map(([weekKey, sessions]) => (
            <WeekAccordion 
              key={weekKey} 
              weekTitle={weekKey} 
              sessions={sessions} 
              deleteEntry={deleteEntry} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- VIEW PRINCIPAL ---
const HistoryView = ({ history, bodyHistory, deleteEntry, setView }) => {
  const sortedBody = [...bodyHistory].reverse();
  
  // Agrupa os dados
  const groupedHistory = groupHistoryByDate(history);
  // Ordena meses (mais recente primeiro - gambiarra simples convertendo string para data seria ideal, mas array keys reverse funciona se inserido em ordem)
  // Como as chaves de objeto não garantem ordem, vamos forçar ordem reversa baseada nas keys
  const monthKeys = Object.keys(groupedHistory).reverse(); 

  return (
    <main className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 font-cyber pb-24 h-full flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-primary/30 pb-4 shrink-0">
        <h2 className="text-xl font-black flex items-center gap-3 italic text-primary uppercase drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]">
          <Database size={24} className="text-primary" /> Log de Operações
        </h2>
        <span className="text-[8px] font-black text-muted tracking-[0.3em]">RECOVERY.SYS</span>
      </div>

      {/* --- ÁRVORE DE ARQUIVOS (HISTORY TREE) --- */}
      <div className="flex-1 min-h-0 flex flex-col gap-3">
        <div className="flex items-center justify-between px-1 shrink-0">
          <h3 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <Activity size={14} /> Histórico de Combate
          </h3>
          <span className="text-[9px] text-muted font-bold">{history.length} ARQUIVOS</span>
        </div>

        <div className="overflow-y-auto pr-2 pb-10 max-h-[50vh]">
          {history.length === 0 && (
            <div className="bg-card/20 border border-dashed border-border p-8 rounded-2xl text-center">
              <p className="text-muted text-[10px] font-black uppercase tracking-widest italic">Buffer Vazio.</p>
            </div>
          )}

          {/* Renderiza os Meses */}
          {monthKeys.map(month => (
            <MonthAccordion 
              key={month} 
              monthTitle={month} 
              weeksData={groupedHistory[month]} 
              deleteEntry={deleteEntry} 
            />
          ))}
        </div>
      </div>

      {/* --- BIOMETRIA (MANTIDA HORIZONTAL) --- */}
      <div className="shrink-0 space-y-3 pt-2 border-t border-border">
        <h3 className="text-[10px] font-black text-secondary uppercase tracking-widest px-1 flex items-center gap-2">
          <Scale size={14} /> Biometria
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1">
          {sortedBody.map((b) => (
            <div key={b.id} className="min-w-[150px] bg-card border border-secondary/30 p-3 rounded-xl shadow-sm relative group hover:border-secondary/60 transition-all shrink-0 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2 border-b border-secondary/10 pb-1">
                <span className="font-black text-secondary text-[10px]">{b.date}</span>
                <button onClick={() => deleteEntry(b.id, 'body')} className="text-muted hover:text-red-500">
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="flex justify-between items-end gap-2">
                <div>
                  <p className="text-[8px] text-muted uppercase font-bold mb-0.5">Peso</p>
                  <p className="text-xl font-black text-success leading-none">{b.weight}<span className="text-[8px] ml-0.5 text-muted">KG</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-muted uppercase font-bold mb-0.5">Cintura</p>
                  <p className="text-xl font-black text-primary leading-none">{b.waist}<span className="text-[8px] ml-0.5 text-muted">CM</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <button 
        onClick={() => setView('workout')} 
        className="w-full py-4 bg-card hover:bg-input border border-border hover:border-primary rounded-xl font-black text-[10px] uppercase tracking-[0.3em] text-muted hover:text-primary transition-all shrink-0"
      >
        Voltar ao Combate
      </button>
    </main>
  );
};

export default HistoryView;