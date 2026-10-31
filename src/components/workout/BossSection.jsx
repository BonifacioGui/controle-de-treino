import React, { useEffect, useRef, useState } from 'react';
import { Crosshair, ShieldCheck, Sparkles, Swords, X, Zap } from 'lucide-react';
import scavengerImg from '../../assets/scavenger.webp';
import revenantImg from '../../assets/t-800.webp';
import colossusImg from '../../assets/mechagodzilla.webp';
import ironTitanImg from '../../assets/irontitan.webp';
import wardenImg from '../../assets/adamsmasher.webp';
import { readUserStoredJSON, STORAGE_KEYS, writeUserStoredJSON } from '../../utils/storage';

const BOSS_ASSETS = {
  scavenger: scavengerImg,
  revenant: revenantImg,
  colossus: colossusImg,
  'iron-titan': ironTitanImg,
  warden: wardenImg,
};

const BOSS_STAGE_VISUALS = {
  1: { label: 'Forma I', scale: 1, saturation: 0.85, glow: 0.12 },
  2: { label: 'Forma II', scale: 1.03, saturation: 0.95, glow: 0.17 },
  3: { label: 'Forma III', scale: 1.06, saturation: 1.05, glow: 0.22 },
  4: { label: 'Forma IV', scale: 1.09, saturation: 1.15, glow: 0.28 },
  5: { label: 'Forma V', scale: 1.12, saturation: 1.25, glow: 0.34 },
};

const BossSection = ({ encounter, theme = 'dark', experienceMode = 'balanced', userId }) => {
  const previousDamage = useRef(encounter?.damage || 0);
  const previousDefeated = useRef(encounter?.defeated === true);
  const [hit, setHit] = useState(false);
  const [defeatFeedback, setDefeatFeedback] = useState(false);
  const [showIntro, setShowIntro] = useState(() => Boolean(
    userId && !readUserStoredJSON(userId, STORAGE_KEYS.bossIntroSeen, false),
  ));

  useEffect(() => {
    if (!encounter) return undefined;
    const timers = [];
    if (encounter.damage > previousDamage.current) {
      timers.push(window.setTimeout(() => setHit(true), 0));
      timers.push(window.setTimeout(() => setHit(false), 260));
    }
    if (encounter.defeated && !previousDefeated.current) {
      timers.push(window.setTimeout(() => setDefeatFeedback(true), 0));
      timers.push(window.setTimeout(() => setDefeatFeedback(false), 2400));
    }
    previousDamage.current = encounter.damage;
    previousDefeated.current = encounter.defeated;
    return () => timers.forEach(window.clearTimeout);
  }, [encounter]);

  if (!encounter) return null;

  const progress = Math.min(100, Math.max(0, (encounter.damage / encounter.maxHp) * 100));
  const image = BOSS_ASSETS[encounter.bossAssetKey] || scavengerImg;
  const discreet = experienceMode === 'discreet';
  const immersive = experienceMode === 'immersive';
  const tacticalLab = theme === 'light';
  const criticalBonus = Number(encounter.criticalBonus) || 0;
  const criticalHits = Number(encounter.criticalHits) || 0;
  const powerBonus = Number(encounter.powerBonus) || 0;
  const powerHits = Number(encounter.powerHits) || 0;
  const evolutionStage = Math.min(5, Math.max(1, Number(encounter.evolutionStage) || 1));
  const stageVisual = BOSS_STAGE_VISUALS[evolutionStage];
  const dismissIntro = () => {
    if (userId) writeUserStoredJSON(userId, STORAGE_KEYS.bossIntroSeen, true);
    setShowIntro(false);
  };

  return (
    <section
      aria-label={discreet ? 'Meta de performance' : `${tacticalLab ? 'Análise do alvo' : 'Boss de treino'}: ${encounter.bossName}`}
      className={`solo-boss-card relative overflow-hidden rounded-2xl border bg-card ${tacticalLab ? 'is-light-dossier' : ''} ${encounter.defeated ? 'is-defeated border-success/60' : evolutionStage >= 4 ? 'border-secondary/70' : 'border-secondary/40'} ${hit ? 'is-hit' : ''} ${immersive ? 'is-immersive' : ''}`}
      style={{ boxShadow: `0 0 ${12 + (evolutionStage * 3)}px ${encounter.bossAura || '#00f3ff'}${Math.round(stageVisual.glow * 255).toString(16).padStart(2, '0')}` }}
    >
      {showIntro && (
        <div className="relative z-20 flex items-start gap-3 border-b border-primary/30 bg-primary/10 px-3 py-3 text-xs leading-relaxed text-muted sm:px-4">
          <ShieldCheck className="mt-0.5 shrink-0 text-primary" size={17} />
          <p className="flex-1"><strong className="text-main">Como funciona:</strong> séries confirmadas causam dano pelo volume real. Novo recorde de carga gera CRITICAL HIT (+20%); mais repetições na mesma carga gera POWER HIT (+10%).</p>
          <button type="button" onClick={dismissIntro} aria-label="Entendi, fechar explicação" className="touch-target -m-2 flex items-center justify-center text-muted hover:text-main"><X size={18} /></button>
        </div>
      )}
      <div className="flex min-h-24 items-stretch">
        {!discreet && (
          <div className="boss-portrait relative w-24 shrink-0 overflow-hidden border-r border-border bg-black/50 sm:w-32">
            <img
              src={image}
              alt={`Retrato de ${encounter.bossName}`}
              loading="lazy"
              className="h-full w-full object-cover opacity-80 transition-transform duration-500"
              style={{ transform: `scale(${stageVisual.scale})`, filter: `saturate(${stageVisual.saturation})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card" />
          </div>
        )}

        <div className="min-w-0 flex-1 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-secondary">
                {discreet || tacticalLab ? <Crosshair size={14} /> : <Swords size={14} />}
                {encounter.defeated ? (tacticalLab ? 'TARGET NEUTRALIZED' : 'Alvo neutralizado') : discreet ? 'Meta de performance' : tacticalLab ? 'TARGET ANALYSIS' : 'Boss de treino'}
              </p>
              <h2 className="mt-1 truncate font-cyber text-base font-black uppercase text-main sm:text-lg">
                {discreet ? 'Superar desempenho recente' : tacticalLab ? <><span className="hidden sm:inline">TARGET // </span>{encounter.bossName}</> : encounter.bossName}
              </h2>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="rounded-lg border border-secondary/30 px-2 py-1 text-xs font-black text-secondary">Tier {encounter.bossTier || 1}</span>
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-muted">{encounter.evolutionLabel || stageVisual.label}</span>
              {encounter.defeated && <span className="flex items-center gap-1 text-[10px] font-black text-success"><ShieldCheck size={12} /> Derrotado</span>}
            </div>
          </div>

          <div className="mt-3 h-2.5 overflow-hidden rounded-full border border-border bg-input" role="progressbar" aria-label="Progresso da meta de performance" aria-valuemin="0" aria-valuemax={encounter.maxHp} aria-valuenow={Math.min(encounter.damage, encounter.maxHp)}>
            <div className={`h-full transition-[width] duration-500 ${encounter.defeated ? 'bg-success' : 'bg-gradient-to-r from-secondary to-primary'}`} style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 text-xs">
            <span className="font-bold text-main">Dano: {Math.round(encounter.damage).toLocaleString('pt-BR')} / {Math.round(encounter.maxHp).toLocaleString('pt-BR')} HP</span>
            <span className="font-mono font-black text-muted">{Math.round(progress)}%</span>
          </div>
          {criticalBonus > 0 && (
            <p className="mt-2 flex items-center gap-1 text-xs font-bold text-gold"><Sparkles size={14} /> {criticalHits} {criticalHits === 1 ? 'CRITICAL HIT' : 'CRITICAL HITS'} • bônus +{Math.round(criticalBonus).toLocaleString('pt-BR')}</p>
          )}
          {powerBonus > 0 && (
            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-primary"><Zap size={14} /> {powerHits} {powerHits === 1 ? 'POWER HIT' : 'POWER HITS'} • bônus +{Math.round(powerBonus).toLocaleString('pt-BR')}</p>
          )}
          {encounter.overkill > 0 && <p className="mt-1 text-xs font-bold text-success">Overkill: {Math.round(encounter.overkill).toLocaleString('pt-BR')}</p>}
        </div>
      </div>

      {defeatFeedback && (
        <div role="status" className="absolute inset-x-3 bottom-3 rounded-xl border border-success/50 bg-card/95 px-4 py-3 text-center text-sm font-black uppercase tracking-wider text-success shadow-lg">
          Alvo neutralizado — continue seu treino
        </div>
      )}
    </section>
  );
};

export default BossSection;
