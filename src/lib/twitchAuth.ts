import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from './supabase';

/**
 * Twitch sign-in for streamers hosting a battle from the browser.
 *
 * This is deliberately separate from the battle session token in
 * battleClient. That token is what authorises play, and viewers get one
 * without any account at all. Signing in with Twitch only says who the
 * streamer is, so the lobby and the OBS overlay can show their channel.
 * Losing the Twitch session mid-battle must not eject anyone from the room,
 * which is why the two never became one thing.
 *
 * Requires the Twitch provider to be enabled in the Supabase dashboard, with
 * a client ID and secret from the Twitch developer console.
 */

export type TwitchIdentity = {
  /** Lowercase channel login, e.g. "ninja". Matches twitch.tv/<login>. */
  login: string;
  /** Cased name Twitch displays, which can differ from the login. */
  displayName: string;
  avatarUrl: string | null;
};

/**
 * Supabase flattens provider claims into user_metadata, and which keys are
 * present varies with what the provider returned, so every field is treated
 * as possibly missing.
 */
export function identityFromSession(session: Session | null): TwitchIdentity | null {
  const user = session?.user;
  if (!user || user.app_metadata?.provider !== 'twitch') return null;

  const meta = user.user_metadata ?? {};
  const login: unknown = meta.nickname ?? meta.preferred_username ?? meta.user_name;
  if (typeof login !== 'string' || login.length === 0) return null;

  const displayName = typeof meta.full_name === 'string' && meta.full_name ? meta.full_name : login;
  const avatar = typeof meta.avatar_url === 'string' ? meta.avatar_url : null;

  return {
    login: login.toLowerCase(),
    displayName,
    // The room stores this and the overlay renders it, and the database only
    // accepts https, so anything else is dropped here rather than failing the
    // create call later.
    avatarUrl: avatar && avatar.startsWith('https://') ? avatar : null,
  };
}

export async function signInWithTwitch(returnTo: string = window.location.pathname) {
  if (!supabaseConfigured) throw new Error('Supabase is not configured');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'twitch',
    options: { redirectTo: `${window.location.origin}${returnTo}` },
  });
  if (error) throw new Error(error.message);
}

export async function signOut() {
  if (!supabaseConfigured) return;
  await supabase.auth.signOut();
}

/**
 * Current Twitch identity, or null when signed out.
 *
 * `loading` starts true and matters: the sign-in button would otherwise flash
 * on every reload for a streamer who is already signed in, because restoring
 * the session from storage is asynchronous.
 */
export function useTwitchIdentity() {
  const [identity, setIdentity] = useState<TwitchIdentity | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;
    let live = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!live) return;
      setIdentity(identityFromSession(data.session));
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!live) return;
      setIdentity(identityFromSession(session));
      setLoading(false);
    });

    return () => {
      live = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { identity, loading };
}
