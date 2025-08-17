const express = require('express');
const cors = require('cors');
const cloudKitService = require('./cloudkitService');
const { SERVER_CONFIG } = require('./config');

const app = express();

// CORS configuration - allow your website domain and Railway preview URLs
app.use(cors({
  origin: [
    'https://tuneboxed.com', 
    'http://localhost:3000',
    /^https:\/\/.*\.railway\.app$/, // Allow Railway preview URLs
    /^https:\/\/.*\.up\.railway\.app$/ // Allow Railway production URLs
  ],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'TuneBoxed CloudKit Proxy Server Running',
    environment: SERVER_CONFIG.environment,
    timestamp: new Date().toISOString()
  });
});

// Test CloudKit connection endpoint
app.get('/api/cloudkit/test', async (req, res) => {
  try {
    console.log('Testing CloudKit connection...');
    
    const result = await cloudKitService.queryRecords({
      recordType: 'User',
      resultsLimit: 1
    });
    
    res.json({
      success: true,
      message: `CloudKit connection successful! Found ${result.records?.length || 0} user records.`,
      data: result
    });
  } catch (error) {
    console.error('CloudKit test failed:', error);
    res.status(500).json({
      success: false,
      message: `CloudKit connection failed: ${error.message}`,
      error: error.message
    });
  }
});

// Validate reset token endpoint
app.post('/api/cloudkit/validate-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }
    
    console.log('Validating reset token:', token);
    const result = await cloudKitService.validateResetToken(token);
    
    res.json({
      success: true,
      valid: result.valid,
      message: result.message,
      user: result.user || null
    });
  } catch (error) {
    console.error('Token validation failed:', error);
    res.status(500).json({
      success: false,
      message: `Token validation failed: ${error.message}`,
      error: error.message
    });
  }
});

// Reset password endpoint
app.post('/api/cloudkit/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }
    
    console.log('Resetting password for token:', token);
    
    // First validate the token
    const validation = await cloudKitService.validateResetToken(token);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }
    
    // Hash the new password
    const hashedPassword = cloudKitService.hashPassword(newPassword);
    
    // Update the user's password
    await cloudKitService.updateUserPassword(validation.user, hashedPassword);
    
    res.json({
      success: true,
      message: 'Password reset successful!'
    });
  } catch (error) {
    console.error('Password reset failed:', error);
    res.status(500).json({
      success: false,
      message: `Password reset failed: ${error.message}`,
      error: error.message
    });
  }
});

// Start server
const port = process.env.PORT || SERVER_CONFIG.port;
app.listen(port, () => {
  console.log(`🚀 TuneBoxed CloudKit Proxy Server running on port ${port}`);
  console.log(`🌍 Environment: ${SERVER_CONFIG.environment}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${port}/api/cloudkit/test`);
  console.log(`📡 Railway URL: ${process.env.RAILWAY_STATIC_URL || 'Not deployed yet'}`);
});

module.exports = app; 