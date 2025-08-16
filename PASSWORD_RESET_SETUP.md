# TuneBoxed Password Reset Setup Guide

## Overview

Your TuneBoxed website now includes a **hidden password reset page** that integrates with CloudKit for your iOS app. Users will receive password reset emails from Resend.com that link to your website, allowing them to securely reset their passwords.

## 🔗 Password Reset Flow

1. **User initiates reset** → Taps "Reset Password" in your iOS app
2. **User enters email** → App sends email via your backend to Resend.com
3. **User receives email** → Email contains link to `https://tuneboxed.com/reset-password?token=xyz`
4. **User resets password** → Hidden page validates token with CloudKit and updates password
5. **User redirected** → Deep link back to app: `tuneboxed://password-reset-success`

## 📁 New Files Added

### Core Components
- `src/pages/PasswordReset.tsx` - Hidden password reset page UI
- `src/services/cloudkitService.ts` - CloudKit API integration service
- `src/config/cloudkit.ts` - CloudKit configuration (needs your credentials)

### Updated Files
- `src/index.tsx` - Added React Router support
- `src/App.tsx` - Added routing for `/reset-password` path

## ⚙️ CloudKit Configuration Required

### 1. Update CloudKit Credentials

Edit `src/config/cloudkit.ts` with your actual values:

```typescript
export const CLOUDKIT_CONFIG: CloudKitConfig = {
  // Replace with your container ID (e.g., "iCloud.com.yourcompany.tuneboxed")
  containerIdentifier: 'YOUR_CLOUDKIT_CONTAINER_ID',
  
  // Use 'development' for testing, 'production' for live
  environment: 'development',
  
  // Your CloudKit Server-to-Server Key
  serverToServerKeyAuth: 'YOUR_SERVER_TO_SERVER_KEY',
  
  databaseType: 'public',
  apiEndpoint: 'https://api.apple-cloudkit.com/database/1'
};
```

### 2. CloudKit Schema Requirements

Your CloudKit database needs these fields in your User record:

```
User Record Type:
├── email (String, Queryable, Searchable)
├── password (String) 
├── resetToken (String, Queryable) [Optional]
└── tokenExpiry (Date/Time) [Optional]
```

**Important**: Make sure you have indexes for:
- `email` field
- `resetToken` field

### 3. Generate Server-to-Server Key

1. Go to [Apple Developer Console](https://developer.apple.com)
2. Navigate to **CloudKit Dashboard**
3. Select your app's container
4. Go to **API Access** tab
5. Generate a **Server-to-Server Key**
6. Copy the key to `serverToServerKeyAuth` in config

## 🎯 URL Structure

The password reset page is accessible at:

```
https://tuneboxed.com/reset-password?token=RESET_TOKEN_HERE
```

This page is **completely hidden** from your main website navigation. Users can only access it via the email link.

## 🔒 Security Features

- **Token Validation**: Validates reset tokens against CloudKit
- **Token Expiration**: Checks if tokens are still valid (not expired)
- **Password Hashing**: Uses SHA-256 (can be upgraded to bcrypt)
- **Input Validation**: Enforces password requirements
- **Error Handling**: Graceful error messages for users

## 📱 iOS App Integration

### Deep Link Setup

After successful password reset, users are redirected to:
```
tuneboxed://password-reset-success
```

Make sure your iOS app handles this URL scheme.

### Backend Integration

Your iOS app's backend should:

1. **Generate reset tokens** when user requests password reset
2. **Store tokens in CloudKit** with expiration times
3. **Send emails via Resend.com** with links to your website
4. **Handle the deep link** when users return to the app

## 🧪 Testing

### 1. Test Token Validation

Visit: `https://tuneboxed.com/reset-password?token=invalid-token`

Should show: "Invalid or expired reset token"

### 2. Test Valid Reset Flow

1. Create a test reset token in CloudKit
2. Visit: `https://tuneboxed.com/reset-password?token=YOUR_TEST_TOKEN`
3. Should show the password reset form

### 3. Test Password Update

1. Fill out the password reset form
2. Should update the user record in CloudKit
3. Should clear the reset token
4. Should redirect to app via deep link

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Update Configuration

Before deploying to production:

1. Change `environment: 'production'` in `src/config/cloudkit.ts`
2. Use your production CloudKit container
3. Ensure your CloudKit production database has the same schema

### Deploy to Firebase (or your hosting platform)

```bash
# If using Firebase Hosting
firebase deploy
```

## 🔧 Customization

### Styling

The password reset page uses inline styles. To customize:

1. **Colors**: Update the gradient and button colors in `PasswordReset.tsx`
2. **Branding**: The page automatically uses your TuneBoxed branding
3. **Layout**: Modify the component structure as needed

### Password Requirements

Currently enforces:
- Minimum 8 characters
- Passwords must match

To add more requirements, update the validation in `handlePasswordReset()`.

### Deep Link Customization

Change the app redirect URL in `src/services/cloudkitService.ts`:

```typescript
generateAppDeepLink(action: string): string {
  return `your-custom-scheme://${action}`;
}
```

## 🛠 Troubleshooting

### Common Issues

1. **"CloudKit API error: 401"**
   - Check your Server-to-Server Key
   - Verify container identifier is correct

2. **"Token not found"**
   - Ensure resetToken field exists in CloudKit
   - Check token was properly stored by your backend

3. **Build errors**
   - Run `npm install` if packages are missing
   - Check TypeScript types are correct

### Debug Mode

To enable debugging, add console logs in:
- `src/services/cloudkitService.ts`
- `src/pages/PasswordReset.tsx`

## 📞 Need Help?

If you run into issues:

1. Check the browser console for errors
2. Verify CloudKit credentials are correct
3. Test with CloudKit Dashboard's API explorer
4. Ensure your reset token format matches expectations

## ✅ Checklist

- [ ] Updated `src/config/cloudkit.ts` with real credentials
- [ ] CloudKit schema includes required fields
- [ ] Generated Server-to-Server Key
- [ ] Set up CloudKit indexes for email and resetToken
- [ ] Tested token validation
- [ ] Tested password reset flow
- [ ] iOS app handles deep link redirect
- [ ] Updated environment to 'production' for live deployment
- [ ] Deployed to hosting platform

Your password reset functionality is now ready to go! 🎉 