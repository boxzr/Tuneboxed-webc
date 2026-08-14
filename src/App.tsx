import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import './App.css';
import tuneboxedLogo from './assets/tuneboxed-battle-logo.png';
import { trackPageView } from './firebase';
import AdminDashboard from './components/AdminDashboard';
import PasswordReset from './pages/PasswordReset';
import BattleHome from './pages/BattleHome';
import BattleRoom from './pages/BattleRoom';
import BattleOverlay from './pages/BattleOverlay';
import BattleEntry from './battle/BattleEntry';
import Rules from './pages/Rules';
import Faq from './pages/Faq';
import Streamers from './pages/Streamers';
import About from './pages/About';
import Winners from './pages/Winners';
import Stats from './components/Stats';
import Reveal, { MOTION } from './components/Reveal';
import { CONTENT_PAGES } from './pages/PageLayout';
import './battle/battle.css';
import './pages/pages.css';

const APP_STORE_URL = 'https://apps.apple.com/us/app/tuneboxed/id6747647968';

/* Shared by every element in the hero so the whole sequence has one rhythm. */
const heroItem = {
  hidden: { opacity: 0, y: MOTION.rise },
  shown: { opacity: 1, y: 0 },
};
const heroTransition = { duration: MOTION.duration, ease: MOTION.easeOut };

function MainWebsite() {
  const [isAdminVisible, setIsAdminVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    void trackPageView('home');
  }, []);

  // Admin access with Alt+Shift+A+T
  useEffect(() => {
    let keysPressed: string[] = [];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey) {
        const key = e.key.toUpperCase();
        keysPressed.push(key);

        if (keysPressed.includes('A') && keysPressed.includes('T')) {
          const aIndex = keysPressed.lastIndexOf('A');
          const tIndex = keysPressed.lastIndexOf('T');

          if (tIndex > aIndex) {
            keysPressed = [];
            setIsAdminVisible(prevState => !prevState);
          }
        }

        if (keysPressed.length > 10) {
          keysPressed = keysPressed.slice(-10);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey || !e.shiftKey) {
        keysPressed = [];
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  if (isAdminVisible) {
    return (
      <div className="App">
        <nav className="nav-menu">
          <a href="/" className="nav-logo">
            <img src={tuneboxedLogo} alt="TuneBoxed" className="nav-logo-image" />
          </a>
          <div className="nav-links">
            <button className="nav-link nav-link--plain" onClick={() => setIsAdminVisible(false)}>
              Back to Site
            </button>
          </div>
        </nav>
        <AdminDashboard />
      </div>
    );
  }

  return (
    <div className="App">
      <nav className="nav-menu">
        <a href="/" className="nav-logo">
          <img src={tuneboxedLogo} alt="TuneBoxed" className="nav-logo-image" />
        </a>
        <div className="nav-links">
          <a
            href={APP_STORE_URL}
            className="app-store-btn app-store-btn--nav"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download on the App Store
          </a>
        </div>
      </nav>

      <main className="home">
        {/* The hero is above the fold, so it animates on mount rather than on
            scroll. Each piece is offset by a beat so the eye is led from the
            headline down to the form instead of everything landing at once. */}
        <motion.section
          className="home-hero"
          initial={reduced ? undefined : 'hidden'}
          animate={reduced ? undefined : 'shown'}
          variants={{ hidden: {}, shown: { transition: { staggerChildren: MOTION.stagger } } }}
        >
          <motion.img
            className="battle-hero-logo"
            src={tuneboxedLogo}
            alt=""
            variants={heroItem}
            transition={heroTransition}
          />

          <motion.h1 className="battle-hero-title" variants={heroItem} transition={heroTransition}>
            The Kahoot of song battles
          </motion.h1>

          <motion.p className="battle-hero-sub" variants={heroItem} transition={heroTransition}>
            Host a bracket for your stream. Your viewers join with a room code, everyone
            hears each track at the same moment, and Twitch chat types 1 or 2 to pick the
            winner. No app, no account.
          </motion.p>

          <motion.div
            className="battle battle--embedded battle-hero-card"
            variants={heroItem}
            transition={heroTransition}
          >
            <BattleEntry showIntro={false} />
          </motion.div>

          {/* Three lines rather than a section each: the page exists to get a
              streamer into a room, so anything longer competes with the form. */}
          <motion.ul className="home-steps" variants={heroItem} transition={heroTransition}>
            <li>
              <span className="home-step-num">1</span>
              Start a room and read the code out on stream
            </li>
            <li>
              <span className="home-step-num">2</span>
              Viewers pick a song each, in the browser
            </li>
            <li>
              <span className="home-step-num">3</span>
              Two tracks play head to head, chat votes, the bracket advances
            </li>
          </motion.ul>

          <motion.div variants={heroItem} transition={heroTransition}>
            <Stats />
          </motion.div>
        </motion.section>

      </main>

      <Reveal as="div">
        <footer className="page-footer">
          {/* Same list the sitemap is built from, so every content page is
              reachable by a crawler from the home page. */}
          <nav className="page-footer-links">
            {CONTENT_PAGES.map((p) => (
              <Link key={p.path} to={p.path}>
                {p.label}
              </Link>
            ))}
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
              iOS app
            </a>
          </nav>
          <p>Aura Brand LLC © {new Date().getFullYear()}</p>
        </footer>
      </Reveal>
    </div>
  );
}

/**
 * Jump to the top on every route change.
 *
 * The homepage nav is `position: fixed`, so a leftover scroll is invisible
 * there. Content pages pin their nav in the document flow, so arriving at
 * /rules still scrolled to where the footer was leaves the bar off-screen
 * and no way back. `behavior: 'auto'` also overrides the site-wide smooth
 * scroll, which would otherwise animate the jump and leave the nav missing
 * for a beat.
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/reset-password" element={<PasswordReset />} />
      {/* /join/:code is the shareable form a streamer reads out on air. */}
      <Route path="/join/:code" element={<BattleHome />} />
      <Route path="/battle" element={<BattleHome />} />
      <Route path="/battle/:code" element={<BattleRoom />} />
      <Route path="/overlay/:code" element={<BattleOverlay />} />
      {/* Content routes. scripts/prerender.mjs emits a real HTML file for each
          of these, so they return 200 and can be indexed rather than being
          served by GitHub's 404 handler. Keep the two lists in step. */}
      <Route path="/rules" element={<Rules />} />
      <Route path="/faq" element={<Faq />} />
      <Route path="/streamers" element={<Streamers />} />
      <Route path="/about" element={<About />} />
      <Route path="/winners" element={<Winners />} />
      <Route path="/*" element={<MainWebsite />} />
    </Routes>
    </>
  );
}

export default App;
