import React, { useState, useEffect } from 'react';
import { Scale, Trash2, Activity, Database, ChevronRight, ChevronDown, Calendar, Folder, FolderOpen, Pencil, Save, X } from 'lucide-react';

// --- HELPERS (Mesmos de antes, apenas lógica) ---
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

// --- COMPONENTES VISUAIS (FONTES AUMENTADAS) ---

const ExerciseItemView = ({ exercise }) => {
  return (
    <div className="flex items-center justify-between p-3 border-b border-border last:border-0 hover:bg-input/30 transition-colors">
      <span className="text-sm font-bold uppercase truncate text-main flex-1">
        {exercise.name}
      </span>
      
      <div className="flex gap-2 shrink-0">
        {Array.isArray(exercise.sets) && exercise.sets.length > 0 ? (
          <div className="flex gap-1 flex-wrap justify-end">
             {exercise.sets.map((set, k) => (
                <div key={k} className="flex items-center gap-1 bg-card border border-border px-2 py-1 rounded-md">
                  <span className="text-xs font-black text-success">{set.weight}</span>
                  <span className="text-[10px] text-muted">kg</span>
                  <span className="text-[10px] text-muted">•</span>
                  <span className="text-xs font-black text-primary">{set.reps}</span>
                </div>
             ))}
          </div>
        ) : (
          <span className="text-xs text-muted">Concluído</span>
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
    <div className="p-4 border-b border-border bg-input/20">
      <div className="mb-2 text-sm font-black text-primary uppercase">{exercise.name}</div>
      <div className="space-y-3">
        {exercise.sets.map((set, k) => (
          <div key={k} className="flex items-center gap-3">
            <span className="text-xs text-muted w-6 font-bold">#{k+1}</span>
            <input 
              type="number" inputMode="decimal" value={set.weight} 
              onChange={(e) => handleSetChange(k, 'weight', e.target.value)}
              className="w-20 bg-input border border-border rounded p-2 text-sm text-center font-bold focus:border-primary outline-none"
              placeholder="KG"
            />
            <input 
              type="number" inputMode="numeric" value={set.reps} 
              onChange={(e) => handleSetChange(k, 'reps', e.target.value)}
              className="w-16 bg-input border border-border rounded p-2 text-sm text-center font-bold focus:border-secondary outline-none"
              placeholder="Reps"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const DayAccordion = ({ session, deleteEntry, updateEntry }) => {
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
    <div className="mb-3">
      <div 
        onClick={() => !isEditing && setIsOpen(!isOpen)}
        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${isOpen || isEditing ? 'bg-input border-primary/50 shadow-md' : 'bg-card border-border hover:border-primary/30'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90 text-primary' : 'text-muted'}`}>
            <ChevronRight size={18} />
          </div>
          <div>
            <h4 className={`text-sm font-black uppercase tracking-wide ${isOpen ? 'text-primary' : 'text-main'}`}>
              {displayName}
            </h4>
            <span className="text-xs text-muted font-bold tracking-widest">{session.date}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button onClick={(e) => { e.stopPropagation(); handleSave(); }} className="p-2 bg-success text-black rounded hover:brightness-110"><Save size={16} /></button>
              <button onClick={(e) => { e.stopPropagation(); handleCancel(); }} className="p-2 bg-card border border-border text-muted rounded hover:text-white"><X size={16} /></button>
            </>
          ) : (
            <>
              <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsOpen(true); }} className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded transition-colors"><Pencil size={16} /></button>
              <button onClick={(e) => { e.stopPropagation(); deleteEntry(session.id, 'workout'); }} className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"><Trash2 size={16} /></button>
            </>
          )}
        </div>
      </div>

      {(isOpen || isEditing) && (
        <div className="ml-2 pl-4 border-l-2 border-primary/20 mt-3 space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
          {isEditing ? (
             <textarea value={editedSession.note || ''} onChange={(e) => setEditedSession({...editedSession, note: e.target.value})} className="w-full bg-card border border-warning/50 rounded-xl p-3 text-sm text-warning font-medium outline-none h-20" placeholder="Editar observações..." />
          ) : (
            session.note && <div className="text-xs text-warning italic p-3 bg-warning/5 rounded-lg border border-warning/20">"{session.note}"</div>
          )}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
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

const WeekAccordion = ({ weekTitle, sessions, deleteEntry, updateEntry }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="ml-2 mb-3">
      <div onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 p-3 cursor-pointer text-muted hover:text-secondary transition-colors group select-none">
        {isOpen ? <FolderOpen size={18} className="text-secondary" /> : <Folder size={18} />}
        <span className="text-xs font-black uppercase tracking-widest group-hover:tracking-[0.2em] transition-all">
          {weekTitle} <span className="text-[10px] opacity-50 ml-1">({sessions.length} Logs)</span>
        </span>
      </div>
      {isOpen && <div className="pl-2 mt-1 animate-in slide-in-from-left-2 fade-in">{sessions.map(session => <DayAccordion key={session.id} session={session} deleteEntry={deleteEntry} updateEntry={updateEntry} />)}</div>}
    </div>
  );
};

const MonthAccordion = ({ monthTitle, weeksData, deleteEntry, updateEntry }) => {
  const [isOpen, setIsOpen] = useState(true);
  const sortedWeekKeys = Object.keys(weeksData).sort((a, b) => (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0)).reverse();

  return (
    <div className="mb-6">
      <div onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 bg-primary/10 border-l-4 border-primary p-4 rounded-r-xl cursor-pointer hover:bg-primary/20 transition-all select-none">
        <Calendar size={20} className="text-primary" />
        <h3 className="text-base font-black text-primary uppercase tracking-widest flex-1">{monthTitle}</h3>
        <ChevronDown size={20} className={`text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && <div className="mt-3 pl-2 border-l border-primary/10 ml-2 space-y-2">{sortedWeekKeys.map(weekKey => <WeekAccordion key={weekKey} weekTitle={weekKey} sessions={weeksData[weekKey]} deleteEntry={deleteEntry} updateEntry={updateEntry} />)}</div>}
    </div>
  );
};

const HistoryView = ({ history, bodyHistory, deleteEntry, updateEntry, setView }) => {
  const sortedBody = [...bodyHistory].reverse();
  const groupedHistory = groupHistoryByDate(history);
  const monthKeys = Object.keys(groupedHistory).reverse(); 

  return (
    <main className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 font-cyber pb-24 h-full flex flex-col">
      <div className="flex items-center justify-between border-b-2 border-primary/30 pb-4 shrink-0">
        <h2 className="text-2xl font-black flex items-center gap-3 italic text-primary uppercase drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]">
          <Database size={28} className="text-primary" /> Log de Operações
        </h2>
        <span className="text-[10px] font-black text-muted tracking-[0.3em]">RECOVERY.SYS</span>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-4">
        <div className="flex items-center justify-between px-1 shrink-0">
          <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <Activity size={16} /> Histórico
          </h3>
          <span className="text-xs text-muted font-bold">{history.length} LOGS</span>
        </div>

        <div className="overflow-y-auto pr-2 pb-10 max-h-[50vh]">
          {history.length === 0 && (
            <div className="bg-card/20 border border-dashed border-border p-10 rounded-2xl text-center">
              <p className="text-muted text-sm font-black uppercase tracking-widest italic">Buffer Vazio.</p>
            </div>
          )}
          {monthKeys.map(month => <MonthAccordion key={month} monthTitle={month} weeksData={groupedHistory[month]} deleteEntry={deleteEntry} updateEntry={updateEntry} />)}
        </div>
      </div>

      <div className="shrink-0 space-y-4 pt-4 border-t border-border">
        <h3 className="text-sm font-black text-secondary uppercase tracking-widest px-1 flex items-center gap-2">
          <Scale size={16} /> Biometria
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1 scrollbar-hide">
          {sortedBody.map((b) => (
            <div key={b.id} className="min-w-[160px] bg-card border border-secondary/30 p-4 rounded-xl shadow-sm relative group hover:border-secondary/60 transition-all shrink-0 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-3 border-b border-secondary/10 pb-2">
                <span className="font-black text-secondary text-xs">{b.date}</span>
                <button onClick={() => deleteEntry(b.id, 'body')} className="text-muted hover:text-red-500"><Trash2 size={14} /></button>
              </div>
              <div className="flex justify-between items-end gap-3">
                <div>
                  <p className="text-[10px] text-muted uppercase font-bold mb-1">Peso</p>
                  <p className="text-2xl font-black text-success leading-none">{b.weight}<span className="text-[10px] ml-1 text-muted">KG</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted uppercase font-bold mb-1">Cintura</p>
                  <p className="text-2xl font-black text-primary leading-none">{b.waist}<span className="text-[10px] ml-1 text-muted">CM</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <button onClick={() => setView('workout')} className="w-full py-5 bg-card hover:bg-input border border-border hover:border-primary rounded-xl font-black text-sm uppercase tracking-[0.3em] text-muted hover:text-primary transition-all shrink-0">
        Voltar ao Combate
      </button>
    </main>
  );
};

export default HistoryView;