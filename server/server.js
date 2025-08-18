const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const cloudKitService = require('./cloudkitService');
const { SERVER_CONFIG, CLOUDKIT_CONFIG } = require('./config');

const app = express();

// CORS configuration - allow only your website domain for security
app.use(cors({
  origin: "https://tuneboxed.com",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: false
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-cloudkit-auth');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

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

// 🎯 NEW SIMPLIFIED PASSWORD RESET ENDPOINT (from integration files)
// This replaces all the complex authentication endpoints with one clean endpoint
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validation
    if (!token || !newPassword) {
      return res.status(400).json({ 
        error: 'Missing required fields: token and newPassword' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }

    console.log('🔍 Processing password reset for token:', token.substring(0, 8) + '...');

    // Step 1: Find user by reset token in CloudKit
    const queryResult = await cloudKitService.queryRecords({
      recordType: 'User',
      filterBy: [{
        fieldName: 'resetTokenString',
        comparator: 'EQUALS',
        fieldValue: { value: token }
      }],
      resultsLimit: 1
    });

    if (!queryResult.records || queryResult.records.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid or expired reset token. Please request a new password reset.' 
      });
    }

    const userRecord = queryResult.records[0];
    const username = userRecord.fields.usernameString?.value || userRecord.fields.emailString?.value || 'Unknown';
    console.log('✅ Found user:', username);

    // Step 2: Check if token is expired
    const tokenExpiry = new Date(userRecord.fields.resetTokenExpiryDate?.value || userRecord.fields.resetTokenExpiryTime?.value);
    const now = new Date();
    
    if (now > tokenExpiry) {
      console.log('❌ Token expired:', tokenExpiry, 'vs now:', now);
      return res.status(400).json({ 
        error: 'Reset token has expired. Please request a new password reset.' 
      });
    }

    console.log('✅ Token is valid, expires:', tokenExpiry);

    // Step 3: Hash the new password using scrypt (matches your current system)
    const { hashB64, saltB64 } = cloudKitService.hashPasswordScrypt(newPassword);
    console.log('🔐 Password hashed successfully');

    // Step 4: Update user record in CloudKit (clear reset token)
    const updateSuccess = await cloudKitService.updateUserPasswordAndClearReset(
      userRecord, 
      hashB64, 
      saltB64
    );

    if (!updateSuccess) {
      throw new Error('Failed to update password in CloudKit');
    }

    console.log('✅ Password updated in CloudKit for user:', username);

    // Step 5: Return success response
    res.json({ 
      success: true, 
      message: 'Password reset successfully! You can now log in with your new password.',
      redirectUrl: 'tuneboxed://password-reset-success'
    });

    console.log('🎉 Password reset completed successfully for:', username);

  } catch (error) {
    console.error('❌ Password reset error:', error.message);
    
    // Don't expose internal errors to user
    res.status(500).json({ 
      error: 'Password reset failed. Please try again or request a new reset link.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🎯 The new simplified /api/reset-password endpoint above replaces all previous complex endpoints

// Start server
const port = process.env.PORT || SERVER_CONFIG.port;
app.listen(port, () => {
  console.log(`🚀 TuneBoxed Password Reset Server running on port ${port}`);
  console.log(`🌍 Environment: ${SERVER_CONFIG.environment}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${port}/api/cloudkit/test`);
  console.log(`🔑 Password reset: http://localhost:${port}/api/reset-password`);
  console.log(`📡 Railway URL: ${process.env.RAILWAY_STATIC_URL || 'Not deployed yet'}`);
});

module.exports = app; 