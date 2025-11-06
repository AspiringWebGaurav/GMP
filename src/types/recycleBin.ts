// Recycle Bin Types
export type RecycleBinItemSource =
  | "todo"
  | "timesheet"
  | "time-tracker"
  | "notification";

export interface RecycleBinItem {
  id: string; // Unique ID for the recycle bin entry
  originalId: string; // Original ID of the deleted item
  userId: string;
  source: RecycleBinItemSource;
  data: any; // The actual deleted item data
  deletedAt: string; // ISO timestamp when deleted
  expiryDate: string; // ISO timestamp when it will be auto-deleted (15 or 30 days)
  expiryDays: 15 | 30; // Current expiry setting
  deletedBy?: string; // User who deleted it (for tracking)
}

export interface RecycleBinStats {
  total: number;
  todos: number;
  timesheets: number;
  timeLogs: number;
  notifications: number;
  expiringWithin24Hours: number;
}

export interface RecycleBinFilters {
  source?: RecycleBinItemSource;
  searchTerm?: string;
  sortBy?: "deletedAt" | "expiryDate" | "source";
  sortOrder?: "asc" | "desc";
}
