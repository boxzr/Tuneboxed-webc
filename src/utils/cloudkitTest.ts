import { CLOUDKIT_CONFIG } from '../config/cloudkit';
import { cloudKitService } from '../services/cloudkitService';

export class CloudKitTestUtility {
  async testDirectCloudKitConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('🧪 Testing DIRECT CloudKit connection (bypassing CORS)...');
      console.log('Container:', CLOUDKIT_CONFIG.containerIdentifier);
      console.log('Environment:', CLOUDKIT_CONFIG.environment);
      
      // Try the direct approach first
      const result = await cloudKitService.validateResetTokenDirect('test-token-for-direct-call');
      console.log('Direct CloudKit result:', result);
      
      if (result.message.includes('Invalid reset token') || result.message.includes('Token is valid')) {
        return { 
          success: true, 
          message: '✅ DIRECT CloudKit connection successful! CORS bypassed!', 
          data: result 
        };
      } else {
        return { 
          success: false, 
          message: '❌ Direct connection failed, but no CORS error', 
          data: result 
        };
      }
    } catch (error) {
      console.error('Direct CloudKit test failed:', error);
      return { 
        success: false, 
        message: `❌ Direct connection failed: ${error}`, 
        data: null 
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('🧪 Testing CloudKit connection through server proxy...');
      console.log('Container:', CLOUDKIT_CONFIG.containerIdentifier);
      console.log('Environment:', CLOUDKIT_CONFIG.environment);
      
      const result = await cloudKitService.testConnection();
      console.log('Server response:', result);
      
      return result;
    } catch (error) {
      console.error('CloudKit connection test failed:', error);
      return { 
        success: false, 
        message: `❌ Connection test failed: ${error}`, 
        data: null 
      };
    }
  }

  async testTokenValidation(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🧪 Testing token validation...');
      const result = await cloudKitService.validateResetToken('invalid-token-for-testing');
      if (!result.valid) {
        return { success: true, message: '✅ Token validation working correctly. Invalid token rejected: ' + result.message };
      } else {
        return { success: false, message: '❌ Token validation failed - invalid token was accepted' };
      }
    } catch (error) {
      return { success: false, message: '❌ Token validation error: ' + error };
    }
  }

  async testPasswordHashing(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🧪 Testing password hashing...');
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
      console.log('🧪 Testing JWT generation...');
      const headers = cloudKitService.getHeaders();
      const authHeader = (headers as Record<string, string>)['CloudKit-Server-to-Server-Key'];
      
      if (authHeader && authHeader.length > 50) {
        return { success: true, message: `✅ JWT generation successful. Token: ${authHeader.substring(0, 50)}...` };
      } else {
        return { success: false, message: '❌ JWT generation failed - invalid header format' };
      }
    } catch (error) {
      return { success: false, message: '❌ JWT generation error: ' + error };
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Running CloudKit Test Suite...');
    console.log('=====================================');
    
    // Test 1: Try direct connection first (CORS bypass attempt)
    console.log('\n🔍 Testing DIRECT CloudKit Connection (CORS bypass)...');
    const directResult = await this.testDirectCloudKitConnection();
    console.log(directResult.success ? '✅' : '❌', directResult.message);
    
    if (directResult.success) {
      console.log('🎉 SUCCESS! Direct CloudKit connection works! No server proxy needed!');
      console.log('📊 Direct connection data:', directResult.data);
      return;
    }
    
    // Test 2: JWT Generation
    console.log('\n🔍 Testing JWT Generation...');
    const jwtResult = await this.testJWTGeneration();
    console.log(jwtResult.success ? '✅' : '❌', jwtResult.message);
    
    // Test 3: Server Proxy Connection (fallback)
    console.log('\n🔍 Testing CloudKit Connection through Server Proxy...');
    const connectionResult = await this.testConnection();
    console.log(connectionResult.success ? '✅' : '❌', connectionResult.message);
    
    // Test 4: Token Validation
    console.log('\n🔍 Testing Token Validation...');
    const tokenResult = await this.testTokenValidation();
    console.log(tokenResult.success ? '✅' : '❌', tokenResult.message);
    
    // Test 5: Password Hashing
    console.log('\n🔍 Testing Password Hashing...');
    const hashResult = await this.testPasswordHashing();
    console.log(hashResult.success ? '✅' : '❌', hashResult.message);
    
    console.log('\n✅ Test suite completed!');
    console.log('📋 Next steps:');
    
    if (directResult.success) {
      console.log('🎉 1. DIRECT CloudKit connection works! No server needed!');
      console.log('🎯 2. Update your website to use direct CloudKit calls');
      console.log('🚀 3. Deploy and test the password reset flow');
    } else {
      console.log('1. If CloudKit connection failed, check your Key ID in src/config/cloudkit.ts');
      console.log('2. Make sure your CloudKit schema has User records with resetToken field');
      console.log('3. Deploy the server proxy to Railway for production use');
      console.log('4. Test with a real reset token from your iOS app');
    }
  }
}

export const cloudKitTest = new CloudKitTestUtility();

// Make globally available for testing
if (typeof window !== 'undefined') {
  (window as any).cloudKitTest = cloudKitTest;
} 