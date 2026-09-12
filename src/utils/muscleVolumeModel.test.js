import { describe, expect, it } from 'vitest';
import { getMuscleVolumeDistribution } from './muscleVolumeModel';

const completed = (weight, reps, loadMode = 'total') => ({
  weight,
  reps,
  loadMode,
  completed: true,
});

const byName = (distribution, name) => distribution.find((item) => item.name === name);

describe('distribuição de volume por grupo muscular', () => {
  it('calcula a participação pelo volume acumulado, não pela quantidade de séries', () => {
    const result = getMuscleVolumeDistribution([{
      dateKey: '2026-08-30',
      exercises: [
        { name: 'Supino reto', loadMode: 'total', sets: [completed(100, 10)] },
        { name: 'Remada baixa', loadMode: 'total', sets: [completed(10, 5), completed(10, 5)] },
      ],
    }], { referenceDateKey: '2026-08-30' });

    expect(byName(result, 'PEITO')).toMatchObject({ volume: 1000, percentage: 91 });
    expect(byName(result, 'COSTAS')).toMatchObject({ volume: 100, percentage: 9 });
  });

  it('reutiliza o volume canônico para cargas por lado, por halter e máquina', () => {
    const result = getMuscleVolumeDistribution([{
      dateKey: '2026-08-20',
      exercises: [
        { name: 'Supino reto halteres', loadMode: 'per_hand', sets: [completed('20', '10', 'per_hand')] },
        { name: 'Remada baixa', loadMode: 'per_side', barWeight: 20, sets: [completed('15', '8', 'per_side')] },
        { name: 'Leg press', loadMode: 'machine', sets: [completed('100', '5', 'machine')] },
      ],
    }], { referenceDateKey: '2026-08-20' });

    expect(byName(result, 'PEITO').volume).toBe(400);
    expect(byName(result, 'COSTAS').volume).toBe(400);
    expect(byName(result, 'PERNAS').volume).toBe(500);
  });

  it('ignora datas futuras, sessões fora da janela e séries sem volume canônico válido', () => {
    const result = getMuscleVolumeDistribution([
      {
        dateKey: '2026-08-20',
        exercises: [
          { name: 'Supino reto', loadMode: 'total', sets: [completed(50, 10), { ...completed(500, 10), completed: false }] },
          { name: 'Prancha', loadMode: 'duration', sets: [{ duration: 60, completed: true, loadMode: 'duration' }] },
          { name: 'Barra fixa assistida', loadMode: 'assisted', sets: [completed(20, 8, 'assisted')] },
          { name: 'Rosca direta', loadMode: 'total', sets: [completed('inválido', 10)] },
        ],
      },
      { dateKey: '2026-08-21', exercises: [{ name: 'Supino reto', sets: [completed(999, 10)] }] },
      { dateKey: '2026-07-20', exercises: [{ name: 'Supino reto', sets: [completed(999, 10)] }] },
    ], { referenceDateKey: '2026-08-20', windowDays: 30 });

    expect(byName(result, 'PEITO')).toMatchObject({ volume: 500, percentage: 100 });
    expect(result.reduce((sum, item) => sum + item.volume, 0)).toBe(500);
  });

  it('mantém volume válido de exercícios não mapeados em Outros', () => {
    const result = getMuscleVolumeDistribution([{
      dateKey: '2026-08-20',
      exercises: [{ name: 'Exercício personalizado', sets: [completed('12,5', 8)] }],
    }], { referenceDateKey: '2026-08-20' });

    expect(byName(result, 'OUTROS')).toMatchObject({ volume: 100, percentage: 100 });
  });

  it('classifica variações acentuadas de cadeia posterior como pernas', () => {
    const result = getMuscleVolumeDistribution([{
      dateKey: '2026-08-20',
      exercises: [
        { name: 'Levantamento terra romeno', sets: [completed(80, 8)] },
        { name: 'Elevação pélvica', sets: [completed(100, 8)] },
        { name: 'Afundo búlgaro', loadMode: 'per_hand', sets: [completed(20, 10, 'per_hand')] },
      ],
    }], { referenceDateKey: '2026-08-20' });

    expect(byName(result, 'PERNAS')).toMatchObject({ volume: 1840, percentage: 100 });
    expect(result.find((item) => item.name === 'OUTROS')).toBeUndefined();
    expect(byName(result, 'COSTAS').volume).toBe(0);
  });
});
