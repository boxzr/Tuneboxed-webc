import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { passwordResetService } from '../services/passwordResetService';
import { cloudKitService } from '../services/cloudkitService';

const PasswordReset: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. No token provided.');
      setTokenValid(false);
      return;
    }
    
    // Validate token with CloudKit
    validateResetToken(token);
  }, [token]);

  const validateResetToken = async (resetToken: string) => {
    try {
      setLoading(true);
      
      const validation = await passwordResetService.validateResetToken(resetToken);
      
      if (validation.valid) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        setError(validation.message);
      }
    } catch (err) {
      setTokenValid(false);
      setError('Failed to validate reset token. Please try again.');
      console.error('Token validation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Use the password reset service to handle the complete flow
      const result = await passwordResetService.resetPassword(token!, newPassword);

      if (result.success) {
        setMessage(result.message + ' Redirecting you back to the app...');
        setTimeout(() => {
          // Redirect to app using deep link
          window.location.href = cloudKitService.generateAppDeepLink('password-reset-success');
        }, 3000);
      } else {
        setError(result.message);
      }

    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };



  if (tokenValid === null) {
    return (
      <div className="password-reset-container">
        <div className="password-reset-card">
          <div className="loading-spinner">Validating reset link...</div>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="password-reset-container">
        <div className="password-reset-card">
          <h2>Invalid Reset Link</h2>
          <p className="error-message">{error}</p>
          <p>Please request a new password reset from the TuneBoxed app.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="password-reset-container">
      <motion.div 
        className="password-reset-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="password-reset-header">
          <h2>Reset Your Password</h2>
          <p>Enter your new password for TuneBoxed</p>
        </div>

        {message && (
          <motion.div 
            className="success-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {message}
          </motion.div>
        )}

        {error && (
          <motion.div 
            className="error-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}

        {!message && (
          <form onSubmit={handlePasswordReset} className="password-reset-form">
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={8}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={8}
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="reset-button"
              disabled={loading}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="app-redirect">
          <p>Return to the TuneBoxed app to log in with your new password.</p>
        </div>
      </motion.div>

      <style>{`
        .password-reset-container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .password-reset-card {
          background: white;
          border-radius: 12px;
          padding: 40px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .password-reset-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .password-reset-header h2 {
          color: #333;
          margin-bottom: 10px;
          font-size: 24px;
        }

        .password-reset-header p {
          color: #666;
          font-size: 14px;
        }

        .password-reset-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 5px;
          color: #333;
          font-weight: 500;
        }

        .form-group input {
          padding: 12px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.3s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #667eea;
        }

        .form-group input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .reset-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .reset-button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .reset-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .success-message {
          background: #d4edda;
          color: #155724;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
        }

        .app-redirect {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e1e5e9;
        }

        .app-redirect p {
          color: #666;
          font-size: 14px;
        }

        .loading-spinner {
          text-align: center;
          color: #666;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
};

export default PasswordReset; 