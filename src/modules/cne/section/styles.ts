/**
 * CSS styles for CNE (Cite Non-English) section
 * Centralized style management for better maintainability
 */

/**
 * Get all CSS styles for CNE section
 * @returns CSS string to be injected into style tag
 */
export function getCneStyles(): string {
  return `
    .cne-field-grid input[type="text"]:hover {
      border-color: #999 !important;
    }
    .cne-field-grid input[type="text"]:focus {
      border-color: #0066cc !important;
      outline: none;
    }
    .cne-input-wrapper {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .cne-clear-button {
      background: transparent;
      border: none;
      color: #999;
      cursor: pointer;
      padding: 4px;
      font-size: 16px;
      line-height: 1;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .cne-input-wrapper:hover .cne-clear-button {
      opacity: 1;
    }
    .cne-clear-button:hover {
      color: #666;
    }
    .cne-quick-language-buttons {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 6px;
      padding: 8px 0;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e0e0e0;
    }
    .cne-quick-btn {
      padding: 3px 10px;
      font-size: 12px;
      border: 1px solid #ccc;
      border-radius: 3px;
      background: #fff;
      cursor: pointer;
      transition: all 0.2s;
    }
    .cne-quick-btn:hover {
      border-color: #0066cc;
      background: #f0f7ff;
    }
    .cne-quick-btn.active {
      border-color: #0066cc;
      background: #e6f2ff;
      font-weight: 600;
    }
  `;
}
