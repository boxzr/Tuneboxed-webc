import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import logo from '../assets/tuneboxed-battle-logo.png';
import './passwordReset.css';

const PasswordReset: React.FC = () => {
  const location = useLocation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning' | ''>('');
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    // Get reset token from URL parameters
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    
    if (token) {
      setResetToken(token);
    } else {
      showMessage('error', 'Invalid reset link. Please request a new password reset from the TuneBoxed app.');
    }
  }, [location]);

  const showMessage = (type: 'success' | 'error' | 'warning', msg: string) => {
    setMessageType(type);
    setMessage(msg);
  };

  const clearMessages = () => {
    setMessage('');
    setMessageType('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous messages
    clearMessages();
    
    // Validation
    if (!resetToken) {
      showMessage('error', 'Invalid reset link. Please request a new password reset.');
      return;
    }
    
    if (!newPassword || !confirmPassword) {
      showMessage('error', 'Please fill in all fields.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showMessage('error', 'Passwords do not match.');
      return;
    }
    
    if (newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters long.');
      return;
    }
    
    // Basic password strength check
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      showMessage('warning', 'For better security, use a mix of uppercase, lowercase, and numbers.');
    }
    
    try {
      setIsLoading(true);
      
      // Call Railway backend API
      const response = await fetch('https://tuneboxed-production.up.railway.app/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: resetToken,
          newPassword: newPassword
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        showMessage('success', 'Password reset. Taking you back to the app…');
        
        // Redirect back to iOS app after 3 seconds
        setTimeout(() => {
          window.location.href = result.redirectUrl || 'tuneboxed://password-reset-success';
        }, 3000);
        
      } else {
        showMessage('error', result.error || 'Password reset failed. Please try again.');
      }
      
    } catch (error) {
      showMessage('error', 'Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pw">
      <div className="pw__card">
        <img className="pw__logo" src={logo} alt="TuneBoxed" />
        <h1 className="pw__title">Reset your password</h1>
        <p className="pw__sub">Pick a new password for your TuneBoxed account.</p>

        <form onSubmit={handleSubmit} className="pw__form">
          <label className="pw__field">
            <span>New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              disabled={isLoading}
            />
          </label>
          <p className="pw__hint">Mix letters and numbers, and skip passwords you use elsewhere.</p>

          <label className="pw__field">
            <span>Confirm new password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Type it again"
              disabled={isLoading}
            />
          </label>

          <button type="submit" className="pw__btn" disabled={isLoading}>
            {isLoading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>

        {message && (
          <div className={`pw__msg pw__msg--${messageType || 'warning'}`} role="status">
            {message}
          </div>
        )}

        <div className="pw__foot">
          <p>
            Having trouble? <a href="mailto:support@tuneboxed.com">Contact support</a>
          </p>
          <p>This link expires in 1 hour.</p>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset; 