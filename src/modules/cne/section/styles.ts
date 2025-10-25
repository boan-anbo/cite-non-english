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
    .cne-language-select {
      background-color: #fff;
      color: #111;
      border: 1px solid #ccc;
      border-radius: 3px;
    }
    .cne-section-title {
      color: #222;
    }
    .cne-field-label,
    .cne-language-label {
      color: #666;
    }
    .cne-field-counter {
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
    .cne-live-preview {
      margin-top: 8px;
      padding: 8px;
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .cne-live-preview__summary {
      cursor: pointer;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .cne-live-preview__body {
      font-size: 11px;
      font-family: monospace;
      margin: 0;
      padding: 8px;
      background-color: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 3px;
      overflow: auto;
      max-height: 300px;
    }
    @media (prefers-color-scheme: dark) {
      .cne-language-select {
        color: #111;
        border-color: #3a3f47;
      }
      .cne-language-select option {
        background-color: #1f2025;
        color: #f2f4f8;
      }
      .cne-quick-language-buttons {
        border-bottom-color: #3a3a3a;
      }
      .cne-quick-btn {
        border-color: #4a4a4a;
        background: #2a2d33;
        color: #f0f0f0;
      }
      .cne-quick-btn:hover {
        border-color: #7fb0ff;
        background: #2f3d4f;
      }
      .cne-quick-btn.active {
        border-color: #8ab6ff;
        background: #30486b;
        color: #ffffff;
      }
      .cne-section-title {
        color: #f5f5f5;
      }
      .cne-field-label,
      .cne-language-label {
        color: #e0e0e0;
      }
      .cne-field-counter {
        color: #cccccc;
      }
      .cne-live-preview {
        background-color: #1f1f1f;
        border-color: #393939;
      }
      .cne-live-preview__body {
        background-color: #111217;
        border-color: #333;
        color: #e7e7e7;
      }
    }
  `;
}
