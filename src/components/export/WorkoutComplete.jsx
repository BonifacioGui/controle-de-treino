import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Cloud,
  CloudOff,
  Crosshair,
  Download,
  Loader2,
  Share2,
  Swords,
  Trophy,
  X,
} from 'lucide-react';
import { toBlob } from 'html-to-image';
import ShareCard from './ShareCard';
import ShareCardControls from './ShareCardControls';
import {
  createShareCardFieldSelection,
  formatShareDuration,
  parseDurationSeconds,
  parseMetricNumber,
  waitForShareCardImages,
} from './ShareCardUtils';
import { getBossBattleReport } from '../../utils/bossModel';

const WorkoutComplete = ({
  onClose,
  sessionVolume = '0 kg',
  sessionDuration = '0 min',
  sessionPoints = '+0 XP',
  sessionPrs = 0,
  completedSets = 0,
  partial = false,
  syncStatus = 'synced',
  workoutTitle = 'Treino',
  bossEncounter = null,
  streak = null,
  totalXp = null,
  sessionDate = null,
  levelUp = false,
  newBadges = [],
  theme = 'dark',
}) => {
  const [showShareTools, setShowShareTools] = useState(false);
  const [selfieUrl, setSelfieUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [cardVariant, setCardVariant] = useState('solo');
  const [feedback, setFeedback] = useState('');
  const cardRef = useRef(null);
  const previousImageUrl = useRef(null);
  const earnedXp = parseMetricNumber(sessionPoints);
  const numericStreak = parseMetricNumber(streak);
  const shareAvailability = {
    hasVolume: parseMetricNumber(sessionVolume) !== null,
    hasDuration: parseDurationSeconds(sessionDuration) !== null,
    hasXp: earnedXp !== null,
    hasStreak: numericStreak !== null && numericStreak > 0,
    hasPr: Number(sessionPrs) > 0,
    hasBoss: bossEncounter?.defeated === true,
  };
  const [fieldSelection, setFieldSelection] = useState(() => createShareCardFieldSelection(shareAvailability));

  useEffect(() => {
    if (!showShareTools || !cardRef.current) return undefined;
    let cancelled = false;
    if (previousImageUrl.current) {
      URL.revokeObjectURL(previousImageUrl.current);
      previousImageUrl.current = null;
    }
    setGeneratedImage(null);
    setImageFile(null);
    setIsGenerating(true);
    const timer = window.setTimeout(async () => {
      try {
        await waitForShareCardImages(cardRef.current);
        if (cancelled) return;
        const blob = await toBlob(cardRef.current, {
          pixelRatio: 1,
          backgroundColor: '#050B14',
          skipFonts: true,
          filter: (node) => node.tagName === 'IMG' ? node.complete && node.naturalWidth > 0 : true,
        });
        if (!blob || cancelled) return;
        if (previousImageUrl.current) URL.revokeObjectURL(previousImageUrl.current);
        const url = URL.createObjectURL(blob);
        previousImageUrl.current = url;
        setImageFile(new File([blob], 'SOLO-TREINO.png', { type: 'image/png' }));
        setGeneratedImage(url);
      } catch {
        if (!cancelled) setFeedback('Não foi possível gerar o card agora. O treino continua salvo.');
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    }, 100);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [cardVariant, fieldSelection, selfieUrl, showShareTools]);

  useEffect(() => () => {
    if (previousImageUrl.current) URL.revokeObjectURL(previousImageUrl.current);
  }, []);

  const regenerateWith = (variant) => {
    if (variant === cardVariant) return;
    setIsGenerating(true);
    setCardVariant(variant);
  };

  const openShareTools = () => {
    setIsGenerating(true);
    setShowShareTools(true);
  };

  const updateFieldSelection = (nextSelection) => {
    setIsGenerating(true);
    setFieldSelection(nextSelection);
  };

  const handleSelfieCapture = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsGenerating(true);
    const reader = new FileReader();
    reader.onload = () => setSelfieUrl(reader.result);
    reader.onerror = () => {
      setIsGenerating(false);
      setFeedback('Não foi possível carregar esta foto. O card atual foi preservado.');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const clearSelfie = () => {
    setIsGenerating(true);
    setSelfieUrl(null);
  };

  const handleShare = async () => {
    if (!imageFile) return;
    if (navigator.canShare?.({ files: [imageFile] })) {
      try {
        await navigator.share({ title: 'Meu treino no SOLO', text: 'Treino concluído no SOLO.', files: [imageFile] });
      } catch (error) {
        if (error?.name !== 'AbortError') setFeedback('Não foi possível compartilhar. Você ainda pode baixar o card.');
      }
      return;
    }
    setFeedback('Compartilhamento direto indisponível neste navegador. Use “Baixar card”.');
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'SOLO-TREINO.png';
    link.click();
  };

  const savedInCloud = syncStatus === 'synced';
  const durationLabel = formatShareDuration(sessionDuration) || '—';

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="workout-summary-title" className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md">
      {showShareTools && (
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1080px', height: '1920px' }}>
          <ShareCard cardRef={cardRef} stats={{ volume: sessionVolume, duration: sessionDuration, prs: sessionPrs, sets: completedSets }} workoutTitle={workoutTitle} bossEncounter={bossEncounter} streak={numericStreak} xp={earnedXp} selfieUrl={selfieUrl} totalXp={totalXp} variant={cardVariant} fieldSelection={fieldSelection} sessionDate={sessionDate} levelUp={levelUp} newBadges={newBadges} />
        </div>
      )}

      <div className="workout-complete-panel max-h-[95dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-primary/40 bg-card shadow-2xl">
        <header className="flex items-start justify-between border-b border-border p-5">
          <div><CheckCircle2 className="mb-3 text-success drop-shadow-[0_0_12px_rgba(var(--success),0.45)]" size={42} /><p className="font-cyber text-xs font-black uppercase tracking-[0.2em] text-primary">{workoutTitle}</p><h2 id="workout-summary-title" className="mt-1 text-2xl font-black text-main">{partial ? 'Treino parcial salvo' : 'Treino concluído'}</h2><p className="mt-1 text-sm text-muted">Seu progresso já foi registrado.</p></div>
          <button type="button" onClick={onClose} aria-label="Fechar resumo" className="touch-target flex items-center justify-center rounded-xl text-muted hover:text-main"><X /></button>
        </header>

        <div className="p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-input p-3"><p className="text-xs font-bold text-muted">Duração</p><p className="mt-1 text-lg font-black text-main">{durationLabel}</p></div>
            <div className="rounded-xl border border-border bg-input p-3"><p className="text-xs font-bold text-muted">Séries</p><p className="mt-1 text-lg font-black text-main">{completedSets}</p></div>
            <div className="rounded-xl border border-border bg-input p-3"><p className="text-xs font-bold text-muted">Volume</p><p className="mt-1 text-lg font-black text-main">{sessionVolume}</p></div>
            <div className="rounded-xl border border-border bg-input p-3"><p className="text-xs font-bold text-muted">Recompensa</p><p className="mt-1 text-lg font-black text-primary">{sessionPoints}</p></div>
          </div>

          {(Number(sessionPrs) > 0 || (numericStreak ?? 0) > 0) && <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-border p-3 text-sm font-bold text-muted">
            {Number(sessionPrs) > 0 && <span className="flex items-center gap-2 text-gold"><Trophy aria-hidden="true" size={17} /> {sessionPrs} {sessionPrs === 1 ? 'novo PR de carga' : 'novos PRs de carga'}</span>}
            {(numericStreak ?? 0) > 0 && <span className="flex items-center gap-2">🔥 sequência: {numericStreak} {numericStreak === 1 ? 'dia' : 'dias'}</span>}
          </div>}

          {bossEncounter && (
            <div className={`mt-3 rounded-xl border p-4 ${bossEncounter.defeated ? 'border-success/40 bg-success/5' : 'border-secondary/40 bg-secondary/5'}`}>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-secondary">
                {theme === 'light' ? <Crosshair size={16} /> : <Swords size={16} />}
                {theme === 'light' ? 'Relatório tático' : 'Relatório de combate'}
              </p>
              <div className="mt-2 flex items-end justify-between gap-3"><p className="font-cyber text-lg font-black text-main">{bossEncounter.bossName}</p><p className="text-sm font-black text-main">{Math.round(bossEncounter.damage).toLocaleString('pt-BR')} / {Math.round(bossEncounter.maxHp).toLocaleString('pt-BR')}</p></div>
              <p className="mt-2 text-sm text-muted">{getBossBattleReport(bossEncounter, sessionPrs)}</p>
            </div>
          )}

          <div className={`mt-3 flex items-start gap-3 rounded-xl border p-3 text-sm ${savedInCloud ? 'border-success/40 bg-success/5' : 'border-warning/40 bg-warning/10'}`}>
            {savedInCloud ? <Cloud className="shrink-0 text-success" size={19} /> : <CloudOff className="shrink-0 text-warning" size={19} />}
            <div><p className="font-black text-main">{savedInCloud ? 'Sincronizado' : 'Salvo neste dispositivo'}</p>{!savedInCloud && <p className="mt-1 text-xs leading-relaxed text-muted">Aguardando sincronização. Você pode fechar esta tela com segurança.</p>}</div>
          </div>

          {!showShareTools ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={onClose} className="touch-target rounded-xl bg-primary font-black text-on-primary">Ver no histórico</button>
              <button type="button" onClick={openShareTools} className="touch-target inline-flex items-center justify-center gap-2 rounded-xl border border-primary font-black text-primary"><Share2 size={18} /> Compartilhar</button>
            </div>
          ) : (
            <section className="mt-6 space-y-3 border-t border-border pt-5">
              <div className="flex rounded-xl border border-border bg-input p-1"><button type="button" aria-pressed={cardVariant === 'solo'} onClick={() => regenerateWith('solo')} className={`touch-target flex-1 rounded-lg text-sm font-bold ${cardVariant === 'solo' ? 'bg-primary/15 text-primary' : 'text-muted'}`}>SOLO</button><button type="button" aria-pressed={cardVariant === 'performance'} onClick={() => regenerateWith('performance')} className={`touch-target flex-1 rounded-lg text-sm font-bold ${cardVariant === 'performance' ? 'bg-primary/15 text-primary' : 'text-muted'}`}>PERFORMANCE</button></div>
              <ShareCardControls
                value={fieldSelection}
                onChange={updateFieldSelection}
                {...shareAvailability}
              />
              <div className="relative mx-auto aspect-[9/16] w-full max-w-[230px] overflow-hidden rounded-xl border border-primary/40 bg-black">
                {isGenerating && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60"><Loader2 className="animate-spin text-primary" /></div>}
                {generatedImage && <img src={generatedImage} alt="Prévia do card do treino" className="h-full w-full object-contain" />}
              </div>
              <div className="grid grid-cols-[auto_1fr_1fr] gap-2">
                <div className="flex gap-1">
                  <label aria-label={selfieUrl ? 'Trocar foto; modo foto ativo' : 'Adicionar foto'} className={`touch-target flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-xs font-black ${selfieUrl ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted'}`}><Camera size={19} /><span>{selfieUrl ? 'FOTO' : ''}</span><input type="file" accept="image/*" capture="user" className="sr-only" onChange={handleSelfieCapture} /></label>
                  {selfieUrl && <button type="button" onClick={clearSelfie} aria-label="Remover foto" className="touch-target flex items-center justify-center rounded-xl border border-border px-2 text-muted"><X size={17} /></button>}
                </div>
                <button type="button" onClick={handleShare} disabled={isGenerating || !generatedImage} className="touch-target inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-sm font-black text-on-primary disabled:opacity-40"><Share2 size={17} /> Compartilhar</button>
                <button type="button" onClick={handleDownload} disabled={isGenerating || !generatedImage} className="touch-target inline-flex items-center justify-center gap-2 rounded-xl border border-border text-sm font-black text-main disabled:opacity-40"><Download size={17} /> Baixar card</button>
              </div>
              <button type="button" onClick={onClose} className="touch-target w-full rounded-xl text-sm font-bold text-muted">Concluir sem compartilhar</button>
            </section>
          )}

          {feedback && <p role="status" className="mt-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-muted">{feedback}</p>}
        </div>
      </div>
    </div>
  );
};

export default WorkoutComplete;
