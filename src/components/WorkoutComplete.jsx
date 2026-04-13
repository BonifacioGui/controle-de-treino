import React, { useState, useRef, useEffect } from 'react';
import { Camera, Download, Loader2, Share2, Target, X, Activity, Skull } from 'lucide-react';
import { toBlob } from 'html-to-image';
import ShareCard from './ShareCard'; 

const WorkoutComplete = ({ 
  onClose, 
  sessionVolume = "0", 
  sessionDuration = "0", 
  sessionPoints = "+0",
  bossName = "ALVO",
  bossHp = 10000, 
  streak = 0,
  currentLevel = 1,
  xpRemaining = 0, 
  progressPercent = 0 
}) => {
  const [selfieUrl, setSelfieUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(true); // Começa gerando
  const [generatedImage, setGeneratedImage] = useState(null);
  const [cardVariant, setCardVariant] = useState('rpg'); 
  const [imageFile, setImageFile] = useState(null); 

  const cardRef = useRef(null);

  // 🔥 Geração inicial e atualização ao trocar de modo ou tirar selfie
  useEffect(() => {
    generateShareCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardVariant, selfieUrl]); 

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
      // Dá um tempo maior para o React renderizar o componente invisível
      await new Promise(r => setTimeout(r, 100)); 
      
      const blob = await toBlob(cardRef.current, { 
        pixelRatio: 1, 
        backgroundColor: '#050B14',
        filter: (node) => node.tagName === 'IMG' ? node.complete : true
      });
      
      const file = new File([blob], 'SOLO_RELATORIO.png', { type: 'image/png' });
      setImageFile(file); 
      setGeneratedImage(URL.createObjectURL(blob));
      
    } catch (err) {
      console.error("Falha ao gerar prévia:", err);
      // fallback gracioso se falhar
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareToSocials = async () => {
    if (navigator.share && navigator.canShare && imageFile) {
      try {
        await navigator.share({
          title: 'Relatório Tático SOLO',
          text: 'Missão cumprida no sistema SOLO. Acompanhe meu progresso.',
          files: [imageFile] 
        });
      } catch (err) {
        console.log("Compartilhamento cancelado.", err);
      }
    } else {
      alert("Comando: Seu dispositivo não suporta compartilhamento direto. Salve a imagem na galeria.");
    }
  };

  const earnedXp = parseInt(sessionPoints.replace(/\D/g, '')) || 0;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      
      {/* CARD INVISÍVEL (Apenas para o toBlob capturar a arte final) */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <ShareCard 
          cardRef={cardRef} stats={{ volume: sessionVolume, duration: sessionDuration, prs: 0 }} 
          bossName={bossName} bossHp={bossHp} streak={streak} xp={earnedXp} selfieUrl={selfieUrl}
          currentLevel={currentLevel} progressPercent={progressPercent} xpRemaining={xpRemaining}
          variant={cardVariant} 
        />
      </div>

      {/* CAIXA PRINCIPAL DO MODAL */}
      <div className="w-full max-w-[450px] bg-card border border-border rounded-3xl flex flex-col shadow-2xl overflow-hidden max-h-[95vh] h-full">
        
        {/* CABEÇALHO */}
        <div className="p-4 border-b border-border/50 shrink-0 flex justify-between items-center relative overflow-hidden bg-black/20">
           <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 blur-[40px] rounded-full pointer-events-none"></div>
           <h2 className="font-mono text-primary tracking-[0.2em] text-[11px] font-black uppercase flex items-center gap-2 z-10">
            <Target size={16} /> Exportação Tática
          </h2>
          <button onClick={onClose} className="text-muted hover:text-red-500 transition-colors z-10 p-1">
            <X size={24} />
          </button>
        </div>

        {/* MIOLO (PREVIEW AO VIVO) */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center bg-black/40 relative">
          
          {isGenerating && (
             <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
               <Loader2 size={32} className="animate-spin text-primary" />
               <p className="text-primary font-mono text-[10px] uppercase tracking-widest">Processando Imagem...</p>
             </div>
          )}

          {/* Área de Visualização da Imagem (Proporção 9:16 - Stories) */}
          <div className="w-full max-w-[280px] aspect-[9/16] rounded-xl overflow-hidden border border-border/50 shadow-lg relative bg-black">
             {generatedImage ? (
                <img src={generatedImage} alt="Preview do Card" className="w-full h-full object-cover" />
             ) : null}
          </div>
        </div>

        {/* CONTROLES E AÇÕES (RODAPÉ FIXO) */}
        <div className="p-5 border-t border-border/50 shrink-0 bg-card space-y-4">
          
          {/* SELETOR DE MODO */}
          <div className="flex bg-black/50 p-1 rounded-xl border border-border/50">
            <button 
              onClick={() => setCardVariant('rpg')}
              className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${cardVariant === 'rpg' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted hover:text-white'}`}
            >
              <Skull size={14} /> Modo Batalha
            </button>
            <button 
              onClick={() => setCardVariant('data')}
              className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${cardVariant === 'data' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-muted hover:text-white'}`}
            >
              <Activity size={14} /> Modo Dados
            </button>
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="flex gap-2">
            
            {/* Botão de Selfie Menor e Mais Discreto */}
            <label className="w-12 h-14 bg-card border border-border rounded-xl flex items-center justify-center text-muted hover:text-white hover:border-white/30 cursor-pointer transition-colors shrink-0">
              <Camera size={20} />
              <input type="file" accept="image/*" capture="user" className="hidden" onChange={handleSelfieCapture} />
            </label>

            {/* Compartilhar Principal */}
            <button 
              onClick={handleShareToSocials} 
              disabled={isGenerating || !generatedImage}
              className="flex-1 h-14 bg-primary text-black text-[12px] font-black uppercase rounded-xl flex items-center justify-center gap-2 hover:bg-primary/80 transition-all shadow-[0_0_15px_rgba(var(--primary),0.4)] active:scale-95 disabled:opacity-50"
            >
              <Share2 size={18} /> COMPARTILHAR
            </button>
            
            {/* Download Secundário */}
            <button 
              onClick={() => { const a = document.createElement('a'); a.href = generatedImage; a.download="SOLO_TREINO.png"; a.click(); }} 
              disabled={isGenerating || !generatedImage}
              className="w-14 h-14 bg-card border border-border text-white text-[10px] font-black uppercase rounded-xl flex items-center justify-center gap-2 hover:bg-input transition-colors active:scale-95 disabled:opacity-50 shrink-0"
            >
              <Download size={20} />
            </button>
          </div>

          <button onClick={onClose} className="w-full bg-transparent text-muted hover:text-white py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all">
            Dispensar e Voltar à Base
          </button>
        </div>

      </div>
    </div>
  );
};

export default WorkoutComplete;