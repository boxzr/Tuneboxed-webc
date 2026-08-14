import { Children, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import logo from '../assets/tuneboxed-battle-logo.png';
import Reveal, { MOTION } from '../components/Reveal';
import './pages.css';

export const APP_STORE_URL = 'https://apps.apple.com/us/app/tuneboxed/id6747647968';

/** Every content route, in the order they appear in the footer and sitemap. */
export const CONTENT_PAGES = [
  { path: '/battle', label: 'Play' },
  { path: '/rules', label: 'Game rules' },
  { path: '/faq', label: 'FAQ' },
  { path: '/streamers', label: 'For streamers' },
  { path: '/winners', label: 'Winners' },
  { path: '/about', label: 'About' },
] as const;

const headItem = {
  hidden: { opacity: 0, y: MOTION.rise },
  shown: { opacity: 1, y: 0 },
};
const headTransition = { duration: MOTION.duration, ease: MOTION.easeOut };

/**
 * Chrome shared by the content pages.
 *
 * Sets the document title and meta description on mount as well as at
 * prerender time. The prerendered HTML is what search engines read, but a
 * visitor moving between routes in the SPA never reloads, so without this the
 * tab would keep the title of whichever page they landed on first.
 */
export default function PageLayout({
  title,
  description,
  heading,
  intro,
  children,
}: {
  title: string;
  description: string;
  heading: string;
  intro?: string;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();

  useEffect(() => {
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description);
  }, [title, description]);

  return (
    <div className="page">
      <nav className="page-nav">
        <Link to="/" className="page-nav-logo">
          <img src={logo} alt="TuneBoxed" />
        </Link>
        <div className="page-nav-links">
          <Link to="/battle" className="page-nav-cta">
            Start a battle
          </Link>
        </div>
      </nav>

      <main className="page-main">
        {/* Heading and intro are above the fold, so they arrive on mount. */}
        <motion.div
          initial={reduced ? undefined : 'hidden'}
          animate={reduced ? undefined : 'shown'}
          variants={{ hidden: {}, shown: { transition: { staggerChildren: MOTION.stagger } } }}
        >
          <motion.h1 className="page-title" variants={headItem} transition={headTransition}>
            {heading}
          </motion.h1>
          {intro && (
            <motion.p className="page-intro" variants={headItem} transition={headTransition}>
              {intro}
            </motion.p>
          )}
        </motion.div>

        {/* Each page hands over its sections as separate children, so revealing
            them one at a time here means no page has to wire up its own motion.
            Wrapping rather than cloning keeps this working whatever a child is,
            including plain strings and fragments. */}
        {Children.map(children, (child, i) => (
          <Reveal key={i}>{child}</Reveal>
        ))}
      </main>

      <Reveal as="div">
        <footer className="page-footer">
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
