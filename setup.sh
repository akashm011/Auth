#!/bin/bash

# Authentication System - Quick Setup Script

echo "🚀 Starting Authentication System Setup..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed successfully"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local file not found!"
    echo "📝 Creating .env.local template..."
    cp .env.local.example .env.local 2>/dev/null || cat > .env.local << 'EOF'
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this

# MongoDB
MONGODB_URI=your-mongodb-uri

# Email Configuration
EMAIL_FROM=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# OAuth Providers
GOOGLE_ID=your-google-id
GOOGLE_SECRET=your-google-secret
GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret

# Admin
ADMIN_EMAIL=admin@yourapp.com
NEXT_PUBLIC_ADMIN_EMAIL=admin@yourapp.com
EOF
    
    echo "✓ Created .env.local template"
    echo "📋 Please update .env.local with your credentials:"
    echo "   - MongoDB connection string"
    echo "   - Gmail app password"
    echo "   - Google OAuth credentials"
    echo "   - GitHub OAuth credentials"
    echo ""
fi

echo "🎉 Setup complete!"
echo ""
echo "📖 Next steps:"
echo "1. Update .env.local with your credentials"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:3000"
echo ""
echo "📚 For detailed setup instructions, see README.md"
