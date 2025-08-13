#!/bin/bash

# NestJS Backend Development Script
echo "🚀 Starting NestJS Backend in development mode..."

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

# Start development server
echo "🌐 Starting development server on port ${PORT:-3000}..."
npm run start:dev 