# Development Guide

## Quick Start

```bash
# Start development server with hot-reload
npm start

# Full rebuild (kills old processes and starts fresh)
npm run rebuild
```

## Important Development Notes

### UI Refresh Requirements

**Hot-reload has limitations**: While `npm start` provides hot-reload for code changes, it doesn't automatically refresh already-rendered UI sections in Zotero.

**When UI doesn't update after code changes:**

1. **Option 1 (Quick)**: Navigate in Zotero
   - Click on a different item
   - Click back to the original item
   - This forces the section to re-render

2. **Option 2 (Full Rebuild)**: Use the rebuild script
   ```bash
   npm run rebuild
   ```
   This script:
   - Kills all running build processes
   - Starts a fresh build
   - Then you still need to navigate away/back in Zotero to refresh the UI

### Data Flow Architecture

Our plugin follows Zotero's standard practice of real-time binding:

```
User types in field
    ↓
metadata.setFieldVariant()     // Update model (reusable logic)
    ↓
updateLivePreview()            // Update UI preview
updateFieldCounter()           // Update field counter
    ↓
debouncedSave()               // Auto-save to Extra field (500ms delay)
```

**Key principles:**
- All field operations go through model methods (`getFieldVariant`, `setFieldVariant`, etc.)
- No manual Save button - changes save automatically
- 500ms debounce prevents excessive saves while typing
- Live preview shows in-memory state before persistence

### Project Structure

```
src/modules/cjk/
├── model/                    # Data model (single source of truth)
│   ├── CjkMetadata.ts       # Main metadata class
│   └── extraFieldParser.ts  # Extra field serialization
├── ui/                       # UI components
│   ├── components.ts        # Reusable component builders
│   └── fieldBuilder.ts      # Field group builders
├── section/                  # ItemPane section
│   ├── register.ts          # Register with ItemPaneManager
│   └── renderer.ts          # Render logic with data binding
├── types.ts                 # TypeScript types
└── constants.ts             # Constants and helpers
```

### Adding New Fields

To add a new field (e.g., "author"):

1. **Add to types** (`types.ts`):
   ```typescript
   export type CjkFieldName = "title" | "booktitle" | "publisher" | "journal" | "series" | "author";
   ```

2. **Add to constants** (`constants.ts`):
   ```typescript
   export const SUPPORTED_FIELDS: readonly FieldConfig[] = [
     // ... existing fields
     { name: "author", label: "Author", l10nKey: "citecjk-field-author" },
   ];
   ```

3. **Update interface** (`types.ts`):
   ```typescript
   export interface CjkMetadataData {
     // ... existing fields
     author?: CjkFieldData;
   }
   ```

That's it! The field will automatically get:
- Three input boxes (original, English, romanized)
- Data binding with the model
- Live preview updates
- Auto-save to Extra field
- Field counter tracking

### Console Debugging

The plugin logs extensively. Open Zotero's developer console (Tools → Developer → Error Console) to see:
- Section rendering logs
- Data binding setup logs
- Field update logs
- Save operation logs

### Testing

```bash
# Run tests
npm test

# Type checking
npm run build

# Lint
npm run lint:check
npm run lint:fix
```

## Common Issues

### Issue: "Changes are saved automatically" shows but no auto-save happens

**Cause**: Build might not have picked up the latest changes

**Solution**:
```bash
npm run rebuild
```
Then navigate to a different item and back in Zotero.

### Issue: TypeError or undefined errors in console

**Cause**: Model methods not being called correctly

**Solution**: Check that all field operations use model methods:
- Use `metadata.getFieldVariant(field, variant)` to read
- Use `metadata.setFieldVariant(field, variant, value)` to write
- Use `metadata.hasFieldData(field)` to check

### Issue: Extra field not updating

**Cause**: Save method might be failing silently

**Solution**: Check console for save errors. Verify:
- Item is not read-only
- Extra field parser is working correctly
- `metadata.save()` is being called

## Release Process

```bash
# Update version in package.json
# Then build and release
npm run release
```
