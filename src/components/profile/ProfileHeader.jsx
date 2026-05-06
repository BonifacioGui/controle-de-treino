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
      
      {/* 🔥 ID CARD CYBERPUNK */}
      <div 
        className="bg-card dark:bg-[#050B14] border border-[#00f3ff]/40 p-6 relative shadow-[0_0_20px_rgba(0,243,255,0.1)] mt-2 transition-colors group/profile"
        style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}
      >
        {/* Scanlines táticas no fundo */}
        <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(rgba(0,243,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px]"></div>
        
        {/* Brilho de Fundo Ciano */}
        <div className="absolute top-[-20%] left-[-10%] w-40 h-40 bg-[#00f3ff]/10 rounded-full blur-[50px] pointer-events-none"></div>
        
        {/* Detalhes UI nos cantos */}
        <div className="absolute top-0 left-0 w-8 h-1 bg-[#00f3ff] shadow-[0_0_8px_rgba(0,243,255,0.8)]"></div>
        <div className="absolute bottom-0 right-0 w-12 h-1 bg-[#ff00ff] shadow-[0_0_8px_rgba(255,0,255,0.8)]"></div>

        {/* Botão de Configuração (Acesso ao Sistema) */}
        <button 
          onClick={() => setIsEditing(true)} 
          className="absolute top-4 right-4 z-30 p-2.5 bg-[#0a0f16] border border-[#00f3ff]/30 text-[#00f3ff] hover:bg-[#00f3ff]/20 hover:border-[#00f3ff] transition-all shadow-[0_0_10px_rgba(0,243,255,0.1)] active:scale-95 flex items-center justify-center"
          style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
        >
          <Settings size={18} className="group-hover/profile:rotate-90 transition-transform duration-700" />
        </button>

        {/* Info do Usuário */}
        <div className="flex items-center gap-5 relative z-10 mb-5">
          
          {/* Avatar com frame Sci-Fi */}
          <div className="relative w-24 h-24 shrink-0 cursor-pointer z-20 group">
            <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <label 
              htmlFor="avatar-upload" 
              className="block w-full h-full bg-[#0a0f16] border-2 border-[#00f3ff]/50 shadow-[0_0_15px_rgba(0,243,255,0.2)] overflow-hidden cursor-pointer transition-all group-hover:border-[#00f3ff] group-hover:shadow-[0_0_20px_rgba(0,243,255,0.5)] relative"
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-input/50">
                  <User size={40} className="text-[#00f3ff]/50 group-hover:text-[#00f3ff] transition-colors" />
                </div>
              )}
              
              {/* Overlay de Câmera */}
              <div className="absolute inset-0 bg-[#050B14]/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                <Camera size={24} className="text-[#00f3ff] mb-1 drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]" />
                <span className="text-[8px] font-black text-[#00f3ff] uppercase tracking-widest">ALTERAR</span>
              </div>
            </label>
            
            {/* Mira tática em volta do avatar */}
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-[#ff00ff] pointer-events-none"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-[#ff00ff] pointer-events-none"></div>
          </div>

          <div className="flex-1 min-w-0 pr-12">
            <div className="flex items-center gap-1.5 mb-1 opacity-70">
              <Fingerprint size={10} className="text-[#00f3ff]" />
              <span className="text-[8px] font-mono font-black text-[#00f3ff] uppercase tracking-[0.3em]">ID Confirmada</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-main dark:text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)] truncate leading-none">
              {userMetadata?.username || 'SOLDADO_X'}
            </h2>
            
            {/* Badge da Classe RPG */}
            <div className="inline-flex items-center mt-2 bg-[#ff00ff]/10 border border-[#ff00ff]/40 px-2 py-0.5 shadow-[0_0_10px_rgba(255,0,255,0.1)]" style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}>
              <span className="text-[#ff00ff] text-[10px] font-black uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,0,255,0.5)]">
                {displayClass}
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Operação (Metas) */}
        {userMetadata?.target_weight && (
          <div className="relative z-10 pt-4 mt-2 border-t border-[#00f3ff]/10">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-[9px] font-black text-muted uppercase tracking-widest flex items-center gap-1.5">
                <Crosshair size={12} className={isGoalMet ? "text-[#00ff88]" : "text-[#00f3ff] animate-pulse"} /> 
                OBJETIVO: {userMetadata.target_weight}KG
              </span>
              <span className={`text-xs font-black font-mono ${isGoalMet ? 'text-[#00ff88] drop-shadow-[0_0_5px_rgba(0,255,136,0.6)]' : 'text-[#00f3ff]'}`}>
                {goalProgress}%
              </span>
            </div>
            
            <div className="w-full bg-[#0a0f16] rounded-sm h-1.5 overflow-hidden border border-[#00f3ff]/20">
              <div 
                className={`h-full transition-all duration-1000 relative ${
                  isGoalMet 
                    ? 'bg-gradient-to-r from-[#00ff88]/50 to-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.8)]' 
                    : 'bg-gradient-to-r from-[#00f3ff]/50 via-[#00f3ff] to-[#ff00ff] shadow-[0_0_10px_rgba(0,243,255,0.6)]'
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