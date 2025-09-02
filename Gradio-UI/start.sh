#!/bin/bash

# Script to set up and run the Gradio UI

echo "🚀 Setting up Gradio UI for AI Image Generation..."

# Check if Python is installed
if ! command -v python3 &> /dev/null
then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null
then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

echo "🔧 Checking backend server..."
if curl -f -s http://localhost:4001/ > /dev/null; then
    echo "✅ Backend server is running at http://localhost:4001"
else
    echo "⚠️  Backend server is not responding at http://localhost:4001"
    echo "   Please start your Node.js backend server first:"
    echo "   cd .. && npm run dev"
    echo ""
    echo "   Continuing anyway - you can start the backend later..."
fi

echo "🎨 Starting Gradio UI..."
echo "📱 The interface will be available at: http://localhost:7860"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

python3 app.py
