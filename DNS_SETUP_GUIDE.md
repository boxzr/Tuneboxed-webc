# DNS Setup Guide for TuneBoxed Email

## Required DNS Records for Password Reset Emails

To enable password reset emails from `noreply@tuneboxed.com`, you need to add these DNS records to your domain registrar (GoDaddy, Namecheap, etc.).

### 🔑 **REQUIRED: DKIM Record**

**Record 1:**
```
Type: TXT
Name: resend._domainkey.tuneboxed.com
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDLQdA1a6spgQrF6uwWuuv+bjqhj1fyk002G3FBqVn2D0xSW42JnsqcwI7goDGuu/K5rlw5CrV/S9qNSXbz6N5p+FiJv/9SEj0qNzx7B7wLrCJAlHfAjLjYVf+5GtEtOlp7+L78q7bvcZzjWmwJsayw3IZg8saLjDe7le+04oKZ2wIDAQAB
TTL: Auto (or 3600)
```

**Record 2 (Alternative format for some DNS providers):**
```
Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDLQdA1a6spgQrF6uwWuuv+bjqhj1fyk002G3FBqVn2D0xSW42JnsqcwI7goDGuu/K5rlw5CrV/S9qNSXbz6N5p+FiJv/9SEj0qNzx7B7wLrCJAlHfAjLjYVf+5GtEtOlp7+L78q7bvcZzjWmwJsayw3IZg8saLjDe7le+04oKZ2wIDAQAB
TTL: Auto (or 3600)
```

### 📧 **RECOMMENDED: SPF Record**

```
Type: TXT
Name: tuneboxed.com (or @)
Value: v=spf1 include:spf.resend.com ~all
TTL: Auto (or 3600)
```

### 🛡️ **RECOMMENDED: DMARC Record**

```
Type: TXT
Name: _dmarc.tuneboxed.com (or _dmarc)
Value: v=DMARC1; p=none;
TTL: Auto (or 3600)
```

### 📬 **FOR AMAZONSES (If Using):**

```
Type: MX
Name: send
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10
TTL: Auto

Type: TXT
Name: send
Value: v=spf1 include:amazonses.com ~all
TTL: Auto
```

## 🔧 **DNS Provider Specific Instructions**

### **GoDaddy:**
1. Login to GoDaddy Domain Manager
2. Go to DNS Records
3. Click "Add Record"
4. Choose TXT record type
5. Enter the Name and Value exactly as shown above

### **Namecheap:**
1. Login to Namecheap Domain List
2. Click "Manage" next to tuneboxed.com
3. Go to Advanced DNS tab
4. Click "Add New Record"
5. Choose TXT Record type

### **Cloudflare:**
1. Login to Cloudflare Dashboard
2. Select tuneboxed.com domain
3. Go to DNS tab
4. Click "Add record"
5. Choose TXT type

## ✅ **Verification Steps**

### **1. Check DNS Propagation**
Use online tools to verify your DNS records:
- https://dnschecker.org/
- https://mxtoolbox.com/dkim.aspx

### **2. Test DKIM Record**
```bash
nslookup -type=TXT resend._domainkey.tuneboxed.com
```

Should return the DKIM public key.

### **3. Test SPF Record**
```bash
nslookup -type=TXT tuneboxed.com
```

Should include the SPF policy.

### **4. Resend Dashboard Verification**
1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add tuneboxed.com domain
3. Verify all records show as ✅ verified

## ⏱️ **Propagation Time**

DNS changes can take:
- **Immediate to 30 minutes**: Most providers
- **Up to 2 hours**: Some providers
- **Up to 24-48 hours**: In rare cases

## 🚨 **Troubleshooting**

### **DKIM Record Issues:**
- Make sure there are no extra spaces in the value
- Some DNS providers require quotes around the value
- Try both name formats: `resend._domainkey.tuneboxed.com` and `resend._domainkey`

### **SPF Record Issues:**
- Only one SPF record per domain
- If you have existing SPF, merge them: `v=spf1 include:spf.resend.com include:other.com ~all`

### **Email Not Sending:**
1. Check the Railway logs for the send failure
2. Verify the `RESEND_API_KEY` variable is set on the Railway service
3. Test the key with curl, reading it from your environment rather than
   pasting it in. Never commit a key to this repo: it is public, and GitHub
   secret scanning will report it to Resend, who revoke it automatically.
```bash
curl -X POST 'https://api.resend.com/emails' \
-H "Authorization: Bearer $RESEND_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "from": "noreply@tuneboxed.com",
  "to": "test@example.com",
  "subject": "Test",
  "text": "Test email"
}'
```

## 📋 **Final Checklist**

- [ ] DKIM record added and verified
- [ ] SPF record added (recommended)
- [ ] DMARC record added (recommended)
- [ ] DNS propagation completed (test with online tools)
- [ ] Resend dashboard shows domain as verified
- [ ] Test email sending from website works

Once all DNS records are properly configured, your password reset emails will be delivered reliably from `noreply@tuneboxed.com`! 🎉 