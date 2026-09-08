import { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import './App.css';
import tuneboxedLogo from './assets/tuneboxed-battle-logo.png';
import { trackPageView } from './firebase';
import AdminDashboard from './components/AdminDashboard';
import PasswordReset from './pages/PasswordReset';
import BattleHome from './pages/BattleHome';
import BattleRoom from './pages/BattleRoom';
import BattleTV from './pages/BattleTV';
import BattleEntry from './battle/BattleEntry';
import FightDemo from './battle/ui/FightDemo';
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
    // Kept in step with ROUTES in scripts/seo.mjs, which is what the
    // prerendered HTML and the sitemap are built from.
    document.title = 'TuneBoxed | Song battles fought as boxing matches';
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
          <nav className="nav-sitelinks" aria-label="TuneBoxed">
            {CONTENT_PAGES.map((p) => (
              <Link key={p.path} to={p.path} className="nav-link">
                {p.label}
              </Link>
            ))}
          </nav>
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
        {/* A dark, lit arena rather than the white page the rest of the site
            uses. Boxing happens under lights, and the competitors' pages are
            both dark, so a white marketing page reads as the plainer product
            however good the game underneath is. */}
        <section className="home-arena">
          <div className="home-arena__lights" aria-hidden="true" />

          {/* Two columns on a wide screen: the form on the left because
              getting into a room is still the job of this page, and a bout
              fighting itself on the right because that is the part no
              competitor has. Stacks on a phone, form first. */}
          <motion.div
            className="home-hero home-hero--split"
            initial={reduced ? undefined : 'hidden'}
            animate={reduced ? undefined : 'shown'}
            variants={{ hidden: {}, shown: { transition: { staggerChildren: MOTION.stagger } } }}
          >
            <motion.div
              className="home-pitch"
              variants={{ hidden: {}, shown: { transition: { staggerChildren: MOTION.stagger } } }}
            >
              <motion.span className="home-kicker" variants={heroItem} transition={heroTransition}>
                <img src={tuneboxedLogo} alt="" />
                TuneBoxed
              </motion.span>

              <motion.h1 className="battle-hero-title" variants={heroItem} transition={heroTransition}>
                We turned song battles into <em>boxing fights</em>
              </motion.h1>

              <motion.p className="home-lede" variants={heroItem} transition={heroTransition}>
                Two songs enter the ring. You decide who walks out.
              </motion.p>

              <motion.p className="battle-hero-sub" variants={heroItem} transition={heroTransition}>
                Everyone picks a track. Two of them square up head to head, and every
                vote lands a punch until one song is on the canvas. Around a table, in a
                call, or live on stream. No app, no account.
              </motion.p>

              <motion.div
                className="battle battle--embedded battle-hero-card"
                variants={heroItem}
                transition={heroTransition}
              >
                <BattleEntry showIntro={false} />
              </motion.div>
            </motion.div>

            {/* The real BoxingMatch, not a picture of one, so the pitch cannot
                promise something the game does not do. */}
            <motion.div className="home-ring" variants={heroItem} transition={heroTransition}>
              <span className="home-ring__tag">
                <span className="home-ring__dot" aria-hidden="true" />
                Live on the stream board
              </span>
              <FightDemo />
            </motion.div>
          </motion.div>
        </section>

        <Reveal as="section" className="home-how">
          <h2 className="home-how__title">Votes are punches</h2>
          <p className="home-how__sub">
            Other song battle sites give you two bars and a total. A poll tells you who is
            winning. A fight makes the room feel it.
          </p>

          <ul className="home-points">
            <li>
              <strong>Chat throws the punches</strong>
              Viewers type 1 or 2 in your Twitch chat. Every vote rocks the other song and
              drains its health, so the crowd watches the fight turn in real time.
            </li>
            <li>
              <strong>Shut a song out and it goes down</strong>
              A close call goes to decision. A song nobody votes for hits the canvas, and
              the board calls the knockout.
            </li>
            <li>
              <strong>You control the clip</strong>
              Bracket rounds let you set how long each song plays, up to the full preview,
              instead of being stuck with a fixed few seconds.
            </li>
            <li>
              <strong>Nothing to install</strong>
              Share a code, share your screen. No bot in your channel, no OAuth on your
              account, no download for your viewers.
            </li>
          </ul>

          {/* Three lines rather than a section each: the page exists to get
              somebody into a room, so anything longer competes with the form. */}
          <ul className="home-steps">
            <li>
              <span className="home-step-num">1</span>
              Start a room and share the code
            </li>
            <li>
              <span className="home-step-num">2</span>
              Everyone picks a song, in the browser
            </li>
            <li>
              <span className="home-step-num">3</span>
              Party plays to three rounds. Bracket fights head to head until one is left.
            </li>
          </ul>

          <div className="home-how__cta">
            <Link to="/battle" className="app-store-btn">
              Start a battle
            </Link>
          </div>
        </Reveal>

        <Reveal as="div">
          <Stats />
        </Reveal>

        {/* Under the stat line rather than beside the main call to action.
            It is the one link on the page aimed at streamers specifically, so
            it reads as a footnote to the numbers instead of competing with
            "start a battle". */}
        <Reveal as="div" className="home-streamers">
          <Link to="/streamers" className="home-how__link">
            Setting it up on stream
          </Link>
        </Reveal>
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

function OverlayRedirect() {
  const { code = '' } = useParams<{ code: string }>();
  return <Navigate to={`/tv/${code}`} replace />;
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
      {/* The board an audience watches: shared as a tab, or added as a browser
          source. Takes no session, so it can never occupy a player slot. */}
      <Route path="/tv/:code" element={<BattleTV />} />
      {/* The transparent overlay this replaced. Anyone who already pasted an
          /overlay URL into OBS keeps working rather than getting the site. */}
      <Route path="/overlay/:code" element={<OverlayRedirect />} />
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
