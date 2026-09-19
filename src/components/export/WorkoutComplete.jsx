import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  Cloud,
  CloudOff,
  Download,
  Loader2,
  Settings2,
  Share2,
  Skull,
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

const SessionMetric = ({ label, value, accent = false }) => (
  <div className="min-w-0 py-1 text-center">
    <p className="text-[10px] font-black uppercase tracking-[0.13em] text-muted">{label}</p>
    <p className={`mt-1 truncate text-sm font-black sm:text-base ${accent ? 'text-primary' : 'text-main'}`}>{value}</p>
  </div>
);

const WorkoutHighlights = ({ prs, streak, bossEncounter }) => {
  const bossDefeated = bossEncounter?.defeated === true;
  if (prs <= 0 && streak <= 0 && !bossDefeated) return null;

  return (
    <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs font-black">
      {prs > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-2 text-gold"><Trophy aria-hidden="true" size={14} /> {prs} {prs === 1 ? 'novo PR' : 'novos PRs'}</span>}
      {streak > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-2 text-orange-500">🔥 {streak} {streak === 1 ? 'dia' : 'dias'} em sequência</span>}
      {bossDefeated && <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-2 text-secondary"><Skull aria-hidden="true" size={14} /> Boss derrotado: {bossEncounter.bossName}</span>}
    </div>
  );
};

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
}) => {
  const [selfieUrl, setSelfieUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [cardVariant, setCardVariant] = useState('solo');
  const [customizerOpen, setCustomizerOpen] = useState(false);
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
    if (!cardRef.current) return undefined;
    let cancelled = false;
    if (previousImageUrl.current) {
      URL.revokeObjectURL(previousImageUrl.current);
      previousImageUrl.current = null;
    }
    setGeneratedImage(null);
    setImageFile(null);
    setIsGenerating(true);
    setFeedback('');
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
  }, [cardVariant, fieldSelection, selfieUrl]);

  useEffect(() => () => {
    if (previousImageUrl.current) URL.revokeObjectURL(previousImageUrl.current);
  }, []);

  const regenerateWith = (variant) => {
    if (variant === cardVariant) return;
    setIsGenerating(true);
    setCardVariant(variant);
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
    <div role="dialog" aria-modal="true" aria-labelledby="workout-summary-title" className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-2 backdrop-blur-md sm:p-4">
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1080px', height: '1920px' }}>
        <ShareCard cardRef={cardRef} stats={{ volume: sessionVolume, duration: sessionDuration, prs: sessionPrs, sets: completedSets }} workoutTitle={workoutTitle} bossEncounter={bossEncounter} streak={numericStreak} xp={earnedXp} selfieUrl={selfieUrl} totalXp={totalXp} variant={cardVariant} fieldSelection={fieldSelection} sessionDate={sessionDate} levelUp={levelUp} newBadges={newBadges} />
      </div>

      <div className="workout-complete-panel max-h-[97dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-primary/35 bg-card shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-start gap-3">
            <CheckCircle2 className="mt-0.5 shrink-0 text-success drop-shadow-[0_0_10px_rgba(var(--success),0.4)]" size={31} />
            <div className="min-w-0">
              <p className="truncate font-cyber text-[11px] font-black uppercase tracking-[0.17em] text-primary">{workoutTitle}</p>
              <h2 id="workout-summary-title" className="mt-0.5 text-xl font-black text-main">{partial ? 'Treino parcial salvo' : 'Treino concluído'}</h2>
              <p className="mt-0.5 text-xs text-muted">Seu progresso já foi registrado. Agora compartilhe seu resultado.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar resumo" className="touch-target flex shrink-0 items-center justify-center rounded-xl text-muted hover:text-main"><X /></button>
        </header>

        <div className="px-4 pb-5 pt-4 sm:px-5">
          <section aria-label="Resumo da sessão" className="grid grid-cols-4 divide-x divide-border rounded-xl bg-input/55 px-2 py-2">
            <SessionMetric label="Duração" value={durationLabel} />
            <SessionMetric label="Séries" value={completedSets} />
            <SessionMetric label="Volume" value={sessionVolume} />
            <SessionMetric label="XP" value={sessionPoints} accent />
          </section>

          <WorkoutHighlights prs={Number(sessionPrs) || 0} streak={numericStreak || 0} bossEncounter={bossEncounter} />

          <section aria-label="Prévia do Share Card" className="mt-4">
            <div className="relative mx-auto aspect-[9/16] w-full max-w-[330px] overflow-hidden rounded-2xl border border-primary/40 bg-black shadow-[0_18px_50px_rgba(0,0,0,0.4)]">
              {isGenerating && <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/65"><Loader2 className="animate-spin text-primary" /><span className="text-xs font-bold text-white/70">Atualizando card</span></div>}
              {generatedImage && <img src={generatedImage} alt="Prévia do card do treino" className="h-full w-full object-contain" />}
            </div>
          </section>

          <section aria-label="Formato do Share Card" className="mx-auto mt-4 max-w-[420px] space-y-3">
            <div className="flex rounded-xl border border-border bg-input p-1">
              <button type="button" aria-pressed={cardVariant === 'solo'} onClick={() => regenerateWith('solo')} className={`touch-target flex-1 rounded-lg text-sm font-black ${cardVariant === 'solo' ? 'bg-primary/15 text-primary' : 'text-muted'}`}>SOLO</button>
              <button type="button" aria-pressed={cardVariant === 'performance'} onClick={() => regenerateWith('performance')} className={`touch-target flex-1 rounded-lg text-sm font-black ${cardVariant === 'performance' ? 'bg-primary/15 text-primary' : 'text-muted'}`}>PERFORMANCE</button>
            </div>

            <div className="flex items-center justify-center gap-2">
              <label aria-label={selfieUrl ? 'Trocar foto; modo foto ativo' : 'Adicionar foto'} className={`touch-target inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 text-xs font-black ${selfieUrl ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted'}`}><Camera size={17} /> {selfieUrl ? 'FOTO ATIVA' : 'Usar foto'}<input type="file" accept="image/*" capture="user" className="sr-only" onChange={handleSelfieCapture} /></label>
              {selfieUrl && <button type="button" onClick={clearSelfie} aria-label="Remover foto" className="touch-target flex items-center justify-center rounded-xl border border-border px-3 text-muted"><X size={17} /></button>}
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              <button type="button" onClick={() => setCustomizerOpen((value) => !value)} aria-expanded={customizerOpen} className="touch-target flex w-full items-center gap-2 px-4 text-left text-sm font-black text-main">
                <Settings2 aria-hidden="true" size={17} className="text-primary" />
                <span className="flex-1">Personalizar card</span>
                <ChevronDown aria-hidden="true" size={18} className={`text-muted transition-transform ${customizerOpen ? 'rotate-180' : ''}`} />
              </button>
              {customizerOpen && <div className="border-t border-border px-3 py-3">
                <ShareCardControls value={fieldSelection} onChange={updateFieldSelection} embedded {...shareAvailability} />
              </div>}
            </div>
          </section>

          <div className={`mx-auto mt-4 flex max-w-[420px] items-center justify-center gap-2 text-xs ${savedInCloud ? 'text-muted' : 'text-warning'}`}>
            {savedInCloud ? <Cloud aria-hidden="true" size={14} className="text-success" /> : <CloudOff aria-hidden="true" size={14} />}
            <span>{savedInCloud ? 'Treino sincronizado' : 'Salvo neste dispositivo · aguardando sincronização'}</span>
          </div>

          <div className="mx-auto mt-4 grid max-w-[420px] grid-cols-2 gap-2">
            <button type="button" onClick={handleShare} disabled={isGenerating || !generatedImage} className="touch-target inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-sm font-black text-on-primary disabled:opacity-40"><Share2 size={17} /> Compartilhar</button>
            <button type="button" onClick={handleDownload} disabled={isGenerating || !generatedImage} className="touch-target inline-flex items-center justify-center gap-2 rounded-xl border border-border text-sm font-black text-main disabled:opacity-40"><Download size={17} /> Baixar card</button>
          </div>
          <button type="button" onClick={onClose} className="touch-target mx-auto mt-2 block w-full max-w-[420px] rounded-xl text-sm font-bold text-muted">Concluir sem compartilhar</button>

          {feedback && <p role="status" className="mx-auto mt-3 max-w-[420px] rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-muted">{feedback}</p>}
        </div>
      </div>
    </div>
  );
};

export default WorkoutComplete;
