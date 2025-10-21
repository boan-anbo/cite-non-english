#!/usr/bin/env bash
#
# check-upstream-versions.sh
#
# Checks CNE style templates against their upstream Zotero versions
# and reports differences.
#
# Usage:
#   ./check-upstream-versions.sh           # Check all styles
#   ./check-upstream-versions.sh --update  # Update outdated templates
#   ./check-upstream-versions.sh --diff    # Show full diffs for changed styles
#

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
UPDATE_MODE=false
SHOW_DIFF=false
while [[ $# -gt 0 ]]; do
  case $1 in
    --update)
      UPDATE_MODE=true
      shift
      ;;
    --diff)
      SHOW_DIFF=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--update] [--diff]"
      exit 1
      ;;
  esac
done

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Style configurations
# Format: "NAME|TEMPLATE_FILE|UPSTREAM_URL|STYLE_ID"
STYLES=(
  "APA 7th Edition|apa-7th-template.csl|https://www.zotero.org/styles/apa?source=1|http://www.zotero.org/styles/apa"
  "Chicago 18th (Author-Date)|chicago-author-date-template.csl|https://www.zotero.org/styles/chicago-author-date?source=1|http://www.zotero.org/styles/chicago-author-date"
  "Chicago 18th (Notes-Bib)|chicago-notes-bibliography-template.csl|https://www.zotero.org/styles/chicago-notes-bibliography?source=1|http://www.zotero.org/styles/chicago-notes-bibliography"
  "MLA 9th (in-text)|modern-language-association-template.csl|https://www.zotero.org/styles/modern-language-association?source=1|http://www.zotero.org/styles/modern-language-association"
  "MLA 9th (notes)|modern-language-association-notes-template.csl|https://www.zotero.org/styles/modern-language-association-notes?source=1|http://www.zotero.org/styles/modern-language-association-notes"
)

echo -e "${BLUE}=== Checking CNE Style Templates Against Upstream ===${NC}\n"

UPDATES_AVAILABLE=0
TOTAL_STYLES=${#STYLES[@]}

for style_config in "${STYLES[@]}"; do
  IFS='|' read -r NAME TEMPLATE_FILE UPSTREAM_URL STYLE_ID <<< "$style_config"

  echo -e "${BLUE}Checking: $NAME${NC}"
  echo "  Template: $TEMPLATE_FILE"

  # Check if local template exists
  if [[ ! -f "$TEMPLATE_FILE" ]]; then
    echo -e "  ${RED}✗ Local template not found${NC}"
    continue
  fi

  # Download upstream version to temp file
  TEMP_FILE=$(mktemp)
  trap "rm -f $TEMP_FILE" EXIT

  if ! curl -sf "$UPSTREAM_URL" -o "$TEMP_FILE" 2>/dev/null; then
    echo -e "  ${RED}✗ Failed to download upstream version${NC}"
    continue
  fi

  # Extract timestamps using sed (portable across macOS and Linux)
  LOCAL_UPDATED=$(sed -n 's/.*<updated>\([^<]*\)<\/updated>.*/\1/p' "$TEMPLATE_FILE" 2>/dev/null | head -1)
  REMOTE_UPDATED=$(sed -n 's/.*<updated>\([^<]*\)<\/updated>.*/\1/p' "$TEMP_FILE" 2>/dev/null | head -1)

  # Fallback to unknown if extraction failed
  [[ -z "$LOCAL_UPDATED" ]] && LOCAL_UPDATED="unknown"
  [[ -z "$REMOTE_UPDATED" ]] && REMOTE_UPDATED="unknown"

  echo "  Local:  $LOCAL_UPDATED"
  echo "  Remote: $REMOTE_UPDATED"

  # Compare timestamps
  if [[ "$LOCAL_UPDATED" == "$REMOTE_UPDATED" ]]; then
    echo -e "  ${GREEN}✓ Up to date${NC}\n"
  else
    echo -e "  ${YELLOW}⚠ Update available${NC}"
    UPDATES_AVAILABLE=$((UPDATES_AVAILABLE + 1))

    # Show diff if requested
    if [[ "$SHOW_DIFF" == true ]]; then
      echo -e "\n  ${BLUE}--- Changes ---${NC}"
      diff -u "$TEMPLATE_FILE" "$TEMP_FILE" || true
      echo ""
    fi

    # Update if requested
    if [[ "$UPDATE_MODE" == true ]]; then
      echo -e "  ${YELLOW}→ Updating template...${NC}"
      cp "$TEMP_FILE" "$TEMPLATE_FILE"
      echo -e "  ${GREEN}✓ Updated to $REMOTE_UPDATED${NC}\n"

      # Remind to update VERSION_INFO.md
      echo -e "  ${YELLOW}Remember to update VERSION_INFO.md with:${NC}"
      echo "    - Base Style Updated: $REMOTE_UPDATED"
      echo "    - Template Downloaded: $(date +%Y-%m-%d)"
      echo ""
    else
      echo -e "  ${YELLOW}Run with --update to download new version${NC}\n"
    fi
  fi

  rm -f "$TEMP_FILE"
done

# Summary
echo -e "${BLUE}=== Summary ===${NC}"
echo "Total styles checked: $TOTAL_STYLES"
if [[ $UPDATES_AVAILABLE -eq 0 ]]; then
  echo -e "${GREEN}All templates are up to date!${NC}"
else
  echo -e "${YELLOW}$UPDATES_AVAILABLE style(s) have updates available${NC}"
  if [[ "$UPDATE_MODE" == false ]]; then
    echo -e "Run with ${BLUE}--update${NC} to download new versions"
  fi
  if [[ "$SHOW_DIFF" == false ]]; then
    echo -e "Run with ${BLUE}--diff${NC} to see what changed"
  fi
fi

exit 0
