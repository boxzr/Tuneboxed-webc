const { CLOUDKIT_CONFIG } = require('./config');
const crypto = require('crypto');

class CloudKitService {
  constructor() {
    this.baseUrl = `${CLOUDKIT_CONFIG.apiEndpoint}/${CLOUDKIT_CONFIG.containerIdentifier}/${CLOUDKIT_CONFIG.environment}/${CLOUDKIT_CONFIG.databaseType}`;
  }

  // Normalize ISO date to avoid millisecond edge-cases
  isoNow() {
    return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  // Create SHA-256 base64 hash (as required by Apple's CloudKit Web Services)
  sha256base64(str) {
    return crypto.createHash('sha256').update(str).digest('base64');
  }

  // Load private key with explicit format handling for OpenSSL 3
  loadPrivateKeyPem() {
    try {
      // Handle base64 encoded PEM or plain PEM with escaped newlines
      let pem;
      if (CLOUDKIT_CONFIG.privateKey.includes('-----BEGIN')) {
        // Plain PEM - replace escaped newlines
        pem = CLOUDKIT_CONFIG.privateKey.replace(/\\n/g, '\n');
      } else {
        // Base64 content only - wrap in PEM format
        console.log('🔐 Converting base64 content to PEM format');
        pem = `-----BEGIN EC PRIVATE KEY-----\n${CLOUDKIT_CONFIG.privateKey}\n-----END EC PRIVATE KEY-----`;
      }
      
      console.log('🔐 Loading private key in SEC1 format');
      
      // Try SEC1 first (traditional EC format)
      try {
        return crypto.createPrivateKey({ key: pem, format: 'pem', type: 'sec1' });
      } catch (sec1Error) {
        console.log('🔐 SEC1 failed, trying PKCS#8 format');
        // Fallback to PKCS#8
        return crypto.createPrivateKey({ key: pem, format: 'pem', type: 'pkcs8' });
      }
    } catch (error) {
      console.error('🔐 Private key loading error:', error);
      throw new Error(`Failed to load private key: ${error.message}`);
    }
  }

  // Sign string with EC private key using explicit KeyObject
  signString(str) {
    try {
      const keyObj = this.loadPrivateKeyPem();
      
      const signer = crypto.createSign('sha256');
      signer.update(str);
      signer.end();
      
      const signature = signer.sign(keyObj).toString('base64');
      console.log('🔐 Signing successful, signature length:', signature.length);
      
      return signature;
    } catch (error) {
      console.error('🔐 Signing error:', error);
      throw error;
    }
  }

  generateCloudKitHeaders(method, path, bodyString) {
    const date = this.isoNow();
    const bodyHash = this.sha256base64(bodyString || '');
    
    // Create the string to sign: [Current date]:[Request body]:[Web service URL subpath]
    // Apple's official format from CloudKit Web Services documentation
    const stringToSign = `${date}:${bodyHash}:${path}`;
    
    console.log('🔐 Path:', path);
    console.log('🔐 ISO8601:', date);
          console.log('🔐 Body SHA256 BASE64:', bodyHash);
    console.log('🔐 String to sign:', stringToSign);
    
    const signature = this.signString(stringToSign);
    
    console.log('🔐 Generated signature:', signature.substring(0, 50) + '...');
    console.log('🔑 Key ID:', CLOUDKIT_CONFIG.serverToServerKeyAuth);
    console.log('🌍 Environment:', CLOUDKIT_CONFIG.environment);
    console.log('📦 Container:', CLOUDKIT_CONFIG.containerIdentifier);
    
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Apple-CloudKit-Request-KeyID': CLOUDKIT_CONFIG.serverToServerKeyAuth,
      'X-Apple-CloudKit-Request-ISO8601Date': date,
      'X-Apple-CloudKit-Request-SignatureV1': signature
    };
  }

  async queryRecords(query) {
    try {
      const path = `/database/1/${CLOUDKIT_CONFIG.containerIdentifier}/${CLOUDKIT_CONFIG.environment}/${CLOUDKIT_CONFIG.databaseType}/records/query`;
      const body = { query };
      const bodyString = JSON.stringify(body);
      const headers = this.generateCloudKitHeaders('POST', path, bodyString);
      const url = `https://api.apple-cloudkit.com${path}`;
      
      console.log('🌐 Making CloudKit request to:', url);
      console.log('📦 Body being sent:', bodyString);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: bodyString
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`CloudKit API error: ${response.status} - ${errorData.reason || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CloudKit query error:', error);
      throw error;
    }
  }

  async findUserByResetToken(token) {
    try {
      const query = {
        recordType: 'User',
        filterBy: [{
          fieldName: 'resetToken',
          fieldValue: { value: token },
          comparator: 'EQUALS'
        }]
      };

      const result = await this.queryRecords(query);
      return result.records && result.records.length > 0 ? result.records[0] : null;
    } catch (error) {
      console.error('Error finding user by reset token:', error);
      throw error;
    }
  }

  async validateResetToken(token) {
    try {
      const user = await this.findUserByResetToken(token);
      if (!user) {
        return { valid: false, message: 'Invalid reset token' };
      }

      // Check if token is expired
      const tokenExpiry = user.fields.resetTokenExpiry?.value;
      if (tokenExpiry && new Date(tokenExpiry) < new Date()) {
        return { valid: false, message: 'Reset token has expired' };
      }

      return { valid: true, user };
    } catch (error) {
      console.error('Error validating reset token:', error);
      return { valid: false, message: 'Error validating token' };
    }
  }

  async updateUserPassword(userRecord, hashedPassword) {
    try {
      const path = `/database/1/${CLOUDKIT_CONFIG.containerIdentifier}/${CLOUDKIT_CONFIG.environment}/${CLOUDKIT_CONFIG.databaseType}/records/modify`;
      const body = {
        operations: [{
          operationType: 'update',
          record: {
            recordName: userRecord.recordName,
            recordType: userRecord.recordType,
            fields: {
              ...userRecord.fields,
              password: { value: hashedPassword },
              resetToken: { value: null },
              resetTokenExpiry: { value: null }
            }
          }
        }]
      };
      
      const headers = this.generateCloudKitHeaders('POST', path, body);
      const url = `https://api.apple-cloudkit.com${path}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update password: ${response.status} - ${errorData.reason || response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error updating user password:', error);
      throw error;
    }
  }

  hashPassword(password) {
    // Generate unique random salt per user
    const salt = crypto.randomBytes(16);
    // Use scrypt for better security (defaults: N=16384, r=8, p=1)
    const hash = crypto.scryptSync(password, salt, 64);
    // Return salt:hash format for storage
    return `${salt.toString('base64')}:${hash.toString('base64')}`;
  }

  verifyPassword(password, storedHash) {
    try {
      const [saltB64, hashB64] = storedHash.split(':');
      const salt = Buffer.from(saltB64, 'base64');
      const hash = crypto.scryptSync(password, salt, 64);
      return crypto.timingSafeEqual(hash, Buffer.from(hashB64, 'base64'));
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  // New method: Hash password using scrypt (recommended)
  hashPasswordScrypt(password) {
    const salt = crypto.randomBytes(16);
    const key = crypto.scryptSync(password, salt, 64);
    return { 
      hashB64: key.toString('base64'), 
      saltB64: salt.toString('base64') 
    };
  }

  // New method: Find user by email
  async findUserByEmail(email) {
    try {
      const query = {
        recordType: 'User',
        filterBy: [{
          fieldName: 'emailString',
          comparator: 'EQUALS',
          fieldValue: { value: email }
        }],
        resultsLimit: 1
      };

      const result = await this.queryRecords(query);
      return result.records?.[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  // New method: Find user by reset token hash
  async findUserByResetTokenHash(tokenHash) {
    try {
      const query = {
        recordType: 'User',
        filterBy: [{
          fieldName: 'resetTokenString',
          comparator: 'EQUALS',
          fieldValue: { value: tokenHash }
        }],
        resultsLimit: 1
      };

      const result = await this.queryRecords(query);
      return result.records?.[0] || null;
    } catch (error) {
      console.error('Error finding user by reset token hash:', error);
      return null;
    }
  }

  // New method: Update user with reset token
  async updateUserResetToken(userRecord, tokenHash, expiresAt) {
    try {
      const path = `/database/1/${CLOUDKIT_CONFIG.containerIdentifier}/${CLOUDKIT_CONFIG.environment}/${CLOUDKIT_CONFIG.databaseType}/records/modify`;
      const body = {
        operations: [{
          operationType: 'update',
          record: {
            recordName: userRecord.recordName,
            recordType: userRecord.recordType,
            recordChangeTag: userRecord.recordChangeTag,
            fields: {
              ...userRecord.fields,
              resetTokenString: { value: tokenHash },
              resetTokenExpiryDate: { value: expiresAt }
            }
          }
        }]
      };
      
      const headers = this.generateCloudKitHeaders('POST', path, body);
      const url = `https://api.apple-cloudkit.com${path}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update reset token: ${response.status} - ${errorData.reason || response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error updating user reset token:', error);
      throw error;
    }
  }

  // New method: Update user password and clear reset fields
  async updateUserPasswordAndClearReset(userRecord, hashB64, saltB64) {
    try {
      const path = `/database/1/${CLOUDKIT_CONFIG.containerIdentifier}/${CLOUDKIT_CONFIG.environment}/${CLOUDKIT_CONFIG.databaseType}/records/modify`;
      const body = {
        operations: [{
          operationType: 'update',
          record: {
            recordName: userRecord.recordName,
            recordType: userRecord.recordType,
            recordChangeTag: userRecord.recordChangeTag,
            fields: {
              ...userRecord.fields,
              passwordHashString: { value: hashB64 },
              saltString: { value: saltB64 },
              passwordAlgorithmString: { value: 'scrypt' },
              passwordKeyLengthInt64: { value: 64 },
              passwordIterationsInt64: { value: 0 },
              resetTokenString: { value: null },
              resetTokenExpiryDate: { value: null }
            }
          }
        }]
      };
      
      const headers = this.generateCloudKitHeaders('POST', path, body);
      const url = `https://api.apple-cloudkit.com${path}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update password: ${response.status} - ${errorData.reason || response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error updating user password and clearing reset:', error);
      throw error;
    }
  }

  // Method: Update user password using existing CloudKit field structure
  async updateUserPasswordWithExistingFields(userRecord, hashB64, saltB64) {
    try {
      const path = `/database/1/${CLOUDKIT_CONFIG.containerIdentifier}/${CLOUDKIT_CONFIG.environment}/${CLOUDKIT_CONFIG.databaseType}/records/modify`;
      
      // Use the existing field structure from CloudKit
      const body = {
        operations: [{
          operationType: 'update',
          record: {
            recordName: userRecord.recordName,
            recordType: userRecord.recordType,
            recordChangeTag: userRecord.recordChangeTag,
            fields: {
              ...userRecord.fields,
              // Update password using existing field structure
              password: { value: `${saltB64}:${hashB64}` }, // salt:hash format to match existing
              salt: { value: saltB64 },
              // Clear reset token fields if they exist
              resetToken: { value: null },
              resetTokenExpiry: { value: null }
            }
          }
        }]
      };
      
      const bodyString = JSON.stringify(body);
      const headers = this.generateCloudKitHeaders('POST', path, bodyString);
      const url = `https://api.apple-cloudkit.com${path}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: bodyString
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update password: ${response.status} - ${errorData.reason || response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error updating user password with existing fields:', error);
      throw error;
    }
  }
}

module.exports = new CloudKitService(); 