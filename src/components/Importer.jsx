import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Database, Loader2, Upload, Merge, Wand2, ShieldCheck } from 'lucide-react';

const Importer = () => {
  const [status, setStatus] = useState('idle');
  const [logs, setLogs] = useState([]);

  // --- MAPA DE CORREÇÕES (AQUI É O SEGREDO) ---
  const correctionMap = {
    // Erros de Digitação
    'panturilha sentado': 'Panturrilha Sentado',
    
    // Padronização de Nomes (Juntando duplicatas)
    'tríceps na polia com corda': 'Tríceps na Polia (Corda)',
    'triceps na polia (corda)': 'Tríceps na Polia (Corda)',
    'supino inclinado': 'Supino Inclinado (Halter)',
    'supino reto': 'Supino Reto (Barra)', // Assume que se não tem nada escrito, é barra
    
    // Padronização de Acentos comuns
    'maca peruana': 'Maca Peruana',
    'albumina': 'Albumina',
    'creatina': 'Creatina'
  };

  // --- PARSER DE CSV ---
  const parseCSV = (text) => {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (insideQuotes && text[i + 1] === '"') {
          currentField += '"'; i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\n' || char === '\r') && !insideQuotes) {
        if (char === '\r' && text[i + 1] === '\n') i++;
        currentRow.push(currentField.trim());
        if (currentRow.some(c => c)) rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      rows.push(currentRow);
    }
    return rows;
  };

  // --- PARSER DE DATA ---
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const cleanStr = dateStr.replace(/\s+/g, ' ').trim().toLowerCase();
    const regex = /^(\d{1,2})\s+de\s+([a-zçã]+)\s+de\s+(\d{4})/i;
    const match = cleanStr.match(regex);

    if (match) {
      const day = match[1].padStart(2, '0');
      const monthName = match[2];
      const year = match[3];

      const months = {
        'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03',
        'abril': '04', 'maio': '05', 'junho': '06', 'julho': '07',
        'agosto': '08', 'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
      };

      if (months[monthName]) {
        return `${year}-${months[monthName]}-${day}`;
      }
    }
    return null;
  };

  const cleanNumber = (val) => {
    if (!val) return '0';
    let cleaned = val.replace(/[^\d.,]/g, '');
    cleaned = cleaned.replace(',', '.');
    return cleaned || '0';
  };

  const cleanText = (txt) => {
    if (!txt) return '';
    return txt.replace(/^"|"$/g, '').trim();
  };

  // --- 🔥 FORMATAÇÃO INTELIGENTE COM MAPA ---
  const formatName = (txt) => {
    if (!txt) return '';
    
    // 1. Limpa básico
    let clean = txt.replace(/^"|"$/g, '').trim().toLowerCase();
    
    // 2. VERIFICA NO MAPA DE CORREÇÃO
    // Se o nome "ruim" estiver no mapa, retorna o nome "bom" imediatamente
    if (correctionMap[clean]) {
        return correctionMap[clean];
    }

    // 3. Se não estiver no mapa, padroniza com Maiúsculas (Title Case)
    return clean.replace(/\b\w/g, l => l.toUpperCase());
  };

  const processFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus('processing');
    setLogs(['Lendo CSV e aplicando Correções Automáticas...']);

    const reader = new FileReader();
    reader.readAsText(file, 'ISO-8859-1'); 

    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const allRows = parseCSV(text);
        const dataRows = allRows.slice(1);
        
        setLogs(prev => [...prev, `${dataRows.length} linhas encontradas.`]);

        const sessionsMap = {};
        let skipped = 0;
        let correctedCount = 0;

        dataRows.forEach((cols) => {
          if (cols.length < 5) return;

          const rawName = cols[0];
          const finalName = formatName(rawName); // <--- AQUI A MÁGICA ACONTECE
          
          // Conta quantas correções foram feitas para logar depois
          if (rawName && finalName !== rawName && correctionMap[rawName.toLowerCase()]) {
             correctedCount++;
          }

          const weight = cleanNumber(cols[1]); 
          const reps = cleanNumber(cols[2]);
          
          const dateRaw = cols[4];
          const noteRaw = cleanText(cols[5]);
          const categoryRaw = cleanText(cols[6]) || 'TREINO';

          if (!finalName || !dateRaw) return;

          const isoDate = parseDate(dateRaw);
          
          if (!isoDate) {
            skipped++;
            return;
          }

          const key = isoDate; 
          
          if (!sessionsMap[key]) {
            sessionsMap[key] = {
              workout_date: isoDate,
              workout_name: categoryRaw.toUpperCase(),
              note: noteRaw || 'Importado',
              exercises: []
            };
          } else {
            const currentName = sessionsMap[key].workout_name;
            const newName = categoryRaw.toUpperCase();
            if (newName && !currentName.includes(newName) && newName !== 'TREINO IMPORTADO') {
                sessionsMap[key].workout_name = `${currentName} + ${newName}`;
            }
          }
          
          let ex = sessionsMap[key].exercises.find(e => e.name === finalName);
          if (!ex) {
            ex = { name: finalName, sets: [], done: true };
            sessionsMap[key].exercises.push(ex);
          }
          
          ex.sets.push({ weight: weight, reps: reps });
        });

        const sessions = Object.values(sessionsMap);
        setLogs(prev => [...prev, `${sessions.length} dias processados.`]);
        setLogs(prev => [...prev, `✨ ${correctedCount} nomes corrigidos automaticamente!`]);

        if (sessions.length === 0) {
            setStatus('error');
            setLogs(prev => [...prev, "Nenhum treino válido."]);
            return;
        }

        let errors = 0;
        for (const session of sessions) {
          const { error } = await supabase.from('workout_history').insert([session]);
          if (error) errors++;
        }

        setStatus('success');
        setLogs(prev => [...prev, `SUCESSO! Importação finalizada.`]);

      } catch (err) {
        setStatus('error');
        setLogs(prev => [...prev, 'Erro: ' + err.message]);
      }
    };
  };

  return (
    <div className="p-6 bg-card border border-primary/30 rounded-xl max-w-md mx-auto mt-10">
      <h2 className="text-xl font-black text-primary mb-4 flex items-center gap-2">
        <ShieldCheck /> IMPORTADOR CORRETOR
      </h2>
      <div className={`border-2 border-dashed rounded-xl p-8 text-center relative ${status === 'processing' ? 'border-warning text-warning' : 'border-border text-muted hover:border-primary'}`}>
        <input type="file" accept=".csv" onChange={processFile} disabled={status === 'processing'} className="absolute inset-0 opacity-0 cursor-pointer" />
        <div className="flex flex-col items-center gap-2">
          {status === 'processing' ? <Loader2 className="animate-spin" /> : <Upload />}
          <span className="text-xs font-bold uppercase tracking-widest">ARRASTE O CSV</span>
        </div>
      </div>
      <div className="mt-4 space-y-1 max-h-40 overflow-y-auto text-[10px] font-mono bg-black/30 p-3 rounded">
        {logs.map((log, i) => <div key={i} className="text-primary/80 border-b border-white/5 pb-1">&gt; {log}</div>)}
      </div>
    </div>
  );
};

export default Importer;