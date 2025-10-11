#!/bin/bash
# Rebuild script for cite-cjk plugin
# Use this when hot-reload doesn't properly update the UI

echo "🔄 Stopping existing build processes..."

# Kill any running npm start processes for this project
pkill -f "zotero-plugin serve" || true

# Wait a moment for processes to fully terminate
sleep 1

echo "🧹 Build processes stopped"
echo ""
echo "🚀 Starting fresh build..."
echo ""
echo "⚠️  After the build completes, you'll need to:"
echo "   1. Click on a different item in Zotero"
echo "   2. Click back to refresh the UI"
echo ""

# Start the build
npm start
