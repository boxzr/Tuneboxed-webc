import { CLOUDKIT_CONFIG, CLOUDKIT_FIELDS, CLOUDKIT_RECORD_TYPES } from '../config/cloudkit';
import * as jsrsasign from 'jsrsasign';
import CryptoJS from 'crypto-js';

export interface CloudKitRecord {
  recordName: string;
  recordType: string;
  fields: Record<string, { value: any }>;
}

export interface CloudKitQueryResponse {
  records: CloudKitRecord[];
}

class CloudKitService {
  private getApiUrl(endpoint: string): string {
    return `${CLOUDKIT_CONFIG.apiEndpoint}/${CLOUDKIT_CONFIG.containerIdentifier}/${CLOUDKIT_CONFIG.environment}/${CLOUDKIT_CONFIG.databaseType}/${endpoint}`;
  }

  private generateJWT(): string {
    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: 'ES256',
      kid: CLOUDKIT_CONFIG.serverToServerKeyAuth,
      typ: 'JWT'
    };
    
    const payload = {
      iss: CLOUDKIT_CONFIG.serverToServerKeyAuth, // Key ID
      iat: now,
      exp: now + 3600, // 1 hour expiry
      sub: CLOUDKIT_CONFIG.containerIdentifier
    };

    try {
      // Create JWT using jsrsasign
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

  public getHeaders(): HeadersInit {
    const jwt = this.generateJWT();
    return {
      'Authorization': `CloudKit-Server-to-Server-Key ${jwt}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Validates a password reset token
   */
  async validateResetToken(token: string): Promise<CloudKitRecord | null> {
    try {
      const response = await fetch(this.getApiUrl('records/query'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          query: {
            filterBy: [
              {
                fieldName: CLOUDKIT_FIELDS.RESET_TOKEN,
                fieldValue: { value: token },
                comparator: 'EQUALS'
              },
              {
                fieldName: CLOUDKIT_FIELDS.TOKEN_EXPIRY,
                fieldValue: { value: new Date().getTime() },
                comparator: 'GREATER_THAN'
              }
            ]
          }
        })
      });

      if (!response.ok) {
        throw new Error(`CloudKit API error: ${response.status}`);
      }

      const data: CloudKitQueryResponse = await response.json();
      return data.records && data.records.length > 0 ? data.records[0] : null;

    } catch (error) {
      console.error('Error validating reset token:', error);
      throw error;
    }
  }

  /**
   * Finds a user record by reset token
   */
  async findUserByResetToken(token: string): Promise<CloudKitRecord | null> {
    try {
      const response = await fetch(this.getApiUrl('records/query'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          query: {
            filterBy: [{
              fieldName: CLOUDKIT_FIELDS.RESET_TOKEN,
              fieldValue: { value: token },
              comparator: 'EQUALS'
            }]
          }
        })
      });

      if (!response.ok) {
        throw new Error(`CloudKit API error: ${response.status}`);
      }

      const data: CloudKitQueryResponse = await response.json();
      return data.records && data.records.length > 0 ? data.records[0] : null;

    } catch (error) {
      console.error('Error finding user by reset token:', error);
      throw error;
    }
  }

  /**
   * Updates a user's password and clears reset token
   */
  async updateUserPassword(userRecord: CloudKitRecord, hashedPassword: string): Promise<boolean> {
    try {
      const response = await fetch(this.getApiUrl('records/modify'), {
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
                [CLOUDKIT_FIELDS.PASSWORD]: { value: hashedPassword },
                [CLOUDKIT_FIELDS.RESET_TOKEN]: { value: null },
                [CLOUDKIT_FIELDS.TOKEN_EXPIRY]: { value: null }
              }
            }
          }]
        })
      });

      return response.ok;

    } catch (error) {
      console.error('Error updating user password:', error);
      throw error;
    }
  }

  /**
   * Hash password using PBKDF2-SHA256 to match iOS app
   */
  async hashPassword(password: string): Promise<string> {
    // Use PBKDF2 with SHA-256 to match iOS implementation
    // This should match the hashing used in your iOS app
    const salt = 'TuneBoxedSalt2024'; // Use the same salt as your iOS app
    const iterations = 10000; // Use the same iteration count as your iOS app
    
    const hash = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32, // 256 bits = 32 bytes = 8 words of 32 bits
      iterations: iterations,
      hasher: CryptoJS.algo.SHA256
    });
    
    return hash.toString(CryptoJS.enc.Hex);
  }

  /**
   * Generate deep link to redirect back to app
   */
  generateAppDeepLink(action: string): string {
    return `tuneboxed://${action}`;
  }
}

export const cloudKitService = new CloudKitService(); 