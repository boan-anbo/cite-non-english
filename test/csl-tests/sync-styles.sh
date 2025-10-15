#!/bin/bash

# Sync CNE styles from production to test server
# Usage: ./sync-styles.sh [style-name]
# If no style name provided, syncs all styles

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STYLES_SOURCE="${PROJECT_ROOT}/styles/cne"
STYLES_DEST="${PROJECT_ROOT}/tools/citeproc-js-server/csl"

echo -e "${BLUE}Syncing CNE styles to test server...${NC}"
echo "Source: ${STYLES_SOURCE}"
echo "Destination: ${STYLES_DEST}"
echo

# Check if directories exist
if [ ! -d "$STYLES_SOURCE" ]; then
    echo "Error: Source directory not found: $STYLES_SOURCE"
    exit 1
fi

if [ ! -d "$STYLES_DEST" ]; then
    echo "Error: Destination directory not found: $STYLES_DEST"
    echo "Make sure citeproc-js-server is set up"
    exit 1
fi

# Sync specific style or all styles
if [ -n "$1" ]; then
    # Sync specific style
    STYLE_NAME="$1"
    if [ ! -f "${STYLES_SOURCE}/${STYLE_NAME}.csl" ]; then
        echo "Error: Style not found: ${STYLE_NAME}.csl"
        exit 1
    fi

    echo -e "${GREEN}✓${NC} Syncing ${STYLE_NAME}.csl"
    cp "${STYLES_SOURCE}/${STYLE_NAME}.csl" "${STYLES_DEST}/"
else
    # Sync all styles
    STYLE_COUNT=0
    for style in "${STYLES_SOURCE}"/*.csl; do
        if [ -f "$style" ]; then
            STYLE_BASENAME=$(basename "$style")
            echo -e "${GREEN}✓${NC} Syncing ${STYLE_BASENAME}"
            cp "$style" "${STYLES_DEST}/"
            ((STYLE_COUNT++))
        fi
    done

    echo
    echo -e "${GREEN}✓${NC} Synced ${STYLE_COUNT} style(s)"
fi

echo
echo -e "${BLUE}Done!${NC}"
echo "Styles are ready for testing."
echo
echo "To test:"
echo "  1. Start test server: cd tools/citeproc-js-server && node lib/citeServer.js"
echo "  2. Run tests: npm test"
