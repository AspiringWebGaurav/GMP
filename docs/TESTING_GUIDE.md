# Time Tracker - Testing Guide

## 🧪 Complete Testing Checklist

This guide provides comprehensive test cases for the Login/Logout Time Tracker feature.

---

## 🎯 Functional Testing

### 1. Create Time Log (Auto Punch)

#### Test Case 1.1: Auto Punch In Only

**Steps:**

1. Navigate to Dashboard → Login/Logout tab
2. Click "Auto Punch In" button
3. Verify green confirmation box appears with current time
4. Do NOT click "Auto Punch Out"
5. Click "Save Time Log"

**Expected Result:**

- ✅ Toast: "Time log saved successfully!"
- ✅ New log appears in "Recent Time Logs"
- ✅ Logout time shows "Not logged out"
- ✅ Duration shows "In progress"
- ✅ Statistics do NOT include this incomplete log

#### Test Case 1.2: Auto Punch In + Out (Complete Session)

**Steps:**

1. Click "Auto Punch In"
2. Wait 5 seconds (or work for real time)
3. Click "Auto Punch Out"
4. Verify both green and red confirmation boxes show times
5. Click "Save Time Log"

**Expected Result:**

- ✅ Toast: "Time log saved successfully!"
- ✅ Log appears with both times
- ✅ Duration calculated correctly (e.g., "0.00 hours" for quick test)
- ✅ Statistics update to include new log
- ✅ Daily chart shows today's total hours

#### Test Case 1.3: Rapid Successive Punches

**Steps:**

1. Click "Auto Punch In" → "Save Time Log"
2. Immediately click "Auto Punch In" again → "Save Time Log"
3. Repeat 3 times quickly

**Expected Result:**

- ✅ All logs saved separately
- ✅ No duplicate entries
- ✅ Each log has unique timestamp
- ✅ No race conditions or errors

---

### 2. Create Time Log (Manual Entry)

#### Test Case 2.1: Manual Past Entry

**Steps:**

1. In Login Time input, select: Yesterday 9:00 AM
2. In Logout Time input, select: Yesterday 5:00 PM
3. Click "Save Time Log"

**Expected Result:**

- ✅ Log saved with correct times
- ✅ Work hours calculated: 8.00 hours
- ✅ Appears in history (check date filter includes yesterday)
- ✅ Yesterday appears in daily chart

#### Test Case 2.2: Manual Future Entry

**Steps:**

1. In Login Time input, select: Tomorrow 8:00 AM
2. In Logout Time input, select: Tomorrow 4:00 PM
3. Click "Save Time Log"

**Expected Result:**

- ✅ Log saved (no date validation prevents future)
- ✅ Hours calculated: 8.00 hours
- ✅ Appears in history if date range includes tomorrow

#### Test Case 2.3: Logout Before Login (Invalid)

**Steps:**

1. Login Time: Today 5:00 PM
2. Logout Time: Today 9:00 AM
3. Click "Save Time Log"

**Expected Result:**

- ✅ Saves successfully (backend calculates negative hours)
- 🔧 **Note**: No frontend validation for this case
- ⚠️ Consider adding validation in future if needed

---

### 3. Read/Fetch Time Logs

#### Test Case 3.1: Default Date Range (30 Days)

**Steps:**

1. Open Login/Logout tab
2. Observe default date range in filter
3. Check which logs appear

**Expected Result:**

- ✅ Start date: 30 days ago
- ✅ End date: Today
- ✅ Only logs within range shown
- ✅ Logs sorted newest first

#### Test Case 3.2: Custom Date Range

**Steps:**

1. Set Start Date: 7 days ago
2. Set End Date: Today
3. Observe logs update automatically

**Expected Result:**

- ✅ Only logs from last 7 days shown
- ✅ Statistics recalculate for this range
- ✅ Daily chart shows only these 7 days
- ✅ Older logs hidden (not deleted)

#### Test Case 3.3: No Logs in Range

**Steps:**

1. Set Start Date: Far future (e.g., 2026-01-01)
2. Set End Date: Further future (e.g., 2026-12-31)

**Expected Result:**

- ✅ Message: "No time logs found for the selected date range."
- ✅ Statistics show 0 for all values
- ✅ Daily chart empty
- ✅ No errors in console

---

### 4. Update Time Log

#### Test Case 4.1: Edit Login Time

**Steps:**

1. Find any existing log
2. Click pencil (edit) icon
3. Change Login Time to 1 hour earlier
4. Click "Save" (checkmark)

**Expected Result:**

- ✅ Toast: "Log updated successfully!"
- ✅ Work hours recalculated
- ✅ Log updates in list immediately
- ✅ Statistics update if hours changed

#### Test Case 4.2: Edit Logout Time

**Steps:**

1. Edit a log
2. Change Logout Time to 2 hours later
3. Click "Save"

**Expected Result:**

- ✅ Updated successfully
- ✅ Duration increases by 2 hours
- ✅ Daily chart updates
- ✅ Avg hours/session recalculates

#### Test Case 4.3: Cancel Edit

**Steps:**

1. Click edit on any log
2. Change both times
3. Click "Cancel" (X icon)

**Expected Result:**

- ✅ Edit mode closes
- ✅ Original values restored
- ✅ No changes saved
- ✅ No toast notification

#### Test Case 4.4: Edit Multiple Logs

**Steps:**

1. Edit Log A
2. Before saving, click edit on Log B
3. Observe behavior

**Expected Result:**

- ✅ Only one log in edit mode at a time
- ✅ Previous edit mode closes automatically
- ✅ No conflicts or data loss

---

### 5. Delete Time Log

#### Test Case 5.1: Delete Single Log

**Steps:**

1. Click trash icon on any log
2. Confirm deletion in dialog
3. Observe result

**Expected Result:**

- ✅ Confirmation dialog appears
- ✅ Toast: "Log deleted successfully!"
- ✅ Log removed from list immediately
- ✅ Statistics recalculate
- ✅ Daily chart updates

#### Test Case 5.2: Cancel Deletion

**Steps:**

1. Click trash icon
2. Click "Cancel" in confirmation dialog

**Expected Result:**

- ✅ Dialog closes
- ✅ Log NOT deleted
- ✅ No toast notification
- ✅ Data unchanged

#### Test Case 5.3: Delete All Logs in View

**Steps:**

1. Have 3 logs visible
2. Delete first log
3. Delete second log
4. Delete third log

**Expected Result:**

- ✅ All deleted successfully
- ✅ Message appears: "No time logs found..."
- ✅ Statistics show 0 values
- ✅ Daily chart empty

---

## 📊 Analytics Testing

### 6. Statistics Calculations

#### Test Case 6.1: Total Hours Accuracy

**Steps:**

1. Create 3 logs:
   - Log 1: 8 hours
   - Log 2: 6 hours
   - Log 3: 7.5 hours
2. Check "Total Hours" card

**Expected Result:**

- ✅ Shows exactly: 21.5 hours
- ✅ Updates in real-time after each save

#### Test Case 6.2: Average Hours Accuracy

**Steps:**

1. Using same 3 logs from 6.1
2. Check "Avg Hours/Session" card

**Expected Result:**

- ✅ Shows: 7.17 hours (21.5 / 3)
- ✅ Rounds to 2 decimal places

#### Test Case 6.3: Session Count

**Steps:**

1. Count completed logs (with logout time)
2. Compare to "Total Sessions" card

**Expected Result:**

- ✅ Count matches exactly
- ✅ Incomplete sessions NOT counted
- ✅ Updates after create/delete

#### Test Case 6.4: Incomplete Sessions Excluded

**Steps:**

1. Create log with only login time (no logout)
2. Check all statistics

**Expected Result:**

- ✅ Total Hours: NOT increased
- ✅ Avg Hours: NOT affected
- ✅ Sessions: NOT increased
- ✅ Only completed sessions counted

---

### 7. Daily Analytics Chart

#### Test Case 7.1: Bar Width Calculation

**Steps:**

1. Create log with 12 hours today
2. Create log with 6 hours yesterday
3. Observe bar chart

**Expected Result:**

- ✅ Today's bar: 100% width (12h = 100% of 12h scale)
- ✅ Yesterday's bar: 50% width (6h = 50% of 12h scale)
- ✅ Hours displayed in bar: "12h" and "6.0h"

#### Test Case 7.2: Multiple Sessions Same Day

**Steps:**

1. Create 2 logs for today:
   - 9 AM - 12 PM (3 hours)
   - 1 PM - 5 PM (4 hours)
2. Check daily chart for today

**Expected Result:**

- ✅ Shows: 7.0h total
- ✅ Shows: "2 sessions"
- ✅ Bar represents combined hours

#### Test Case 7.3: Chart Animation

**Steps:**

1. Change date range to show new logs
2. Observe bar chart animation

**Expected Result:**

- ✅ Bars animate from 0% to final width
- ✅ Animation smooth (no jank)
- ✅ Staggered delay for each bar
- ✅ Completes in < 1 second

---

## 🎨 UI/UX Testing

### 8. Theme Switching

#### Test Case 8.1: Light to Dark

**Steps:**

1. Set theme to Light mode
2. Open Login/Logout tab
3. Switch to Dark mode
4. Observe all elements

**Expected Result:**

- ✅ All text readable (sufficient contrast)
- ✅ Cards have appropriate backgrounds
- ✅ Borders visible
- ✅ Icons maintain color
- ✅ Buttons have correct hover states
- ✅ No white flash or jarring transition

#### Test Case 8.2: Dark to Light

**Steps:**

1. Start in Dark mode
2. Switch to Light mode
3. Verify all components

**Expected Result:**

- ✅ All elements styled correctly
- ✅ Charts use light mode colors
- ✅ Form inputs have light backgrounds
- ✅ Shadows appear appropriately
- ✅ Smooth transition

---

### 9. Responsive Design

#### Test Case 9.1: Mobile (320px width)

**Steps:**

1. Open DevTools
2. Set viewport: iPhone SE (375x667)
3. Test all features

**Expected Result:**

- ✅ Punch cards stack vertically
- ✅ Statistics stack in single column
- ✅ Date filters stack vertically
- ✅ Chart fits within viewport
- ✅ Logs display well (no overflow)
- ✅ Buttons are tap-friendly (min 44px)
- ✅ Text readable (not too small)

#### Test Case 9.2: Tablet (768px width)

**Steps:**

1. Set viewport: iPad (768x1024)
2. Test layout

**Expected Result:**

- ✅ Punch cards side-by-side
- ✅ Statistics in 2-3 columns
- ✅ Date filters side-by-side
- ✅ Chart scales appropriately
- ✅ Good use of space

#### Test Case 9.3: Desktop (1920px width)

**Steps:**

1. Set viewport: Full HD (1920x1080)
2. Check layout

**Expected Result:**

- ✅ Max width container (not too wide)
- ✅ Content centered
- ✅ Comfortable reading width
- ✅ No excessive whitespace
- ✅ Charts fill available space

---

### 10. Animations & Interactions

#### Test Case 10.1: Button Hover Effects

**Steps:**

1. Hover over "Auto Punch In"
2. Hover over "Save Time Log"
3. Hover over edit/delete icons

**Expected Result:**

- ✅ Color darkens on hover
- ✅ Subtle scale transform (1.02)
- ✅ Cursor changes to pointer
- ✅ Smooth transition (150ms)

#### Test Case 10.2: Button Press Effect

**Steps:**

1. Click and hold any button
2. Observe active state

**Expected Result:**

- ✅ Button scales down (0.98)
- ✅ Feels responsive
- ✅ Returns to normal on release

#### Test Case 10.3: Confirmation Box Animation

**Steps:**

1. Click "Auto Punch In"
2. Watch confirmation box appear

**Expected Result:**

- ✅ Fades in (opacity 0 → 1)
- ✅ Scales slightly (0.9 → 1)
- ✅ Smooth animation (200ms)

#### Test Case 10.4: List Item Animation

**Steps:**

1. Save a new log
2. Watch it appear in Recent Logs

**Expected Result:**

- ✅ Fades in from top
- ✅ Slides down smoothly
- ✅ Other items shift down
- ✅ No layout jump

---

## ♿ Accessibility Testing

### 11. Keyboard Navigation

#### Test Case 11.1: Tab Order

**Steps:**

1. Click in browser, press Tab repeatedly
2. Observe focus progression

**Expected Result:**

- ✅ Tab order logical: Login input → Punch In → Logout input → Punch Out → Save → Filters → Logs
- ✅ Focus visible (blue ring)
- ✅ Can reach all interactive elements
- ✅ No focus traps

#### Test Case 11.2: Form Submission with Enter

**Steps:**

1. Fill login time input
2. Press Enter
3. Fill logout time input
4. Press Enter

**Expected Result:**

- ✅ Enter triggers button click
- ✅ Form submits correctly
- ✅ Same as mouse click behavior

#### Test Case 11.3: Escape Key

**Steps:**

1. Click edit on a log
2. Press Escape key

**Expected Result:**

- ✅ Edit mode cancels
- ✅ Changes discarded
- ✅ Returns to view mode

---

### 12. Screen Reader Support

#### Test Case 12.1: ARIA Labels

**Steps:**

1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Navigate through Time Tracker

**Expected Result:**

- ✅ All buttons announced with purpose
- ✅ Form inputs have labels
- ✅ Icons have alt/aria-label
- ✅ Status messages announced (via toast)

#### Test Case 12.2: Form Labels

**Steps:**

1. Focus each input with screen reader

**Expected Result:**

- ✅ "Login Time" label associated
- ✅ "Logout Time" label associated
- ✅ Date filter inputs labeled
- ✅ Input type announced (datetime-local, date)

---

## 🔒 Security Testing

### 13. Data Isolation

#### Test Case 13.1: User Can Only See Own Logs

**Steps:**

1. Log in as User A
2. Create 3 logs
3. Log out
4. Log in as User B
5. Open Login/Logout tab

**Expected Result:**

- ✅ User B sees NO logs from User A
- ✅ User B can only see their own logs
- ✅ No cross-user data leakage

#### Test Case 13.2: Cannot Edit Other User's Logs

**Steps:**

1. Attempt to call API directly:
   ```
   PUT /api/time-logs
   { id: "other-users-log-id", ... }
   ```

**Expected Result:**

- ✅ API returns error or ignores request
- ✅ Firestore rules prevent update
- ✅ No data corruption

---

### 14. Input Validation

#### Test Case 14.1: Empty Login Time

**Steps:**

1. Leave login time empty
2. Click "Save Time Log"

**Expected Result:**

- ✅ Toast: "Please enter login time"
- ✅ Form does not submit
- ✅ No API call made

#### Test Case 14.2: Invalid Date Format

**Steps:**

1. Manually type invalid date in input
2. Attempt to save

**Expected Result:**

- ✅ Browser validation prevents submission
- ✅ Input shows invalid state
- ✅ User prompted to correct

---

## ⚡ Performance Testing

### 15. Load Performance

#### Test Case 15.1: Initial Page Load

**Steps:**

1. Open DevTools Network tab
2. Navigate to Login/Logout tab
3. Measure load time

**Expected Result:**

- ✅ Tab content appears < 200ms
- ✅ Firestore query completes < 500ms
- ✅ Total time to interactive < 1s
- ✅ No layout shift (CLS = 0)

#### Test Case 15.2: Large Dataset (100+ Logs)

**Steps:**

1. Create 100+ logs via script or manual
2. Set date range to show all
3. Observe performance

**Expected Result:**

- ✅ List renders in < 1s
- ✅ Scrolling smooth (60fps)
- ✅ Statistics calculate quickly
- ✅ Chart renders all bars
- ✅ No browser freezing

#### Test Case 15.3: Rapid Interactions

**Steps:**

1. Click edit, save, delete rapidly
2. Change date filters quickly
3. Punch in/out repeatedly

**Expected Result:**

- ✅ No race conditions
- ✅ UI stays responsive
- ✅ Data integrity maintained
- ✅ No duplicate requests

---

### 16. Network Conditions

#### Test Case 16.1: Slow 3G

**Steps:**

1. DevTools → Network → Throttle to Slow 3G
2. Create a log
3. Observe behavior

**Expected Result:**

- ✅ Loading indicator appears
- ✅ Button disabled during save
- ✅ Eventually succeeds (or retries)
- ✅ User informed of status

#### Test Case 16.2: Offline Mode

**Steps:**

1. DevTools → Network → Offline
2. Attempt to create log

**Expected Result:**

- ✅ Toast: "Failed to save time log"
- ✅ Error message clear
- ✅ User can retry when online
- ✅ No crash or blank screen

#### Test Case 16.3: Network Recovery

**Steps:**

1. Start offline
2. Create log (fails)
3. Go online
4. Retry create

**Expected Result:**

- ✅ Retry succeeds
- ✅ Data saved correctly
- ✅ UI updates appropriately

---

## 🧩 Integration Testing

### 17. Dashboard Integration

#### Test Case 17.1: Tab Switching

**Steps:**

1. Open Login/Logout tab
2. Create a log
3. Switch to Version Notes tab
4. Switch back to Login/Logout

**Expected Result:**

- ✅ Data persists across tab switches
- ✅ State maintained (filters, etc.)
- ✅ No re-fetch on return (cached)

#### Test Case 17.2: Multiple Sessions

**Steps:**

1. Open dashboard in 2 browser tabs
2. Create log in Tab 1
3. Switch to Tab 2
4. Refresh Tab 2

**Expected Result:**

- ✅ Tab 2 shows new log after refresh
- ✅ Data synced via Firestore
- ✅ No conflicts

---

## ✅ Acceptance Criteria

### Must Pass All:

- [ ] All functional tests pass
- [ ] Analytics calculate correctly
- [ ] Theme switching works perfectly
- [ ] Mobile, tablet, desktop responsive
- [ ] All animations smooth
- [ ] Keyboard navigation complete
- [ ] Screen reader friendly
- [ ] Data isolated per user
- [ ] Performance acceptable (< 2s loads)
- [ ] Works offline gracefully
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No accessibility violations

---

## 📋 Test Report Template

```markdown
# Time Tracker Test Report

**Date**: YYYY-MM-DD
**Tester**: Name
**Environment**: Production / Staging / Local
**Browser**: Chrome 120 / Firefox 121 / Safari 17

## Test Results

### Functional (Pass/Fail)

- Create log: ✅ Pass
- Edit log: ✅ Pass
- Delete log: ✅ Pass
- Date filter: ✅ Pass

### Analytics (Pass/Fail)

- Total hours: ✅ Pass
- Avg hours: ✅ Pass
- Sessions: ✅ Pass
- Daily chart: ✅ Pass

### UI/UX (Pass/Fail)

- Theme: ✅ Pass
- Responsive: ✅ Pass
- Animations: ✅ Pass

### Accessibility (Pass/Fail)

- Keyboard: ✅ Pass
- Screen reader: ✅ Pass

### Performance (Pass/Fail)

- Load time: ✅ Pass (0.8s)
- Query time: ✅ Pass (0.3s)

## Issues Found

1. None

## Overall Status: ✅ PASS
```

---

**Testing Complete**: Ready for Production ✅
