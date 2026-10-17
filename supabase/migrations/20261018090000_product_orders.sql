begin;

-- Product orders used to live only in the customer's browser (localStorage), so the clinic
-- never saw guest orders. They are now stored here and placed through create_product_order().

create table public.product_orders (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid references auth.users (id) on delete set null default auth.uid(),
    customer_name text not null check (length(btrim(customer_name)) between 1 and 120),
    customer_phone text not null check (length(btrim(customer_phone)) between 3 and 40),
    delivery_address text not null check (length(btrim(delivery_address)) between 1 and 500),
    location_url text check (location_url is null or (length(location_url) <= 1000 and location_url ~* '^https?://')),
    total numeric(10, 2) not null check (total >= 0),
    payment_method text not null default 'cash_on_delivery' check (payment_method in ('cash_on_delivery')),
    status text not null default 'new' check (status in ('new', 'preparing', 'delivered', 'cancelled')),
    is_read boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.product_order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references public.product_orders (id) on delete cascade,
    product_id uuid references public.products (id) on delete set null,
    product_name_ar text not null,
    product_name_en text not null,
    quantity integer not null check (quantity between 1 and 100),
    unit_price numeric(10, 2) not null check (unit_price >= 0)
);

create index product_orders_created_at_idx on public.product_orders (created_at desc);
create index product_order_items_order_idx on public.product_order_items (order_id);

create trigger product_orders_set_updated_at
before update on public.product_orders
for each row execute function public.set_updated_at();

alter table public.product_orders enable row level security;
alter table public.product_order_items enable row level security;

-- Only admins read and manage orders. Nobody inserts directly; orders go through the function below.
create policy product_orders_admin_read
    on public.product_orders for select
    to authenticated
    using (public.current_app_role() = 'admin');

create policy product_orders_admin_update
    on public.product_orders for update
    to authenticated
    using (public.current_app_role() = 'admin')
    with check (public.current_app_role() = 'admin');

create policy product_order_items_admin_read
    on public.product_order_items for select
    to authenticated
    using (public.current_app_role() = 'admin');

revoke all on public.product_orders from anon, authenticated;
revoke all on public.product_order_items from anon, authenticated;
grant select on public.product_orders to authenticated;
grant update (status, is_read) on public.product_orders to authenticated;
grant select on public.product_order_items to authenticated;

-- Places an order for guests and signed-in users. Prices, names and totals come from the
-- products table (never from the client), and every line is checked against active stock.
-- p_items: [{"product_id": "<uuid>", "quantity": <int>}, ...]
create function public.create_product_order(
    p_customer_name text,
    p_customer_phone text,
    p_delivery_address text,
    p_location_url text,
    p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    item jsonb;
    item_product_id uuid;
    item_quantity integer;
    selected_product public.products%rowtype;
    created_order public.product_orders%rowtype;
    order_total numeric(10, 2) := 0;
begin
    if jsonb_typeof(p_items) is distinct from 'array'
        or jsonb_array_length(p_items) = 0
        or jsonb_array_length(p_items) > 50 then
        raise exception using errcode = '22023', message = 'The order must contain between 1 and 50 products.';
    end if;

    if (select count(distinct value ->> 'product_id') from jsonb_array_elements(p_items)) <> jsonb_array_length(p_items) then
        raise exception using errcode = '22023', message = 'Each product can only appear once in an order.';
    end if;

    insert into public.product_orders (customer_name, customer_phone, delivery_address, location_url, total)
    values (btrim(p_customer_name), btrim(p_customer_phone), btrim(p_delivery_address), nullif(btrim(p_location_url), ''), 0)
    returning * into created_order;

    for item in select value from jsonb_array_elements(p_items) loop
        item_product_id := (item ->> 'product_id')::uuid;
        item_quantity := (item ->> 'quantity')::integer;

        select * into selected_product
        from public.products
        where id = item_product_id and is_active;

        if not found then
            raise exception using errcode = '22023', message = 'A product in this order is no longer available.';
        end if;

        if item_quantity is null or item_quantity < 1 or item_quantity > selected_product.stock_quantity then
            raise exception using errcode = '22023', message = format('Only %s of "%s" are in stock.', selected_product.stock_quantity, selected_product.name_en);
        end if;

        insert into public.product_order_items (order_id, product_id, product_name_ar, product_name_en, quantity, unit_price)
        values (created_order.id, selected_product.id, selected_product.name_ar, selected_product.name_en, item_quantity, selected_product.price);

        order_total := order_total + selected_product.price * item_quantity;
    end loop;

    update public.product_orders
    set total = order_total
    where id = created_order.id
    returning * into created_order;

    return jsonb_build_object(
        'id', created_order.id,
        'total', created_order.total,
        'created_at', created_order.created_at,
        'items', (
            select jsonb_agg(jsonb_build_object(
                'product_id', order_item.product_id,
                'product_name_ar', order_item.product_name_ar,
                'product_name_en', order_item.product_name_en,
                'quantity', order_item.quantity,
                'unit_price', order_item.unit_price
            ))
            from public.product_order_items as order_item
            where order_item.order_id = created_order.id
        )
    );
end;
$$;

revoke all on function public.create_product_order(text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.create_product_order(text, text, text, text, jsonb) to anon, authenticated;

-- Lets the admin dashboard receive new orders live.
alter publication supabase_realtime add table public.product_orders;

commit;
