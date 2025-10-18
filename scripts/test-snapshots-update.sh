#!/bin/bash
# Update CSL test snapshots
# Runs tests which will regenerate all snapshots

set -e

echo "📸 CSL Snapshot Update Mode"
echo "=============================="
echo ""
echo "Running tests to regenerate snapshots..."
echo ""

# Run tests (snapshot generator will run automatically)
npm test

echo ""
echo "📸 Snapshot generation complete!"
echo "   Review changes: git diff test/csl-tests/snapshots/"
echo "   Run tests: npm test"
