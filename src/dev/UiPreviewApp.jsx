import React, { useEffect, useState } from 'react';
import logoSolo from '../assets/logo-solo.svg';
import AuthLayout from '../components/auth/AuthLayout';
import CyberNav from '../components/shared/CyberNav';
import WorkoutView from '../components/workout/WorkoutView';
import WorkoutComplete from '../components/export/WorkoutComplete';
import HistoryView from '../components/dashboard/HistoryView';
import RestTimer from '../components/workout/RestTimer';
import StatsView from '../components/stats/StatsView';
import ProfileView from '../components/profile/ProfileView';
import ManageView from '../components/admin/ManageView';
import Importer from '../components/admin/Importer';
import LevelUpModal from '../components/rpg/LevelUpModal';
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
const bodyHistory = [
  { id: 'bio-1', date: '2026-08-24', weight: '78.4', bf: '15.2', lean_mass: '66.5', waist: '82', abdomen: '84', hip: '96', chest: '102', shoulder: '116', arm_left: '37', arm_right: '37.5', leg_left: '58', leg_right: '58.5', calf_left: '39', calf_right: '39' },
  { id: 'bio-2', date: '2026-07-20', weight: '79.1', bf: '16.0', lean_mass: '66.4', waist: '84', abdomen: '86', hip: '97', chest: '101', shoulder: '115', arm_left: '36.5', arm_right: '37', leg_left: '57.5', leg_right: '58', calf_left: '38.5', calf_right: '39' },
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
  const params = new URLSearchParams(window.location.search);
  const screen = params.get('ui-preview') || 'pre';
  const theme = params.get('theme') === 'light' ? 'light' : 'dark';
  const experienceMode = ['immersive', 'discreet'].includes(params.get('experience')) ? params.get('experience') : 'balanced';
  const active = screen === 'active' || screen === 'rest';
  const view = ['history', 'stats', 'profile'].includes(screen) ? screen : 'workout';
  const timer = {
    status: active ? SESSION_STATUS.active : SESSION_STATUS.idle,
    isRunning: active,
    elapsed: active ? 1714 : 0,
    recovered: false,
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-experience', experienceMode);
  }, [experienceMode, theme]);

  if (screen === 'login') return <AuthLayout />;

  return (
    <div className="solo-shell relative min-h-screen overflow-x-hidden bg-page pb-28 font-sans text-main cyber-grid">
      <header className="sticky top-0 z-40 mb-4 flex h-16 items-center justify-between border-b border-border bg-page/95 px-3 backdrop-blur-md">
        <div className="flex items-center gap-3"><img src={logoSolo} alt="SOLO" className="h-8 w-auto max-w-28" /><span className="font-cyber text-lg font-black tracking-[0.18em]">SOLO</span></div>
        <span className="rounded-xl border border-secondary/40 bg-secondary/5 px-3 py-2 text-xs font-black text-secondary">🔥 4 dias</span>
      </header>
      <div className="relative z-10 mx-auto min-h-[50vh] max-w-5xl px-4">
        {screen === 'history' && <HistoryView history={history} bodyHistory={bodyHistory} deleteEntry={noop} updateEntry={noop} reopenEntry={noop} setView={noop} />}
        {screen === 'stats' && <StatsView history={history} bodyHistory={bodyHistory} workoutData={{ A: workout }} setView={noop} setIsModalOpen={noop} />}
        {screen === 'profile' && <ProfileView userId="dev-preview" userMetadata={{ username: 'Operador SOLO', height: '178', target_weight: '76', goal: 'hypertrophy' }} stats={{ streak: 4 }} history={history} bodyHistory={bodyHistory} deleteEntry={noop} />}
        {screen === 'manage' && <ManageView activeDay="A" setActiveDay={noop} addDay={noop} removeDay={noop} workoutData={{ A: workout }} addExercise={noop} removeExercise={noop} editExerciseBase={noop} setView={noop} addFromCatalog={noop} />}
        {screen === 'importer' && <Importer setWorkoutData={noop} setView={noop} setActiveDay={noop} existingWorkoutData={{ A: workout }} />}
        {!['history', 'stats', 'profile', 'manage', 'importer', 'level'].includes(screen) && (
          <WorkoutView
            activeDay="A"
            setActiveDay={noop}
            workoutData={{ A: workout }}
            activeWorkout={workout}
            bossEncounter={active ? encounter : null}
            theme={theme}
            experienceMode={experienceMode}
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
          theme={theme}
        />
      )}
      {screen === 'rest' && <RestTimer endTime={restEndTime} onAdjust={noop} onSkip={noop} vibrationEnabled={false} />}
      {screen === 'level' && <LevelUpModal level={12} onClose={noop} />}
    </div>
  );
};

export default UiPreviewApp;
