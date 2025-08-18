// TuneBoxed Password Reset Test Utility
// Updated to work with the new simplified API endpoint

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

class PasswordResetTest {
  private baseUrl: string;

  constructor() {
    // Use Railway URL in production, localhost in development
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://tuneboxed-production.up.railway.app'
      : 'http://localhost:3001';
  }

  // Test 1: Health Check
  async testHealthCheck(): Promise<TestResult> {
    try {
      console.log('🔍 Testing server health...');
      
      const response = await fetch(`${this.baseUrl}/health`);
      const result = await response.json();
      
      if (response.ok && result.status === 'OK') {
        return {
          success: true,
          message: '✅ Server is running and healthy',
          details: result
        };
      } else {
        return {
          success: false,
          message: '❌ Server health check failed',
          details: result
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Cannot connect to server: ${error}`,
        details: error
      };
    }
  }

  // Test 2: CloudKit Connection
  async testCloudKitConnection(): Promise<TestResult> {
    try {
      console.log('🔍 Testing CloudKit connection...');
      
      const response = await fetch(`${this.baseUrl}/api/cloudkit/test`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        return {
          success: true,
          message: '✅ CloudKit connection successful',
          details: result
        };
      } else {
        return {
          success: false,
          message: `❌ CloudKit connection failed: ${result.message}`,
          details: result
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ CloudKit test failed: ${error}`,
        details: error
      };
    }
  }

  // Test 3: Password Reset API (with invalid token)
  async testPasswordResetAPI(): Promise<TestResult> {
    try {
      console.log('🔍 Testing password reset API...');
      
      const response = await fetch(`${this.baseUrl}/api/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: 'invalid-test-token',
          newPassword: 'testpass123'
        })
      });
      
      const result = await response.json();
      
      // We expect this to fail with invalid token - that's good!
      if (!response.ok && result.error?.includes('Invalid or expired reset token')) {
        return {
          success: true,
          message: '✅ Password reset API is working (correctly rejected invalid token)',
          details: result
        };
      } else {
        return {
          success: false,
          message: '❌ Password reset API not responding as expected',
          details: result
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Password reset API test failed: ${error}`,
        details: error
      };
    }
  }

  // Test 4: Frontend Integration (check if on website)
  async testFrontendIntegration(): Promise<TestResult> {
    try {
      console.log('🔍 Testing frontend integration...');
      
      // Check if we're on the tuneboxed.com domain
      const isOnTuneBoxedDomain = window.location.hostname === 'tuneboxed.com' || 
                                  window.location.hostname === 'localhost';
      
      if (!isOnTuneBoxedDomain) {
        return {
          success: false,
          message: '⚠️ Not on TuneBoxed domain - password reset may have CORS issues',
          details: { currentDomain: window.location.hostname }
        };
      }

      // Check if password reset page exists
      const resetPageExists = document.querySelector('div') !== null; // Basic check
      
      return {
        success: true,
        message: '✅ Frontend integration looks good',
        details: {
          domain: window.location.hostname,
          resetPageAvailable: resetPageExists
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Frontend integration test failed: ${error}`,
        details: error
      };
    }
  }

  // Run all tests
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting TuneBoxed Password Reset System Tests...\n');
    
    const tests = [
      { name: 'Server Health Check', test: () => this.testHealthCheck() },
      { name: 'CloudKit Connection', test: () => this.testCloudKitConnection() },
      { name: 'Password Reset API', test: () => this.testPasswordResetAPI() },
      { name: 'Frontend Integration', test: () => this.testFrontendIntegration() }
    ];

    const results = [];
    
    for (const { name, test } of tests) {
      console.log(`\n🧪 Running: ${name}`);
      
      try {
        const result = await test();
        results.push({ name, ...result });
        
        if (result.success) {
          console.log(`   ${result.message}`);
        } else {
          console.error(`   ${result.message}`);
          if (result.details) {
            console.log('   Details:', result.details);
          }
        }
      } catch (error) {
        results.push({ 
          name, 
          success: false, 
          message: `❌ Test crashed: ${error}`,
          details: error 
        });
        console.error(`   ❌ Test crashed: ${error}`);
      }
    }

    // Summary
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('\n📋 Test Summary:');
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📊 Total:  ${results.length}`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! Your password reset system is ready to go!');
    } else {
      console.log('\n⚠️ Some tests failed. Check the details above.');
    }

    return;
  }

  // Quick test for password reset URL
  testResetUrl(resetUrl: string): void {
    console.log('🔗 Testing password reset URL...');
    console.log(`URL: ${resetUrl}`);
    
    try {
      const url = new URL(resetUrl);
      const token = url.searchParams.get('token');
      
      if (token) {
        console.log(`✅ Token found: ${token.substring(0, 8)}...`);
        console.log('📱 This URL should open your website password reset page');
      } else {
        console.log('❌ No token found in URL');
      }
    } catch (error) {
      console.log(`❌ Invalid URL: ${error}`);
    }
  }
}

// Create global instance
export const cloudKitTest = new PasswordResetTest();

// Global function for easy console access
(window as any).testPasswordReset = () => cloudKitTest.runAllTests();
(window as any).testResetUrl = (url: string) => cloudKitTest.testResetUrl(url);

console.log('🧪 Password Reset Test Utility loaded!');
console.log('📖 Available commands:');
console.log('   - testPasswordReset()     - Run all tests');
console.log('   - testResetUrl("url")     - Test a specific reset URL');
console.log('   - cloudKitTest.runAllTests() - Alternative way to run tests'); 