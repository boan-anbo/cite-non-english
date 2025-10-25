/**
 * Creator change detection for CNE section
 * Detects when creators have changed in a Zotero item (count or content)
 */

/**
 * Generate a signature string from creator data
 * Used to detect changes in creator names or types
 *
 * @param creators - Array of Zotero creator objects
 * @returns A string signature representing the creators
 */
function getCreatorSignature(creators: any[]): string {
  return creators.map(c => {
    // Include all fields that might change
    const lastName = c.lastName || '';
    const firstName = c.firstName || '';
    const name = c.name || '';
    const typeID = c.creatorTypeID !== undefined ? c.creatorTypeID : '';

    return `${lastName}|${firstName}|${name}|${typeID}`;
  }).join(';');
}

/**
 * Check if the item's creators have changed compared to what's currently displayed
 * Detects both count changes and content changes (names, types)
 *
 * @param container - Container element with author fields
 * @param item - Zotero item
 * @returns true if creators have changed in any way
 */
export function checkCreatorsChanged(
  container: HTMLElement,
  item: Zotero.Item
): boolean {
  try {
    const currentCreators = item.getCreators();

    // Count displayed author field groups by looking for unique author field IDs
    // Each author has fields like "author-0-last-romanized", "author-1-last-romanized", etc.
    const displayedAuthorFields = container.querySelectorAll(
      '[id^="author-"][id$="-last-romanized"]'
    );
    const displayedCount = displayedAuthorFields.length;

    // Check for "No creators found" message (displayed when creators.length === 0)
    const hasNoCreatorsMessage = container.textContent?.includes("No creators found");

    if (currentCreators.length === 0 && hasNoCreatorsMessage) {
      // Both have 0 creators - no change
      return false;
    }

    if (currentCreators.length > 0 && hasNoCreatorsMessage) {
      // Item now has creators but we're showing "no creators" - needs refresh
      return true;
    }

    if (currentCreators.length === 0 && displayedCount > 0) {
      // Item has no creators but we're showing fields - needs refresh
      return true;
    }

    // Check count changes
    const countChanged = currentCreators.length !== displayedCount;

    // Check content changes using signature comparison
    const currentSignature = getCreatorSignature(currentCreators);
    const storedSignature = (container as any)._creatorSignature || '';
    const contentChanged = currentSignature !== storedSignature;

    // Determine if any change occurred
    const hasChanged = countChanged || contentChanged;

    if (hasChanged) {
      // Store new signature for next comparison
      (container as any)._creatorSignature = currentSignature;

      if (countChanged) {
        ztoolkit.log(
          `[CNE] Creators count changed: item has ${currentCreators.length}, displaying ${displayedCount}`
        );
      } else if (contentChanged) {
        ztoolkit.log(
          `[CNE] Creator names/types changed (count unchanged: ${currentCreators.length})`
        );
      }
    }

    return hasChanged;
  } catch (error) {
    ztoolkit.log("[CNE] Error checking creator changes:", error);
    return false; // Don't refresh on error
  }
}

/**
 * Update the stored creator signature after a successful refresh
 * Should be called after author fields are refreshed to sync the signature
 *
 * @param container - Container element
 * @param item - Zotero item
 */
export function updateCreatorSignature(
  container: HTMLElement,
  item: Zotero.Item
): void {
  try {
    const currentCreators = item.getCreators();
    const signature = getCreatorSignature(currentCreators);
    (container as any)._creatorSignature = signature;

    ztoolkit.log(`[CNE] Updated creator signature for ${currentCreators.length} creators`);
  } catch (error) {
    ztoolkit.log("[CNE] Error updating creator signature:", error);
  }
}
