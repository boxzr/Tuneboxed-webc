# 🚀 TuneBoxed Website Integration - Quick Start

## 📋 Simple 5-Step Process

### ✅ STEP 1: Get CloudKit Key (MacBook)
1. Go to: https://icloud.developer.apple.com/dashboard
2. Select: `iCloud.AuraBrand.TuneBoxed`
3. Click: **API Access** tab
4. Copy your **Key ID** (save it!)

### ✅ STEP 2: Transfer Files (MacBook → Desktop)
**Choose ONE method:**
- 📧 **Email**: Zip this folder and email to yourself
- 💾 **USB**: Copy folder to USB drive
- ☁️ **Cloud**: Upload to iCloud/Dropbox/Google Drive
- 📱 **AirDrop**: Send to your desktop Mac

### ✅ STEP 3: Update Configuration (Desktop)
1. Open `api-endpoint.js`
2. Replace `REPLACE_WITH_YOUR_KEY_ID` with your actual Key ID
3. Save the file

### ✅ STEP 4: Add to Your Website (Desktop)
**For Node.js/Express:**
```javascript
// Add to your main server file
const { handlePasswordReset } = require('./api-endpoint.js');
app.post('/api/reset-password', handlePasswordReset);
```

**For other technologies:** See `setup-instructions.md`

### ✅ STEP 5: Update Frontend (Desktop)
1. Find your reset password page
2. Replace JavaScript with code from `reset-password-frontend.js`
3. Make sure form IDs match (see template)

---

## 🧪 Test It Works

1. **MacBook**: Request password reset from iOS app
2. **Email**: Click reset link → goes to your website
3. **Website**: Enter new password → submit
4. **Success**: Should redirect back to app
5. **iOS**: Test login with new password

---

## 📞 Need Help?

**Files Included:**
- `api-endpoint.js` - Backend API code
- `reset-password-frontend.js` - Frontend JavaScript
- `complete-reset-page-template.html` - Full HTML template
- `setup-instructions.md` - Detailed instructions

**Common Issues:**
- CORS error → Make sure calling `/api/reset-password` not CloudKit directly
- Invalid token → Check Key ID is correct
- Form not working → Check form IDs match template

**What technology is your website built with?**
- Node.js/Express ✅ Ready to use
- PHP → Let me know, I'll convert
- Python → Let me know, I'll convert
- Other → Tell me what you're using

---

## 🎯 Why This Works

```
❌ Before: Website → CloudKit (CORS blocked)
✅ After:  Website → Your API → CloudKit (no CORS!)
```

Your website calls your own backend API (same domain), which then calls CloudKit. No more CORS issues! 🎉
