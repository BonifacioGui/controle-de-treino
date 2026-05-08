// src/hooks/useWorkoutTimer.js
import { useState, useEffect, useCallback } from 'react';

export const useWorkoutTimer = () => {
  const [workoutTimer, setWorkoutTimer] = useState(() => {
    try {
      const saved = localStorage.getItem('workout_stopwatch');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isRunning) return { ...parsed, elapsed: Math.floor((Date.now() - parsed.startTime) / 1000) };
        return parsed;
      }
      return { isRunning: false, startTime: null, elapsed: 0 };
    } catch { return { isRunning: false, startTime: null, elapsed: 0 }; }
  });

  // Salva no LocalStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('workout_stopwatch', JSON.stringify(workoutTimer));
  }, [workoutTimer]);

  // Roda o relógio
  useEffect(() => {
    let interval = null;
    if (workoutTimer.isRunning) {
      interval = setInterval(() => {
        setWorkoutTimer(prev => ({ ...prev, elapsed: Math.floor((Date.now() - prev.startTime) / 1000) }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workoutTimer.isRunning]);

  const toggleWorkoutTimer = useCallback(() => {
    setWorkoutTimer(prev => prev.isRunning 
      ? { ...prev, isRunning: false } 
      : { isRunning: true, startTime: Date.now() - (prev.elapsed * 1000), elapsed: prev.elapsed }
    );
  }, []);

  const resetWorkoutTimer = useCallback(() => {
    setWorkoutTimer({ isRunning: false, startTime: null, elapsed: 0 });
  }, []);

  return { workoutTimer, toggleWorkoutTimer, resetWorkoutTimer, setWorkoutTimer };
};