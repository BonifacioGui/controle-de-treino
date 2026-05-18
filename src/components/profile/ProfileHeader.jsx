import React from 'react';
import { Settings, User, Camera, Crosshair, Fingerprint } from 'lucide-react';
import UserLevel from '../rpg/UserLevel';

const ProfileHeader = ({ 
  userMetadata, 
  avatarUrl, 
  handleImageUpload, 
  setIsEditing, 
  goalProgress, 
  isGoalMet, 
  displayClass, 
  history,
  stats
}) => {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* 🔥 ID CARD CYBERPUNK ADAPTÁVEL */}
      <div 
        className="bg-card border border-primary/40 p-6 relative shadow-[0_0_20px_rgba(var(--primary),0.1)] mt-2 transition-colors group/profile"
        style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}
      >
        {/* Scanlines táticas no fundo */}
        <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(rgba(var(--primary),0.03)_1px,transparent_1px)] bg-[size:100%_4px]"></div>
        
        {/* Brilho de Fundo Dinâmico */}
        <div className="absolute top-[-20%] left-[-10%] w-40 h-40 bg-primary/10 rounded-full blur-[50px] pointer-events-none"></div>
        
        {/* Detalhes UI nos cantos */}
        <div className="absolute top-0 left-0 w-8 h-1 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]"></div>
        <div className="absolute bottom-0 right-0 w-12 h-1 bg-secondary shadow-[0_0_8px_rgba(var(--secondary),0.8)]"></div>

        {/* 🔥 BOTÃO DE CONFIGURAÇÃO CORRIGIDO (Puxa as variáveis do tema e remove o bloco preto) */}
        <button 
          onClick={() => setIsEditing(true)} 
          className="absolute top-4 right-4 z-30 p-2.5 bg-input border border-primary/30 text-primary hover:bg-primary/20 hover:border-primary transition-all shadow-[0_0_10px_rgba(var(--primary),0.1)] active:scale-95 flex items-center justify-center"
          style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
          title="Acessar Configurações"
        >
          <Settings size={18} className="group-hover/profile:rotate-90 transition-transform duration-700" />
        </button>

        {/* Info do Usuário */}
        <div className="flex items-center gap-5 relative z-10 mb-5">
          
          {/* Avatar com frame Sci-Fi adaptável */}
          <div className="relative w-24 h-24 shrink-0 cursor-pointer z-20 group">
            <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <label 
              htmlFor="avatar-upload" 
              className="block w-full h-full bg-input border-2 border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.2)] overflow-hidden cursor-pointer transition-all group-hover:border-primary group-hover:shadow-[0_0_20px_rgba(var(--primary),0.5)] relative"
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-input/30">
                  <User size={40} className="text-primary/50 group-hover:text-primary transition-colors" />
                </div>
              )}
              
              {/* Overlay de Câmera */}
              <div className="absolute inset-0 bg-page/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                <Camera size={24} className="text-primary mb-1 drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                <span className="text-[8px] font-black text-primary uppercase tracking-widest">ALTERAR</span>
              </div>
            </label>
            
            {/* Mira tática em volta do avatar */}
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-secondary pointer-events-none"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-secondary pointer-events-none"></div>
          </div>

          <div className="flex-1 min-w-0 pr-12">
            <div className="flex items-center gap-1.5 mb-1 opacity-70">
              <Fingerprint size={10} className="text-primary" />
              <span className="text-[8px] font-mono font-black text-primary uppercase tracking-[0.3em]">ID Confirmada</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-main dark:text-white drop-shadow-[0_0_5px_rgba(var(--text-main),0.1)] dark:drop-shadow-[0_0_5px_rgba(255,255,255,0.3)] truncate leading-none">
              {userMetadata?.username || 'SOLDADO_X'}
            </h2>
            
            {/* Badge da Classe RPG */}
            <div className="inline-flex items-center mt-2 bg-secondary/10 border border-secondary/40 px-2 py-0.5 shadow-[0_0_10px_rgba(var(--secondary),0.1)]" style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}>
              <span className="text-secondary text-[10px] font-black uppercase tracking-widest drop-shadow-[0_0_5px_rgba(var(--secondary),0.5)]">
                {displayClass}
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Operação (Metas) */}
        {userMetadata?.target_weight && (
          <div className="relative z-10 pt-4 mt-2 border-t border-primary/10">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-[9px] font-black text-muted uppercase tracking-widest flex items-center gap-1.5">
                <Crosshair size={12} className={isGoalMet ? "text-success" : "text-primary animate-pulse"} /> 
                OBJETIVO: {userMetadata.target_weight}KG
              </span>
              <span className={`text-xs font-black font-mono ${isGoalMet ? 'text-success drop-shadow-[0_0_5px_rgba(var(--success),0.6)]' : 'text-primary'}`}>
                {goalProgress}%
              </span>
            </div>
            
            <div className="w-full bg-input rounded-sm h-1.5 overflow-hidden border border-primary/20">
              <div 
                className={`h-full transition-all duration-1000 relative ${
                  isGoalMet 
                    ? 'bg-gradient-to-r from-success/50 to-success shadow-[0_0_15px_rgba(var(--success),0.8)]' 
                    : 'bg-gradient-to-r from-primary/50 via-primary to-secondary shadow-[0_0_10px_rgba(var(--primary),0.6)]'
                }`} 
                style={{ width: `${goalProgress}%` }}
              >
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/50 blur-[2px]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Componente de Nível e XP renderizado logo abaixo */}
      <UserLevel stats={stats} />
    </div>
  );
};

export default ProfileHeader;