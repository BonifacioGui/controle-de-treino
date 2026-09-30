import React, { useState } from 'react';
import LoginForm from './LoginForm';
import PasswordRecoveryRequest from './PasswordRecoveryRequest';
import PasswordResetPanel from './PasswordResetPanel';
import SignUpWizard from './SignUpWizard';

const AuthLayout = ({ authNotice = null, passwordRecovery = false, onPasswordRecoveryComplete }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [recoveryEmail, setRecoveryEmail] = useState(null);

  return (
    <div className="auth-layout min-h-screen bg-page text-main flex items-center justify-center p-4 font-sans relative overflow-hidden pb-20">
      
      <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <div className="auth-ambient absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="auth-panel w-full max-w-[420px] bg-card border-2 border-border p-6 sm:p-8 rounded-3xl relative z-10 transition-all duration-500">
        
        {passwordRecovery ? (
          <PasswordResetPanel onComplete={onPasswordRecoveryComplete} />
        ) : recoveryEmail !== null ? (
          <PasswordRecoveryRequest initialEmail={recoveryEmail} onBack={() => setRecoveryEmail(null)} />
        ) : isLogin ? (
          <LoginForm onSwitch={() => setIsLogin(false)} onForgotPassword={setRecoveryEmail} authNotice={authNotice} />
        ) : (
          <SignUpWizard onSwitch={() => setIsLogin(true)} />
        )}

      </div>
    </div>
  );
};

export default AuthLayout;
