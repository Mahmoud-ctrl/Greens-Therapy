begin;

alter table public.patient_profiles
    add column email text;

alter table public.appointments
    add column is_read boolean not null default false;

create table public.clinic_settings (
    id boolean primary key default true check (id),
    working_days smallint[] not null default '{}'
        check (working_days <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
    start_time time without time zone,
    end_time time without time zone,
    slot_interval_minutes integer not null default 30
        check (slot_interval_minutes in (15, 30, 60)),
    updated_at timestamptz not null default now(),
    constraint clinic_settings_time_range_check
        check (
            (start_time is null and end_time is null)
            or (start_time is not null and end_time is not null and end_time > start_time)
        )
);

create trigger clinic_settings_set_updated_at
before update on public.clinic_settings
for each row execute function public.set_updated_at();

alter table public.clinic_settings enable row level security;

create policy clinic_settings_read
    on public.clinic_settings for select
    to anon, authenticated
    using (true);

create policy clinic_settings_admin_insert
    on public.clinic_settings for insert
    to authenticated
    with check (public.current_app_role() = 'admin');

create policy clinic_settings_admin_update
    on public.clinic_settings for update
    to authenticated
    using (public.current_app_role() = 'admin')
    with check (public.current_app_role() = 'admin');

grant select on public.clinic_settings to anon, authenticated;
grant insert (id, working_days, start_time, end_time, slot_interval_minutes)
    on public.clinic_settings to authenticated;
grant update (working_days, start_time, end_time, slot_interval_minutes)
    on public.clinic_settings to authenticated;

create function public.sync_patient_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    profile_name text;
begin
    profile_name := coalesce(
        nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(pg_catalog.split_part(coalesce(new.email, ''), '@', 1), ''),
        'Patient'
    );

    insert into public.patient_profiles (id, full_name, email, phone)
    values (
        new.id,
        profile_name,
        new.email,
        nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'phone'), '')
    )
    on conflict (id) do update
    set full_name = excluded.full_name,
        email = excluded.email,
        phone = excluded.phone;

    return new;
end;
$$;

revoke all on function public.sync_patient_profile_from_auth() from public, anon, authenticated;

create trigger auth_user_sync_patient_profile
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.sync_patient_profile_from_auth();

create function public.check_appointment_schedule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    settings public.clinic_settings%rowtype;
begin
    if new.status = 'cancelled' then
        return new;
    end if;

    perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(new.appointment_date::text, 0)
    );

    select *
    into settings
    from public.clinic_settings
    where id = true;

    if not found
       or settings.start_time is null
       or settings.end_time is null
       or not (extract(dow from new.appointment_date)::smallint = any(settings.working_days))
       or new.start_time < settings.start_time
       or new.end_time > settings.end_time
       or mod(
            (extract(epoch from (new.start_time - settings.start_time)) / 60)::integer,
            settings.slot_interval_minutes
       ) <> 0 then
        raise exception using
            errcode = '22023',
            message = 'The appointment is outside the clinic booking schedule.';
    end if;

    if exists (
        select 1
        from public.appointments as existing
        where existing.appointment_date = new.appointment_date
          and existing.status <> 'cancelled'
          and existing.id <> new.id
          and new.start_time < existing.end_time
          and new.end_time > existing.start_time
    ) then
        raise exception using
            errcode = '23P01',
            message = 'The selected appointment time is no longer available.';
    end if;

    return new;
end;
$$;

revoke all on function public.check_appointment_schedule() from public, anon, authenticated;

create trigger appointments_check_schedule
before insert or update of appointment_date, start_time, end_time, status
on public.appointments
for each row execute function public.check_appointment_schedule();

create function public.get_booked_appointment_slots(p_appointment_date date)
returns table (start_time time without time zone, end_time time without time zone)
language sql
stable
security definer
set search_path = ''
as $$
    select appointment.start_time, appointment.end_time
    from public.appointments as appointment
    where appointment.appointment_date = p_appointment_date
      and appointment.status <> 'cancelled'
    order by appointment.start_time;
$$;

revoke all on function public.get_booked_appointment_slots(date) from public, anon, authenticated;
grant execute on function public.get_booked_appointment_slots(date) to anon, authenticated;

grant update (is_read) on public.appointments to authenticated;

commit;
