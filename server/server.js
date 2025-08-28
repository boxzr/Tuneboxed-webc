const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const cloudKitService = require('./cloudkitService');
const { SERVER_CONFIG, CLOUDKIT_CONFIG } = require('./config');

const app = express();

// CORS configuration - allow multiple domains for password reset
app.use(cors({
  origin: [
    "https://tuneboxed.com",
    "https://boxzr.github.io",
    "http://localhost:3000",
    "http://localhost:3001"
  ],
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

// 🎯 UNIFIED CREDENTIALS ENDPOINT - All API credentials for iOS app
app.get('/api/config/all-credentials', async (req, res) => {
  try {
    // Check authorization header
    const authHeader = req.headers.authorization;
    const expectedBearer = 'Bearer tuneboxed-ios-app';
    
    if (!authHeader || authHeader !== expectedBearer) {
      return res.status(401).json({ 
        error: 'Unauthorized - Invalid bearer token' 
      });
    }

    console.log('📱 iOS app requesting all API credentials');

    // Return all API credentials from environment variables
    const credentials = {
      spotify_client_id: process.env.SPOTIFY_CLIENT_ID || '',
      spotify_client_secret: process.env.SPOTIFY_CLIENT_SECRET || '',
      supabase_api_key: process.env.SUPABASE_API_KEY || '',
      supabase_jwt_secret: process.env.SUPABASE_JWT_SECRET || '',
      supabase_service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      resend_api_key: process.env.RESEND_API_KEY || '',
      email_from: process.env.EMAIL_FROM || 'onboarding@resend.dev'
    };

    // Log which credentials are available (without exposing values)
    const availableCredentials = Object.entries(credentials)
      .filter(([key, value]) => value && value.length > 0)
      .map(([key]) => key);
    
    console.log('✅ Available credentials:', availableCredentials);
    console.log('❌ Missing credentials:', Object.keys(credentials).filter(key => !credentials[key]));

    res.json(credentials);

  } catch (error) {
    console.error('❌ Credentials endpoint error:', error.message);
    res.status(500).json({ 
      error: 'Failed to retrieve credentials',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🎯 EMAIL SENDING ENDPOINT - Send password reset emails
app.post('/api/send-reset-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        error: 'Valid email address is required' 
      });
    }

    console.log('📧 Processing reset email request for:', email);

    // Step 1: Find user by email in CloudKit
    const queryResult = await cloudKitService.queryRecords({
      recordType: 'User',
      filterBy: [{
        fieldName: 'email',
        comparator: 'EQUALS',
        fieldValue: { value: email }
      }],
      resultsLimit: 1
    });

    if (!queryResult.records || queryResult.records.length === 0) {
      // Don't reveal if email exists for security - always return success
      console.log('⚠️ Email not found, but returning success for security');
      return res.json({ 
        success: true, 
        message: 'If an account with that email exists, a reset link has been sent.' 
      });
    }

    const userRecord = queryResult.records[0];
    const username = userRecord.fields.username?.value || 'User';
    console.log('✅ Found user for reset:', username);

    // Step 2: Generate reset token and expiry
    const resetToken = crypto.randomUUID();
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour from now (timestamp)
    console.log('🔑 Generated reset token:', resetToken.substring(0, 8) + '...');

    // Step 3: Update user with reset token in CloudKit
    await cloudKitService.updateUserResetToken(userRecord, resetToken, expiresAt);
    console.log('✅ Reset token stored in CloudKit');

    // Step 4: Send email via Resend
    const resetLink = `https://tuneboxed.com/reset-password?token=${resetToken}`;
    
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TuneBoxed <onboarding@resend.dev>',
        to: [email],
        subject: 'Reset your TuneBoxed password',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #667eea; font-size: 28px; margin: 0;">🎵 TuneBoxed</h1>
            </div>
            
            <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Reset Your Password</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
              Hi ${username},<br><br>
              We received a request to reset your TuneBoxed password. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetLink}" style="color: #667eea; word-break: break-all;">${resetLink}</a>
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="color: #999; font-size: 12px; line-height: 1.4;">
                This link will expire in 1 hour for security reasons.<br>
                If you didn't request this password reset, you can safely ignore this email.<br>
                Your password will remain unchanged.
              </p>
            </div>
          </div>
        `
      })
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('❌ Resend API error:', errorData);
      throw new Error('Failed to send email via Resend');
    }

    const emailData = await emailResponse.json();
    console.log('✅ Email sent successfully via Resend:', emailData.id);

    // Step 5: Return success
    res.json({ 
      success: true, 
      message: 'Password reset email sent successfully!' 
    });

    console.log('🎉 Reset email process completed for:', email);

  } catch (error) {
    console.error('❌ Send reset email error:', error.message);
    
    res.status(500).json({ 
      error: 'Failed to send reset email. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🎯 PASSWORD RESET ENDPOINT - Complete password reset with token
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
    // First try to find by the resetToken field (if it exists)
    let queryResult = await cloudKitService.queryRecords({
      recordType: 'User',
      filterBy: [{
        fieldName: 'resetToken',
        comparator: 'EQUALS', 
        fieldValue: { value: token }
      }],
      resultsLimit: 1
    }).catch(async (error) => {
      // If resetToken field doesn't exist, fall back to email lookup for testing
      console.log('⚠️ resetToken field not found, checking if this is a direct email test...');
      if (token.includes('@')) {
        console.log('🔍 Token looks like email, searching by email instead...');
        return await cloudKitService.queryRecords({
          recordType: 'User',
          filterBy: [{
            fieldName: 'email',
            comparator: 'EQUALS',
            fieldValue: { value: token }
          }],
          resultsLimit: 1
        });
      }
      throw error;
    });

    if (!queryResult.records || queryResult.records.length === 0) {
      console.log('❌ No user found with reset token:', token);
      console.log('📊 Query result:', JSON.stringify(queryResult, null, 2));
      return res.status(400).json({ 
        error: 'Invalid or expired reset token. Please request a new password reset.' 
      });
    }

    const userRecord = queryResult.records[0];
    const username = userRecord.fields.username?.value || userRecord.fields.email?.value || 'Unknown';
    console.log('✅ Found user:', username);

    // Step 2: Check if token is expired (if expiry field exists)
    const tokenExpiry = userRecord.fields.resetTokenExpiry?.value || userRecord.fields.resetTokenExpiryDate?.value;
    if (tokenExpiry) {
      const expiryDate = new Date(tokenExpiry);
      const now = new Date();
      
      if (now > expiryDate) {
        console.log('❌ Token expired:', expiryDate, 'vs now:', now);
        return res.status(400).json({ 
          error: 'Reset token has expired. Please request a new password reset.' 
        });
      }
      console.log('✅ Token is valid, expires:', expiryDate);
    } else {
      console.log('ℹ️ No token expiry field found, proceeding without expiry check');
    }

    // Step 3: Hash the new password using PBKDF2 (matches iOS exactly)
    const { hashB64, saltB64, algorithm, iterations, keyLength } = cloudKitService.hashPasswordScrypt(newPassword);
    console.log('🔐 Password hashed successfully with PBKDF2');

    // Step 4: Update user password in CloudKit with ALL iOS-expected fields
    const updateSuccess = await cloudKitService.updateUserPasswordWithExistingFields(
      userRecord, 
      hashB64, 
      saltB64,
      algorithm,
      iterations,
      keyLength
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
  console.log(`🚀 TuneBoxed API Server running on port ${port}`);
  console.log(`🌍 Environment: ${SERVER_CONFIG.environment}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${port}/api/cloudkit/test`);
  console.log(`🔑 All credentials: http://localhost:${port}/api/config/all-credentials`);
  console.log(`📧 Send reset email: http://localhost:${port}/api/send-reset-email`);
  console.log(`🔑 Password reset: http://localhost:${port}/api/reset-password`);
  console.log(`📡 Railway URL: ${process.env.RAILWAY_STATIC_URL || 'Not deployed yet'}`);
});

module.exports = app; 