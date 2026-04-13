import React, { useState, useRef } from 'react';
import { Check, Camera, Download, Loader2, Share2, Target, Zap, Clock, X, Activity, Skull } from 'lucide-react';
import { toBlob } from 'html-to-image';
import ShareCard from './ShareCard'; 

const WorkoutComplete = ({ 
  onClose, 
  sessionVolume = "0", 
  sessionDuration = "0", 
  sessionPoints = "+0",
  history = [],
  bossName = "ALVO",
  bossHp = 10000, 
  streak = 0,
  currentLevel = 1,
  xpRemaining = 0, 
  progressPercent = 0 
}) => {
  const [selfieUrl, setSelfieUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [cardVariant, setCardVariant] = useState('rpg'); // 🔥 Corrigido
  const [imageFile, setImageFile] = useState(null); // 🔥 Guarda o arquivo real para envio

  const cardRef = useRef(null);

  const handleSelfieCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setSelfieUrl(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const generateShareCard = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 300));
      const blob = await toBlob(cardRef.current, { 
        pixelRatio: 1, 
        backgroundColor: '#050B14',
        filter: (node) => node.tagName === 'IMG' ? node.complete : true
      });
      const file = new File([blob], 'SOLO_RELATORIO.png', { type: 'image/png' });
      setImageFile(file); // Salva no estado novo

      setGeneratedImage(URL.createObjectURL(blob));
    } catch (err) {
      alert("Falha de renderização visual.");
    } finally {
      setIsGenerating(false);
    }
  };

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const today = new Date();
  const currentDayIndex = today.getDay();
  const getLocalDateString = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDayIndex);
  const currentWeekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return getLocalDateString(d);
  });

  const handleShareToSocials = async () => {
    if (navigator.share && navigator.canShare && imageFile) {
      try {
        await navigator.share({
          title: 'Relatório Tático SOLO',
          text: 'Missão cumprida no sistema SOLO. Acompanhe meu progresso.',
          files: [imageFile] // O segredo tá aqui, enviamos a imagem como anexo
        });
      } catch (err) {
        console.log("Compartilhamento abortado pelo recruta.", err);
      }
    } else {
      alert("Comando: Seu dispositivo não suporta compartilhamento direto. Salve a imagem na galeria.");
    }
  };

  const earnedXp = parseInt(sessionPoints.replace(/\D/g, '')) || 0;
  const volumeNumber = parseInt(sessionVolume.replace(/\D/g, '')) || 0;
  const hpTarget = parseInt(String(bossHp).replace(/\D/g, '')) || 1;
  const damagePercent = ((volumeNumber / hpTarget) * 100).toFixed(1);

  let uiBattleMessage = "";
  if (volumeNumber >= hpTarget) {
    uiBattleMessage = `Alvo neutralizado. Dano excedente de ${(volumeNumber - hpTarget)}kg registrado no sistema.`;
  } else if (damagePercent >= 80) {
    uiBattleMessage = `Dano de ${damagePercent}% aplicado. O alvo resistiu. Força letal necessária na próxima operação.`;
  } else {
    uiBattleMessage = `Impacto de apenas ${damagePercent}%. Volume tático insuficiente. O alvo escapou.`;
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      
      {/* CARD INVISÍVEL PARA PRINT */}
      <ShareCard 
        cardRef={cardRef} stats={{ volume: sessionVolume, duration: sessionDuration, prs: 0 }} 
        bossName={bossName} bossHp={bossHp} streak={streak} xp={earnedXp} selfieUrl={selfieUrl}
        currentLevel={currentLevel} progressPercent={progressPercent} xpRemaining={xpRemaining}
        variant={cardVariant} // 🔥 Passando a variante pro componente filho
      />

      {/* CAIXA PRINCIPAL */}
      <div className="w-full max-w-[450px] bg-card border border-border rounded-3xl flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
        
        {/* CABEÇALHO FIXO COM O BOTÃO DE X */}
        <div className="p-5 border-b border-border/50 shrink-0 flex justify-between items-center relative overflow-hidden bg-black/20">
           <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 blur-[40px] rounded-full pointer-events-none"></div>
           <h2 className="font-mono text-primary tracking-[0.2em] text-[11px] font-black uppercase flex items-center gap-2 z-10">
            <Target size={16} /> Relatório de Batalha
          </h2>
          <button onClick={onClose} className="text-muted hover:text-red-500 transition-colors z-10 p-1">
            <X size={24} />
          </button>
        </div>

        {/* MIOLO ROLÁVEL */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          
          {/* Mensagem e Barra de XP */}
          <div className="bg-black/30 border border-border/50 p-4 rounded-xl">
            <p className="text-sm text-white/80 font-medium text-center mb-5 leading-relaxed">
              {uiBattleMessage}
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[11px] font-black text-secondary uppercase tracking-widest">Nível {currentLevel}</span>
                <span className="text-[10px] text-muted font-mono uppercase text-right">
                  Faltam <span className="text-primary font-bold">{xpRemaining} XP</span> para o próximo nível
                </span>
              </div>
              <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-border">
                <div 
                  className="h-full bg-secondary transition-all duration-1000" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Calendário */}
          <div className="flex justify-between px-1">
            {weekDays.map((dayLabel, index) => {
              const isToday = index === currentDayIndex;
              const isCompleted = history.some(entry => entry.date === currentWeekDates[index]);
              return (
                <div key={index} className="flex flex-col items-center gap-1.5">
                  <span className={`text-[10px] font-mono ${isCompleted ? 'text-primary' : isToday ? 'text-secondary' : 'text-muted'}`}>{dayLabel}</span>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${isCompleted ? 'bg-primary/10 border-primary/50' : isToday ? 'bg-secondary/20 border-secondary' : 'bg-input/50 border-border'}`}>
                    {isCompleted && <Check size={18} className="text-primary" strokeWidth={3} />}
                    {(isToday && !isCompleted) && <div className="w-2.5 h-2.5 bg-secondary rounded-full animate-pulse"></div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="flex justify-between border-y border-border/50 py-5">
            <div className="text-center flex-1">
              <p className="text-[10px] text-muted font-mono mb-1"><Clock size={12} className="inline mb-0.5"/> DURAÇÃO</p>
              <p className="text-xl font-black text-white">{sessionDuration}</p>
            </div>
            <div className="w-px bg-border"></div>
            <div className="text-center flex-1">
              <p className="text-[10px] text-muted font-mono mb-1"><Zap size={12} className="inline mb-0.5"/> VOLUME</p>
              <p className="text-xl font-black text-white">{sessionVolume}</p>
            </div>
            <div className="w-px bg-border"></div>
            <div className="text-center flex-1">
              <p className="text-[10px] text-muted font-mono mb-1">SOLO XP</p>
              <p className="text-xl font-black text-primary">{sessionPoints}</p>
            </div>
          </div>
        </div>

        {/* RODAPÉ FIXO DE AÇÕES */}
        <div className="p-6 border-t border-border/50 shrink-0 bg-card space-y-4">
          
          {!generatedImage ? (
            <>
              {/* 🔥 SELETOR DE ESTILO DO CARD */}
              <div className="flex bg-black/50 p-1 rounded-xl border border-border/50">
                <button 
                  onClick={() => setCardVariant('rpg')}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${cardVariant === 'rpg' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted hover:text-white'}`}
                >
                  <Skull size={14} /> Modo Batalha
                </button>
                <button 
                  onClick={() => setCardVariant('data')}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${cardVariant === 'data' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-muted hover:text-white'}`}
                >
                  <Activity size={14} /> Modo Dados
                </button>
              </div>

              <div className="flex gap-3">
                <label className="flex-1 h-14 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-center gap-2 text-primary text-[11px] font-black uppercase cursor-pointer hover:bg-primary/20 transition-colors">
                  <Camera size={16} /> {selfieUrl ? "TROCAR FOTO" : "TIRAR SELFIE"}
                  <input type="file" accept="image/*" capture="user" className="hidden" onChange={handleSelfieCapture} />
                </label>
                <button onClick={generateShareCard} disabled={isGenerating} className="flex-1 h-14 bg-white text-black text-[11px] font-black uppercase rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-gray-200 transition-colors">
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <><Share2 size={16} /> GERAR CARD</>}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="w-full max-h-[180px] overflow-hidden border border-primary/50 rounded-xl bg-black">
                <img src={generatedImage} className="w-full h-full object-contain" />
              </div>
              
              {/* 🔥 DIVISÃO TÁTICA DOS BOTÕES */}
              <div className="flex gap-2">
                <button 
                  onClick={handleShareToSocials} 
                  className="flex-[2] h-14 bg-primary text-black text-[12px] font-black uppercase rounded-xl flex items-center justify-center gap-2 hover:bg-primary/80 transition-all shadow-[0_0_15px_rgba(var(--primary),0.4)] active:scale-95"
                >
                  <Share2 size={18} /> COMPARTILHAR
                </button>
                
                <button 
                  onClick={() => { const a = document.createElement('a'); a.href = generatedImage; a.download="SOLO_TREINO.png"; a.click(); }} 
                  className="flex-1 h-14 bg-card border border-border text-white text-[10px] font-black uppercase rounded-xl flex items-center justify-center gap-2 hover:bg-input transition-colors active:scale-95"
                >
                  <Download size={16} /> SALVAR
                </button>
              </div>
            </div>
          )}

          <button onClick={onClose} className="w-full bg-input hover:bg-input/80 py-4 rounded-xl font-black text-white uppercase text-xs tracking-[0.2em] border border-border active:scale-95 transition-all">
            RETORNAR À BASE
          </button>
        </div>

      </div>
    </div>
  );
};

export default WorkoutComplete;