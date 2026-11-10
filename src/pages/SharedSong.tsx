import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import logo from '../assets/tuneboxed-battle-logo.png';
import PixelFX from '../components/PixelFX';
import { useMagnetic, useTilt } from '../lib/pointerFx';
import { APP_STORE_URL } from './PageLayout';
import './sharedSong.css';

/**
 * Landing page for a song shared from the app: tuneboxed.com/s/<postId>.
 *
 * Posts live in CloudKit, which the site can't read, so the app puts the song
 * in the query (t = title, a = artist, u = who posted it, art = artwork,
 * l = listen link). The preview comes from the iTunes Search API, which
 * allows cross-origin requests.
 */

const PREVIEW_SECONDS = 30;

function httpsOnly(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function clean(value: string | null, max: number): string {
  return (value ?? '').trim().slice(0, max);
}

/** Apple serves square art at any size by rewriting the dimensions in the path. */
function largeArtwork(url: string | null): string | null {
  return url ? url.replace(/\/\d+x\d+(bb)?\.(jpg|png|webp)$/, '/600x600bb.$2') : null;
}

async function findPreview(title: string, artist: string, signal: AbortSignal) {
  const term = encodeURIComponent(`${title} ${artist}`);
  const res = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=5`, { signal });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    results?: { trackName?: string; previewUrl?: string; artworkUrl100?: string }[];
  };
  const wanted = title.toLowerCase();
  const hit = data.results?.find((r) => r.trackName?.toLowerCase() === wanted) ?? data.results?.[0];
  return hit
    ? { preview: httpsOnly(hit.previewUrl ?? null), artwork: httpsOnly(hit.artworkUrl100 ?? null) }
    : null;
}

export default function SharedSong() {
  const [params] = useSearchParams();
  const reduced = useReducedMotion();
  const title = clean(params.get('t'), 120);
  const artist = clean(params.get('a'), 120);
  const by = clean(params.get('u'), 40).replace(/^@/, '');
  const listen = httpsOnly(params.get('l'));

  const [artwork, setArtwork] = useState<string | null>(largeArtwork(httpsOnly(params.get('art'))));
  const [preview, setPreview] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [plays, setPlays] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const artTilt = useTilt<HTMLDivElement>(8);
  const ctaMagnet = useMagnetic<HTMLAnchorElement>();

  useEffect(() => {
    document.title = title ? `${title} by ${artist} · TuneBoxed` : 'A song on TuneBoxed';
  }, [title, artist]);

  useEffect(() => {
    if (!title) return;
    const ctrl = new AbortController();
    findPreview(title, artist, ctrl.signal)
      .then((hit) => {
        if (!hit) return;
        setPreview(hit.preview);
        setArtwork((current) => current ?? largeArtwork(hit.artwork));
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [title, artist]);

  useEffect(() => () => audioRef.current?.pause(), []);

  const toggle = () => {
    if (!preview) return;
    if (!audioRef.current) {
      const audio = new Audio(preview);
      audio.addEventListener('timeupdate', () =>
        setProgress(Math.min(1, audio.currentTime / (audio.duration || PREVIEW_SECONDS))),
      );
      audio.addEventListener('ended', () => {
        setPlaying(false);
        setProgress(0);
      });
      audioRef.current = audio;
    }
    const audio = audioRef.current;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play().then(() => {
        setPlaying(true);
        setPlays((n) => n + 1);
      }, () => setPlaying(false));
    }
  };

  const ring = 2 * Math.PI * 30;

  return (
    <div className="ss">
      {artwork && <div className="ss__backdrop" style={{ backgroundImage: `url("${artwork}")` }} aria-hidden="true" />}

      <header className="ss__nav">
        <Link to="/" className="ss__logo">
          <img src={logo} alt="TuneBoxed" />
        </Link>
        <Link to="/fight" className="ss__navlink">
          Tonight's fight
        </Link>
      </header>

      <motion.main
        className="ss__main"
        initial={reduced ? undefined : { opacity: 0, y: 24 }}
        animate={reduced ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {title ? (
          <>
            <div ref={artTilt} className="ss__art-wrap tb-fx-anchor">
              <PixelFX effect="heart" scale={4} trigger={plays > 0 ? plays : null} className="tb-fx" />
              {artwork ? (
                <img className="ss__art" src={artwork} alt="" />
              ) : (
                <div className="ss__art ss__art--empty" aria-hidden="true">♪</div>
              )}
              {preview && (
                <button
                  className={`ss__play${playing ? ' is-playing' : ''}`}
                  onClick={toggle}
                  aria-label={playing ? 'Pause preview' : 'Play preview'}
                >
                  <svg viewBox="0 0 68 68" aria-hidden="true">
                    <circle className="ss__ring-track" cx="34" cy="34" r="30" />
                    <circle
                      className="ss__ring"
                      cx="34"
                      cy="34"
                      r="30"
                      strokeDasharray={ring}
                      strokeDashoffset={ring * (1 - progress)}
                    />
                  </svg>
                  <span className="ss__play-icon">{playing ? '❚❚' : '▶'}</span>
                </button>
              )}
            </div>

            {by && <p className="ss__kicker">@{by} posted this on TuneBoxed</p>}
            <h1 className="ss__title">{title}</h1>
            <p className="ss__artist">{artist}</p>

            <div className="ss__actions">
              <a
                ref={ctaMagnet}
                className="ss__btn ss__btn--primary"
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get TuneBoxed
              </a>
              {listen && (
                <a className="ss__btn" href={listen} target="_blank" rel="noopener noreferrer">
                  Listen to the full song
                </a>
              )}
            </div>

            <p className="ss__pitch">
              One genre a day. Everyone posts a song that fits, the feed likes decide, and at 10 PM the top 16 fight
              for the crown.
            </p>
          </>
        ) : (
          <div className="ss__missing">
            <h1 className="ss__title">This song link is incomplete</h1>
            <p className="ss__artist">Ask whoever sent it to share it again from the app.</p>
            <div className="ss__actions">
              <a className="ss__btn ss__btn--primary" href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                Get TuneBoxed
              </a>
              <Link className="ss__btn" to="/">
                Go to tuneboxed.com
              </Link>
            </div>
          </div>
        )}
      </motion.main>
    </div>
  );
}
