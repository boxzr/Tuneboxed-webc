// TuneBoxed Password Reset API Endpoint
// Add this to your existing website backend server

const crypto = require('crypto');

// CloudKit Configuration - UPDATE THESE VALUES
const CLOUDKIT_CONFIG = {
  containerIdentifier: 'iCloud.AuraBrand.TuneBoxed',
  environment: 'development', // Change to 'production' when ready
  serverToServerKeyAuth: 'REPLACE_WITH_YOUR_KEY_ID', // Get from CloudKit dashboard
  privateKey: `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIJBYILxe5I+owLrIktPuzy59saOGMq4w+kaKrNJzgLrhoAoGCCqGSM49
AwEHoUQDQgAEEZhnE/DpSol682PsGMQNmx5RPLrTnRMkL9ekrddQF/FiYJD00mut
7SuRpNl86toObo7BIm3ThhpzT0ghqltDQg==
-----END EC PRIVATE KEY-----`,
  apiEndpoint: 'https://api.apple-cloudkit.com/database/1'
};

// Password hashing function (matches your iOS app)
function hashPasswordPBKDF2(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 310000, 16, 'sha256').toString('hex');
}

// CloudKit API helper function
async function callCloudKitAPI(endpoint, method = 'POST', body = null) {
  const url = `${CLOUDKIT_CONFIG.apiEndpoint}/${CLOUDKIT_CONFIG.containerIdentifier}/${CLOUDKIT_CONFIG.environment}/public/${endpoint}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `CloudKit-Server-to-Server-Key ${CLOUDKIT_CONFIG.serverToServerKeyAuth}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : null
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`CloudKit API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

// MAIN API ENDPOINT FUNCTION
// Add this route to your existing Express app or server
async function handlePasswordReset(req, res) {
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
    const queryResult = await callCloudKitAPI('records/query', 'POST', {
      query: {
        recordType: 'User',
        filterBy: [{
          fieldName: 'resetToken',
          fieldValue: { value: token }
        }]
      }
    });

    if (!queryResult.records || queryResult.records.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid or expired reset token. Please request a new password reset.' 
      });
    }

    const userRecord = queryResult.records[0];
    const username = userRecord.fields.username?.value || 'Unknown';
    console.log('✅ Found user:', username);

    // Step 2: Check if token is expired
    const tokenExpiry = new Date(userRecord.fields.resetTokenExpiry?.value);
    const now = new Date();
    
    if (now > tokenExpiry) {
      console.log('❌ Token expired:', tokenExpiry, 'vs now:', now);
      return res.status(400).json({ 
        error: 'Reset token has expired. Please request a new password reset.' 
      });
    }

    console.log('✅ Token is valid, expires:', tokenExpiry);

    // Step 3: Hash the new password (same algorithm as iOS app)
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = hashPasswordPBKDF2(newPassword, salt);

    console.log('🔐 Password hashed successfully');

    // Step 4: Update user record in CloudKit
    const updateResult = await callCloudKitAPI('records/modify', 'POST', {
      operations: [{
        operationType: 'update',
        record: {
          recordName: userRecord.recordName,
          recordType: 'User',
          fields: {
            ...userRecord.fields,
            password: { value: hashedPassword },
            salt: { value: salt },
            resetToken: null, // Clear the reset token
            resetTokenExpiry: null // Clear the expiry
          }
        }
      }]
    });

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
}

// INTEGRATION EXAMPLES:

// For Express.js:
/*
const express = require('express');
const app = express();
app.use(express.json());
app.post('/api/reset-password', handlePasswordReset);
*/

// For Next.js API route:
/*
// pages/api/reset-password.js
export default function handler(req, res) {
  if (req.method === 'POST') {
    return handlePasswordReset(req, res);
  }
  res.status(405).json({ error: 'Method not allowed' });
}
*/

// For other frameworks, adapt accordingly
module.exports = { handlePasswordReset, CLOUDKIT_CONFIG };
