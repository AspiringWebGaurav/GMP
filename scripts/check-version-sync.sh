#!/bin/bash

# Version Sync Script
# This script helps verify that versions are in sync across files

echo "🔍 Checking version synchronization..."
echo ""

# Extract version from changelog.ts (first occurrence)
CHANGELOG_VERSION=$(grep -m 1 'version: "v' src/app/config/changelog.ts | sed 's/.*version: "v\(.*\)".*/\1/')

# Extract version from package.json
PACKAGE_VERSION=$(grep '"version":' package.json | sed 's/.*"version": "\(.*\)".*/\1/')

echo "📋 Version Status:"
echo "├─ CHANGELOG:    v$CHANGELOG_VERSION"
echo "├─ package.json:  $PACKAGE_VERSION"
echo "└─ version.ts:   (auto-synced from CHANGELOG)"
echo ""

# Check if they match
if [ "$CHANGELOG_VERSION" = "$PACKAGE_VERSION" ]; then
    echo "✅ All versions are in sync!"
    exit 0
else
    echo "⚠️  WARNING: Versions are out of sync!"
    echo ""
    echo "To fix this, update package.json version to: $CHANGELOG_VERSION"
    echo "Or update the latest CHANGELOG entry to match package.json"
    exit 1
fi
