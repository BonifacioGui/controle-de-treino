import React, { useEffect, useRef } from 'react';

export default function Cr7Celebration({ onClose }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 0.7;
      
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback caso o navegador bloqueie o som inicial
          videoRef.current.muted = true;
          videoRef.current.play();
        });
      }
    }

    // Timer de segurança de 7 segundos caso o vídeo trave
    const safetyTimer = setTimeout(onClose, 7000); 
    return () => clearTimeout(safetyTimer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black animate-in zoom-in duration-300 p-4">
      <video 
        ref={videoRef}
        src="https://i.imgur.com/1kSZ05R.mp4" 
        className="w-full md:w-auto max-h-[55vh] object-contain rounded-3xl border-4 border-cyan-500 shadow-[0_0_50px_rgba(0,243,255,0.8)]" 
        playsInline
        onEnded={onClose} 
        onError={onClose} 
      />

      <h2 className="text-6xl md:text-9xl font-black mt-8 neon-text-cyan italic uppercase tracking-tighter text-center drop-shadow-[0_0_20px_rgba(0,243,255,0.8)] animate-pulse pb-10">
        SIIIIIIIIIIIU!
      </h2>
    </div>
  );
}