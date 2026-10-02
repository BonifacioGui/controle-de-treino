import React from 'react';
import { AlertTriangle, Cloud, HardDrive } from 'lucide-react';

const PlanSummary = ({ icon, title, plan, timestamp }) => (
  <section className="rounded-2xl border border-border bg-input/60 p-4">
    <div className="flex items-center gap-2 text-main">
      {React.createElement(icon, { 'aria-hidden': true, size: 18, className: 'text-primary' })}
      <h3 className="font-black">{title}</h3>
    </div>
    {timestamp && <p className="mt-1 text-xs text-muted">Atualizado em {new Date(timestamp).toLocaleString('pt-BR')}</p>}
    <div className="mt-3 space-y-2">
      {Object.entries(plan || {}).map(([day, workout]) => (
        <div key={day} className="flex items-center justify-between gap-3 text-sm">
          <span className="font-black text-main">{day} · {workout?.focus || workout?.title || 'Sem foco'}</span>
          <span className="shrink-0 text-xs text-muted">{workout?.exercises?.length || 0} exercícios</span>
        </div>
      ))}
      {Object.keys(plan || {}).length === 0 && <p className="text-sm text-muted">Nenhum plano nesta versão.</p>}
    </div>
  </section>
);

const PlanConflictDialog = ({ conflict, schemaReady, onKeepLocal, onKeepRemote }) => {
  if (!conflict) return null;
  const hasRemotePlan = conflict.remotePlan && Object.keys(conflict.remotePlan).length > 0;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="plan-conflict-title" className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-warning/60 bg-card p-5 text-main shadow-2xl sm:p-6">
        <AlertTriangle aria-hidden="true" className="text-warning" size={32} />
        <h2 id="plan-conflict-title" className="mt-3 text-xl font-black">Há duas versões da sua ficha</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">Nada foi sobrescrito. Compare as versões e escolha qual deve continuar ativa. A versão descartada permanecerá salva no backup deste dispositivo.</p>

        {!schemaReady && (
          <p role="alert" className="mt-4 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm font-bold text-warning">O versionamento do Supabase ainda precisa ser instalado. Você pode revisar as versões agora, mas a cópia local só será enviada depois da migration.</p>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <PlanSummary icon={HardDrive} title="Neste dispositivo" plan={conflict.localPlan} />
          <PlanSummary icon={Cloud} title="Na nuvem" plan={conflict.remotePlan} timestamp={conflict.remoteUpdatedAt} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {hasRemotePlan && <button type="button" onClick={onKeepRemote} className="touch-target rounded-xl border border-primary px-4 font-black text-primary">Usar versão da nuvem</button>}
          <button type="button" onClick={onKeepLocal} className="touch-target rounded-xl bg-primary px-4 font-black text-on-primary">Manter versão deste dispositivo</button>
        </div>
      </div>
    </div>
  );
};

export default PlanConflictDialog;
