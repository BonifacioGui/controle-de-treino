import React from 'react';
import { createPortal } from 'react-dom';
import { Settings, X, Ruler, Calendar, Target, Save } from 'lucide-react';
import CyberCalendar from './CyberCalendar';

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
              maxLength={15} // 
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

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Especialidade (Classe)</label>
            <select 
              value={editForm.goal} 
              onChange={(e) => setEditForm({...editForm, goal: e.target.value})}
              className="w-full bg-input border border-border p-3 rounded-xl text-main dark:text-white font-bold focus:border-primary focus:outline-none appearance-none cursor-pointer transition-colors"
            >
              <option value="hypertrophy">Tank (Foco em Massa/Força)</option>
              <option value="weight_loss">Assassin (Foco em Definição/Seca)</option>
              <option value="endurance">Warrior (Foco em Resistência)</option>
            </select>
          </div>

          <button 
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="w-full mt-4 bg-primary text-black font-black uppercase tracking-widest p-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(var(--primary),0.6)] transition-all disabled:opacity-50 shrink-0 shadow-sm"
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