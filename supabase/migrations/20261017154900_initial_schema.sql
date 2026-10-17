begin;

create table public.treatments (
    id uuid primary key default gen_random_uuid(),
    name_ar text not null check (length(btrim(name_ar)) > 0),
    name_en text not null check (length(btrim(name_en)) > 0),
    description_ar text not null default '',
    description_en text not null default '',
    price numeric(10, 2) not null check (price >= 0),
    duration_minutes integer not null check (duration_minutes > 0),
    is_active boolean not null default true,
    category text not null default '',
    image_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.patient_profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    full_name text not null check (length(btrim(full_name)) > 0),
    phone text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.appointments (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references public.patient_profiles (id) on delete restrict,
    treatment_id uuid not null references public.treatments (id) on delete restrict,
    appointment_date date not null,
    start_time time without time zone not null,
    end_time time without time zone not null,
    status text not null default 'pending'
        check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
    payment_status text not null default 'unpaid'
        check (payment_status in ('unpaid', 'paid', 'refunded')),
    treatment_name_ar_snapshot text not null,
    treatment_name_en_snapshot text not null,
    treatment_price_snapshot numeric(10, 2) not null
        check (treatment_price_snapshot >= 0),
    treatment_duration_minutes_snapshot integer not null
        check (treatment_duration_minutes_snapshot > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint appointments_time_range_check check (end_time > start_time)
);

create table public.products (
    id uuid primary key default gen_random_uuid(),
    name_ar text not null check (length(btrim(name_ar)) > 0),
    name_en text not null check (length(btrim(name_en)) > 0),
    description_ar text not null default '',
    description_en text not null default '',
    price numeric(10, 2) not null check (price >= 0),
    stock_quantity integer not null default 0 check (stock_quantity >= 0),
    is_active boolean not null default true,
    category text not null default '',
    weight text not null default '',
    image_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.inventory (
    id uuid primary key default gen_random_uuid(),
    product_id uuid not null references public.products (id) on delete restrict,
    quantity_delta integer not null check (quantity_delta <> 0),
    reason text not null check (length(btrim(reason)) > 0),
    created_by uuid references auth.users (id) on delete set null default auth.uid(),
    created_at timestamptz not null default now()
);

create index appointments_patient_date_idx
    on public.appointments (patient_id, appointment_date desc);
create index appointments_treatment_date_idx
    on public.appointments (treatment_id, appointment_date);
create index appointments_schedule_idx
    on public.appointments (appointment_date, start_time)
    where status in ('pending', 'confirmed');
create index inventory_product_created_at_idx
    on public.inventory (product_id, created_at desc);
create index treatments_active_category_idx
    on public.treatments (category, name_en)
    where is_active;
create index products_active_category_idx
    on public.products (category, name_en)
    where is_active;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = pg_catalog.now();
    return new;
end;
$$;

create trigger treatments_set_updated_at
before update on public.treatments
for each row execute function public.set_updated_at();

create trigger patient_profiles_set_updated_at
before update on public.patient_profiles
for each row execute function public.set_updated_at();

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create function public.current_app_role()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
    select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'patient');
$$;

create function public.snapshot_appointment_treatment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    selected_treatment public.treatments%rowtype;
begin
    select treatment.*
    into selected_treatment
    from public.treatments as treatment
    where treatment.id = new.treatment_id
      and treatment.is_active
    for share;

    if not found then
        raise exception using
            errcode = 'P0002',
            message = 'The selected treatment is unavailable.';
    end if;

    new.treatment_name_ar_snapshot := selected_treatment.name_ar;
    new.treatment_name_en_snapshot := selected_treatment.name_en;
    new.treatment_price_snapshot := selected_treatment.price;
    new.treatment_duration_minutes_snapshot := selected_treatment.duration_minutes;
    return new;
end;
$$;

create trigger appointments_snapshot_treatment
before insert on public.appointments
for each row execute function public.snapshot_appointment_treatment();

create function public.apply_inventory_quantity_delta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    update public.products
    set stock_quantity = stock_quantity + new.quantity_delta
    where id = new.product_id
      and stock_quantity + new.quantity_delta >= 0;

    if not found then
        raise exception using
            errcode = '23514',
            message = 'The inventory adjustment would result in negative stock.';
    end if;

    return new;
end;
$$;

create trigger inventory_apply_quantity_delta
after insert on public.inventory
for each row execute function public.apply_inventory_quantity_delta();

create function public.create_appointment(
    p_treatment_id uuid,
    p_appointment_date date,
    p_start_time time without time zone,
    p_end_time time without time zone
)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
    authenticated_patient_id uuid := auth.uid();
    selected_treatment public.treatments%rowtype;
    created_appointment public.appointments%rowtype;
begin
    if authenticated_patient_id is null or public.current_app_role() <> 'patient' then
        raise exception using
            errcode = '42501',
            message = 'Only an authenticated patient can create an appointment.';
    end if;

    if p_appointment_date is null
       or p_start_time is null
       or p_end_time is null
       or p_end_time <= p_start_time then
        raise exception using
            errcode = '22023',
            message = 'A valid appointment date and time range are required.';
    end if;

    select treatment.*
    into selected_treatment
    from public.treatments as treatment
    where treatment.id = p_treatment_id
      and treatment.is_active
    for share;

    if not found then
        raise exception using
            errcode = 'P0002',
            message = 'The selected treatment is unavailable.';
    end if;

    if p_appointment_date + p_end_time
       <> p_appointment_date + p_start_time
          + pg_catalog.make_interval(mins => selected_treatment.duration_minutes) then
        raise exception using
            errcode = '22023',
            message = 'The appointment end time must match the treatment duration.';
    end if;

    insert into public.appointments (
        patient_id,
        treatment_id,
        appointment_date,
        start_time,
        end_time,
        status,
        payment_status,
        treatment_name_ar_snapshot,
        treatment_name_en_snapshot,
        treatment_price_snapshot,
        treatment_duration_minutes_snapshot
    )
    values (
        authenticated_patient_id,
        p_treatment_id,
        p_appointment_date,
        p_start_time,
        p_end_time,
        'pending',
        'unpaid',
        '',
        '',
        0,
        1
    )
    returning * into created_appointment;

    return created_appointment;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.current_app_role() from public, anon, authenticated;
grant execute on function public.current_app_role() to authenticated;
revoke all on function public.snapshot_appointment_treatment() from public, anon, authenticated;
revoke all on function public.apply_inventory_quantity_delta() from public, anon, authenticated;
revoke all on function public.create_appointment(uuid, date, time without time zone, time without time zone)
    from public, anon, authenticated;
grant execute on function public.create_appointment(uuid, date, time without time zone, time without time zone)
    to authenticated;

alter table public.treatments enable row level security;
alter table public.patient_profiles enable row level security;
alter table public.appointments enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;

create policy treatments_read_active
    on public.treatments for select
    to anon, authenticated
    using (is_active);

create policy treatments_admin_read_all
    on public.treatments for select
    to authenticated
    using (public.current_app_role() = 'admin');

create policy treatments_admin_insert
    on public.treatments for insert
    to authenticated
    with check (public.current_app_role() = 'admin');

create policy treatments_admin_update
    on public.treatments for update
    to authenticated
    using (public.current_app_role() = 'admin')
    with check (public.current_app_role() = 'admin');

create policy treatments_admin_delete
    on public.treatments for delete
    to authenticated
    using (public.current_app_role() = 'admin');

create policy patient_profiles_read_self
    on public.patient_profiles for select
    to authenticated
    using (id = auth.uid() and public.current_app_role() = 'patient');

create policy patient_profiles_staff_read
    on public.patient_profiles for select
    to authenticated
    using (public.current_app_role() in ('receptionist', 'admin'));

create policy patient_profiles_insert_self
    on public.patient_profiles for insert
    to authenticated
    with check (id = auth.uid() and public.current_app_role() = 'patient');

create policy patient_profiles_update_self
    on public.patient_profiles for update
    to authenticated
    using (id = auth.uid() and public.current_app_role() = 'patient')
    with check (id = auth.uid() and public.current_app_role() = 'patient');

create policy patient_profiles_staff_insert
    on public.patient_profiles for insert
    to authenticated
    with check (public.current_app_role() in ('receptionist', 'admin'));

create policy patient_profiles_staff_update
    on public.patient_profiles for update
    to authenticated
    using (public.current_app_role() in ('receptionist', 'admin'))
    with check (public.current_app_role() in ('receptionist', 'admin'));

create policy appointments_read_self
    on public.appointments for select
    to authenticated
    using (patient_id = auth.uid() and public.current_app_role() = 'patient');

create policy appointments_staff_read
    on public.appointments for select
    to authenticated
    using (public.current_app_role() in ('receptionist', 'admin'));

create policy appointments_staff_insert
    on public.appointments for insert
    to authenticated
    with check (public.current_app_role() in ('receptionist', 'admin'));

create policy appointments_staff_update
    on public.appointments for update
    to authenticated
    using (public.current_app_role() in ('receptionist', 'admin'))
    with check (public.current_app_role() in ('receptionist', 'admin'));

create policy products_read_active
    on public.products for select
    to anon, authenticated
    using (is_active);

create policy products_admin_read_all
    on public.products for select
    to authenticated
    using (public.current_app_role() = 'admin');

create policy products_admin_insert
    on public.products for insert
    to authenticated
    with check (public.current_app_role() = 'admin');

create policy products_admin_update
    on public.products for update
    to authenticated
    using (public.current_app_role() = 'admin')
    with check (public.current_app_role() = 'admin');

create policy products_admin_delete
    on public.products for delete
    to authenticated
    using (public.current_app_role() = 'admin');

create policy inventory_staff_read
    on public.inventory for select
    to authenticated
    using (public.current_app_role() in ('receptionist', 'admin'));

create policy inventory_staff_insert
    on public.inventory for insert
    to authenticated
    with check (
        public.current_app_role() in ('receptionist', 'admin')
        and created_by = auth.uid()
    );

grant usage on schema public to anon, authenticated;

grant select on public.treatments, public.products to anon, authenticated;
grant insert, update, delete on public.treatments to authenticated;
grant insert (
    name_ar,
    name_en,
    description_ar,
    description_en,
    price,
    is_active,
    category,
    weight,
    image_url
) on public.products to authenticated;
grant delete on public.products to authenticated;
grant update (
    name_ar,
    name_en,
    description_ar,
    description_en,
    price,
    is_active,
    category,
    weight,
    image_url
) on public.products to authenticated;

grant select on public.patient_profiles to authenticated;
grant insert (id, full_name, phone) on public.patient_profiles to authenticated;
grant update (full_name, phone) on public.patient_profiles to authenticated;

grant select, insert on public.appointments to authenticated;
grant update (appointment_date, start_time, end_time, status, payment_status)
    on public.appointments to authenticated;

grant select on public.inventory to authenticated;
grant insert (product_id, quantity_delta, reason) on public.inventory to authenticated;

commit;
