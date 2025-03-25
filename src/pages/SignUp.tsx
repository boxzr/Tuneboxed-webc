import React from 'react';
import { motion } from 'framer-motion';

function SignUp() {
  return (
    <div className="page signup-page">
      <div className="content-container">
        <motion.h1 
          className="page-title"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Join Tuneboxed
        </motion.h1>
        <motion.div 
          className="signup-form"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" placeholder="Enter your email" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Create a password" />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input type="password" id="confirm-password" placeholder="Confirm your password" />
          </div>
          <button className="signup-button">Sign Up with Email</button>
        </motion.div>
      </div>
    </div>
  );
}

export default SignUp;
