import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { calculateStats } from '../../utils/rpgSystem';
import { daysBetweenLocalDates, getLocalDateKey, normalizeLocalDateKey } from '../../utils/dateUtils';
import { parseDecimalInput } from '../../utils/numberUtils';
import { readUserStoredText, STORAGE_KEYS, writeUserStoredText } from '../../utils/storage';

// Importando o exército de componentes que criamos:
import ProfileHeader from './ProfileHeader';
import BiometricsDashboard from './BiometricsDashboard';
import BodyScanner from './BodyScanner';
import TacticalRadar from '../stats/TacticalRadar';
import ProfileSettingsModal from './ProfileSettingsModal';
import CharacterSheet from '../rpg/CharacterSheet'; 
import BadgeList from '../rpg/BadgeList';
import QuestBoard from '../rpg/QuestBoard';

const ProfileView = ({ userId, userMetadata, stats, history, bodyHistory = [], deleteEntry }) => {
  
  // ================= ESTADOS =================
  const [avatarUrl, setAvatarUrl] = useState(() => userMetadata?.avatar_url || userMetadata?.picture || userMetadata?.photo || (userId ? readUserStoredText(userId, STORAGE_KEYS.avatar, '') : '') || null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false); 
  const [editForm, setEditForm] = useState({
    username: userMetadata?.username || '', birthdate: userMetadata?.birthdate || '', height: userMetadata?.height || '', goal: userMetadata?.goal || 'hypertrophy', target_weight: userMetadata?.target_weight || '' 
  });
  const [isSaving, setIsSaving] = useState(false);

  const [showBioForm, setShowBioForm] = useState(false);
  const [bioDate, setBioDate] = useState(getLocalDateKey);
  const [bioWeight, setBioWeight] = useState(''); const [bioBf, setBioBf] = useState(''); const [bioWaist, setBioWaist] = useState(''); const [bioAbdomen, setBioAbdomen] = useState(''); const [bioHip, setBioHip] = useState(''); 
  const [bioChest, setBioChest] = useState(''); const [bioShoulder, setBioShoulder] = useState('');
  const [bioArmL, setBioArmL] = useState(''); const [bioArmR, setBioArmR] = useState(''); const [bioLegL, setBioLegL] = useState(''); const [bioLegR, setBioLegR] = useState(''); const [bioCalfL, setBioCalfL] = useState(''); const [bioCalfR, setBioCalfR] = useState('');
  const [bioNote, setBioNote] = useState(''); 

  const [isSavingBio, setIsSavingBio] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [, setIsUploadingAvatar] = useState(false);
  const [feedback, setFeedback] = useState('');


  const sortedBody = [...bodyHistory].sort((a, b) => normalizeLocalDateKey(b.date).localeCompare(normalizeLocalDateKey(a.date)));
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
    const w = parseDecimalInput(bioWeight); const bf = parseDecimalInput(bioBf);
    if (w > 0 && bf >= 0) return (w - (w * (bf / 100))).toFixed(1);
    return '--';
  }, [bioWeight, bioBf]);

  const rpgData = useMemo(() => {
    try { return calculateStats(history || []); } catch { return { level: 1, STR: {level: 1}, DEX: {level: 1}, VIT: {level: 1}, CHA: {level: 1} }; }
  }, [history]);

  const dynamicDiscipline = useMemo(() => {
    if (!history || history.length === 0) return 1;
    const baseDiscipline = Math.floor(history.length / 2);
    const sortedHistory = [...history].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    const daysInactive = daysBetweenLocalDates(sortedHistory[0].dateKey, getLocalDateKey());
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

  const { age, imcClassification, rcq, rcqClass, currentWeight, goalProgress, isGoalMet } = useMemo(() => {
    const sm = userMetadata || {};
    let cAge = '--';
    if (sm.birthdate) {
      const bD = new Date(sm.birthdate); const td = new Date();
      cAge = td.getFullYear() - bD.getFullYear();
      if (td.getMonth() < bD.getMonth() || (td.getMonth() === bD.getMonth() && td.getDate() < bD.getDate())) cAge--;
    }
    let wToUse = stats?.latest?.weight && stats.latest.weight !== '--' ? stats.latest.weight : sm.starting_weight;
    let clazz = 'Sem Dados';
    const w = parseFloat(wToUse); const h = parseFloat(sm.height) / 100;
    if (w && h) {
      const iV = w / (h * h);
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
    return { age: cAge, imcClassification: clazz, rcq: cRcq, rcqClass: rcqC, currentWeight: wToUse || '--', goalProgress: prog, isGoalMet: gMet };
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Mostra o preview instantâneo na tela (UX perfeita)
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result);
      writeUserStoredText(userId, STORAGE_KEYS.avatar, reader.result);
    };
    reader.readAsDataURL(file);

    setIsUploadingAvatar(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Usuário não autenticado.");

      const oldAvatarUrl = userMetadata?.avatar_url;
      if (oldAvatarUrl && oldAvatarUrl.includes('avatars/')) {
        // Pega só o nome do arquivo velho no final da URL
        const oldFileName = oldAvatarUrl.split('avatars/')[1];
        if (oldFileName) {
          await supabase.storage.from('avatars').remove([oldFileName]);
        }
      }

      // 3. UPLOAD DA FOTO NOVA
      // Usamos Date.now() em vez de random para evitar cache do navegador
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      // 4. ATUALIZA O PERFIL AUTOMATICAMENTE
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const newUrl = data.publicUrl;
      writeUserStoredText(userId, STORAGE_KEYS.avatar, newUrl);

      const { error: updateError } = await supabase.auth.updateUser({ 
        data: { avatar_url: newUrl } 
      });

      if (updateError) throw updateError;
      
      window.location.reload(); 

    } catch (error) {
      setFeedback(`Não foi possível atualizar a foto. Tente novamente. ${error.message}`);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const payload = { 
        username: editForm.username, 
        birthdate: editForm.birthdate, 
        height: editForm.height ? parseFloat(editForm.height) : null, 
        goal: editForm.goal, 
        target_weight: editForm.target_weight ? parseFloat(editForm.target_weight) : null
      };

      const { error } = await supabase.auth.updateUser({ data: payload });
      
      if (error) throw error;
      
      setIsEditing(false);
      setTimeout(() => {
        window.location.reload(); 
      }, 300);

    } catch (error) { 
      setFeedback(`Não foi possível salvar o perfil. Seus dados anteriores continuam seguros. ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleForm = () => {
    if (showBioForm) {
      setBioDate(getLocalDateKey()); setBioWeight(''); setBioBf(''); setBioWaist(''); setBioAbdomen(''); setBioHip(''); setBioChest(''); setBioShoulder(''); setBioArmL(''); setBioArmR(''); setBioLegL(''); setBioLegR(''); setBioCalfL(''); setBioCalfR(''); setBioNote('');
    }
    setShowBioForm(!showBioForm);
  };

  const handleEditBio = (b) => {
    if (b.date) setBioDate(normalizeLocalDateKey(b.date));
    setBioWeight(b.weight || ''); setBioBf(b.bf || ''); setBioWaist(b.waist || ''); setBioAbdomen(b.abdomen || ''); setBioHip(b.hip || ''); setBioChest(b.chest || ''); setBioShoulder(b.shoulder || ''); setBioArmL(b.arm_left || ''); setBioArmR(b.arm_right || ''); setBioLegL(b.leg_left || ''); setBioLegR(b.leg_right || ''); setBioCalfL(b.calf_left || ''); setBioCalfR(b.calf_right || ''); setBioNote(b.note || '');
    setShowBioForm(true); 
  };

  const handleSaveBiometrics = async () => {
    if (!bioWeight) { setFeedback('Informe ao menos o peso para salvar esta medição.'); return; }
    setIsSavingBio(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const payload = {
          user_id: session.user.id, date: bioDate, weight: parseDecimalInput(bioWeight), bf: parseDecimalInput(bioBf), lean_mass: calculatedLeanMass !== '--' ? parseDecimalInput(calculatedLeanMass) : null, waist: parseDecimalInput(bioWaist), abdomen: parseDecimalInput(bioAbdomen), hip: parseDecimalInput(bioHip), chest: parseDecimalInput(bioChest), shoulder: parseDecimalInput(bioShoulder), arm_left: parseDecimalInput(bioArmL), arm_right: parseDecimalInput(bioArmR), leg_left: parseDecimalInput(bioLegL), leg_right: parseDecimalInput(bioLegR), calf_left: parseDecimalInput(bioCalfL), calf_right: parseDecimalInput(bioCalfR), note: bioNote.trim() || null
        };
        const { error } = await supabase.from('body_stats').upsert(payload, { onConflict: 'unique_user_date' });
        if (error) throw error;
        window.location.reload(); 
      }
    } catch (err) { setFeedback(`Não foi possível salvar a medição. Os dados anteriores continuam seguros. ${err.message}`); setIsSavingBio(false); }
  };

  const requestDelete = (id, type) => setItemToDelete({ id, type });

  // ================= RENDERIZAÇÃO DO MAESTRO =================
  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-24 relative px-1">
      
      <ProfileHeader 
        userMetadata={userMetadata} avatarUrl={avatarUrl} handleImageUpload={handleImageUpload} 
        setIsEditing={setIsEditing} goalProgress={goalProgress} isGoalMet={isGoalMet} 
        displayClass={displayClass}
        stats={stats}
      />

      {feedback && <div role="alert" className="flex items-start gap-3 rounded-xl border border-warning/50 bg-warning/10 p-4 text-sm text-muted"><AlertTriangle className="shrink-0 text-warning" size={19} /><div className="flex-1">{feedback}</div><button type="button" onClick={() => setFeedback('')} aria-label="Fechar aviso" className="font-black text-main">×</button></div>}

      <BiometricsDashboard 
        age={age} currentWeight={currentWeight} latestBio={latestBio}
        imcClassification={imcClassification} rcq={rcq} rcqClass={rcqClass} 
        bfColorClass={bfColorClass} donutData={donutData} 
      />

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

      <TacticalRadar radarData={radarData} maxStat={maxStat} />

      <CharacterSheet history={history} stats={stats} rpgData={rpgData} />
      <BadgeList history={history} stats={stats} rpgData={rpgData} />
      <QuestBoard userId={userId} />

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
                <button onClick={() => { deleteEntry(itemToDelete.id, itemToDelete.type); setItemToDelete(null); }} className="flex-1 py-3 rounded-xl bg-danger/10 border border-danger text-danger font-black uppercase text-xs hover:bg-danger hover:text-on-danger transition-all shadow-sm active:scale-95">
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
