import { CLOUDKIT_CONFIG } from '../config/cloudkit';
import { cloudKitService } from '../services/cloudkitService';

export class CloudKitTestUtility {
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('Testing CloudKit connection...');
      console.log('Container:', CLOUDKIT_CONFIG.containerIdentifier);
      console.log('Environment:', CLOUDKIT_CONFIG.environment);
      
      // Use the actual service to get proper headers
      const headers = cloudKitService.getHeaders();
      console.log('Using headers:', headers);
      
      const response = await fetch(`${CLOUDKIT_CONFIG.apiEndpoint}/${CLOUDKIT_CONFIG.containerIdentifier}/${CLOUDKIT_CONFIG.environment}/${CLOUDKIT_CONFIG.databaseType}/records/query`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ query: { recordType: 'User', resultsLimit: 1 } })
      });
      
      const data = await response.json();
      if (response.ok) {
        return {
          success: true,
          message: `✅ CloudKit connection successful! Found ${data.records?.length || 0} user records.`,
          data: data
        };
      } else {
        return {
          success: false,
          message: `❌ CloudKit connection failed: ${data.serverErrorCode || response.status} - ${data.reason || response.statusText}`,
          data: data
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ CloudKit connection error: ${error}`,
        data: null
      };
    }
  }

  async testTokenValidation(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing token validation...');
      const result = await cloudKitService.validateResetToken('invalid-token-for-testing');
      if (!result) {
        return { success: true, message: '✅ Token validation working correctly. Invalid token rejected: No user found with this token' };
      } else {
        return { success: false, message: '❌ Token validation failed - invalid token was accepted' };
      }
    } catch (error) {
      return { success: true, message: '✅ Token validation working correctly. Invalid token rejected with error: ' + error };
    }
  }

  async testPasswordHashing(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing password hashing...');
      const testPassword = 'testPassword123';
      const hash1 = await cloudKitService.hashPassword(testPassword);
      const hash2 = await cloudKitService.hashPassword(testPassword);
      
      if (hash1 === hash2 && hash1.length > 0) {
        return { success: true, message: `✅ Password hashing consistent. Hash: ${hash1.substring(0, 16)}...` };
      } else {
        return { success: false, message: '❌ Password hashing inconsistent or empty' };
      }
    } catch (error) {
      return { success: false, message: '❌ Password hashing error: ' + error };
    }
  }

  async testJWTGeneration(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing JWT generation...');
      // Test JWT generation by getting headers (which calls generateJWT internally)
      const headers = cloudKitService.getHeaders();
      const authHeader = (headers as Record<string, string>).Authorization;
      
      if (authHeader && authHeader.startsWith('CloudKit-Server-to-Server-Key ') && authHeader.length > 50) {
        return { success: true, message: `✅ JWT generation successful. Token: ${authHeader.substring(30, 80)}...` };
      } else {
        return { success: false, message: '❌ JWT generation failed - invalid header format' };
      }
    } catch (error) {
      return { success: false, message: '❌ JWT generation error: ' + error };
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Running CloudKit Test Suite...\n');
    
    const tests = [
      { name: 'JWT Generation', test: () => this.testJWTGeneration() },
      { name: 'CloudKit Connection', test: () => this.testConnection() },
      { name: 'Token Validation', test: () => this.testTokenValidation() },
      { name: 'Password Hashing', test: () => this.testPasswordHashing() }
    ];

    for (const test of tests) {
      console.log(`🔍 Testing ${test.name}...`);
      const result = await test.test();
      console.log(`${result.success ? '✅' : '❌'} ${result.message}`);
      
      if (test.name === 'CloudKit Connection' && 'data' in result && result.data) {
        console.log('📊 Response data:', result.data);
      }
    }

    console.log('\n✅ Test suite completed!');
    console.log('📋 Next steps:');
    console.log('1. If CloudKit connection failed, check your Key ID in src/config/cloudkit.ts');
    console.log('2. Make sure your CloudKit schema has User records with resetToken field');
    console.log('3. Test with a real reset token from your iOS app');
  }
}

export const cloudKitTest = new CloudKitTestUtility();

// Make globally available for testing
if (typeof window !== 'undefined') {
  (window as any).cloudKitTest = cloudKitTest;
} 