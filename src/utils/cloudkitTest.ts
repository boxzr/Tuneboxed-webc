import { cloudKitService } from '../services/cloudkitService';
import { passwordResetService } from '../services/passwordResetService';
import { CLOUDKIT_CONFIG } from '../config/cloudkit';

export class CloudKitTestUtility {
  /**
   * Test CloudKit connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('Testing CloudKit connection...');
      console.log('Container:', CLOUDKIT_CONFIG.containerIdentifier);
      console.log('Environment:', CLOUDKIT_CONFIG.environment);

      // Try to query for any User records (should return 401 if auth fails, empty array if auth succeeds)
      const response = await fetch(`${CLOUDKIT_CONFIG.apiEndpoint}/${CLOUDKIT_CONFIG.containerIdentifier}/${CLOUDKIT_CONFIG.environment}/${CLOUDKIT_CONFIG.databaseType}/records/query`, {
        method: 'POST',
        headers: await cloudKitService.getHeaders(),
        body: JSON.stringify({
          query: {
            recordType: 'User',
            resultsLimit: 1
          }
        })
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

  /**
   * Test token validation with a dummy token
   */
  async testTokenValidation(): Promise<{ success: boolean; message: string }> {
    try {
      const dummyToken = 'test-invalid-token-12345';
      const validation = await passwordResetService.validateResetToken(dummyToken);
      
      if (!validation.valid) {
        return { 
          success: true, 
          message: `✅ Token validation working correctly. Invalid token rejected: ${validation.message}`
        };
      } else {
        return { 
          success: false, 
          message: `❌ Token validation issue: dummy token was marked as valid`
        };
      }

    } catch (error) {
      return { 
        success: false, 
        message: `❌ Token validation test failed: ${error}`
      };
    }
  }

  /**
   * Test password hashing consistency
   */
  async testPasswordHashing(): Promise<{ success: boolean; message: string }> {
    try {
      const testPassword = 'TestPassword123!';
      
      const hash1 = await cloudKitService.hashPassword(testPassword);
      const hash2 = await cloudKitService.hashPassword(testPassword);
      
      if (hash1 === hash2) {
        return { 
          success: true, 
          message: `✅ Password hashing consistent. Hash: ${hash1.substring(0, 16)}...`
        };
      } else {
        return { 
          success: false, 
          message: `❌ Password hashing inconsistent. Hash1: ${hash1.substring(0, 16)}... Hash2: ${hash2.substring(0, 16)}...`
        };
      }

    } catch (error) {
      return { 
        success: false, 
        message: `❌ Password hashing test failed: ${error}`
      };
    }
  }

  /**
   * Test JWT generation
   */
  async testJWTGeneration(): Promise<{ success: boolean; message: string }> {
    try {
      const jwt = (cloudKitService as any).generateJWT();
      
      if (jwt && jwt.length > 0) {
        const parts = jwt.split('.');
        if (parts.length === 3) {
          return { 
            success: true, 
            message: `✅ JWT generation successful. Token: ${jwt.substring(0, 50)}...`
          };
        } else {
          return { 
            success: false, 
            message: `❌ JWT format invalid. Expected 3 parts, got ${parts.length}`
          };
        }
      } else {
        return { 
          success: false, 
          message: `❌ JWT generation failed - empty token`
        };
      }

    } catch (error) {
      return { 
        success: false, 
        message: `❌ JWT generation test failed: ${error}`
      };
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Running CloudKit Test Suite...\n');

    const tests = [
      { name: 'JWT Generation', test: () => this.testJWTGeneration() },
      { name: 'CloudKit Connection', test: () => this.testConnection() },
      { name: 'Token Validation', test: () => this.testTokenValidation() },
      { name: 'Password Hashing', test: () => this.testPasswordHashing() }
    ];

    for (const { name, test } of tests) {
      try {
        console.log(`\n🔍 Testing ${name}...`);
        const result = await test();
        console.log(result.message);
        
        if ('data' in result && result.data) {
          console.log('📊 Response data:', result.data);
        }
      } catch (error) {
        console.log(`❌ ${name} test crashed:`, error);
      }
    }

    console.log('\n✅ Test suite completed!');
    console.log('\n📋 Next steps:');
    console.log('1. If CloudKit connection failed, check your Key ID in src/config/cloudkit.ts');
    console.log('2. Make sure your CloudKit schema has User records with resetToken field');
    console.log('3. Test with a real reset token from your iOS app');
  }
}

// Export singleton instance
export const cloudKitTest = new CloudKitTestUtility();

// Make it available globally for browser console testing
(window as any).cloudKitTest = cloudKitTest; 