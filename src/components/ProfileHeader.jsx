import React from 'react';
import { Settings, User, Camera, Crosshair } from 'lucide-react';
import UserLevel from './UserLevel';

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
    <div className="space-y-6">
      <div className="bg-card border-2 border-primary rounded-3xl p-6 relative overflow-hidden shadow-lg dark:shadow-[0_0_30px_rgba(var(--primary),0.15)] mt-2 transition-colors">
        {/* Brilho de Fundo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px]"></div>
        
        {/* Botão de Configuração (Afastado) */}
        <button 
          onClick={() => setIsEditing(true)} 
          className="absolute top-3 right-3 z-30 p-2 bg-input/80 border border-primary/50 text-primary rounded-xl hover:bg-primary hover:text-black transition-all shadow-md"
        >
          <Settings size={20} />
        </button>

        {/* Info do Usuário */}
        <div className="flex items-center gap-4 relative z-10 mb-4">
          <div className="relative w-20 h-20 shrink-0 rotate-3 group cursor-pointer z-20">
            <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <label htmlFor="avatar-upload" className="w-full h-full bg-input border-2 border-primary rounded-2xl flex items-center justify-center shadow-sm dark:shadow-[0_0_15px_rgba(var(--primary),0.4)] overflow-hidden cursor-pointer transition-all group-hover:border-main dark:group-hover:border-white">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-primary group-hover:text-main dark:group-hover:text-white transition-colors" />
              )}
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                <Camera size={24} className="text-white mb-1" />
              </div>
            </label>
          </div>

          {/* 🔥 CORREÇÃO: pr-2 devolve o espaço do seu nome. Fonte ajustada para encaixar 9 letras no mobile. */}
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-main dark:text-white drop-shadow-sm dark:drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] truncate">
              {userMetadata?.username || 'SOLDADO_X'}
            </h2>
            
            <span className="text-primary text-[10px] font-black uppercase tracking-widest block mt-1">
              Classe: {displayClass}
            </span>
          </div>
        </div>

        {/* Barra de Operação */}
        {userMetadata?.target_weight && (
          <div className="relative z-10 pt-4 border-t border-primary/20">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-1">
                <Crosshair size={12} className="text-secondary" /> Operação: Bater {userMetadata.target_weight}kg
              </span>
              <span className="text-xs font-black text-main dark:text-white">{goalProgress}%</span>
            </div>
            <div className="w-full bg-input rounded-full h-2 overflow-hidden border border-border">
              <div 
                className={`h-full transition-all duration-1000 ${isGoalMet ? 'bg-success shadow-[0_0_10px_rgba(var(--success),0.8)]' : 'bg-secondary shadow-[0_0_10px_rgba(var(--secondary),0.6)]'}`} 
                style={{ width: `${goalProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <UserLevel stats={stats} />
    </div>
  );
};

export default ProfileHeader;