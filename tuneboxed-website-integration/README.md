# TuneBoxed Website Integration Guide

This package contains everything you need to integrate password reset functionality with your existing tuneboxed.com website.

## 🎯 What This Solves
- **CORS Error**: Your website can't call CloudKit/Resend directly from browser JavaScript
- **Solution**: Add a backend API endpoint to your existing website server

## 📁 Files Included

### Backend Files
- `api-endpoint.js` - The backend API endpoint code
- `package.json` - Dependencies needed
- `cloudkit-config.js` - CloudKit configuration template

### Frontend Files  
- `reset-password-frontend.js` - Updated JavaScript for your reset page
- `reset-password.html` - Complete HTML template (if needed)

### Configuration
- `setup-instructions.md` - Detailed setup steps
- `test-guide.md` - How to test everything works

## 🚀 Quick Start

1. **Get CloudKit Key ID** (from MacBook)
2. **Copy files to Desktop** (via USB, email, or cloud)
3. **Add backend endpoint** (to your website server)
4. **Update frontend** (replace direct CloudKit calls)
5. **Test the flow** (request reset from iOS app)

## ⚡ Current Status
- ✅ iOS app configured and working
- ✅ Resend email service configured  
- ✅ Deep link handling ready
- 🔄 Need to integrate with website backend
- 🔄 Need to get CloudKit Key ID

## 📞 Need Help?
All the detailed instructions are in `setup-instructions.md`
