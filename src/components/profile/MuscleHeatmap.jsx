import { useEffect, useId, useMemo, useState } from 'react';
import { Activity, User, Users } from 'lucide-react';
import femaleWarrior from '../../assets/solo-warrior-female.svg';
import maleWarrior from '../../assets/solo-warrior-male.svg';
import { daysBetweenLocalDates, getLocalDateKey } from '../../utils/dateUtils';

const MUSCLE_MAP = {
  'Supino Reto': 'peito', 'Supino Inclinado': 'peito', Crossover: 'peito', 'Peck Deck': 'peito', 'Crucifixo com Halteres': 'peito',
  'Puxada Neutra': 'costas', 'Remada Baixa': 'costas', Serrote: 'costas', 'Puxada Frontal': 'costas', Remada: 'costas',
  Desenvolvimento: 'ombros', 'Elevação Lateral': 'ombros', 'Crucifixo Inverso': 'ombros', 'Face Pull': 'ombros', 'Elevação Frontal': 'ombros',
  'Rosca Direta': 'bíceps', 'Rosca Martelo': 'bíceps', 'Rosca Alternada': 'bíceps', 'Rosca 45º': 'bíceps', 'Rosca Scott': 'bíceps',
  'Tríceps Francês': 'tríceps', 'Tríceps Corda': 'tríceps', 'Tríceps Testa': 'tríceps', 'Tríceps Pulley': 'tríceps', 'Tríceps Coice': 'tríceps',
  Prancha: 'core', 'Prancha Lateral': 'core', Vacuum: 'core', 'Abdominal Infra': 'core',
  'Leg Press': 'quadríceps', 'Agachamento Hack': 'quadríceps', 'Cadeira Extensora': 'quadríceps', 'Agachamento Isométrico': 'quadríceps', 'Leg Press 45º': 'quadríceps',
  'Mesa Flexora': 'posteriores', Stiff: 'posteriores', 'Elevação Pélvica': 'posteriores', 'Cadeira Abdutora': 'posteriores',
  Panturrilha: 'panturrilhas', 'Panturrilha Sentado': 'panturrilhas', 'Panturrilha em Pé': 'panturrilhas',
};

const EMPTY_HEAT_DATA = Object.freeze({
  peito: 0,
  costas: 0,
  ombros: 0,
  bíceps: 0,
  tríceps: 0,
  core: 0,
  quadríceps: 0,
  posteriores: 0,
  panturrilhas: 0,
});

const BODY_ZONES = {
  male: [
    { muscle: 'ombros', d: 'M57 112C64 93 82 91 96 105L88 127C75 126 64 122 57 112ZM183 112C176 93 158 91 144 105L152 127C165 126 176 122 183 112Z' },
    { muscle: 'peito', d: 'M88 116C99 109 111 111 119 123L116 153C103 151 93 146 86 137ZM152 116C141 109 129 111 121 123L124 153C137 151 147 146 154 137Z' },
    { muscle: 'costas', d: 'M79 124C72 136 72 163 82 181L96 169 91 133ZM161 124C168 136 168 163 158 181L144 169 149 133Z' },
    { muscle: 'bíceps', d: 'M50 139C40 151 38 177 45 191 55 183 61 163 63 146ZM190 139C200 151 202 177 195 191 185 183 179 163 177 146Z' },
    { muscle: 'tríceps', d: 'M43 158C35 177 32 200 35 218L48 220C54 199 57 177 55 158ZM197 158C205 177 208 200 205 218L192 220C186 199 183 177 185 158Z' },
    { muscle: 'core', d: 'M91 158C100 164 109 168 120 170 131 168 140 164 149 158L153 202C143 214 132 220 120 222 108 220 97 214 87 202Z' },
    { muscle: 'quadríceps', d: 'M82 216C93 218 105 222 116 230L104 286 80 288 72 247ZM158 216C147 218 135 222 124 230L136 286 160 288 168 247Z' },
    { muscle: 'posteriores', d: 'M72 229C65 245 68 274 79 291L87 276 84 234ZM168 229C175 245 172 274 161 291L153 276 156 234Z' },
    { muscle: 'panturrilhas', d: 'M79 292C72 307 73 329 80 339L102 338 104 298ZM161 292C168 307 167 329 160 339L138 338 136 298Z' },
  ],
  female: [
    { muscle: 'ombros', d: 'M62 112C69 96 84 93 98 106L89 126C78 126 68 121 62 112ZM178 112C171 96 156 93 142 106L151 126C162 126 172 121 178 112Z' },
    { muscle: 'peito', d: 'M89 117C100 110 111 112 119 124L116 153C104 151 94 146 87 137ZM151 117C140 110 129 112 121 124L124 153C136 151 146 146 153 137Z' },
    { muscle: 'costas', d: 'M81 124C75 138 75 163 84 179L97 168 92 133ZM159 124C165 138 165 163 156 179L143 168 148 133Z' },
    { muscle: 'bíceps', d: 'M54 139C45 151 42 176 49 190 58 181 62 162 64 146ZM186 139C195 151 198 176 191 190 182 181 178 162 176 146Z' },
    { muscle: 'tríceps', d: 'M47 157C39 177 36 199 40 217L52 219C57 198 59 177 57 158ZM193 157C201 177 204 199 200 217L188 219C183 198 181 177 183 158Z' },
    { muscle: 'core', d: 'M93 158C101 164 110 168 120 170 130 168 139 164 147 158L151 202C143 214 132 221 120 224 108 221 97 214 89 202Z' },
    { muscle: 'quadríceps', d: 'M82 215C94 218 106 222 116 230L105 287 81 290 70 247ZM158 215C146 218 134 222 124 230L135 287 159 290 170 247Z' },
    { muscle: 'posteriores', d: 'M70 229C64 248 68 277 80 293L88 277 84 235ZM170 229C176 248 172 277 160 293L152 277 156 235Z' },
    { muscle: 'panturrilhas', d: 'M80 293C73 308 74 329 81 339L103 338 105 299ZM160 293C167 308 166 329 159 339L137 338 135 299Z' },
  ],
};

const normalizeScannerGender = (gender) => (gender === 'female' ? 'female' : 'male');

const findMuscle = (exerciseName = '') => {
  const cleanName = String(exerciseName).split('(')[0].trim();
  if (MUSCLE_MAP[cleanName]) return MUSCLE_MAP[cleanName];

  const partialMatch = Object.keys(MUSCLE_MAP)
    .find((candidate) => cleanName.toLocaleLowerCase('pt-BR').includes(candidate.toLocaleLowerCase('pt-BR')));
  return partialMatch ? MUSCLE_MAP[partialMatch] : null;
};

const getHeatColor = (sets, target = 12) => {
  const percentage = Math.min(100, (sets / target) * 100);
  if (percentage === 0) return 'rgba(100, 116, 139, 0.12)';
  if (percentage < 50) return 'rgba(var(--primary), 0.36)';
  if (percentage < 100) return 'rgba(var(--primary), 0.7)';
  return 'rgba(var(--danger), 0.84)';
};

const MuscleHeatmap = ({ history, profileGender }) => {
  const persistedGender = normalizeScannerGender(profileGender);
  const [gender, setGender] = useState(persistedGender);
  const rawId = useId();
  const scannerId = rawId.replace(/:/g, '');

  useEffect(() => {
    setGender(persistedGender);
  }, [persistedGender]);

  const heatData = useMemo(() => {
    const data = { ...EMPTY_HEAT_DATA };
    const sessions = Array.isArray(history) ? history : [];

    sessions.forEach((session) => {
      const daysAgo = daysBetweenLocalDates(session?.dateKey, getLocalDateKey());
      if (daysAgo === null || daysAgo < 0 || daysAgo > 7 || !Array.isArray(session?.exercises)) return;

      session.exercises.forEach((exercise) => {
        const muscle = findMuscle(exercise?.name);
        if (!muscle) return;

        const completedSets = Array.isArray(exercise?.sets)
          ? exercise.sets.filter((set) => set?.completed).length
          : 0;
        data[muscle] += completedSets;
      });
    });

    return data;
  }, [history]);

  const zoneProps = (muscle) => {
    const sets = heatData[muscle];
    const overloaded = sets >= 12;
    const active = sets > 0;

    return {
      fill: getHeatColor(sets),
      stroke: overloaded ? 'rgba(var(--danger), 0.95)' : 'rgba(var(--primary), 0.7)',
      strokeWidth: active ? 1.8 : 1,
      className: overloaded ? 'scanner-heat-overload' : active ? 'scanner-heat-active' : 'scanner-heat-rest',
    };
  };

  const warriorAsset = gender === 'female' ? femaleWarrior : maleWarrior;
  const anatomyLabel = gender === 'female' ? 'feminina' : 'masculina';

  return (
    <section className="relative mt-6 overflow-hidden rounded-3xl border-2 border-border bg-card p-4 shadow-lg transition-colors duration-300 dark:shadow-[0_0_30px_rgba(0,0,0,0.5)] sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.035)_1px,transparent_1px)] bg-[size:20px_20px] transition-colors duration-300 dark:bg-[linear-gradient(rgba(var(--primary),0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--primary),0.035)_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute left-1/2 top-32 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary">
            <Activity size={18} aria-hidden="true" /> Scanner biométrico
          </h3>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Ativação muscular · últimos 7 dias</p>
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-input/80 p-1" aria-label="Prévia de anatomia">
          <button
            type="button"
            aria-label="Exibir anatomia masculina"
            aria-pressed={gender === 'male'}
            onClick={() => setGender('male')}
            className={`touch-target flex items-center justify-center rounded-lg transition-all ${gender === 'male' ? 'bg-primary text-on-primary shadow-sm' : 'text-muted hover:text-main'}`}
          >
            <User size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Exibir anatomia feminina"
            aria-pressed={gender === 'female'}
            onClick={() => setGender('female')}
            className={`touch-target flex items-center justify-center rounded-lg transition-all ${gender === 'female' ? 'bg-primary text-on-primary shadow-sm' : 'text-muted hover:text-main'}`}
          >
            <Users size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1 sm:gap-4">
        <div className="relative flex min-w-0 justify-center py-2">
          <svg
            viewBox="0 0 240 360"
            role="img"
            aria-label={`Mapa de ativação muscular em anatomia ${anatomyLabel}`}
            className="h-auto w-full max-w-[230px] overflow-visible drop-shadow-md dark:drop-shadow-[0_0_14px_rgba(var(--primary),0.25)]"
          >
            <defs>
              <pattern id={`${scannerId}-scanlines`} patternUnits="userSpaceOnUse" width="4" height="4">
                <path d="M0 0h240" stroke="rgba(3, 12, 24, 0.3)" strokeWidth="1" />
              </pattern>
              <radialGradient id={`${scannerId}-aura`} cx="50%" cy="46%" r="54%">
                <stop offset="0" stopColor="rgb(var(--primary))" stopOpacity="0.16" />
                <stop offset="0.72" stopColor="rgb(var(--primary))" stopOpacity="0.04" />
                <stop offset="1" stopColor="rgb(var(--primary))" stopOpacity="0" />
              </radialGradient>
              <filter id={`${scannerId}-soft-glow`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <ellipse cx="120" cy="179" rx="105" ry="169" fill={`url(#${scannerId}-aura)`} />
            <ellipse cx="120" cy="348" rx="72" ry="8" fill="rgba(var(--primary), 0.2)" filter={`url(#${scannerId}-soft-glow)`} />
            <image href={warriorAsset} x="0" y="0" width="240" height="360" preserveAspectRatio="xMidYMid meet" />

            <g className="scanner-heat-zones">
              {BODY_ZONES[gender].map(({ muscle, d }) => (
                <path key={muscle} d={d} {...zoneProps(muscle)}>
                  <title>{`${muscle}: ${heatData[muscle]} séries concluídas`}</title>
                </path>
              ))}
            </g>

            <rect x="17" y="4" width="206" height="346" rx="26" fill={`url(#${scannerId}-scanlines)`} opacity="0.28" />
            <line x1="22" y1="15" x2="218" y2="15" stroke="rgb(var(--primary))" strokeWidth="2" className="scanner-scanline" />
          </svg>
        </div>

        <div className="flex w-[88px] flex-col gap-2 rounded-xl border border-border bg-card/90 p-2 text-right text-[9px] font-bold uppercase tracking-wide text-muted shadow-sm backdrop-blur-md sm:w-[112px] sm:text-[10px]">
          <div className="flex items-center justify-end gap-1 text-danger">
            <Activity size={10} aria-hidden="true" /> Sobrecarga
          </div>
          <div className="flex items-center justify-end gap-1 text-primary">
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_5px_rgba(var(--primary),1)]" /> Ativado
          </div>
          <div className="flex items-center justify-end gap-1 opacity-60">
            <span className="h-2 w-2 rounded-full bg-slate-400" /> Descanso
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-2 grid grid-cols-3 gap-1.5 border-t border-border/30 pt-3">
        {Object.entries(heatData).map(([muscle, sets]) => {
          const isOverload = sets >= 12;
          return (
            <div key={muscle} className={`rounded-lg border px-1 py-2 text-center transition-colors ${isOverload ? 'border-danger/50 bg-danger/10 shadow-sm' : 'border-border/50 bg-input/50'}`}>
              <p className="mb-1 break-words text-[10px] font-black uppercase leading-tight text-muted sm:text-[11px]">{muscle}</p>
              <p className={`text-xs font-black leading-none ${isOverload ? 'text-danger' : 'text-primary'}`}>{sets}</p>
            </div>
          );
        })}
      </div>

      <style>{`
        .scanner-heat-zones path { transition: fill 350ms ease, stroke 350ms ease, filter 350ms ease; }
        .scanner-heat-active { filter: drop-shadow(0 0 5px rgba(var(--primary), 0.72)); }
        .scanner-heat-rest { opacity: 0.78; }
        .scanner-heat-overload { animation: scanner-pulse-danger 2s ease-in-out infinite; }
        .scanner-scanline { animation: scanner-scan 3.2s linear infinite; filter: drop-shadow(0 0 4px rgba(var(--primary), .9)); }
        @keyframes scanner-pulse-danger {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(var(--danger), 0.55)); }
          50% { filter: drop-shadow(0 0 12px rgba(var(--danger), 0.9)); }
        }
        @keyframes scanner-scan {
          0% { transform: translateY(0); opacity: 0; }
          10%, 90% { opacity: 1; }
          100% { transform: translateY(325px); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .scanner-heat-overload, .scanner-scanline { animation: none; }
        }
      `}</style>
    </section>
  );
};

export default MuscleHeatmap;
