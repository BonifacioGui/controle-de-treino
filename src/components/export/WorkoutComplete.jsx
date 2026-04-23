import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Download, Loader2, Share2, Target, X, Activity, Skull } from 'lucide-react';
import { toBlob } from 'html-to-image';
import ShareCard from './ShareCard';

const WorkoutComplete = ({ 
  onClose, 
  sessionVolume   = "0",
  sessionDuration = "0",
  sessionPoints   = "+0",
  sessionPrs      = 0,      // PRs da sessão — antes hardcoded como 0
  bossName        = "ALVO",
  bossHp          = 10000, 
  streak          = 0,
  currentLevel    = 1,
  totalXp         = 0,      // Renomeado de xpRemaining/progressPercent para bater com ShareCard
}) => {
  const [selfieUrl,      setSelfieUrl]      = useState(null);
  const [isGenerating,   setIsGenerating]   = useState(true);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [imageFile,      setImageFile]      = useState(null);
  const [cardVariant,    setCardVariant]    = useState('rpg');

  const cardRef        = useRef(null);
  const prevImageUrl   = useRef(null); // Rastreia URL anterior para revoke

  const earnedXp = parseInt(sessionPoints.replace(/\D/g, ''), 10) || 0;

  // ─── Geração do card ────────────────────────────────────────────────────────

  const generateShareCard = useCallback(async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 100));

      const blob = await toBlob(cardRef.current, {
        pixelRatio: 1,
        backgroundColor: '#050B14',
        skipFonts: true,
        filter: (node) => node.tagName === 'IMG' ? node.complete : true,
      });

      // Revoga a URL anterior antes de criar uma nova — evita vazamento de memória
      if (prevImageUrl.current) {
        URL.revokeObjectURL(prevImageUrl.current);
      }

      const newUrl = URL.createObjectURL(blob);
      prevImageUrl.current = newUrl;

      setImageFile(new File([blob], 'SOLO_RELATORIO.png', { type: 'image/png' }));
      setGeneratedImage(newUrl);

    } catch (err) {
      console.error('Falha ao gerar prévia:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [cardVariant, selfieUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    generateShareCard();
  }, [generateShareCard]);

  // Revoga a URL ao desmontar o componente
  useEffect(() => {
    return () => {
      if (prevImageUrl.current) URL.revokeObjectURL(prevImageUrl.current);
    };
  }, []);

  // ─── Selfie ─────────────────────────────────────────────────────────────────

  const handleSelfieCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsGenerating(true);

    const img   = new Image();
    const objUrl = URL.createObjectURL(file);

    img.onload = () => {
      const MAX_WIDTH = 1080;
      let { width, height } = img;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width  = MAX_WIDTH;
      }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      URL.revokeObjectURL(objUrl);
      setSelfieUrl(canvas.toDataURL('image/jpeg', 0.7));
    };

    img.src = objUrl;
  };

  // ─── Compartilhar ────────────────────────────────────────────────────────────

  const handleShareToSocials = async () => {
    if (navigator.share && navigator.canShare?.({ files: [imageFile] }) && imageFile) {
      try {
        await navigator.share({
          title: 'Relatório Tático SOLO',
          text:  'Missão cumprida no sistema SOLO. Acompanhe meu progresso.',
          files: [imageFile],
        });
      } catch (err) {
        // Usuário cancelou — não é erro crítico
        console.log('Compartilhamento cancelado.', err);
      }
    } else {
      alert('Seu dispositivo não suporta compartilhamento direto. Use o botão de download.');
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a   = document.createElement('a');
    a.href     = generatedImage;
    a.download = 'SOLO_TREINO.png';
    a.click();
  };

  // ─── Borda da preview muda com o modo ativo ──────────────────────────────────

  const previewBorderClass = cardVariant === 'rpg'
    ? 'border-primary/50'
    : 'border-cyan-500/50';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">

      {/* Container de captura — dimensões reais para html-to-image não distorcer */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1080px', height: '1920px' }}>
        <ShareCard
          cardRef={cardRef}
          stats={{ volume: sessionVolume, duration: sessionDuration, prs: sessionPrs }}
          bossName={bossName}
          bossHp={bossHp}
          streak={streak}
          xp={earnedXp}
          selfieUrl={selfieUrl}
          currentLevel={currentLevel}
          totalXp={totalXp}
          variant={cardVariant}
        />
      </div>

      {/* MODAL */}
      <div className="w-full max-w-[450px] bg-card border border-border rounded-3xl flex flex-col shadow-2xl overflow-hidden max-h-[95vh] h-full">

        {/* CABEÇALHO */}
        <div className="p-4 border-b border-border/50 shrink-0 flex justify-between items-center relative overflow-hidden bg-black/20">
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 blur-[40px] rounded-full pointer-events-none" />
          <h2 className="font-mono text-primary tracking-[0.2em] text-[11px] font-black uppercase flex items-center gap-2 z-10">
            <Target size={16} /> Exportação Tática
          </h2>
          <button onClick={onClose} className="text-muted hover:text-red-500 transition-colors z-10 p-1">
            <X size={24} />
          </button>
        </div>

        {/* PREVIEW */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center bg-black/40 relative min-h-0">

          {/*
            Overlay de loading leve — mantém a imagem anterior visível
            enquanto a nova está sendo gerada, em vez de sumir tudo.
          */}
          {isGenerating && (
            <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 pointer-events-none">
              <Loader2 size={28} className="animate-spin text-primary" />
              <p className="text-primary font-mono text-[10px] uppercase tracking-widest">Processando...</p>
            </div>
          )}

          {/* Borda muda de cor conforme o modo ativo */}
          <div className={`w-full max-w-[260px] aspect-[9/16] rounded-xl overflow-hidden border-2 shadow-lg bg-[#050B14] transition-colors duration-300 ${previewBorderClass}`}>
            {generatedImage && (
              <img
                src={generatedImage}
                alt="Preview do Card"
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </div>

        {/* RODAPÉ */}
        <div className="p-5 border-t border-border/50 shrink-0 bg-card space-y-4">

          {/* SELETOR DE MODO */}
          <div className="flex bg-black/50 p-1 rounded-xl border border-border/50">
            <button
              onClick={() => setCardVariant('rpg')}
              className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${
                cardVariant === 'rpg'
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-muted hover:text-white'
              }`}
            >
              <Skull size={14} /> Modo Batalha
            </button>
            <button
              onClick={() => setCardVariant('data')}
              className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${
                cardVariant === 'data'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-muted hover:text-white'
              }`}
            >
              <Activity size={14} /> Modo Dados
            </button>
          </div>

          {/* AÇÕES */}
          <div className="flex gap-2">
            <label className="w-12 h-14 bg-card border border-border rounded-xl flex items-center justify-center text-muted hover:text-white hover:border-white/30 cursor-pointer transition-colors shrink-0">
              <Camera size={20} />
              <input
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleSelfieCapture}
              />
            </label>

            <button
              onClick={handleShareToSocials}
              disabled={isGenerating || !generatedImage}
              className="flex-1 h-14 bg-primary text-black text-[12px] font-black uppercase rounded-xl flex items-center justify-center gap-2 hover:bg-primary/80 transition-all shadow-[0_0_15px_rgba(var(--primary),0.4)] active:scale-95 disabled:opacity-50"
            >
              <Share2 size={18} /> COMPARTILHAR
            </button>

            <button
              onClick={handleDownload}
              disabled={isGenerating || !generatedImage}
              className="w-14 h-14 bg-card border border-border text-white rounded-xl flex items-center justify-center hover:bg-input transition-colors active:scale-95 disabled:opacity-50 shrink-0"
            >
              <Download size={20} />
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-transparent text-muted hover:text-white py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all"
          >
            Dispensar e Voltar à Base
          </button>
        </div>

      </div>
    </div>
  );
};

export default WorkoutComplete;
