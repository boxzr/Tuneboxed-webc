# 🚀 Railway Deployment Guide for TuneBoxed CloudKit Proxy Server

## 📋 Prerequisites

1. **GitHub Account** - Your code is already on GitHub
2. **Railway Account** - Sign up at [railway.app](https://railway.app)

## 🚀 Deployment Steps

### Step 1: Connect Railway to GitHub

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `boxzr/Tuneboxed-webc`
5. Select the **`temp_branch`** branch (or create a new branch for the server)

### Step 2: Configure the Project

1. **Project Name**: `tuneboxed-cloudkit-proxy`
2. **Root Directory**: `server` (important!)
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`

### Step 3: Set Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```
NODE_ENV=production
PORT=3001
```

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete
3. Copy the generated URL (e.g., `https://your-app.railway.app`)

### Step 5: Update Website Configuration

Once deployed, update your website's `cloudkitService.ts` to use the Railway URL instead of localhost.

## 🔧 Manual Deployment (Alternative)

If you prefer command line:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
cd server
railway init

# Deploy
railway up
```

## ✅ Verification

After deployment, test these endpoints:

- **Health Check**: `https://your-app.railway.app/health`
- **CloudKit Test**: `https://your-app.railway.app/api/cloudkit/test`

## 🎯 Next Steps

1. Deploy to Railway
2. Get the production URL
3. Update website configuration
4. Test the password reset flow

## 🆘 Troubleshooting

- **Build fails**: Check that `server/` is the root directory
- **Port issues**: Railway sets `PORT` automatically
- **CORS errors**: Check that your domain is in the allowed origins 