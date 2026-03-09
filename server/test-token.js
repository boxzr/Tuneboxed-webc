#!/usr/bin/env node

const cloudKitService = require('./cloudkitService');
const { CLOUDKIT_CONFIG } = require('./config');

async function testTokenVerification() {
  try {
    console.log('🧪 Testing CloudKit Token Verification');
    console.log('🌍 Environment:', CLOUDKIT_CONFIG.environment);
    console.log('📦 Container:', CLOUDKIT_CONFIG.containerIdentifier);
    console.log('');

    // Test 1: Find a user by email first
    const testEmail = process.argv[2] || 'mitch@tuneboxed.com'; // Use command line arg or default
    console.log('📧 Testing with email:', testEmail);
    
    const userResult = await cloudKitService.queryRecords({
      recordType: 'User',
      filterBy: [{
        fieldName: 'email',
        comparator: 'EQUALS',
        fieldValue: { value: testEmail }
      }],
      resultsLimit: 1
    });

    if (!userResult.records || userResult.records.length === 0) {
      console.log('❌ No user found with email:', testEmail);
      process.exit(1);
    }

    const userRecord = userResult.records[0];
    console.log('✅ Found user:', userRecord.fields.username?.value || userRecord.fields.email?.value);
    console.log('📋 Record name:', userRecord.recordName);
    console.log('🔍 Current fields:', Object.keys(userRecord.fields).sort());
    
    // Check if user already has reset token
    if (userRecord.fields.resetToken?.value) {
      console.log('🔑 Existing reset token:', userRecord.fields.resetToken.value.substring(0, 8) + '...');
      console.log('⏰ Token expiry:', new Date(userRecord.fields.resetTokenExpiry?.value).toISOString());
      
      // Test finding this token
      console.log('');
      console.log('🔍 Testing token lookup...');
      const foundUser = await cloudKitService.findUserByResetToken(userRecord.fields.resetToken.value);
      if (foundUser) {
        console.log('✅ Token lookup successful!');
      } else {
        console.log('❌ Token lookup failed!');
      }
    } else {
      console.log('ℹ️ No existing reset token found');
      
      // Test 2: Create a new reset token
      console.log('');
      console.log('🔑 Creating new reset token...');
      const testToken = require('crypto').randomUUID();
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
      
      console.log('🔧 Generated token:', testToken.substring(0, 8) + '...');
      console.log('⏰ Expires at:', new Date(expiresAt).toISOString());
      
      // Update user with token
      await cloudKitService.updateUserResetToken(userRecord, testToken, expiresAt);
      console.log('✅ Token stored in CloudKit');
      
      // Wait for CloudKit consistency
      console.log('⏳ Waiting for CloudKit consistency...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test finding the token
      console.log('🔍 Testing token lookup...');
      const foundUser = await cloudKitService.findUserByResetToken(testToken);
      if (foundUser) {
        console.log('✅ Token lookup successful!');
        console.log('🔑 Found token:', foundUser.fields.resetToken?.value?.substring(0, 8) + '...');
      } else {
        console.log('❌ Token lookup failed!');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔧 Error details:', error);
    process.exit(1);
  }
}

// Run the test
testTokenVerification().then(() => {
  console.log('');
  console.log('🎉 Test completed!');
  process.exit(0);
});
