# UrbanSprout Frontend Deployment Guide for Render

This guide will help you deploy the UrbanSprout frontend to Render.com.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **Backend Deployed**: Ensure your backend is already deployed and accessible

## Step-by-Step Deployment Process

### 1. Prepare Your Repository

Make sure your repository contains the following files:
- `render.yaml` (already created)
- Updated `client/src/utils/api.js` (uses environment variables)
- Updated `client/src/config/firebase.js` (uses environment variables)
- Updated `client/package.json` (includes build scripts)

### 2. Deploy to Render

#### Option A: Using render.yaml (Recommended)

1. **Connect Repository**:
   - Go to [render.com](https://render.com) and sign in
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Select your UrbanSprout repository

2. **Configure Blueprint**:
   - Render will automatically detect the `render.yaml` file
   - Review the configuration and click "Apply"

3. **Environment Variables**:
   The following environment variables will be automatically set:
   ```
   NODE_ENV=production
   VITE_API_BASE_URL=https://urbansprout-backend.onrender.com/api
   VITE_FIREBASE_API_KEY=AIzaSyDyyL7LDD2DeZmfetNvzdY8QZ5-eUJqHwU
   VITE_FIREBASE_AUTH_DOMAIN=urbansprout-bc137.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=urbansprout-bc137
   VITE_FIREBASE_STORAGE_BUCKET=urbansprout-bc137.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=793698516798
   VITE_FIREBASE_APP_ID=1:793698516798:web:e87815785ae0b3575d766f
   ```

#### Option B: Manual Setup

1. **Create Static Site**:
   - Go to [render.com](https://render.com) and sign in
   - Click "New +" → "Static Site"
   - Connect your GitHub repository

2. **Configure Build Settings**:
   - **Name**: `urbansprout-frontend`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/dist`
   - **Node Version**: `18` (or latest)

3. **Set Environment Variables**:
   Add the following environment variables in the Render dashboard:
   ```
   NODE_ENV=production
   VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
   VITE_FIREBASE_API_KEY=AIzaSyDyyL7LDD2DeZmfetNvzdY8QZ5-eUJqHwU
   VITE_FIREBASE_AUTH_DOMAIN=urbansprout-bc137.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=urbansprout-bc137
   VITE_FIREBASE_STORAGE_BUCKET=urbansprout-bc137.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=793698516798
   VITE_FIREBASE_APP_ID=1:793698516798:web:e87815785ae0b3575d766f
   ```

4. **Configure Routes**:
   - Go to "Settings" → "Redirects and Rewrites"
   - Add a rewrite rule:
     - **Source**: `/*`
     - **Destination**: `/index.html`

### 3. Update Backend URL

**Important**: Update the `VITE_API_BASE_URL` environment variable with your actual backend URL:
- If your backend is deployed on Render: `https://your-backend-service-name.onrender.com/api`
- If your backend is deployed elsewhere: `https://your-backend-domain.com/api`

### 4. Domain Configuration (Optional)

1. **Custom Domain**:
   - Go to your service settings
   - Click "Custom Domains"
   - Add your domain and follow DNS configuration instructions

2. **SSL Certificate**:
   - Render automatically provides SSL certificates
   - Your site will be available at `https://your-app-name.onrender.com`

### 5. Testing Your Deployment

1. **Check Build Logs**:
   - Monitor the build process in the Render dashboard
   - Ensure all dependencies install successfully
   - Verify the build completes without errors

2. **Test Functionality**:
   - Visit your deployed URL
   - Test user registration/login
   - Verify API calls work correctly
   - Check Firebase authentication

### 6. Troubleshooting

#### Common Issues:

1. **Build Failures**:
   - Check Node.js version compatibility
   - Ensure all dependencies are in `package.json`
   - Review build logs for specific errors

2. **API Connection Issues**:
   - Verify `VITE_API_BASE_URL` is correct
   - Check CORS settings on your backend
   - Ensure backend is accessible from Render

3. **Firebase Authentication Issues**:
   - Verify Firebase configuration
   - Check Firebase project settings
   - Ensure authorized domains include your Render URL

4. **Routing Issues**:
   - Ensure rewrite rules are configured
   - Check that all routes redirect to `index.html`

#### Debug Steps:

1. **Check Environment Variables**:
   ```bash
   # In Render dashboard, verify all environment variables are set
   ```

2. **Test API Connection**:
   ```bash
   curl https://your-backend-url.onrender.com/api/health
   ```

3. **Check Browser Console**:
   - Open browser developer tools
   - Look for JavaScript errors
   - Check network requests

### 7. Continuous Deployment

Render automatically redeploys when you push changes to your main branch. To disable this:
- Go to "Settings" → "Build & Deploy"
- Toggle "Auto-Deploy" off

### 8. Performance Optimization

1. **Enable Caching**:
   - Static assets are automatically cached
   - Configure cache headers for better performance

2. **CDN**:
   - Render uses a global CDN
   - Your site will be fast worldwide

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `VITE_API_BASE_URL` | Backend API URL | `https://backend.onrender.com/api` |
| `VITE_FIREBASE_API_KEY` | Firebase API key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | `1:123:web:abc` |

## Support

If you encounter issues:
1. Check Render's documentation: [render.com/docs](https://render.com/docs)
2. Review build logs in the Render dashboard
3. Test locally with production environment variables
4. Check browser console for client-side errors

## Next Steps

After successful deployment:
1. Update your domain DNS settings (if using custom domain)
2. Configure monitoring and alerts
3. Set up automated backups
4. Monitor performance and user analytics
