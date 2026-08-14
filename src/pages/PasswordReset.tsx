import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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
        showMessage('success', '✅ Password reset successful! Redirecting to app...');
        
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
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        maxWidth: '450px',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3em', marginBottom: '10px' }}>🎵</div>
        <h1 style={{ color: '#333', marginBottom: '10px', fontSize: '1.8em', fontWeight: 600 }}>
          Reset Your Password
        </h1>
        <p style={{ color: '#666', marginBottom: '30px', fontSize: '1em' }}>
          Enter your new password for TuneBoxed
        </p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#333', 
              fontWeight: 500, 
              fontSize: '0.95em' 
            }}>
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Enter your new password"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                background: isLoading ? '#f8f9fa' : 'white',
                transition: 'all 0.3s ease'
              }}
            />
            <div style={{ fontSize: '0.85em', color: '#666', marginTop: '5px' }}>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                <li>At least 8 characters long</li>
                <li>Mix of letters and numbers recommended</li>
                <li>Avoid common passwords</li>
              </ul>
            </div>
          </div>
          
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#333', 
              fontWeight: 500, 
              fontSize: '0.95em' 
            }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your new password"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                background: isLoading ? '#f8f9fa' : 'white',
                transition: 'all 0.3s ease'
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '16px',
              background: isLoading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              marginTop: '10px'
            }}
          >
            {isLoading ? '🔄 Resetting...' : 'Reset Password'}
          </button>
        </form>
        
        {/* Message Display */}
        {message && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            borderRadius: '10px',
            fontWeight: 500,
            background: messageType === 'error' ? '#fee' : 
                       messageType === 'success' ? '#f0fff4' : '#fffaf0',
            color: messageType === 'error' ? '#c53030' : 
                   messageType === 'success' ? '#38a169' : '#d69e2e',
            border: `1px solid ${messageType === 'error' ? '#feb2b2' : 
                                 messageType === 'success' ? '#9ae6b4' : '#fbd38d'}`
          }}>
            {message}
          </div>
        )}
        
        <div style={{ marginTop: '30px', fontSize: '0.9em', color: '#666' }}>
          <p>Having trouble? <a href="mailto:support@tuneboxed.com" style={{ color: '#667eea', textDecoration: 'none' }}>Contact Support</a></p>
          <p style={{ marginTop: '10px', fontSize: '0.8em' }}>
            This link expires in 1 hour for security.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset; 