-- =============================================================================
-- Commandes : caisse staff avec panier, commande depuis l'app (payée au comptoir
-- ou en ligne). Les prix viennent TOUJOURS de la table products (jamais du client)
-- et le crédit d'XP passe par une seule fonction interne, credit_purchase.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Catalogue : rayon « bar » (boissons, snacks) en plus de manga / tcg / goodies.
-- -----------------------------------------------------------------------------

alter table public.products drop constraint if exists products_category_check;
alter table public.products add constraint products_category_check
  check (category in ('bar', 'manga', 'tcg', 'goodies'));

-- -----------------------------------------------------------------------------
-- Crédit d'XP partagé (caisse, commande remise, paiement en ligne).
-- Interne : n'est exécutable que par les autres fonctions (security definer).
-- -----------------------------------------------------------------------------

create or replace function public.credit_purchase (p_user_id uuid, p_amount_chf numeric, p_cashier_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_amount      numeric(10, 2) := round(p_amount_chf, 2);
  v_xp          integer;
  v_season_id   uuid;
  v_before      public.profiles;
  v_after       public.profiles;
  v_transaction public.transactions;
begin
  if v_amount is null or v_amount <= 0 or v_amount > 10000 then
    raise exception 'INVALID_AMOUNT' using errcode = '22023';
  end if;

  select * into v_before from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'MEMBER_NOT_FOUND' using errcode = 'P0002';
  end if;

  v_xp := floor(v_amount * 10)::integer;
  select id into v_season_id from public.seasons where is_active limit 1;

  insert into public.transactions (user_id, cashier_id, season_id, amount_chf, xp_gained)
  values (p_user_id, p_cashier_id, v_season_id, v_amount, v_xp)
  returning * into v_transaction;

  update public.profiles
  set xp                   = xp + v_xp,
      current_season_spent = current_season_spent + v_amount,
      is_premium_pass      = is_premium_pass or (current_season_spent + v_amount >= 25.00)
  where id = p_user_id
  returning * into v_after;

  return jsonb_build_object(
    'transaction_id',       v_transaction.id,
    'user_id',              v_after.id,
    'username',             v_after.username,
    'amount_chf',           v_amount,
    'xp_gained',            v_xp,
    'xp',                   v_after.xp,
    'level_before',         v_before.level,
    'level',                v_after.level,
    'current_season_spent', v_after.current_season_spent,
    'is_premium_pass',      v_after.is_premium_pass,
    'premium_unlocked',     (not v_before.is_premium_pass and v_after.is_premium_pass)
  );
end;
$$;

-- La caisse « montant libre » existante passe désormais par credit_purchase.
create or replace function public.record_transaction (p_user_id uuid, p_amount_chf numeric)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'SELF_TRANSACTION' using errcode = '42501';
  end if;
  return public.credit_purchase(p_user_id, p_amount_chf, auth.uid());
end;
$$;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  number            bigint generated always as identity,
  user_id           uuid references public.profiles (id) on delete set null,
  source            text not null check (source in ('pos', 'app')),
  status            text not null default 'pending'
                      check (status in ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
  payment_method    text not null check (payment_method in ('counter', 'online')),
  payment_status    text not null default 'unpaid' check (payment_status in ('unpaid', 'paid')),
  total_chf         numeric(10, 2) not null default 0 check (total_chf >= 0),
  note              text check (char_length(note) <= 200),
  transaction_id    uuid references public.transactions (id) on delete set null,
  handled_by        uuid references public.profiles (id) on delete set null,
  stripe_session_id text unique,
  created_at        timestamptz not null default now(),
  paid_at           timestamptz,
  completed_at      timestamptz,
  cancelled_at      timestamptz
);

create index if not exists orders_open_idx on public.orders (created_at) where status in ('pending', 'preparing', 'ready');
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);

create table if not exists public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  product_id     uuid references public.products (id) on delete set null,
  name           text not null,                       -- copie au moment de la vente
  unit_price_chf numeric(8, 2) not null check (unit_price_chf >= 0),
  quantity       integer not null check (quantity between 1 and 99)
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- -----------------------------------------------------------------------------
-- Helpers internes
-- -----------------------------------------------------------------------------

-- Ajoute les lignes d'une commande, décrémente le stock, renvoie le total.
-- p_items = [{ "product_id": uuid, "quantity": int }]  (+ ligne libre { "name", "price_chf", "quantity" }
-- uniquement si p_allow_custom : caisse staff).
create or replace function public.add_order_items (p_order_id uuid, p_items jsonb, p_allow_custom boolean, p_published_only boolean)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item    jsonb;
  v_qty     integer;
  v_product public.products;
  v_price   numeric(10, 2);
  v_total   numeric(10, 2) := 0;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 30 then
    raise exception 'TOO_MANY_ITEMS' using errcode = '22023';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := coalesce((v_item ->> 'quantity')::integer, 1);
    if v_qty < 1 or v_qty > 99 then
      raise exception 'INVALID_QUANTITY' using errcode = '22023';
    end if;

    if v_item ? 'product_id' and v_item ->> 'product_id' is not null then
      select * into v_product from public.products
      where id = (v_item ->> 'product_id')::uuid
      for update;
      if not found or (p_published_only and not v_product.is_published) then
        raise exception 'PRODUCT_NOT_FOUND' using errcode = 'P0002';
      end if;
      if v_product.stock is not null and v_product.stock < v_qty then
        raise exception 'OUT_OF_STOCK' using errcode = '22023', detail = v_product.name;
      end if;
      if v_product.stock is not null then
        update public.products set stock = stock - v_qty where id = v_product.id;
      end if;
      insert into public.order_items (order_id, product_id, name, unit_price_chf, quantity)
      values (p_order_id, v_product.id, v_product.name, v_product.price_chf, v_qty);
      v_total := v_total + v_product.price_chf * v_qty;
    else
      if not p_allow_custom then
        raise exception 'PRODUCT_NOT_FOUND' using errcode = 'P0002';
      end if;
      v_price := round((v_item ->> 'price_chf')::numeric, 2);
      if v_price is null or v_price <= 0 or v_price > 10000 then
        raise exception 'INVALID_AMOUNT' using errcode = '22023';
      end if;
      insert into public.order_items (order_id, product_id, name, unit_price_chf, quantity)
      values (p_order_id, null, left(coalesce(nullif(trim(v_item ->> 'name'), ''), 'Montant libre'), 80), v_price, v_qty);
      v_total := v_total + v_price * v_qty;
    end if;
  end loop;

  if v_total <= 0 or v_total > 10000 then
    raise exception 'INVALID_AMOUNT' using errcode = '22023';
  end if;

  update public.orders set total_chf = v_total where id = p_order_id;
  return v_total;
end;
$$;

-- Remet en stock les articles d'une commande annulée.
create or replace function public.restock_order (p_order_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.products p
  set stock = p.stock + i.qty
  from (
    select product_id, sum(quantity) as qty
    from public.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  ) i
  where p.id = i.product_id and p.stock is not null;
$$;

-- Vue d'une commande (lignes comprises) renvoyée par les RPC.
create or replace function public.order_json (p_order_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', o.id, 'number', o.number, 'user_id', o.user_id, 'username', p.username,
    'source', o.source, 'status', o.status, 'payment_method', o.payment_method,
    'payment_status', o.payment_status, 'total_chf', o.total_chf, 'note', o.note,
    'created_at', o.created_at, 'paid_at', o.paid_at, 'completed_at', o.completed_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', i.name, 'unit_price_chf', i.unit_price_chf, 'quantity', i.quantity, 'product_id', i.product_id
      ) order by i.name)
      from public.order_items i where i.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  left join public.profiles p on p.id = o.user_id
  where o.id = p_order_id;
$$;

-- -----------------------------------------------------------------------------
-- 1. Caisse staff : vente au comptoir, encaissée immédiatement.
-- -----------------------------------------------------------------------------

create or replace function public.pos_checkout (p_user_id uuid, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_total    numeric(10, 2);
  v_receipt  jsonb;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_user_id is not null and p_user_id = auth.uid() then
    raise exception 'SELF_TRANSACTION' using errcode = '42501';
  end if;

  insert into public.orders (user_id, source, status, payment_method, payment_status, handled_by, paid_at, completed_at)
  values (p_user_id, 'pos', 'completed', 'counter', 'paid', auth.uid(), now(), now())
  returning id into v_order_id;

  v_total := public.add_order_items(v_order_id, p_items, true, false);

  if p_user_id is not null then
    v_receipt := public.credit_purchase(p_user_id, v_total, auth.uid());
    update public.orders set transaction_id = (v_receipt ->> 'transaction_id')::uuid where id = v_order_id;
  end if;

  return jsonb_build_object('order', public.order_json(v_order_id), 'receipt', v_receipt);
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Commande depuis l'app (payée au comptoir ou en ligne).
-- -----------------------------------------------------------------------------

create or replace function public.place_order (p_items jsonb, p_note text, p_payment_method text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;
  if p_payment_method not in ('counter', 'online') then
    raise exception 'INVALID_PAYMENT_METHOD' using errcode = '22023';
  end if;
  -- Garde-fou anti-abus : 3 commandes en cours maximum par personne.
  if (select count(*) from public.orders
      where user_id = auth.uid() and status in ('pending', 'preparing', 'ready')) >= 3 then
    raise exception 'TOO_MANY_OPEN_ORDERS' using errcode = '22023';
  end if;

  insert into public.orders (user_id, source, status, payment_method, note)
  values (auth.uid(), 'app', 'pending', p_payment_method, nullif(left(trim(coalesce(p_note, '')), 200), ''))
  returning id into v_order_id;

  perform public.add_order_items(v_order_id, p_items, false, true);
  return public.order_json(v_order_id);
end;
$$;

-- Le client annule tant que rien n'est préparé ni payé.
create or replace function public.cancel_my_order (p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id and user_id = auth.uid() for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_order.status <> 'pending' or v_order.payment_status = 'paid' then
    raise exception 'ORDER_LOCKED' using errcode = '22023';
  end if;

  update public.orders set status = 'cancelled', cancelled_at = now() where id = p_order_id;
  perform public.restock_order(p_order_id);
  return public.order_json(p_order_id);
end;
$$;

-- Staff : avance une commande (en préparation, prête) ou l'annule.
create or replace function public.set_order_status (p_order_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_status not in ('preparing', 'ready', 'cancelled') then
    raise exception 'INVALID_STATUS' using errcode = '22023';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_order.status in ('completed', 'cancelled') then
    raise exception 'ORDER_LOCKED' using errcode = '22023';
  end if;

  update public.orders
  set status = p_status,
      handled_by = auth.uid(),
      cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end
  where id = p_order_id;

  if p_status = 'cancelled' then
    perform public.restock_order(p_order_id);
  end if;
  return public.order_json(p_order_id);
end;
$$;

-- Staff : commande remise au client. Encaisse si payée au comptoir, crédite les XP une seule fois.
create or replace function public.complete_order (p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order   public.orders;
  v_receipt jsonb;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_order.status in ('completed', 'cancelled') then
    raise exception 'ORDER_LOCKED' using errcode = '22023';
  end if;
  if v_order.payment_method = 'online' and v_order.payment_status <> 'paid' then
    raise exception 'NOT_PAID' using errcode = '22023';
  end if;

  if v_order.user_id is not null and v_order.transaction_id is null then
    if v_order.user_id = auth.uid() then
      raise exception 'SELF_TRANSACTION' using errcode = '42501';
    end if;
    v_receipt := public.credit_purchase(v_order.user_id, v_order.total_chf, auth.uid());
  end if;

  update public.orders
  set status = 'completed',
      payment_status = 'paid',
      paid_at = coalesce(paid_at, now()),
      completed_at = now(),
      handled_by = auth.uid(),
      transaction_id = coalesce(transaction_id, (v_receipt ->> 'transaction_id')::uuid)
  where id = p_order_id;

  return jsonb_build_object('order', public.order_json(p_order_id), 'receipt', v_receipt);
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Paiement en ligne (appelé par le webhook Stripe, clé service uniquement).
-- -----------------------------------------------------------------------------

create or replace function public.mark_order_paid (p_order_id uuid, p_session_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order   public.orders;
  v_receipt jsonb;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;
  -- Idempotent : Stripe peut renvoyer le même événement plusieurs fois.
  if v_order.payment_status = 'paid' then
    return public.order_json(p_order_id);
  end if;

  if v_order.user_id is not null and v_order.transaction_id is null then
    v_receipt := public.credit_purchase(v_order.user_id, v_order.total_chf, null);
  end if;

  -- Commande annulée entre-temps (stock déjà rendu) mais payée quand même : on la rouvre
  -- et on reprend le stock. Le client a payé : on honore la commande même si le stock est à 0.
  if v_order.status = 'cancelled' then
    update public.products p
    set stock = greatest(p.stock - i.qty, 0)
    from (
      select product_id, sum(quantity) as qty
      from public.order_items
      where order_id = p_order_id and product_id is not null
      group by product_id
    ) i
    where p.id = i.product_id and p.stock is not null;
  end if;

  update public.orders
  set payment_status = 'paid',
      paid_at = now(),
      stripe_session_id = p_session_id,
      -- Payée en ligne alors que le staff l'avait annulée entre-temps : on la rouvre.
      status = case when status = 'cancelled' then 'pending' else status end,
      cancelled_at = null,
      transaction_id = coalesce(transaction_id, (v_receipt ->> 'transaction_id')::uuid)
  where id = p_order_id;

  return public.order_json(p_order_id);
end;
$$;

-- Session Stripe expirée sans paiement : la commande est annulée et le stock rendu.
create or replace function public.expire_online_order (p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.orders
  set status = 'cancelled', cancelled_at = now()
  where id = p_order_id and payment_status = 'unpaid' and status <> 'cancelled';
  if found then
    perform public.restock_order(p_order_id);
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Lecture
-- -----------------------------------------------------------------------------

-- Commandes en cours (staff) ou les miennes (client), avec lignes.
create or replace function public.get_orders (p_scope text default 'mine')
returns setof jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_scope = 'open' then
    if not public.is_staff() then
      raise exception 'FORBIDDEN' using errcode = '42501';
    end if;
    return query
      select public.order_json(o.id) from public.orders o
      where o.source = 'app'
        and (o.status in ('pending', 'preparing', 'ready')
             or (o.status in ('completed', 'cancelled') and coalesce(o.completed_at, o.cancelled_at) > now() - interval '2 hours'))
        -- Une commande en ligne non payée n'est pas encore à préparer.
        and not (o.payment_method = 'online' and o.payment_status = 'unpaid')
      order by o.created_at;
  else
    return query
      select public.order_json(o.id) from public.orders o
      where o.user_id = auth.uid() and o.source = 'app'
      order by o.created_at desc
      limit 20;
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Sécurité
-- -----------------------------------------------------------------------------

alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "orders_select" on public.orders;
create policy "orders_select" on public.orders
  for select to authenticated using (user_id = auth.uid() or public.is_staff());
drop policy if exists "order_items_select" on public.order_items;
create policy "order_items_select" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff()))
  );

-- Fonctions internes : jamais appelables directement depuis l'app.
revoke execute on function public.credit_purchase (uuid, numeric, uuid)            from public, anon, authenticated;
revoke execute on function public.add_order_items (uuid, jsonb, boolean, boolean)  from public, anon, authenticated;
revoke execute on function public.restock_order (uuid)                             from public, anon, authenticated;
revoke execute on function public.order_json (uuid)                                from public, anon, authenticated;
-- Réservées au webhook Stripe (clé service).
revoke execute on function public.mark_order_paid (uuid, text)                     from public, anon, authenticated;
revoke execute on function public.expire_online_order (uuid)                       from public, anon, authenticated;
grant execute on function public.mark_order_paid (uuid, text)                      to service_role;
grant execute on function public.expire_online_order (uuid)                        to service_role;

revoke execute on function public.pos_checkout (uuid, jsonb)          from public, anon;
revoke execute on function public.place_order (jsonb, text, text)     from public, anon;
revoke execute on function public.cancel_my_order (uuid)              from public, anon;
revoke execute on function public.set_order_status (uuid, text)       from public, anon;
revoke execute on function public.complete_order (uuid)               from public, anon;
revoke execute on function public.get_orders (text)                   from public, anon;
grant execute on function public.pos_checkout (uuid, jsonb)           to authenticated;
grant execute on function public.place_order (jsonb, text, text)      to authenticated;
grant execute on function public.cancel_my_order (uuid)               to authenticated;
grant execute on function public.set_order_status (uuid, text)        to authenticated;
grant execute on function public.complete_order (uuid)                to authenticated;
grant execute on function public.get_orders (text)                    to authenticated;

-- Temps réel : le staff voit arriver les commandes, le client suit la sienne.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end;
$$;
