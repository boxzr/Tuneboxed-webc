# 🔧 TuneBoxed Website Integration Setup

## 📋 Overview
This guide will help you integrate password reset functionality with your existing tuneboxed.com website to fix CORS issues.

## 🎯 What We're Doing
- **Problem**: Your website can't call CloudKit directly (CORS error)
- **Solution**: Add a backend API to your website server
- **Result**: Website → Your Backend → CloudKit (no CORS!)

---

## 📍 STEP 1: Get CloudKit Key ID (Do This on MacBook)

1. **Open CloudKit Dashboard**
   - Go to: https://icloud.developer.apple.com/dashboard
   - Sign in with your Apple ID

2. **Select Your Container**
   - Click on: `iCloud.AuraBrand.TuneBoxed`

3. **Get API Key**
   - Click **API Access** tab
   - Find your key (should be there from earlier)
   - **Copy the Key ID** (looks like: `ABC123XYZ`)
   - Write it down or save it somewhere

---

## 📍 STEP 2: Transfer Files to Desktop

**Option A: USB Drive**
1. Copy the entire `tuneboxed-website-integration` folder to a USB drive
2. Plug USB into your desktop computer
3. Copy folder to your desktop

**Option B: Email/AirDrop**
1. Zip the `tuneboxed-website-integration` folder
2. Email it to yourself or AirDrop to desktop
3. Extract on your desktop

**Option C: Cloud Storage**
1. Upload folder to iCloud, Google Drive, or Dropbox
2. Download on your desktop computer

---

## 📍 STEP 3: Add Backend API to Your Website (Do This on Desktop)

### If you're using **Node.js/Express**:

1. **Add the API endpoint** to your existing server file:
```javascript
// Add this to your main server file (app.js, server.js, etc.)
const { handlePasswordReset } = require('./api-endpoint.js');

app.post('/api/reset-password', handlePasswordReset);
```

2. **Update the CloudKit Key ID** in `api-endpoint.js`:
```javascript
// Replace this line:
serverToServerKeyAuth: 'REPLACE_WITH_YOUR_KEY_ID',
// With your actual Key ID:
serverToServerKeyAuth: 'ABC123XYZ', // Your actual key ID
```

3. **Install dependencies** (if not already installed):
```bash
npm install crypto
```

### If you're using **PHP**:
Let me know and I'll provide PHP version!

### If you're using **Python/Django/Flask**:
Let me know and I'll provide Python version!

### If you're using **Other**:
Tell me what technology and I'll adapt the code!

---

## 📍 STEP 4: Update Your Reset Password Page (Do This on Desktop)

1. **Find your current reset password page**
   - Usually: `reset-password.html`, `reset-password.php`, etc.

2. **Replace the JavaScript**
   - Remove any direct CloudKit API calls
   - Replace with the code from `reset-password-frontend.js`

3. **Make sure your HTML form has these IDs**:
```html
<form id="reset-form">
  <input type="password" id="new-password" placeholder="New Password" required>
  <input type="password" id="confirm-password" placeholder="Confirm Password" required>
  <button type="submit" id="submit-btn">Reset Password</button>
</form>

<div id="error-message" style="display: none;"></div>
<div id="success-message" style="display: none;"></div>
```

---

## 📍 STEP 5: Test Everything

### Test 1: Backend API
1. **Start your website server**
2. **Test the API endpoint** (using curl or Postman):
```bash
curl -X POST http://localhost:3000/api/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"test","newPassword":"testpass123"}'
```
3. **Should return**: Error about invalid token (that's good!)

### Test 2: Full Flow
1. **On MacBook**: Request password reset from iOS app
2. **Check email**: Click the reset link
3. **Should open**: Your website reset password page
4. **Enter new password**: Submit the form
5. **Should see**: Success message and redirect to app
6. **Test login**: Use new password in iOS app

---

## 🔧 Troubleshooting

### "CORS Error" Still Happening
- Make sure you're calling `/api/reset-password` (same domain)
- Not calling CloudKit directly from frontend

### "CloudKit API Error"
- Check your Key ID is correct
- Make sure private key is exactly as provided
- Try changing environment from 'development' to 'production'

### "Invalid Token" Error
- Make sure iOS app is generating tokens correctly
- Check token expiry (1 hour limit)
- Verify token is being passed in URL correctly

### "Can't Find Form"
- Make sure form has `id="reset-form"`
- Check password inputs have correct IDs
- Look in browser console for JavaScript errors

---

## 📞 Need Help?

**Common Issues:**
1. **Wrong Key ID**: Double-check CloudKit dashboard
2. **Server not running**: Make sure your website server is running
3. **Wrong file path**: Make sure API endpoint file is in right place
4. **JavaScript errors**: Check browser developer console

**What to check:**
- Browser developer console for errors
- Server logs for API errors
- Network tab to see if API calls are being made

---

## ✅ Success Checklist

- [ ] Got CloudKit Key ID from dashboard
- [ ] Transferred files to desktop computer
- [ ] Added backend API endpoint to website server
- [ ] Updated Key ID in configuration
- [ ] Updated frontend JavaScript
- [ ] Tested API endpoint responds
- [ ] Tested full password reset flow
- [ ] New password works in iOS app

**Once all checkboxes are complete, your password reset should work without CORS issues!** 🎉
