import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Bell,
  Cloud,
  CloudOff,
  Flame,
  BellRing,
  Loader2,
  Medal,
  Menu,
  RefreshCw,
  X,
  Zap,
} from 'lucide-react';
import { useWorkout } from '../hooks/useWorkout';
import logoSolo from '../assets/logo-solo.svg';
import { supabase, supabaseConfigurationError } from '../services/supabaseClient';
import CyberNav from '../components/shared/CyberNav';
import SidebarMenu from '../components/shared/SidebarMenu';
import NotificationCenter from '../components/shared/NotificationCenter';
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
import { REST_TIMER_STATUS } from '../utils/restTimerModel';
import { getAuthCallbackNotice, getCleanAuthCallbackUrl, withTimeout } from '../utils/authFlow';
import { useNotificationCenter } from '../hooks/useNotificationCenter';
import { getHapticCapability, HAPTIC_PLATFORMS, isHapticRetryFresh } from '../utils/haptics';
import {
  getRestAlertCapabilities,
  playRestCompletionSound,
  REST_SOUND_TYPES,
  showRestSystemNotification,
} from '../utils/restAlerts';

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

const AuthRecoveryScreen = ({ message, onRetry }) => (
  <main className="flex min-h-screen items-center justify-center bg-page p-4 font-sans text-main">
    <section role="alert" className="w-full max-w-md rounded-3xl border border-warning/50 bg-card p-6 text-center shadow-2xl">
      <img src={logoSolo} alt="SOLO" className="mx-auto h-12 w-auto" />
      <AlertTriangle aria-hidden="true" className="mx-auto mt-6 text-warning" size={34} />
      <h1 className="mt-4 font-cyber text-lg font-black uppercase tracking-wider">Falha ao iniciar a sessão</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">{message}</p>
      <button type="button" onClick={onRetry} className="touch-target mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-black uppercase text-on-primary">
        <RefreshCw aria-hidden="true" size={18} /> Tentar novamente
      </button>
      <p className="mt-4 text-xs leading-relaxed text-muted">Se o aviso continuar, confira a conexão e a configuração pública do Supabase.</p>
    </section>
  </main>
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
  const [authError, setAuthError] = useState('');
  const [authRetryKey, setAuthRetryKey] = useState(0);
  const [authNotice, setAuthNotice] = useState(() => (
    typeof window === 'undefined' ? null : getAuthCallbackNotice(window.location.href)
  ));
  const userId = authSession?.user?.id || null;
  const initialSettings = useMemo(() => readStoredJSON(STORAGE_KEYS.settings, {}), []);
  const [theme, setTheme] = useState(() => normalizeTheme(initialSettings.theme));
  const [experienceMode, setExperienceMode] = useState(() => initialSettings.experienceMode || 'balanced');
  const [hapticFeedback, setHapticFeedback] = useState(() => (
    (() => {
      const capability = getHapticCapability();
      const preference = initialSettings.hapticFeedback ?? initialSettings.restVibration ?? true;
      return capability.supported && capability.platform !== HAPTIC_PLATFORMS.ios && preference;
    })()
  ));
  const [restSoundEnabled, setRestSoundEnabled] = useState(() => (
    getRestAlertCapabilities().soundSupported && (initialSettings.restSoundEnabled ?? true)
  ));
  const [restNotificationEnabled, setRestNotificationEnabled] = useState(() => (
    getRestAlertCapabilities().notificationPermission === 'granted'
      && (initialSettings.restNotificationEnabled ?? false)
  ));
  const [restSoundVolume, setRestSoundVolume] = useState(() => Math.min(1, Math.max(0.1, Number(initialSettings.restSoundVolume) || 0.6)));
  const [restSoundType, setRestSoundType] = useState(() => Object.values(REST_SOUND_TYPES).includes(initialSettings.restSoundType) ? initialSettings.restSoundType : REST_SOUND_TYPES.double);
  const { state, setters, actions, stats } = useWorkout(userId, { hapticFeedback });
  const notificationCenter = useNotificationCenter(userId, { workoutData: state.workoutData, history: state.history });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showBadgeAlert, setShowBadgeAlert] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [restAlert, setRestAlert] = useState(null);
  const announcedRestTimersRef = useRef(new Set());
  const deliveredRestFeedbackRef = useRef(new Set());
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

  useEffect(() => {
    const timerId = state.timerState?.timerId;
    const alertKey = userId && timerId ? `${userId}:${timerId}` : null;
    if (!state.isHydrated
      || state.timerState?.status !== REST_TIMER_STATUS.finished
      || !timerId
      || !isHapticRetryFresh({ timerId, finishedAt: state.timerState?.finishedAt })
      || announcedRestTimersRef.current.has(alertKey)) return undefined;

    const showRestAlert = () => {
      if (document.visibilityState !== 'visible' || announcedRestTimersRef.current.has(alertKey)) return;
      announcedRestTimersRef.current.add(alertKey);
      setRestAlert({ timerId, userId });
    };

    showRestAlert();
    document.addEventListener('visibilitychange', showRestAlert);
    return () => document.removeEventListener('visibilitychange', showRestAlert);
  }, [state.isHydrated, state.timerState?.finishedAt, state.timerState?.status, state.timerState?.timerId, userId]);

  useEffect(() => {
    const timerId = state.timerState?.timerId;
    const feedbackKey = userId && timerId ? `${userId}:${timerId}` : null;
    if (!state.isHydrated
      || state.timerState?.status !== REST_TIMER_STATUS.finished
      || !feedbackKey
      || !isHapticRetryFresh({ timerId, finishedAt: state.timerState?.finishedAt })
      || deliveredRestFeedbackRef.current.has(feedbackKey)) return;

    deliveredRestFeedbackRef.current.add(feedbackKey);
    void playRestCompletionSound({ enabled: restSoundEnabled, volume: restSoundVolume, type: restSoundType });
    void showRestSystemNotification({ enabled: restNotificationEnabled, timerId });
  }, [restNotificationEnabled, restSoundEnabled, restSoundType, restSoundVolume, state.isHydrated, state.timerState?.finishedAt, state.timerState?.status, state.timerState?.timerId, userId]);

  useEffect(() => {
    if (!restAlert) return undefined;
    const timeout = window.setTimeout(() => setRestAlert(null), 7000);
    return () => window.clearTimeout(timeout);
  }, [restAlert]);

  const currentRestAlert = restAlert?.userId === userId
    && state.timerState?.status === REST_TIMER_STATUS.finished
    && state.timerState?.timerId === restAlert.timerId
    ? restAlert
    : null;
  const isAnyModalOpen = showCurrentCelebration || showCurrentLevelUp || showCurrentBadgeAlert || isMenuOpen || isNotificationCenterOpen;
  const syncCopy = SYNC_COPY[state.syncStatus] || SYNC_COPY.error;
  const SyncIcon = syncCopy.Icon;

  useEffect(() => {
    let active = true;
    let subscription;
    let authStateReceived = false;

    const fail = (error) => {
      if (!active) return;
      const message = error?.message === 'AUTH_SESSION_TIMEOUT'
        ? 'A conexão demorou demais ao verificar sua sessão. Nada foi apagado; você pode tentar novamente.'
        : error?.message || 'Não foi possível verificar sua sessão agora.';
      setAuthError(message);
      setAuthSession(null);
    };

    const initializeAuth = async () => {
      setIsSessionLoading(true);
      setAuthError('');
      try {
        if (supabaseConfigurationError) throw new Error(supabaseConfigurationError);

        const authListener = supabase.auth.onAuthStateChange((_event, session) => {
          if (!active) return;
          authStateReceived = true;
          setAuthSession(session);
          setAuthError('');
          setIsSessionLoading(false);
        });
        subscription = authListener.data.subscription;

        const { data, error } = await withTimeout(supabase.auth.getSession());
        if (error) throw error;
        if (active) setAuthSession(data?.session || null);
      } catch (error) {
        if (!authStateReceived) fail(error);
      } finally {
        if (active) setIsSessionLoading(false);
      }
    };

    initializeAuth();
    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [authRetryKey]);

  useEffect(() => {
    if (isSessionLoading || !authNotice || typeof window === 'undefined') return;
    const cleanUrl = getCleanAuthCallbackUrl(window.location.href);
    window.history.replaceState(window.history.state, '', cleanUrl);
  }, [authNotice, isSessionLoading]);

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
      restSoundEnabled,
      restNotificationEnabled,
      restSoundVolume,
      restSoundType,
    });
  }, [experienceMode, hapticFeedback, restNotificationEnabled, restSoundEnabled, restSoundType, restSoundVolume, theme]);

  const handleNotificationAction = (item) => {
    notificationCenter.markRead(item.id);
    if (item.action?.workoutDay && state.workoutData?.[item.action.workoutDay]) {
      setters.setActiveDay(item.action.workoutDay);
    }
    if (item.action?.view) setters.setView(item.action.view);
    setIsNotificationCenterOpen(false);
  };

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
      ...result.reportSnapshot,
      levelUp: result.subiuDeNivel === true,
      totalXp: result.reportSnapshot?.totalXp ?? stats?.xp ?? null,
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
  if (authError) return <AuthRecoveryScreen message={authError} onRetry={() => setAuthRetryKey((value) => value + 1)} />;
  if (!authSession) return <AuthLayout authNotice={authNotice} />;
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
          <button type="button" onClick={() => setIsNotificationCenterOpen(true)} aria-label={`Abrir notificações${notificationCenter.unreadCount > 0 ? `, ${notificationCenter.unreadCount} não lidas` : ''}`} className="touch-target relative flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted hover:text-primary">
            <Bell size={21} />
            {notificationCenter.unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[9px] font-black text-white shadow-[0_0_8px_rgba(var(--secondary),0.65)]">{Math.min(99, notificationCenter.unreadCount)}</span>}
          </button>
          <button type="button" onClick={() => setIsMenuOpen(true)} aria-label="Abrir menu" className="touch-target flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted hover:text-primary">
            <Menu size={24} />
          </button>
        </div>
      </header>

      {authNotice && (
        <div role={authNotice.type === 'error' ? 'alert' : 'status'} className={`relative z-20 mx-4 mb-4 flex items-start gap-3 rounded-xl border p-3 text-sm ${authNotice.type === 'error' ? 'border-danger/50 bg-danger/10 text-danger' : 'border-success/50 bg-success/10 text-success'}`}>
          <span className="min-w-0 flex-1 font-bold">{authNotice.message}</span>
          <button type="button" onClick={() => setAuthNotice(null)} aria-label="Fechar aviso" className="touch-target -m-2 flex shrink-0 items-center justify-center rounded-lg"><X size={18} /></button>
        </div>
      )}

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
          {state.view === 'stats' && <StatsView bodyHistory={state.bodyHistory} history={state.history} workoutData={state.workoutData} setView={setters.setView} gender={authSession.user?.user_metadata?.gender} />}
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
            sessionDuration={currentPendingReport.version === 2 ? (currentPendingReport.duration ?? null) : `${currentPendingReport.duration || 0} min`}
            sessionVolume={`${Math.round(currentPendingReport.volume || 0).toLocaleString('pt-BR')} kg`}
            sessionPoints={`+${currentPendingReport.earnedXp ?? currentPendingReport.xp ?? 0} XP`}
            sessionPrs={currentPendingReport.prsBroken || 0}
            completedSets={currentPendingReport.completedSets || 0}
            partial={currentPendingReport.partial === true}
            syncStatus={currentPendingReport.syncStatus}
            workoutTitle={currentPendingReport.workoutTitle || currentPendingReport.workoutName}
            bossEncounter={currentPendingReport.bossEncounter || null}
            streak={currentPendingReport.streak ?? stats?.streak ?? null}
            totalXp={currentPendingReport.totalXp ?? stats?.xp ?? null}
            sessionDate={currentPendingReport.dateKey}
            levelUp={currentPendingReport.levelUp === true}
            newBadges={currentPendingReport.newBadges || []}
            nextWorkout={currentPendingReport.nextWorkout || null}
          />
        </Suspense>
      )}

      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        items={notificationCenter.items}
        unreadCount={notificationCenter.unreadCount}
        preferences={notificationCenter.preferences}
        onMarkRead={notificationCenter.markRead}
        onMarkAllRead={notificationCenter.markAllRead}
        onDismiss={notificationCenter.dismiss}
        onCategoryChange={notificationCenter.setCategoryEnabled}
        onPause={notificationCenter.pauseForDays}
        onAction={handleNotificationAction}
      />

      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} theme={theme} setTheme={setTheme} experienceMode={experienceMode} setExperienceMode={setExperienceMode} hapticFeedback={hapticFeedback} setHapticFeedback={setHapticFeedback} restSoundEnabled={restSoundEnabled} setRestSoundEnabled={setRestSoundEnabled} restNotificationEnabled={restNotificationEnabled} setRestNotificationEnabled={setRestNotificationEnabled} restSoundVolume={restSoundVolume} setRestSoundVolume={setRestSoundVolume} restSoundType={restSoundType} setRestSoundType={setRestSoundType} setView={setters.setView} hasPendingChanges={state.hasPendingChanges} syncStatus={state.syncStatus} onSync={actions.syncPendingChanges} userId={userId} />

      {state.timerState?.active && state.timerState.endTime && (
        <RestTimer endTime={state.timerState.endTime} onAdjust={actions.adjustRestTimer} onSkip={actions.closeTimer} />
      )}

      {currentRestAlert && createPortal(
        <div role="alert" aria-live="assertive" className="fixed bottom-24 left-1/2 z-[99998] flex w-[calc(100%_-_2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border border-warning/50 bg-card/95 p-4 text-main shadow-2xl backdrop-blur-md">
          <BellRing aria-hidden="true" className="shrink-0 text-warning" size={22} />
          <div className="min-w-0 flex-1">
            <p className="font-black">Descanso concluído</p>
            <p className="mt-0.5 text-sm text-muted">Hora da próxima série.</p>
          </div>
          <button type="button" onClick={() => setRestAlert(null)} aria-label="Fechar aviso de descanso" className="touch-target flex shrink-0 items-center justify-center rounded-xl text-muted hover:text-main">
            <X size={19} />
          </button>
        </div>,
        document.body,
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
