create table if not exists public.arcana_cards (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  deck_order smallint not null,
  number_label text,
  canonical_name text not null,
  display_name text not null,
  family text not null check (family in ('major','wands','cups','swords','pentacles')),
  short_meaning text,
  reflection_prompt text,
  image_path text,
  content_stage text not null default 'placeholder' check (content_stage in ('placeholder','pilot','canonical')),
  status text not null default 'draft' check (status in ('draft','pilot','active','retired')),
  public_preview boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists arcana_cards_deck_order_uidx on public.arcana_cards(deck_order);
create index if not exists arcana_cards_public_idx on public.arcana_cards(status, public_preview, deck_order);

create table if not exists public.arcana_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reading_type text not null default 'single-card' check (reading_type in ('single-card')),
  title text not null,
  question text check (char_length(question) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists arcana_readings_user_created_idx on public.arcana_readings(user_id, created_at desc);

create table if not exists public.arcana_reading_cards (
  reading_id uuid not null references public.arcana_readings(id) on delete cascade,
  card_id uuid not null references public.arcana_cards(id) on delete restrict,
  position_index smallint not null default 0,
  position_label text not null default 'Reflection',
  orientation text not null default 'upright' check (orientation in ('upright','reversed')),
  created_at timestamptz not null default now(),
  primary key (reading_id, position_index)
);

create index if not exists arcana_reading_cards_card_idx on public.arcana_reading_cards(card_id);

create table if not exists public.arcana_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reading_id uuid not null references public.arcana_readings(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists arcana_journal_user_created_idx on public.arcana_journal_entries(user_id, created_at desc);
create index if not exists arcana_journal_reading_idx on public.arcana_journal_entries(reading_id);

drop trigger if exists arcana_cards_set_updated_at on public.arcana_cards;
create trigger arcana_cards_set_updated_at before update on public.arcana_cards for each row execute function public.set_updated_at();

drop trigger if exists arcana_readings_set_updated_at on public.arcana_readings;
create trigger arcana_readings_set_updated_at before update on public.arcana_readings for each row execute function public.set_updated_at();

drop trigger if exists arcana_journal_set_updated_at on public.arcana_journal_entries;
create trigger arcana_journal_set_updated_at before update on public.arcana_journal_entries for each row execute function public.set_updated_at();

alter table public.arcana_cards enable row level security;
alter table public.arcana_readings enable row level security;
alter table public.arcana_reading_cards enable row level security;
alter table public.arcana_journal_entries enable row level security;

drop policy if exists arcana_cards_public_read on public.arcana_cards;
create policy arcana_cards_public_read on public.arcana_cards for select to anon, authenticated
using (public_preview = true and status in ('pilot','active'));

drop policy if exists arcana_readings_select_own on public.arcana_readings;
create policy arcana_readings_select_own on public.arcana_readings for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists arcana_readings_insert_own on public.arcana_readings;
create policy arcana_readings_insert_own on public.arcana_readings for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists arcana_readings_update_own on public.arcana_readings;
create policy arcana_readings_update_own on public.arcana_readings for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists arcana_readings_delete_own on public.arcana_readings;
create policy arcana_readings_delete_own on public.arcana_readings for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists arcana_reading_cards_select_own on public.arcana_reading_cards;
create policy arcana_reading_cards_select_own on public.arcana_reading_cards for select to authenticated
using (exists (select 1 from public.arcana_readings r where r.id = reading_id and r.user_id = (select auth.uid())));

drop policy if exists arcana_reading_cards_insert_own on public.arcana_reading_cards;
create policy arcana_reading_cards_insert_own on public.arcana_reading_cards for insert to authenticated
with check (
  exists (select 1 from public.arcana_readings r where r.id = reading_id and r.user_id = (select auth.uid()))
  and exists (select 1 from public.arcana_cards c where c.id = card_id and c.public_preview = true and c.status in ('pilot','active'))
);

drop policy if exists arcana_journal_select_own on public.arcana_journal_entries;
create policy arcana_journal_select_own on public.arcana_journal_entries for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists arcana_journal_insert_own on public.arcana_journal_entries;
create policy arcana_journal_insert_own on public.arcana_journal_entries for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.arcana_readings r where r.id = reading_id and r.user_id = (select auth.uid()))
);

drop policy if exists arcana_journal_update_own on public.arcana_journal_entries;
create policy arcana_journal_update_own on public.arcana_journal_entries for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists arcana_journal_delete_own on public.arcana_journal_entries;
create policy arcana_journal_delete_own on public.arcana_journal_entries for delete to authenticated
using ((select auth.uid()) = user_id);

grant select on public.arcana_cards to anon, authenticated;
grant select, insert, update, delete on public.arcana_readings to authenticated;
grant select, insert on public.arcana_reading_cards to authenticated;
grant select, insert, update, delete on public.arcana_journal_entries to authenticated;

create or replace function public.save_arcana_single_card_reading(
  p_card_id uuid,
  p_question text default null,
  p_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_reading_id uuid;
  v_card_name text;
  v_question text := nullif(trim(coalesce(p_question, '')), '');
  v_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if char_length(coalesce(v_question, '')) > 1000 then raise exception 'Question is too long'; end if;
  if char_length(coalesce(v_note, '')) > 10000 then raise exception 'Journal note is too long'; end if;

  select c.display_name into v_card_name
  from public.arcana_cards c
  where c.id = p_card_id and c.public_preview = true and c.status in ('pilot','active');

  if v_card_name is null then raise exception 'Card is not available for this reading'; end if;

  insert into public.arcana_readings (user_id, reading_type, title, question)
  values (v_user, 'single-card', 'Single-card reflection — ' || v_card_name, v_question)
  returning id into v_reading_id;

  insert into public.arcana_reading_cards (reading_id, card_id, position_index, position_label, orientation)
  values (v_reading_id, p_card_id, 0, 'Reflection', 'upright');

  if v_note is not null then
    insert into public.arcana_journal_entries (user_id, reading_id, body)
    values (v_user, v_reading_id, v_note);
  end if;

  return v_reading_id;
end;
$$;

revoke execute on function public.save_arcana_single_card_reading(uuid,text,text) from public, anon;
grant execute on function public.save_arcana_single_card_reading(uuid,text,text) to authenticated;

insert into public.arcana_cards (slug, deck_order, number_label, canonical_name, display_name, family, short_meaning, reflection_prompt, content_stage, status, public_preview)
values
('the-fool', 0, '0', 'The Fool', 'The Fool', 'major', 'Beginnings, openness and the courage to enter what is not yet known.', 'Where might curiosity be more useful than certainty today?', 'pilot', 'pilot', true),
('the-magician', 1, 'I', 'The Magician', 'The Magician', 'major', 'Agency, attention and the deliberate use of what is already at hand.', 'What resource, skill or connection are you underusing?', 'pilot', 'pilot', true),
('the-high-priestess', 2, 'II', 'The High Priestess', 'The High Priestess', 'major', 'Stillness, pattern-recognition and knowledge that is not yet ready to be forced into speech.', 'What becomes clearer if you stop trying to resolve it immediately?', 'pilot', 'pilot', true),
('the-empress', 3, 'III', 'The Empress', 'The Empress', 'major', 'Nurture, material abundance, creativity and the conditions that allow life to grow.', 'What are you responsible for cultivating rather than merely wanting?', 'pilot', 'pilot', true),
('the-emperor', 4, 'IV', 'The Emperor', 'The Emperor', 'major', 'Structure, responsibility, boundaries and the durable use of authority.', 'Where would a clearer boundary create more freedom rather than less?', 'pilot', 'pilot', true),
('the-hierophant', 5, 'V', 'The Hierophant', 'The Hierophant', 'major', 'Tradition, inherited systems, teaching and the question of what deserves to be carried forward.', 'Which inherited rule still serves you—and which one needs examination?', 'pilot', 'pilot', true)
on conflict (slug) do update set
  deck_order = excluded.deck_order,
  number_label = excluded.number_label,
  canonical_name = excluded.canonical_name,
  display_name = excluded.display_name,
  family = excluded.family,
  short_meaning = excluded.short_meaning,
  reflection_prompt = excluded.reflection_prompt,
  content_stage = excluded.content_stage,
  status = excluded.status,
  public_preview = excluded.public_preview,
  updated_at = now();
