import { describe, expect, it } from 'vitest';
import {
  buildMuscleGapNotification,
  getExerciseMuscleTargets,
  getPlannedMuscleFrequency,
  mergeNotificationCandidates,
} from './notificationModel';

const completedSet = { completed: true, weight: '40', reps: '10' };
const workoutData = {
  A: { exercises: [{ name: 'Supino reto' }, { name: 'Tríceps corda' }] },
  B: { exercises: [{ name: 'Remada baixa' }] },
  C: { exercises: [{ name: 'Agachamento livre' }] },
};

describe('central de notificações', () => {
  it('considera músculos primários e secundários', () => {
    expect(getExerciseMuscleTargets('Supino reto')).toEqual({ primary: ['PEITO'], secondary: ['BRAÇOS', 'OMBROS'] });
    expect(getExerciseMuscleTargets('Levantamento terra romeno')).toEqual({ primary: ['PERNAS'], secondary: ['CORE'] });
  });

  it('deriva frequência somente dos grupos existentes na ficha', () => {
    const frequency = getPlannedMuscleFrequency(workoutData);
    expect(frequency.PEITO.frequency).toBe(1);
    expect(frequency.COSTAS.frequency).toBe(1);
    expect(frequency.PERNAS.frequency).toBe(1);
    expect(frequency).not.toHaveProperty('OUTROS');
  });

  it('não alerta sem histórico suficiente ou durante pausa programada', () => {
    expect(buildMuscleGapNotification({ workoutData, history: [], referenceDateKey: '2026-09-18' })).toBeNull();
    const history = [
      { dateKey: '2026-09-01', exercises: [{ name: 'Supino reto', sets: [completedSet] }] },
      { dateKey: '2026-09-02', exercises: [{ name: 'Remada baixa', sets: [completedSet] }] },
    ];
    expect(buildMuscleGapNotification({ workoutData, history, preferences: { pauseUntil: '2026-09-20' }, referenceDateKey: '2026-09-18' })).toBeNull();
  });

  it('agrupa grupos atrasados e aponta para um treino da ficha', () => {
    const history = [
      { dateKey: '2026-09-01', exercises: [{ name: 'Supino reto', sets: [completedSet] }] },
      { dateKey: '2026-09-02', exercises: [{ name: 'Remada baixa', sets: [completedSet] }] },
    ];
    const notification = buildMuscleGapNotification({ workoutData, history, referenceDateKey: '2026-09-18', now: 10_000 });
    expect(notification.title).toContain('frequência');
    expect(notification.context.groups.length).toBeGreaterThan(1);
    expect(notification.action).toMatchObject({ view: 'workout' });
  });

  it('mantém leitura, deduplica itens ativos e respeita cooldown após dispensa', () => {
    const candidate = { dedupeKey: 'muscle-gap:active-plan', title: 'Teste', message: 'Teste', createdAt: '2026-09-18T00:00:00.000Z' };
    const created = mergeNotificationCandidates({}, candidate, { now: 1_000 });
    created.items[0].read = true;
    const updated = mergeNotificationCandidates(created, { ...candidate, message: 'Atualizado' }, { now: 2_000 });
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0]).toMatchObject({
      read: true,
      message: 'Atualizado',
      createdAt: '2026-09-18T00:00:00.000Z',
    });

    const dismissed = { ...updated, items: [] };
    expect(mergeNotificationCandidates(dismissed, candidate, { now: 3_000 }).items).toHaveLength(0);
  });
});
