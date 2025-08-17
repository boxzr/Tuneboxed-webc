import { CLOUDKIT_CONFIG, CLOUDKIT_FIELDS } from '../config/cloudkit';
import * as jsrsasign from 'jsrsasign';
import CryptoJS from 'crypto-js';

export interface CloudKitRecord {
  recordName: string;
  recordType: string;
  fields: Record<string, any>;
  recordChangeTag?: string;
  created?: { timestamp: number; userRecordName: string };
  modified?: { timestamp: number; userRecordName: string };
}

export interface CloudKitQueryResponse {
  records: CloudKitRecord[];
  continuationMarker?: string;
}

class CloudKitService {
  private serverBaseUrl = 'https://tuneboxed-production.up.railway.app'; // Railway server proxy

  private generateJWT(): string {
    try {
      const header = { alg: 'ES256', kid: CLOUDKIT_CONFIG.serverToServerKeyAuth };
      const payload = {
        iss: CLOUDKIT_CONFIG.serverToServerKeyAuth,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        aud: 'https://api.apple-cloudkit.com'
      };

      const jwt = jsrsasign.KJUR.jws.JWS.sign(
        'ES256',
        JSON.stringify(header),
        JSON.stringify(payload),
        CLOUDKIT_CONFIG.privateKey
      );

      if (!jwt) {
        throw new Error('Failed to generate JWT token');
      }

      return jwt;
    } catch (error) {
      console.error('JWT generation failed:', error);
      throw new Error('Failed to generate JWT token');
    }
  }

  public getHeaders(): HeadersInit {
    const jwt = this.generateJWT();
    return {
      'Content-Type': 'application/json',
      'CloudKit-Server-to-Server-Key': jwt
    };
  }

  // Try direct CloudKit API call with different approach
  async validateResetTokenDirect(token: string): Promise<{ valid: boolean; message: string; user?: CloudKitRecord }> {
    try {
      console.log('Attempting direct CloudKit API call...');
      
      // Try approach 1: Custom header that might not trigger preflight
      const headers1 = {
        'Content-Type': 'application/json',
        'X-CloudKit-Auth': this.generateJWT()
      };

      // Try approach 2: Send JWT in request body
      const headers2 = {
        'Content-Type': 'application/json'
      };

      const body = {
        query: {
          recordType: 'User',
          filterBy: [
            {
              fieldName: CLOUDKIT_FIELDS.RESET_TOKEN,
              fieldValue: { value: token },
              comparator: 'EQUALS'
            }
          ]
        },
        // Include JWT in body as alternative
        auth: {
          jwt: this.generateJWT()
        }
      };

      const url = `${CLOUDKIT_CONFIG.apiEndpoint}/${CLOUDKIT_CONFIG.containerIdentifier}/${CLOUDKIT_CONFIG.environment}/${CLOUDKIT_CONFIG.databaseType}/records/query`;

      console.log('Trying direct CloudKit call to:', url);
      console.log('Headers:', headers1);
      console.log('Body:', body);

      // Try with custom header first
      let response = await fetch(url, {
        method: 'POST',
        headers: headers1,
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Direct CloudKit call successful!', data);
        
        if (data.records && data.records.length > 0) {
          const user = data.records[0];
          const tokenExpiry = user.fields[CLOUDKIT_FIELDS.TOKEN_EXPIRY]?.value;
          
          if (this.isTokenExpired(tokenExpiry)) {
            return { valid: false, message: 'Reset token has expired' };
          }
          
          return { valid: true, message: 'Token is valid', user };
        } else {
          return { valid: false, message: 'Invalid reset token' };
        }
      }

      // If first approach failed, try with JWT in body
      console.log('First approach failed, trying JWT in body...');
      response = await fetch(url, {
        method: 'POST',
        headers: headers2,
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Direct CloudKit call with JWT in body successful!', data);
        
        if (data.records && data.records.length > 0) {
          const user = data.records[0];
          const tokenExpiry = user.fields[CLOUDKIT_FIELDS.TOKEN_EXPIRY]?.value;
          
          if (this.isTokenExpired(tokenExpiry)) {
            return { valid: false, message: 'Reset token has expired' };
          }
          
          return { valid: true, message: 'Token is valid', user };
        } else {
          return { valid: false, message: 'Invalid reset token' };
        }
      }

      // If both approaches failed, fall back to proxy
      console.log('Direct approaches failed, falling back to proxy...');
      return this.validateResetToken(token);

    } catch (error) {
      console.error('Direct CloudKit call failed:', error);
      console.log('Falling back to proxy approach...');
      return this.validateResetToken(token);
    }
  }

  /**
   * Validates a password reset token using the local server proxy
   */
  async validateResetToken(token: string): Promise<{ valid: boolean; message: string; user?: CloudKitRecord }> {
    try {
      const response = await fetch(`${this.serverBaseUrl}/api/cloudkit/validate-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      if (!response.ok) { throw new Error(`Server error: ${response.status}`); }
      const result = await response.json();
      return { valid: result.valid, message: result.message, user: result.user };
    } catch (error) { console.error('Error validating reset token:', error); return { valid: false, message: 'Error validating token' }; }
  }

  /**
   * Finds a user record by reset token using the local server proxy
   */
  async findUserByResetToken(token: string): Promise<CloudKitRecord | null> {
    try {
      const validation = await this.validateResetToken(token);
      return validation.user || null;
    } catch (error) { console.error('Error finding user by reset token:', error); return null; }
  }

  /**
   * Updates a user's password using the local server proxy
   */
  async updateUserPassword(userRecord: CloudKitRecord, hashedPassword: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverBaseUrl}/api/cloudkit/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: userRecord.fields.resetToken?.value, newPassword: hashedPassword })
      });
      if (!response.ok) { throw new Error(`Failed to update password: ${response.status}`); }
      const result = await response.json();
      return result.success;
    } catch (error) { console.error('Error updating user password:', error); throw error; }
  }

  /**
   * Hash password using PBKDF2-SHA256 to match iOS app
   */
  async hashPassword(password: string): Promise<string> {
    // Use PBKDF2-SHA256 to match iOS app hashing
    const salt = 'tuneboxed_salt'; // You should use a unique salt per user
    const iterations = 10000;
    const keyLength = 32; // 256 bits
    
    const hash = CryptoJS.PBKDF2(password, salt, {
      keySize: keyLength / 4, // CryptoJS expects keySize in words (32 bits)
      iterations: iterations
    });
    
    return hash.toString();
  }

  /**
   * Generate deep link to redirect back to app
   */
  generateAppDeepLink(action: string): string {
    return `tuneboxed://${action}`;
  }

  /**
   * Test CloudKit connection through the local server proxy
   */
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await fetch(`${this.serverBaseUrl}/api/cloudkit/test`);
      if (!response.ok) { throw new Error(`Server error: ${response.status}`); }
      const result = await response.json();
      return result;
    } catch (error) { console.error('Error testing CloudKit connection:', error); return { success: false, message: `Connection test failed: ${error}`, data: null }; }
  }

  // Helper method for token expiry check
  private isTokenExpired(tokenExpiry: string | number | Date | null): boolean {
    if (!tokenExpiry) return true;
    
    const expiryDate = new Date(tokenExpiry);
    const now = new Date();
    
    return now > expiryDate;
  }
}

export const cloudKitService = new CloudKitService(); 