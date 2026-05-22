import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom'; 
import { Trash2, Activity, Database, ChevronRight, ChevronDown, Calendar, Folder, FolderOpen, Pencil, Save, X, Share2, Zap, AlertTriangle, Clock, BarChart2, Info, Download } from 'lucide-react'; 
import { toPng, toBlob } from 'html-to-image';
import ShareCard from '../export/ShareCard'; 

// --- HELPERS ---
const normalizeName = (name) => name ? name.toLowerCase().trim() : "";

const parseDateSafe = (dateString) => {
  if (!dateString) return new Date();
  let day, month, year;
  if (dateString.includes('/')) { [day, month, year] = dateString.split('/'); } 
  else if (dateString.includes('-')) { [year, month, day] = dateString.split('-'); } 
  else { return new Date(); }
  return new Date(year, month - 1, day, 12, 0, 0);
};

const getFallbackDayName = (dateString) => {
  const date = parseDateSafe(dateString);
  return date.toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase();
};

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const groupHistoryByDate = (history) => {
  const groups = {};
  history.forEach(session => {
    if (!session.date) return;
    const dateObj = parseDateSafe(session.date);
    const yearKey = dateObj.getFullYear().toString();
    const monthKey = dateObj.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();
    const firstDay = new Date(dateObj.getFullYear(), 0, 1);
    const pastDays = (dateObj - firstDay) / 86400000;
    const weekNum = Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
    const weekKey = `SEMANA ${weekNum}`;

    if (!groups[yearKey]) groups[yearKey] = {};
    if (!groups[yearKey][monthKey]) groups[yearKey][monthKey] = {};
    if (!groups[yearKey][monthKey][weekKey]) groups[yearKey][monthKey][weekKey] = [];
    
    groups[yearKey][monthKey][weekKey].push({ ...session, _ts: dateObj.getTime() });
  });

  Object.keys(groups).forEach(year => {
    Object.keys(groups[year]).forEach(month => {
      Object.keys(groups[year][month]).forEach(week => {
        groups[year][month][week].sort((a, b) => b._ts - a._ts);
      });
    });
  });
  return groups;
};

const calculateVolume = (exercises) => {
  let total = 0;
  exercises.forEach(ex => {
    if (ex.sets) {
      ex.sets.forEach(set => {
        const weight = parseFloat(String(set.weight).replace(',', '.')) || 0;
        const reps = parseInt(set.reps) || 0;
        total += (weight * reps);
      });
    }
  });
  return Math.round(total);
};

// --- COMPONENTES VISUAIS COMPACTOS ---

const ExerciseItemView = ({ exercise }) => {
  const isCompleted = exercise.done === true || exercise.completed === true || exercise.checked === true;
  const hasSets = Array.isArray(exercise.sets) && exercise.sets.length > 0;

  return (
    <div className={`flex items-center justify-between p-2 border-b border-border last:border-0 transition-colors ${!isCompleted ? 'bg-red-500/5' : 'hover:bg-input/30'}`}>
      <span className={`text-xs font-bold uppercase truncate flex-1 mr-2 ${isCompleted ? 'text-main' : 'text-muted line-through opacity-60'}`}>
        {exercise.swappedName || exercise.name}
      </span>
      <div className="flex gap-1 shrink-0">
        {isCompleted && hasSets ? (
          <div className="flex gap-1 flex-wrap justify-end">
             {exercise.sets.map((set, k) => {
                const isSetDone = set.completed || (set.weight && set.reps);
                if(!isSetDone) return null;
                return (
                  <div key={k} className="flex items-center gap-0.5 bg-card border border-border px-1.5 py-0.5 rounded shadow-sm">
                    <span className="text-[10px] font-black text-success">{set.weight || 0}</span>
                    <span className="text-[8px] text-muted">kg</span>
                    <span className="text-[8px] text-muted mx-0.5">•</span>
                    <span className="text-[10px] font-black text-primary">{set.reps || 0}</span>
                  </div>
                )
             })}
          </div>
        ) : isCompleted && !hasSets ? (
          <span className="text-[10px] text-primary font-black uppercase tracking-widest">Concluído</span>
        ) : (
          <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 rounded">Pulado</span>
        )}
      </div>
    </div>
  );
};

const ExerciseItemEdit = ({ exercise, index, updateExercise }) => {
  const handleSetChange = (setIndex, field, value) => {
    const newSets = [...exercise.sets];
    newSets[setIndex] = { ...newSets[setIndex], [field]: value };
    updateExercise(index, { ...exercise, sets: newSets });
  };
  return (
    <div className="p-2 border-b border-border bg-input/20">
      <div className="mb-1 text-xs font-black text-primary uppercase">{exercise.name}</div>
      <div className="space-y-1">
        {exercise.sets.map((set, k) => (
          <div key={k} className="flex items-center gap-2">
            <span className="text-[10px] text-muted w-4 font-bold">#{k+1}</span>
            <input 
              type="number" inputMode="decimal" value={set.weight || ''} 
              onChange={(e) => handleSetChange(k, 'weight', e.target.value)}
              className="w-14 bg-input border border-border rounded p-1 text-xs text-center font-bold text-main dark:text-white focus:border-primary outline-none"
              placeholder="KG"
            />
            <input 
              type="number" inputMode="numeric" value={set.reps || ''} 
              onChange={(e) => handleSetChange(k, 'reps', e.target.value)}
              className="w-10 bg-input border border-border rounded p-1 text-xs text-center font-bold text-main dark:text-white focus:border-secondary outline-none"
              placeholder="Reps"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const DayAccordion = ({ session, deleteEntry, updateEntry, onCardAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSession, setEditedSession] = useState(session);

  useEffect(() => { setEditedSession(session); }, [session]);

  const rawName = getFallbackDayName(session.date);
  const displayName = rawName.replace('-FEIRA', '');

  const consolidatedExercises = React.useMemo(() => {
      const map = new Map();
      session.exercises.forEach(ex => {
          const key = normalizeName(ex.name);
          if (map.has(key)) {
              const existing = map.get(key);
              existing.sets = [...existing.sets, ...ex.sets]; 
          } else { map.set(key, JSON.parse(JSON.stringify(ex))); }
      });
      return Array.from(map.values());
  }, [session.exercises]);

  const handleSave = () => { updateEntry(session.id, editedSession); setIsEditing(false); };
  const handleCancel = () => { setEditedSession(session); setIsEditing(false); };
  const updateExercise = (index, updatedExercise) => {
    const newExercises = [...editedSession.exercises];
    newExercises[index] = updatedExercise;
    setEditedSession({ ...editedSession, exercises: newExercises });
  };

  return (
    <div className="mb-2">
      <div 
        onClick={() => !isEditing && setIsOpen(!isOpen)}
        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isOpen || isEditing ? 'bg-input border-primary/50 shadow-sm' : 'bg-card border-border hover:border-primary/30 shadow-sm'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90 text-primary' : 'text-muted'}`}>
            <ChevronRight size={16} />
          </div>
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wide ${isOpen ? 'text-primary' : 'text-main'}`}>
              {displayName}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted font-bold tracking-widest">{session.date}</span>
              {session.duration > 0 && (
                <>
                  <span className="text-[8px] text-border">•</span>
                  <span className="text-[10px] text-secondary font-black tracking-widest flex items-center gap-1">
                     <Clock size={10} /> {formatDuration(session.duration)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isEditing ? (
            <>
              <button onClick={(e) => { e.stopPropagation(); handleSave(); }} className="p-1.5 bg-success text-black rounded hover:brightness-110"><Save size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); handleCancel(); }} className="p-1.5 bg-card border border-border text-muted rounded hover:text-main dark:hover:text-white hover:bg-input"><X size={14} /></button>
            </>
          ) : (
            <>
              {/* 🔥 OPÇÃO 1: BAIXAR IMAGEM */}
              <button 
                onClick={(e) => { e.stopPropagation(); onCardAction(session, 'download'); }} 
                className="p-1.5 text-primary bg-primary/10 border border-primary/30 hover:bg-primary hover:text-black rounded transition-colors shadow-sm"
                title="Baixar Imagem"
              >
                <Download size={14} />
              </button>

              {/* 🔥 OPÇÃO 2: COMPARTILHAR IMAGEM */}
              <button 
                onClick={(e) => { e.stopPropagation(); onCardAction(session, 'share'); }} 
                className="p-1.5 text-secondary bg-secondary/10 border border-secondary/30 hover:bg-secondary hover:text-black rounded transition-colors shadow-sm"
                title="Compartilhar Imagem"
              >
                <Share2 size={14} />
              </button>

              <div className="w-px h-4 bg-border mx-1"></div>

              <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsOpen(true); }} className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Editar"><Pencil size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); deleteEntry(session.id, 'workout'); }} className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Deletar"><Trash2 size={14} /></button>
            </>
          )}
        </div>
      </div>

      {(isOpen || isEditing) && (
        <div className="ml-1 pl-3 border-l border-primary/20 mt-2 space-y-2 animate-in slide-in-from-top-1 fade-in duration-200">
          {isEditing ? (
             <textarea value={editedSession.note || ''} onChange={(e) => setEditedSession({...editedSession, note: e.target.value})} className="w-full bg-card border border-warning/50 rounded-lg p-2 text-xs text-warning font-medium outline-none h-16 shadow-inner" placeholder="Editar observações..." />
          ) : (
            session.note && <div className="text-[10px] text-warning p-2 bg-warning/5 rounded border border-warning/20">"{session.note}"</div>
          )}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            {isEditing 
              ? editedSession.exercises.map((ex, i) => <ExerciseItemEdit key={i} index={i} exercise={ex} updateExercise={updateExercise} />)
              : consolidatedExercises.map((ex, i) => <ExerciseItemView key={i} exercise={ex} />)
            }
          </div>
        </div>
      )}
    </div>
  );
};

const WeekAccordion = ({ weekTitle, sessions, deleteEntry, updateEntry, onCardAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="ml-1 mb-2">
      <div onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 p-2 cursor-pointer text-muted hover:text-secondary transition-colors group select-none">
        {isOpen ? <FolderOpen size={16} className="text-secondary" /> : <Folder size={16} />}
        <span className="text-[10px] font-black uppercase tracking-widest group-hover:tracking-[0.2em] transition-all">
          {weekTitle} <span className="text-[9px] opacity-50 ml-1">({sessions.length})</span>
        </span>
      </div>
      {isOpen && <div className="pl-1 mt-1 animate-in slide-in-from-left-1 fade-in">{sessions.map(session => <DayAccordion key={session.id} session={session} deleteEntry={deleteEntry} updateEntry={updateEntry} onCardAction={onCardAction} />)}</div>}
    </div>
  );
};

const MonthAccordion = ({ monthTitle, weeksData, deleteEntry, updateEntry, onCardAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const sortedWeekKeys = Object.keys(weeksData).sort((a, b) => (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0)).reverse();

  return (
    <div className="mb-2">
      <div onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 bg-card border border-border p-3 rounded-lg cursor-pointer hover:border-primary/50 transition-all select-none">
        <Calendar size={16} className="text-muted" />
        <h3 className="text-xs font-black text-main uppercase tracking-widest flex-1">{monthTitle}</h3>
        <ChevronDown size={16} className={`text-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && <div className="mt-2 pl-2 border-l border-border ml-2 space-y-1">{sortedWeekKeys.map(weekKey => <WeekAccordion key={weekKey} weekTitle={weekKey} sessions={weeksData[weekKey]} deleteEntry={deleteEntry} updateEntry={updateEntry} onCardAction={onCardAction} />)}</div>}
    </div>
  );
};

const YearAccordion = ({ yearTitle, monthsData, deleteEntry, updateEntry, onCardAction }) => {
  const [isOpen, setIsOpen] = useState(false); 
  const monthOrder = ["DEZEMBRO", "NOVEMBRO", "OUTUBRO", "SETEMBRO", "AGOSTO", "JULHO", "JUNHO", "MAIO", "ABRIL", "MARÇO", "FEVEREIRO", "JANEIRO"];
  const sortedMonths = Object.keys(monthsData).sort((a, b) => {
     const monthA = a.split(' ')[0];
     const monthB = b.split(' ')[0];
     return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
  });

  return (
    <div className="mb-4">
      <div onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 bg-primary/10 border-l-2 border-primary p-3 rounded-r-lg cursor-pointer hover:bg-primary/20 transition-all select-none">
        <Database size={16} className="text-primary" />
        <h2 className="text-sm font-black text-primary uppercase tracking-widest flex-1">ANO {yearTitle}</h2>
        <ChevronDown size={18} className={`text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="mt-3 space-y-2">
          {sortedMonths.map(month => (
            <MonthAccordion key={month} monthTitle={month} weeksData={monthsData[month]} deleteEntry={deleteEntry} updateEntry={updateEntry} onCardAction={onCardAction} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
const HistoryView = ({ history, deleteEntry, updateEntry, setView }) => {
  const groupedHistory = groupHistoryByDate(history);
  const yearKeys = Object.keys(groupedHistory).sort((a, b) => parseInt(b) - parseInt(a)); 

  const [itemToDelete, setItemToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  
  // 🔥 ESTADO ÚNICO PARA GERENCIAR AS AÇÕES DE IMAGEM
  const [cardAction, setCardAction] = useState(null); // { session, type: 'download' | 'share' }
  const shareCardRef = useRef(null);

  const requestDelete = (id, type) => setItemToDelete({ id, type });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500); 
  };

  const getStatsForShareCard = (data) => {
    if (!data) return { duration: '00:00', volume: '0', prs: 0 };
    return {
      duration: formatDuration(data.duration),
      volume: calculateVolume(data.exercises || []).toString(),
      prs: 0
    };
  };

  // 🔥 LÓGICA DE GERAÇÃO: EXECUTA O DOWNLOAD OU O SHARE DIRETO BASEADO NO BOTÃO CLICADO
  useEffect(() => {
    if (cardAction && shareCardRef.current) {
      const { session, type } = cardAction;
      const toastMsg = type === 'download' ? "Baixando Card..." : "Preparando Compartilhamento...";
      const toastTimer = setTimeout(() => showToast(toastMsg), 0);
      
      const renderTimer = setTimeout(() => { 
        
        if (type === 'download') {
          // AÇÃO 1: BAIXAR DIRETO
          toPng(shareCardRef.current, { cacheBust: true, pixelRatio: 1 })
            .then((dataUrl) => {
              const link = document.createElement('a');
              const safeDate = session.date.replace(/\//g, '-');
              link.download = `SOLO_OS_${safeDate}.png`;
              link.href = dataUrl;
              link.click();
              showToast("Card baixado com sucesso!");
            })
            .catch(err => { console.error(err); showToast("Erro ao gerar imagem."); })
            .finally(() => setCardAction(null));

        } else if (type === 'share') {
          // AÇÃO 2: COMPARTILHAR IMAGEM DIRETO PRO APP
          toBlob(shareCardRef.current, { cacheBust: true, pixelRatio: 1 })
            .then(async (blob) => {
              if (!blob) throw new Error("Falha na geração do arquivo");

              const safeDate = session.date.replace(/\//g, '-');
              const file = new File([blob], `SOLO_OS_${safeDate}.png`, { type: 'image/png' });

              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                  await navigator.share({
                    title: `Vitória Confirmada - ${session.date}`,
                    text: `Mais uma missão cumprida no SOLO. 🦾`,
                    files: [file]
                  });
                  showToast("Concluído!");
                } catch (shareErr) {
                  console.log("Compartilhamento cancelado", shareErr);
                }
              } else {
                // Fallback pro PC ou navegador não suportado
                showToast("Compartilhamento de imagem não suportado. Baixando arquivo...");
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = file.name;
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
              }
            })
            .catch(err => { console.error(err); showToast("Erro ao preparar arquivo."); })
            .finally(() => setCardAction(null));
        }

      }, 500); 

      return () => { clearTimeout(toastTimer); clearTimeout(renderTimer); };
    }
  }, [cardAction]);

 return (
    <>
      <main className="flex flex-col min-h-[calc(100vh-12rem)] space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 font-cyber pb-4">
        <div className="flex items-center justify-between border-b border-primary/30 pb-3 shrink-0">
          <h2 className="text-lg font-black flex items-center gap-2 text-primary uppercase drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]">
            <Database size={20} className="text-primary" /> Data Core
          </h2>
          <span className="text-[8px] font-black text-muted tracking-[0.2em]">LOGS.SYS</span>
        </div>

        <div className="flex flex-col gap-3">
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm mb-2">
            <div className="flex items-center justify-between mb-3">
               <h3 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                 <BarChart2 size={14} /> Relatórios de Overload
               </h3>
               <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase tracking-widest">Premium</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => showToast("Módulo de Balanço Mensal em desenvolvimento.")}
                className="flex-1 py-2.5 bg-input border border-border rounded-lg text-[10px] font-black text-muted uppercase tracking-widest hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1"
              >
                 <Calendar size={12} /> Mensal
              </button>
              <button 
                onClick={() => showToast("SOLO Wrapped (Relatório Anual) estará disponível no fim do ciclo.")}
                className="flex-1 py-2.5 bg-input border border-border rounded-lg text-[10px] font-black text-muted uppercase tracking-widest hover:border-secondary hover:text-secondary transition-colors flex items-center justify-center gap-1"
              >
                 <Zap size={12} /> Anual
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 shrink-0 mt-2">
            <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} /> Histórico de Operações
            </h3>
            <span className="text-[10px] text-muted font-bold">{history.length} SESSÕES</span>
          </div>

          <div className="overflow-y-auto pr-1 max-h-[60vh]">
            {history.length === 0 && (
              <div className="bg-card/40 border border-dashed border-border p-6 rounded-xl text-center">
                <p className="text-muted text-xs font-black uppercase tracking-widest ">Buffer Vazio.</p>
              </div>
            )}
            
            {yearKeys.map(year => (
              <YearAccordion 
                key={year} 
                yearTitle={year} 
                monthsData={groupedHistory[year]} 
                deleteEntry={requestDelete} 
                updateEntry={updateEntry} 
                onCardAction={(session, type) => setCardAction({ session, type })} 
              />
            ))}
          </div>
        </div>

        <button onClick={() => setView('workout')} className="mt-auto w-full py-4 bg-card hover:bg-primary/5 border border-border hover:border-primary rounded-xl font-black text-xs uppercase tracking-[0.2em] text-muted hover:text-primary transition-all shadow-sm">
          Retornar à Base
        </button>
      </main>

      {/* MODAL DE DELEÇÃO */}
      {itemToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-center items-center p-4">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setItemToDelete(null)}></div>
          <div className="bg-card border-2 border-red-500/50 w-full max-w-xs rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-red-500 uppercase tracking-widest">Deletar Registro?</h3>
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-2 leading-relaxed">Esta ação é permanente e os dados serão obliterados do sistema SOLO.</p>
              </div>
              <div className="flex gap-3 pt-4 border-t border-border/50">
                <button onClick={() => setItemToDelete(null)} className="flex-1 py-3 rounded-xl border border-border text-muted font-black uppercase text-xs hover:bg-input hover:text-main dark:hover:text-white transition-all">Cancelar</button>
                <button onClick={() => { deleteEntry(itemToDelete.id, itemToDelete.type); setItemToDelete(null); }} className="flex-1 py-3 rounded-xl bg-red-600/20 border border-red-500 text-red-500 font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all">Confirmar</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* O SHARE CARD (Invisível) */}
      <ShareCard
        cardRef={shareCardRef}
        stats={getStatsForShareCard(cardAction?.session)}
        bossName={cardAction?.session?.dayName || cardAction?.session?.title || 'Treino'}
        streak={cardAction?.session?.streak || 1} 
        xp={cardAction?.session?.xpEarned || 500}
        currentLevel={cardAction?.session?.level || 1}
        totalXp={1000}
        bossHp={5000}
        variant="rpg"
      />

      {/* TOAST DE FEEDBACK */}
      {toastMessage && createPortal(
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[99999] animate-in slide-in-from-bottom-10 fade-in duration-300">
           <div className="bg-black border border-primary/50 shadow-[0_0_20px_rgba(var(--primary),0.3)] rounded-full px-6 py-3 flex items-center gap-3">
              <Info size={16} className="text-primary" />
              <span className="text-xs font-bold text-white tracking-wide">{toastMessage}</span>
           </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default HistoryView;