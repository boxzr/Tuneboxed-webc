import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/tuneboxed-battle-logo.png';
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
        <h1 className="page-title">{heading}</h1>
        {intro && <p className="page-intro">{intro}</p>}
        {children}
      </main>

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
    </div>
  );
}
