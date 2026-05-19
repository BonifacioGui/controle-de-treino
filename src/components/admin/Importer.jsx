import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, Check, AlertTriangle, Loader2, Trash2, RefreshCw, ArrowLeft, FileText, Upload } from 'lucide-react';
import { parseWorkoutWithAI } from '../../services/aiService';

const steps = [
  "Analisando dados brutos...",
  "Decodificando vetores de força...",
  "Injetando parâmetros de hipertrofia...",
  "Finalizando extração neural..."
];

// Adicione o setActiveDay aqui nos parâmetros
const Importer = ({ setWorkoutData, setView, setActiveDay }) => {
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null); // 🔥 ESTADO NOVO PARA O PDF
  const [parsedPreview, setParsedPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(0);

  const fileInputRef = useRef(null); // 🔥 REF PARA O INPUT ESCONDIDO

  useEffect(() => {
    if (!isProcessing) return;
    const i = setInterval(() => {
      setStep(s => (s < steps.length - 1 ? s + 1 : s));
    }, 1000);
    return () => clearInterval(i);
  }, [isProcessing]);

  // 🔥 Lida com a seleção do arquivo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setRawText(''); // Limpa o texto se subir um PDF
      setError(null);
    } else {
      setError(new Error("Formato inválido. Apenas documentos PDF são suportados na base neural."));
    }
  };

  const handleProcess = async () => {
    if (!rawText.trim() && !selectedFile) return;
    setIsProcessing(true);
    setError(null);
    setStep(0);

    try {
      // 🔥 AGORA ENVIA O ARQUIVO PARA O SEU SERVIÇO DE IA
      const result = await parseWorkoutWithAI(rawText, selectedFile, true);
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
    setWorkoutData(prev => {
      const newData = { ...prev, ...parsedPreview };
      
      // 🔥 TÁTICO: Aniquila o protocolo "INÍCIO" assim que dados reais entram no sistema
      if (newData['INÍCIO']) {
        delete newData['INÍCIO'];
      }
      
      return newData;
    });

    if (setActiveDay && parsedPreview) {
      setActiveDay(Object.keys(parsedPreview)[0]);
    }

    setView('workout');
  };

  const resetAll = () => {
    setParsedPreview(null);
    setRawText('');
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 px-4">
      
      {/* HEADER DO SCANNER */}
      <div className="flex items-center justify-between mb-2 mt-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg border border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
            <Cpu className="text-primary animate-pulse" size={24}/>
          </div>
          <div>
            <h2 className="text-xl font-black text-main dark:text-white uppercase tracking-tighter">Scanner Neural</h2>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Extração de Dados via IA</p>
          </div>
        </div>
        <button onClick={() => setView('workout')} className="p-2 bg-input/50 border border-border hover:border-primary/50 hover:bg-input rounded-xl transition-all text-muted hover:text-primary">
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* ÁREA DE INPUT/PROCESSAMENTO */}
      {!parsedPreview && !isProcessing && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
          
          {/* 🔥 BOTÃO DE UPLOAD DE PDF */}
          <div className="w-full">
            <input 
              type="file" 
              accept="application/pdf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            
            {selectedFile ? (
              <div className="bg-primary/10 border-2 border-primary border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
                <FileText size={40} className="text-primary" />
                <div>
                  <h3 className="font-black uppercase text-primary text-sm tracking-widest">Arquivo Carregado</h3>
                  <p className="text-xs text-main dark:text-white font-bold opacity-80 mt-1">{selectedFile.name}</p>
                </div>
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="mt-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 border border-red-500/30 px-3 py-1 rounded-full bg-red-500/10 z-10"
                >
                  Remover Arquivo
                </button>
              </div>
            ) : (
              <button 
                onClick={() => fileInputRef.current.click()}
                className="w-full bg-card hover:bg-input border-2 border-dashed border-primary/50 hover:border-primary text-primary font-black p-6 rounded-2xl transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <div className="p-3 bg-primary/10 rounded-full group-hover:scale-110 transition-transform duration-300">
                  <Upload size={28} />
                </div>
                <span className="uppercase tracking-widest text-xs mt-2">Carregar PDF do Treino</span>
                <span className="text-[9px] text-muted normal-case font-bold opacity-70">A IA lerá o documento automaticamente</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 py-2">
            <div className="h-[1px] flex-1 bg-border"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">OU MODO MANUAL</span>
            <div className="h-[1px] flex-1 bg-border"></div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-10 group-focus-within:opacity-30 transition duration-500"></div>
            <textarea
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                if(selectedFile) setSelectedFile(null); // Limpa o arquivo se digitar
              }}
              placeholder="Cole aqui o texto do seu treino (ex: Supino 3x10, Agachamento 4x12...)"
              className="relative w-full h-40 p-5 bg-card border-2 border-border rounded-2xl text-main dark:text-white outline-none focus:border-primary transition-all text-sm leading-relaxed placeholder-muted/50"
            />
          </div>

          <button 
            onClick={handleProcess} 
            disabled={!rawText.trim() && !selectedFile}
            className="w-full bg-primary text-black font-black p-5 rounded-2xl shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale uppercase tracking-widest mt-6"
          >
            <Terminal size={20} /> Iniciar Extração Neural
          </button>
        </div>
      )}

      {/* LOADING STATE CYBER */}
      {isProcessing && (
        <div className="flex flex-col items-center justify-center p-12 bg-card border-2 border-primary/30 rounded-3xl relative overflow-hidden h-80">
          <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
          <Loader2 className="animate-[spin_2s_linear_infinite] text-primary mb-6" size={56}/>
          <h3 className="text-primary font-black uppercase tracking-[0.2em] text-center text-sm z-10">{steps[step]}</h3>
          <div className="w-48 h-1.5 bg-input mt-6 rounded-full overflow-hidden z-10">
            <div className="h-full bg-primary" style={{ width: `${((step + 1) / steps.length) * 100}%`, transition: 'width 1s ease-in-out' }}></div>
          </div>
        </div>
      )}

      {/* PREVIEW E EDIÇÃO */}
      {parsedPreview && (
        <div className="space-y-6 animate-in zoom-in-95 duration-300">
          <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl flex items-start gap-3">
             <AlertTriangle size={20} className="text-yellow-500 shrink-0 mt-0.5" />
             <p className="text-[11px] font-bold text-yellow-500/90 uppercase tracking-wider leading-relaxed">
               A IA estruturou os dados abaixo. Revise as informações de carga e volume antes de confirmar a injeção no sistema principal.
             </p>
          </div>

          {Object.keys(parsedPreview).map(day => (
            <div key={day} className="bg-card border-2 border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-input/50 p-4 border-b border-border flex justify-between items-center">
                <h3 className="font-black text-primary uppercase tracking-widest">{parsedPreview[day].title}</h3>
                <span className="text-[10px] bg-card px-2 py-1 border border-border rounded font-bold text-muted uppercase tracking-widest">{parsedPreview[day].focus || 'GERAL'}</span>
              </div>
              <div className="p-4 space-y-3">
                {parsedPreview[day].exercises.map((ex, i) => (
                  <div key={i} className="flex gap-2 items-center group">
                    <input 
                      value={ex.name} 
                      onChange={(e)=>updateExercise(day, i, 'name', e.target.value)} 
                      className="flex-[2] bg-input border border-border p-3 rounded-lg text-xs font-bold uppercase outline-none focus:border-primary group-hover:border-primary/50 transition-colors"
                    />
                    <input 
                      value={ex.sets} 
                      onChange={(e)=>updateExercise(day, i, 'sets', e.target.value)} 
                      className="flex-1 bg-input border border-border p-3 rounded-lg text-xs font-black text-center outline-none focus:border-primary group-hover:border-primary/50 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-4 border-t border-border/50">
            <button onClick={resetAll} className="flex-1 bg-card border-2 border-border text-muted font-black p-4 rounded-xl hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 active:scale-95 text-xs">
              <Trash2 size={18}/> DESCARTAR
            </button>
            <button onClick={confirm} className="flex-[2] bg-primary text-black font-black p-4 rounded-xl shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
              <Check size={20} strokeWidth={3} /> CONFIRMAR INJEÇÃO
            </button>
          </div>
        </div>
      )}

      {/* ERROR HANDLER */}
      {error && (
        <div className="p-6 bg-red-500/10 border-2 border-red-500 rounded-2xl space-y-4 animate-in bounce-in shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <div className="flex items-start gap-4 text-red-500">
            <div className="bg-red-500/20 p-2 rounded-lg border border-red-500/50">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="font-black uppercase tracking-tighter text-sm">Falha na Sincronização Neural</h4>
              <p className="text-xs opacity-90 font-bold mt-1 uppercase tracking-wider">{error.message || "Erro desconhecido ao processar os dados."}</p>
            </div>
          </div>
          <button onClick={resetAll} className="w-full bg-red-500 text-white font-black p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 active:scale-95 transition-all uppercase tracking-widest text-xs shadow-md">
            <RefreshCw size={18} /> REINICIAR MÓDULO
          </button>
        </div>
      )}
    </div>
  );
};

export default Importer;