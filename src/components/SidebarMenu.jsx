import React, { useState } from 'react';
import { X, Sun, Moon, LogOut, User, Database, Settings, ShieldAlert, DownloadCloud } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

// 🔥 Note que adicionamos o `setView` nas propriedades (props) recebidas
const SidebarMenu = ({ isOpen, onClose, theme, setTheme, setView }) => {
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleClose = () => {
    setConfirmLogout(false);
    onClose();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear(); 
    window.location.reload();
  };

  // 🔥 PROTOCOLO DE EXPORTAÇÃO DE DADOS (BACKUP)
  const handleBackup = () => {
    // 1. Coleta os dados vitais do armazenamento local
    const backupData = {
      workout_plan: JSON.parse(localStorage.getItem('workout_plan') || '{}'),
      solo_history: JSON.parse(localStorage.getItem('solo_history') || '[]'),
      body_history: JSON.parse(localStorage.getItem('body_history') || '[]'),
      daily_quests: JSON.parse(localStorage.getItem('daily_quests') || '[]')
    };

    // 2. Transforma em um arquivo (Blob)
    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // 3. Força o download
    const link = document.createElement('a');
    link.href = url;
    // Nome do arquivo com a data atual (Ex: solo_backup_2026-04-16.json)
    link.download = `solo_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    
    // 4. Limpeza da memória e fechamento do menu
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    handleClose();
  };

  // 🔥 FUNÇÃO DE NAVEGAÇÃO
  const navigateTo = (route) => {
    setView(route);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={handleClose}></div>

      <div className="relative w-80 h-full bg-card border-l-2 border-primary p-6 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col text-main dark:text-white">
        
        {/* CABEÇALHO */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-border/50">
          <h2 className="text-2xl font-black text-primary uppercase tracking-widest">COMANDO</h2>
          <button onClick={handleClose} className="text-muted hover:text-red-500 transition-colors p-1 hover:bg-red-500/10 rounded-lg">
            <X size={28} />
          </button>
        </div>

        {/* MÓDULO: SISTEMA (TEMA) */}
        <div className="space-y-4 mb-8">
          <span className="text-[10px] font-black text-primary/70 uppercase tracking-[0.2em] block mb-2">Visualização</span>
          <button onClick={() => setTheme(theme === 'light' ? 'driver' : 'light')} className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group active:scale-95 shadow-sm ${theme === 'light' ? 'bg-white border-yellow-500 text-yellow-600' : 'bg-input/50 border-border hover:border-primary text-muted hover:text-primary'}`}>
            <span className="font-black uppercase tracking-widest text-xs">{theme === 'light' ? 'Modo Diurno' : 'Modo Noturno'}</span>
            {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* MÓDULO: DADOS E PERFIL */}
        <div className="space-y-3 mb-8 flex-1">
          <span className="text-[10px] font-black text-primary/70 uppercase tracking-[0.2em] block mb-2">Operações</span>
          
          <button onClick={() => navigateTo('profile')} className="w-full p-3 rounded-xl border border-border bg-card hover:bg-input hover:border-primary/50 text-muted hover:text-main dark:hover:text-white transition-all flex items-center gap-3 active:scale-95">
            <User size={16} /> <span className="font-bold text-xs uppercase tracking-widest">Biometria & Classe</span>
          </button>

          <button onClick={handleBackup} className="w-full p-3 rounded-xl border border-border bg-card hover:bg-input hover:border-primary/50 text-muted hover:text-main dark:hover:text-white transition-all flex items-center gap-3 active:scale-95">
            <DownloadCloud size={16} /> <span className="font-bold text-xs uppercase tracking-widest">Baixar Backup Local</span>
          </button>

          <button onClick={() => alert('Módulo de configurações avançadas em desenvolvimento.')} className="w-full p-3 rounded-xl border border-border bg-card hover:bg-input hover:border-primary/50 text-muted hover:text-main dark:hover:text-white transition-all flex items-center justify-between active:scale-95 opacity-50">
            <div className="flex items-center gap-3">
              <Settings size={16} /> <span className="font-bold text-xs uppercase tracking-widest">Configurações</span>
            </div>
            <span className="text-[8px] bg-white/10 px-2 py-1 rounded-md uppercase font-black tracking-widest">Em breve</span>
          </button>
        </div>

        {/* MÓDULO: SAÍDA (ZONA VERMELHA) */}
        <div className="pt-4 border-t border-border/50 shrink-0">
          {!confirmLogout ? (
            <button onClick={() => setConfirmLogout(true)} className="w-full py-4 rounded-xl border border-red-500/30 text-red-500 bg-red-500/5 font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95">
              <LogOut size={18} /> ENCERRAR SESSÃO
            </button>
          ) : (
            <div className="space-y-3 animate-in fade-in zoom-in duration-200 bg-red-950/20 p-4 rounded-xl border border-red-500">
              <div className="flex items-center justify-center gap-2 text-red-500 mb-2">
                <ShieldAlert size={16} />
                <p className="text-center text-[10px] font-black uppercase tracking-widest">Confirmar extração?</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setConfirmLogout(false)} className="flex-1 py-3 rounded-lg border border-red-500/30 text-red-400 font-black uppercase text-xs hover:bg-red-500/10 transition-all active:scale-95">ABORTAR</button>
                <button onClick={handleLogout} className="flex-1 py-3 rounded-lg bg-red-600 text-white font-black uppercase text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-500/30 active:scale-95">EXTRAIR</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SidebarMenu;