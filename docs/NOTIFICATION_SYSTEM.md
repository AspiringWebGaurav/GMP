# Notification System Documentation

## Overview

The GMP application now has a comprehensive, centralized notification system with both in-app notifications and toast messages. All notifications are synchronized across the entire application and stored in Firebase.

## Features

### 1. **Dynamic Notification Bell**

- Real-time notification count badge
- Fully responsive dropdown panel (mobile & desktop)
- Unread notification indicator
- Individual notification actions (mark as read, delete)
- Bulk actions (mark all as read, clear all)
- Smooth animations and transitions

### 2. **Centralized Toast System**

- Position: Top-right corner
- Auto-dismiss after 4 seconds
- Rich colors for different notification types
- Close button for manual dismissal
- Consistent styling across the app

### 3. **Notification Types**

- `login` - User login events
- `logout` - User logout events
- `timesheet` - Timesheet entry operations (add/update/delete)
- `version` - Version notes create/update
- `error` - Error notifications
- `success` - Success messages
- `info` - Informational messages
- `warning` - Warning messages
- `system` - System notifications

## Architecture

### Files Created

1. **`src/types/notification.ts`**

   - TypeScript types and interfaces for notifications
   - `Notification`, `NotificationType`, `CreateNotificationInput`

2. **`src/contexts/NotificationContext.tsx`**

   - React Context for notification state management
   - Provides hooks and methods for notification operations
   - Automatically registers notification service

3. **`src/lib/notificationHelpers.ts`**

   - Helper functions for creating specific notification types
   - `createAuthNotification()` - Login/logout notifications
   - `createTimesheetNotification()` - Timesheet operation notifications
   - `createVersionNotification()` - Version notes notifications
   - `createErrorNotification()` - Error notifications

4. **`src/lib/utils.ts`**

   - Utility functions for date formatting
   - `formatDistanceToNow()` - Relative time formatting
   - `formatDate()` - Absolute date formatting
   - `cn()` - Class name utility

5. **`src/app/api/notifications/route.ts`**

   - API routes for notification CRUD operations
   - GET - Fetch user notifications
   - POST - Create new notification
   - PATCH - Update notification (mark as read)
   - DELETE - Delete notification(s)

6. **`src/components/NotificationBell.tsx`**
   - Fully responsive notification bell component
   - Dropdown with notification list
   - Actions for individual and bulk operations

### Files Modified

1. **`src/app/layout.tsx`**

   - Added `NotificationProvider` wrapper

2. **`src/components/providers/ToasterProvider.tsx`**

   - Updated position to `top-right`
   - Added configuration for close button and duration

3. **`src/lib/auth.ts`**

   - Added notification creation on login/logout

4. **`src/components/Navbar.tsx`**

   - Updated logout handler to use centralized notification

5. **Timesheet Components** (Desktop & Mobile)

   - `src/components/TimeTracker.tsx`
   - `src/components/ModernTimesheet.tsx`
   - `src/components/ModernTimesheetMobile.tsx`
   - Integrated notification helpers for all operations

6. **Version Notes Components** (Desktop & Mobile)
   - `src/components/VersionNotesManager.tsx`
   - `src/components/VersionNotesManagerMobile.tsx`
   - Integrated notification helpers for version operations

## Usage

### Using the Notification Hook

```typescript
import { useNotifications } from "@/contexts/NotificationContext";

function MyComponent() {
  const {
    notifications,
    unreadCount,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    showToast,
  } = useNotifications();

  // Create a notification
  const handleAction = async () => {
    await createNotification({
      type: "success",
      title: "Action Successful",
      message: "Your action was completed successfully",
      data: { additionalInfo: "value" },
    });
  };

  // Show a toast
  const handleQuickToast = () => {
    showToast("success", "Quick action completed!");
  };

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      <button onClick={handleAction}>Create Notification</button>
      <button onClick={handleQuickToast}>Show Toast</button>
    </div>
  );
}
```

### Using Helper Functions

```typescript
import {
  createAuthNotification,
  createTimesheetNotification,
  createVersionNotification,
  createErrorNotification,
} from "@/lib/notificationHelpers";

// Login notification
await createAuthNotification("login", user);

// Timesheet notification
await createTimesheetNotification("add", { loginTime: "..." });

// Version notification
await createVersionNotification("create", "v1.2.3");

// Error notification
await createErrorNotification("Something went wrong", "Context");
```

### Direct Toast Usage

While we have a centralized toast system, you can still use `toast` directly from `sonner`:

```typescript
import { toast } from "sonner";

toast.success("Success message");
toast.error("Error message");
toast.info("Info message");
toast.warning("Warning message");
```

## Notification Bell UI

The notification bell is automatically included in the Navbar and shows:

- **Badge**: Number of unread notifications (up to 99+)
- **Dropdown Panel**:
  - Notification list with icons by type
  - Unread indicator (blue dot)
  - Individual delete buttons
  - Bulk action buttons (mark all read, clear all)
  - Empty state when no notifications
  - Loading state during fetch

## Responsive Design

### Desktop

- Notification dropdown: 420px wide
- Max height: 600px
- Right-aligned from bell icon

### Mobile

- Notification dropdown: Full width minus margins
- Max height: 70vh
- Scrollable content
- Touch-optimized buttons

### Toast

- Fixed position: top-right
- Stacks vertically when multiple
- Auto-adjusts on mobile screens

## Firebase Structure

Notifications are stored in the `notifications` collection with the following structure:

```javascript
{
  userId: string,           // User ID
  type: string,            // Notification type
  title: string,           // Notification title
  message: string,         // Notification message
  read: boolean,           // Read status
  createdAt: Timestamp,    // Creation timestamp
  data: object            // Additional metadata
}
```

## Customization

### Toast Styling

Edit `src/components/providers/ToasterProvider.tsx`:

```typescript
<Toaster
  position="top-right" // Change position
  richColors
  expand={true}
  closeButton
  duration={4000} // Change duration
  toastOptions={{
    style: {
      padding: "16px", // Custom styling
    },
    className: "toast-custom",
  }}
/>
```

### Notification Bell Styling

The notification bell uses Tailwind CSS with light/dark mode support. Edit `src/components/NotificationBell.tsx` to customize colors, spacing, and layout.

### Adding New Notification Types

1. Add type to `src/types/notification.ts`:

```typescript
export type NotificationType = "existing-types" | "your-new-type";
```

2. Add helper function in `src/lib/notificationHelpers.ts`:

```typescript
export async function createYourNotification(data: any) {
  if (!notificationService) return;

  await notificationService.createNotification({
    type: "your-new-type",
    title: "Title",
    message: "Message",
    data,
  });

  notificationService.showToast("info", "Toast message");
}
```

3. Add icon/color in `NotificationBell.tsx` `getNotificationIcon()` function.

## Error Handling

All notification operations include graceful error handling:

- Failed API calls are logged but don't crash the app
- Network errors show user-friendly messages
- Offline state is handled automatically
- No notification spam on initial load

## Performance Considerations

- Notifications are fetched only when user is logged in
- Local state updates for immediate UI feedback
- Debounced API calls to prevent spam
- Efficient Firebase queries with proper indexing
- Automatic cleanup on component unmount

## Testing

To test the notification system:

1. **Login** - Check for login notification
2. **Add Timesheet Entry** - Check for creation notification
3. **Update Entry** - Check for update notification
4. **Delete Entry** - Check for delete notification
5. **Create Version Notes** - Check for version notification
6. **Logout** - Check for logout notification
7. **Mark as Read** - Test individual and bulk read
8. **Delete Notifications** - Test individual and clear all

## Future Enhancements

Potential improvements for the notification system:

- [ ] Real-time notifications using Firebase listeners
- [ ] Notification sound effects
- [ ] Browser push notifications
- [ ] Email notifications
- [ ] Notification preferences/settings
- [ ] Notification grouping by type
- [ ] Search and filter notifications
- [ ] Export notification history
- [ ] Notification templates
- [ ] Rich notification content (images, links)

## Troubleshooting

### Notifications not appearing

1. Check if user is logged in
2. Verify Firebase permissions
3. Check browser console for errors
4. Ensure NotificationProvider is wrapping the app

### Toast not showing

1. Verify ToasterProvider is in layout
2. Check toast position configuration
3. Ensure no z-index conflicts

### Badge count incorrect

1. Refresh notifications manually
2. Check Firebase query filters
3. Verify read status updates

## Support

For issues or questions about the notification system, check:

- Firebase console for notification data
- Browser DevTools console for errors
- Network tab for API call issues
