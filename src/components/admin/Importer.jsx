import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  FileText,
  Loader2,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { parseWorkoutWithAI } from '../../services/aiService';
import { getImportConflicts, mergeImportedWorkoutPlan } from '../../utils/importUtils';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MIN_TEXT_LENGTH = 20;

const Importer = ({ setWorkoutData, setView, setActiveDay, existingWorkoutData = {} }) => {
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedPreview, setParsedPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [conflictStrategy, setConflictStrategy] = useState('');
  const fileInputRef = useRef(null);

  const conflicts = useMemo(() => parsedPreview
    ? getImportConflicts(existingWorkoutData, parsedPreview)
    : [], [existingWorkoutData, parsedPreview]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Escolha um arquivo PDF válido. Se sua ficha estiver em outro formato, cole o texto no campo abaixo.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('O PDF ultrapassa 2 MB. Comprima o arquivo ou cole o conteúdo como texto.');
      return;
    }
    setSelectedFile(file);
    setRawText('');
    setError('');
  };

  const handleProcess = async () => {
    if (!rawText.trim() && !selectedFile) return;
    if (!selectedFile && rawText.trim().length < MIN_TEXT_LENGTH) {
      setError('Cole uma ficha com pelo menos 20 caracteres, incluindo um exercício e sua meta de séries.');
      return;
    }
    setIsProcessing(true);
    setError('');
    try {
      const result = await parseWorkoutWithAI(rawText, selectedFile, false);
      setParsedPreview(result);
      setConflictStrategy('');
    } catch {
      setError('O serviço de importação não respondeu. Confira sua conexão e tente novamente; seu plano atual não foi alterado.');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateDay = (day, field, value) => {
    setParsedPreview((current) => ({ ...current, [day]: { ...current[day], [field]: value } }));
  };

  const updateExercise = (day, index, field, value) => {
    setParsedPreview((current) => ({
      ...current,
      [day]: {
        ...current[day],
        exercises: current[day].exercises.map((exercise, exerciseIndex) => (
          exerciseIndex === index ? { ...exercise, [field]: value } : exercise
        )),
      },
    }));
  };

  const removeExercise = (day, index) => {
    setParsedPreview((current) => ({
      ...current,
      [day]: { ...current[day], exercises: current[day].exercises.filter((_, exerciseIndex) => exerciseIndex !== index) },
    }));
  };

  const moveExercise = (day, index, direction) => {
    setParsedPreview((current) => {
      const exercises = [...current[day].exercises];
      const target = index + direction;
      if (target < 0 || target >= exercises.length) return current;
      [exercises[index], exercises[target]] = [exercises[target], exercises[index]];
      return { ...current, [day]: { ...current[day], exercises } };
    });
  };

  const moveDay = (day, direction) => {
    setParsedPreview((current) => {
      const entries = Object.entries(current);
      const index = entries.findIndex(([key]) => key === day);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= entries.length) return current;
      [entries[index], entries[target]] = [entries[target], entries[index]];
      return Object.fromEntries(entries);
    });
  };

  const confirm = () => {
    if (conflicts.length > 0 && !conflictStrategy) return;
    const { plan, firstImportedDay } = mergeImportedWorkoutPlan(
      existingWorkoutData,
      parsedPreview,
      conflictStrategy,
    );
    setWorkoutData(plan);
    setActiveDay?.(firstImportedDay);
    setView('workout');
  };

  const resetAll = () => {
    setParsedPreview(null);
    setRawText('');
    setSelectedFile(null);
    setError('');
    setConflictStrategy('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-1 pb-24">
      <header className="flex items-start justify-between border-b border-border pb-4">
        <div><h2 className="text-xl font-black text-main">Importar treino</h2><p className="mt-1 text-sm text-muted">Cole uma ficha ou envie um PDF para organizar os exercícios.</p></div>
        <button type="button" onClick={() => setView('workout')} aria-label="Voltar ao treino" className="touch-target flex items-center justify-center rounded-xl border border-border text-muted"><ArrowLeft size={21} /></button>
      </header>

      {!parsedPreview && (
        <>
          <section className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start gap-3"><ShieldCheck className="shrink-0 text-primary" size={22} /><div><h3 className="font-black text-main">Antes de enviar</h3><p className="mt-1 text-sm leading-relaxed text-muted">O texto ou PDF será enviado ao serviço de importação para identificar dias, exercícios e séries. O limite do PDF é 2 MB. Não inclua dados pessoais ou informações de saúde desnecessárias.</p></div></div>
          </section>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
            <input ref={fileInputRef} type="file" accept="application/pdf" className="sr-only" onChange={handleFileChange} />
            {selectedFile ? (
              <div className="flex items-center gap-3 rounded-xl border border-primary/50 bg-primary/5 p-4"><FileText className="text-primary" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-main">{selectedFile.name}</p><p className="mt-1 text-xs text-muted">{(selectedFile.size / 1024).toFixed(0)} KB • PDF</p></div><button type="button" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="touch-target rounded-xl px-3 text-sm font-bold text-red-500">Remover</button></div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="touch-target flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/50 text-primary"><Upload size={25} /><span className="text-sm font-black">Selecionar PDF</span><span className="text-xs font-normal text-muted">Máximo de 2 MB</span></button>
            )}
            <div className="flex items-center gap-3"><span className="h-px flex-1 bg-border" /><span className="text-xs font-bold text-muted">ou cole o texto</span><span className="h-px flex-1 bg-border" /></div>
            <label><span className="mb-2 block text-sm font-bold text-main">Texto da ficha</span><textarea value={rawText} onChange={(event) => { setRawText(event.target.value); if (event.target.value) setSelectedFile(null); setError(''); }} placeholder={'Exemplo:\nTreino A — Peito\nSupino reto — 3x10\nCrucifixo — 3x12'} className="min-h-44 w-full rounded-xl border border-border bg-input p-4 text-base leading-relaxed text-main outline-none focus-visible:ring-2 focus-visible:ring-primary" /><span className="mt-1 block text-right text-xs text-muted">Mínimo de {MIN_TEXT_LENGTH} caracteres</span></label>
            <button type="button" onClick={handleProcess} disabled={isProcessing || (!rawText.trim() && !selectedFile)} className="touch-target flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-primary text-base font-black text-black disabled:opacity-40">{isProcessing ? <><Loader2 className="animate-spin" /> Organizando sua ficha...</> : <><Pencil size={19} /> Gerar prévia</>}</button>
          </section>
        </>
      )}

      {parsedPreview && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4"><h3 className="font-black text-main">Revise antes de salvar</h3><p className="mt-1 text-sm leading-relaxed text-muted">A importação pode interpretar nomes ou séries incorretamente. Corrija os campos abaixo; nenhuma mudança foi aplicada ao plano ainda.</p></div>

          {Object.entries(parsedPreview).map(([day, workout]) => (
            <article key={day} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3"><p className="text-sm font-black text-primary">Identificador: {day}</p><div className="flex gap-1"><button type="button" onClick={() => moveDay(day, -1)} aria-label={`Mover ${day} para cima`} className="touch-target flex items-center justify-center rounded-xl text-muted hover:text-primary"><ArrowUp size={17} /></button><button type="button" onClick={() => moveDay(day, 1)} aria-label={`Mover ${day} para baixo`} className="touch-target flex items-center justify-center rounded-xl text-muted hover:text-primary"><ArrowDown size={17} /></button></div></div>
              <div className="grid gap-3 border-b border-border bg-input/30 p-4 sm:grid-cols-2">
                <label><span className="mb-1 block text-xs font-bold text-muted">Nome do treino</span><input value={workout.title || ''} onChange={(event) => updateDay(day, 'title', event.target.value)} className="h-11 w-full rounded-xl border border-border bg-input px-3 text-sm font-black text-main" /></label>
                <label><span className="mb-1 block text-xs font-bold text-muted">Foco</span><input value={workout.focus || ''} onChange={(event) => updateDay(day, 'focus', event.target.value)} placeholder="Geral" className="h-11 w-full rounded-xl border border-border bg-input px-3 text-sm font-bold text-main" /></label>
              </div>
              <div className="space-y-3 p-4">
                {workout.exercises.map((exercise, index) => {
                  const requiresReview = exercise.uncertain === true || !exercise.name?.trim() || !String(exercise.sets || '').trim();
                  return (
                    <div key={`${exercise.name}-${index}`} className={`rounded-xl ${requiresReview ? 'border border-warning/60 bg-warning/5 p-2' : ''}`}>
                      {requiresReview && <p className="mb-2 flex items-center gap-1 text-xs font-black text-warning"><AlertTriangle size={14} /> Revisar este item</p>}
                      <div className="grid grid-cols-[1fr_5.5rem_2.75rem] gap-2">
                        <input aria-label={`Nome do exercício ${index + 1}`} value={exercise.name || ''} onChange={(event) => updateExercise(day, index, 'name', event.target.value)} className="h-11 min-w-0 rounded-xl border border-border bg-input px-3 text-sm font-bold text-main" />
                        <input aria-label={`Séries do exercício ${index + 1}`} value={exercise.sets || ''} onChange={(event) => updateExercise(day, index, 'sets', event.target.value)} className="h-11 rounded-xl border border-border bg-input px-2 text-center text-sm font-black text-main" />
                        <button type="button" onClick={() => removeExercise(day, index)} aria-label={`Remover ${exercise.name}`} className="touch-target flex items-center justify-center rounded-xl border border-red-500/40 text-red-500"><Trash2 size={17} /></button>
                      </div>
                      <div className="mt-1 flex gap-1"><button type="button" onClick={() => moveExercise(day, index, -1)} aria-label={`Mover ${exercise.name || `exercício ${index + 1}`} para cima`} className="touch-target inline-flex items-center gap-1 rounded-xl px-2 text-xs font-bold text-muted hover:text-primary"><ArrowUp size={15} /> Subir</button><button type="button" onClick={() => moveExercise(day, index, 1)} aria-label={`Mover ${exercise.name || `exercício ${index + 1}`} para baixo`} className="touch-target inline-flex items-center gap-1 rounded-xl px-2 text-xs font-bold text-muted hover:text-primary"><ArrowDown size={15} /> Descer</button></div>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}

          {conflicts.length > 0 && (
            <fieldset className="rounded-2xl border border-warning/50 bg-warning/5 p-4"><legend className="px-1 font-black text-main">{conflicts.length === 1 ? 'Já existe um treino com este identificador' : 'Alguns treinos já existem'}</legend><p className="mt-1 text-sm text-muted">Conflitos: {conflicts.join(', ')}. Escolha como aplicar a importação.</p><div className="mt-4 space-y-2"><label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border px-3 text-sm text-main"><input type="radio" name="conflict" checked={conflictStrategy === 'keep'} onChange={() => setConflictStrategy('keep')} /> Manter os atuais e adicionar os importados com outro nome</label><label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border px-3 text-sm text-main"><input type="radio" name="conflict" checked={conflictStrategy === 'replace'} onChange={() => setConflictStrategy('replace')} /> Substituir os treinos com o mesmo identificador</label></div></fieldset>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={resetAll} className="touch-target inline-flex items-center justify-center gap-2 rounded-xl border border-border font-bold text-main"><Trash2 size={17} /> Cancelar</button>
            <button type="button" onClick={() => setParsedPreview(null)} className="touch-target inline-flex items-center justify-center gap-2 rounded-xl border border-primary font-bold text-primary"><RefreshCw size={17} /> Reprocessar</button>
            <button type="button" onClick={confirm} disabled={conflicts.length > 0 && !conflictStrategy} className="touch-target inline-flex items-center justify-center gap-2 rounded-xl bg-primary font-black text-black disabled:opacity-40"><Check size={19} /> Salvar no plano</button>
          </div>
        </section>
      )}

      {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-500/50 bg-red-500/10 p-4"><AlertTriangle className="shrink-0 text-red-500" /><div><p className="font-black text-main">Não foi possível importar</p><p className="mt-1 text-sm leading-relaxed text-muted">{error}</p></div></div>}
    </main>
  );
};

export default Importer;
