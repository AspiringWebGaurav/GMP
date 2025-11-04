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
    version: "v0.1.2",
    date: "2025-11-03",
    changes: [
      "Added pagination to version changelog modal",
      "Implemented slider navigation with arrows",
      "Added keyboard navigation (left/right arrow keys)",
      "Reduced font sizes on mobile for better readability",
      "Fixed modal height to prevent expansion with many logs",
      "Made version system fully dynamic across all files",
    ],
  },
  {
    version: "v0.1.1",
    date: "2025-11-03",
    changes: [
      "Enhanced version changelog display",
      "Added pagination dots for easy navigation",
      "Improved mobile responsiveness",
      "Added visual indicators for active version",
    ],
  },
  {
    version: "v0.1.0",
    date: "2025-11-03",
    changes: [
      "Initial release",
      "Firebase authentication integration",
      "Login page with desktop and mobile layouts",
      "Dashboard skeleton with navbar and footer",
      "Version management system",
    ],
  },
  // Add new versions here - newest first
];
