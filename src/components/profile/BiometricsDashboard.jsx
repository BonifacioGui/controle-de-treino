import React from 'react';
import { Activity, Scale, Target } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const BiometricsDashboard = ({ 
  age, 
  currentWeight, 
  latestBio, 
  imc, 
  imcClassification, 
  rcq, 
  rcqClass, 
  bfColorClass, 
  donutData 
}) => {
  return (
    <div className="space-y-4">
      {/* Cards Rápidos (Macro) */}
      <div>
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-input/50 dark:bg-input border border-border p-2 rounded-2xl text-center shadow-sm">
            <Activity className="mx-auto text-secondary mb-1 opacity-50" size={14} />
            <p className="text-[9px] text-muted font-black uppercase tracking-widest">Idade</p>
            <p className="text-lg font-black text-main dark:text-white">{age}</p>
          </div>
          
          <div className="bg-input/50 dark:bg-input border border-border p-2 rounded-2xl text-center shadow-sm">
            <Scale className="mx-auto text-secondary mb-1 opacity-50" size={14} />
            <p className="text-[9px] text-muted font-black uppercase tracking-widest">Peso</p>
            <p className="text-lg font-black text-main dark:text-white">{currentWeight}</p>
          </div>
          
          {/* BF com o Semáforo Tático */}
          <div className="bg-input/50 dark:bg-input border border-border p-2 rounded-2xl text-center shadow-sm">
            <Target className="mx-auto text-secondary mb-1 opacity-50" size={14} />
            <p className="text-[9px] text-muted font-black uppercase tracking-widest">BF</p>
            <p className={`text-lg font-black transition-colors ${bfColorClass}`}>
              {latestBio?.bf ? `${latestBio.bf}%` : '--'}
            </p>
          </div>
          
          <div className="bg-input/50 dark:bg-input border border-border p-2 rounded-2xl text-center shadow-sm tooltip relative group">
            <Activity className="mx-auto text-secondary mb-1 opacity-50" size={14} />
            <p className="text-[9px] text-muted font-black uppercase tracking-widest" title="Relação Cintura-Quadril">RCQ</p>
            <p className="text-lg font-black text-primary">{rcq}</p>
          </div>
        </div>
        
        {/* Subtítulo de Diagnóstico */}
        <p className="text-center text-[9px] text-muted uppercase font-bold tracking-[0.2em] mt-3">
          Saúde (IMC): <span className="text-secondary">{imcClassification}</span> | Coração: <span className={`${rcqClass === 'Risco Baixo' ? 'text-success' : rcqClass === 'Risco Moderado' ? 'text-warning' : 'text-red-500'}`}>{rcqClass}</span>
        </p>
      </div>

      {/* Gráfico de Máquina Física (Composição) */}
      {donutData && (
        <div className="bg-card border-2 border-border rounded-3xl p-4 shadow-sm flex items-center justify-between transition-colors">
          <div className="flex-1">
            <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-2">Máquina Física</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success shadow-sm dark:shadow-[0_0_5px_rgba(var(--success),0.5)]"></div>
                <div>
                  <p className="text-[9px] text-muted font-black uppercase tracking-widest leading-none">Massa Magra</p>
                  <p className="text-sm font-black text-main dark:text-white">{donutData[0].value} kg</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* A cor da bolinha da gordura segue a lógica do semáforo do BF */}
                <div className={`w-3 h-3 rounded-full shadow-sm dark:shadow-[0_0_5px_rgba(var(--warning),0.5)] ${bfColorClass.replace('text-', 'bg-').split(' ')[0]}`}></div>
                <div>
                  <p className="text-[9px] text-muted font-black uppercase tracking-widest leading-none">Gordura ({latestBio.bf}%)</p>
                  <p className="text-sm font-black text-main dark:text-white">{donutData[1].value} kg</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-28 h-28 shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={donutData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={35} 
                  outerRadius={50} 
                  paddingAngle={5} 
                  dataKey="value" 
                  stroke="none"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }} 
                  itemStyle={{ fontWeight: 'bold' }} 
                  formatter={(value) => [`${value} kg`]} 
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-xs font-black text-main dark:text-white">{latestBio.weight}</span>
              <span className="text-[8px] text-muted uppercase font-bold -mt-1">KG</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiometricsDashboard;