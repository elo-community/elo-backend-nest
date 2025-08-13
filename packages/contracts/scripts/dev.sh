#!/bin/bash

# Smart Contracts Development Script
echo "🚀 Starting Smart Contracts development environment..."

# Load environment variables
if [ -f ".env" ]; then
    echo "📁 Loading .env file..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  .env file not found, using default values"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Compile contracts
echo "🔨 Compiling smart contracts..."
npm run compile

# Start Hardhat node (optional)
echo "💡 Available commands:"
echo "   npm run compile     - Compile contracts"
echo "   npm run test        - Run tests"
echo "   npm run deploy:amoy - Deploy to Amoy network"
echo "   npm run deploy:very - Deploy to Very network"
echo ""
echo "🎯 Ready for development!" 