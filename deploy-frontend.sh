#!/bin/bash

# UrbanSprout Frontend Deployment Script for Render
# This script helps prepare and deploy the frontend to Render

echo "🌱 UrbanSprout Frontend Deployment Script"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "client/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Found client directory"

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found. Please ensure it's created."
    exit 1
fi

echo "✅ Found render.yaml configuration"

# Test build locally
echo "🔨 Testing build locally..."
cd client

if ! npm install; then
    echo "❌ Error: Failed to install dependencies"
    exit 1
fi

if ! npm run build; then
    echo "❌ Error: Build failed"
    exit 1
fi

echo "✅ Local build successful"

# Check if dist directory was created
if [ ! -d "dist" ]; then
    echo "❌ Error: dist directory not found after build"
    exit 1
fi

echo "✅ Build artifacts created"

cd ..

echo ""
echo "🚀 Ready for Render deployment!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Go to render.com and create a new Blueprint"
echo "3. Connect your GitHub repository"
echo "4. Render will automatically detect render.yaml"
echo "5. Review and apply the configuration"
echo ""
echo "📋 Environment variables to verify in Render:"
echo "- VITE_API_BASE_URL: https://your-backend-url.onrender.com/api"
echo "- VITE_FIREBASE_API_KEY: AIzaSyDyyL7LDD2DeZmfetNvzdY8QZ5-eUJqHwU"
echo "- VITE_FIREBASE_AUTH_DOMAIN: urbansprout-bc137.firebaseapp.com"
echo "- VITE_FIREBASE_PROJECT_ID: urbansprout-bc137"
echo "- VITE_FIREBASE_STORAGE_BUCKET: urbansprout-bc137.firebasestorage.app"
echo "- VITE_FIREBASE_MESSAGING_SENDER_ID: 793698516798"
echo "- VITE_FIREBASE_APP_ID: 1:793698516798:web:e87815785ae0b3575d766f"
echo ""
echo "📖 For detailed instructions, see RENDER_FRONTEND_DEPLOYMENT.md"
