import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL('../../supabase/migrations/202610020001_workout_plan_versioning.sql', import.meta.url),
  'utf8',
).toLowerCase();
const workoutHook = readFileSync(new URL('../hooks/useWorkout.js', import.meta.url), 'utf8');

describe('contrato de implantação segura do plano', () => {
  it('aplica versionamento, snapshot inicial e bloqueio de clientes legados atomicamente', () => {
    expect(migration.trimStart().includes('begin;')).toBe(true);
    expect(migration.trimEnd().endsWith('commit;')).toBe(true);
    expect(migration).toContain("'migration-baseline'");
    expect(migration).toContain('security definer');
    expect(migration).toContain('revoke insert, update, delete on table public.workout_plans from anon, authenticated');
    expect(migration.indexOf("'migration-baseline'")).toBeLessThan(
      migration.indexOf('revoke insert, update, delete on table public.workout_plans'),
    );
  });

  it('obriga o cliente novo a gravar pela RPC com comparação de versão', () => {
    expect(workoutHook).toContain("supabase.rpc('save_workout_plan'");
    expect(workoutHook).toContain('p_expected_version_id: planSync.baseVersionId');
    expect(workoutHook).not.toMatch(/from\('workout_plans'\)[\s\S]{0,250}\.upsert\(/);
  });
});
