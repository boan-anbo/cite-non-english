/**
 * Error renderer for CNE section
 * Handles displaying error messages when section rendering fails
 */

/**
 * Render error message in the section
 *
 * @param body - Container element
 * @param error - Error object or message
 */
export function renderError(body: HTMLElement, error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : "";

  body.innerHTML = `
    <div style="padding: 20px; color: #d32f2f; font-family: monospace; font-size: 11px;">
      <p style="font-weight: bold; font-size: 13px;">Error loading non-English citation fields</p>
      <p style="margin-top: 8px; color: #666;">${errorMessage}</p>
      <details style="margin-top: 8px; font-size: 10px;">
        <summary style="cursor: pointer; color: #999;">Stack trace</summary>
        <pre style="margin-top: 4px; overflow-x: auto; color: #999;">${errorStack}</pre>
      </details>
    </div>
  `;
}