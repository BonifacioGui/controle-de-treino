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
  stats
}) => {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      
      <div 
        className="group/profile relative mt-2 border border-primary/40 bg-card p-4 shadow-[0_0_20px_rgba(var(--primary),0.1)] transition-colors min-[380px]:p-6"
        style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}
      >
        {/* Scanlines táticas no fundo */}
        <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(rgba(var(--primary),0.03)_1px,transparent_1px)] bg-[size:100%_4px]"></div>
        
        {/* Brilho de Fundo Dinâmico */}
        <div className="absolute top-[-20%] left-[-10%] w-40 h-40 bg-primary/10 rounded-full blur-[50px] pointer-events-none"></div>
        
        {/* Detalhes UI nos cantos */}
        <div className="absolute top-0 left-0 w-8 h-1 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]"></div>
        <div className="absolute bottom-0 right-0 w-12 h-1 bg-secondary shadow-[0_0_8px_rgba(var(--secondary),0.8)]"></div>

        <button 
          onClick={() => setIsEditing(true)} 
          className="absolute right-3 top-3 z-30 flex items-center justify-center border border-primary/30 bg-input p-2.5 text-primary shadow-[0_0_10px_rgba(var(--primary),0.1)] transition-all hover:border-primary hover:bg-primary/20 active:scale-95 min-[380px]:right-4 min-[380px]:top-4"
          style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
          title="Acessar Configurações"
        >
          <Settings size={18} className="group-hover/profile:rotate-90 transition-transform duration-700" />
        </button>

        {/* Info do Usuário */}
        <div className="relative z-10 mb-5 flex items-start gap-3 min-[380px]:items-center min-[380px]:gap-5">
          
          {/* Avatar com frame Sci-Fi adaptável */}
          <div className="group relative z-20 h-20 w-20 shrink-0 cursor-pointer min-[380px]:h-24 min-[380px]:w-24">
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

          <div className="min-w-0 flex-1 pr-8 min-[380px]:pr-10">
            <div className="flex items-center gap-1.5 mb-1 opacity-70">
              <Fingerprint size={10} className="text-primary" />
              <span className="text-[8px] font-mono font-black text-primary uppercase tracking-[0.3em]">ID Confirmada</span>
            </div>
            
            <h2 className="break-normal font-cyber text-base font-black uppercase leading-tight tracking-tighter text-main drop-shadow-[0_0_5px_rgba(var(--text-main),0.1)] min-[360px]:text-xl min-[390px]:text-2xl sm:text-3xl dark:text-white dark:drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
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
                <Crosshair size={12} className={isGoalMet ? "text-success" : "text-primary"} />
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
