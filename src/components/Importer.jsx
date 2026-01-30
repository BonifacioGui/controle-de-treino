import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Upload, Database, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

const Importer = () => {
  const [status, setStatus] = useState('idle'); // idle, processing, success, error
  const [logs, setLogs] = useState([]);

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    const months = {
      'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04', 'maio': '05', 'junho': '06',
      'julho': '07', 'agosto': '08', 'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
    };
    
    const cleanStr = dateStr.replace(/"/g, '').trim();
    const parts = cleanStr.split(' de ');
    
    if (parts.length !== 3) return cleanStr; 
    
    const day = parts[0].padStart(2, '0');
    const month = months[parts[1].toLowerCase()];
    const year = parts[2];
    
    return `${year}-${month}-${day}`;
  };

  const processFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus('processing');
    setLogs(['Lendo arquivo...']);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n');
        
        const dataLines = lines.slice(1).filter(line => line.trim() !== '');
        const sessionsMap = {};

        dataLines.forEach(line => {
          const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          
          if (cols.length < 3) return;

          const name = cols[0]?.replace(/"/g, '').trim();
          const weight = cols[1]?.replace(/"/g, '').trim();
          const dateRaw = cols[2]?.replace(/"/g, '').trim();
          const reps = cols[4]?.replace(/"/g, '').trim();
          const category = cols[7]?.replace(/"/g, '').trim() || 'TREINO IMPORTADO';

          if (!dateRaw || !name) return;

          const isoDate = parseDate(dateRaw);
          const key = `${isoDate}_${category}`;

          if (!sessionsMap[key]) {
            sessionsMap[key] = {
              workout_date: isoDate,
              workout_name: category.toUpperCase(),
              note: 'Importado via CSV',
              exercises: []
            };
          }

          let existingExercise = sessionsMap[key].exercises.find(e => e.name === name);
          
          if (!existingExercise) {
            existingExercise = { name: name, sets: [], done: true };
            sessionsMap[key].exercises.push(existingExercise);
          }

          existingExercise.sets.push({ weight: weight || '0', reps: reps || '0' });
        });

        const sessionsToInsert = Object.values(sessionsMap);
        setLogs(prev => [...prev, `${sessionsToInsert.length} sessões identificadas. Enviando...`]);

        let successCount = 0;
        let errorCount = 0;

        for (const session of sessionsToInsert) {
          const { error } = await supabase.from('workout_history').insert([session]);
          if (error) {
            console.error('Erro:', error);
            errorCount++;
          } else {
            successCount++;
          }
        }

        setLogs(prev => [...prev, `Finalizado! Sucessos: ${successCount}, Erros: ${errorCount}`]);
        setStatus(errorCount === 0 ? 'success' : 'error');

      } catch (err) {
        console.error(err);
        setLogs(prev => [...prev, 'Erro fatal no processamento.']);
        setStatus('error');
      }
    };

    reader.readAsText(file);
  };

  const getBorderColor = () => {
    if (status === 'success') return 'border-success text-success';
    if (status === 'error') return 'border-red-500 text-red-500';
    if (status === 'processing') return 'border-warning text-warning animate-pulse';
    return 'border-border hover:border-primary text-muted';
  };

  return (
    <div className="p-6 bg-card border border-primary/30 rounded-xl max-w-md mx-auto mt-10">
      <h2 className="text-xl font-black text-primary mb-4 flex items-center gap-2">
        <Database /> IMPORTADOR DE LEGADO
      </h2>
      
      <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer relative ${getBorderColor()}`}>
        <input 
          type="file" 
          accept=".csv" 
          onChange={processFile} 
          disabled={status === 'processing'}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="flex flex-col items-center gap-2 pointer-events-none">
          {status === 'processing' ? <Loader2 size={32} className="animate-spin" /> : 
           status === 'success' ? <CheckCircle size={32} /> :
           status === 'error' ? <AlertTriangle size={32} /> :
           <Upload size={32} />}
          
          <span className="text-xs font-bold uppercase tracking-widest">
            {status === 'processing' ? 'PROCESSANDO...' : 
             status === 'success' ? 'SUCESSO!' : 
             'ARRASTE O CSV AQUI'}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-1 max-h-40 overflow-y-auto text-[10px] font-mono bg-black/30 p-3 rounded border border-border">
        {logs.map((log, i) => (
          <div key={i} className="text-primary/80 border-b border-white/5 pb-1 mb-1 last:border-0">
            {/* CORREÇÃO AQUI: Trocado > solto por string ou entidade HTML */}
            &gt; {log}
          </div>
        ))}
        {logs.length === 0 && <span className="text-muted italic">Aguardando arquivo...</span>}
      </div>
    </div>
  );
};

export default Importer;