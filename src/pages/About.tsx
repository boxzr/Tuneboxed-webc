import React from 'react';
import { motion } from 'framer-motion';

function About() {
  return (
    <div className="page about-page">
      <div className="content-container">
        <motion.h1 
          className="page-title"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          About Tuneboxed
        </motion.h1>

        <motion.div 
          className="about-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="intro-section">
            <p className="main-description">
              Tuneboxed is your personal music time capsule. We help you track, 
              visualize, and share your music journey.
            </p>
          </div>

          <div className="features">
            <motion.div 
              className="feature"
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.3 }}
            >
              <h3>Track Your Favorites</h3>
              <p>Keep up with your most played artists and tracks</p>
            </motion.div>

            <motion.div 
              className="feature"
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.3 }}
            >
              <h3>Visualize Trends</h3>
              <p>See how your music taste evolves over time</p>
            </motion.div>

            <motion.div 
              className="feature"
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.3 }}
            >
              <h3>Share Your Style</h3>
              <p>Create shareable music boxes to show off your unique taste</p>
            </motion.div>
          </div>

          <motion.div 
            className="mission-statement"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h2>Our Mission</h2>
            <p>
              We believe every music journey tells a unique story. 
              Tuneboxed helps you capture and share those musical moments 
              that make your story special.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default About;
