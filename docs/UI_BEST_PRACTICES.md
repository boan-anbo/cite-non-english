# Zotero 7 UI Component Best Practices

## Overview
This document outlines the best practices for creating UI components in Zotero 7, based on official documentation and the zotero-plugin-template examples.

## HTML Namespace in Zotero 7

Zotero 7 uses a hybrid XUL/HTML environment. All HTML elements must use the `html:` namespace prefix when used in XUL documents.

### Basic Element Creation

```typescript
// In onRender or when creating elements dynamically
{
  tag: "input",
  namespace: "html",  // REQUIRED for HTML elements
  attributes: {
    type: "text",
  }
}
```

### Common HTML Elements

- `<html:input>` - Text inputs, checkboxes, etc.
- `<html:textarea>` - Multi-line text inputs
- `<html:button>` - Buttons
- `<html:label>` - Labels for form controls
- `<html:div>` - Container elements

## Data Binding Pattern

### Two-Way Data Binding
The ztoolkit provides automatic two-way data binding using special attributes.

#### 1. Checkbox Binding

```typescript
const dialogData = {
  checkboxValue: true,  // Initial value
};

// Create checkbox element
{
  tag: "input",
  namespace: "html",
  attributes: {
    "data-bind": "checkboxValue",  // Binds to dialogData.checkboxValue
    "data-prop": "checked",         // Binds to the 'checked' property
    type: "checkbox",
  }
}
```

**Key points:**
- `data-bind`: Name of the property in your data object
- `data-prop`: "checked" for checkboxes (not "value")
- Changes in the checkbox automatically update `dialogData.checkboxValue`
- Changes to `dialogData.checkboxValue` automatically update the checkbox

#### 2. Text Input Binding

```typescript
const dialogData = {
  inputValue: "default text",  // Initial value
};

// Create input element
{
  tag: "input",
  namespace: "html",
  attributes: {
    "data-bind": "inputValue",   // Binds to dialogData.inputValue
    "data-prop": "value",         // Binds to the 'value' property
    type: "text",
  }
}
```

**Key points:**
- `data-bind`: Name of the property in your data object
- `data-prop`: "value" for text inputs
- Two-way binding: changes sync both ways automatically

#### 3. Complete Example from Template

```typescript
const dialogData: { [key: string | number]: any } = {
  inputValue: "test",
  checkboxValue: true,
  loadCallback: () => {
    console.log("Dialog opened!");
  },
  unloadCallback: () => {
    console.log("Dialog closed!");
  },
};

const dialogHelper = new ztoolkit.Dialog(10, 2)
  .addCell(3, 0, {
    tag: "label",
    namespace: "html",
    attributes: { for: "dialog-checkbox" },
    properties: { innerHTML: "bind:checkbox" },
  })
  .addCell(3, 1, {
    tag: "input",
    namespace: "html",
    id: "dialog-checkbox",
    attributes: {
      "data-bind": "checkboxValue",
      "data-prop": "checked",
      type: "checkbox",
    },
  })
  .addCell(4, 0, {
    tag: "label",
    namespace: "html",
    attributes: { for: "dialog-input" },
    properties: { innerHTML: "bind:input" },
  })
  .addCell(4, 1, {
    tag: "input",
    namespace: "html",
    id: "dialog-input",
    attributes: {
      "data-bind": "inputValue",
      "data-prop": "value",
      type: "text",
    },
  })
  .setDialogData(dialogData)
  .open("Dialog Example");
```

## Item Pane Section UI

### Creating Form Elements in Sections

When creating UI in `ItemPaneManager.registerSection()`, you can:

1. **Use innerHTML** (for simple static content):
```typescript
onRender: ({ body, item }) => {
  body.innerHTML = `
    <div style="padding: 10px;">
      <label for="title-input">Title:</label>
      <input type="text" id="title-input" />
    </div>
  `;
}
```

2. **Use ztoolkit.UI** (for complex dynamic content with data binding):
```typescript
onRender: ({ body, item }) => {
  const container = ztoolkit.UI.createElement(document, "div", {
    namespace: "html",
    children: [
      {
        tag: "label",
        namespace: "html",
        properties: { innerHTML: "Title:" },
      },
      {
        tag: "input",
        namespace: "html",
        attributes: { type: "text" },
      }
    ]
  });
  body.appendChild(container);
}
```

3. **Use bodyXHTML** (declarative approach):
```typescript
Zotero.ItemPaneManager.registerSection({
  paneID: "example",
  pluginID: addon.data.config.addonID,
  bodyXHTML: `
    <html:div style="padding: 10px;">
      <html:label>Title:</html:label>
      <html:input type="text" />
    </html:div>
  `,
  onRender: ({ body, item }) => {
    // Access and manipulate elements
    const input = body.querySelector('input');
  }
});
```

## CSS Best Practices

### Modern CSS Over Mozilla-Specific Properties

❌ **Don't use:**
- `-moz-box`
- `-moz-box-flex`
- XUL box model

✅ **Do use:**
- CSS Flexbox: `display: flex`
- CSS Grid: `display: grid`
- Standard CSS properties

### Example

```css
/* Bad - Old Mozilla way */
.container {
  display: -moz-box;
  -moz-box-orient: vertical;
}

/* Good - Modern CSS */
.container {
  display: flex;
  flex-direction: column;
}
```

## Attributes Migration

| Old (XUL)      | New (HTML/Modern) |
|----------------|-------------------|
| `tooltiptext`  | `title`           |
| `<textbox>`    | `<html:input>`    |
| `flex="1"`     | `style="flex: 1"` |

## Localization

Use Fluent for all UI strings:

```typescript
// In HTML
<html:label data-l10n-id="citecjk-field-title-original">Title (Original)</html:label>

// In .ftl file
citecjk-field-title-original = Title (Original)
```

## Namespace Best Practices

Always namespace your IDs and classes to avoid conflicts:

```typescript
// Good
id: "citecjk-title-input"
class: "citecjk-field-container"

// Bad
id: "title-input"
class: "container"
```

## Summary Checklist

When creating UI components:

- [ ] Use `namespace: "html"` for all HTML elements
- [ ] Use `data-bind` and `data-prop` for two-way data binding
- [ ] Use `data-prop="checked"` for checkboxes
- [ ] Use `data-prop="value"` for text inputs
- [ ] Use modern CSS (flexbox/grid) instead of XUL box model
- [ ] Use `title` instead of `tooltiptext`
- [ ] Namespace all IDs and classes with plugin prefix
- [ ] Use Fluent (`data-l10n-id`) for localization
- [ ] Prefer `<html:input>` over `<textbox>`

## References

- Official Guide: https://www.zotero.org/support/dev/zotero_7_for_developers
- Template Example: `src/modules/examples.ts` (dialogExample function, line 600)
- Type Definitions: `node_modules/zotero-types/types/xpcom/pluginAPI/itemPaneManager.d.ts`
