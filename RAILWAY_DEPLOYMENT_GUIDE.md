# Railway Deployment Guide (RECOMMENDED)

## Why Railway is Better for Your Backend

Your backend uses **Socket.IO** for real-time features, which makes Railway the perfect choice:

✅ **Full Socket.IO Support** - Real-time notifications work perfectly  
✅ **No Cold Starts** - Always-on server, no delays  
✅ **WebSocket Support** - Persistent connections for chat/live updates  
✅ **Easy Setup** - Deploy in minutes  
✅ **Free Tier** - $5 credit per month  
✅ **Auto-Deploy** - Automatic deployments from GitHub  
✅ **Built-in Metrics** - Monitor your app's performance  

---

## 🚀 Deploy to Railway (Method 1: CLI - Fastest)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway
```bash
railway login
```
This will open your browser for authentication.

### Step 3: Navigate to Your Server Directory
```bash
cd "/Users/linsha/Desktop/FINAL DRAFT OF PROJECT/UrbanSprout-main  Hosting/server"
```

### Step 4: Initialize Railway Project
```bash
railway init
```
- Choose "Create a new project"
- Give it a name like "urbansprout-backend"

### Step 5: Link Your Project
```bash
railway link
```

### Step 6: Add Environment Variables
You can add them one by one:
```bash
railway variables set MONGODB_URI="your-mongodb-connection-string"
railway variables set JWT_SECRET="your-jwt-secret"
railway variables set CORS_ORIGIN="https://your-frontend-url.com"
railway variables set FRONTEND_URL="https://your-frontend-url.com"
railway variables set SENDGRID_API_KEY="your-sendgrid-key"
railway variables set EMAIL_FROM="noreply@yourapp.com"
railway variables set RAZORPAY_KEY_ID="your-razorpay-id"
railway variables set RAZORPAY_KEY_SECRET="your-razorpay-secret"
railway variables set MISTRAL_API_KEY="your-mistral-key"
railway variables set NODE_ENV="production"
railway variables set PORT="5001"
```

Or add them all at once via the Railway dashboard (easier):
1. Go to https://railway.app/dashboard
2. Select your project
3. Click "Variables" tab
4. Click "RAW Editor"
5. Paste all your variables

### Step 7: Deploy!
```bash
railway up
```

That's it! Railway will build and deploy your app.

### Step 8: Get Your Deployment URL
```bash
railway domain
```

Or generate a custom domain:
```bash
railway domain generate
```

---

## 🌐 Deploy to Railway (Method 2: GitHub - Recommended for Teams)

### Step 1: Push Your Code to GitHub
If not already done:
```bash
cd "/Users/linsha/Desktop/FINAL DRAFT OF PROJECT/UrbanSprout-main  Hosting"
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### Step 2: Go to Railway Dashboard
Visit https://railway.app/new

### Step 3: Create New Project
- Click "Deploy from GitHub repo"
- Select your repository
- Choose the `server` directory as the root
- Railway will auto-detect your Node.js app

### Step 4: Configure Environment Variables
In the Railway dashboard:
1. Click on your service
2. Go to "Variables" tab
3. Add all required environment variables (see list below)

### Step 5: Deploy
Railway will automatically deploy your app! 🎉

### Step 6: Enable Auto-Deploy
Railway will now automatically deploy when you push to your main branch.

---

## 🔑 Complete Environment Variables List

Copy this template and replace with your actual values:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/urbansprout?retryWrites=true&w=majority

# Server
NODE_ENV=production
PORT=5001

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# CORS & Frontend
CORS_ORIGIN=https://your-frontend-url.vercel.app,https://your-custom-domain.com
FRONTEND_URL=https://your-frontend-url.vercel.app

# Email Service
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
EMAIL_FROM=noreply@yourapp.com

# Payment Gateway
RAZORPAY_KEY_ID=rzp_test_or_live_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# AI Chatbot
MISTRAL_API_KEY=your-mistral-api-key

# Firebase (if using)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
```

---

## 🔍 Verify Deployment

### Test Your API:
```bash
# Replace YOUR-APP-URL with your Railway URL
curl https://your-app.railway.app/api/test
curl https://your-app.railway.app/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "🌱 UrbanSprout Backend is running successfully!",
  "timestamp": "2024-10-24T...",
  "environment": "production"
}
```

### Test Socket.IO Connection:
Your real-time features should work! Test by:
1. Opening your frontend
2. Checking if notifications work
3. Verifying chatbot responds in real-time

---

## 📊 Monitor Your App

### View Logs:
```bash
railway logs
```

Or in the dashboard:
- Click your project → "Deployments" → "Logs"

### View Metrics:
- CPU usage
- Memory usage
- Network traffic
- Request counts

All available in the Railway dashboard!

---

## 🎯 Configure Custom Domain (Optional)

### Step 1: Generate Railway Domain
```bash
railway domain generate
```
You'll get: `your-app.railway.app`

### Step 2: Or Add Custom Domain
In Railway dashboard:
1. Click "Settings"
2. Go to "Domains"
3. Click "Add Domain"
4. Enter your domain (e.g., `api.yourdomain.com`)
5. Add the CNAME record to your DNS provider:
   - Name: `api`
   - Value: `your-app.railway.app`

---

## 🔧 Troubleshooting

### Issue: Build Fails
**Check:**
- All dependencies in `package.json`
- Node version compatibility
- Build logs in Railway dashboard

**Fix:**
```bash
# Specify Node version in package.json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Issue: App Crashes on Startup
**Check:**
- Environment variables are set correctly
- MongoDB URI is accessible
- Port configuration (Railway auto-assigns PORT)

**View logs:**
```bash
railway logs
```

### Issue: Cannot Connect to Database
**Solution:**
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist (allow all: `0.0.0.0/0`)
- Ensure database user has correct permissions

### Issue: CORS Errors
**Solution:**
Add your frontend URL to `CORS_ORIGIN`:
```bash
railway variables set CORS_ORIGIN="https://your-frontend.vercel.app"
```

---

## 🔄 Update Your Deployment

### Automatic Updates (GitHub Method):
Just push to your main branch:
```bash
git add .
git commit -m "Update backend"
git push origin main
```
Railway will automatically deploy!

### Manual Updates (CLI Method):
```bash
cd "/Users/linsha/Desktop/FINAL DRAFT OF PROJECT/UrbanSprout-main  Hosting/server"
railway up
```

---

## 💰 Pricing

### Free Tier (Hobby Plan):
- $5 credit per month
- Sufficient for small to medium apps
- ~550 hours of runtime

### Pro Plan ($20/month):
- $20 included credit
- Priority support
- Higher resource limits
- Team collaboration

**Estimate:** Your app should run fine on the free tier initially!

---

## 🌟 Next Steps After Deployment

1. **Update Frontend API URL:**
   - Change from `http://localhost:5001` to `https://your-app.railway.app`
   - Update in your frontend config/environment files

2. **Update CORS Configuration:**
   - Add your frontend URL to `CORS_ORIGIN`
   - Test API calls from frontend

3. **Test All Features:**
   - ✅ User authentication
   - ✅ Database operations
   - ✅ File uploads
   - ✅ Email sending
   - ✅ Payment gateway
   - ✅ Real-time notifications (Socket.IO)
   - ✅ Chatbot functionality

4. **Set Up Monitoring:**
   - Configure error tracking (Sentry)
   - Set up uptime monitoring (UptimeRobot)
   - Enable Railway metrics

5. **Configure Backup:**
   - Set up MongoDB Atlas automated backups
   - Export environment variables backup

---

## 📱 Useful Commands

```bash
# View project info
railway status

# View environment variables
railway variables

# Open project in browser
railway open

# View deployment logs
railway logs

# Link to different project
railway link

# Deploy current directory
railway up

# Run commands in Railway environment
railway run node scripts/yourScript.js
```

---

## 🆚 Railway vs Vercel Comparison

| Feature | Railway | Vercel |
|---------|---------|--------|
| Socket.IO | ✅ Yes | ❌ No |
| WebSockets | ✅ Yes | ❌ No |
| Cold Starts | ✅ No | ❌ Yes |
| Long-running tasks | ✅ Yes | ❌ No (10s limit) |
| Background jobs | ✅ Yes | ⚠️ Limited |
| Cron jobs | ✅ Yes | ⚠️ Limited |
| Pricing | $5 free/month | Free (limited) |
| Best for | Backend APIs | Frontend apps |

**Verdict:** Railway is better for your Node.js backend with Socket.IO!

---

## 🔗 Useful Links

- [Railway Dashboard](https://railway.app/dashboard)
- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord Community](https://discord.gg/railway)
- [Railway Status](https://railway.statuspage.io/)

---

## 🎉 You're All Set!

Your backend should now be deployed and running on Railway with full Socket.IO support!

**Questions?** Check the Railway docs or feel free to ask for help!

---

## 📞 Support

If you encounter any issues:
1. Check Railway logs: `railway logs`
2. Visit Railway Discord for community help
3. Check Railway documentation
4. Review your environment variables

Good luck with your deployment! 🚀🌱

