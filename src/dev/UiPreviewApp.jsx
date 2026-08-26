import React, { useState } from 'react';
import logoSolo from '../assets/logo-solo.svg';
import CyberNav from '../components/shared/CyberNav';
import WorkoutView from '../components/workout/WorkoutView';
import WorkoutComplete from '../components/export/WorkoutComplete';
import HistoryView from '../components/dashboard/HistoryView';
import RestTimer from '../components/workout/RestTimer';
import { SESSION_STATUS } from '../utils/sessionModel';

const dateKey = '2026-08-26';
const workout = {
  title: 'Peito + Tríceps',
  focus: 'Push',
  exercises: [
    { name: 'Supino reto', sets: '4x8', loadMode: 'total', note: 'Controle a descida.' },
    { name: 'Supino inclinado', sets: '3x10', loadMode: 'per_hand' },
    { name: 'Crucifixo', sets: '3x12', loadMode: 'per_hand' },
    { name: 'Tríceps corda', sets: '3x12', loadMode: 'machine' },
  ],
};

const completedSet = (weight, reps) => ({ weight: String(weight), reps: String(reps), completed: true, loadMode: 'total' });
const progress = {
  [`${dateKey}-A-0`]: { sets: [completedSet(60, 10), completedSet(62.5, 8), { weight: '65', reps: '6', completed: false, loadMode: 'total' }] },
  [`${dateKey}-A-1`]: { sets: [{ weight: '24', reps: '10', completed: false, loadMode: 'per_hand' }] },
};
const encounter = {
  encounterId: 'preview-session:boss',
  bossName: 'NEON REVENANT',
  bossTier: 2,
  bossAssetKey: 'revenant',
  maxHp: 5000,
  damage: 1100,
  baseDamage: 1100,
  criticalBonus: 0,
  criticalHits: 0,
  remainingHp: 3900,
  defeated: false,
  overkill: 0,
};
const history = [
  {
    localId: 'preview-1',
    sessionId: 'preview-1',
    dateKey: '2026-08-22',
    workoutName: 'A',
    workoutTitle: 'Peito + Tríceps',
    workoutFocus: 'Push',
    duration: 2880,
    totalVolume: 6420,
    earnedXp: 312,
    prsBroken: 1,
    overloadStatus: 'OVERLOAD',
    partial: false,
    syncStatus: 'synced',
    bossEncounter: { ...encounter, damage: 5000, remainingHp: 0, defeated: true },
    exercises: [{ name: 'Supino reto', loadMode: 'total', sets: [completedSet(65, 6)] }],
  },
  {
    localId: 'preview-2',
    sessionId: 'preview-2',
    dateKey: '2026-07-18',
    workoutName: 'B',
    workoutTitle: 'Costas + Bíceps',
    workoutFocus: 'Pull',
    duration: 2520,
    totalVolume: 5310,
    earnedXp: 260,
    prsBroken: 0,
    overloadStatus: 'MANUTENÇÃO',
    partial: false,
    syncStatus: 'synced',
    exercises: [{ name: 'Puxada frontal', loadMode: 'machine', sets: [completedSet(55, 10)] }],
  },
];

const noop = () => {};
const actions = {
  startSession: noop,
  toggleWorkoutTimer: noop,
  resetWorkoutTimer: noop,
  acknowledgeRecovery: noop,
  restoreAfterFailedFinish: noop,
  updateSetData: noop,
  updateSessionSets: noop,
  onSwap: noop,
  skipExercise: noop,
  toggleSetComplete: noop,
};

const UiPreviewApp = () => {
  const [restEndTime] = useState(() => Date.now() + 72000);
  const screen = new URLSearchParams(window.location.search).get('ui-preview') || 'pre';
  const active = screen === 'active' || screen === 'rest';
  const view = screen === 'history' ? 'history' : 'workout';
  const timer = {
    status: active ? SESSION_STATUS.active : SESSION_STATUS.idle,
    isRunning: active,
    elapsed: active ? 1714 : 0,
    recovered: false,
  };

  return (
    <div className="solo-shell relative min-h-screen overflow-x-hidden bg-page pb-28 font-sans text-main cyber-grid">
      <header className="sticky top-0 z-40 mb-4 flex h-16 items-center justify-between border-b border-border bg-page/95 px-3 backdrop-blur-md">
        <div className="flex items-center gap-3"><img src={logoSolo} alt="SOLO" className="h-8 w-auto max-w-28" /><span className="font-cyber text-lg font-black tracking-[0.18em]">SOLO</span></div>
        <span className="rounded-xl border border-secondary/40 bg-secondary/5 px-3 py-2 text-xs font-black text-secondary">🔥 4 dias</span>
      </header>
      <div className="relative z-10 mx-auto min-h-[50vh] max-w-5xl px-4">
        {screen === 'history' ? (
          <HistoryView history={history} bodyHistory={[]} deleteEntry={noop} updateEntry={noop} reopenEntry={noop} setView={noop} />
        ) : (
          <WorkoutView
            activeDay="A"
            setActiveDay={noop}
            workoutData={{ A: workout }}
            activeWorkout={workout}
            bossEncounter={active ? encounter : null}
            experienceMode="balanced"
            selectedDate={dateKey}
            setSelectedDate={noop}
            progress={active ? progress : {}}
            sessionNote=""
            setSessionNote={noop}
            finishWorkout={async () => ({})}
            history={history}
            workoutTimer={timer}
            syncStatus="synced"
            actions={actions}
            userId="dev-preview"
          />
        )}
      </div>
      <CyberNav currentView={view} setView={noop} />
      {screen === 'complete' && (
        <WorkoutComplete
          onClose={noop}
          sessionVolume="6.420 kg"
          sessionDuration="48 min"
          sessionPoints="+312 XP"
          sessionPrs={1}
          completedSets={16}
          workoutTitle="Peito + Tríceps"
          bossEncounter={{ ...encounter, damage: 5270, remainingHp: 0, defeated: true, overkill: 270 }}
          streak={4}
          currentLevel={12}
          syncStatus="synced"
        />
      )}
      {screen === 'rest' && <RestTimer endTime={restEndTime} onAdjust={noop} onSkip={noop} vibrationEnabled={false} />}
    </div>
  );
};

export default UiPreviewApp;
