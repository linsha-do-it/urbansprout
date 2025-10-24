# Vercel Backend Deployment Guide for UrbanSprout

## ⚠️ Important Considerations

### Socket.IO Limitation
**Your backend uses Socket.IO for real-time features (notifications, chat, etc.).** Vercel uses serverless functions which are stateless and don't support persistent WebSocket connections. This means:

- ✅ REST API endpoints will work fine
- ❌ Socket.IO real-time features will NOT work on Vercel

### Recommended Alternative Solutions:
1. **Use Railway, Render, or Heroku** for the backend (they support WebSocket/Socket.IO)
2. **Deploy to a VPS** (DigitalOcean, AWS EC2, Google Cloud)
3. **Split your deployment**: 
   - Deploy stateless REST APIs to Vercel
   - Deploy Socket.IO server separately to Railway/Render
4. **Use Vercel Edge Functions** with a different real-time solution like Pusher or Ably

---

## 🚀 If You Still Want to Deploy to Vercel (REST API Only)

### Step 1: Prepare Your Backend

The `vercel.json` configuration file has been created in your `server/` directory.

### Step 2: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 3: Navigate to Server Directory

```bash
cd "/Users/linsha/Desktop/FINAL DRAFT OF PROJECT/UrbanSprout-main  Hosting/server"
```

### Step 4: Login to Vercel

```bash
vercel login
```

### Step 5: Set Up Environment Variables

Before deploying, you need to set up your environment variables on Vercel:

```bash
# Set each environment variable (replace with your actual values)
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add CORS_ORIGIN
vercel env add NODE_ENV
vercel env add SENDGRID_API_KEY
vercel env add EMAIL_FROM
vercel env add FRONTEND_URL
vercel env add MISTRAL_API_KEY
vercel env add RAZORPAY_KEY_ID
vercel env add RAZORPAY_KEY_SECRET
vercel env add FIREBASE_PROJECT_ID
vercel env add FIREBASE_PRIVATE_KEY
vercel env add FIREBASE_CLIENT_EMAIL
```

Or you can add them via the Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all required variables

### Step 6: Deploy

```bash
# Deploy to production
vercel --prod
```

Or for preview deployment:
```bash
vercel
```

### Step 7: Update Frontend API URL

After deployment, Vercel will provide you with a URL (e.g., `https://your-project.vercel.app`).

Update your frontend's API configuration to use this URL instead of `http://localhost:5001`.

---

## 🔧 Required Environment Variables

Make sure you have these environment variables set in Vercel:

### Database
- `MONGODB_URI` - Your MongoDB connection string

### Authentication
- `JWT_SECRET` - Secret key for JWT tokens
- `CORS_ORIGIN` - Your frontend URL (e.g., https://your-frontend.vercel.app)

### Email Service
- `SENDGRID_API_KEY` - SendGrid API key
- `EMAIL_FROM` - Sender email address
- `FRONTEND_URL` - Your frontend URL

### Payment Gateway
- `RAZORPAY_KEY_ID` - Razorpay key ID
- `RAZORPAY_KEY_SECRET` - Razorpay secret

### Firebase (if used)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`

### AI Service
- `MISTRAL_API_KEY` - For chatbot features

### General
- `NODE_ENV` - Set to "production"
- `PORT` - Vercel will handle this automatically

---

## 🐛 Troubleshooting

### Issue: Functions Timing Out
Vercel serverless functions have a 10-second timeout on the Hobby plan (60 seconds on Pro).
- Optimize slow database queries
- Add indexes to MongoDB collections
- Cache frequently accessed data

### Issue: Cold Starts
Serverless functions have cold start delays (especially after inactivity).
- Users may experience slower initial responses
- Consider using Vercel's Edge Functions for faster cold starts

### Issue: File Uploads
Vercel has a 4.5 MB request body limit for serverless functions.
- For larger files, use cloud storage (AWS S3, Cloudinary, etc.)
- Update your upload logic to use external storage

### Issue: Background Jobs/Cron Tasks
Vercel doesn't support long-running processes.
- Use Vercel Cron Jobs for scheduled tasks
- Or use external services like GitHub Actions, AWS Lambda

---

## 📝 Post-Deployment Checklist

- [ ] Test all API endpoints
- [ ] Verify database connectivity
- [ ] Check CORS configuration
- [ ] Test authentication flow
- [ ] Verify email service works
- [ ] Test payment gateway integration
- [ ] Monitor function execution times
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure custom domain (optional)
- [ ] Set up automatic deployments from Git

---

## 🎯 Recommended: Deploy to Railway Instead

If you need Socket.IO support, I recommend using **Railway.app**:

### Why Railway?
- ✅ Full Node.js support (not serverless)
- ✅ Socket.IO works perfectly
- ✅ Persistent connections
- ✅ Free tier available
- ✅ Easy deployment from GitHub
- ✅ Built-in database support

### Quick Railway Deployment:

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login:
```bash
railway login
```

3. Initialize project:
```bash
cd server
railway init
```

4. Add environment variables:
```bash
railway variables set MONGODB_URI="your-connection-string"
# ... add other variables
```

5. Deploy:
```bash
railway up
```

---

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Node.js Runtime](https://vercel.com/docs/runtimes#official-runtimes/node-js)
- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs)

---

## 💡 Need Help?

If you encounter issues or need help choosing the right platform, feel free to ask!

