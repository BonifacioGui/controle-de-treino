import React, { useState, useRef } from 'react';
import { Terminal, Cpu, Check, AlertTriangle, Loader2, Trash2, UploadCloud, FileText, Image as ImageIcon, X } from 'lucide-react';
import { parseWorkoutWithAI } from '../services/aiService';

const Importer = ({ setWorkoutData, setView }) => {
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedPreview, setParsedPreview] = useState(null);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError("Formato inválido. Envie um PDF ou uma Imagem.");
      }
    }
  };

  const handleAIProcess = async () => {
    if (!rawText.trim() && !selectedFile) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await parseWorkoutWithAI(rawText, selectedFile);
      setParsedPreview(result);
    } catch (err) {
      setError("Falha na decodificação. Verifique o arquivo/texto e tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmImport = () => {
    if (!parsedPreview) return;
    
    setWorkoutData(prev => ({ ...prev, ...parsedPreview }));
    localStorage.setItem('workout_plan', JSON.stringify({ ...parsedPreview }));
    setView('workout'); 
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-cyber">
      
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 bg-primary/20 rounded-xl border border-primary/30">
          <Cpu className="text-primary animate-pulse" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Scanner Neural</h2>
          <p className="text-[10px] font-mono text-muted uppercase tracking-[0.2em]">Texto // PDF // Imagem</p>
        </div>
      </div>

      {!parsedPreview ? (
        <div className="space-y-4">
          
          {/* ÁREA DE UPLOAD TÁTICO */}
          <div 
            onClick={() => !selectedFile && fileInputRef.current.click()}
            className={`relative w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all ${selectedFile ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50 cursor-pointer'}`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="application/pdf, image/png, image/jpeg" 
              onChange={handleFileChange} 
            />
            
            {selectedFile ? (
              <div className="flex items-center gap-4 w-full bg-black/50 p-4 rounded-xl border border-white/10">
                {selectedFile.type === 'application/pdf' ? <FileText className="text-fuchsia-500" size={32} /> : <ImageIcon className="text-cyan-500" size={32} />}
                <div className="flex-1 overflow-hidden">
                  <p className="text-white font-bold text-sm truncate">{selectedFile.name}</p>
                  <p className="text-muted text-[10px] uppercase font-mono tracking-widest">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB Pronto para extração
                  </p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeFile(); }} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="text-center space-y-2 opacity-70">
                <UploadCloud size={48} className="mx-auto text-primary" />
                <p className="font-bold text-white uppercase text-sm">Upload de Ficha</p>
                <p className="font-mono text-muted text-[10px] uppercase tracking-widest">Toque para selecionar PDF ou Imagem</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 py-2">
            <div className="h-[1px] flex-1 bg-border"></div>
            <span className="text-muted font-black text-[10px] uppercase tracking-widest">OU COLE O TEXTO</span>
            <div className="h-[1px] flex-1 bg-border"></div>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            disabled={!!selectedFile}
            placeholder={selectedFile ? "Arquivo selecionado. Texto desabilitado." : "Cole aqui seu treino bruto do WhatsApp..."}
            className="w-full h-32 bg-card border border-border rounded-2xl p-4 text-white font-mono text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted/50 disabled:opacity-50"
          />

          <button
            onClick={handleAIProcess}
            disabled={isProcessing || (!rawText && !selectedFile)}
            className="w-full h-16 bg-primary text-black font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-3 hover:bg-primary/80 transition-all disabled:opacity-50 active:scale-95 shadow-[0_0_20px_rgba(var(--primary),0.3)]"
          >
            {isProcessing ? (
              <><Loader2 className="animate-spin" /> Analisando Documento...</>
            ) : (
              <><Terminal size={20} /> Iniciar Extração</>
            )}
          </button>
        </div>
      ) : (
        /* VISUALIZAÇÃO DA EXTRAÇÃO (O MESMO CÓDIGO DE ANTES) */
        <div className="space-y-4 animate-in zoom-in-95 duration-300">
          <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl flex items-center gap-3">
            <Check className="text-green-500" size={20} />
            <span className="text-xs font-black text-green-500 uppercase tracking-widest">Ficha Decodificada</span>
          </div>

          <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
            {Object.keys(parsedPreview).map(day => (
              <div key={day} className="bg-card border border-border p-5 rounded-2xl">
                <div className="flex justify-between items-start mb-4 border-b border-border pb-3">
                  <h3 className="text-xl font-black text-primary uppercase italic">{parsedPreview[day].title}</h3>
                  <span className="text-[10px] font-bold text-muted uppercase bg-white/5 px-3 py-1 rounded-full">{parsedPreview[day].focus}</span>
                </div>
                <ul className="space-y-2">
                  {parsedPreview[day].exercises.map((ex, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm border-l-2 border-primary/30 pl-3 py-1">
                      <span className="text-white font-bold">{ex.name}</span>
                      <span className="text-primary font-mono font-bold">{ex.sets}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setParsedPreview(null)} className="flex-1 h-14 bg-card border border-border text-muted font-black uppercase text-[10px] tracking-widest rounded-xl hover:text-red-500 hover:border-red-500/50 transition-all">
              <Trash2 size={16} className="inline mr-2" /> Descartar
            </button>
            <button onClick={confirmImport} className="flex-[2] h-14 bg-primary text-black font-black uppercase text-[12px] tracking-widest rounded-xl hover:bg-primary/80 transition-all shadow-[0_0_20px_rgba(var(--primary),0.4)]">
              Confirmar Injeção
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-500 animate-bounce">
          <AlertTriangle size={20} />
          <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
        </div>
      )}
    </div>
  );
};

export default Importer;