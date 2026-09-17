import React from 'react';
import { createPortal } from 'react-dom';
import { Settings, X, Ruler, Calendar, Target, Save } from 'lucide-react';
import CyberCalendar from '../dashboard/CyberCalendar';
import {
  MAX_PROFILE_GOALS,
  PROFILE_CLASSES,
  PROFILE_GOALS,
  getClassLabel,
  toggleGoalSelection,
} from '../../utils/profileMetadata';

const formatNumberInput = (value) => value.replace(/[^0-9.]/g, '');

const ProfileSettingsModal = ({
  isEditing,
  setIsEditing,
  editForm,
  setEditForm,
  showCalendar,
  setShowCalendar,
  handleSaveProfile,
  isSaving
}) => {
  if (!isEditing) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-card border-2 border-primary w-full max-w-sm rounded-3xl shadow-2xl dark:shadow-[0_0_40px_rgba(var(--primary),0.3)] flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho do Modal */}
        <div className="flex justify-between items-center p-5 border-b border-border bg-input/50 rounded-t-3xl shrink-0">
          <h3 className="font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <Settings size={18} /> Ajuste de Sistema
          </h3>
          <button onClick={() => setIsEditing(false)} className="text-muted hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Formulário */}
        <div className="p-5 space-y-4 overflow-y-auto pb-10 scrollbar-hide">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Codinome</label>
            <input 
              type="text" 
              maxLength={24}
              value={editForm.username} 
              onChange={(e) => setEditForm({...editForm, username: e.target.value})}
              className="w-full bg-input border border-border p-3 rounded-xl text-main dark:text-white font-bold focus:border-primary focus:outline-none placeholder-muted/50 transition-colors"
              placeholder="Seu novo nickname"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Altura (cm)</label>
              <div className="relative">
                <Ruler size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary opacity-50" />
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={editForm.height} 
                  onChange={(e) => setEditForm({...editForm, height: formatNumberInput(e.target.value)})}
                  className="w-full bg-input border border-border py-3 pl-10 pr-3 rounded-xl text-main dark:text-white font-bold focus:border-primary focus:outline-none placeholder-muted/50 transition-colors"
                  placeholder="175"
                />
              </div>
            </div>
            
            <div className="relative">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Nascimento</label>
              <button 
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full bg-input border border-border p-3 rounded-xl text-main dark:text-white font-bold focus:border-primary focus:outline-none flex justify-between items-center hover:border-primary/50 transition-colors"
              >
                <span className={editForm.birthdate ? "text-main dark:text-white" : "text-muted"}>
                  {editForm.birthdate ? editForm.birthdate.split('-').reverse().join('/') : '--/--/----'}
                </span>
                <Calendar size={16} className="text-primary" />
              </button>

              {showCalendar && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[110]">
                  <div className="fixed inset-0" onClick={() => setShowCalendar(false)}></div>
                  <div className="relative">
                    <CyberCalendar 
                      selectedDate={editForm.birthdate} 
                      onSelect={(date) => { setEditForm({...editForm, birthdate: date}); }}
                      onClose={() => setShowCalendar(false)} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1 flex items-center gap-1">
              <Target size={12} className="text-secondary" /> Peso Alvo (Meta)
            </label>
            <div className="relative">
              <Target size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary opacity-50" />
              <input 
                type="text" 
                inputMode="decimal"
                value={editForm.target_weight} 
                onChange={(e) => setEditForm({...editForm, target_weight: formatNumberInput(e.target.value)})}
                className="w-full bg-input border border-border py-3 pl-10 pr-3 rounded-xl text-main dark:text-white font-bold focus:border-secondary focus:outline-none placeholder-muted/50 transition-colors"
                placeholder="Ex: 85.0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted uppercase">KG</span>
            </div>
          </div>

          <fieldset>
            <legend className="text-[10px] font-black uppercase tracking-widest text-muted">
              Objetivos ({editForm.goals.length}/{MAX_PROFILE_GOALS})
            </legend>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">Escolha um ou dois. O primeiro selecionado define o foco atual.</p>
            <div className="mt-2 grid gap-2">
              {PROFILE_GOALS.map((goal) => {
                const selectedIndex = editForm.goals.indexOf(goal.id);
                const selected = selectedIndex >= 0;
                const unavailable = !selected && editForm.goals.length >= MAX_PROFILE_GOALS;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    aria-pressed={selected}
                    disabled={unavailable}
                    onClick={() => setEditForm({ ...editForm, goals: toggleGoalSelection(editForm.goals, goal.id) })}
                    className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border p-3 text-left text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${selected ? 'border-primary bg-primary/10 text-main' : 'border-border bg-input text-muted'}`}
                  >
                    <span>{goal.label}</span>
                    {selected && <span className="shrink-0 rounded-full bg-primary px-2 py-1 text-[9px] font-black uppercase text-on-primary">{selectedIndex === 0 ? 'Foco' : '2º'}</span>}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="profile-gender" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-muted">Sexo</label>
              <select
                id="profile-gender"
                value={editForm.gender}
                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                className="w-full cursor-pointer appearance-none rounded-xl border border-border bg-input p-3 text-xs font-bold text-main transition-colors focus:border-primary focus:outline-none"
              >
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
                <option value="neutral">Não informar</option>
              </select>
            </div>
            <div>
              <label htmlFor="profile-class" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-muted">Classe</label>
              <select
                id="profile-class"
                value={editForm.class}
                onChange={(e) => setEditForm({ ...editForm, class: e.target.value })}
                className="w-full cursor-pointer appearance-none rounded-xl border border-border bg-input p-3 text-xs font-bold text-main transition-colors focus:border-primary focus:outline-none"
              >
                {PROFILE_CLASSES.map((profileClass) => (
                  <option key={profileClass.id} value={profileClass.id}>{getClassLabel(profileClass.id, editForm.gender)}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="rounded-xl border border-border bg-input/60 p-3 text-[11px] leading-relaxed text-muted">
            <strong className="text-main">A classe é um arquétipo visual.</strong> Ela não altera treino, missões, atributos, recompensas ou XP.
          </p>

          <button 
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="w-full mt-4 bg-primary text-on-primary font-black uppercase tracking-widest p-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(var(--primary),0.6)] transition-all disabled:opacity-50 shrink-0 shadow-sm"
          >
            {isSaving ? 'Sincronizando...' : <><Save size={18} /> Salvar Ficha</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProfileSettingsModal;
