import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import './App.css';
import tuneboxedLogo from './assets/tuneboxed-battle-logo.png';
import { trackPageView } from './firebase';
import AdminDashboard from './components/AdminDashboard';
import PasswordReset from './pages/PasswordReset';
import BattleHome from './pages/BattleHome';
import BattleRoom from './pages/BattleRoom';
import BattleOverlay from './pages/BattleOverlay';
import BattleEntry from './battle/BattleEntry';
import './battle/battle.css';

const APP_STORE_URL = 'https://apps.apple.com/us/app/tuneboxed/id6747647968';

function MainWebsite() {
  const [isAdminVisible, setIsAdminVisible] = useState(false);

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
            className="nav-link nav-cta"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get the app
          </a>
        </div>
      </nav>

      <main className="home">
        <section className="home-hero">
          <motion.img
            className="battle-hero-logo"
            src={tuneboxedLogo}
            alt=""
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />

          <motion.h1
            className="battle-hero-title"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45 }}
          >
            The Kahoot of song battles
          </motion.h1>

          <motion.p
            className="battle-hero-sub"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.45 }}
          >
            Host a bracket for your stream. Your viewers join with a room code, everyone
            hears each track at the same moment, and Twitch chat types 1 or 2 to pick the
            winner. No app, no account.
          </motion.p>

          <motion.div
            className="battle battle--embedded battle-hero-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.45 }}
          >
            <BattleEntry showIntro={false} />
          </motion.div>

          {/* Three lines rather than a section each: the page exists to get a
              streamer into a room, so anything longer competes with the form. */}
          <motion.ul
            className="home-steps"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
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
        </section>

        <section className="home-app">
          <p className="home-app-text">
            TuneBoxed is also an iOS app for showing off your music taste.
          </p>
          <a
            href={APP_STORE_URL}
            className="home-app-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download on the App Store
          </a>
        </section>
      </main>

      <footer className="footer">
        <p>Aura Brand LLC © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/reset-password" element={<PasswordReset />} />
      {/* /join/:code is the shareable form a streamer reads out on air. */}
      <Route path="/join/:code" element={<BattleHome />} />
      <Route path="/battle" element={<BattleHome />} />
      <Route path="/battle/:code" element={<BattleRoom />} />
      <Route path="/overlay/:code" element={<BattleOverlay />} />
      <Route path="/*" element={<MainWebsite />} />
    </Routes>
  );
}

export default App;
