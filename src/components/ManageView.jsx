import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Settings, Save, Search, X, Dumbbell, CheckSquare, Square, AlertTriangle } from 'lucide-react';

const EXERCISE_CATALOG = {
  Peito: ["Supino Reto (Barra)", "Supino Reto (Halter)", "Supino Inclinado (Barra)", "Supino Inclinado (Halter)", "Crucifixo no Crossover", "Crucifixo (Halter)", "Voador (Peck Deck)", "Flexão de Braço", "Pullover", "Crossover Polia Alta", "Crossover Polia Baixa", "Supino Declinado"],
  Costas: ["Puxada Frontal (Pulley)", "Puxada Triângulo", "Remada Curvada", "Remada Baixa", "Remada Unilateral (Serrote)", "Remada Cavalinho", "Pull-down", "Barra Fixa", "Levantamento Terra"],
  Pernas: ["Agachamento Livre", "Agachamento Hack", "Agachamento Búlgaro", "Leg Press 45º", "Leg Press Horizontal", "Cadeira Extensora", "Mesa Flexora", "Cadeira Flexora", "Stiff", "Levantamento Terra Romeno (RDL)", "Elevação Pélvica", "Cadeira Abdutora", "Cadeira Adutora", "Panturrilha em Pé", "Panturrilha Sentado"],
  Ombros: ["Desenvolvimento (Barra)", "Desenvolvimento (Halter)", "Desenvolvimento Máquina", "Elevação Lateral (Halter)", "Elevação Lateral (Polia)", "Elevação Frontal", "Encolhimento", "Crucifixo Invertido", "Face Pull"],
  Braços: ["Rosca Direta (Barra)", "Rosca Alternada (Halter)", "Rosca Martelo", "Rosca Scott", "Rosca na Polia", "Tríceps Pulley (Barra)", "Tríceps Pulley (Corda)", "Tríceps Testa", "Tríceps Francês", "Tríceps Coice", "Mergulho (Paralelas)"],
  Core: ["Prancha Isométrica", "Abdominal Supra", "Abdominal Infra", "Abdominal Infra na Barra", "Giro Russo (Russian Twist)", "Abdominal Máquina", "Roda Abdominal"],
  Cardio: ["Esteira", "Bicicleta Ergométrica", "Bicicleta Spinning", "Elíptico", "Escada", "Pular Corda", "Remo Seco", "Corrida Livre"]
};

const ManageView = ({ 
  activeDay, setActiveDay, addDay, removeDay, workoutData, addExercise, 
  removeExercise, editExerciseBase, setView, addFromCatalog 
}) => {
  
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Peito');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modais Customizados
  const [isAddDayModalOpen, setIsAddDayModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newDayInput, setNewDayInput] = useState('');

  const openCatalog = () => {
    setSelectedExercises([]);
    setSearchQuery('');
    setIsCatalogOpen(true);
  };

  const toggleSelection = (exercise) => {
    setSelectedExercises(prev => prev.includes(exercise) ? prev.filter(e => e !== exercise) : [...prev, exercise]);
  };

  const confirmSelection = () => {
    if (selectedExercises.length > 0 && addFromCatalog) {
      addFromCatalog(activeDay, selectedExercises);
    }
    setIsCatalogOpen(false);
  };

  const getFilteredExercises = () => {
    if (!searchQuery) return EXERCISE_CATALOG[activeTab];
    const allEx = Object.values(EXERCISE_CATALOG).flat();
    return allEx.filter(ex => ex.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const openAddDayModal = () => {
    setNewDayInput('');
    setIsAddDayModalOpen(true);
  };

  const confirmAddDay = () => {
    if (newDayInput && newDayInput.trim() !== "") {
      const upperName = newDayInput.trim().toUpperCase();
      addDay(upperName);
      setActiveDay(upperName);
    }
    setIsAddDayModalOpen(false);
  };

  const requestDeleteDay = () => {
    if (Object.keys(workoutData).length <= 1) {
      return;
    }
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteDay = () => {
    removeDay(activeDay);
    const remaining = Object.keys(workoutData).filter(d => d !== activeDay);
    setActiveDay(remaining[0]);
    setIsDeleteModalOpen(false);
  };

  return (
    <main className="space-y-6 animate-in slide-in-from-right duration-500 font-cyber pb-24 relative">
      
      {/* SELETOR DE PROTOCOLOS */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {Object.keys(workoutData).map(day => (
          <button 
            key={day} 
            onClick={() => setActiveDay(day)}
            className={`px-4 py-3 rounded-xl font-black text-sm uppercase tracking-widest whitespace-nowrap transition-all border-2 ${activeDay === day ? 'bg-primary border-primary text-black scale-105 shadow-[0_0_15px_rgba(var(--primary),0.3)]' : 'bg-card border-border text-muted hover:border-primary/50'}`}
          >
            {day}
          </button>
        ))}
        <button 
          onClick={openAddDayModal}
          className="px-4 py-3 rounded-xl font-black text-sm uppercase tracking-widest whitespace-nowrap transition-all border-2 border-dashed border-success/50 bg-success/10 text-success hover:bg-success hover:text-black flex items-center gap-1"
        >
          <Plus size={16} /> NOVO
        </button>
      </div>

      {/* Header de Configuração */}
      <div className="flex justify-between items-center border-b border-secondary/30 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-secondary animate-[spin_4s_linear_infinite]" />
          <h2 className="text-lg font-black italic uppercase tracking-tighter neon-text-cyan text-primary">
            EDITANDO: <span className="text-secondary">{activeDay}</span>
          </h2>
        </div>
        <div className="flex gap-2">
          <button onClick={requestDeleteDay} className="bg-red-500/10 border border-red-500/50 p-2 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95" title="Apagar Protocolo">
            <Trash2 size={18} strokeWidth={2} />
          </button>
          
          {/* 🔥 TRAVA: O botão [+] só aparece se NÃO for a aba INÍCIO */}
          {activeDay !== 'INÍCIO' && (
            <button onClick={() => addExercise(activeDay)} className="bg-success/10 border border-success/50 p-2 rounded-lg text-success hover:bg-success hover:text-black transition-all shadow-[0_0_10px_rgba(var(--success),0.2)] active:scale-95" title="Adicionar Exercício Manualmente">
              <Plus size={18} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      {/* 🔥 TRAVA DE SEGURANÇA NA LISTA DE EXERCÍCIOS */}
      {activeDay === 'INÍCIO' ? (
        <div className="mt-8 p-6 border-2 border-dashed border-red-500/30 rounded-xl text-center bg-red-500/5 animate-pulse">
          <span className="text-xs font-black uppercase text-red-500 tracking-widest block mb-2">
            ⚠️ ACESSO NEGADO
          </span>
          <span className="text-[10px] font-bold uppercase text-muted tracking-widest">
            Este é um protocolo do sistema. Crie um + NOVO protocolo para equipar armamentos.
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {(workoutData[activeDay]?.exercises || []).map((ex, i) => (
            <div key={i} className="bg-card border border-border p-3 rounded-xl relative group transition-all hover:border-primary/50 overflow-hidden shadow-sm">
              <div className="absolute top-0 left-0 w-1 h-0 group-hover:h-full bg-primary transition-all duration-300"></div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.1em] ml-1">Identificação</label>
                  <input 
                    className="bg-input/50 border-b border-border focus:border-primary text-main font-bold text-sm w-full outline-none p-2 rounded-t transition-all placeholder-muted/50 uppercase" 
                    value={ex.name} 
                    onChange={(e) => editExerciseBase(activeDay, i, 'name', e.target.value)} 
                  />
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-black text-muted uppercase tracking-[0.1em] ml-1">Meta</label>
                    <input 
                      className="bg-input border border-border focus:border-secondary text-secondary text-sm font-black p-2 rounded-lg w-full outline-none transition-all uppercase placeholder-muted/30" 
                      value={ex.sets} 
                      onChange={(e) => editExerciseBase(activeDay, i, 'sets', e.target.value)} 
                    />
                  </div>
                  <button onClick={() => removeExercise(activeDay, i)} className="bg-input border border-red-500/30 text-red-500 p-2 hover:bg-red-500 hover:text-white rounded-lg transition-all shadow-sm active:scale-95">
                    <Trash2 size={18}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={openCatalog} className="w-full mt-4 py-4 border-2 border-dashed border-primary/50 text-primary bg-primary/5 hover:bg-primary/10 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95">
            <Search size={18} /> Acessar Arsenal de Combate
          </button>
        </div>
      )}

      <div className="pt-4">
        <button onClick={() => setView('workout')} className="w-full py-4 bg-gradient-to-r from-primary to-secondary hover:brightness-110 rounded-xl font-black text-white shadow-[0_5px_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] active:scale-95 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 italic">
          <Save size={16} /> EFETIVAR ALTERAÇÕES
        </button>
      </div>

      {/* MODAL DO ARSENAL */}
      {isCatalogOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex flex-col justify-end p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCatalogOpen(false)}></div>
          <div className="bg-card border-t-2 sm:border-2 border-primary w-full max-w-lg mx-auto rounded-t-3xl sm:rounded-3xl shadow-[0_-10px_40px_rgba(var(--primary),0.2)] relative z-10 overflow-hidden animate-in slide-in-from-bottom-full duration-300 flex flex-col max-h-[85vh]">
            <div className="bg-black/50 p-4 border-b border-border flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Dumbbell className="text-primary" size={20} />
                <h3 className="font-black uppercase tracking-widest text-sm text-primary">Arsenal de Combate</h3>
              </div>
              <button onClick={() => setIsCatalogOpen(false)} className="text-muted hover:text-white p-1"><X size={24} /></button>
            </div>
            
            <div className="p-4 shrink-0 border-b border-border bg-input/20">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-muted" size={18} />
                <input type="text" placeholder="Buscar exercício..." className="w-full bg-input border-2 border-border p-3 pl-10 rounded-xl outline-none focus:border-primary text-sm font-bold uppercase transition-all placeholder-muted/50" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            {!searchQuery && (
              <div className="flex overflow-x-auto p-2 gap-2 border-b border-border shrink-0 scrollbar-hide">
                {Object.keys(EXERCISE_CATALOG).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab ? 'bg-primary text-black' : 'bg-input/50 text-muted hover:text-white border border-border'}`}> {tab} </button>
                ))}
              </div>
            )}
            <div className="overflow-y-auto p-4 space-y-2 flex-1 min-h-[40vh]">
              {getFilteredExercises().map((ex, idx) => {
                const isSelected = selectedExercises.includes(ex);
                return (
                  <div key={idx} onClick={() => toggleSelection(ex)} className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border-2 ${isSelected ? 'border-primary bg-primary/10 shadow-[0_0_10px_rgba(var(--primary),0.2)]' : 'border-border bg-card hover:border-primary/50'}`}>
                    <span className={`font-bold text-xs uppercase ${isSelected ? 'text-primary' : 'text-main'}`}>{ex}</span>
                    {isSelected ? <CheckSquare className="text-primary" size={20} /> : <Square className="text-muted" size={20} />}
                  </div>
                );
              })}
              {getFilteredExercises().length === 0 && (
                <div className="text-center p-8 opacity-50"><span className="font-black uppercase tracking-widest text-xs">Armamento não encontrado</span></div>
              )}
            </div>
            <div className="p-4 bg-black/80 border-t border-border shrink-0 backdrop-blur-md">
              <button onClick={confirmSelection} disabled={selectedExercises.length === 0} className="w-full bg-primary text-black font-black uppercase tracking-widest p-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                {selectedExercises.length > 0 ? `EQUIPAR ${selectedExercises.length} EXERCÍCIO${selectedExercises.length > 1 ? 'S' : ''}` : 'SELECIONE NO ARSENAL'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL NOVO PROTOCOLO */}
      {isAddDayModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAddDayModalOpen(false)}></div>
          <div className="bg-card border-2 border-primary w-full max-w-sm p-6 rounded-2xl shadow-[0_0_30px_rgba(var(--primary),0.3)] relative z-10 animate-in zoom-in-95 duration-200">
            <h3 className="font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2"><Plus size={18} /> Novo Protocolo</h3>
            <input autoFocus type="text" placeholder="EX: A, B, PUSH..." className="w-full bg-input border-2 border-border p-4 rounded-xl outline-none focus:border-primary text-main font-black uppercase transition-all placeholder-muted/50 mb-6 text-center tracking-widest" value={newDayInput} onChange={(e) => setNewDayInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmAddDay()} />
            <div className="flex gap-3">
              <button onClick={() => setIsAddDayModalOpen(false)} className="flex-1 p-3 rounded-xl border border-border text-muted font-bold uppercase text-xs hover:text-white transition-all">Cancelar</button>
              <button onClick={confirmAddDay} className="flex-1 p-3 rounded-xl bg-primary text-black font-black uppercase text-xs hover:scale-105 transition-all shadow-[0_0_15px_rgba(var(--primary),0.4)]">Criar</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {isDeleteModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="bg-card border-2 border-red-500 w-full max-w-sm p-8 rounded-3xl shadow-[0_0_40px_rgba(239,68,68,0.2)] relative z-10 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <AlertTriangle size={32} />
            </div>
            <h3 className="font-black uppercase tracking-widest text-red-500 mb-2 text-xl">Confirmar Exclusão</h3>
            <p className="text-muted text-sm font-bold mb-8 uppercase tracking-tighter">
              Você está prestes a apagar o protocolo <span className="text-white">"{activeDay}"</span> e todos os seus exercícios. Esta ação é irreversível.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDeleteDay} className="w-full p-4 rounded-xl bg-red-500 text-white font-black uppercase text-xs hover:bg-red-600 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] active:scale-95">
                DESTRUIR PROTOCOLO
              </button>
              <button onClick={() => setIsDeleteModalOpen(false)} className="w-full p-4 rounded-xl border border-border text-muted font-black uppercase text-xs hover:text-white transition-all">
                ABORTAR MISSÃO
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </main>
  );
};

export default ManageView;