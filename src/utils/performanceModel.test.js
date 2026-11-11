import { describe, expect, it } from 'vitest';
import { getBestCompletedSet, getExercisePerformance } from './performanceModel';

describe('resumo de performance do exercício', () => {
  it('escolhe a maior carga da última sessão e desempata por repetições', () => {
    const performance = getExercisePerformance([{ dateKey: '2026-08-20', exercises: [{
      name: 'Rosca Direta (Barra)',
      loadMode: 'total',
      sets: [
        { weight: '10', reps: '8', completed: true },
        { weight: '10', reps: '8', completed: true },
        { weight: '12', reps: '6', completed: true },
      ],
    }] }], 'Rosca Direta', { loadMode: 'total' });
    expect(performance.lastSummary).toBe('12 kg total × 6');
    expect(performance.pr.primary).toBe('12 kg total');
    expect(performance.lastBestIsPr).toBe(true);
  });

  it('mostra semântica por halter e total canônico separadamente', () => {
    const performance = getExercisePerformance([{ dateKey: '2026-08-20', exercises: [{
      name: 'Rosca Alternada',
      loadMode: 'per_hand',
      sets: [{ weight: '24', reps: '8', completed: true, loadMode: 'per_hand' }],
    }] }], 'Rosca Alternada (Halter)', { loadMode: 'per_hand' });
    expect(performance.pr).toEqual({ primary: '24 kg por halter', secondary: 'Total canônico: 48 kg' });
  });

  it.each([
    ['machine', 'Cadeira extensora', { weight: 40, reps: 10 }, '40 kg na máquina'],
    ['per_side', 'Agachamento com barra', { weight: 20, reps: 8, barWeight: 20 }, '20 kg por lado + barra de 20 kg'],
  ])('cria PR para o modo canônico %s', (loadMode, name, set, expectedPrimary) => {
    const performance = getExercisePerformance([{
      dateKey: '2026-09-20',
      exercises: [{ name, loadMode, sets: [{ ...set, completed: true }] }],
    }], name, { name, loadMode, barWeight: set.barWeight });
    expect(performance.pr.primary).toBe(expectedPrimary);
  });

  it('não cria PR falso quando não há histórico', () => {
    expect(getExercisePerformance([], 'Supino', { loadMode: 'total' })).toMatchObject({ lastSummary: '', pr: null });
  });

  it('mantém referência e PR com pequenas diferenças no nome', () => {
    const performance = getExercisePerformance([{
      dateKey: '2026-09-20',
      exercises: [{
        name: 'Supino reto (barra)',
        loadMode: 'total',
        sets: [{ weight: 70, reps: 8, completed: true }],
      }],
    }], 'SUPINO RETO', { loadMode: 'total' });
    expect(performance.lastSummary).toBe('70 kg total × 8');
    expect(performance.pr.primary).toBe('70 kg total');
  });

  it('não mistura referências de mesmo nome com modos de carga incompatíveis', () => {
    const performance = getExercisePerformance([
      { dateKey: '2026-09-21', exercises: [{ name: 'Rosca Direta', loadMode: 'total', sets: [{ weight: 40, reps: 8, completed: true }] }] },
      { dateKey: '2026-09-20', exercises: [{ name: 'Rosca Direta', loadMode: 'per_hand', sets: [{ weight: 16, reps: 10, completed: true }] }] },
    ], 'Rosca Direta', { loadMode: 'per_hand' });
    expect(performance.lastSummary).toBe('16 kg por halter × 10');
    expect(performance.pr.primary).toBe('16 kg por halter');
    expect(performance.exercises).toHaveLength(1);
  });

  it('não confunde histórico do supino inclinado em máquina com a versão de barra', () => {
    const history = [
      { dateKey: '2026-09-22', exercises: [{ name: 'Supino Inclinado Máquina', loadMode: 'machine', sets: [{ weight: 80, reps: 10, completed: true }] }] },
      { dateKey: '2026-09-21', exercises: [{ name: 'Supino Inclinado com Barra', loadMode: 'total', sets: [{ weight: 60, reps: 8, completed: true }] }] },
    ];
    const performance = getExercisePerformance(
      history,
      'Supino Inclinado com Barra',
      { loadMode: 'total' },
    );
    expect(performance.lastSummary).toBe('60 kg total × 8');
    expect(performance.pr.primary).toBe('60 kg total');
    expect(performance.exercises).toHaveLength(1);
  });

  it('em empate de carga escolhe a série com mais repetições', () => {
    const record = getBestCompletedSet({
      name: 'Supino',
      loadMode: 'total',
      sets: [
        { weight: 20, reps: 8, completed: true },
        { weight: 20, reps: 10, completed: true },
        { weight: 15, reps: 15, completed: true },
      ],
    });
    expect(record.set).toMatchObject({ weight: 20, reps: 10 });
  });

  it('não troca a sessão anterior por uma sessão antiga com carga maior', () => {
    const performance = getExercisePerformance([
      { dateKey: '2026-09-20', exercises: [{ name: 'Supino', loadMode: 'total', sets: [{ weight: 80, reps: 12, completed: true }] }] },
      { dateKey: '2026-07-20', exercises: [{ name: 'Supino', loadMode: 'total', sets: [{ weight: 100, reps: 8, completed: true }] }] },
    ], 'Supino', { loadMode: 'total' });
    expect(performance.lastSummary).toBe('80 kg total × 12');
    expect(performance.pr.primary).toBe('100 kg total');
    expect(performance.lastBestIsPr).toBe(false);
  });

  it.each([
    ['bodyweight', 'reps', 10, { reps: 15 }, '15 reps'],
    ['reps_only', 'reps', 10, { reps: 20 }, '20 reps'],
    ['duration', 'duration', 10, { duration: 60 }, '60 s'],
    ['distance', 'distance', 1, { distance: 3 }, '3 km'],
  ])('escolhe o maior valor para o modo %s', (loadMode, field, initialValue, expectedSet, expectedSummary) => {
    const exercise = {
      name: 'Exercício',
      loadMode,
      sets: [
        { [field]: initialValue, completed: true },
        { ...expectedSet, completed: true },
      ],
    };
    const record = getBestCompletedSet(exercise);
    expect(record.set).toMatchObject(expectedSet);
    const performance = getExercisePerformance([{
      dateKey: '2026-09-20', exercises: [exercise],
    }], 'Exercício', { loadMode });
    expect(performance.lastSummary).toBe(expectedSummary);
    expect(performance.pr.primary).toBe(expectedSummary);
  });

  it('para exercício assistido escolhe menor assistência e desempata por reps', () => {
    const record = getBestCompletedSet({
      name: 'Barra assistida',
      loadMode: 'assisted',
      sets: [
        { weight: 30, reps: 12, completed: true },
        { weight: 20, reps: 8, completed: true },
        { weight: 20, reps: 10, completed: true },
      ],
    });
    expect(record.set).toMatchObject({ weight: 20, reps: 10 });
    const performance = getExercisePerformance([{
      dateKey: '2026-09-20', exercises: [{
        name: 'Barra assistida', loadMode: 'assisted', sets: [record.set],
      }],
    }], 'Barra assistida', { loadMode: 'assisted' });
    expect(performance.lastSummary).toBe('20 kg de assistência × 10');
    expect(performance.pr.primary).toBe('20 kg de assistência × 10');
  });

  it('recupera PR de máquina em histórico legado sem loadMode', () => {
    const performance = getExercisePerformance([{
      dateKey: '2026-09-20',
      exercises: [{
        name: 'Cadeira extensora',
        sets: [{ weight: 40, reps: 10, completed: true }],
      }],
    }], 'Cadeira extensora', { name: 'Cadeira extensora', loadMode: 'machine' });
    expect(performance.lastSummary).toBe('40 kg na máquina × 10');
    expect(performance.pr.primary).toBe('40 kg na máquina');
  });

  it('desempata PR canônico por repetições sem confundir Melhor da última', () => {
    const performance = getExercisePerformance([
      { dateKey: '2026-09-21', exercises: [{ name: 'Supino', loadMode: 'total', sets: [{ weight: 100, reps: 6, completed: true }] }] },
      { dateKey: '2026-09-20', exercises: [{ name: 'Supino', loadMode: 'total', sets: [{ weight: 100, reps: 8, completed: true }] }] },
    ], 'Supino', { loadMode: 'total' });
    expect(performance.lastSummary).toBe('100 kg total × 6');
    expect(performance.prRecord.reps).toBe(8);
    expect(performance.lastBestIsPr).toBe(false);
  });
});
