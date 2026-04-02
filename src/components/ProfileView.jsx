import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom'; 
import { User, LogOut, Activity, Scale, Target, Shield, Camera, Settings, X, Save, Calendar, Trash2, Pencil, Plus, CalendarDays, AlertTriangle, Crosshair, FileText, Ruler } from 'lucide-react'; 
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../services/supabaseClient';
import { calculateStats } from '../utils/rpgSystem';

import UserLevel from './UserLevel';
import QuestBoard from './QuestBoard';
import BadgeList from './BadgeList';
import CyberCalendar from './CyberCalendar'; 
import CharacterSheet from './CharacterSheet'; // 🔥 Adicione aqui

const formatNumberInput = (value) => {
  return value.replace(/[^0-9.]/g, '');
};

const ProfileView = ({ userMetadata, setView, stats, history, bodyHistory = [], deleteEntry }) => {
  
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return userMetadata?.avatar_url || userMetadata?.picture || userMetadata?.photo || localStorage.getItem('soldier_avatar') || null;
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false); 
  const [editForm, setEditForm] = useState({
    username: userMetadata?.username || '',
    birthdate: userMetadata?.birthdate || '',
    height: userMetadata?.height || '',
    goal: userMetadata?.goal || 'hypertrophy',
    target_weight: userMetadata?.target_weight || '' 
  });
  const [isSaving, setIsSaving] = useState(false);

  const [showBioForm, setShowBioForm] = useState(false);
  const [bioDate, setBioDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [bioWeight, setBioWeight] = useState('');
  const [bioBf, setBioBf] = useState('');
  const [bioWaist, setBioWaist] = useState('');
  const [bioAbdomen, setBioAbdomen] = useState('');
  const [bioHip, setBioHip] = useState(''); 
  const [bioChest, setBioChest] = useState('');
  const [bioShoulder, setBioShoulder] = useState('');
  
  const [bioArmL, setBioArmL] = useState('');
  const [bioArmR, setBioArmR] = useState('');
  const [bioLegL, setBioLegL] = useState('');
  const [bioLegR, setBioLegR] = useState('');
  const [bioCalfL, setBioCalfL] = useState('');
  const [bioCalfR, setBioCalfR] = useState('');
  const [bioNote, setBioNote] = useState(''); 

  const [isSavingBio, setIsSavingBio] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const sortedBody = [...bodyHistory].reverse();
  const latestBio = sortedBody[0] || null;

  const calculatedLeanMass = useMemo(() => {
    const w = parseFloat(bioWeight);
    const bf = parseFloat(bioBf);
    if (w > 0 && bf >= 0) {
      return (w - (w * (bf / 100))).toFixed(1);
    }
    return '--';
  }, [bioWeight, bioBf]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setAvatarUrl(base64String);
        localStorage.setItem('soldier_avatar', base64String);
      };
      reader.readAsDataURL(file);
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
        target_weight: editForm.target_weight ? parseFloat(editForm.target_weight) : null, 
        avatar_url: avatarUrl 
      };

      const { error } = await supabase.auth.updateUser({ data: payload });
      if (error) {
        alert("🚨 Erro do Supabase (Perfil): " + error.message);
        setIsSaving(false);
        return;
      }
      setIsEditing(false);
      window.location.reload(); 
    } catch (error) {
      alert("Erro fatal no sistema: " + error.message);
      setIsSaving(false);
    }
  };

  const requestDelete = (id, type) => setItemToDelete({ id, type });

  const handleToggleForm = () => {
    if (showBioForm) {
      setBioDate(new Date().toISOString().split('T')[0]);
      setBioWeight(''); setBioBf(''); setBioWaist(''); setBioAbdomen(''); setBioHip('');
      setBioChest(''); setBioShoulder(''); 
      setBioArmL(''); setBioArmR(''); setBioLegL(''); setBioLegR(''); setBioCalfL(''); setBioCalfR('');
      setBioNote('');
    }
    setShowBioForm(!showBioForm);
  };

  const handleEditBio = (b) => {
    if (b.date) {
      const [day, month, year] = b.date.split('/');
      setBioDate(`${year}-${month}-${day}`);
    }
    setBioWeight(b.weight || ''); setBioBf(b.bf || ''); setBioWaist(b.waist || ''); setBioAbdomen(b.abdomen || ''); setBioHip(b.hip || '');
    setBioChest(b.chest || ''); setBioShoulder(b.shoulder || ''); 
    setBioArmL(b.arm_left || ''); setBioArmR(b.arm_right || ''); 
    setBioLegL(b.leg_left || ''); setBioLegR(b.leg_right || ''); 
    setBioCalfL(b.calf_left || ''); setBioCalfR(b.calf_right || '');
    setBioNote(b.note || '');
    setShowBioForm(true); 
  };

  const handleSaveBiometrics = async () => {
    if (!bioWeight) {
      alert("Comandante, insira ao menos o Peso para registrar o Log.");
      return;
    }
    setIsSavingBio(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const payload = {
          user_id: session.user.id, 
          date: bioDate, 
          weight: parseFloat(bioWeight) || null,
          bf: parseFloat(bioBf) || null, 
          lean_mass: calculatedLeanMass !== '--' ? parseFloat(calculatedLeanMass) : null,
          waist: parseFloat(bioWaist) || null, 
          abdomen: parseFloat(bioAbdomen) || null, 
          hip: parseFloat(bioHip) || null, 
          chest: parseFloat(bioChest) || null, 
          shoulder: parseFloat(bioShoulder) || null, 
          arm_left: parseFloat(bioArmL) || null,
          arm_right: parseFloat(bioArmR) || null,
          leg_left: parseFloat(bioLegL) || null,
          leg_right: parseFloat(bioLegR) || null,
          calf_left: parseFloat(bioCalfL) || null,
          calf_right: parseFloat(bioCalfR) || null,
          note: bioNote.trim() || null
        };

        const { error } = await supabase.from('body_stats').upsert(payload, { onConflict: 'unique_user_date' });
        if (error) {
          alert(`🚨 Erro do Supabase (Biometria):\nCódigo: ${error.code}\nDetalhe: ${error.message}`);
          setIsSavingBio(false);
          return;
        }
        window.location.reload(); 
      }
    } catch (err) { 
      alert("Erro fatal na requisição: " + err.message);
      setIsSavingBio(false);
    }
  };

  const rpgData = useMemo(() => {
    try { return calculateStats(history || []); } 
    catch (e) { return { level: 1, STR: {level: 1}, DEX: {level: 1}, VIT: {level: 1}, CHA: {level: 1} }; }
  }, [history]);

  const dynamicDiscipline = useMemo(() => {
    if (!history || history.length === 0) return 1;
    const baseDiscipline = Math.floor(history.length / 2);
    const sortedHistory = [...history].sort((a, b) => {
      const dateA = a.date.split('/').reverse().join('-');
      const dateB = b.date.split('/').reverse().join('-');
      return new Date(dateB) - new Date(dateA);
    });
    const lastDateStr = sortedHistory[0].date.split('/');
    const lastWorkoutDate = new Date(lastDateStr[2], lastDateStr[1] - 1, lastDateStr[0]);
    const today = new Date();
    const daysInactive = Math.floor((today - lastWorkoutDate) / (1000 * 60 * 60 * 24));
    let penalty = 0;
    if (daysInactive > 7) penalty = Math.floor((daysInactive - 7) / 3);
    return Math.max(1, baseDiscipline - penalty);
  }, [history]);

  const radarData = useMemo(() => {
    const focusLevel = Math.max(1, (stats?.streak || 0) * 2); 
    return [
      { subject: 'STR', A: rpgData?.STR?.level || 1 },
      { subject: 'DEX', A: rpgData?.DEX?.level || 1 },
      { subject: 'VIT', A: rpgData?.VIT?.level || 1 },
      { subject: 'CHA', A: rpgData?.CHA?.level || 1 },
      { subject: 'Foco', A: focusLevel },
      { subject: 'Disciplina', A: dynamicDiscipline }
    ];
  }, [rpgData, stats?.streak, dynamicDiscipline]);

  const maxStat = Math.max(10, ...radarData.map(d => d.A));

  // 🔥 CÁLCULOS AVANÇADOS (AGORA COM DIAGNÓSTICO DO RCQ) 🔥
  const { age, imc, imcClassification, rcq, rcqClass, currentWeight, goalProgress, isGoalMet } = useMemo(() => {
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
    let classification = 'Sem Dados';
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

    // RCQ com Diagnóstico
    let calculatedRcq = '--';
    let rcqClassification = 'Sem Dados';
    if (latestBio?.waist && latestBio?.hip) {
      const ratio = parseFloat(latestBio.waist) / parseFloat(latestBio.hip);
      calculatedRcq = ratio.toFixed(2);
      
      // Classificação Médica Padrão para Homens
      if (ratio <= 0.95) rcqClassification = 'Risco Baixo';
      else if (ratio <= 1.0) rcqClassification = 'Risco Moderado';
      else rcqClassification = 'Risco Alto';
    }

    let progress = null;
    let goalMet = false;
    if (safeMetadata.target_weight && weight) {
      const target = parseFloat(safeMetadata.target_weight);
      const starting = parseFloat(safeMetadata.starting_weight) || (target > weight ? weight - 10 : weight + 10); 
      
      if (target === weight) {
        progress = 100;
        goalMet = true;
      } else {
        const totalDiff = Math.abs(starting - target);
        const currentDiff = Math.abs(weight - target);
        progress = Math.max(0, Math.min(100, ((totalDiff - currentDiff) / totalDiff) * 100)).toFixed(0);
      }
    }

    return { 
      age: calculatedAge, imc: calculatedImc, imcClassification: classification, 
      rcq: calculatedRcq, rcqClass: rcqClassification, currentWeight: weightToUse || '--', 
      goalProgress: progress, isGoalMet: goalMet
    };
  }, [userMetadata, stats, latestBio]);

  const displayClass = { 
  hypertrophy: 'Titã (Força Bruta)', 
  weight_loss: 'Sombra (Definição)', 
  endurance: 'Nômade (Resistência)' 
  }[userMetadata?.goal] || 'Ciborgue';

  const donutData = useMemo(() => {
    if (latestBio?.weight && latestBio?.bf) {
      const w = parseFloat(latestBio.weight);
      const bf = parseFloat(latestBio.bf);
      const fat = w * (bf / 100);
      const lean = w - fat;
      return [
        { name: 'Massa Magra', value: parseFloat(lean.toFixed(1)), color: 'rgb(var(--success))' },
        { name: 'Massa Gorda', value: parseFloat(fat.toFixed(1)), color: 'rgb(var(--warning))' }
      ];
    }
    return null;
  }, [latestBio]);

  const handleLogout = async () => {
    if(window.confirm("Encerrar sessão de combate?")) {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-cyber pb-24 relative">
      
      <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* HEADER DE IDENTIDADE COM BARRA DE OBJETIVO */}
      <div className="bg-card border-2 border-primary rounded-3xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(var(--primary),0.15)] mt-2">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px]"></div>
        
        <button onClick={() => setIsEditing(true)} className="absolute top-4 right-4 z-30 p-2 bg-input/80 border border-primary/50 text-primary rounded-xl hover:bg-primary hover:text-black transition-all shadow-lg">
          <Settings size={20} />
        </button>

        <div className="flex items-center gap-4 relative z-10 mb-4">
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

        {userMetadata?.target_weight && (
          <div className="relative z-10 pt-4 border-t border-primary/20">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-1">
                <Crosshair size={12} className="text-secondary" /> Operação: Bater {userMetadata.target_weight}kg
              </span>
              <span className="text-xs font-black text-white">{goalProgress}%</span>
            </div>
            <div className="w-full bg-input rounded-full h-2 overflow-hidden border border-border">
              <div 
                className={`h-full transition-all duration-1000 ${isGoalMet ? 'bg-success shadow-[0_0_10px_rgba(var(--success),0.8)]' : 'bg-secondary shadow-[0_0_10px_rgba(var(--secondary),0.6)]'}`}
                style={{ width: `${goalProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <UserLevel history={history} />

      {/* BIOMETRIA MACRO (AGORA COM OS DIAGNÓSTICOS EMBAIXO) */}
      <div>
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-input border border-border p-2 rounded-2xl text-center shadow-md">
            <Activity className="mx-auto text-secondary mb-1 opacity-50" size={14} />
            <p className="text-[9px] text-muted font-black uppercase tracking-widest">Idade</p>
            <p className="text-lg font-black text-white">{age}</p>
          </div>
          <div className="bg-input border border-border p-2 rounded-2xl text-center shadow-md">
            <Scale className="mx-auto text-secondary mb-1 opacity-50" size={14} />
            <p className="text-[9px] text-muted font-black uppercase tracking-widest">Peso</p>
            <p className="text-lg font-black text-white">{currentWeight}</p>
          </div>
          <div className="bg-input border border-border p-2 rounded-2xl text-center shadow-md">
            <Target className="mx-auto text-secondary mb-1 opacity-50" size={14} />
            <p className="text-[9px] text-muted font-black uppercase tracking-widest">IMC</p>
            <p className="text-lg font-black text-primary">{imc}</p>
          </div>
          <div className="bg-input border border-border p-2 rounded-2xl text-center shadow-md tooltip relative group">
            <Activity className="mx-auto text-secondary mb-1 opacity-50" size={14} />
            <p className="text-[9px] text-muted font-black uppercase tracking-widest" title="Relação Cintura-Quadril">RCQ</p>
            <p className="text-lg font-black text-primary">{rcq}</p>
          </div>
        </div>
        <p className="text-center text-[9px] text-muted uppercase font-bold tracking-[0.2em] mt-3">
          Saúde (IMC): <span className="text-secondary">{imcClassification}</span> | Coração (RCQ): <span className={`${rcqClass === 'Risco Baixo' ? 'text-success' : rcqClass === 'Risco Moderado' ? 'text-warning' : 'text-red-500'}`}>{rcqClass}</span>
        </p>
      </div>

      {donutData && (
        <div className="bg-card border-2 border-border rounded-3xl p-4 shadow-lg flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-2">Máquina Física</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success shadow-[0_0_5px_rgba(var(--success),0.5)]"></div>
                <div>
                  <p className="text-[9px] text-muted font-black uppercase tracking-widest leading-none">Massa Magra</p>
                  <p className="text-sm font-black text-white">{donutData[0].value} kg</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning shadow-[0_0_5px_rgba(var(--warning),0.5)]"></div>
                <div>
                  <p className="text-[9px] text-muted font-black uppercase tracking-widest leading-none">Gordura ({latestBio.bf}%)</p>
                  <p className="text-sm font-black text-white">{donutData[1].value} kg</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-28 h-28 shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value" stroke="none">
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }} itemStyle={{ fontWeight: 'bold' }} formatter={(value) => [`${value} kg`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-xs font-black text-white">{latestBio.weight}</span>
              <span className="text-[8px] text-muted uppercase font-bold -mt-1">KG</span>
            </div>
          </div>
        </div>
      )}

      {/* SCANNER CORPORAL */}
      <div className="shrink-0 space-y-3 pt-2 pb-4 border-b border-border">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-secondary uppercase tracking-widest flex items-center gap-2">
            <Scale size={14} /> Scanner Corporal
          </h3>
          <button 
            onClick={handleToggleForm} 
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-black uppercase tracking-widest ${showBioForm ? 'bg-secondary text-black border-secondary shadow-[0_0_10px_rgba(var(--secondary),0.4)]' : 'bg-card text-secondary border-secondary/50 hover:bg-secondary/10'}`}
          >
            {showBioForm ? <X size={12}/> : <Plus size={12}/>} 
            {showBioForm ? 'Cancelar' : 'Escanear'}
          </button>
        </div>

        {showBioForm && (
          <div className="bg-card border-2 border-secondary/30 rounded-xl p-4 animate-in slide-in-from-top-2 fade-in duration-200 shadow-lg space-y-4">
            
            <div className="flex items-center gap-2 bg-input/50 border border-border rounded-lg p-2">
              <CalendarDays size={16} className="text-secondary" />
              <input type="date" value={bioDate} onChange={(e) => setBioDate(e.target.value)} className="bg-transparent text-main text-xs font-bold w-full outline-none" />
            </div>

            <div className="p-3 border border-border rounded-lg bg-black/20">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-primary mb-2">Composição Corporal</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1 block">Peso (KG)*</label>
                  <input type="text" inputMode="decimal" placeholder="80.5" value={bioWeight} onChange={(e) => setBioWeight(formatNumberInput(e.target.value))} className="w-full bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-success outline-none focus:border-success transition-colors" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1 block">BF (%)</label>
                  <input type="text" inputMode="decimal" placeholder="15.0" value={bioBf} onChange={(e) => setBioBf(formatNumberInput(e.target.value))} className="w-full bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-warning outline-none focus:border-warning transition-colors" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1 block">Massa Magra</label>
                  <div className="w-full bg-input/50 border border-border rounded-lg p-2 text-center text-xs font-black text-primary opacity-80 flex items-center justify-center h-[34px]">
                    {calculatedLeanMass} {calculatedLeanMass !== '--' && <span className="text-[8px] ml-0.5 text-muted">kg</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 border border-border rounded-lg bg-black/20">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-primary mb-2">Medidas de Tronco (CM)</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[8px] font-bold text-muted uppercase tracking-widest mb-1 block text-center">Cintura</label>
                  <input type="text" inputMode="decimal" placeholder="00.0" value={bioWaist} onChange={(e) => setBioWaist(formatNumberInput(e.target.value))} className="w-full bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-white outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-[8px] font-bold text-warning uppercase tracking-widest mb-1 block text-center">Abdome</label>
                  <input type="text" inputMode="decimal" placeholder="00.0" value={bioAbdomen} onChange={(e) => setBioAbdomen(formatNumberInput(e.target.value))} className="w-full bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-white outline-none focus:border-warning" />
                </div>
                <div>
                  <label className="text-[8px] font-bold text-muted uppercase tracking-widest mb-1 block text-center">Quadril</label>
                  <input type="text" inputMode="decimal" placeholder="00.0" value={bioHip} onChange={(e) => setBioHip(formatNumberInput(e.target.value))} className="w-full bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-white outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-[8px] font-bold text-muted uppercase tracking-widest mb-1 block text-center">Peito</label>
                  <input type="text" inputMode="decimal" placeholder="00.0" value={bioChest} onChange={(e) => setBioChest(formatNumberInput(e.target.value))} className="w-full bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-white outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-[8px] font-bold text-muted uppercase tracking-widest mb-1 block text-center">Ombro</label>
                  <input type="text" inputMode="decimal" placeholder="00.0" value={bioShoulder} onChange={(e) => setBioShoulder(formatNumberInput(e.target.value))} className="w-full bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-white outline-none focus:border-primary" />
                </div>
              </div>
            </div>

            <div className="p-3 border border-border rounded-lg bg-black/20">
              <div className="flex justify-between items-end mb-2">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-primary">Membros Bilaterais (CM)</h4>
                <div className="flex gap-4">
                  <span className="text-[8px] font-black text-muted uppercase">Esq.</span>
                  <span className="text-[8px] font-black text-muted uppercase mr-2">Dir.</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest w-16">Braço</label>
                  <input type="text" inputMode="decimal" placeholder="Esq" value={bioArmL} onChange={(e) => setBioArmL(formatNumberInput(e.target.value))} className="flex-1 bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-white outline-none focus:border-primary" />
                  <input type="text" inputMode="decimal" placeholder="Dir" value={bioArmR} onChange={(e) => setBioArmR(formatNumberInput(e.target.value))} className="flex-1 bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-white outline-none focus:border-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest w-16">Coxa</label>
                  <input type="text" inputMode="decimal" placeholder="Esq" value={bioLegL} onChange={(e) => setBioLegL(formatNumberInput(e.target.value))} className="flex-1 bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-white outline-none focus:border-primary" />
                  <input type="text" inputMode="decimal" placeholder="Dir" value={bioLegR} onChange={(e) => setBioLegR(formatNumberInput(e.target.value))} className="flex-1 bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-white outline-none focus:border-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest w-16">Pantur.</label>
                  <input type="text" inputMode="decimal" placeholder="Esq" value={bioCalfL} onChange={(e) => setBioCalfL(formatNumberInput(e.target.value))} className="flex-1 bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-white outline-none focus:border-primary" />
                  <input type="text" inputMode="decimal" placeholder="Dir" value={bioCalfR} onChange={(e) => setBioCalfR(formatNumberInput(e.target.value))} className="flex-1 bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-white outline-none focus:border-primary" />
                </div>
              </div>
            </div>

            <div className="p-3 border border-border rounded-lg bg-black/20">
               <label className="text-[9px] font-black uppercase tracking-widest text-primary mb-2 block">Diário Tático (Anotações)</label>
               <textarea 
                  value={bioNote} 
                  onChange={(e) => setBioNote(e.target.value)}
                  placeholder="Ex: Medida tirada em jejum logo após acordar."
                  className="w-full bg-input border border-border rounded-lg p-2 text-xs text-white outline-none focus:border-primary h-16 resize-none"
               />
            </div>

            <button 
              onClick={handleSaveBiometrics}
              disabled={isSavingBio || !bioWeight}
              className="w-full bg-secondary text-black font-black uppercase tracking-widest py-3 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              {isSavingBio ? <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full"/> : <Save size={16} />}
              Registrar Status
            </button>
          </div>
        )}

        {/* LISTAGEM DOS CARDS DE BIOMETRIA (UI REDESIGN) */}
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide">
          {sortedBody.length === 0 && !showBioForm && (
            <div className="text-xs text-muted p-4 w-full text-center border border-dashed border-border rounded-xl font-bold uppercase tracking-widest">
              Nenhum scan corporal registrado.
            </div>
          )}
          {sortedBody.map((b) => (
            <div key={b.id} className="min-w-[300px] max-w-[320px] bg-card border-2 border-secondary/20 p-4 rounded-2xl shadow-xl relative group hover:border-secondary/50 transition-all shrink-0 flex flex-col gap-3">
              
              {/* HEADER DO CARD */}
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="font-black text-secondary text-xs tracking-widest flex items-center gap-1.5">
                  <CalendarDays size={14} /> {b.date}
                </span>
                <div className="flex gap-3">
                  <button onClick={() => handleEditBio(b)} className="text-muted hover:text-primary transition-colors" title="Editar"><Pencil size={14} /></button>
                  <button onClick={() => requestDelete(b.id, 'body')} className="text-muted hover:text-red-500 transition-colors" title="Apagar"><Trash2 size={14} /></button>
                </div>
              </div>
              
              {/* ZONA 1: MACRO (COMPOSIÇÃO) */}
              <div className="grid grid-cols-3 gap-2">
                 <div className="flex flex-col items-center justify-center p-2 bg-black/30 rounded-xl border border-border/30">
                   <span className="text-[8px] text-muted uppercase font-bold tracking-widest">Peso</span>
                   <span className="text-sm font-black text-success mt-0.5">{b.weight || '--'}<span className="text-[8px] text-muted ml-0.5 font-normal">kg</span></span>
                 </div>
                 <div className="flex flex-col items-center justify-center p-2 bg-black/30 rounded-xl border border-border/30">
                   <span className="text-[8px] text-muted uppercase font-bold tracking-widest">BF</span>
                   <span className="text-sm font-black text-warning mt-0.5">{b.bf || '--'}<span className="text-[8px] text-muted ml-0.5 font-normal">%</span></span>
                 </div>
                 <div className="flex flex-col items-center justify-center p-2 bg-primary/10 rounded-xl border border-primary/30">
                   <span className="text-[8px] text-primary uppercase font-bold tracking-widest">Massa Magra</span>
                   <span className="text-sm font-black text-white mt-0.5">{b.lean_mass || '--'}<span className="text-[8px] text-primary/70 ml-0.5 font-normal">kg</span></span>
                 </div>
              </div>

              {/* ZONA 2: TRONCO (LAYOUT RESPIRÁVEL) */}
              <div className="bg-black/20 rounded-xl border border-border/30 p-2 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center justify-center bg-input/30 rounded-lg py-1.5">
                    <span className="text-[8px] text-muted uppercase font-bold tracking-widest">Cintura</span>
                    <span className="text-xs font-black text-main">{b.waist || '--'}<span className="text-[7px] text-muted ml-0.5 font-normal">cm</span></span>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-warning/5 rounded-lg py-1.5 border border-warning/20">
                    <span className="text-[8px] text-warning uppercase font-bold tracking-widest">Abdome</span>
                    <span className="text-xs font-black text-white">{b.abdomen || '--'}<span className="text-[7px] text-muted ml-0.5 font-normal">cm</span></span>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-input/30 rounded-lg py-1.5">
                    <span className="text-[8px] text-muted uppercase font-bold tracking-widest">Quadril</span>
                    <span className="text-xs font-black text-main">{b.hip || '--'}<span className="text-[7px] text-muted ml-0.5 font-normal">cm</span></span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-border/30 pt-2">
                  <div className="flex flex-col items-center justify-center bg-input/30 rounded-lg py-1.5">
                    <span className="text-[8px] text-muted uppercase font-bold tracking-widest">Peito</span>
                    <span className="text-xs font-black text-main">{b.chest || '--'}<span className="text-[7px] text-muted ml-0.5 font-normal">cm</span></span>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-input/30 rounded-lg py-1.5">
                    <span className="text-[8px] text-muted uppercase font-bold tracking-widest">Ombro</span>
                    <span className="text-xs font-black text-main">{b.shoulder || '--'}<span className="text-[7px] text-muted ml-0.5 font-normal">cm</span></span>
                  </div>
                </div>
              </div>

              {/* ZONA 3: MEMBROS (TABELA DE PRECISÃO) */}
              <div className="bg-black/20 rounded-xl border border-border/30 p-2">
                <div className="flex justify-between px-2 mb-1">
                  <span className="text-[7px] text-muted uppercase font-bold tracking-widest w-12">Membro</span>
                  <span className="text-[7px] text-muted uppercase font-bold tracking-widest flex-1 text-center">Esquerdo</span>
                  <span className="text-[7px] text-muted uppercase font-bold tracking-widest flex-1 text-center">Direito</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline bg-input/40 rounded px-2 py-1">
                    <span className="text-[9px] text-main font-bold uppercase tracking-widest w-12">Braço</span>
                    <span className="text-[10px] font-black text-white flex-1 text-center">{b.arm_left || '--'}<span className="text-[7px] text-muted font-normal ml-0.5">cm</span></span>
                    <span className="text-[10px] font-black text-white flex-1 text-center">{b.arm_right || '--'}<span className="text-[7px] text-muted font-normal ml-0.5">cm</span></span>
                  </div>
                  <div className="flex justify-between items-baseline bg-input/40 rounded px-2 py-1">
                    <span className="text-[9px] text-main font-bold uppercase tracking-widest w-12">Coxa</span>
                    <span className="text-[10px] font-black text-white flex-1 text-center">{b.leg_left || '--'}<span className="text-[7px] text-muted font-normal ml-0.5">cm</span></span>
                    <span className="text-[10px] font-black text-white flex-1 text-center">{b.leg_right || '--'}<span className="text-[7px] text-muted font-normal ml-0.5">cm</span></span>
                  </div>
                  <div className="flex justify-between items-baseline bg-input/40 rounded px-2 py-1">
                    <span className="text-[9px] text-main font-bold uppercase tracking-widest w-12">Pantur.</span>
                    <span className="text-[10px] font-black text-white flex-1 text-center">{b.calf_left || '--'}<span className="text-[7px] text-muted font-normal ml-0.5">cm</span></span>
                    <span className="text-[10px] font-black text-white flex-1 text-center">{b.calf_right || '--'}<span className="text-[7px] text-muted font-normal ml-0.5">cm</span></span>
                  </div>
                </div>
              </div>

              {/* ZONA 4: NOTAS TÁTICAS */}
              {b.note && (
                <div className="mt-auto pt-2 p-2 bg-warning/5 rounded-lg border border-warning/20 text-[10px] text-muted italic flex items-start gap-1.5">
                  <FileText size={12} className="text-warning shrink-0 mt-0.5" />
                  <span className="line-clamp-3 leading-snug">"{b.note}"</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MAPEAMENTO TÁTICO (Gráfico Radar) */}
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
      </div>

      {/* FICHA DE PERSONAGEM (Pluga exatamente aqui) */}
      <CharacterSheet history={history} />
      
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

      {isEditing && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-card border-2 border-primary w-full max-w-sm rounded-3xl shadow-[0_0_40px_rgba(var(--primary),0.3)] flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center p-5 border-b border-border bg-input/50 rounded-t-3xl shrink-0">
              <h3 className="font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <Settings size={18} /> Ajuste de Sistema
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-muted hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto pb-10 scrollbar-hide">
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
                  <div className="relative">
                    <Ruler size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary opacity-50" />
                    <input 
                      type="text" 
                      inputMode="decimal"
                      value={editForm.height} 
                      onChange={(e) => setEditForm({...editForm, height: formatNumberInput(e.target.value)})}
                      className="w-full bg-input border border-border py-3 pl-10 pr-3 rounded-xl text-white font-bold focus:border-primary focus:outline-none"
                      placeholder="175"
                    />
                  </div>
                </div>
                
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
                    className="w-full bg-input border border-border py-3 pl-10 pr-3 rounded-xl text-white font-bold focus:border-secondary focus:outline-none"
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
                  className="w-full bg-input border border-border p-3 rounded-xl text-white font-bold focus:border-primary focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="hypertrophy">Tank (Foco em Massa/Força)</option>
                  <option value="weight_loss">Assassin (Foco em Definição/Seca)</option>
                  <option value="endurance">Warrior (Foco em Resistência)</option>
                </select>
              </div>

              <button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full mt-4 bg-primary text-black font-black uppercase tracking-widest p-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(var(--primary),0.6)] transition-all disabled:opacity-50 shrink-0"
              >
                {isSaving ? 'Sincronizando...' : <><Save size={18} /> Salvar Ficha</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {itemToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-center items-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setItemToDelete(null)}></div>
          
          <div className="bg-card border-2 border-red-500/50 w-full max-w-xs rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.2)] relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
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
                <button 
                  onClick={() => setItemToDelete(null)} 
                  className="flex-1 py-3 rounded-xl border border-border text-muted font-black uppercase text-xs hover:bg-input hover:text-white transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    deleteEntry(itemToDelete.id, itemToDelete.type);
                    setItemToDelete(null);
                  }} 
                  className="flex-1 py-3 rounded-xl bg-red-600/20 border border-red-500 text-red-500 font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all shadow-[0_0_15px_rgba(220,38,38,0.2)] active:scale-95"
                >
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