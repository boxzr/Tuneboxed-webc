import { useEffect, useRef, useState } from 'react';

/**
 * Plays a SoundCloud or YouTube track inside the provider's own player, seeked
 * to wherever the round clock says the room should be.
 *
 * These cannot be played as audio files. YouTube's terms require playback go
 * through their embedded player and that it stay visible, and SoundCloud
 * streams need credentials a browser cannot hold. So the players are on screen
 * on purpose rather than hidden.
 *
 * Sync is looser than for an audio preview. An embed has to load a whole player
 * before it can seek, and YouTube may roll an ad first, so a room can drift by a
 * second or two. Drift is corrected only past a wide threshold, because seeking
 * an iframe is audible and doing it constantly would sound far worse than being
 * slightly behind.
 */

/** Past this many seconds out of position, seek. Below it, leave well alone. */
const DRIFT_TOLERANCE = 2.5;

type Api = 'youtube' | 'soundcloud';

const SCRIPTS: Record<Api, string> = {
  youtube: 'https://www.youtube.com/iframe_api',
  soundcloud: 'https://w.soundcloud.com/player/api.js',
};

const loaders: Partial<Record<Api, Promise<void>>> = {};

/**
 * Loads a provider's player script once per page, however many players mount.
 * The promise is cached rather than the boolean, so two players mounting in the
 * same tick both wait on the same load instead of racing two script tags in.
 */
function loadScript(api: Api): Promise<void> {
  const existing = loaders[api];
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    // YouTube signals readiness through a global callback rather than the
    // script's load event, and the object is not usable before it fires.
    if (api === 'youtube') {
      const w = window as unknown as { YT?: { Player?: unknown }; onYouTubeIframeAPIReady?: () => void };
      if (w.YT?.Player) {
        resolve();
        return;
      }
      const previous = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve();
      };
    }

    const tag = document.createElement('script');
    tag.src = SCRIPTS[api];
    tag.async = true;
    if (api === 'soundcloud') tag.onload = () => resolve();
    tag.onerror = () => reject(new Error(`Could not load the ${api} player.`));
    document.head.appendChild(tag);
  });

  loaders[api] = promise;
  return promise;
}

interface Props {
  source: 'soundcloud' | 'youtube';
  /** Video id for YouTube, resolved track URL for SoundCloud. */
  externalId: string;
  /** How far into the track the room should be, in seconds. */
  offset: number;
  /** False while the countdown runs, so nothing sounds early. */
  playing: boolean;
  onBlocked?: (blocked: boolean) => void;
}

export default function EmbedPlayer({
  source,
  externalId,
  offset,
  playing,
  onBlocked,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | SoundCloudWidget | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `offset` changes four times a second, but the player must only be built
  // once per track. Reading it from a ref keeps it out of the setup effect's
  // dependencies, which would otherwise tear the player down constantly.
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);

    const host = hostRef.current;
    if (!host) return;

    loadScript(source).then(
      () => {
        if (cancelled || !hostRef.current) return;
        try {
          playerRef.current =
            source === 'youtube'
              ? createYouTube(hostRef.current, externalId, offsetRef.current, () => setReady(true))
              : createSoundCloud(hostRef.current, externalId, () => setReady(true));
        } catch {
          setError('That track could not be played here.');
        }
      },
      (e: Error) => {
        if (!cancelled) setError(e.message);
      }
    );

    return () => {
      cancelled = true;
      const player = playerRef.current;
      playerRef.current = null;
      if (player) {
        // Stop the sound first. YouTube has destroy(), SoundCloud's widget does
        // not, so for that one the pause is what actually silences it before
        // the iframe goes; otherwise it can be heard over the next track for as
        // long as it takes the element to be torn down.
        pause(player);
        try {
          if (isYouTube(player)) player.destroy();
        } catch {
          /* the iframe is going away with the container regardless */
        }
      }
      if (hostRef.current) hostRef.current.innerHTML = '';
    };
  }, [source, externalId]);

  // Keep the player pointed at the room's position, and start or stop it as the
  // countdown allows.
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !ready) return;

    if (!playing) {
      pause(player);
      return;
    }

    currentTime(player).then((now) => {
      if (playerRef.current !== player) return;
      if (now !== null && Math.abs(now - offsetRef.current) > DRIFT_TOLERANCE) {
        seek(player, Math.max(0, offsetRef.current));
      }
      play(player).then(
        () => onBlocked?.(false),
        () => onBlocked?.(true)
      );
    });
    // Runs on every clock tick via `offset`, which is what drives the drift check.
  }, [ready, playing, offset, onBlocked]);

  return (
    <div className={`battle-embed battle-embed--${source}`}>
      <div ref={hostRef} className="battle-embed__host" />
      {!ready && !error && <p className="battle-embed__note">Loading the player…</p>}
      {error && <p className="battle-embed__note battle-embed__note--error">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------
// The two providers' player objects, narrowed to what is used here
// ---------------------------------------------------------------

interface YouTubePlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  destroy(): void;
}

/** Note there is no destroy(); removing the iframe is the teardown. */
interface SoundCloudWidget {
  play(): void;
  pause(): void;
  seekTo(milliseconds: number): void;
  getPosition(cb: (ms: number) => void): void;
  bind(event: string, cb: () => void): void;
}

function createYouTube(
  host: HTMLElement,
  videoId: string,
  startAt: number,
  onReady: () => void
): YouTubePlayer {
  const YT = (window as unknown as { YT: YouTubeApi }).YT;
  const mount = document.createElement('div');
  host.appendChild(mount);

  return new YT.Player(mount, {
    videoId,
    playerVars: {
      // `start` gets a late joiner close before the first seek lands.
      start: Math.max(0, Math.floor(startAt)),
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      modestbranding: 1,
      rel: 0,
      playsinline: 1,
    },
    events: { onReady },
  });
}

interface YouTubeApi {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      playerVars: Record<string, string | number>;
      events: { onReady: () => void };
    }
  ) => YouTubePlayer;
}

function createSoundCloud(host: HTMLElement, trackUrl: string, onReady: () => void): SoundCloudWidget {
  const iframe = document.createElement('iframe');
  iframe.allow = 'autoplay';
  iframe.width = '100%';
  iframe.height = '120';
  iframe.frameBorder = 'no';
  iframe.scrolling = 'no';
  iframe.src =
    'https://w.soundcloud.com/player/?url=' +
    encodeURIComponent(trackUrl) +
    '&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=false';
  host.appendChild(iframe);

  const widget = (window as unknown as { SC: { Widget(el: HTMLIFrameElement): SoundCloudWidget } }).SC.Widget(
    iframe
  );
  widget.bind('ready', onReady);
  return widget;
}

// ---------------------------------------------------------------
// One shape for both, so the sync effect does not branch on provider
// ---------------------------------------------------------------

function isYouTube(p: YouTubePlayer | SoundCloudWidget): p is YouTubePlayer {
  return 'playVideo' in p;
}

function play(p: YouTubePlayer | SoundCloudWidget): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (isYouTube(p)) p.playVideo();
      else p.play();
      resolve();
    } catch {
      // Autoplay refusals surface as a throw here, which the room turns into a
      // "tap to hear the battle" prompt rather than silence.
      reject(new Error('blocked'));
    }
  });
}

function pause(p: YouTubePlayer | SoundCloudWidget): void {
  try {
    if (isYouTube(p)) p.pauseVideo();
    else p.pause();
  } catch {
    /* nothing to pause yet */
  }
}

function seek(p: YouTubePlayer | SoundCloudWidget, seconds: number): void {
  try {
    if (isYouTube(p)) p.seekTo(seconds, true);
    else p.seekTo(seconds * 1000);
  } catch {
    /* the player is not ready to seek; the next tick will retry */
  }
}

/** Seconds into the track, or null if the player cannot say yet. */
function currentTime(p: YouTubePlayer | SoundCloudWidget): Promise<number | null> {
  if (isYouTube(p)) {
    try {
      return Promise.resolve(p.getCurrentTime());
    } catch {
      return Promise.resolve(null);
    }
  }
  // SoundCloud only reports position through a callback.
  return new Promise((resolve) => {
    let settled = false;
    const done = (v: number | null) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    try {
      p.getPosition((ms) => done(ms / 1000));
    } catch {
      done(null);
    }
    // Never leave the sync effect waiting on a widget that will not answer.
    setTimeout(() => done(null), 400);
  });
}
