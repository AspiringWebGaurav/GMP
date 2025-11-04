# 📝 Quick Reference: Adding a New Version

## TL;DR

1. Edit `src/app/config/changelog.ts` - Add new entry at top
2. Edit `package.json` - Update version number
3. Done! Version auto-updates everywhere ✨

---

## Step-by-Step Guide

### 1️⃣ Open `src/app/config/changelog.ts`

Add your new version at the **TOP** of the array:

```typescript
export const CHANGELOG: VersionLog[] = [
  {
    version: "v0.2.0",  // 👈 Your new version
    date: "2025-11-04",  // 👈 Today's date
    changes: [
      "Added amazing feature",
      "Fixed critical bug",
      "Improved performance",
    ],
  },
  // ... rest of the versions below
```

### 2️⃣ Open `package.json`

Update the version field (remove the 'v'):

```json
{
  "name": "gaurav-management-panel",
  "version": "0.2.0",  // 👈 Match changelog (no 'v')
```

### 3️⃣ Verify (Optional)

Run the verification script:

```bash
bash scripts/check-version-sync.sh
```

---

## ✅ What Happens Automatically

When you save the files, the version updates in:

- ✨ Footer (clickable version link)
- ✨ Version modal/changelog viewer
- ✨ PDF exports
- ✨ All components importing `VERSION`

---

## 🎨 Example: Adding Version 0.3.0

**Before:**

```typescript
export const CHANGELOG: VersionLog[] = [
  {
    version: "v0.1.2",
    date: "2025-11-03",
    changes: ["..."],
  },
  // ... more versions
];
```

**After:**

```typescript
export const CHANGELOG: VersionLog[] = [
  {
    version: "v0.3.0", // NEW!
    date: "2025-11-15",
    changes: [
      "Added user management dashboard",
      "Implemented real-time notifications",
      "Added dark mode support",
    ],
  },
  {
    version: "v0.1.2", // This moves down
    date: "2025-11-03",
    changes: ["..."],
  },
  // ... more versions
];
```

And in `package.json`:

```json
{
  "version": "0.3.0" // Updated!
}
```

---

## 🚨 Common Mistakes

❌ **DON'T** add new versions at the bottom
✅ **DO** add them at the top

❌ **DON'T** forget to update package.json
✅ **DO** keep both files in sync

❌ **DON'T** include 'v' in package.json
✅ **DO** use 'v' prefix in changelog.ts

---

## 🔢 Version Numbering Guide

Use semantic versioning:

- **Major (1.0.0)**: Breaking changes, major redesigns
- **Minor (0.1.0)**: New features, backwards compatible
- **Patch (0.0.1)**: Bug fixes, small improvements

Examples:

- `v0.1.0` → `v0.1.1` (bug fix)
- `v0.1.1` → `v0.2.0` (new feature)
- `v0.2.0` → `v1.0.0` (major release)
