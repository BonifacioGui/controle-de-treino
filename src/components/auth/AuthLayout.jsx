import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignUpWizard from './SignUpWizard';

const AuthLayout = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-page text-main flex items-center justify-center p-4 font-cyber relative overflow-hidden pb-20">
      
      <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* Brilho de Fundo Ambiente */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[420px] bg-card border-2 border-border p-6 sm:p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10 transition-all duration-500">
        
        {isLogin ? (
          <LoginForm onSwitch={() => setIsLogin(false)} />
        ) : (
          <SignUpWizard onSwitch={() => setIsLogin(true)} />
        )}

      </div>
    </div>
  );
};

export default AuthLayout;