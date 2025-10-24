#!/bin/bash

# UrbanSprout Vercel Deployment Script
echo "🌱 UrbanSprout Vercel Deployment Script"
echo "========================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI is not installed."
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
else
    echo "✅ Vercel CLI is already installed"
fi

echo ""
echo "⚠️  IMPORTANT REMINDER:"
echo "   This deployment will NOT support Socket.IO features!"
echo "   Consider using Railway or Render for full WebSocket support."
echo ""
read -p "Do you want to continue with Vercel deployment? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Deployment cancelled."
    exit 1
fi

echo ""
echo "🔐 Make sure you have set up your environment variables!"
echo "   You can do this via:"
echo "   1. Vercel Dashboard > Project Settings > Environment Variables"
echo "   2. Or using CLI: vercel env add VARIABLE_NAME"
echo ""
read -p "Have you configured all environment variables? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "⚠️  Please set up environment variables first."
    echo "   Required variables:"
    echo "   - MONGODB_URI"
    echo "   - JWT_SECRET"
    echo "   - CORS_ORIGIN"
    echo "   - SENDGRID_API_KEY"
    echo "   - EMAIL_FROM"
    echo "   - FRONTEND_URL"
    echo "   - RAZORPAY_KEY_ID"
    echo "   - RAZORPAY_KEY_SECRET"
    echo "   - MISTRAL_API_KEY"
    echo ""
    echo "Run this script again after setting up the variables."
    exit 1
fi

echo ""
echo "🚀 Starting Vercel deployment..."
echo ""

# Deploy to Vercel
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Update your frontend API URL to the Vercel deployment URL"
echo "   2. Test all API endpoints"
echo "   3. Verify database connectivity"
echo "   4. Note: Real-time features (Socket.IO) won't work on Vercel"
echo ""
echo "🎯 For full Socket.IO support, consider Railway:"
echo "   https://railway.app/"
echo ""

