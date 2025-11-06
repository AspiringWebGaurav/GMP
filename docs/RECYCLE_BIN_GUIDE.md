# Recycle Bin System Documentation

## Overview

The Recycle Bin system provides a comprehensive soft-delete mechanism across the GMP application. When users delete items from Todos, Timesheet, or Time Tracker, they are moved to the Recycle Bin instead of being permanently deleted. Items in the Recycle Bin are automatically deleted after 15 or 30 days (user-configurable).

## Architecture

### Components

1. **RecycleBinContext** (`src/contexts/RecycleBinContext.tsx`)

   - Global state management for deleted items
   - Auto-cleanup functionality for expired items
   - CRUD operations for recycle bin items
   - Statistics tracking

2. **RecycleBin Component** (`src/components/RecycleBin.tsx`)

   - Desktop/tablet view with full feature set
   - Advanced filtering and sorting
   - Batch operations
   - Detailed item preview

3. **RecycleBinMobile Component** (`src/components/RecycleBinMobile.tsx`)

   - Mobile-optimized interface
   - Touch-friendly interactions
   - Simplified UI for smaller screens

4. **Type Definitions** (`src/types/recycleBin.ts`)
   - TypeScript interfaces for type safety
   - Source tracking (todo, timesheet, time-tracker, notification)

### Storage

- Uses `localStorage` for persistence
- Data stored per user: `recycleBin_${userId}`
- Automatic cleanup on expired items (checked every minute)

## Features

### 1. **Multi-Source Support**

- Todos
- Timesheet entries
- Time Tracker logs
- Notifications (future)

### 2. **Smart Expiry Management**

- Default: 15 days
- Extendable to: 30 days
- User can toggle between 15/30 days per item
- Auto-deletion after expiry

### 3. **Advanced Filtering**

- Filter by source type
- Search across all item data
- Sort by: Deleted date, Expiry date, Source type
- Ascending/Descending order

### 4. **Batch Operations**

- Empty entire bin (with confirmation)
- Filter-based management
- Bulk status viewing

### 5. **Item Actions**

- **Restore**: Return item to original location
- **Extend Expiry**: Toggle between 15/30 days
- **Permanent Delete**: Remove forever (with confirmation)
- **View Details**: Expandable JSON view

### 6. **Visual Indicators**

- Color-coded source badges
- Expiring soon warnings (< 24 hours)
- Item count in Navbar
- Statistics dashboard

## Integration Points

### 1. TodoList & TodoListMobile

```typescript
const { moveToRecycleBin } = useRecycleBin();

const handleDeleteTodo = async (id: string) => {
  const todoToDelete = todos.find((todo) => todo.id === id);
  await moveToRecycleBin("todo", todoToDelete, id);
  // Remove from active list
};
```

### 2. TimeTracker & TimeTrackerMobile

```typescript
const handleDeleteLog = async (id: string) => {
  const logToDelete = logs.find((log) => log.id === id);
  // Delete from backend first
  await fetch(`/api/time-logs?id=${id}`, { method: "DELETE" });
  // Then move to recycle bin
  await moveToRecycleBin("time-tracker", logToDelete, id);
};
```

### 3. ModernTimesheet & ModernTimesheetMobile

```typescript
const handleDeleteEntry = async (id: string) => {
  const entryToDelete = entries.find((entry) => entry.id === id);
  // Delete from backend first
  await fetch(`/api/timesheet?id=${id}`, { method: "DELETE" });
  // Then move to recycle bin
  await moveToRecycleBin("timesheet", entryToDelete, id);
};
```

### 4. Navigation (Navbar)

- Recycle Bin icon with item count badge
- Click to navigate to `/recycle-bin`
- Real-time count updates

## Data Structure

### RecycleBinItem

```typescript
{
  id: string;                    // Unique recycle bin entry ID
  originalId: string;            // Original item ID
  userId: string;                // Owner user ID
  source: RecycleBinItemSource;  // "todo" | "timesheet" | "time-tracker" | "notification"
  data: any;                     // Complete original item data
  deletedAt: string;             // ISO timestamp
  expiryDate: string;            // ISO timestamp (15 or 30 days from deletion)
  expiryDays: 15 | 30;          // Current expiry setting
  deletedBy?: string;            // User who deleted (for audit)
}
```

### RecycleBinStats

```typescript
{
  total: number; // Total items in bin
  todos: number; // Todo count
  timesheets: number; // Timesheet count
  timeLogs: number; // Time log count
  notifications: number; // Notification count
  expiringWithin24Hours: number; // Items expiring soon
}
```

## API Reference

### Context Methods

#### `moveToRecycleBin(source, data, originalId)`

Moves an item to the recycle bin.

- **source**: Item source type
- **data**: Complete item data
- **originalId**: Original item ID
- **Returns**: Promise<void>

#### `restoreItem(recycleBinId)`

Restores an item from recycle bin.

- **recycleBinId**: Recycle bin entry ID
- **Returns**: Promise<any> (restored item data)

#### `permanentlyDelete(recycleBinId)`

Permanently deletes an item.

- **recycleBinId**: Recycle bin entry ID
- **Returns**: Promise<void>

#### `permanentlyDeleteAll()`

Empties the entire recycle bin (with confirmation).

- **Returns**: Promise<void>

#### `extendExpiry(recycleBinId, days)`

Changes expiry period for an item.

- **recycleBinId**: Recycle bin entry ID
- **days**: 15 or 30
- **Returns**: Promise<void>

#### `getFilteredItems(filters?)`

Gets filtered and sorted items.

- **filters**: Optional RecycleBinFilters object
- **Returns**: RecycleBinItem[]

#### `refreshItems()`

Reloads items from storage.

- **Returns**: void

## User Experience

### Desktop Flow

1. User deletes an item (Todo/Timesheet/Time Log)
2. Confirmation dialog: "Move this item to Recycle Bin?"
3. Item moves to Recycle Bin with toast notification showing expiry
4. Item appears in Recycle Bin with 15-day default expiry
5. User can restore, extend expiry, or permanently delete
6. After expiry, item auto-deletes with notification

### Mobile Flow

- Similar to desktop but with mobile-optimized UI
- Touch-friendly buttons
- Simplified view with essential actions
- Filter tabs instead of dropdowns

## Best Practices

### 1. **Always capture item before deletion**

```typescript
const itemToDelete = items.find((item) => item.id === id);
if (!itemToDelete) return;
await moveToRecycleBin(source, itemToDelete, id);
```

### 2. **Backend deletion before Recycle Bin**

For API-backed items (timesheet, time-tracker):

```typescript
await fetch(`/api/endpoint?id=${id}`, { method: "DELETE" });
await moveToRecycleBin(source, itemData, id);
```

### 3. **Restore handling**

```typescript
const restoredData = await restoreItem(recycleBinId);
if (restoredData) {
  // Re-insert into original location
  // Update localStorage or API
}
```

### 4. **User confirmation**

Always confirm before permanent actions:

```typescript
if (!confirm("Move to Recycle Bin?")) return;
```

## Future Enhancements

1. **Backend Integration**

   - Store recycle bin in Firestore/database
   - Sync across devices
   - Server-side auto-cleanup

2. **Advanced Features**

   - Undo within 5 seconds
   - Scheduled deletion times
   - Archive instead of delete
   - Export deleted items

3. **Analytics**

   - Deletion patterns
   - Recovery rates
   - Storage usage

4. **Notifications**
   - Email before expiry
   - Weekly summary
   - Recovery reminders

## Troubleshooting

### Items not appearing in Recycle Bin

- Check if `RecycleBinProvider` wraps the app in `layout.tsx`
- Verify `useRecycleBin()` hook is called in component
- Check browser console for errors

### Auto-cleanup not working

- Context checks every 60 seconds
- Ensure user is authenticated
- Check localStorage quota

### Restore not working

- Verify restore logic in each component
- Check localStorage permissions
- Ensure API endpoints exist for timesheet/time-tracker

## Performance Considerations

- **localStorage limits**: ~5-10MB depending on browser
- **Auto-cleanup interval**: 60 seconds (adjustable)
- **Large datasets**: Consider pagination if >1000 items
- **Memory usage**: Items stored in context state

## Security

- User-scoped storage: `recycleBin_${userId}`
- No cross-user access
- Client-side only (consider backend for sensitive data)
- XSS protection via React's built-in escaping

## Compliance

- GDPR: Users can permanently delete data
- Data retention: Configurable (15/30 days)
- Audit trail: `deletedBy` field tracks deletions
- Right to be forgotten: `permanentlyDeleteAll()`

---

**Version**: 1.0.0  
**Last Updated**: November 6, 2025  
**Maintainer**: GMP Team
