import { sceneForGenre, type SceneId } from './sceneForGenre';
import './genreScene.css';

/**
 * Full-bleed atmosphere behind the board.
 *
 * One mood per family: a sky and a couple of large shapes. Anything busier
 * fought the type, and anything fetched from image search was unrelated junk.
 */
export default function GenreScene({ genre }: { genre: string | null }) {
  const scene = sceneForGenre(genre);
  if (!scene) return null;

  return (
    <div className={`tv-scene tv-scene--${scene}`} aria-hidden="true">
      <svg className="tv-scene__art" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        {art(scene)}
      </svg>
    </div>
  );
}

function art(scene: SceneId) {
  switch (scene) {
    case 'sunset':
      return (
        <>
          <defs>
            <linearGradient id="gs-sunset" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffd08a" />
              <stop offset="48%" stopColor="#fd9c07" />
              <stop offset="100%" stopColor="#fe5202" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#gs-sunset)" />
          <circle cx="1460" cy="430" r="240" fill="#ffe29a" />
          <rect y="860" width="1920" height="220" fill="#c34716" opacity="0.28" />
        </>
      );
    case 'night':
      return (
        <>
          <defs>
            <linearGradient id="gs-night" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1b2240" />
              <stop offset="100%" stopColor="#0c1020" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#gs-night)" />
          <circle cx="1380" cy="240" r="90" fill="#f4f0d8" />
          <circle cx="280" cy="160" r="3" fill="#fff" opacity="0.7" />
          <circle cx="520" cy="240" r="2" fill="#fff" opacity="0.55" />
          <circle cx="780" cy="120" r="2.5" fill="#fff" opacity="0.65" />
          <circle cx="1100" cy="200" r="2" fill="#fff" opacity="0.5" />
          <circle cx="1680" cy="360" r="2" fill="#fff" opacity="0.45" />
        </>
      );
    case 'stranger':
      return (
        <>
          <defs>
            <linearGradient id="gs-stranger" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a1030" />
              <stop offset="70%" stopColor="#12081c" />
              <stop offset="100%" stopColor="#4a1020" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#gs-stranger)" />
          <circle cx="240" cy="180" r="4" fill="#ff6b4a" opacity="0.8" />
          <circle cx="600" cy="120" r="3" fill="#fff" opacity="0.5" />
          <circle cx="980" cy="200" r="2" fill="#fff" opacity="0.45" />
          <circle cx="1500" cy="140" r="3" fill="#ff6b4a" opacity="0.7" />
          <rect y="880" width="1920" height="200" fill="#e0504a" opacity="0.22" />
        </>
      );
    case 'beach':
      return (
        <>
          <defs>
            <linearGradient id="gs-beach" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8fd4ff" />
              <stop offset="55%" stopColor="#4db7e8" />
              <stop offset="55%" stopColor="#2aa0c8" />
              <stop offset="78%" stopColor="#1d8bb3" />
              <stop offset="78%" stopColor="#e8d5a3" />
              <stop offset="100%" stopColor="#d4bc7a" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#gs-beach)" />
          <circle cx="420" cy="220" r="90" fill="#ffe7a8" />
        </>
      );
    case 'rain':
      return (
        <>
          <defs>
            <linearGradient id="gs-rain" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6d7c8d" />
              <stop offset="100%" stopColor="#3d4a58" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#gs-rain)" />
          {Array.from({ length: 18 }, (_, i) => (
            <line
              key={i}
              x1={80 + i * 105}
              y1={40 + (i % 4) * 30}
              x2={40 + i * 105}
              y2={1040}
              stroke="#c5d0dc"
              strokeWidth="3"
              opacity="0.28"
            />
          ))}
        </>
      );
    case 'snow':
      return (
        <>
          <defs>
            <linearGradient id="gs-snow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e8f2fb" />
              <stop offset="100%" stopColor="#b9cfe0" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#gs-snow)" />
          <circle cx="240" cy="180" r="6" fill="#fff" />
          <circle cx="620" cy="320" r="8" fill="#fff" />
          <circle cx="980" cy="140" r="5" fill="#fff" />
          <circle cx="1340" cy="260" r="7" fill="#fff" />
          <circle cx="1680" cy="400" r="6" fill="#fff" />
          <circle cx="400" cy="620" r="5" fill="#fff" />
          <circle cx="1100" cy="540" r="8" fill="#fff" />
          <circle cx="1500" cy="720" r="6" fill="#fff" />
        </>
      );
    case 'gym':
      return (
        <>
          <defs>
            <linearGradient id="gs-gym" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2a2e33" />
              <stop offset="100%" stopColor="#141618" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#gs-gym)" />
          <rect x="-80" y="820" width="2200" height="80" fill="#fd9c07" transform="rotate(-6 960 860)" />
          <rect x="-80" y="200" width="2200" height="18" fill="#fd9c07" opacity="0.35" transform="rotate(-6 960 210)" />
        </>
      );
    case 'rap':
      return (
        <>
          <defs>
            <linearGradient id="gs-rap" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a1848" />
              <stop offset="100%" stopColor="#12081f" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#gs-rap)" />
          <rect x="180" y="720" width="160" height="360" fill="#1a0f30" />
          <rect x="380" y="600" width="220" height="480" fill="#24143c" />
          <rect x="640" y="680" width="140" height="400" fill="#1a0f30" />
          <rect x="1280" y="580" width="260" height="500" fill="#24143c" />
          <rect x="1580" y="700" width="180" height="380" fill="#1a0f30" />
          <circle cx="960" cy="1080" r="420" fill="#fd9c07" opacity="0.16" />
        </>
      );
    case 'rock':
      return (
        <>
          <defs>
            <linearGradient id="gs-rock" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3a2414" />
              <stop offset="100%" stopColor="#140c08" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#gs-rock)" />
          <circle cx="960" cy="1080" r="520" fill="#fe5202" opacity="0.28" />
          <circle cx="960" cy="1080" r="280" fill="#fd9c07" opacity="0.2" />
        </>
      );
    case 'club':
      return (
        <>
          <defs>
            <linearGradient id="gs-club" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3a0d4a" />
              <stop offset="100%" stopColor="#06182e" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#gs-club)" />
          <circle cx="360" cy="200" r="260" fill="#8c59f2" opacity="0.28" />
          <circle cx="1600" cy="860" r="320" fill="#009ffd" opacity="0.22" />
        </>
      );
    case 'city':
      return (
        <>
          <defs>
            <linearGradient id="gs-city" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7ea4c8" />
              <stop offset="100%" stopColor="#2c3d52" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#gs-city)" />
          <rect x="120" y="640" width="140" height="440" fill="#1f2a38" />
          <rect x="300" y="520" width="200" height="560" fill="#263445" />
          <rect x="540" y="700" width="120" height="380" fill="#1f2a38" />
          <rect x="1320" y="560" width="180" height="520" fill="#263445" />
          <rect x="1540" y="680" width="220" height="400" fill="#1f2a38" />
        </>
      );
    case 'cozy':
      return (
        <>
          <defs>
            <linearGradient id="gs-cozy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f6e6c8" />
              <stop offset="100%" stopColor="#e8c48a" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#gs-cozy)" />
          <rect x="720" y="160" width="480" height="360" rx="12" fill="#fff6e4" opacity="0.55" />
        </>
      );
    case 'romance':
      return (
        <>
          <defs>
            <linearGradient id="gs-romance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f3c1c8" />
              <stop offset="100%" stopColor="#c45b6a" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#gs-romance)" />
          <circle cx="1480" cy="280" r="160" fill="#ffe0c2" opacity="0.7" />
        </>
      );
    case 'sad':
      return (
        <>
          <defs>
            <linearGradient id="gs-sad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8ea0b5" />
              <stop offset="100%" stopColor="#4d5c6e" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#gs-sad)" />
        </>
      );
    case 'cinema':
      return (
        <>
          <defs>
            <linearGradient id="gs-cinema" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2c1b4a" />
              <stop offset="100%" stopColor="#12081f" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#gs-cinema)" />
          <rect x="560" y="200" width="800" height="450" rx="8" fill="#fd9c07" opacity="0.18" />
        </>
      );
    case 'warm':
      return (
        <>
          <defs>
            <linearGradient id="gs-warm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffe3b0" />
              <stop offset="100%" stopColor="#fd9c07" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#gs-warm)" />
        </>
      );
    default:
      return (
        <>
          <defs>
            <linearGradient id="gs-default" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff4e0" />
              <stop offset="100%" stopColor="#ffd08a" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#gs-default)" />
        </>
      );
  }
}
