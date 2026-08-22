import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  Cloud,
  CloudOff,
  Flame,
  Loader2,
  Medal,
  Menu,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useWorkout } from '../hooks/useWorkout';
import logoSolo from '../assets/logo-solo.svg';
import { supabase } from '../services/supabaseClient';
import CyberNav from '../components/shared/CyberNav';
import SidebarMenu from '../components/shared/SidebarMenu';
import LoadingScreen from '../components/shared/LoadingScreen';
import AuthLayout from '../components/auth/AuthLayout';
import WorkoutView from '../components/workout/WorkoutView';
import RestTimer from '../components/workout/RestTimer';
import LevelUpModal from '../components/rpg/LevelUpModal';
import { getFlameStyle } from '../utils/rpgSystem';
import { generateDailyQuests } from '../utils/questSystem';
import { daysBetweenLocalDates, formatLocalDate } from '../utils/dateUtils';
import { formatTime } from '../utils/workoutUtils';
import {
  readStoredJSON,
  readUserStoredJSON,
  removeUserStoredItem,
  STORAGE_KEYS,
  writeStoredJSON,
  writeUserStoredJSON,
} from '../utils/storage';
import { SESSION_STATUS } from '../utils/sessionModel';

const HistoryView = lazy(() => import('../components/dashboard/HistoryView'));
const ProfileView = lazy(() => import('../components/profile/ProfileView'));
const StatsView = lazy(() => import('../components/stats/StatsView'));
const ManageView = lazy(() => import('../components/admin/ManageView'));
const Importer = lazy(() => import('../components/admin/Importer'));
const WorkoutComplete = lazy(() => import('../components/export/WorkoutComplete'));

const ViewFallback = () => (
  <div className="flex min-h-56 items-center justify-center gap-3 text-sm font-bold text-muted">
    <Loader2 className="animate-spin text-primary" /> Carregando seção...
  </div>
);

const SYNC_COPY = {
  synced: { label: 'Sincronizado', Icon: Cloud, className: 'text-green-500' },
  syncing: { label: 'Sincronizando...', Icon: RefreshCw, className: 'text-primary' },
  offline: { label: 'Salvo neste dispositivo', Icon: CloudOff, className: 'text-warning' },
  error: { label: 'Sincronização pendente', Icon: CloudOff, className: 'text-warning' },
};

const WorkoutApp = () => {
  const [authSession, setAuthSession] = useState(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const userId = authSession?.user?.id || null;
  const { state, setters, actions, stats } = useWorkout(userId);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => readStoredJSON(STORAGE_KEYS.settings, {}).theme || 'driver');
  const [showCelebration, setShowCelebration] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showBadgeAlert, setShowBadgeAlert] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [warningModal, setWarningModal] = useState({ isOpen: false, day: null, days: null, dateKey: null, userId: null });
  const [pendingReport, setPendingReport] = useState(null);
  const [reportUserId, setReportUserId] = useState(null);

  const flameStyle = getFlameStyle(stats?.streak || 0);
  const sessionActive = [SESSION_STATUS.active, SESSION_STATUS.paused, SESSION_STATUS.finishing]
    .includes(state.session?.status);
  const currentPendingReport = reportUserId === userId ? pendingReport : null;
  const showCurrentCelebration = reportUserId === userId && showCelebration;
  const showCurrentLevelUp = reportUserId === userId && showLevelUp;
  const showCurrentBadgeAlert = reportUserId === userId && showBadgeAlert;
  const isAnyModalOpen = showCurrentCelebration || showCurrentLevelUp || showCurrentBadgeAlert || isMenuOpen;
  const syncCopy = SYNC_COPY[state.syncStatus] || SYNC_COPY.error;
  const SyncIcon = syncCopy.Icon;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthSession(session);
      setIsSessionLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session);
      setIsSessionLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId || !state.isHydrated) return;
    generateDailyQuests(userId);
    const report = readUserStoredJSON(userId, STORAGE_KEYS.pendingShareCard, null);
    const timer = window.setTimeout(() => {
      setPendingReport(report);
      setReportUserId(userId);
      setShowCelebration(Boolean(report));
      setShowLevelUp(false);
      setShowBadgeAlert(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [state.isHydrated, userId]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const settings = readStoredJSON(STORAGE_KEYS.settings, {});
    writeStoredJSON(STORAGE_KEYS.settings, { ...settings, theme });
  }, [theme]);

  const workoutStatuses = useMemo(() => Object.fromEntries(
    Object.keys(state.workoutData || {}).map((day) => {
      const latest = state.history.find((entry) => entry.workoutName === day);
      const days = latest ? daysBetweenLocalDates(latest.dateKey, state.selectedDate) : null;
      return [day, {
        completedOnDate: days === 0,
        recent: days !== null && days > 0 && days < 3,
        days,
        dateKey: latest?.dateKey || null,
      }];
    }),
  ), [state.history, state.selectedDate, state.workoutData]);

  const handleFinishWorkout = async (options) => {
    const result = await actions.finishWorkout(options);
    if (result?.requiresConfirmation) return result;

    const report = {
      volume: result.sessionVolume,
      duration: result.sessionDuration,
      xp: result.sessionXp,
      level: result.newLevel,
      streak: result.newStreak,
      newBadges: result.newBadges,
      completedSets: result.completedSets,
      prsBroken: result.prsBroken,
      partial: result.partial,
      syncStatus: result.syncStatus,
    };
    writeUserStoredJSON(userId, STORAGE_KEYS.pendingShareCard, report);
    setPendingReport(report);
    setReportUserId(userId);

    if (result.subiuDeNivel) setShowLevelUp(true);
    else if (result.newBadges?.length > 0) setShowBadgeAlert(true);
    else setShowCelebration(true);
    return result;
  };

  const handleLevelUpClose = () => {
    setShowLevelUp(false);
    if (currentPendingReport?.newBadges?.length > 0) setShowBadgeAlert(true);
    else setShowCelebration(true);
  };

  const closeReport = () => {
    removeUserStoredItem(userId, STORAGE_KEYS.pendingShareCard);
    setPendingReport(null);
    setReportUserId(null);
    setShowCelebration(false);
    setSuccessToast(true);
    window.setTimeout(() => setSuccessToast(false), 3500);
    setters.setView('history');
  };

  if (isSessionLoading) return <LoadingScreen logo={logoSolo} />;
  if (!authSession) return <AuthLayout />;
  if (!state.isHydrated) return <LoadingScreen logo={logoSolo} />;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-page pb-8 font-cyber text-main transition-colors duration-500 cyber-grid">
      <header className="sticky top-0 z-40 mb-5 flex h-20 items-center justify-between border-b border-border bg-page/85 px-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img src={logoSolo} alt="SOLO" className="h-9 w-auto drop-shadow-[0_0_8px_rgba(0,243,255,0.7)]" />
          <div className="hidden sm:block">
            <h1 className="text-2xl font-black tracking-[0.18em] text-main">SOLO</h1>
            <p className="mt-1 text-xs text-muted">Seu treino, seu progresso.</p>
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className={`flex h-14 min-w-[82px] flex-col items-center justify-center rounded-2xl border px-4 ${flameStyle.shadow}`}>
            <Flame size={30} className={flameStyle.iconClass} />
            <span className={`text-xs font-bold ${flameStyle.color}`}>{stats?.streak || 0} dias</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => state.hasPendingChanges && actions.syncPendingChanges()}
            disabled={!state.hasPendingChanges || state.syncStatus === 'syncing'}
            aria-label={syncCopy.label}
            className={`hidden min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold sm:flex ${syncCopy.className}`}
          >
            <SyncIcon size={17} className={state.syncStatus === 'syncing' ? 'animate-spin' : ''} /> {syncCopy.label}
          </button>
          <button type="button" onClick={() => setIsMenuOpen(true)} aria-label="Abrir menu" className="touch-target flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted hover:text-primary">
            <Menu size={24} />
          </button>
        </div>
      </header>

      {state.view === 'workout' && state.workoutData && (
        <nav aria-label="Treinos do plano" className="mb-4 flex gap-3 overflow-x-auto px-4 pb-3 scrollbar-hide">
          {Object.entries(state.workoutData).map(([day, workout]) => {
            const isActive = state.activeDay === day;
            const locked = sessionActive && !isActive;
            const status = workoutStatuses[day];
            const selectWorkout = () => {
              if (locked || isActive) return;
              if (status?.recent) {
                setWarningModal({ isOpen: true, day, days: status.days, dateKey: status.dateKey, userId });
              } else setters.setActiveDay(day);
            };
            return (
              <button
                type="button"
                key={day}
                onClick={selectWorkout}
                disabled={locked}
                aria-current={isActive ? 'page' : undefined}
                className={`relative min-h-16 min-w-[156px] shrink-0 rounded-2xl border px-4 py-3 text-left transition-all disabled:opacity-40 ${isActive ? 'border-primary bg-primary text-black shadow-[0_0_18px_rgba(var(--primary),0.25)]' : 'border-border bg-card text-main'}`}
              >
                <span className="block text-base font-black">{workout.title || `Treino ${day}`}</span>
                <span className={`mt-1 block text-xs ${isActive ? 'text-black/70' : 'text-muted'}`}>{workout.focus || 'Foco geral'}</span>
                {status?.completedOnDate && <span className="absolute right-2 top-2 flex items-center gap-1 text-[11px] font-black"><Check size={13} /> Feito</span>}
              </button>
            );
          })}
        </nav>
      )}

      <div className="relative z-10 min-h-[50vh] px-4">
        <Suspense fallback={<ViewFallback />}>
          {state.view === 'workout' && state.workoutData?.[state.activeDay] && (
            <WorkoutView
              {...state}
              actions={actions}
              setActiveDay={setters.setActiveDay}
              setSelectedDate={actions.handleDateChange}
              setSessionNote={setters.setSessionNote}
              finishWorkout={handleFinishWorkout}
            />
          )}
          {state.view === 'workout' && !state.workoutData?.[state.activeDay] && (
            <section className="rounded-2xl border border-dashed border-primary/40 bg-card/70 p-6 text-center">
              <h2 className="text-xl font-black text-main">Nenhum treino cadastrado</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">Importe sua ficha em PDF ou cole o treino em texto. Você poderá revisar tudo antes de salvar.</p>
              <ol className="mx-auto mt-5 max-w-sm space-y-2 text-left text-sm text-muted"><li><span className="font-black text-primary">1.</span> Importe ou crie seu treino.</li><li><span className="font-black text-primary">2.</span> Escolha o protocolo.</li><li><span className="font-black text-primary">3.</span> Inicie e confirme cada série.</li></ol>
              <div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setters.setView('importer')} className="touch-target rounded-xl bg-primary font-black text-black">Importar treino</button><button type="button" onClick={() => setters.setView('manage')} className="touch-target rounded-xl border border-primary font-black text-primary">Criar manualmente</button></div>
            </section>
          )}
          {state.view === 'importer' && (
            <Importer setWorkoutData={setters.setWorkoutData} setView={setters.setView} setActiveDay={setters.setActiveDay} existingWorkoutData={state.workoutData} />
          )}
          {state.view === 'manage' && (
            <ManageView activeDay={state.activeDay} workoutData={state.workoutData} setActiveDay={setters.setActiveDay} addDay={actions.manageData.addDay} removeDay={actions.manageData.removeDay} setWorkoutData={setters.setWorkoutData} addExercise={actions.manageData.add} removeExercise={actions.manageData.remove} editExerciseBase={actions.manageData.edit} setView={setters.setView} addFromCatalog={actions.manageData.addFromCatalog} />
          )}
          {state.view === 'history' && <HistoryView history={state.history} bodyHistory={state.bodyHistory} deleteEntry={actions.deleteEntry} updateEntry={actions.updateHistoryEntry} setView={setters.setView} />}
          {state.view === 'stats' && <StatsView bodyHistory={state.bodyHistory} history={state.history} workoutData={state.workoutData} setView={setters.setView} />}
          {state.view === 'profile' && <ProfileView key={userId} userId={userId} userMetadata={authSession.user?.user_metadata} setView={setters.setView} stats={stats} history={state.history} quests={readUserStoredJSON(userId, STORAGE_KEYS.quests, [])} bodyHistory={state.bodyHistory} deleteEntry={actions.deleteEntry} />}
        </Suspense>
      </div>

      {sessionActive && state.view !== 'workout' && !state.timerState?.active && (
        <button type="button" onClick={() => setters.setView('workout')} className="fixed bottom-24 left-1/2 z-40 flex min-h-14 w-[90%] max-w-sm -translate-x-1/2 items-center justify-between rounded-2xl border border-primary/50 bg-card/95 px-5 shadow-xl backdrop-blur-md">
          <span><span className="block text-xs font-bold text-primary">Treino em andamento</span><span className="block text-sm font-black text-main">Voltar ao treino</span></span>
          <span className="font-mono font-black text-primary">{formatTime(state.workoutTimer.elapsed)}</span>
        </button>
      )}

      {!isAnyModalOpen && <CyberNav currentView={state.view} setView={setters.setView} />}

      {warningModal.isOpen && warningModal.userId === userId && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-warning/50 bg-card p-6">
            <Flame className="mb-4 text-warning" size={32} />
            <h2 className="text-lg font-black text-main">Treinar novamente?</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">Você realizou este treino há {warningModal.days} {warningModal.days === 1 ? 'dia' : 'dias'} ({formatLocalDate(warningModal.dateKey)}). Se estiver recuperado, pode continuar.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setWarningModal({ isOpen: false, day: null, days: null, dateKey: null })} className="touch-target rounded-xl border border-border font-bold text-main">Voltar</button>
              <button type="button" onClick={() => { setters.setActiveDay(warningModal.day); setWarningModal({ isOpen: false, day: null, days: null, dateKey: null }); }} className="touch-target rounded-xl bg-warning font-black text-black">Abrir treino</button>
            </div>
          </div>
        </div>
      )}

      {showCurrentLevelUp && <LevelUpModal level={stats?.level || 1} onClose={handleLevelUpClose} />}

      {showCurrentBadgeAlert && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border border-yellow-500/50 bg-card p-6 text-center">
            <Medal size={54} className="mx-auto text-yellow-400" />
            <h2 className="mt-4 flex items-center justify-center gap-2 text-xl font-black text-yellow-400"><Zap size={20} /> Nova conquista</h2>
            <div className="my-6 space-y-3">
              {(currentPendingReport?.newBadges || []).map((badge) => (
                <div key={badge.id || badge.title} className="rounded-xl border border-yellow-500/30 bg-input p-4">
                  <p className="font-black text-main">{badge.title}</p>
                  {badge.desc && <p className="mt-1 text-sm text-muted">{badge.desc}</p>}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => { setShowBadgeAlert(false); setShowCelebration(true); }} className="touch-target w-full rounded-xl bg-yellow-400 font-black text-black">Ver resumo</button>
          </div>
        </div>
      )}

      {showCurrentCelebration && currentPendingReport && (
        <Suspense fallback={<ViewFallback />}>
          <WorkoutComplete
            onClose={closeReport}
            sessionDuration={`${currentPendingReport.duration || stats.lastSessionStats?.duration || 0} min`}
            sessionVolume={`${currentPendingReport.volume || stats.lastSessionStats?.volume || 0} kg`}
            sessionPoints={`+${currentPendingReport.xp || stats.lastSessionStats?.xp || 0} XP`}
            sessionPrs={currentPendingReport.prsBroken || 0}
            completedSets={currentPendingReport.completedSets || 0}
            partial={currentPendingReport.partial === true}
            syncStatus={currentPendingReport.syncStatus}
            bossName={state.workoutData?.[state.activeDay]?.title || 'Treino concluído'}
            bossHp={state.workoutData?.[state.activeDay]?.bossHp || 10000}
            streak={currentPendingReport.streak || stats?.streak || 0}
            currentLevel={currentPendingReport.level || stats?.level || 1}
            totalXp={stats?.xp || 0}
            newBadges={currentPendingReport.newBadges || []}
          />
        </Suspense>
      )}

      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} theme={theme} setTheme={setTheme} setView={setters.setView} hasPendingChanges={state.hasPendingChanges} syncStatus={state.syncStatus} onSync={actions.syncPendingChanges} userId={userId} />

      {state.timerState?.active && state.timerState.endTime && (
        <RestTimer endTime={state.timerState.endTime} onAdjust={actions.adjustRestTimer} onSkip={actions.closeTimer} />
      )}

      {successToast && createPortal(
        <div role="status" className="fixed left-1/2 top-4 z-[99999] -translate-x-1/2 rounded-full border border-primary/40 bg-card/95 px-6 py-3 text-sm font-black text-main shadow-xl backdrop-blur-md">
          Treino salvo com sucesso
        </div>,
        document.body,
      )}
    </div>
  );
};

export default WorkoutApp;
