# 🚀 Backend Deployment Checklist

## ⚠️ IMPORTANT DECISION FIRST!

### Your Backend Uses Socket.IO
- [ ] **Decision Made:** Which platform will you use?
  - [ ] ✅ **Railway (RECOMMENDED)** - Full Socket.IO support
  - [ ] ❌ **Vercel** - Socket.IO won't work (not recommended)
  - [ ] ⚠️ **Render** - Works but free tier has cold starts
  - [ ] Other: _____________

**If you chose Railway, follow Railway checklist below.**  
**If you chose Vercel, follow Vercel checklist below.**

---

## 📋 Railway Deployment Checklist (RECOMMENDED)

### Pre-Deployment (5 minutes)
- [ ] MongoDB Atlas database is set up and running
- [ ] All environment variable values are ready
- [ ] GitHub repository is up to date (optional, but recommended)
- [ ] Node.js 18+ is installed locally

### Installation (2 minutes)
- [ ] Install Railway CLI: `npm install -g @railway/cli`
- [ ] Login to Railway: `railway login`
- [ ] Navigate to server directory

### Deployment (5 minutes)
- [ ] Initialize project: `railway init`
- [ ] Add environment variables (see list below)
- [ ] Deploy: `railway up`
- [ ] Generate domain: `railway domain`

### Environment Variables Setup (10 minutes)
Add these via Railway dashboard or CLI:

**Required Variables:**
- [ ] `MONGODB_URI` - Your MongoDB connection string
- [ ] `JWT_SECRET` - Your JWT secret key (min 32 characters)
- [ ] `CORS_ORIGIN` - Your frontend URL(s)
- [ ] `FRONTEND_URL` - Your frontend URL
- [ ] `NODE_ENV=production`
- [ ] `PORT=5001`

**Email Service:**
- [ ] `SENDGRID_API_KEY` - Your SendGrid API key
- [ ] `EMAIL_FROM` - Sender email address

**Payment Gateway:**
- [ ] `RAZORPAY_KEY_ID` - Your Razorpay key
- [ ] `RAZORPAY_KEY_SECRET` - Your Razorpay secret

**AI Service:**
- [ ] `MISTRAL_API_KEY` - Your Mistral API key

**Firebase (if applicable):**
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_PRIVATE_KEY`
- [ ] `FIREBASE_CLIENT_EMAIL`

### Post-Deployment Testing (10 minutes)
- [ ] Test health endpoint: `/api/health`
- [ ] Test API endpoint: `/api/test`
- [ ] Test authentication: `/api/auth/login`
- [ ] Test database connection
- [ ] Test Socket.IO connection
- [ ] Verify real-time notifications work
- [ ] Test chatbot functionality
- [ ] Test file uploads
- [ ] Test payment gateway
- [ ] Test email sending

### Frontend Integration (5 minutes)
- [ ] Copy Railway backend URL
- [ ] Update frontend API base URL
- [ ] Update frontend CORS configuration
- [ ] Test frontend → backend communication
- [ ] Test real-time features from frontend

### Final Checks
- [ ] All features working correctly
- [ ] No console errors
- [ ] Logs look clean: `railway logs`
- [ ] SSL/HTTPS is working
- [ ] Real-time notifications working
- [ ] Socket.IO connected successfully

### Optional Enhancements
- [ ] Set up custom domain
- [ ] Configure error monitoring (Sentry)
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Enable GitHub auto-deploy
- [ ] Configure database backups
- [ ] Set up CI/CD pipeline

---

## 📋 Vercel Deployment Checklist (NOT RECOMMENDED)

### ⚠️ Warning
- [ ] **I understand Socket.IO will NOT work on Vercel**
- [ ] **I understand real-time features will break**
- [ ] **I have a plan to handle this (remove Socket.IO or use alternative)**

### Pre-Deployment
- [ ] MongoDB Atlas is set up
- [ ] All environment variables ready
- [ ] Socket.IO features are disabled/removed (if applicable)

### Installation
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Login to Vercel: `vercel login`
- [ ] Navigate to server directory

### Deployment
- [ ] Deploy: `vercel --prod`
- [ ] Configure environment variables
- [ ] Test REST API endpoints

### Environment Variables
(Same list as Railway above)

### Post-Deployment Testing
- [ ] Test REST API endpoints
- [ ] ❌ Socket.IO won't work (expected)
- [ ] Test authentication
- [ ] Test database operations
- [ ] Test file uploads (4.5MB limit)
- [ ] Check function timeout (10s on free tier)

### Known Limitations on Vercel
- ❌ No Socket.IO support
- ❌ No WebSockets
- ❌ 10-second timeout on free tier
- ❌ 4.5 MB request limit
- ❌ Cold starts after inactivity
- ❌ No background jobs
- ❌ No persistent connections

---

## 🔑 Environment Variables Template

Copy this and fill in your values:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/urbansprout?retryWrites=true&w=majority

# Server
NODE_ENV=production
PORT=5001

# Authentication
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# CORS & Frontend
CORS_ORIGIN=https://your-frontend-url.vercel.app
FRONTEND_URL=https://your-frontend-url.vercel.app

# Email Service (SendGrid)
SENDGRID_API_KEY=SG.your-sendgrid-api-key
EMAIL_FROM=noreply@yourapp.com

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_test_or_live_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# AI Service (Mistral)
MISTRAL_API_KEY=your-mistral-api-key-here

# Firebase (if applicable)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
```

---

## 📊 Quick Command Reference

### Railway Commands:
```bash
# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# View logs
railway logs

# Add environment variable
railway variables set KEY="value"

# Generate domain
railway domain

# View project status
railway status

# Open in browser
railway open
```

### Vercel Commands:
```bash
# Login
vercel login

# Deploy to production
vercel --prod

# Deploy preview
vercel

# View logs
vercel logs

# Add environment variable
vercel env add KEY

# List projects
vercel list

# Open in browser
vercel open
```

---

## 🆘 Troubleshooting Checklist

### If Deployment Fails:
- [ ] Check build logs for errors
- [ ] Verify all dependencies in package.json
- [ ] Check Node.js version compatibility
- [ ] Verify start command is correct
- [ ] Check for missing environment variables

### If App Crashes:
- [ ] View logs: `railway logs` or `vercel logs`
- [ ] Check MongoDB connection string
- [ ] Verify all environment variables are set
- [ ] Check for missing dependencies
- [ ] Verify PORT configuration

### If API Returns Errors:
- [ ] Check CORS configuration
- [ ] Verify database connectivity
- [ ] Check authentication tokens
- [ ] Review error logs
- [ ] Test with curl or Postman

### If Frontend Can't Connect:
- [ ] Verify backend URL is correct
- [ ] Check CORS_ORIGIN includes frontend URL
- [ ] Test API endpoint directly with curl
- [ ] Check network tab in browser dev tools
- [ ] Verify SSL/HTTPS is working

---

## 📞 Get Help

### Resources:
- [ ] Read `RAILWAY_DEPLOYMENT_GUIDE.md` (detailed Railway guide)
- [ ] Read `VERCEL_DEPLOYMENT_GUIDE.md` (detailed Vercel guide)
- [ ] Read `DEPLOYMENT_COMPARISON.md` (platform comparison)
- [ ] Check Railway Discord: https://discord.gg/railway
- [ ] Check Vercel Discord: https://discord.gg/vercel

---

## ✅ Deployment Complete!

Once all items are checked:
- [ ] Backend is deployed and running
- [ ] All environment variables configured
- [ ] Database connected successfully
- [ ] Frontend can communicate with backend
- [ ] All features tested and working
- [ ] Real-time features working (Railway only)
- [ ] Monitoring set up (optional)

---

## 🎉 Next Steps After Deployment

1. **Monitor Your App:**
   - Check logs regularly
   - Set up error tracking
   - Monitor performance metrics

2. **Optimize Performance:**
   - Add database indexes
   - Enable caching where appropriate
   - Optimize slow queries

3. **Security:**
   - Review environment variables
   - Enable rate limiting
   - Set up security headers
   - Keep dependencies updated

4. **Scaling:**
   - Monitor resource usage
   - Plan for traffic growth
   - Consider CDN for static assets
   - Implement load balancing if needed

---

**Good luck with your deployment! 🚀🌱**

**Recommended: Use Railway for full Socket.IO support!**

