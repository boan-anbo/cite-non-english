/**
 * Test callback for verifying the ItemToCSLJSON interceptor mechanism
 *
 * This callback appends text to the CSL-JSON note field to demonstrate
 * that our interceptor is working correctly. It can be verified by:
 * 1. Right-click item → "Create Bibliography from Item" (tests Path 1: direct usage)
 * 2. Right-click item → "Export Item..." → CSL JSON (tests Path 2: translator)
 * 3. Check exported JSON or bibliography output for appended text
 *
 * Usage: For demonstration/testing only - should be disabled in production
 */

/**
 * Append test text to the note field of CSL-JSON output
 *
 * This proves the interceptor is catching itemToCSLJSON calls from BOTH code paths:
 * - Path 1: Zotero.Utilities.Item.itemToCSLJSON (direct usage)
 * - Path 2: Zotero.Utilities.Translate.prototype.itemToCSLJSON (translators)
 *
 * @param zoteroItem - Original Zotero item (unused in this test)
 * @param cslItem - CSL-JSON object to modify in-place
 */
export function testAppendToNote(zoteroItem: any, cslItem: any) {
  const appendText = "\nappended by our interceptor";

  if (cslItem.note) {
    // Append to existing note
    cslItem.note += appendText;
  } else {
    // Create new note field
    cslItem.note = "appended by our interceptor";
  }
}
