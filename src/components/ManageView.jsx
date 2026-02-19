import React, { useState } from 'react';
import { Plus, Trash2, Settings, Save, Search, X, Dumbbell, CheckSquare, Square } from 'lucide-react';

// 🔥 O CATÁLOGO MESTRE (O "Supermercado" de Exercícios)
const EXERCISE_CATALOG = {
  Peito: ["Supino Reto", "Supino Inclinado", "Crucifixo no Crossover", "Voador (Peck Deck)", "Flexão de Braço"],
  Costas: ["Puxada Frontal (Pulley)", "Remada Curvada", "Remada Baixa", "Pull-down", "Barra Fixa"],
  Pernas: ["Agachamento Livre", "Leg Press 45º", "Cadeira Extensora", "Mesa Flexora", "Cadeira Abdutora", "Panturrilha"],
  Ombros: ["Desenvolvimento", "Elevação Lateral", "Elevação Frontal", "Encolhimento", "Crucifixo Invertido"],
  Braços: ["Rosca Direta", "Rosca Martelo", "Rosca Scott", "Tríceps Pulley", "Tríceps Testa", "Tríceps Frances"],
  Core: ["Prancha Isométrica", "Abdominal Supra", "Abdominal Infra na Barra", "Giro Russo (Russian Twist)"]
};

// 🔥 NOTE A NOVA PROP: addFromCatalog
const ManageView = ({ activeDay, workoutData, addExercise, removeExercise, editExerciseBase, setView, addFromCatalog }) => {
  
  // Estados do Modal do Construtor Rápido
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Peito');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const openCatalog = () => {
    setSelectedExercises([]);
    setSearchQuery('');
    setIsCatalogOpen(true);
  };

  const toggleSelection = (exercise) => {
    setSelectedExercises(prev => 
      prev.includes(exercise) ? prev.filter(e => e !== exercise) : [...prev, exercise]
    );
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

  return (
    <main className="space-y-6 animate-in slide-in-from-right duration-500 font-cyber pb-24 relative">
      
      {/* Header de Configuração Compacto */}
      <div className="flex justify-between items-center border-b border-secondary/30 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-secondary animate-[spin_4s_linear_infinite]" />
          <h2 className="text-lg font-black italic uppercase tracking-tighter neon-text-cyan text-primary">
            PROTOCOLO: <span className="text-secondary">{activeDay}</span>
          </h2>
        </div>
        <button 
          onClick={() => addExercise(activeDay)} 
          className="bg-success/10 border border-success/50 p-2 rounded-lg text-success hover:bg-success hover:text-black transition-all shadow-[0_0_10px_rgba(var(--success),0.2)] active:scale-95"
          title="Adicionar Manualmente"
        >
          <Plus size={18} strokeWidth={3} />
        </button>
      </div>

      {/* Cards de Edição de Exercício Compactos (O SEU CÓDIGO INTACTO) */}
      <div className="space-y-3">
        {workoutData[activeDay].exercises.map((ex, i) => (
          <div key={i} className="bg-card border border-border p-3 rounded-xl relative group transition-all hover:border-primary/50 overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-1 h-0 group-hover:h-full bg-primary transition-all duration-300"></div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-[0.1em] ml-1">Identificação do Exercício</label>
                <input 
                  className="bg-input/50 border-b border-border focus:border-primary text-main font-bold text-sm w-full outline-none p-2 rounded-t transition-all placeholder-muted/50 uppercase" 
                  value={ex.name} 
                  placeholder="EX: SUPINO RETO"
                  onChange={(e) => editExerciseBase(activeDay, i, 'name', e.target.value)} 
                />
              </div>
              
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.1em] ml-1">Meta</label>
                  <input 
                    className="bg-input border border-border focus:border-secondary text-secondary text-sm font-black p-2 rounded-lg w-full outline-none transition-all uppercase placeholder-muted/30" 
                    value={ex.sets} 
                    placeholder="EX: 4X12"
                    onChange={(e) => editExerciseBase(activeDay, i, 'sets', e.target.value)} 
                  />
                </div>
                
                <button 
                  onClick={() => removeExercise(activeDay, i)} 
                  className="bg-input border border-red-500/30 text-red-500 p-2 hover:bg-red-500 hover:text-white rounded-lg transition-all shadow-sm active:scale-95"
                >
                  <Trash2 size={18}/>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* 🔥 BOTÃO DO CONSTRUTOR RÁPIDO 🔥 */}
        <button 
          onClick={openCatalog}
          className="w-full mt-4 py-4 border-2 border-dashed border-primary/50 text-primary bg-primary/5 hover:bg-primary/10 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Search size={18} /> Acessar Arsenal de Combate
        </button>
      </div>

      {/* Ação Final de Persistência */}
      <div className="pt-4">
        <button 
          onClick={() => setView('workout')} 
          className="w-full py-4 bg-gradient-to-r from-primary to-secondary hover:brightness-110 rounded-xl font-black text-white shadow-[0_5px_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] active:scale-95 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 italic"
        >
          <Save size={16} /> EFETIVAR ALTERAÇÕES
        </button>
        
        <p className="text-[8px] text-muted text-center mt-4 uppercase font-black tracking-widest leading-relaxed opacity-60">
          * As alterações serão propagadas para o buffer de memória local.
        </p>
      </div>

      {/* ========================================== */}
      {/* 🔥 MODAL DO CATÁLOGO DE EXERCÍCIOS 🔥 */}
      {/* ========================================== */}
      {isCatalogOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCatalogOpen(false)}></div>
          
          <div className="bg-card border-t-2 sm:border-2 border-primary w-full max-w-lg mx-auto rounded-t-3xl sm:rounded-3xl shadow-[0_-10px_40px_rgba(var(--primary),0.2)] relative z-10 overflow-hidden animate-in slide-in-from-bottom-full duration-300 flex flex-col max-h-[85vh]">
            
            <div className="bg-black/50 p-4 border-b border-border flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Dumbbell className="text-primary" size={20} />
                <h3 className="font-black uppercase tracking-widest text-sm text-primary">Arsenal de Combate</h3>
              </div>
              <button onClick={() => setIsCatalogOpen(false)} className="text-muted hover:text-white p-1">
                <X size={24} />
              </button>
            </div>

            <div className="p-4 shrink-0 border-b border-border bg-input/20">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-muted" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar exercício..." 
                  className="w-full bg-input border-2 border-border p-3 pl-10 rounded-xl outline-none focus:border-primary text-sm font-bold uppercase transition-all placeholder-muted/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {!searchQuery && (
              <div className="flex overflow-x-auto p-2 gap-2 border-b border-border shrink-0 scrollbar-hide">
                {Object.keys(EXERCISE_CATALOG).map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab ? 'bg-primary text-black' : 'bg-input/50 text-muted hover:text-white border border-border'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            <div className="overflow-y-auto p-4 space-y-2 flex-1 min-h-[40vh]">
              {getFilteredExercises().map((ex, idx) => {
                const isSelected = selectedExercises.includes(ex);
                return (
                  <div 
                    key={idx}
                    onClick={() => toggleSelection(ex)}
                    className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border-2 ${isSelected ? 'border-primary bg-primary/10 shadow-[0_0_10px_rgba(var(--primary),0.2)]' : 'border-border bg-card hover:border-primary/50'}`}
                  >
                    <span className={`font-bold text-xs uppercase ${isSelected ? 'text-primary' : 'text-main'}`}>{ex}</span>
                    {isSelected ? <CheckSquare className="text-primary" size={20} /> : <Square className="text-muted" size={20} />}
                  </div>
                );
              })}
              {getFilteredExercises().length === 0 && (
                <div className="text-center p-8 opacity-50">
                  <span className="font-black uppercase tracking-widest text-xs">Armamento não encontrado</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-black/80 border-t border-border shrink-0 backdrop-blur-md">
              <button 
                onClick={confirmSelection}
                disabled={selectedExercises.length === 0}
                className="w-full bg-primary text-black font-black uppercase tracking-widest p-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(var(--primary),0.3)]"
              >
                {selectedExercises.length > 0 
                  ? `EQUIPAR ${selectedExercises.length} EXERCÍCIO${selectedExercises.length > 1 ? 'S' : ''}` 
                  : 'SELECIONE NO ARSENAL'}
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
};

export default ManageView;