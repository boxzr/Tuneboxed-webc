-- Clip start offset for battle rounds.
--
-- Twitch streamers running a bracket asked to control which part of a song
-- the room hears, not just how long it plays for. Length already travels on
-- the round as `seconds_per_song`; this adds the other half.
--
-- It has to live on the round rather than in the host's browser because every
-- client derives its own playback position from the round and seeks its own
-- audio element. A host-local offset would put every listener a different
-- distance into the track.
--
-- The web client is already deployed against this and treats a missing column
-- or a missing function as "play from the top", so nothing breaks before it is
-- applied. The slider simply has no effect until then.


-- ==========================================================================
-- PART 1 - Safe to run as-is.
-- ==========================================================================
-- Nullable with a default of 0, so rounds already in flight keep playing from
-- the top.

alter table public.battle_rounds
  add column if not exists clip_start_seconds integer not null default 0;

-- A clip has to finish inside the 30 second iTunes preview, which is the only
-- source that plays as plain audio in every browser. Asking for more than the
-- preview holds buys silence, not more song, so the bound is enforced here as
-- well as in the client.
alter table public.battle_rounds
  drop constraint if exists battle_rounds_clip_start_fits_preview;

alter table public.battle_rounds
  add constraint battle_rounds_clip_start_fits_preview
  check (clip_start_seconds >= 0 and clip_start_seconds + seconds_per_song <= 30);


-- ==========================================================================
-- PART 2 - Needs one line confirmed first.
-- ==========================================================================
-- The battle_* functions live only in Supabase, not in either repo, so the
-- exact way they prove a caller is the host could not be checked from here.
-- Run this first to see the convention:
--
--   select prosrc
--     from pg_proc
--    where proname = 'battle_set_round_winner';
--
-- Then replace the marked block below with the same guard before running it.
-- Do not run this part with the placeholder guard: it is a guess, and getting
-- it wrong either breaks the function or lets a non-host move the offset.

create or replace function public.battle_set_clip_start(
  p_token text,
  p_round_id uuid,
  p_clip_start_seconds integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
  v_per_song integer;
begin
  select r.room_id, r.seconds_per_song
    into v_room_id, v_per_song
    from battle_rounds r
   where r.id = p_round_id;

  if v_room_id is null then
    return;
  end if;

  -- >>> REPLACE THIS BLOCK with the host guard used by the other battle_*
  -- >>> functions. Host only: anyone else can read the offset but not set it.
  -- >>> Returning quietly rather than raising matches how the existing
  -- >>> functions treat a caller who is not the host.
  if not exists (
    select 1
      from battle_rooms rm
      join battle_players p on p.id = rm.host_player_id
     where rm.id = v_room_id
       and p.session_token = p_token   -- <-- column name to confirm
  ) then
    return;
  end if;
  -- >>> END BLOCK

  -- Clamped server-side too, so a stale client cannot write a pair that would
  -- run off the end of the preview and trip the check constraint.
  update battle_rounds
     set clip_start_seconds = greatest(
           0,
           least(coalesce(p_clip_start_seconds, 0), 30 - coalesce(v_per_song, 15))
         )
   where id = p_round_id;
end;
$$;

grant execute on function public.battle_set_clip_start(text, uuid, integer) to anon, authenticated;
