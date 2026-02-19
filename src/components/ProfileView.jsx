import React, { useMemo, useState } from 'react';
import { User, Shield, Target, LogOut, Award, Activity, Scale, Flame, Camera } from 'lucide-react'; // 🔥 Adicionado Camera
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '../supabaseClient';
import { calculateStats } from '../utils/rpgSystem';

const ProfileView = ({ userMetadata, setView, stats, history }) => {
  
  // 🔥 ESTADO DO AVATAR (Puxa da memória local ou fica nulo)
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('soldier_avatar') || null);

  // --- FUNÇÃO DE UPLOAD DA FOTO ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // FileReader transforma a imagem num texto Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setAvatarUrl(base64String); // Atualiza na tela
        localStorage.setItem('soldier_avatar', base64String); // Salva na memória do celular
      };
      reader.readAsDataURL(file);
    }
  };

  // --- CÁLCULOS DINÂMICOS DA BIOMETRIA ---
  const { age, imc, imcClassification, currentWeight, currentLevel } = useMemo(() => {
    const safeMetadata = userMetadata || {};
    
    let calculatedAge = '--';
    if (safeMetadata.birthdate) {
      const birthDate = new Date(safeMetadata.birthdate);
      const today = new Date();
      calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
    }

    let calculatedLevel = 1;
    if (history && history.length > 0) {
      let totalVolume = 0;
      history.forEach(session => {
        if (session.exercises) {
          session.exercises.forEach(ex => {
            if (ex.sets) {
              totalVolume += ex.sets.reduce((acc, set) => {
                const w = parseFloat(set.weight) || 0;
                const r = parseFloat(set.reps) || 0;
                return acc + (w * r);
              }, 0);
            }
          });
        }
      });
      calculatedLevel = Math.max(1, Math.floor(Math.sqrt(totalVolume / 3500)) + 1);
    }

    let weightToUse = safeMetadata.starting_weight;
    if (stats?.latest?.weight && stats.latest.weight !== '--') {
      weightToUse = stats.latest.weight;
    }

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

    return { 
      age: calculatedAge, 
      imc: calculatedImc, 
      imcClassification: classification, 
      currentWeight: weightToUse || '--',
      currentLevel: calculatedLevel 
    };
  }, [userMetadata, stats, history]);

  // --- LÓGICA DO RADAR ---
  const radarData = useMemo(() => {
    const rpgStats = calculateStats(history);
    const focusLevel = Math.max(1, (stats?.streak || 0) * 2); 
    const disciplineLevel = Math.max(1, Math.floor((history?.length || 0) / 2));

    return [
      { subject: 'Força (STR)', A: rpgStats.STR.level },
      { subject: 'Técnica (DEX)', A: rpgStats.DEX.level },
      { subject: 'Stamina (VIT)', A: rpgStats.VIT.level },
      { subject: 'Estética (CHA)', A: rpgStats.CHA.level },
      { subject: 'Foco', A: focusLevel },
      { subject: 'Disciplina', A: disciplineLevel }
    ];
  }, [history, stats?.streak]);

  const maxStat = Math.max(10, ...radarData.map(d => d.A));

  const displayClass = {
      hypertrophy: 'Tank (Massa)',
      weight_loss: 'Assassin (Seca)',
      endurance: 'Warrior (Resistência)'
  }[userMetadata?.goal] || 'Veterano';

  const handleLogout = async () => {
    if(window.confirm("Encerrar sessão de combate?")) {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-cyber pb-24">
      
      {/* Header do Perfil */}
      <div className="bg-card border-2 border-primary rounded-3xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(var(--primary),0.15)]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px]"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          
          {/* 🔥 UPLOADER DO AVATAR (Substituiu a caixa estática) */}
          <div className="relative w-20 h-20 shrink-0 rotate-3 group cursor-pointer z-20">
            <input 
              type="file" 
              id="avatar-upload" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload} 
            />
            <label 
              htmlFor="avatar-upload" 
              className="w-full h-full bg-input border-2 border-primary rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.4)] overflow-hidden cursor-pointer transition-all group-hover:border-white group-hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar do Soldado" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-primary group-hover:text-white transition-colors" />
              )}
              
              {/* Máscara escura que aparece ao passar o mouse (ou clicar) */}
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                <Camera size={24} className="text-white mb-1" />
              </div>
            </label>
          </div>

          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              {userMetadata?.username || 'SOLDADO_X'}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-primary/30 flex items-center gap-1">
                <Award size={12}/> Nível {currentLevel}
              </span>
              {stats?.streak > 0 && (
                <span className="bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-orange-500/30 flex items-center gap-1">
                  <Flame size={12}/> Streak {stats.streak}
                </span>
              )}
              <span className="text-muted text-[10px] font-bold uppercase tracking-widest">
                Classe: {displayClass}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Biometria Básica */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-input border border-border p-3 rounded-2xl text-center">
          <Activity className="mx-auto text-secondary mb-1 opacity-50" size={16} />
          <p className="text-[10px] text-muted font-black uppercase tracking-widest">Idade</p>
          <p className="text-xl font-black text-white">{age}</p>
        </div>
        <div className="bg-input border border-border p-3 rounded-2xl text-center">
          <Scale className="mx-auto text-secondary mb-1 opacity-50" size={16} />
          <p className="text-[10px] text-muted font-black uppercase tracking-widest">Peso Atual</p>
          <p className="text-xl font-black text-white">{currentWeight}<span className="text-[10px] ml-0.5 text-muted">kg</span></p>
        </div>
        <div className="bg-input border border-border p-3 rounded-2xl text-center">
          <Target className="mx-auto text-secondary mb-1 opacity-50" size={16} />
          <p className="text-[10px] text-muted font-black uppercase tracking-widest">IMC</p>
          <p className="text-xl font-black text-primary">{imc}</p>
        </div>
      </div>
      <p className="text-center text-[9px] text-muted uppercase font-bold tracking-[0.2em] -mt-2">Diagnóstico: <span className="text-secondary">{imcClassification}</span></p>

      {/* Radar de Atributos Real */}
      <div className="bg-card border-2 border-border rounded-3xl p-4 shadow-lg">
        <div className="text-center mb-2">
          <h3 className="text-sm font-black text-primary uppercase tracking-widest">Mapeamento Tático Real</h3>
          <p className="text-[10px] text-muted">Baseado no seu Histórico de Treinos</p>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="rgba(var(--primary), 0.2)" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#888888', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }} 
              />
              <PolarRadiusAxis angle={30} domain={[0, maxStat]} tick={false} axisLine={false} />
              <Radar
                name="Nível"
                dataKey="A"
                stroke="rgb(var(--primary))"
                strokeWidth={2}
                fill="rgb(var(--primary))"
                fillOpacity={0.3}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111', borderColor: 'rgb(var(--primary))', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}
                itemStyle={{ color: 'rgb(var(--primary))' }}
                formatter={(value) => [`Nível ${value}`, 'Atributo']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="space-y-3">
        <button 
          onClick={() => alert("Em breve: Integração com WhatsApp para compartilhar relatório.")}
          className="w-full bg-card border-2 border-primary text-primary font-black uppercase tracking-widest p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary hover:text-black transition-all"
        >
          <Shield size={18} /> Compartilhar Ficha
        </button>

        <button 
          onClick={handleLogout}
          className="w-full bg-red-500/10 border-2 border-red-500/50 text-red-500 font-black uppercase tracking-widest p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"
        >
          <LogOut size={18} /> Evacuar Sistema (Sair)
        </button>
      </div>

    </div>
  );
};

export default ProfileView;