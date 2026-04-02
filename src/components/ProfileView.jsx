import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom'; 
import { LogOut, Shield, AlertTriangle } from 'lucide-react'; 
import { supabase } from '../services/supabaseClient';
import { calculateStats } from '../utils/rpgSystem';

// Importando o exército de componentes que criamos:
import ProfileHeader from './ProfileHeader';
import BiometricsDashboard from './BiometricsDashboard';
import BodyScanner from './BodyScanner';
import TacticalRadar from './TacticalRadar';
import ProfileSettingsModal from './ProfileSettingsModal';
import CharacterSheet from './CharacterSheet'; 
import BadgeList from './BadgeList';
import QuestBoard from './QuestBoard';

const ProfileView = ({ userMetadata, setView, stats, history, bodyHistory = [], deleteEntry }) => {
  
  // ================= ESTADOS =================
  const [avatarUrl, setAvatarUrl] = useState(() => userMetadata?.avatar_url || userMetadata?.picture || userMetadata?.photo || localStorage.getItem('soldier_avatar') || null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false); 
  const [editForm, setEditForm] = useState({
    username: userMetadata?.username || '', birthdate: userMetadata?.birthdate || '', height: userMetadata?.height || '', goal: userMetadata?.goal || 'hypertrophy', target_weight: userMetadata?.target_weight || '' 
  });
  const [isSaving, setIsSaving] = useState(false);

  const [showBioForm, setShowBioForm] = useState(false);
  const [bioDate, setBioDate] = useState(new Date().toISOString().split('T')[0]);
  const [bioWeight, setBioWeight] = useState(''); const [bioBf, setBioBf] = useState(''); const [bioWaist, setBioWaist] = useState(''); const [bioAbdomen, setBioAbdomen] = useState(''); const [bioHip, setBioHip] = useState(''); 
  const [bioChest, setBioChest] = useState(''); const [bioShoulder, setBioShoulder] = useState('');
  const [bioArmL, setBioArmL] = useState(''); const [bioArmR, setBioArmR] = useState(''); const [bioLegL, setBioLegL] = useState(''); const [bioLegR, setBioLegR] = useState(''); const [bioCalfL, setBioCalfL] = useState(''); const [bioCalfR, setBioCalfR] = useState('');
  const [bioNote, setBioNote] = useState(''); 

  const [isSavingBio, setIsSavingBio] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const sortedBody = [...bodyHistory].reverse();
  const latestBio = sortedBody[0] || null;

  // ================= LÓGICA E CÁLCULOS =================
  const getBfColorClass = (bfString, isFemale = false) => {
    if (!bfString || bfString === '--') return 'text-warning';
    const bf = parseFloat(bfString);
    if (isNaN(bf)) return 'text-warning';
    if (isFemale) {
      if (bf <= 14) return 'text-secondary';
      if (bf <= 24) return 'text-success';
      if (bf <= 31) return 'text-warning';
      return 'text-red-500 dark:text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]';
    } else {
      if (bf <= 5) return 'text-secondary';
      if (bf <= 17) return 'text-success';
      if (bf <= 24) return 'text-warning';
      return 'text-red-500 dark:text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]';
    }
  };

  const bfColorClass = getBfColorClass(latestBio?.bf);

  const calculatedLeanMass = useMemo(() => {
    const w = parseFloat(bioWeight); const bf = parseFloat(bioBf);
    if (w > 0 && bf >= 0) return (w - (w * (bf / 100))).toFixed(1);
    return '--';
  }, [bioWeight, bioBf]);

  const rpgData = useMemo(() => {
    try { return calculateStats(history || []); } catch (e) { return { level: 1, STR: {level: 1}, DEX: {level: 1}, VIT: {level: 1}, CHA: {level: 1} }; }
  }, [history]);

  const dynamicDiscipline = useMemo(() => {
    if (!history || history.length === 0) return 1;
    const baseDiscipline = Math.floor(history.length / 2);
    const sortedHistory = [...history].sort((a, b) => new Date(b.date.split('/').reverse().join('-')) - new Date(a.date.split('/').reverse().join('-')));
    const lastDateStr = sortedHistory[0].date.split('/');
    const daysInactive = Math.floor((new Date() - new Date(lastDateStr[2], lastDateStr[1] - 1, lastDateStr[0])) / (1000 * 60 * 60 * 24));
    let penalty = daysInactive > 7 ? Math.floor((daysInactive - 7) / 3) : 0;
    return Math.max(1, baseDiscipline - penalty);
  }, [history]);

  const radarData = useMemo(() => {
    const focusLevel = Math.max(1, (stats?.streak || 0) * 2); 
    return [
      { subject: 'FOR', A: rpgData?.STR?.level || rpgData?.FOR?.level || 1 },
      { subject: 'DES', A: rpgData?.DEX?.level || rpgData?.DES?.level || 1 },
      { subject: 'VIT', A: rpgData?.VIT?.level || 1 },
      { subject: 'CAR', A: rpgData?.CHA?.level || rpgData?.CAR?.level || 1 },
      { subject: 'FOCO', A: focusLevel },
      { subject: 'DISCIPLINA', A: dynamicDiscipline }
    ];
  }, [rpgData, stats?.streak, dynamicDiscipline]);

  const maxStat = Math.max(10, ...radarData.map(d => d.A));

  const { age, imc, imcClassification, rcq, rcqClass, currentWeight, goalProgress, isGoalMet } = useMemo(() => {
    const sm = userMetadata || {};
    let cAge = '--';
    if (sm.birthdate) {
      const bD = new Date(sm.birthdate); const td = new Date();
      cAge = td.getFullYear() - bD.getFullYear();
      if (td.getMonth() < bD.getMonth() || (td.getMonth() === bD.getMonth() && td.getDate() < bD.getDate())) cAge--;
    }
    let wToUse = stats?.latest?.weight && stats.latest.weight !== '--' ? stats.latest.weight : sm.starting_weight;
    let cImc = '--'; let clazz = 'Sem Dados';
    const w = parseFloat(wToUse); const h = parseFloat(sm.height) / 100;
    if (w && h) {
      const iV = w / (h * h); cImc = iV.toFixed(1);
      if (iV < 18.5) clazz = 'Abaixo do Peso'; else if (iV < 24.9) clazz = 'Peso Normal'; else if (iV < 29.9) clazz = 'Sobrepeso'; else clazz = 'Combate Pesado';
    }
    let cRcq = '--'; let rcqC = 'Sem Dados';
    if (latestBio?.waist && latestBio?.hip) {
      const ratio = parseFloat(latestBio.waist) / parseFloat(latestBio.hip); cRcq = ratio.toFixed(2);
      if (ratio <= 0.95) rcqC = 'Risco Baixo'; else if (ratio <= 1.0) rcqC = 'Risco Moderado'; else rcqC = 'Risco Alto';
    }
    let prog = null; let gMet = false;
    if (sm.target_weight && w) {
      const target = parseFloat(sm.target_weight); const start = parseFloat(sm.starting_weight) || (target > w ? w - 10 : w + 10); 
      if (target === w) { prog = 100; gMet = true; } 
      else { prog = Math.max(0, Math.min(100, ((Math.abs(start - target) - Math.abs(w - target)) / Math.abs(start - target)) * 100)).toFixed(0); }
    }
    return { age: cAge, imc: cImc, imcClassification: clazz, rcq: cRcq, rcqClass: rcqC, currentWeight: wToUse || '--', goalProgress: prog, isGoalMet: gMet };
  }, [userMetadata, stats, latestBio]);

  const displayClass = { hypertrophy: 'Titã (Força Bruta)', weight_loss: 'Sombra (Definição)', endurance: 'Nômade (Resistência)' }[userMetadata?.goal] || 'Ciborgue';

  const donutData = useMemo(() => {
    if (latestBio?.weight && latestBio?.bf) {
      const w = parseFloat(latestBio.weight); const fat = w * (parseFloat(latestBio.bf) / 100);
      return [ { name: 'Massa Magra', value: parseFloat((w - fat).toFixed(1)), color: 'rgb(var(--success))' }, { name: 'Massa Gorda', value: parseFloat(fat.toFixed(1)), color: 'rgb(var(--warning))' } ];
    }
    return null;
  }, [latestBio]);

  // ================= FUNÇÕES DE AÇÃO =================
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setAvatarUrl(reader.result); localStorage.setItem('soldier_avatar', reader.result); };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const payload = { username: editForm.username, birthdate: editForm.birthdate, height: editForm.height ? parseFloat(editForm.height) : null, goal: editForm.goal, target_weight: editForm.target_weight ? parseFloat(editForm.target_weight) : null, avatar_url: avatarUrl };
      const { error } = await supabase.auth.updateUser({ data: payload });
      if (error) { alert("🚨 Erro: " + error.message); setIsSaving(false); return; }
      setIsEditing(false); window.location.reload(); 
    } catch (error) { alert("Erro: " + error.message); setIsSaving(false); }
  };

  const handleToggleForm = () => {
    if (showBioForm) {
      setBioDate(new Date().toISOString().split('T')[0]); setBioWeight(''); setBioBf(''); setBioWaist(''); setBioAbdomen(''); setBioHip(''); setBioChest(''); setBioShoulder(''); setBioArmL(''); setBioArmR(''); setBioLegL(''); setBioLegR(''); setBioCalfL(''); setBioCalfR(''); setBioNote('');
    }
    setShowBioForm(!showBioForm);
  };

  const handleEditBio = (b) => {
    if (b.date) { const [day, month, year] = b.date.split('/'); setBioDate(`${year}-${month}-${day}`); }
    setBioWeight(b.weight || ''); setBioBf(b.bf || ''); setBioWaist(b.waist || ''); setBioAbdomen(b.abdomen || ''); setBioHip(b.hip || ''); setBioChest(b.chest || ''); setBioShoulder(b.shoulder || ''); setBioArmL(b.arm_left || ''); setBioArmR(b.arm_right || ''); setBioLegL(b.leg_left || ''); setBioLegR(b.leg_right || ''); setBioCalfL(b.calf_left || ''); setBioCalfR(b.calf_right || ''); setBioNote(b.note || '');
    setShowBioForm(true); 
  };

  const handleSaveBiometrics = async () => {
    if (!bioWeight) { alert("Insira ao menos o Peso."); return; }
    setIsSavingBio(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const payload = {
          user_id: session.user.id, date: bioDate, weight: parseFloat(bioWeight) || null, bf: parseFloat(bioBf) || null, lean_mass: calculatedLeanMass !== '--' ? parseFloat(calculatedLeanMass) : null, waist: parseFloat(bioWaist) || null, abdomen: parseFloat(bioAbdomen) || null, hip: parseFloat(bioHip) || null, chest: parseFloat(bioChest) || null, shoulder: parseFloat(bioShoulder) || null, arm_left: parseFloat(bioArmL) || null, arm_right: parseFloat(bioArmR) || null, leg_left: parseFloat(bioLegL) || null, leg_right: parseFloat(bioLegR) || null, calf_left: parseFloat(bioCalfL) || null, calf_right: parseFloat(bioCalfR) || null, note: bioNote.trim() || null
        };
        const { error } = await supabase.from('body_stats').upsert(payload, { onConflict: 'unique_user_date' });
        if (error) { alert(`Erro: ${error.message}`); setIsSavingBio(false); return; }
        window.location.reload(); 
      }
    } catch (err) { alert("Erro: " + err.message); setIsSavingBio(false); }
  };

  const requestDelete = (id, type) => setItemToDelete({ id, type });
  const handleLogout = async () => { if(window.confirm("Encerrar sessão de combate?")) { await supabase.auth.signOut(); window.location.reload(); } };

  // ================= RENDERIZAÇÃO DO MAESTRO =================
  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-cyber pb-24 relative px-1">
      
      {/* 1. CABEÇALHO */}
      <ProfileHeader 
        userMetadata={userMetadata} avatarUrl={avatarUrl} handleImageUpload={handleImageUpload} 
        setIsEditing={setIsEditing} goalProgress={goalProgress} isGoalMet={isGoalMet} 
        displayClass={displayClass} history={history} 
      />

      {/* 2. BIOMETRIA MACRO (IMC, RCQ, DONUT) */}
      <BiometricsDashboard 
        age={age} currentWeight={currentWeight} latestBio={latestBio} imc={imc} 
        imcClassification={imcClassification} rcq={rcq} rcqClass={rcqClass} 
        bfColorClass={bfColorClass} donutData={donutData} 
      />

      {/* 3. FORMULÁRIO E HISTÓRICO DE MEDIDAS */}
      <BodyScanner 
        showBioForm={showBioForm} handleToggleForm={handleToggleForm} bioDate={bioDate} setBioDate={setBioDate}
        bioWeight={bioWeight} setBioWeight={setBioWeight} bioBf={bioBf} setBioBf={setBioBf} calculatedLeanMass={calculatedLeanMass}
        bioWaist={bioWaist} setBioWaist={setBioWaist} bioAbdomen={bioAbdomen} setBioAbdomen={setBioAbdomen} bioHip={bioHip} setBioHip={setBioHip}
        bioChest={bioChest} setBioChest={setBioChest} bioShoulder={bioShoulder} setBioShoulder={setBioShoulder}
        bioArmL={bioArmL} setBioArmL={setBioArmL} bioArmR={bioArmR} setBioArmR={setBioArmR} bioLegL={bioLegL} setBioLegL={setBioLegL} bioLegR={bioLegR} setBioLegR={setBioLegR}
        bioCalfL={bioCalfL} setBioCalfL={setBioCalfL} bioCalfR={bioCalfR} setBioCalfR={setBioCalfR} bioNote={bioNote} setBioNote={setBioNote}
        handleSaveBiometrics={handleSaveBiometrics} isSavingBio={isSavingBio} sortedBody={sortedBody} 
        handleEditBio={handleEditBio} requestDelete={requestDelete} getBfColorClass={getBfColorClass}
      />

      {/* 4. RADAR TÁTICO RPG */}
      <TacticalRadar radarData={radarData} maxStat={maxStat} />

      {/* 5. MÓDULOS DE RPG RESTANTES */}
      <CharacterSheet history={history} />
      <BadgeList history={history} />
      <QuestBoard />

      {/* 6. BOTÕES DE AÇÃO GERAIS */}
      <div className="space-y-3 pt-4">
        <button onClick={() => alert("Compartilhar relatório em breve.")} className="w-full bg-card border-2 border-primary text-primary font-black uppercase tracking-widest p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary hover:text-black transition-all shadow-sm">
          <Shield size={18} /> Compartilhar Ficha
        </button>
        <button onClick={handleLogout} className="w-full bg-red-500/10 border-2 border-red-500/50 text-red-500 font-black uppercase tracking-widest p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all shadow-sm">
          <LogOut size={18} /> Evacuar Sistema
        </button>
      </div>

      {/* 7. MODAIS */}
      <ProfileSettingsModal 
        isEditing={isEditing} setIsEditing={setIsEditing} editForm={editForm} setEditForm={setEditForm} 
        showCalendar={showCalendar} setShowCalendar={setShowCalendar} handleSaveProfile={handleSaveProfile} isSaving={isSaving} 
      />

      {itemToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-center items-center p-4">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setItemToDelete(null)}></div>
          <div className="bg-card border-2 border-red-500/50 w-full max-w-xs rounded-3xl shadow-2xl dark:shadow-[0_0_50px_rgba(239,68,68,0.2)] relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-red-500 uppercase tracking-widest">Deletar Scan?</h3>
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-2 leading-relaxed">
                  Esta ação é permanente e os dados serão obliterados do sistema SOLO.
                </p>
              </div>
              <div className="flex gap-3 pt-4 border-t border-border/50">
                <button onClick={() => setItemToDelete(null)} className="flex-1 py-3 rounded-xl border border-border text-muted font-black uppercase text-xs hover:bg-input hover:text-main dark:hover:text-white transition-all active:scale-95 shadow-sm">
                  Cancelar
                </button>
                <button onClick={() => { deleteEntry(itemToDelete.id, itemToDelete.type); setItemToDelete(null); }} className="flex-1 py-3 rounded-xl bg-red-600/20 border border-red-500 text-red-500 font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all shadow-sm dark:shadow-[0_0_15px_rgba(220,38,38,0.2)] active:scale-95">
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default ProfileView;