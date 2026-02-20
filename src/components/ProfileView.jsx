import React, { useMemo, useState } from 'react';
import { User, LogOut, Activity, Scale, Target, Shield, Camera, Settings, X, Save, Calendar } from 'lucide-react'; 
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '../supabaseClient';
import { calculateStats } from '../utils/rpgSystem';

// --- SEUS COMPONENTES ---
import UserLevel from './UserLevel';
import QuestBoard from './QuestBoard';
import BadgeList from './BadgeList';
import CyberCalendar from './CyberCalendar'; 

const ProfileView = ({ userMetadata, setView, stats, history }) => {
  
  // 🔥 NOVIDADE: Puxa primeiro da nuvem, se não tiver, olha o cache local
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return userMetadata?.avatar_url || userMetadata?.picture || userMetadata?.photo || localStorage.getItem('soldier_avatar') || null;
  });
  
  // ESTADOS DO MODAL
  const [isEditing, setIsEditing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false); 
  const [editForm, setEditForm] = useState({
    username: userMetadata?.username || '',
    birthdate: userMetadata?.birthdate || '',
    height: userMetadata?.height || '',
    goal: userMetadata?.goal || 'hypertrophy'
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setAvatarUrl(base64String);
        localStorage.setItem('soldier_avatar', base64String); // Mantém backup local
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          username: editForm.username,
          birthdate: editForm.birthdate,
          height: editForm.height,
          goal: editForm.goal,
          avatar_url: avatarUrl // 🔥 NOVIDADE: Envia a foto oficial para a nuvem!
        }
      });
      if (error) throw error;
      
      setIsEditing(false);
      window.location.reload(); 
    } catch (error) {
      alert("Erro ao atualizar o sistema tático: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // --- CÁLCULOS DE RPG E BIOMETRIA ---
  const rpgData = useMemo(() => {
    try { return calculateStats(history || []); } 
    catch (e) { return { level: 1, STR: {level: 1}, DEX: {level: 1}, VIT: {level: 1}, CHA: {level: 1} }; }
  }, [history]);

  const radarData = useMemo(() => {
    const focusLevel = Math.max(1, (stats?.streak || 0) * 2); 
    const disciplineLevel = Math.max(1, Math.floor((history?.length || 0) / 2));
    return [
      { subject: 'STR', A: rpgData?.STR?.level || 1 },
      { subject: 'DEX', A: rpgData?.DEX?.level || 1 },
      { subject: 'VIT', A: rpgData?.VIT?.level || 1 },
      { subject: 'CHA', A: rpgData?.CHA?.level || 1 },
      { subject: 'Foco', A: focusLevel },
      { subject: 'Disciplina', A: disciplineLevel }
    ];
  }, [rpgData, stats?.streak, history]);

  const maxStat = Math.max(10, ...radarData.map(d => d.A));

  const { age, imc, imcClassification, currentWeight } = useMemo(() => {
    const safeMetadata = userMetadata || {};
    let calculatedAge = '--';
    if (safeMetadata.birthdate) {
      const birthDate = new Date(safeMetadata.birthdate);
      const today = new Date();
      calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) calculatedAge--;
    }

    let weightToUse = stats?.latest?.weight && stats.latest.weight !== '--' ? stats.latest.weight : safeMetadata.starting_weight;
    let calculatedImc = '--';
    let classification = 'Dados Incompletos';
    const weight = parseFloat(weightToUse);
    const height = parseFloat(safeMetadata.height) / 100;

    if (weight && height) {
      const imcValue = weight / (height * height);
      calculatedImc = imcValue.toFixed(1);
      if (imcValue < 18.5) classification = 'Abaixo do Peso';
      else if (imcValue >= 18.5 && imcValue < 24.9) classification = 'Peso Normal';
      else if (imcValue >= 25 && imcValue < 29.9) classification = 'Sobrepeso';
      else classification = 'Combate Pesado';
    }

    return { age: calculatedAge, imc: calculatedImc, imcClassification: classification, currentWeight: weightToUse || '--' };
  }, [userMetadata, stats]);

  const displayClass = { hypertrophy: 'Tank (Massa)', weight_loss: 'Assassin (Seca)', endurance: 'Warrior (Resistência)' }[userMetadata?.goal] || 'Veterano';

  const handleLogout = async () => {
    if(window.confirm("Encerrar sessão de combate?")) {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-cyber pb-24 relative">
      
      {/* HEADER DE IDENTIDADE */}
      <div className="bg-card border-2 border-primary rounded-3xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(var(--primary),0.15)] mt-2">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px]"></div>
        
        <button 
          onClick={() => setIsEditing(true)}
          className="absolute top-4 right-4 z-30 p-2 bg-input/80 border border-primary/50 text-primary rounded-xl hover:bg-primary hover:text-black transition-all shadow-lg"
        >
          <Settings size={20} />
        </button>

        <div className="flex items-center gap-4 relative z-10">
          <div className="relative w-20 h-20 shrink-0 rotate-3 group cursor-pointer z-20">
            <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <label htmlFor="avatar-upload" className="w-full h-full bg-input border-2 border-primary rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.4)] overflow-hidden cursor-pointer transition-all group-hover:border-white">
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User size={40} className="text-primary group-hover:text-white transition-colors" />}
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                <Camera size={24} className="text-white mb-1" />
              </div>
            </label>
          </div>

          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] pr-8 line-clamp-1">
              {userMetadata?.username || 'SOLDADO_X'}
            </h2>
            <span className="text-primary text-[10px] font-black uppercase tracking-widest block mt-1">
              Classe: {displayClass}
            </span>
          </div>
        </div>
      </div>

      <UserLevel history={history} />

      {/* BIOMETRIA */}
      <div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-input border border-border p-3 rounded-2xl text-center shadow-md">
            <Activity className="mx-auto text-secondary mb-1 opacity-50" size={16} />
            <p className="text-[10px] text-muted font-black uppercase tracking-widest">Idade</p>
            <p className="text-xl font-black text-white">{age}</p>
          </div>
          <div className="bg-input border border-border p-3 rounded-2xl text-center shadow-md">
            <Scale className="mx-auto text-secondary mb-1 opacity-50" size={16} />
            <p className="text-[10px] text-muted font-black uppercase tracking-widest">Peso</p>
            <p className="text-xl font-black text-white">{currentWeight}<span className="text-[10px] ml-0.5 text-muted">kg</span></p>
          </div>
          <div className="bg-input border border-border p-3 rounded-2xl text-center shadow-md">
            <Target className="mx-auto text-secondary mb-1 opacity-50" size={16} />
            <p className="text-[10px] text-muted font-black uppercase tracking-widest">IMC</p>
            <p className="text-xl font-black text-primary">{imc}</p>
          </div>
        </div>
        <p className="text-center text-[9px] text-muted uppercase font-bold tracking-[0.2em] mt-2">Diagnóstico: <span className="text-secondary">{imcClassification}</span></p>
      </div>

      {/* MAPEAMENTO TÁTICO */}
      <div className="bg-card border-2 border-border rounded-3xl p-5 shadow-lg space-y-4">
        <div className="text-center mb-2">
          <h3 className="text-sm font-black text-primary uppercase tracking-widest">Mapeamento Tático</h3>
        </div>
        
        <div className="h-56 w-full -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="rgba(var(--primary), 0.2)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#888888', fontSize: 9, fontWeight: 900, textTransform: 'uppercase' }} />
              <PolarRadiusAxis angle={30} domain={[0, maxStat]} tick={false} axisLine={false} />
              <Radar name="Nível" dataKey="A" stroke="rgb(var(--primary))" strokeWidth={2} fill="rgb(var(--primary))" fillOpacity={0.3} />
              <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: 'rgb(var(--primary))', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: 'rgb(var(--primary))' }} formatter={(value) => [`Nível ${value}`, 'Atributo']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/50">
          {[
            { label: 'STR', val: rpgData?.STR?.level || 1, color: 'text-red-500' },
            { label: 'DEX', val: rpgData?.DEX?.level || 1, color: 'text-blue-500' },
            { label: 'VIT', val: rpgData?.VIT?.level || 1, color: 'text-green-500' },
            { label: 'CHA', val: rpgData?.CHA?.level || 1, color: 'text-purple-500' },
          ].map((attr) => (
            <div key={attr.label} className="text-center bg-input/50 rounded-xl py-2">
              <span className={`text-[9px] font-black uppercase tracking-tighter ${attr.color}`}>{attr.label}</span>
              <p className="text-lg font-black text-white leading-none">{attr.val}</p>
            </div>
          ))}
        </div>
      </div>

      <BadgeList history={history} />
      <QuestBoard />

      <div className="space-y-3 pt-4">
        <button onClick={() => alert("Compartilhar relatório em breve.")} className="w-full bg-card border-2 border-primary text-primary font-black uppercase tracking-widest p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary hover:text-black transition-all">
          <Shield size={18} /> Compartilhar Ficha
        </button>
        <button onClick={handleLogout} className="w-full bg-red-500/10 border-2 border-red-500/50 text-red-500 font-black uppercase tracking-widest p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all">
          <LogOut size={18} /> Evacuar Sistema
        </button>
      </div>

      {/* 🔥 CSS INJETADO PARA ESCONDER A NAV BAR (Tática de Guerrilha) 🔥 */}
      {isEditing && (
        <style>{`
          nav, footer, .fixed.bottom-0 { 
            display: none !important; 
          }
          body {
            overflow: hidden; /* Impede a rolagem de fundo enquanto edita */
          }
        `}</style>
      )}

      {/* MODAL TÁTICO DE EDIÇÃO */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] bg-page/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-card border-2 border-primary w-full max-w-sm rounded-3xl shadow-[0_0_40px_rgba(var(--primary),0.3)] overflow-visible">
            
            <div className="flex justify-between items-center p-5 border-b border-border bg-input/50">
              <h3 className="font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <Settings size={18} /> Ajuste de Sistema
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-muted hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Codinome</label>
                <input 
                  type="text" 
                  value={editForm.username} 
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  className="w-full bg-input border border-border p-3 rounded-xl text-white font-bold focus:border-primary focus:outline-none"
                  placeholder="Seu novo nickname"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Altura (cm)</label>
                  <input 
                    type="number" 
                    value={editForm.height} 
                    onChange={(e) => setEditForm({...editForm, height: e.target.value})}
                    className="w-full bg-input border border-border p-3 rounded-xl text-white font-bold focus:border-primary focus:outline-none"
                    placeholder="Ex: 175"
                  />
                </div>
                
                {/* 🔥 SEU NOVO CALENDÁRIO CYBERPUNK AQUI 🔥 */}
                <div className="relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Nascimento</label>
                  <button 
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full bg-input border border-border p-3 rounded-xl text-white font-bold focus:border-primary focus:outline-none flex justify-between items-center hover:border-primary/50 transition-colors"
                  >
                    <span className={editForm.birthdate ? "text-white" : "text-muted"}>
                      {editForm.birthdate ? editForm.birthdate.split('-').reverse().join('/') : '--/--/----'}
                    </span>
                    <Calendar size={16} className="text-primary" />
                  </button>

                  {/* Renderização condicional do Calendário (Pop-over) */}
                  {showCalendar && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[110]">
                      <div className="fixed inset-0" onClick={() => setShowCalendar(false)}></div> {/* Overlay para fechar ao clicar fora */}
                      <div className="relative">
                        <CyberCalendar 
                          selectedDate={editForm.birthdate} 
                          onSelect={(date) => {
                            setEditForm({...editForm, birthdate: date});
                          }}
                          onClose={() => setShowCalendar(false)} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Especialidade (Classe)</label>
                <select 
                  value={editForm.goal} 
                  onChange={(e) => setEditForm({...editForm, goal: e.target.value})}
                  className="w-full bg-input border border-border p-3 rounded-xl text-white font-bold focus:border-primary focus:outline-none appearance-none"
                >
                  <option value="hypertrophy">Tank (Foco em Massa/Força)</option>
                  <option value="weight_loss">Assassin (Foco em Definição/Seca)</option>
                  <option value="endurance">Warrior (Foco em Resistência)</option>
                </select>
              </div>

              <button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full mt-4 bg-primary text-black font-black uppercase tracking-widest p-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(var(--primary),0.6)] transition-all disabled:opacity-50 relative z-0"
              >
                {isSaving ? 'Sincronizando...' : <><Save size={18} /> Salvar Ficha</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfileView;