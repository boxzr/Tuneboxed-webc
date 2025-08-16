import { CLOUDKIT_CONFIG, CLOUDKIT_FIELDS } from '../config/cloudkit';
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
  private serverBaseUrl = 'http://localhost:3001'; // Local server proxy

  private generateJWT(): string {
    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: 'ES256',
      kid: CLOUDKIT_CONFIG.serverToServerKeyAuth,
      typ: 'JWT'
    };
    
    const payload = {
      iss: CLOUDKIT_CONFIG.serverToServerKeyAuth,
      iat: now,
      exp: now + 3600,
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

  public getHeaders(): HeadersInit {
    const jwt = this.generateJWT();
    return {
      'Authorization': `CloudKit-Server-to-Server-Key ${jwt}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Validates a password reset token using the local server proxy
   */
  async validateResetToken(token: string): Promise<{ valid: boolean; message: string; user?: CloudKitRecord }> {
    try {
      const response = await fetch(`${this.serverBaseUrl}/api/cloudkit/validate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      return {
        valid: result.valid,
        message: result.message,
        user: result.user
      };

    } catch (error) {
      console.error('Error validating reset token:', error);
      return { valid: false, message: 'Error validating token' };
    }
  }

  /**
   * Finds a user record by reset token using the local server proxy
   */
  async findUserByResetToken(token: string): Promise<CloudKitRecord | null> {
    try {
      const validation = await this.validateResetToken(token);
      return validation.user || null;
    } catch (error) {
      console.error('Error finding user by reset token:', error);
      return null;
    }
  }

  /**
   * Updates a user's password using the local server proxy
   */
  async updateUserPassword(userRecord: CloudKitRecord, hashedPassword: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverBaseUrl}/api/cloudkit/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: userRecord.fields.resetToken?.value,
          newPassword: hashedPassword
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update password: ${response.status}`);
      }

      const result = await response.json();
      return result.success;

    } catch (error) {
      console.error('Error updating user password:', error);
      throw error;
    }
  }

  /**
   * Hash password using PBKDF2-SHA256 to match iOS app
   */
  async hashPassword(password: string): Promise<string> {
    const salt = 'TuneBoxedSalt2024';
    const iterations = 10000;
    
    const hash = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
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

  /**
   * Test CloudKit connection through the local server proxy
   */
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await fetch(`${this.serverBaseUrl}/api/cloudkit/test`);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Error testing CloudKit connection:', error);
      return {
        success: false,
        message: `Connection test failed: ${error}`,
        data: null
      };
    }
  }
}

export const cloudKitService = new CloudKitService(); 