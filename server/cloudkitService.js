const { CLOUDKIT_CONFIG } = require('./config');
const jsrsasign = require('jsrsasign');
const CryptoJS = require('crypto-js');

class CloudKitService {
  constructor() {
    this.baseUrl = `${CLOUDKIT_CONFIG.apiEndpoint}/${CLOUDKIT_CONFIG.containerIdentifier}/${CLOUDKIT_CONFIG.environment}/${CLOUDKIT_CONFIG.databaseType}`;
  }

  generateJWT() {
    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: 'ES256',
      kid: CLOUDKIT_CONFIG.serverToServerKeyAuth,
      typ: 'JWT'
    };
    
    const payload = {
      iss: CLOUDKIT_CONFIG.serverToServerKeyAuth,
      iat: now,
      exp: now + 3600, // 1 hour expiry
      sub: CLOUDKIT_CONFIG.containerIdentifier
    };

    try {
      const jwt = jsrsasign.KJUR.jws.JWS.sign(
        'ES256',
        JSON.stringify(header),
        JSON.stringify(payload),
        CLOUDKIT_CONFIG.privateKey
      );
      
      return jwt;
    } catch (error) {
      console.error('JWT generation failed:', error);
      throw new Error('Failed to generate JWT token');
    }
  }

  getHeaders() {
    const jwt = this.generateJWT();
    return {
      'Authorization': `CloudKit-Server-to-Server-Key ${jwt}`,
      'Content-Type': 'application/json'
    };
  }

  async queryRecords(query) {
    try {
      const response = await fetch(`${this.baseUrl}/records/query`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ query })
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
      const response = await fetch(`${this.baseUrl}/records/modify`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
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
        })
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
    const salt = 'TuneBoxedSalt2024';
    const iterations = 10000;
    
    const hash = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: iterations,
      hasher: CryptoJS.algo.SHA256
    });
    
    return hash.toString(CryptoJS.enc.Hex);
  }
}

module.exports = new CloudKitService(); 