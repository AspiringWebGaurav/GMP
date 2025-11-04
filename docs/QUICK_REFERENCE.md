# Time Tracker - Quick Reference Card

## 🚀 Quick Start (3 Steps)

### Step 1: Deploy Firestore Rules

```bash
# Copy firestore.rules to Firebase Console
# OR use Firebase CLI:
firebase deploy --only firestore:rules
```

### Step 2: Create Index

```bash
# Option A: Use Firebase Console
# Firestore → Indexes → Add Composite Index
# Collection: timeLogs
# Fields: userId (Asc), loginTime (Desc)

# Option B: Use Firebase CLI
firebase deploy --only firestore:indexes
```

### Step 3: Test

```bash
# Navigate to: http://localhost:3000/dashboard
# Click: "Login/Logout" tab
# Click: "Auto Punch In"
# Click: "Save Time Log"
# Done! ✅
```

---

## 📁 File Locations

| Purpose               | File Path                        |
| --------------------- | -------------------------------- |
| Main Component        | `src/components/TimeTracker.tsx` |
| API Routes            | `src/app/api/time-logs/route.ts` |
| Dashboard Integration | `src/app/dashboard/page.tsx`     |
| Firestore Rules       | `firestore.rules`                |
| Indexes Config        | `firestore.indexes.json`         |
| Full Documentation    | `docs/TIME_TRACKER_GUIDE.md`     |
| Deployment Guide      | `docs/DEPLOYMENT_CHECKLIST.md`   |

---

## 🎯 Key Components

### TimeTracker Component

```typescript
import TimeTracker from "@/components/TimeTracker";

<TimeTracker />;
// No props needed - fully self-contained
```

### API Endpoints

```typescript
// GET - Fetch logs
GET /api/time-logs?userId={id}&startDate={iso}&endDate={iso}

// POST - Create log
POST /api/time-logs
Body: { userId, loginTime, logoutTime? }

// PUT - Update log
PUT /api/time-logs
Body: { id, loginTime?, logoutTime? }

// DELETE - Remove log
DELETE /api/time-logs?id={docId}
```

---

## 🗄️ Database Structure

### Collection: `timeLogs`

```typescript
{
  userId: string; // Auth user ID
  loginTime: Timestamp; // When punched in
  logoutTime: Timestamp; // When punched out (or null)
  workHours: number; // Auto-calculated
  createdAt: Timestamp; // Created timestamp
}
```

### Required Index

```
Collection: timeLogs
Fields: userId (ASC), loginTime (DESC)
```

---

## 🎨 Theme Classes

### Light Mode

```css
.light:text-gray-900     /* Text */
.light:bg-white          /* Backgrounds */
.light:border-gray-200   /* Borders */
```

### Dark Mode

```css
.dark:text-white         /* Text */
.dark:bg-black/20        /* Backgrounds */
.dark:border-white/10    /* Borders */
```

---

## 🔧 Common Tasks

### Add New Field to Time Log

1. Update interface in `TimeTracker.tsx`
2. Update API route in `route.ts`
3. Update Firestore rules in `firestore.rules`
4. Update types in component

### Change Date Range Default

```typescript
// In TimeTracker.tsx, line ~55
const [dateRange, setDateRange] = useState({
  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Change this
  end: new Date(),
});
```

### Customize Colors

```typescript
// Punch In: green-600 (#10B981)
// Punch Out: red-600 (#EF4444)
// Primary: blue-600 (#2563EB)
// Change in TimeTracker.tsx className props
```

---

## 🐛 Troubleshooting

### Issue: "Permission denied"

**Fix**: Deploy `firestore.rules`

### Issue: "Index not found"

**Fix**: Create composite index in Firestore Console

### Issue: Times are wrong timezone

**Fix**: All times stored in UTC, displayed in user's local timezone (working as intended)

### Issue: Logs not appearing

**Fix**: Check date range filter, expand range to see older logs

### Issue: Can't edit/delete

**Fix**: Verify user is logged in, check Firestore rules

---

## 📊 Analytics Calculations

### Total Hours

```typescript
const totalHours = logs
  .filter((log) => log.logoutTime)
  .reduce((sum, log) => sum + log.workHours, 0);
```

### Average Hours

```typescript
const avgHours = totalHours / completedSessions;
```

### Daily Breakdown

```typescript
// Groups logs by date, sums hours per day
const dailyStats = logs
  .filter((log) => log.logoutTime)
  .reduce((map, log) => {
    const date = log.loginTime.split("T")[0];
    // ... aggregate by date
  }, new Map());
```

---

## 🎯 User Actions

| Action          | User Clicks            | Result                                    |
| --------------- | ---------------------- | ----------------------------------------- |
| Quick Punch In  | "Auto Punch In"        | Captures current time, shows in green box |
| Quick Punch Out | "Auto Punch Out"       | Captures current time, shows in red box   |
| Manual Entry    | Type in datetime input | Can set any past/future time              |
| Save Log        | "Save Time Log"        | Stores to Firestore, shows toast          |
| Edit Log        | Pencil icon            | Shows inline editor                       |
| Delete Log      | Trash icon             | Confirms, then deletes                    |
| Filter Dates    | Change start/end dates | Auto-refetches logs                       |

---

## 🔒 Security Rules Summary

```javascript
// Users can only:
- Read their own logs (userId == auth.uid)
- Create logs for themselves
- Update their own logs
- Delete their own logs

// All fields validated at database level
```

---

## 📦 Dependencies (Already Installed)

✅ firebase  
✅ framer-motion  
✅ lucide-react  
✅ sonner  
✅ next  
✅ react  
✅ tailwindcss

**No additional packages needed!**

---

## 🚦 Status Indicators

### Loading States

- "Saving..." → During create/update/delete
- "Loading logs..." → During fetch
- Disabled buttons → During operations

### Success States

- Green toast → Operation successful
- Updated list → New data visible
- Confirmation box → Punch action complete

### Error States

- Red toast → Operation failed
- Console error → Check browser console
- Validation message → Fix input data

---

## 💡 Pro Tips

1. **Use Auto Punch**: Faster than manual entry, accurate to the second
2. **Check Date Range**: If logs missing, expand date filter
3. **Edit Inline**: Click pencil to fix mistakes without recreating
4. **Watch Stats**: Cards update automatically as you add logs
5. **Mobile Friendly**: Works great on phones too

---

## 📞 Support Resources

- **Full Guide**: `docs/TIME_TRACKER_GUIDE.md`
- **Deployment**: `docs/DEPLOYMENT_CHECKLIST.md`
- **Visual Guide**: `docs/VISUAL_INTERFACE_GUIDE.md`
- **Summary**: `docs/TIME_TRACKER_SUMMARY.md`
- **This Card**: `docs/QUICK_REFERENCE.md`

---

## ✅ Pre-Flight Checklist

Before going live:

- [ ] Firestore rules deployed
- [ ] Composite index created
- [ ] Test create log
- [ ] Test edit log
- [ ] Test delete log
- [ ] Test date filter
- [ ] Test on mobile
- [ ] Test light/dark mode
- [ ] Verify statistics calculate correctly
- [ ] Check daily chart renders

---

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: November 4, 2025

🎉 **Everything is implemented and ready to use!**
