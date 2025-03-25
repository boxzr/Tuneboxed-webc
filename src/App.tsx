import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import './App.css';
import tuneboxedLogo from './tuneboxed-logo.png';
import { trackPageView } from './firebase';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [email, setEmail] = useState('');
  const [currentSection, setCurrentSection] = useState('home');
  const [isBoxClicked, setIsBoxClicked] = useState(false);
  const audioRef = useRef(new Audio('/explosion.mp3'));
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isAdminVisible, setIsAdminVisible] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);

  // Track user authentication state - using mock instead
  useEffect(() => {
    // Set mock user state - we're not really using auth in this version
    setUser(null);
    
    // Return empty cleanup function
    return () => {};
  }, []);

  // Track page views
  useEffect(() => {
    const trackView = async () => {
      await trackPageView(currentSection);
    };
    trackView();
  }, [currentSection]);

  // Handle email sign-up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Starting signup process for email:', email);
      
      // Actually save the email to the database
      const { signUpWithEmail } = await import('./firebase');
      
      // Create a random name for demo purposes
      const randomName = `User_${Math.floor(Math.random() * 10000)}`;
      console.log('Generated random name:', randomName);
      
      // Save the user with email
      const result = await signUpWithEmail(email, 'password123', randomName);
      console.log('Signup result:', result);
      
      // Track the event
      await trackPageView('sign_up_for_updates');
      console.log(`Signed up for updates: ${email}`);
      setSignUpSuccess(true);
    } catch (error) {
      console.error('Sign up error:', error);
      setSignUpError('Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Admin access with Alt+Shift+A+T
  useEffect(() => {
    // Track keys pressed in sequence
    let keysPressed: string[] = [];
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only track if Alt and Shift are held
      if (e.altKey && e.shiftKey) {
        // Convert key to uppercase for consistent checking
        const key = e.key.toUpperCase();
        
        // Add to keys pressed array
        keysPressed.push(key);
        console.log("Key pressed:", key, "Current sequence:", keysPressed);
        
        // Check if we have the correct sequence A followed by T
        if (keysPressed.includes('A') && keysPressed.includes('T')) {
          // Look for the sequence A->T
          const aIndex = keysPressed.lastIndexOf('A');
          const tIndex = keysPressed.lastIndexOf('T');
          
          // If T comes after A, that's our sequence
          if (tIndex > aIndex) {
            // Reset keys and toggle admin
            keysPressed = [];
            console.log("Admin sequence detected! Toggling dashboard.");
            
            setIsAdminVisible(prevState => {
              const newState = !prevState;
              // If admin is being shown, check for new signups right away
              if (newState) {
                // Force a refresh of the admin data including new signups
                console.log('Admin dashboard activated');
              }
              const trackAdminView = async () => {
                await trackPageView(newState ? 'admin' : 'home');
              };
              trackAdminView();
              return newState;
            });
          }
        }
        
        // Limit array size to prevent memory issues
        if (keysPressed.length > 10) {
          keysPressed = keysPressed.slice(-10);
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // If either Alt or Shift is released, clear the sequence
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

  // Add background animation
  const [backgroundElements, setBackgroundElements] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const instruments = ['🎸', '🎹', '🎺', '🎷', '🎻', '🥁', '🎼', '🎵', '🎶'];
    
    const createBackgroundElements = () => {
      return Array.from({ length: 20 }, (_, i) => {
        const instrument = instruments[Math.floor(Math.random() * instruments.length)];
        const delay = Math.random() * 20;
        const duration = 15 + Math.random() * 10;
        const startX = Math.random() * window.innerWidth;
        
        return (
          <motion.span
            key={i}
            className="floating-instrument"
            initial={{ 
              x: startX,
              y: window.innerHeight + 100,
              opacity: 0,
              rotate: 0
            }}
            animate={{
              x: startX + (Math.random() - 0.5) * 200,
              y: -100,
              opacity: [0, 0.5, 0],
              rotate: 360
            }}
            transition={{
              duration: duration,
              delay: delay,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {instrument}
          </motion.span>
        );
      });
    };

    setBackgroundElements(createBackgroundElements());
  }, []);

  const handleNavClick = (section: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentSection(section);
  };

  // Render the sign-up form
  const renderSignUpForm = () => {
    if (signUpSuccess) {
      return (
        <div className="success-message">
          <h2>Thanks for signing up!</h2>
          <p>You'll receive updates about TuneBoxed soon.</p>
          <button 
            className="primary-button" 
            onClick={() => {
              setCurrentSection('home'); // Redirect to home
            }}
          >
            Continue Exploring
          </button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSignUp} className="signup-form">
        <h2>Stay Updated</h2>
        <p>Sign up to receive updates about our launch and future features.</p>
        {signUpError && <div className="error-message">{signUpError}</div>}
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="signup-button"
          disabled={loading}
        >
          {loading ? 'Signing up...' : 'Get Updates'}
        </button>
      </form>
    );
  };

  return (
    <div className="App">
      <div className="background-animation">
        {backgroundElements}
      </div>
      
      {!isAdminVisible ? (
        <>
          <nav className="nav-menu">
            <a href="/" className="nav-logo">
              <img src={tuneboxedLogo} alt="TuneBoxed" className="nav-logo-image" />
            </a>
            <div className="nav-links">
              <a href="#home" className="nav-link" onClick={handleNavClick('home')}>
                Home
              </a>
              <a href="#about" className="nav-link" onClick={handleNavClick('about')}>
                About
              </a>
              <a href="#signup" className="nav-link" onClick={handleNavClick('signup')}>
                Sign Up
              </a>
              {user && (
                <a href="#admin" className="nav-link" onClick={() => setIsAdminVisible(true)}>
                  Admin
                </a>
              )}
            </div>
          </nav>

          {currentSection === 'home' && (
            <section id="home" className="section">
              {!isBoxClicked ? (
                <div className="box-container">
                  <motion.div
                    className="cardboard-box"
                    initial={{ scale: 1 }}
                    animate={{
                      scale: [1, 1.15, 0.9, 1.2, 0.85, 1.1, 0.95],
                      rotate: [0, -8, 12, -15, 15, -10, 8],
                      y: [0, -15, 8, -20, 10, -15, 5],
                      x: [0, -12, 15, -20, 15, -15, 10]
                    }}
                    transition={{
                      duration: 2.5,
                      times: [0, 0.2, 0.4, 0.6, 0.7, 0.8, 1],
                      ease: "easeInOut"
                    }}
                    onAnimationComplete={() => {
                      setIsBoxClicked(true);
                      audioRef.current.play().catch(error => console.log('Audio playback failed:', error));
                    }}
                  >
                    <div className="box-content">
                      <motion.div 
                        className="box-lid"
                        animate={{ 
                          rotateX: [0, 25, -20, 30, -15, 20, -10],
                          y: [0, -5, 4, -6, 3, -4, 2]
                        }}
                        transition={{
                          duration: 2.5,
                          times: [0, 0.2, 0.4, 0.6, 0.7, 0.8, 1],
                          ease: "easeInOut"
                        }}
                      />
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="content-container">
                  <motion.h1
                    className="logo-text"
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    TUNEBOXED
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Showcase your music taste.
                  </motion.p>

                  <motion.div
                    className="preview-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <motion.div
                      className="preview-box"
                      initial={{ opacity: 0, scale: 0, rotate: -180 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
                      style={{ width: 'auto', height: 'auto', padding: 0 }}
                    >
                      <img 
                        src="/story1.png" 
                        alt="Story 1" 
                        style={{ 
                          display: 'block',
                          maxWidth: '220px',
                          width: '100%'
                        }} 
                      />
                    </motion.div>
                    
                    <motion.div
                      className="preview-box"
                      initial={{ opacity: 0, scale: 0, rotate: -180 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
                      style={{ width: 'auto', height: 'auto', padding: 0 }}
                    >
                      <img 
                        src="/story2.png" 
                        alt="Story 2" 
                        style={{ 
                          display: 'block',
                          maxWidth: '220px',
                          width: '100%'
                        }} 
                      />
                    </motion.div>
                    
                    <motion.div
                      className="preview-box"
                      initial={{ opacity: 0, scale: 0, rotate: -180 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ delay: 1.1, duration: 0.6, ease: "easeOut" }}
                      style={{ width: 'auto', height: 'auto', padding: 0 }}
                    >
                      <img 
                        src="/story3.png" 
                        alt="Story 3" 
                        style={{ 
                          display: 'block',
                          maxWidth: '220px',
                          width: '100%'
                        }} 
                      />
                    </motion.div>
                  </motion.div>

                  <motion.div
                    className="mission-section"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3, duration: 0.6 }}
                  >
                    <motion.h2
                      className="mission-title"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.6, duration: 0.5 }}
                    >
                      TuneBoxed© - Showcase Your Music Taste
                    </motion.h2>
                    <motion.p
                      className="mission-text"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.7, duration: 0.5 }}
                    >
                      Share and Express Yourself Through Sound
                    </motion.p>
                    <motion.p
                      className="mission-description"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.8, duration: 0.5 }}
                    >
                      First app where you can connect with people through music.
                    </motion.p>
                  </motion.div>

                  <div className="explosion-effect">
                    {Array.from({ length: 15 }).map((_, i) => {
                      // Precompute all random values to ensure consistency
                      const emojiIndex = i % 6;
                      const emoji = ['🎵', '🎶', '🎹', '🎺', '🎷', '🥁'][emojiIndex];
                      const xOffset = (Math.random() - 0.5) * 500;
                      const yOffset = (Math.random() - 0.5) * 500;
                      const rotation = Math.random() * 360;
                      const duration = 2 + Math.random() * 2;
                      
                      return (
                        <motion.span
                          key={`explosion-${i}`}
                          className="explosion-particle"
                          style={{ 
                            position: 'absolute',
                            fontSize: '2.5rem',
                            zIndex: 10
                          }}
                          initial={{
                            opacity: 0,
                            scale: 0,
                            x: 0,
                            y: 0,
                            rotate: 0,
                          }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1.5, 0.5],
                            x: xOffset,
                            y: yOffset,
                            rotate: rotation,
                          }}
                          transition={{
                            duration: duration,
                            delay: 0.2,
                            ease: "easeOut",
                            times: [0, 0.2, 1],
                          }}
                        >
                          {emoji}
                        </motion.span>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {currentSection === 'about' && (
            <section id="about" className="section about-section">
              <div className="about-container">
                <h1 className="about-title">Transforming music expression</h1>
                <p className="about-intro">
                  Experience music sharing reimagined for the modern era
                </p>
                
                <div className="features-container">
                  <div className="feature-item">
                    <button 
                      className="feature-trigger"
                      onClick={() => setActiveFeature(activeFeature === 'vision' ? null : 'vision')}
                    >
                      <span className="feature-title">Vision & Innovation</span>
                      <span className="feature-arrow">{activeFeature === 'vision' ? '▲' : '▼'}</span>
                    </button>
                    
                    {activeFeature === 'vision' && (
                      <motion.div 
                        className="feature-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p>Create a vibrant ecosystem where music lovers can express their emotional connection to songs through unique visual and written expressions.</p>
                        <div className="feature-details">
                          <ul>
                            <li>Innovative TuneBox creation tools</li>
                            <li>Visual music expression platform</li>
                            <li>Personalized musical journey tracking</li>
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="feature-item">
                    <button 
                      className="feature-trigger"
                      onClick={() => setActiveFeature(activeFeature === 'community' ? null : 'community')}
                    >
                      <span className="feature-title">Community & Connection</span>
                      <span className="feature-arrow">{activeFeature === 'community' ? '▲' : '▼'}</span>
                    </button>
                    
                    {activeFeature === 'community' && (
                      <motion.div 
                        className="feature-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p>Foster meaningful connections through music with location-based communities and genre-specific groups.</p>
                        <div className="feature-details">
                          <ul>
                            <li>Location-based music communities</li>
                            <li>Genre-specific discussion groups</li>
                            <li>Collaborative playlists and sharing</li>
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="feature-item">
                    <button 
                      className="feature-trigger"
                      onClick={() => setActiveFeature(activeFeature === 'platform' ? null : 'platform')}
                    >
                      <span className="feature-title">Platform Features</span>
                      <span className="feature-arrow">{activeFeature === 'platform' ? '▲' : '▼'}</span>
                    </button>
                    
                    {activeFeature === 'platform' && (
                      <motion.div 
                        className="feature-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p>Weekly curated music posts, creative expression tools, and personalized event discoveries.</p>
                        <div className="feature-details">
                          <ul>
                            <li>Curated weekly music discoveries</li>
                            <li>Advanced sharing tools</li>
                            <li>Personalized recommendations</li>
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
                
                <div className="about-mission">
                  <p className="gradient-text">Join us in redefining the future of music sharing</p>
                </div>
              </div>
            </section>
          )}

          {currentSection === 'signup' && (
            <section id="signup" className="section">
              <motion.div 
                className="signup-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="signup-title">Join Tuneboxed</h2>
                <p className="signup-subtitle">Start showcasing your music taste today</p>
                
                <div className="signup-options">
                  {renderSignUpForm()}
                </div>
              </motion.div>
            </section>
          )}
        </>
      ) : (
        <>
          <nav className="nav-menu">
            <a href="/" className="nav-logo">
              <img src={tuneboxedLogo} alt="TuneBoxed" className="nav-logo-image" />
            </a>
            <div className="nav-links">
              <a href="#home" className="nav-link" onClick={() => setIsAdminVisible(false)}>
                Back to Site
              </a>
            </div>
          </nav>
          
          <AdminDashboard />
        </>
      )}

      <footer className="footer">
        <p>Made by Jonah Boxer © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;
