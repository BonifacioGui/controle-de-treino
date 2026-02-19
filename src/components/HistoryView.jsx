import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; 
import { Scale, Trash2, Activity, Database, ChevronRight, ChevronDown, Calendar, Folder, FolderOpen, Pencil, Save, X, FileText, Share2, Zap, Plus, CalendarDays } from 'lucide-react';
import { supabase } from '../supabaseClient'; // 🔥 IMPORTANTE PARA SALVAR DIRETO AQUI

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

const groupHistoryByDate = (history) => {
  const groups = {};
  history.forEach(session => {
    if (!session.date) return;
    const dateObj = parseDateSafe(session.date);
    const monthKey = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
    
    const firstDay = new Date(dateObj.getFullYear(), 0, 1);
    const pastDays = (dateObj - firstDay) / 86400000;
    const weekNum = Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
    const weekKey = `SEMANA ${weekNum}`;

    if (!groups[monthKey]) groups[monthKey] = {};
    if (!groups[monthKey][weekKey]) groups[monthKey][weekKey] = [];
    groups[monthKey][weekKey].push({ ...session, _ts: dateObj.getTime() });
  });

  Object.keys(groups).forEach(month => {
    Object.keys(groups[month]).forEach(week => {
      groups[month][week].sort((a, b) => b._ts - a._ts);
    });
  });
  return groups;
};

const calculateVolume = (exercises) => {
  let total = 0;
  exercises.forEach(ex => {
    if (ex.sets) {
      ex.sets.forEach(set => {
        const weight = parseFloat(set.weight) || 0;
        const reps = parseInt(set.reps) || 0;
        total += (weight * reps);
      });
    }
  });
  return total;
};

// --- COMPONENTES VISUAIS COMPACTOS ---

const ExerciseItemView = ({ exercise }) => {
  return (
    <div className="flex items-center justify-between p-2 border-b border-border last:border-0 hover:bg-input/30 transition-colors">
      <span className="text-xs font-bold uppercase truncate text-main flex-1 mr-2">
        {exercise.name}
      </span>
      <div className="flex gap-1 shrink-0">
        {Array.isArray(exercise.sets) && exercise.sets.length > 0 ? (
          <div className="flex gap-1 flex-wrap justify-end">
             {exercise.sets.map((set, k) => (
                <div key={k} className="flex items-center gap-0.5 bg-card border border-border px-1.5 py-0.5 rounded">
                  <span className="text-[10px] font-black text-success">{set.weight}</span>
                  <span className="text-[8px] text-muted">kg</span>
                  <span className="text-[8px] text-muted mx-0.5">•</span>
                  <span className="text-[10px] font-black text-primary">{set.reps}</span>
                </div>
             ))}
          </div>
        ) : (
          <span className="text-[10px] text-muted">Concluído</span>
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
              type="number" inputMode="decimal" value={set.weight} 
              onChange={(e) => handleSetChange(k, 'weight', e.target.value)}
              className="w-14 bg-input border border-border rounded p-1 text-xs text-center font-bold focus:border-primary outline-none"
              placeholder="KG"
            />
            <input 
              type="number" inputMode="numeric" value={set.reps} 
              onChange={(e) => handleSetChange(k, 'reps', e.target.value)}
              className="w-10 bg-input border border-border rounded p-1 text-xs text-center font-bold focus:border-secondary outline-none"
              placeholder="Reps"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const DayAccordion = ({ session, deleteEntry, updateEntry, openReport }) => {
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
          } else {
              map.set(key, JSON.parse(JSON.stringify(ex)));
          }
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
        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isOpen || isEditing ? 'bg-input border-primary/50 shadow-sm' : 'bg-card border-border hover:border-primary/30'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90 text-primary' : 'text-muted'}`}>
            <ChevronRight size={16} />
          </div>
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wide ${isOpen ? 'text-primary' : 'text-main'}`}>
              {displayName}
            </h4>
            <span className="text-[10px] text-muted font-bold tracking-widest">{session.date}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button onClick={(e) => { e.stopPropagation(); handleSave(); }} className="p-1.5 bg-success text-black rounded hover:brightness-110"><Save size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); handleCancel(); }} className="p-1.5 bg-card border border-border text-muted rounded hover:text-white"><X size={14} /></button>
            </>
          ) : (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); openReport(session); }} 
                className="p-1.5 text-primary bg-primary/10 border border-primary/30 hover:bg-primary hover:text-black rounded transition-colors flex items-center gap-1"
                title="Relatório"
              >
                <FileText size={14} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsOpen(true); }} className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded transition-colors"><Pencil size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); deleteEntry(session.id, 'workout'); }} className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"><Trash2 size={14} /></button>
            </>
          )}
        </div>
      </div>

      {(isOpen || isEditing) && (
        <div className="ml-1 pl-3 border-l border-primary/20 mt-2 space-y-2 animate-in slide-in-from-top-1 fade-in duration-200">
          {isEditing ? (
             <textarea value={editedSession.note || ''} onChange={(e) => setEditedSession({...editedSession, note: e.target.value})} className="w-full bg-card border border-warning/50 rounded-lg p-2 text-xs text-warning font-medium outline-none h-16" placeholder="Editar observações..." />
          ) : (
            session.note && <div className="text-[10px] text-warning italic p-2 bg-warning/5 rounded border border-warning/20">"{session.note}"</div>
          )}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
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

const WeekAccordion = ({ weekTitle, sessions, deleteEntry, updateEntry, openReport }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="ml-1 mb-2">
      <div onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 p-2 cursor-pointer text-muted hover:text-secondary transition-colors group select-none">
        {isOpen ? <FolderOpen size={16} className="text-secondary" /> : <Folder size={16} />}
        <span className="text-[10px] font-black uppercase tracking-widest group-hover:tracking-[0.2em] transition-all">
          {weekTitle} <span className="text-[9px] opacity-50 ml-1">({sessions.length})</span>
        </span>
      </div>
      {isOpen && <div className="pl-1 mt-1 animate-in slide-in-from-left-1 fade-in">{sessions.map(session => <DayAccordion key={session.id} session={session} deleteEntry={deleteEntry} updateEntry={updateEntry} openReport={openReport} />)}</div>}
    </div>
  );
};

const MonthAccordion = ({ monthTitle, weeksData, deleteEntry, updateEntry, openReport }) => {
  const [isOpen, setIsOpen] = useState(true);
  const sortedWeekKeys = Object.keys(weeksData).sort((a, b) => (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0)).reverse();

  return (
    <div className="mb-4">
      <div onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 bg-primary/10 border-l-2 border-primary p-3 rounded-r-lg cursor-pointer hover:bg-primary/20 transition-all select-none">
        <Calendar size={16} className="text-primary" />
        <h3 className="text-xs font-black text-primary uppercase tracking-widest flex-1">{monthTitle}</h3>
        <ChevronDown size={16} className={`text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && <div className="mt-2 pl-1 border-l border-primary/10 ml-1 space-y-1">{sortedWeekKeys.map(weekKey => <WeekAccordion key={weekKey} weekTitle={weekKey} sessions={weeksData[weekKey]} deleteEntry={deleteEntry} updateEntry={updateEntry} openReport={openReport} />)}</div>}
    </div>
  );
};

const HistoryView = ({ history, bodyHistory, deleteEntry, updateEntry, setView }) => {
  const sortedBody = [...bodyHistory].reverse();
  const groupedHistory = groupHistoryByDate(history);
  const monthKeys = Object.keys(groupedHistory).reverse(); 

  const [reportData, setReportData] = useState(null);

  // 🔥 ESTADOS DO NOVO FORMULÁRIO DE BIOMETRIA 🔥
  const [showBioForm, setShowBioForm] = useState(false);
  const [bioWeight, setBioWeight] = useState('');
  const [bioWaist, setBioWaist] = useState('');
  const [bioDate, setBioDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSavingBio, setIsSavingBio] = useState(false);

  // Função independente para salvar biometria (Não precisa mexer no App.jsx)
  const handleSaveBiometrics = async () => {
    if (!bioWeight && !bioWaist) return;
    setIsSavingBio(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase.from('body_stats').upsert({
          user_id: session.user.id,
          date: bioDate,
          weight: parseFloat(bioWeight) || null,
          waist: parseFloat(bioWaist) || null
        }, { onConflict: 'user_id, date' });
        
        // Atualiza a página para puxar os dados frescos no formato correto
        window.location.reload(); 
      }
    } catch (err) {
      console.error(err);
    }
    setIsSavingBio(false);
  };

  return (
    <>
      <main className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 font-cyber pb-20 h-full flex flex-col">
        <div className="flex items-center justify-between border-b border-primary/30 pb-3 shrink-0">
          <h2 className="text-lg font-black flex items-center gap-2 italic text-primary uppercase drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]">
            <Database size={20} className="text-primary" /> Log de Operações
          </h2>
          <span className="text-[8px] font-black text-muted tracking-[0.2em]">RECOVERY.SYS</span>
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1 shrink-0">
            <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} /> Histórico
            </h3>
            <span className="text-[10px] text-muted font-bold">{history.length} LOGS</span>
          </div>

          <div className="overflow-y-auto pr-1 pb-8 max-h-[45vh]">
            {history.length === 0 && (
              <div className="bg-card/20 border border-dashed border-border p-6 rounded-xl text-center">
                <p className="text-muted text-xs font-black uppercase tracking-widest italic">Buffer Vazio.</p>
              </div>
            )}
            {monthKeys.map(month => <MonthAccordion key={month} monthTitle={month} weeksData={groupedHistory[month]} deleteEntry={deleteEntry} updateEntry={updateEntry} openReport={setReportData} />)}
          </div>
        </div>

        {/* 🔥 SEÇÃO DE BIOMETRIA ATUALIZADA COM FORMULÁRIO 🔥 */}
        <div className="shrink-0 space-y-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-secondary uppercase tracking-widest flex items-center gap-2">
              <Scale size={14} /> Biometria
            </h3>
            <button 
              onClick={() => setShowBioForm(!showBioForm)} 
              className={`flex items-center gap-1 px-2 py-1 rounded border transition-all text-[10px] font-black uppercase tracking-widest ${showBioForm ? 'bg-secondary text-black border-secondary' : 'bg-card text-secondary border-secondary/50 hover:bg-secondary/10'}`}
            >
              {showBioForm ? <X size={12}/> : <Plus size={12}/>} 
              {showBioForm ? 'Cancelar' : 'Registrar'}
            </button>
          </div>

          {/* O FORMULÁRIO EXPANSÍVEL */}
          {showBioForm && (
            <div className="bg-input/50 border border-secondary/30 rounded-xl p-4 animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-2 mb-3">
                <CalendarDays size={16} className="text-muted" />
                <input 
                  type="date" 
                  value={bioDate}
                  onChange={(e) => setBioDate(e.target.value)}
                  className="bg-transparent text-main text-xs font-bold w-full outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1 block">Peso (KG)</label>
                  <input 
                    type="number" inputMode="decimal" placeholder="00.0"
                    value={bioWeight} onChange={(e) => setBioWeight(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg p-3 text-center text-sm font-black text-success outline-none focus:border-success transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1 block">Cintura (CM)</label>
                  <input 
                    type="number" inputMode="decimal" placeholder="00.0"
                    value={bioWaist} onChange={(e) => setBioWaist(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg p-3 text-center text-sm font-black text-primary outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveBiometrics}
                disabled={isSavingBio || (!bioWeight && !bioWaist)}
                className="w-full bg-secondary text-black font-black uppercase tracking-widest py-3 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                {isSavingBio ? <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full"/> : <Save size={16} />}
                Salvar Medidas
              </button>
            </div>
          )}

          {/* LISTA DE CARDS DE BIOMETRIA */}
          <div className="flex gap-3 overflow-x-auto pb-2 pt-1 px-1 scrollbar-hide">
            {sortedBody.length === 0 && !showBioForm && (
              <div className="text-[10px] text-muted italic p-2">Nenhum registro biométrico encontrado.</div>
            )}
            {sortedBody.map((b) => (
              <div key={b.id} className="min-w-[120px] bg-card border border-secondary/30 p-3 rounded-lg shadow-sm relative group hover:border-secondary/60 transition-all shrink-0 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2 border-b border-secondary/10 pb-1">
                  <span className="font-black text-secondary text-[10px]">{b.date}</span>
                  <button onClick={() => deleteEntry(b.id, 'body')} className="text-muted hover:text-red-500"><Trash2 size={12} /></button>
                </div>
                <div className="flex justify-between items-end gap-2">
                  <div>
                    <p className="text-[8px] text-muted uppercase font-bold mb-0.5">Peso</p>
                    <p className="text-base font-black text-success leading-none">{b.weight || '--'}<span className="text-[8px] ml-0.5 text-muted">KG</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-muted uppercase font-bold mb-0.5">Cintura</p>
                    <p className="text-base font-black text-primary leading-none">{b.waist || '--'}<span className="text-[8px] ml-0.5 text-muted">CM</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <button onClick={() => setView('workout')} className="w-full py-3 bg-card hover:bg-input border border-border hover:border-primary rounded-lg font-black text-xs uppercase tracking-[0.2em] text-muted hover:text-primary transition-all shrink-0">
          Voltar ao Combate
        </button>
      </main>

      {/* ========================================== */}
      {/* 🔥 MODAL DE RELATÓRIO DO TREINO (PORTAL) 🔥 */}
      {/* ========================================== */}
      {reportData && createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-center items-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setReportData(null)}></div>
          
          <div className="bg-card border-2 border-primary w-full max-w-sm rounded-3xl shadow-[0_0_40px_rgba(var(--primary),0.3)] relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            
            <div className="bg-primary text-black p-6 text-center relative">
              <button onClick={() => setReportData(null)} className="absolute right-4 top-4 text-black/50 hover:text-black transition-colors">
                <X size={24} />
              </button>
              <Zap size={40} className="mx-auto mb-2 opacity-80" />
              <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Relatório de<br/>Combate</h3>
              <p className="font-bold text-xs mt-2 opacity-80 uppercase tracking-widest">{reportData.date}</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-primary font-black text-xl uppercase tracking-widest">{reportData.dayName || 'Treino Extra'}</p>
                <p className="text-muted text-xs uppercase tracking-widest mt-1">Status: Concluído</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-input border border-border p-4 rounded-2xl text-center">
                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-1">Exercícios</p>
                  <p className="text-2xl font-black text-white">
                    {reportData.exercises?.filter(e => e.done).length || 0}
                    <span className="text-sm text-muted">/{reportData.exercises?.length || 0}</span>
                  </p>
                </div>
                <div className="bg-input border border-border p-4 rounded-2xl text-center">
                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-1">Carga Movida</p>
                  <p className="text-2xl font-black text-primary">{calculateVolume(reportData.exercises || [])} <span className="text-sm">kg</span></p>
                </div>
              </div>

              {reportData.note && (
                <div className="bg-black/30 p-4 rounded-2xl border border-border text-center text-sm italic text-muted">
                  "{reportData.note.split('|')[0].trim()}"
                </div>
              )}

              <button 
                onClick={() => alert("Função de screenshot/compartilhamento em desenvolvimento!")}
                className="w-full bg-primary/10 border-2 border-primary text-primary font-black uppercase tracking-widest p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary hover:text-black transition-all"
              >
                <Share2 size={20} /> Compartilhar Feito
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default HistoryView;