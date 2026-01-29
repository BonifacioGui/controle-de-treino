import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label } from 'recharts';
import { ChevronLeft, Activity, Target, Award } from 'lucide-react';

// Adicionado 'workoutData' nas props para que o seletor veja todo o plano
const StatsView = ({ bodyHistory, history, setView, workoutData }) => {
  const [selectedExercise, setSelectedExercise] = useState('');

  // 1. EXTRAÇÃO TOTAL: Mapeia todos os exercícios definidos no plano, independente de histórico
  const availableExercises = workoutData ? [...new Set(
    Object.values(workoutData).flatMap(day => day.exercises.map(ex => ex.name))
  )].sort() : [];

  // 2. BIOMETRIA: Ordenação cronológica rigorosa
  const biometryData = [...bodyHistory]
    .sort((a, b) => {
      const dateA = a.date.split('/').reverse().join('-');
      const dateB = b.date.split('/').reverse().join('-');
      return new Date(dateA) - new Date(dateB);
    })
    .map(entry => ({
      date: entry.date.split('/').slice(0, 2).join('/'),
      peso: parseFloat(entry.weight) || 0,
      cintura: parseFloat(entry.waist) || 0
    }));

  // 3. CARGA DINÂMICA: Filtra o histórico e ordena para aceitar treinos passados (ex: dia 26)
  const loadData = history
    .filter(session => session.exercises.some(ex => ex.name === selectedExercise))
    .map(session => {
      const ex = session.exercises.find(e => e.name === selectedExercise);
      const maxWeight = Math.max(...ex.sets.map(s => parseFloat(s.weight) || 0), 0);
      return {
        date: session.date.split('/').slice(0, 2).join('/'), // Exibe DD/MM
        carga: maxWeight,
        fullDate: session.date // Usado para o sort abaixo
      };
    })
    .sort((a, b) => {
      const dateA = a.fullDate.split('/').reverse().join('-');
      const dateB = b.fullDate.split('/').reverse().join('-');
      return new Date(dateA) - new Date(dateB); // Garante a ordem correta no gráfico
    });

  const personalRecord = loadData.length > 0 ? Math.max(...loadData.map(d => d.carga)) : 0;

  return (
    <main className="space-y-8 animate-in zoom-in duration-500 font-cyber pb-32">
      <div className="flex items-center gap-4 border-b border-cyan-500/20 pb-4">
        <button onClick={() => setView('workout')} className="p-2 bg-slate-900 rounded-full border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 transition-all shadow-[0_0_10px_rgba(0,243,255,0.2)]">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-black italic neon-text-cyan uppercase tracking-tighter">CENTRAL_DE_ANÁLISE</h2>
      </div>

      {/* SEÇÃO BIOMETRIA */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 px-1">
          <Activity size={12} className="text-cyan-500" /> VETORES_CORPORAIS
        </h3>
        <div className="bg-slate-900/40 border-2 border-slate-800 p-4 rounded-3xl h-64 backdrop-blur-sm relative shadow-2xl">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={biometryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
              <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #06b6d4', borderRadius: '12px', fontSize: '10px' }} />
              <Line type="monotone" dataKey="peso" name="Massa" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} />
              <Line type="monotone" dataKey="cintura" name="Dim" stroke="#d946ef" strokeWidth={3} dot={{ r: 4, fill: '#d946ef' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* SEÇÃO CARGA */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <Target size={12} className="text-emerald-500" /> VETOR_DE_CARGA
          </h3>
          <select 
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="bg-slate-900 border border-emerald-500/30 text-emerald-400 text-[10px] font-black p-2 rounded-lg outline-none focus:border-emerald-500 transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)]"
          >
            <option value="">-- SELECIONAR EXERCÍCIO --</option>
            {availableExercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
          </select>
        </div>

        <div className="bg-slate-900/40 border-2 border-slate-800 p-4 rounded-3xl h-64 backdrop-blur-sm relative shadow-2xl">
          {selectedExercise ? (
            <>
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full animate-pulse">
                <Award size={12} className="text-emerald-400" />
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">PR: {personalRecord}KG</span>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={loadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
                  <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #10b981', borderRadius: '12px', fontSize: '10px' }} />
                  <ReferenceLine y={personalRecord} stroke="#10b981" strokeDasharray="5 5" opacity={0.3}>
                    <Label value="RECORD" position="right" fill="#10b981" fontSize={8} fontWeight="900" />
                  </ReferenceLine>
                  <Line type="stepAfter" dataKey="carga" name="Carga" stroke="#10b981" strokeWidth={4} dot={{ fill: '#10b981', r: 5 }} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-700 text-center px-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Selecione um módulo para plotar o histórico de carga.</p>
            </div>
          )}
        </div>
      </section>

      <button onClick={() => setView('workout')} className="w-full py-4 bg-slate-900 border border-slate-800 rounded-xl font-black text-[10px] tracking-widest text-slate-500 hover:text-cyan-400 transition-all uppercase">
        Retornar ao Terminal Principal
      </button>
    </main>
  );
};

export default StatsView;