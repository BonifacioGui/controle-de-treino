-- Versionamento otimista do plano. Execute no SQL Editor do Supabase antes de
-- habilitar a nova sincronização; o cliente não faz fallback para upsert inseguro.

alter table public.workout_plans
  add column if not exists version_id uuid default gen_random_uuid(),
  add column if not exists revision bigint default 1,
  add column if not exists updated_by_device text;

update public.workout_plans
set version_id = coalesce(version_id, gen_random_uuid()),
    revision = greatest(coalesce(revision, 1), 1),
    updated_at = coalesce(updated_at, now());

alter table public.workout_plans
  alter column version_id set default gen_random_uuid(),
  alter column version_id set not null,
  alter column revision set default 1,
  alter column revision set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

create table if not exists public.workout_plan_versions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_data jsonb not null,
  version_id uuid not null,
  revision bigint not null,
  updated_at timestamptz not null,
  updated_by_device text,
  archived_at timestamptz not null default now(),
  archive_reason text not null default 'update',
  unique (plan_id, version_id)
);

alter table public.workout_plan_versions enable row level security;

drop policy if exists "Users can read own workout plan versions" on public.workout_plan_versions;
create policy "Users can read own workout plan versions"
on public.workout_plan_versions for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own workout plan versions" on public.workout_plan_versions;
revoke insert, update, delete on table public.workout_plan_versions from anon, authenticated;
grant select on table public.workout_plan_versions to authenticated;

insert into public.workout_plan_versions (
  plan_id, user_id, plan_data, version_id, revision, updated_at,
  updated_by_device, archive_reason
)
select id, user_id, plan_data, version_id, revision, updated_at,
       updated_by_device, 'migration-baseline'
from public.workout_plans
on conflict (plan_id, version_id) do nothing;

create or replace function public.save_workout_plan(
  p_plan_data jsonb,
  p_expected_version_id uuid,
  p_device_id text,
  p_source text default 'user-edit'
)
returns table (
  plan_data jsonb,
  version_id uuid,
  revision bigint,
  updated_at timestamptz,
  updated_by_device text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_current public.workout_plans%rowtype;
  v_next_version uuid := gen_random_uuid();
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if p_plan_data is null or jsonb_typeof(p_plan_data) <> 'object' then
    raise exception 'INVALID_PLAN' using errcode = '22023';
  end if;

  select * into v_current
  from public.workout_plans wp
  where wp.user_id = v_user_id
  for update;

  if not found then
    if p_expected_version_id is not null then
      raise exception 'PLAN_CONFLICT' using errcode = '40001';
    end if;

    begin
      insert into public.workout_plans (
        user_id, plan_data, version_id, revision, updated_at, updated_by_device
      ) values (
        v_user_id, p_plan_data, v_next_version, 1, now(), p_device_id
      )
      returning * into v_current;
    exception when unique_violation then
      raise exception 'PLAN_CONFLICT' using errcode = '40001';
    end;
  else
    if p_expected_version_id is null or v_current.version_id <> p_expected_version_id then
      raise exception 'PLAN_CONFLICT' using errcode = '40001';
    end if;

    insert into public.workout_plan_versions (
      plan_id, user_id, plan_data, version_id, revision, updated_at,
      updated_by_device, archive_reason
    ) values (
      v_current.id, v_current.user_id, v_current.plan_data,
      v_current.version_id, v_current.revision, v_current.updated_at,
      v_current.updated_by_device, coalesce(nullif(p_source, ''), 'update')
    )
    on conflict (plan_id, version_id) do nothing;

    update public.workout_plans wp
    set plan_data = p_plan_data,
        version_id = v_next_version,
        revision = v_current.revision + 1,
        updated_at = now(),
        updated_by_device = p_device_id
    where wp.id = v_current.id
    returning wp.* into v_current;
  end if;

  return query select
    v_current.plan_data,
    v_current.version_id,
    v_current.revision,
    v_current.updated_at,
    v_current.updated_by_device;
end;
$$;

revoke insert, update, delete on table public.workout_plans from anon, authenticated;
grant select on table public.workout_plans to authenticated;
revoke all on function public.save_workout_plan(jsonb, uuid, text, text) from public;
grant execute on function public.save_workout_plan(jsonb, uuid, text, text) to authenticated;

comment on function public.save_workout_plan(jsonb, uuid, text, text) is
  'Saves a plan only when expected_version_id matches, archiving the previous version atomically.';
