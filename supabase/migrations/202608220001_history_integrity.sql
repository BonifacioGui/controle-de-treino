alter table if exists public.workout_history
  add column if not exists partial boolean,
  add column if not exists earned_xp numeric;

update public.workout_history
set earned_xp = floor(coalesce(total_volume, 0) * 0.05
  * case when upper(coalesce(overload_status, '')) = 'OVERLOAD' then 1.2 else 1 end)
  + coalesce(bonus_xp, 0)
where earned_xp is null;

update public.workout_history
set partial = coalesce(partial, false) or exists (
  select 1
  from jsonb_array_elements(coalesce(exercises::jsonb, '[]'::jsonb)) as exercise
  where coalesce((exercise->>'skipped')::boolean, false)
    or exists (
      select 1
      from jsonb_array_elements(coalesce(exercise->'sets', '[]'::jsonb)) as workout_set
      where not coalesce((workout_set->>'completed')::boolean, false)
    )
    or (
      nullif(substring(coalesce(exercise->>'actualSets', '') from '^\d+'), '')::integer
      > (
        select count(*)
        from jsonb_array_elements(coalesce(exercise->'sets', '[]'::jsonb)) as completed_set
        where coalesce((completed_set->>'completed')::boolean, false)
      )
    )
)
where partial is null or partial = false;

alter table if exists public.workout_history
  alter column partial set default false,
  alter column partial set not null,
  alter column earned_xp set default 0,
  alter column earned_xp set not null;
