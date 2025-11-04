/**
 * CHANGELOG CONFIGURATION
 *
 * This file manages the version history of the application.
 * The version system is FULLY DYNAMIC and automatically synchronized across:
 * - package.json
 * - version.ts (imports from CHANGELOG[0].version)
 * - All UI components displaying version
 *
 * HOW TO ADD A NEW VERSION:
 * 1. Add new version entry at the TOP of the CHANGELOG array (newest first)
 * 2. Update package.json version to match (without 'v' prefix)
 * 3. The version will automatically update everywhere in the app
 *
 * VERSION FORMAT: "vX.Y.Z" (e.g., "v0.1.2")
 * DATE FORMAT: "YYYY-MM-DD" (e.g., "2025-11-03")
 */

export interface VersionLog {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: VersionLog[] = [
  {
    version: "v0.0.0",
    date: "2025-11-04",
    changes: ["Initial setup", "Application base structure"],
  },
  // Add new versions here - newest first
];
