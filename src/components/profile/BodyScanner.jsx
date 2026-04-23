import React, { useState } from 'react';
import { 
  Scale, X, Plus, CalendarDays, Save, Pencil, Trash2, 
  FileText, Archive, ChevronDown, ChevronUp 
} from 'lucide-react';

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

  // 🔥 ESTADOS DE EXPANSÃO E ARQUIVO
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null); 
  const [expandedCardId, setExpandedCardId] = useState(null); 
  
  const RECENT_LIMIT = 3;
  const recentHistory = sortedBody.slice(0, RECENT_LIMIT);
  const olderHistoryCount = sortedBody.length - RECENT_LIMIT;

  const getBfStatusText = (bfValue) => {
    if (!bfValue || bfValue === '--') return '';
    const val = parseFloat(bfValue);
    if (isNaN(val)) return '';
    if (val < 10) return 'ATLETA';
    if (val <= 17) return 'FITNESS';
    if (val <= 24) return 'MODERADO';
    return 'ALTO';
  };

  // 🔥 CORRIGIDO: Sub-componente com as Panturrilhas inclusas!
  const ExpandedStats = ({ b, isCard }) => (
    <div className={`p-4 bg-black/5 dark:bg-black/20 border-t border-border animate-in slide-in-from-top-2 duration-200 ${isCard ? 'rounded-b-2xl' : ''}`}>
      <div className="grid grid-cols-2 gap-2 mb-2">
         <div className="flex flex-col items-center p-2 bg-input/50 rounded-lg border border-border/50">
           <span className="text-[8px] text-muted uppercase font-bold tracking-widest">Cintura</span>
           <span className="text-xs font-black text-main dark:text-white">{b.waist || '--'}cm</span>
         </div>
         <div className="flex flex-col items-center p-2 bg-warning/10 rounded-lg border border-warning/20">
           <span className="text-[8px] text-warning uppercase font-bold tracking-widest">Abdome</span>
           <span className="text-xs font-black text-main dark:text-white">{b.abdomen || '--'}cm</span>
         </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-2">
         <div className="flex flex-col items-center p-2 bg-input/50 rounded-lg border border-border/50">
           <span className="text-[8px] text-muted uppercase font-bold tracking-widest">Peito</span>
           <span className="text-xs font-black text-main dark:text-white">{b.chest || '--'}cm</span>
         </div>
         <div className="flex flex-col items-center p-2 bg-input/50 rounded-lg border border-border/50">
           <span className="text-[8px] text-muted uppercase font-bold tracking-widest">Ombro</span>
           <span className="text-xs font-black text-main dark:text-white">{b.shoulder || '--'}cm</span>
         </div>
         <div className="flex flex-col items-center p-2 bg-input/50 rounded-lg border border-border/50">
           <span className="text-[8px] text-muted uppercase font-bold tracking-widest">Quadril</span>
           <span className="text-xs font-black text-main dark:text-white">{b.hip || '--'}cm</span>
         </div>
      </div>
      <div className="bg-input/50 rounded-lg border border-border/50 p-2 mb-2">
         <div className="flex justify-between px-2 mb-1">
           <span className="text-[7px] text-muted uppercase font-bold w-12">Membro</span>
           <span className="text-[7px] text-muted uppercase font-bold flex-1 text-center">Esq.</span>
           <span className="text-[7px] text-muted uppercase font-bold flex-1 text-center">Dir.</span>
         </div>
         <div className="flex justify-between items-baseline px-2 py-0.5">
           <span className="text-[9px] text-main font-bold uppercase w-12">Braço</span>
           <span className="text-[10px] font-black text-main dark:text-white flex-1 text-center">{b.arm_left || '--'}</span>
           <span className="text-[10px] font-black text-main dark:text-white flex-1 text-center">{b.arm_right || '--'}</span>
         </div>
         <div className="flex justify-between items-baseline px-2 py-0.5">
           <span className="text-[9px] text-main font-bold uppercase w-12">Coxa</span>
           <span className="text-[10px] font-black text-main dark:text-white flex-1 text-center">{b.leg_left || '--'}</span>
           <span className="text-[10px] font-black text-main dark:text-white flex-1 text-center">{b.leg_right || '--'}</span>
         </div>
         {/* 🔥 A PANTURRILHA ENTROU AQUI */}
         <div className="flex justify-between items-baseline px-2 py-0.5">
           <span className="text-[9px] text-main font-bold uppercase w-12">Pantur.</span>
           <span className="text-[10px] font-black text-main dark:text-white flex-1 text-center">{b.calf_left || '--'}</span>
           <span className="text-[10px] font-black text-main dark:text-white flex-1 text-center">{b.calf_right || '--'}</span>
         </div>
      </div>
      {b.note && (
        <div className="mt-2 p-2 bg-warning/10 rounded-lg border border-warning/20 text-[10px] text-muted flex items-start gap-1.5">
          <FileText size={12} className="text-warning shrink-0 mt-0.5" />
          <span className="line-clamp-2 leading-snug">"{b.note}"</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="shrink-0 space-y-3 pt-2 pb-4 border-b border-border">
      {/* CABEÇALHO */}
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

      {/* VITRINE: OS 3 ÚLTIMOS REGISTROS */}
      <div className="flex gap-4 overflow-x-auto pb-2 pt-1 px-1 scrollbar-hide items-start">
        {sortedBody.length === 0 && !showBioForm && (
          <div className="text-xs text-muted p-4 w-full text-center border border-dashed border-border rounded-xl font-bold uppercase tracking-widest">
            Nenhum scan corporal registrado.
          </div>
        )}
        
        {recentHistory.map((b) => (
          <div 
            key={b.id} 
            className="min-w-[300px] max-w-[320px] bg-card border-2 border-secondary/20 pt-4 px-4 rounded-2xl shadow-md dark:shadow-xl relative group hover:border-secondary/50 transition-all shrink-0 flex flex-col gap-3 animate-in fade-in slide-in-from-left-4 duration-300"
          >
            <div className="flex justify-between items-center border-b border-border/50 pb-2">
              <span className="font-black text-secondary text-xs tracking-widest flex items-center gap-1.5">
                <CalendarDays size={14} /> {b.date}
              </span>
              <div className="flex gap-3">
                <button onClick={() => handleEditBio(b)} className="text-muted hover:text-primary transition-colors" title="Editar"><Pencil size={14} /></button>
                <button onClick={() => requestDelete(b.id, 'body')} className="text-muted hover:text-red-500 transition-colors" title="Apagar"><Trash2 size={14} /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
               <div className="flex flex-col items-center justify-center p-2 bg-input/80 dark:bg-black/30 rounded-xl border border-border/30 shadow-sm">
                 <span className="text-[8px] text-muted uppercase font-bold tracking-widest">Peso</span>
                 <span className="text-sm font-black text-success mt-0.5">{b.weight || '--'}<span className="text-[8px] text-muted ml-0.5 font-normal">kg</span></span>
               </div>
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
            
            <button 
              onClick={() => setExpandedCardId(expandedCardId === b.id ? null : b.id)}
              className="mt-2 text-[9px] text-muted hover:text-primary transition-colors py-3 border-t border-border/30 w-full flex items-center justify-center gap-1 uppercase font-black tracking-widest"
            >
              {expandedCardId === b.id ? <><ChevronUp size={12} /> Ocultar Medidas</> : <><ChevronDown size={12} /> Ver Medidas Completas</>}
            </button>

            {expandedCardId === b.id && (
              <div className="-mx-4 -mb-0">
                 <ExpandedStats b={b} isCard={true} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* BOTÃO DO ARQUIVO */}
      {olderHistoryCount > 0 && (
        <button 
          onClick={() => setIsArchiveOpen(!isArchiveOpen)}
          className={`w-full py-3 mt-2 rounded-xl border flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${isArchiveOpen ? 'bg-input border-border text-muted' : 'bg-card border-dashed border-primary/40 text-primary hover:bg-primary/5'}`}
        >
          <Archive size={14} />
          {isArchiveOpen ? 'Ocultar Arquivo Antigo' : `Acessar Arquivo Completo (${olderHistoryCount} Ocultos)`}
        </button>
      )}

      {/* ARQUIVO EXPANSÍVEL (Extrato Vertical) */}
      {isArchiveOpen && (
        <div className="mt-4 space-y-2 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-center gap-2 mb-3 px-2">
            <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Registos Anteriores</h4>
            <div className="h-px bg-border flex-1"></div>
          </div>

          {sortedBody.slice(RECENT_LIMIT).map((b) => {
            const isExpanded = expandedRowId === b.id;
            return (
              <div key={b.id} className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-300">
                <div 
                  onClick={() => setExpandedRowId(isExpanded ? null : b.id)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-input/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-16 text-[10px] font-black text-main dark:text-white">{b.date}</span>
                    <div className="flex gap-3 text-[10px] font-bold">
                      <span className="text-success">{b.weight}kg</span>
                      <span className={getBfColorClass(b.bf)}>{b.bf}% BF</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                     <div className="flex gap-2">
                       <button onClick={(e) => { e.stopPropagation(); handleEditBio(b); }} className="text-muted hover:text-primary transition-colors p-1"><Pencil size={12} /></button>
                       <button onClick={(e) => { e.stopPropagation(); requestDelete(b.id, 'body'); }} className="text-muted hover:text-red-500 transition-colors p-1"><Trash2 size={12} /></button>
                     </div>
                     <div className="text-muted bg-input rounded-full p-1">
                       {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                     </div>
                  </div>
                </div>

                {isExpanded && <ExpandedStats b={b} isCard={false} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BodyScanner;