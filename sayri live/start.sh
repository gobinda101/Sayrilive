#!/data/data/com.termux/files/usr/bin/bash
echo "========================================"
echo "   💖 SAYRI LIVE BOT - TERMUX RUNNER 💖"
echo "========================================"

if [ ! -d "node_modules" ]; then
    echo "📦 Installing required dependencies (first time only)..."
    npm install
fi

echo ""
echo "🎥 Enter your YouTube Live URL or Video ID:"
read LIVE_URL

if [ -z "$LIVE_URL" ]; then
    echo "❌ URL cannot be empty! Restarting..."
    exit 1
fi

echo "🚀 Starting server at http://localhost:3000 ..."
node server.js "$LIVE_URL"
