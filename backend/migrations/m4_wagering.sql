-- M4: Wagering & Points System

-- Grants (update already granted in M3; add update for resolve_bet to write back)
grant update on public.group_members to authenticated;
grant update on public.bets to authenticated;

-- RLS: users can insert their own positions (belt-and-suspenders; place_bet RPC is the real path)
drop policy if exists "bet_positions: insert own" on public.bet_positions;
create policy "bet_positions: insert own"
  on public.bet_positions for insert
  with check (auth.uid() = user_id);

-- No UPDATE or DELETE policies on bet_positions → positions are locked on commit

-- RPC: place a bet atomically
create or replace function public.place_bet(
  p_bet_id uuid,
  p_side   public.bet_side,
  p_amount integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_points   integer;
begin
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  -- verify bet exists and is open, get group
  select group_id into v_group_id
  from bets
  where id = p_bet_id and status = 'open';

  if not found then
    raise exception 'bet not found or not open';
  end if;

  -- verify caller is a group member with enough points
  select points into v_points
  from group_members
  where group_id = v_group_id and user_id = auth.uid();

  if not found then
    raise exception 'not a member of this group';
  end if;

  if v_points < p_amount then
    raise exception 'insufficient points';
  end if;

  insert into bet_positions (bet_id, user_id, side, amount)
  values (p_bet_id, auth.uid(), p_side, p_amount);

  update group_members
  set points = points - p_amount
  where group_id = v_group_id and user_id = auth.uid();
end;
$$;

-- RPC: resolve a bet and distribute parimutuel payouts
create or replace function public.resolve_bet(
  p_bet_id  uuid,
  p_outcome public.bet_side
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id             uuid;
  v_losing_pool          bigint;
  v_winning_pool         bigint;
  v_distributed_from_losing bigint := 0;
  v_top_winner_id        uuid;
  r                      record;
  v_from_losing          bigint;
begin
  select group_id into v_group_id
  from bets where id = p_bet_id;

  if not found then
    raise exception 'bet not found';
  end if;

  select
    coalesce(sum(amount) filter (where side <> p_outcome), 0),
    coalesce(sum(amount) filter (where side  = p_outcome), 0)
  into v_losing_pool, v_winning_pool
  from bet_positions
  where bet_id = p_bet_id;

  -- distribute stake + share of losing pool to each winner (highest staker first)
  for r in
    select user_id, amount
    from bet_positions
    where bet_id = p_bet_id and side = p_outcome
    order by amount desc
  loop
    if v_winning_pool > 0 and v_losing_pool > 0 then
      v_from_losing := floor(v_losing_pool::numeric * r.amount / v_winning_pool);
    else
      v_from_losing := 0; -- zero losing pool: winners just get their stake back
    end if;

    update group_members
    set points = points + r.amount + v_from_losing
    where group_id = v_group_id and user_id = r.user_id;

    v_distributed_from_losing := v_distributed_from_losing + v_from_losing;

    if v_top_winner_id is null then
      v_top_winner_id := r.user_id;
    end if;
  end loop;

  -- award rounding remainder to highest staker on winning side
  if v_top_winner_id is not null and v_losing_pool > v_distributed_from_losing then
    update group_members
    set points = points + (v_losing_pool - v_distributed_from_losing)
    where group_id = v_group_id and user_id = v_top_winner_id;
  end if;

  update bets set status = 'closed' where id = p_bet_id;
end;
$$;
