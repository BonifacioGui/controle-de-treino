import React, { useState } from 'react';
import { Scale, X, Plus, CalendarDays, Save, Pencil, Trash2, FileText, Activity } from 'lucide-react';

const formatNumberInput = (value) => {
  return value.replace(/[^0-9.]/g, '');
};

const BodyScanner = ({
  showBioForm, handleToggleForm,
  bioDate, setBioDate,
  bioWeight, setBioWeight,
  bioBf, setBioBf,
  calculatedLeanMass,
  bioWaist, setBioWaist,
  bioAbdomen, setBioAbdomen,
  bioHip, setBioHip,
  bioChest, setBioChest,
  bioShoulder, setBioShoulder,
  bioArmL, setBioArmL,
  bioArmR, setBioArmR,
  bioLegL, setBioLegL,
  bioLegR, setBioLegR,
  bioCalfL, setBioCalfL,
  bioCalfR, setBioCalfR,
  bioNote, setBioNote,
  handleSaveBiometrics, isSavingBio,
  sortedBody, handleEditBio, requestDelete, getBfColorClass
}) => {

  // 🔥 LÓGICA DE ESCALABILIDADE: Controle de expansão do histórico
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_VISIBLE = 5;
  const displayHistory = isExpanded ? sortedBody : sortedBody.slice(0, MAX_VISIBLE);

  // 🔥 LÓGICA VISUAL: Decodificador de texto para o BF
  const getBfStatusText = (bfValue) => {
    if (!bfValue || bfValue === '--') return '';
    const val = parseFloat(bfValue);
    if (isNaN(val)) return '';
    if (val < 10) return 'ATLETA';
    if (val <= 17) return 'FITNESS';
    if (val <= 24) return 'MODERADO';
    return 'ALTO';
  };

  return (
    <div className="shrink-0 space-y-3 pt-2 pb-4 border-b border-border">
      {/* Cabeçalho do Scanner */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black text-secondary uppercase tracking-widest flex items-center gap-2">
          <Scale size={14} /> Scanner Corporal
        </h3>
        <button 
          onClick={handleToggleForm} 
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-black uppercase tracking-widest ${showBioForm ? 'bg-secondary text-black border-secondary shadow-[0_0_10px_rgba(var(--secondary),0.4)]' : 'bg-card text-secondary border-secondary/50 hover:bg-secondary/10'}`}
        >
          {showBioForm ? <X size={12}/> : <Plus size={12}/>} 
          {showBioForm ? 'Cancelar' : 'Escanear'}
        </button>
      </div>

      {/* FORMULÁRIO DE REGISTRO */}
      {showBioForm && (
        <div className="bg-card border-2 border-secondary/30 rounded-xl p-4 animate-in slide-in-from-top-2 fade-in duration-200 shadow-lg space-y-4">
          
          <div className="flex items-center gap-2 bg-input/50 border border-border rounded-lg p-2">
            <CalendarDays size={16} className="text-secondary" />
            <input 
              type="date" 
              value={bioDate} 
              onChange={(e) => setBioDate(e.target.value)} 
              className="bg-transparent text-main dark:text-white text-xs font-bold w-full outline-none" 
            />
          </div>

          <div className="p-3 border border-border rounded-lg bg-input/50 dark:bg-black/20">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-primary mb-2">Composição Corporal</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1 block">Peso (KG)*</label>
                <input type="text" inputMode="decimal" placeholder="80.5" value={bioWeight} onChange={(e) => setBioWeight(formatNumberInput(e.target.value))} className="w-full bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-success outline-none focus:border-success transition-colors" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1 block">BF (%)</label>
                <input type="text" inputMode="decimal" placeholder="15.0" value={bioBf} onChange={(e) => setBioBf(formatNumberInput(e.target.value))} className="w-full bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-warning outline-none focus:border-warning transition-colors" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1 block">Massa Magra</label>
                <div className="w-full bg-input/50 border border-border rounded-lg p-2 text-center text-xs font-black text-primary opacity-80 flex items-center justify-center h-[34px]">
                  {calculatedLeanMass} {calculatedLeanMass !== '--' && <span className="text-[8px] ml-0.5 text-muted">kg</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 border border-border rounded-lg bg-input/50 dark:bg-black/20">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-primary mb-2">Medidas de Tronco (CM)</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[8px] font-bold text-muted uppercase tracking-widest mb-1 block text-center">Cintura</label>
                <input type="text" inputMode="decimal" placeholder="00.0" value={bioWaist} onChange={(e) => setBioWaist(formatNumberInput(e.target.value))} className="w-full bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-main dark:text-white outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[8px] font-bold text-warning uppercase tracking-widest mb-1 block text-center">Abdome</label>
                <input type="text" inputMode="decimal" placeholder="00.0" value={bioAbdomen} onChange={(e) => setBioAbdomen(formatNumberInput(e.target.value))} className="w-full bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-main dark:text-white outline-none focus:border-warning" />
              </div>
              <div>
                <label className="text-[8px] font-bold text-muted uppercase tracking-widest mb-1 block text-center">Quadril</label>
                <input type="text" inputMode="decimal" placeholder="00.0" value={bioHip} onChange={(e) => setBioHip(formatNumberInput(e.target.value))} className="w-full bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-main dark:text-white outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[8px] font-bold text-muted uppercase tracking-widest mb-1 block text-center">Peito</label>
                <input type="text" inputMode="decimal" placeholder="00.0" value={bioChest} onChange={(e) => setBioChest(formatNumberInput(e.target.value))} className="w-full bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-main dark:text-white outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[8px] font-bold text-muted uppercase tracking-widest mb-1 block text-center">Ombro</label>
                <input type="text" inputMode="decimal" placeholder="00.0" value={bioShoulder} onChange={(e) => setBioShoulder(formatNumberInput(e.target.value))} className="w-full bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-main dark:text-white outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          <div className="p-3 border border-border rounded-lg bg-input/50 dark:bg-black/20">
            <div className="flex justify-between items-end mb-2">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-primary">Membros Bilaterais (CM)</h4>
              <div className="flex gap-4">
                <span className="text-[8px] font-black text-muted uppercase">Esq.</span>
                <span className="text-[8px] font-black text-muted uppercase mr-2">Dir.</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest w-16">Braço</label>
                <input type="text" inputMode="decimal" placeholder="Esq" value={bioArmL} onChange={(e) => setBioArmL(formatNumberInput(e.target.value))} className="flex-1 bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-main dark:text-white outline-none focus:border-primary" />
                <input type="text" inputMode="decimal" placeholder="Dir" value={bioArmR} onChange={(e) => setBioArmR(formatNumberInput(e.target.value))} className="flex-1 bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-main dark:text-white outline-none focus:border-primary" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest w-16">Coxa</label>
                <input type="text" inputMode="decimal" placeholder="Esq" value={bioLegL} onChange={(e) => setBioLegL(formatNumberInput(e.target.value))} className="flex-1 bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-main dark:text-white outline-none focus:border-primary" />
                <input type="text" inputMode="decimal" placeholder="Dir" value={bioLegR} onChange={(e) => setBioLegR(formatNumberInput(e.target.value))} className="flex-1 bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-main dark:text-white outline-none focus:border-primary" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest w-16">Pantur.</label>
                <input type="text" inputMode="decimal" placeholder="Esq" value={bioCalfL} onChange={(e) => setBioCalfL(formatNumberInput(e.target.value))} className="flex-1 bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-main dark:text-white outline-none focus:border-primary" />
                <input type="text" inputMode="decimal" placeholder="Dir" value={bioCalfR} onChange={(e) => setBioCalfR(formatNumberInput(e.target.value))} className="flex-1 bg-input border border-border rounded-lg p-2 text-center text-xs font-black text-main dark:text-white outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          <div className="p-3 border border-border rounded-lg bg-input/50 dark:bg-black/20">
             <label className="text-[9px] font-black uppercase tracking-widest text-primary mb-2 block">Diário Tático (Anotações)</label>
             <textarea 
               value={bioNote} 
               onChange={(e) => setBioNote(e.target.value)}
               placeholder="Ex: Medida tirada em jejum logo após acordar."
               className="w-full bg-input border border-border rounded-lg p-2 text-xs text-main dark:text-white outline-none focus:border-primary h-16 resize-none placeholder-muted/50"
             />
          </div>

          <button 
            onClick={handleSaveBiometrics}
            disabled={isSavingBio || !bioWeight}
            className="w-full bg-secondary text-black font-black uppercase tracking-widest py-3 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 shadow-sm"
          >
            {isSavingBio ? <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full"/> : <Save size={16} />}
            Registrar Status
          </button>
        </div>
      )}

      {/* ESTEIRA DOS CARDS DE HISTÓRICO */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide">
        {displayHistory.length === 0 && !showBioForm && (
          <div className="text-xs text-muted p-4 w-full text-center border border-dashed border-border rounded-xl font-bold uppercase tracking-widest">
            Nenhum scan corporal registrado.
          </div>
        )}
        
        {displayHistory.map((b) => (
          <div key={b.id} className="min-w-[300px] max-w-[320px] bg-card border-2 border-secondary/20 p-4 rounded-2xl shadow-md dark:shadow-xl relative group hover:border-secondary/50 transition-all shrink-0 flex flex-col gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
            
            <div className="flex justify-between items-center border-b border-border/50 pb-2">
              <span className="font-black text-secondary text-xs tracking-widest flex items-center gap-1.5">
                <CalendarDays size={14} /> {b.date}
              </span>
              <div className="flex gap-3">
                <button onClick={() => handleEditBio(b)} className="text-muted hover:text-primary transition-colors" title="Editar"><Pencil size={14} /></button>
                <button onClick={() => requestDelete(b.id, 'body')} className="text-muted hover:text-red-500 transition-colors" title="Apagar"><Trash2 size={14} /></button>
              </div>
            </div>
            
            {/* Macro Card Info */}
            <div className="grid grid-cols-3 gap-2">
               <div className="flex flex-col items-center justify-center p-2 bg-input/80 dark:bg-black/30 rounded-xl border border-border/30 shadow-sm">
                 <span className="text-[8px] text-muted uppercase font-bold tracking-widest">Peso</span>
                 <span className="text-sm font-black text-success mt-0.5">{b.weight || '--'}<span className="text-[8px] text-muted ml-0.5 font-normal">kg</span></span>
               </div>
               
               {/* 🔥 NOVO: CARD DO BF COM O SELO DE STATUS */}
               <div className="flex flex-col items-center justify-center p-2 bg-input/80 dark:bg-black/30 rounded-xl border border-border/30 shadow-sm relative">
                 <span className="text-[8px] text-muted uppercase font-bold tracking-widest">BF</span>
                 <span className={`text-sm font-black mt-0.5 ${getBfColorClass(b.bf)}`}>
                   {b.bf || '--'}<span className="text-[8px] text-muted ml-0.5 font-normal">%</span>
                 </span>
                 {b.bf && (
                   <span className={`text-[6px] font-black uppercase tracking-widest mt-1 opacity-80 ${getBfColorClass(b.bf)}`}>
                     {getBfStatusText(b.bf)}
                   </span>
                 )}
               </div>

               <div className="flex flex-col items-center justify-center p-2 bg-primary/10 rounded-xl border border-primary/30 shadow-sm">
                 <span className="text-[8px] text-primary uppercase font-bold tracking-widest">M. Magra</span>
                 <span className="text-sm font-black text-main dark:text-white mt-0.5">{b.lean_mass || '--'}<span className="text-[8px] text-primary/70 ml-0.5 font-normal">kg</span></span>
               </div>
            </div>

            {/* Tronco Card Info */}
            <div className="bg-input/50 dark:bg-black/20 rounded-xl border border-border/30 p-2 space-y-2 shadow-sm">
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center justify-center bg-input/80 dark:bg-input/30 rounded-lg py-1.5">
                  <span className="text-[8px] text-muted uppercase font-bold tracking-widest">Cintura</span>
                  <span className="text-xs font-black text-main dark:text-white">{b.waist || '--'}<span className="text-[7px] text-muted ml-0.5 font-normal">cm</span></span>
                </div>
                <div className="flex flex-col items-center justify-center bg-warning/10 dark:bg-warning/5 rounded-lg py-1.5 border border-warning/20">
                  <span className="text-[8px] text-warning uppercase font-bold tracking-widest">Abdome</span>
                  <span className="text-xs font-black text-main dark:text-white">{b.abdomen || '--'}<span className="text-[7px] text-muted ml-0.5 font-normal">cm</span></span>
                </div>
                <div className="flex flex-col items-center justify-center bg-input/80 dark:bg-input/30 rounded-lg py-1.5">
                  <span className="text-[8px] text-muted uppercase font-bold tracking-widest">Quadril</span>
                  <span className="text-xs font-black text-main dark:text-white">{b.hip || '--'}<span className="text-[7px] text-muted ml-0.5 font-normal">cm</span></span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-border/30 pt-2">
                <div className="flex flex-col items-center justify-center bg-input/80 dark:bg-input/30 rounded-lg py-1.5">
                  <span className="text-[8px] text-muted uppercase font-bold tracking-widest">Peito</span>
                  <span className="text-xs font-black text-main dark:text-white">{b.chest || '--'}<span className="text-[7px] text-muted ml-0.5 font-normal">cm</span></span>
                </div>
                <div className="flex flex-col items-center justify-center bg-input/80 dark:bg-input/30 rounded-lg py-1.5">
                  <span className="text-[8px] text-muted uppercase font-bold tracking-widest">Ombro</span>
                  <span className="text-xs font-black text-main dark:text-white">{b.shoulder || '--'}<span className="text-[7px] text-muted ml-0.5 font-normal">cm</span></span>
                </div>
              </div>
            </div>

            {/* Membros Card Info */}
            <div className="bg-input/50 dark:bg-black/20 rounded-xl border border-border/30 p-2 shadow-sm">
              <div className="flex justify-between px-2 mb-1">
                <span className="text-[7px] text-muted uppercase font-bold tracking-widest w-12">Membro</span>
                <span className="text-[7px] text-muted uppercase font-bold tracking-widest flex-1 text-center">Esquerdo</span>
                <span className="text-[7px] text-muted uppercase font-bold tracking-widest flex-1 text-center">Direito</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-baseline bg-input/80 dark:bg-input/40 rounded px-2 py-1">
                  <span className="text-[9px] text-main font-bold uppercase tracking-widest w-12">Braço</span>
                  <span className="text-[10px] font-black text-main dark:text-white flex-1 text-center">{b.arm_left || '--'}<span className="text-[7px] text-muted font-normal ml-0.5">cm</span></span>
                  <span className="text-[10px] font-black text-main dark:text-white flex-1 text-center">{b.arm_right || '--'}<span className="text-[7px] text-muted font-normal ml-0.5">cm</span></span>
                </div>
                <div className="flex justify-between items-baseline bg-input/80 dark:bg-input/40 rounded px-2 py-1">
                  <span className="text-[9px] text-main font-bold uppercase tracking-widest w-12">Coxa</span>
                  <span className="text-[10px] font-black text-main dark:text-white flex-1 text-center">{b.leg_left || '--'}<span className="text-[7px] text-muted font-normal ml-0.5">cm</span></span>
                  <span className="text-[10px] font-black text-main dark:text-white flex-1 text-center">{b.leg_right || '--'}<span className="text-[7px] text-muted font-normal ml-0.5">cm</span></span>
                </div>
                <div className="flex justify-between items-baseline bg-input/80 dark:bg-input/40 rounded px-2 py-1">
                  <span className="text-[9px] text-main font-bold uppercase tracking-widest w-12">Pantur.</span>
                  <span className="text-[10px] font-black text-main dark:text-white flex-1 text-center">{b.calf_left || '--'}<span className="text-[7px] text-muted font-normal ml-0.5">cm</span></span>
                  <span className="text-[10px] font-black text-main dark:text-white flex-1 text-center">{b.calf_right || '--'}<span className="text-[7px] text-muted font-normal ml-0.5">cm</span></span>
                </div>
              </div>
            </div>

            {/* Anotações Card Info */}
            {b.note && (
              <div className="mt-auto pt-2 p-2 bg-warning/10 dark:bg-warning/5 rounded-lg border border-warning/20 text-[10px] text-muted flex items-start gap-1.5 shadow-inner">
                <FileText size={12} className="text-warning shrink-0 mt-0.5" />
                <span className="line-clamp-3 leading-snug">"{b.note}"</span>
              </div>
            )}
            
          </div>
        ))}

        {/* 🔥 CONTROLE DE EXPANSÃO (Ver Mais / Recolher) */}
        {!isExpanded && sortedBody.length > MAX_VISIBLE && (
          <button 
            onClick={() => setIsExpanded(true)}
            className="min-w-[120px] bg-input/50 dark:bg-black/10 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted hover:text-primary hover:border-primary/50 transition-all shrink-0 group shadow-sm"
          >
            <Activity size={24} className="mb-2 group-hover:animate-bounce" />
            <span className="text-[9px] font-black uppercase tracking-widest text-center px-2">
              Ver Mais<br/>({sortedBody.length - MAX_VISIBLE} Ocultos)
            </span>
          </button>
        )}

        {isExpanded && sortedBody.length > MAX_VISIBLE && (
          <button 
            onClick={() => setIsExpanded(false)}
            className="min-w-[120px] bg-input/50 dark:bg-black/10 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted hover:text-red-500 hover:border-red-500/50 transition-all shrink-0 group shadow-sm"
          >
            <X size={24} className="mb-2 group-hover:scale-90 transition-transform" />
            <span className="text-[9px] font-black uppercase tracking-widest text-center px-2">
              Recolher
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default BodyScanner;