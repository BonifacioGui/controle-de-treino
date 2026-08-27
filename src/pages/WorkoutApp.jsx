import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
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
import WorkoutSelector from '../components/workout/WorkoutSelector';
import LevelUpModal from '../components/rpg/LevelUpModal';
import { getFlameStyle } from '../utils/rpgSystem';
import { generateDailyQuests } from '../utils/questSystem';
import { daysBetweenLocalDates, formatDayCount, formatLocalDate } from '../utils/dateUtils';
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
  synced: { label: 'Sincronizado', Icon: Cloud, className: 'text-success' },
  syncing: { label: 'Sincronizando...', Icon: RefreshCw, className: 'text-primary' },
  offline: { label: 'Salvo neste dispositivo', Icon: CloudOff, className: 'text-warning' },
  error: { label: 'Sincronização pendente', Icon: CloudOff, className: 'text-warning' },
};

const normalizeTheme = (value) => value === 'light' ? 'light' : 'dark';

const WorkoutApp = () => {
  const [authSession, setAuthSession] = useState(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const userId = authSession?.user?.id || null;
  const initialSettings = useMemo(() => readStoredJSON(STORAGE_KEYS.settings, {}), []);
  const [theme, setTheme] = useState(() => normalizeTheme(initialSettings.theme));
  const [experienceMode, setExperienceMode] = useState(() => initialSettings.experienceMode || 'balanced');
  const [hapticFeedback, setHapticFeedback] = useState(() => (
    initialSettings.hapticFeedback ?? initialSettings.restVibration ?? true
  ));
  const { state, setters, actions, stats } = useWorkout(userId, { hapticFeedback });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    document.documentElement.setAttribute('data-experience', experienceMode);
    const settings = readStoredJSON(STORAGE_KEYS.settings, {});
    writeStoredJSON(STORAGE_KEYS.settings, {
      ...settings,
      theme,
      experienceMode,
      hapticFeedback,
      restVibration: hapticFeedback,
    });
  }, [experienceMode, hapticFeedback, theme]);

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

    const report = result.reportSnapshot;
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
    <div className="solo-shell relative min-h-screen overflow-x-hidden bg-page pb-28 font-sans text-main transition-colors duration-300 cyber-grid">
      <header className="sticky top-0 z-40 mb-4 flex h-16 items-center justify-between border-b border-border bg-page/92 px-3 shadow-lg backdrop-blur-md sm:px-4">
        <div className="flex items-center gap-3">
          <img src={logoSolo} alt="SOLO" className="h-7 w-auto max-w-28 drop-shadow-[0_0_6px_rgba(0,243,255,0.45)] sm:h-8" />
          <div className="min-w-0">
            <h1 className="font-cyber text-lg font-black tracking-[0.18em] text-main sm:text-xl">SOLO</h1>
            <p className="mt-0.5 hidden text-xs text-muted md:block">System for Objective Leveling and Overload</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex h-11 items-center gap-1.5 rounded-xl border px-2.5 ${flameStyle.shadow}`} aria-label={`Sequência de ${formatDayCount(stats?.streak || 0)}`}>
            <Flame size={18} className={flameStyle.iconClass} />
            <span className={`whitespace-nowrap text-xs font-black ${flameStyle.color}`}>{formatDayCount(stats?.streak || 0)}</span>
          </div>
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
        <WorkoutSelector
          workoutData={state.workoutData}
          activeDay={state.activeDay}
          sessionActive={sessionActive}
          workoutStatuses={workoutStatuses}
          onSelect={(day, status) => {
            if (status?.recent) setWarningModal({ isOpen: true, day, days: status.days, dateKey: status.dateKey, userId });
            else setters.setActiveDay(day);
          }}
        />
      )}

      {sessionActive && state.view !== 'workout' && (
        <div className="relative z-10 mx-4 mb-4">
          <button type="button" onClick={() => setters.setView('workout')} className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-primary/50 bg-card px-4 shadow-lg">
            <span className="text-left"><span className="block text-xs font-bold uppercase tracking-wider text-primary">Treino em andamento</span><span className="block text-sm font-black text-main">Voltar ao treino</span></span>
            <span className="font-mono text-lg font-black text-primary">{formatTime(state.workoutTimer.elapsed)}</span>
          </button>
        </div>
      )}

      <div className="relative z-10 min-h-[50vh] px-4">
        <Suspense fallback={<ViewFallback />}>
          {state.view === 'workout' && state.activeWorkout && (
            <WorkoutView
              {...state}
              theme={theme}
              experienceMode={experienceMode}
              actions={actions}
              setSelectedDate={actions.handleDateChange}
              setSessionNote={setters.setSessionNote}
              finishWorkout={handleFinishWorkout}
            />
          )}
          {state.view === 'workout' && !state.activeWorkout && (
            <section className="rounded-2xl border border-dashed border-primary/40 bg-card/70 p-6 text-center">
              <h2 className="text-xl font-black text-main">Nenhum treino cadastrado</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">Importe sua ficha em PDF ou cole o treino em texto. Você poderá revisar tudo antes de salvar.</p>
              <ol className="mx-auto mt-5 max-w-sm space-y-2 text-left text-sm text-muted"><li><span className="font-black text-primary">1.</span> Importe ou crie seu treino.</li><li><span className="font-black text-primary">2.</span> Escolha o protocolo.</li><li><span className="font-black text-primary">3.</span> Inicie e confirme cada série.</li></ol>
              <div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setters.setView('importer')} className="touch-target rounded-xl bg-primary font-black text-on-primary">Importar treino</button><button type="button" onClick={() => setters.setView('manage')} className="touch-target rounded-xl border border-primary font-black text-primary">Criar manualmente</button></div>
            </section>
          )}
          {state.view === 'importer' && (
            <Importer setWorkoutData={setters.setWorkoutData} setView={setters.setView} setActiveDay={setters.setActiveDay} existingWorkoutData={state.workoutData} />
          )}
          {state.view === 'manage' && (
            <ManageView activeDay={state.activeDay} workoutData={state.workoutData} setActiveDay={setters.setActiveDay} addDay={actions.manageData.addDay} removeDay={actions.manageData.removeDay} setWorkoutData={setters.setWorkoutData} addExercise={actions.manageData.add} removeExercise={actions.manageData.remove} editExerciseBase={actions.manageData.edit} setView={setters.setView} addFromCatalog={actions.manageData.addFromCatalog} />
          )}
          {state.view === 'history' && <HistoryView history={state.history} bodyHistory={state.bodyHistory} deleteEntry={actions.deleteEntry} updateEntry={actions.updateHistoryEntry} reopenEntry={actions.reopenHistoryEntry} setView={setters.setView} />}
          {state.view === 'stats' && <StatsView bodyHistory={state.bodyHistory} history={state.history} workoutData={state.workoutData} setView={setters.setView} />}
          {state.view === 'profile' && <ProfileView key={userId} userId={userId} userMetadata={authSession.user?.user_metadata} setView={setters.setView} stats={stats} history={state.history} quests={readUserStoredJSON(userId, STORAGE_KEYS.quests, [])} bodyHistory={state.bodyHistory} deleteEntry={actions.deleteEntry} />}
        </Suspense>
      </div>

      {!isAnyModalOpen && <CyberNav currentView={state.view} setView={setters.setView} />}

      {warningModal.isOpen && warningModal.userId === userId && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-warning/50 bg-card p-6">
            <Flame className="mb-4 text-warning" size={32} />
            <h2 className="text-lg font-black text-main">Treinar novamente?</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">Você realizou este treino há {warningModal.days} {warningModal.days === 1 ? 'dia' : 'dias'} ({formatLocalDate(warningModal.dateKey)}). Se estiver recuperado, pode continuar.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setWarningModal({ isOpen: false, day: null, days: null, dateKey: null })} className="touch-target rounded-xl border border-border font-bold text-main">Voltar</button>
              <button type="button" onClick={() => { setters.setActiveDay(warningModal.day); setWarningModal({ isOpen: false, day: null, days: null, dateKey: null }); }} className="touch-target rounded-xl bg-warning font-black text-on-warning">Abrir treino</button>
            </div>
          </div>
        </div>
      )}

      {showCurrentLevelUp && <LevelUpModal level={stats?.level || 1} onClose={handleLevelUpClose} />}

      {showCurrentBadgeAlert && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border border-yellow-500/50 bg-card p-6 text-center">
            <Medal size={54} className="mx-auto text-gold" />
            <h2 className="mt-4 flex items-center justify-center gap-2 font-cyber text-xl font-black text-gold"><Zap size={20} /> Nova conquista</h2>
            <div className="my-6 space-y-3">
              {(currentPendingReport?.newBadges || []).map((badge) => (
                <div key={badge.id || badge.title} className="rounded-xl border border-yellow-500/30 bg-input p-4">
                  <p className="font-black text-main">{badge.title}</p>
                  {badge.desc && <p className="mt-1 text-sm text-muted">{badge.desc}</p>}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => { setShowBadgeAlert(false); setShowCelebration(true); }} className="touch-target w-full rounded-xl bg-gold font-black text-white">Ver resumo</button>
          </div>
        </div>
      )}

      {showCurrentCelebration && currentPendingReport && (
        <Suspense fallback={<ViewFallback />}>
          <WorkoutComplete
            onClose={closeReport}
            sessionDuration={`${currentPendingReport.version === 2 ? Math.max(1, Math.floor((currentPendingReport.duration || 0) / 60)) : (currentPendingReport.duration || 0)} min`}
            sessionVolume={`${Math.round(currentPendingReport.volume || 0).toLocaleString('pt-BR')} kg`}
            sessionPoints={`+${currentPendingReport.earnedXp ?? currentPendingReport.xp ?? 0} XP`}
            sessionPrs={currentPendingReport.prsBroken || 0}
            completedSets={currentPendingReport.completedSets || 0}
            partial={currentPendingReport.partial === true}
            syncStatus={currentPendingReport.syncStatus}
            workoutTitle={currentPendingReport.workoutTitle || currentPendingReport.workoutName}
            bossEncounter={currentPendingReport.bossEncounter || null}
            bossName={currentPendingReport.bossEncounter?.bossName || ''}
            bossHp={currentPendingReport.bossEncounter?.maxHp || 0}
            streak={currentPendingReport.streak || stats?.streak || 0}
            currentLevel={currentPendingReport.level || stats?.level || 1}
            totalXp={stats?.xp || 0}
            newBadges={currentPendingReport.newBadges || []}
            theme={theme}
          />
        </Suspense>
      )}

      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} theme={theme} setTheme={setTheme} experienceMode={experienceMode} setExperienceMode={setExperienceMode} hapticFeedback={hapticFeedback} setHapticFeedback={setHapticFeedback} setView={setters.setView} hasPendingChanges={state.hasPendingChanges} syncStatus={state.syncStatus} onSync={actions.syncPendingChanges} userId={userId} />

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
