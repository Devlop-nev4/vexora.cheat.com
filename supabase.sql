-- =====================================================================
--  VEXORA — base de données partagée (Supabase)
--  À coller en une fois dans : Supabase → SQL Editor → New query → Run
-- =====================================================================

create table if not exists public.keys (
  key           text primary key,
  product       text not null,
  download_url  text,
  used_by       uuid references auth.users(id) on delete set null,
  used_by_name  text,
  used_at       timestamptz,
  created_at    timestamptz not null default now(),
  constraint key_format check (key ~ '^VEXORA-[A-Z0-9]{4,}-[A-Z0-9]{4,}-[A-Z0-9]{4,}$')
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.keys   enable row level security;
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Seuls les admins peuvent lire / créer / modifier / supprimer les KEYS directement.
drop policy if exists "admins gèrent les keys" on public.keys;
create policy "admins gèrent les keys" on public.keys
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "chacun voit son statut admin" on public.admins;
create policy "chacun voit son statut admin" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- Activation d'une KEY (les utilisateurs ne peuvent jamais lister les KEYS).
create or replace function public.activate_key(p_key text)
returns table(out_product text, out_url text)
language plpgsql security definer set search_path = public as $$
declare r public.keys;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into r from public.keys where keys.key = upper(trim(p_key)) for update;
  if not found then raise exception 'invalid_key'; end if;
  if r.used_by is not null then raise exception 'already_used'; end if;
  update public.keys
     set used_by = auth.uid(),
         used_by_name = coalesce((select raw_user_meta_data->>'display_name' from auth.users where id = auth.uid()),
                                 split_part((select email from auth.users where id = auth.uid()), '@', 1)),
         used_at = now()
   where keys.key = r.key;
  return query select r.product, r.download_url;
end $$;

-- Liste des produits de l'utilisateur connecté (avec le lien de téléchargement à jour).
create or replace function public.my_activations()
returns table(key text, product text, download_url text, used_at timestamptz)
language sql stable security definer set search_path = public as $$
  select k.key, k.product, k.download_url, k.used_at
    from public.keys k where k.used_by = auth.uid() order by k.used_at desc;
$$;

revoke all on function public.is_admin()        from public, anon;
revoke all on function public.activate_key(text) from public, anon;
revoke all on function public.my_activations()  from public, anon;
grant execute on function public.is_admin()        to authenticated;
grant execute on function public.activate_key(text) to authenticated;
grant execute on function public.my_activations()  to authenticated;

-- =====================================================================
--  ÉTAPE FINALE (après avoir créé VOTRE compte sur le site) :
--  remplacez l'email puis exécutez cette ligne pour vous donner les droits admin.
-- =====================================================================
-- insert into public.admins (user_id) select id from auth.users where email = 'VOTRE_EMAIL@exemple.com';
