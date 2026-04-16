import React, { useState, useEffect } from 'react';
import { Terminal, Cpu, Check, AlertTriangle, Loader2, Trash2, RefreshCw, ArrowLeft, Send } from 'lucide-react';
import { parseWorkoutWithAI } from '../services/aiService';

const steps = [
  "Analisando protocolos...",
  "Decodificando fibras musculares...",
  "Injetando lógica de hipertrofia...",
  "Finalizando extração neural..."
];

const Importer = ({ setWorkoutData, setView }) => {
  const [rawText, setRawText] = useState('');
  const [parsedPreview, setParsedPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [autoFix, setAutoFix] = useState(true);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isProcessing) return;
    const i = setInterval(() => {
      setStep(s => (s < steps.length - 1 ? s + 1 : s));
    }, 1000);
    return () => clearInterval(i);
  }, [isProcessing]);

  const handleProcess = async () => {
    if (!rawText.trim()) return;
    setIsProcessing(true);
    setError(null);
    setStep(0);

    try {
      const result = await parseWorkoutWithAI(rawText, null, autoFix);
      setParsedPreview(result);
    } catch (err) {
      setError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateExercise = (day, i, field, value) => {
    const updated = { ...parsedPreview };
    updated[day].exercises[i][field] = value;
    setParsedPreview(updated);
  };

  const confirm = () => {
    setWorkoutData(prev => ({ ...prev, ...parsedPreview }));
    setView('workout');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER DO SCANNER */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg border border-primary/50">
            <Cpu className="text-primary animate-pulse" size={24}/>
          </div>
          <div>
            <h2 className="text-xl font-black text-main dark:text-white uppercase tracking-tighter">Scanner Neural</h2>
            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Extração de dados via IA</p>
          </div>
        </div>
        <button onClick={() => setView('workout')} className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted">
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* ÁREA DE INPUT/PROCESSAMENTO */}
      {!parsedPreview && !isProcessing && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Cole aqui seu treino (ex: Supino 3x10, Agachamento 4x12...)"
              className="relative w-full h-64 p-6 bg-card border-2 border-border rounded-2xl text-main dark:text-white outline-none focus:border-primary transition-all font-mono text-sm leading-relaxed"
            />
          </div>

          <button 
            onClick={handleProcess} 
            disabled={!rawText.trim()}
            className="w-full bg-primary text-black font-black p-5 rounded-2xl shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 uppercase tracking-widest"
          >
            <Terminal size={20} /> Iniciar Extração
          </button>
        </div>
      )}

      {/* LOADING STATE CYBER */}
      {isProcessing && (
        <div className="flex flex-col items-center justify-center p-12 bg-card border-2 border-primary/30 rounded-3xl animate-pulse">
          <Loader2 className="animate-spin text-primary mb-6" size={48}/>
          <h3 className="text-primary font-black uppercase tracking-[0.2em] text-center">{steps[step]}</h3>
          <div className="w-48 h-1 bg-border/50 mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-progress"></div>
          </div>
        </div>
      )}

      {/* PREVIEW E EDIÇÃO */}
      {parsedPreview && (
        <div className="space-y-6 animate-in zoom-in-95 duration-300">
          <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl">
             <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest text-center italic">Revise os dados antes da injeção no sistema</p>
          </div>

          {Object.keys(parsedPreview).map(day => (
            <div key={day} className="bg-card border-2 border-border rounded-2xl overflow-hidden">
              <div className="bg-border/20 p-4 border-b border-border">
                <h3 className="font-black text-primary uppercase tracking-widest">{parsedPreview[day].title}</h3>
              </div>
              <div className="p-4 space-y-3">
                {parsedPreview[day].exercises.map((ex, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input 
                      value={ex.name} 
                      onChange={(e)=>updateExercise(day, i, 'name', e.target.value)} 
                      className="flex-[2] bg-input border border-border p-3 rounded-lg text-xs font-bold uppercase outline-none focus:border-primary"
                    />
                    <input 
                      value={ex.sets} 
                      onChange={(e)=>updateExercise(day, i, 'sets', e.target.value)} 
                      className="flex-1 bg-input border border-border p-3 rounded-lg text-xs font-black text-center outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-3">
            <button onClick={() => setParsedPreview(null)} className="flex-1 bg-input border-2 border-border text-muted font-black p-4 rounded-2xl hover:bg-red-500/10 hover:text-red-500 transition-all flex items-center justify-center gap-2">
              <Trash2 size={18}/> REFAZER
            </button>
            <button onClick={confirm} className="flex-[2] bg-primary text-black font-black p-4 rounded-2xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
              <Check size={20}/> Confirmar Injeção
            </button>
          </div>
        </div>
      )}

      {/* ERROR HANDLER */}
      {error && (
        <div className="p-6 bg-red-500/10 border-2 border-red-500 rounded-2xl space-y-4 animate-in bounce-in">
          <div className="flex items-center gap-3 text-red-500">
            <AlertTriangle size={32} />
            <div>
              <h4 className="font-black uppercase tracking-tighter">Falha na Extração</h4>
              <p className="text-xs opacity-70 italic">{error.message}</p>
            </div>
          </div>
          <button onClick={handleProcess} className="w-full bg-red-500 text-white font-black p-3 rounded-xl flex items-center justify-center gap-2">
            <RefreshCw size={18} /> TENTAR RECONEXÃO
          </button>
        </div>
      )}
    </div>
  );
};

export default Importer;