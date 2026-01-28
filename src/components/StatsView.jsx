import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingDown, ChevronLeft } from 'lucide-react';

const StatsView = ({ bodyHistory, setView }) => {
  // Prepara os dados: inverte para mostrar do mais antigo ao mais novo
  const data = [...bodyHistory].reverse().map(entry => ({
    date: entry.date.split('/')[0] + '/' + entry.date.split('/')[1], // Mostra apenas DD/MM
    peso: parseFloat(entry.weight),
    cintura: parseFloat(entry.waist)
  }));

  return (
    <main className="space-y-6 animate-in zoom-in duration-300">
      <div className="flex items-center gap-4">
        <button onClick={() => setView('workout')} className="p-2 bg-slate-900 rounded-full border border-slate-800 text-slate-400">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-black italic flex items-center gap-2">
          <TrendingDown className="text-emerald-500" /> EVOLUÇÃO CORPORAL
        </h2>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-3xl h-80 shadow-2xl">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px' }}
              itemStyle={{ fontWeight: 'bold' }}
            />
            <Legend iconType="circle" />
            <Line 
              type="monotone" 
              dataKey="peso" 
              name="Peso (kg)"
              stroke="#10b981" 
              strokeWidth={3} 
              dot={{ fill: '#10b981', r: 4 }} 
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line 
              type="monotone" 
              dataKey="cintura" 
              name="Cintura (cm)"
              stroke="#6366f1" 
              strokeWidth={3} 
              dot={{ fill: '#6366f1', r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <p className="text-[10px] text-slate-500 text-center uppercase font-bold tracking-widest">
        * Gráfico baseado nos seus registros de biometria
      </p>
    </main>
  );
};

export default StatsView;