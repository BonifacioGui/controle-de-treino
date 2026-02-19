// src/components/BossSection.jsx
import React, { useMemo } from 'react';
import { Trophy, Skull } from 'lucide-react';
import { isSameExercise, parseDateTimestamp, safeParseFloat } from '../utils/workoutUtils';

const BossSection = ({ currentWorkout, todayVolume, history, selectedDate, activeDay }) => {
  
  const bossName = useMemo(() => {
    const names = ["THAIS CARLA", "SERJÃO DOS FOGUETES", "GRACYANNE", "PETER GRIFFIN", "GORDÃO DA XJ", "XANDÃO", "PADRE MARCELO", "TOGURO", "DAVY JONES", "TREINO DE PERNA", "GORDO ALBERTO"];
    if (!selectedDate) return names[0];
    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dayUniqueIndex = Math.floor(dateObj.getTime() / (24 * 60 * 60 * 1000));
    let trainOffset = 0;
    if (activeDay) {
       for(let i=0; i<activeDay.length; i++) trainOffset += activeDay.charCodeAt(i);
    }
    return names[(dayUniqueIndex + trainOffset) % names.length];
  }, [selectedDate, activeDay]);

  const bossStats = useMemo(() => {
    if (!currentWorkout || !currentWorkout.exercises?.length) return { hp: 5000, max: 5000, current: 5000, percent: 100, status: 'ALIVE' };

    let maxHp = 0;
    const previousSession = history
        ?.filter(h => h.exercises.some(e => isSameExercise(e.name, currentWorkout.exercises[0].name))) 
        ?.sort((a, b) => parseDateTimestamp(b.date) - parseDateTimestamp(a.date))[0];

    if (previousSession) {
        let prevVolume = 0;
        previousSession.exercises.forEach(ex => {
            ex.sets?.forEach(s => prevVolume += (safeParseFloat(s.weight) * safeParseFloat(s.reps)));
        });
        maxHp = Math.max(Math.round(prevVolume * 1.05), 2000); 
    } else {
        maxHp = 5000; 
    }

    const remainingHp = Math.max(0, maxHp - todayVolume);
    const percent = (remainingHp / maxHp) * 100;
    
    return { 
      max: maxHp, 
      current: remainingHp, 
      percent: percent, 
      status: percent <= 0 ? 'DEFEATED' : 'ALIVE' 
    };
  }, [todayVolume, currentWorkout, history]);

  return (
    <div className={`rounded-xl overflow-hidden border transition-all duration-500 shadow-xl z-10 ${bossStats.status === 'DEFEATED' ? 'bg-black border-green-500/50' : 'bg-card border-red-900/30'}`}>
         <div className="p-3 flex justify-between items-end border-b border-white/5">
            <div className="flex items-center gap-2">
               {bossStats.status === 'DEFEATED' ? <Trophy className="text-green-500 animate-bounce" size={24}/> : <Skull className="text-red-500 animate-pulse" size={24}/>}
               <div>
                   <span className={`text-[9px] font-black uppercase tracking-[0.2em] block ${bossStats.status === 'DEFEATED' ? 'text-green-500' : 'text-red-500'}`}>
                       {bossStats.status === 'DEFEATED' ? 'VITÓRIA' : 'ALVO ATUAL:'}
                   </span>
                   <span className={`text-lg font-black text-main uppercase italic leading-none truncate max-w-[200px] block ${bossStats.status === 'DEFEATED' ? 'text-green-400' : ''}`}>
                      {bossName}
                  </span>
               </div>
            </div>
            <div className="text-right">
                <span className="text-[9px] font-bold text-muted uppercase block mb-0.5">HP RESTANTE</span>
                <span className={`text-xl font-black leading-none block ${bossStats.status === 'DEFEATED' ? 'text-green-500' : 'text-red-500'}`}>
                    {bossStats.current.toLocaleString()} <span className="text-[10px] opacity-60">kg</span>
                </span>
            </div>
         </div>
         <div className="h-5 bg-black relative">
             <div className={`absolute top-0 left-0 h-full transition-all duration-500 ${bossStats.status === 'DEFEATED' ? 'bg-green-500' : 'bg-gradient-to-r from-red-900 via-red-600 to-red-500'}`} style={{ width: `${bossStats.percent}%` }}></div>
             <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white/40 tracking-widest mix-blend-overlay z-10">
                META: {bossStats.max.toLocaleString()} KG
             </div>
         </div>
    </div>
  );
};

export default BossSection;