# Version Management System

This directory contains the centralized version management configuration for GMP (Gaurav Management Panel).

## 📁 Files

### `version.ts`

- **Purpose**: Exports the current application version
- **Source**: Automatically imports from `CHANGELOG[0].version`
- **Usage**: Import `VERSION` constant in any component

```typescript
import { VERSION } from "@/app/config/version";
```

### `changelog.ts`

- **Purpose**: Single source of truth for all version history
- **Structure**: Array of version logs with version number, date, and changes
- **Auto-sync**: The latest entry automatically becomes the app version

## 🔄 How It Works

The version system is **fully dynamic** and automatically synchronized:

```
CHANGELOG[0].version → version.ts → package.json → All UI Components
```

### Data Flow:

1. **CHANGELOG** (changelog.ts) - Master list of all versions
2. **VERSION** (version.ts) - Imports `CHANGELOG[0].version`
3. **Components** - Import and display VERSION
4. **package.json** - Manually kept in sync (without 'v' prefix)

## ✅ Adding a New Version

### Step 1: Update `changelog.ts`

Add a new entry at the **TOP** of the `CHANGELOG` array:

```typescript
export const CHANGELOG: VersionLog[] = [
  {
    version: "v0.2.0", // New version
    date: "2025-11-04",
    changes: ["Added new feature X", "Fixed bug Y", "Improved performance Z"],
  },
  // ... existing versions below
];
```

### Step 2: Update `package.json`

Update the version field (without 'v' prefix):

```json
{
  "name": "gaurav-management-panel",
  "version": "0.2.0" // Match changelog version
}
```

### Step 3: That's it! ✨

The version will automatically update across:

- Footer version display
- Changelog modal
- All components using `VERSION`

## 📋 Version Format

- **Changelog**: `"vX.Y.Z"` (with 'v' prefix)
- **package.json**: `"X.Y.Z"` (without 'v' prefix)

Example:

- Changelog: `"v0.1.2"`
- package.json: `"0.1.2"`

## 🎯 Best Practices

1. **Always add newest versions at the top** of CHANGELOG array
2. **Keep package.json in sync** with the latest changelog version
3. **Use semantic versioning**: MAJOR.MINOR.PATCH
   - MAJOR: Breaking changes
   - MINOR: New features (backwards compatible)
   - PATCH: Bug fixes
4. **Use consistent date format**: YYYY-MM-DD
5. **Be descriptive** in change descriptions

## 🔍 Components Using Version

- `VersionWithChangelog.tsx` - Clickable version with modal
- `Version.tsx` - Simple version display
- `Footer.tsx` - Uses VersionWithChangelog
- Export PDF feature in changelog modal

## 🚀 Future Dashboard Integration

This system is designed to be easily integrated with a future admin dashboard where you can:

- Add new versions through UI
- Edit existing changelog entries
- Auto-generate version numbers
- Export changelog in various formats
