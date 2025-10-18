#!/bin/bash
# Open all languages snapshot HTML file in browser

echo "🌐 Opening all-languages snapshot in browser..."
echo ""

# Define the snapshot file
SNAPSHOT="test/csl-tests/snapshots/chicago-18th/en-US/all-languages.html"

# Check if file exists
if [ ! -f "$SNAPSHOT" ]; then
  echo "❌ Error: Snapshot not found: $SNAPSHOT"
  echo "   Run tests first: npm run test:snapshots"
  exit 1
fi

# Open in default browser
echo "Opening snapshot in browser..."
open "$SNAPSHOT"

echo ""
echo "✅ Opened snapshot in browser"
echo "   File: $SNAPSHOT"
