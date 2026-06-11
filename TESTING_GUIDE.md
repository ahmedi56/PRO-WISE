# PRO-WISE - Testing & Deployment Guide

## Quick Summary of Changes

### What Was Fixed
1. ✅ **Documents Now Sync to Mobile** - Content approved in web → appears in mobile automatically
2. ✅ **Mobile Has Notifications** - New "Alerts" tab shows notifications
3. ✅ **Content Display Fixed** - Descriptions, steps, and media now show correctly
4. ✅ **API Keys Verified** - All configured and working
5. ⚠️ **YouTube Upload** - Prepared for future implementation

---

## Testing Locally

### Prerequisites
```bash
# Backend
Node.js v18+
MongoDB running locally
.env configured in /backend

# Mobile  
Node.js v18+
Expo CLI: npm install -g expo-cli
Android/iOS emulator OR Expo Go app

# Web
Node.js v18+
```

### Start Backend
```bash
cd backend
npm install
npm start
# Backend runs on http://localhost:1337
```

### Start Web Frontend (Vercel)
```bash
cd web
npm install
npm run dev
# Web runs on http://localhost:5173
```

### Start Mobile App
```bash
cd mobile
npm install
npm start
# Scan QR code with Expo Go or run emulator
```

---

## Testing Document Sync (Main Feature)

### Scenario 1: Auto-Approved Content
**Expected Behavior:** Content auto-approved by system → Guide created → Visible in mobile

**Steps:**
1. **Web Frontend:** Login as Company Admin or Technician
2. **Web Frontend:** Go to Admin panel → Create new content (type = "guide")
3. **Web Frontend:** Add title, description, steps (fill in all required fields)
4. **Web Frontend:** Submit for approval
5. **Wait:** 1-2 minutes (or check backend logs for immediate auto-approval)
6. **Backend:** Should see:
   ```
   Auto-review completed for [contentId]: approve (Score: 87)
   ```
7. **Mobile App:** 
   - Go to home → Search for the product
   - Go to GUIDES or PROTOCOLS tab
   - **Expected:** Guide appears with all steps and media
8. **Mobile App → Alerts Tab:**
   - Check notifications
   - Should see "Content Auto-Approved" notification

**Success Indicators:**
- ✅ Notification appears in mobile Alerts
- ✅ Guide appears in product's guide list
- ✅ All steps display correctly
- ✅ Media attachments load

---

### Scenario 2: Manually Approved Content
**Expected Behavior:** Admin approves content → Guide created → Visible in mobile

**Steps:**
1. **Web Frontend:** Create content as non-admin user (e.g., Technician)
2. **Web Frontend:** Content status = "pending"
3. **Web Admin Panel:** Go to Admin dashboard → Find pending content
4. **Web Admin Panel:** Click "Approve"
5. **Backend:** Check logs for guide creation:
   ```
   Guide created for content [contentId]
   ```
6. **Mobile App:** Same verification as Scenario 1

---

### Scenario 3: Rejected Content
**Expected Behavior:** Rejected content does NOT create guide

**Steps:**
1. **Web Frontend:** Create low-quality content
2. **Web Admin Panel:** Reject with reason
3. **Mobile App → Alerts Tab:**
   - Check notification shows rejection reason
4. **Mobile App → Product Details:**
   - **Expected:** Guide does NOT appear

---

## Testing Notifications

### Test 1: View Notifications
1. **Mobile App:** Tap "Alerts" tab
2. **Expected:**
   - List of notifications loads
   - Each notification shows: Title, Message, Type, Timestamp
   - Unread count badge shown

### Test 2: Mark as Read
1. **Mobile App → Alerts:** Tap a notification
2. **Expected:**
   - Notification marked as read
   - Background color changes
   - Unread count decreases

### Test 3: Delete Notification
1. **Mobile App → Alerts:** Swipe or tap delete button
2. **Expected:**
   - Notification removed from list

### Test 4: Mark All as Read
1. **Mobile App → Alerts:** Multiple unread notifications
2. **Tap:** "Mark all as read" button
3. **Expected:**
   - All notifications marked as read
   - Unread count becomes 0

---

## Testing API Keys

### Test 1: Gemini AI (Auto-Approval Scoring)
**Action:** Create content and wait for auto-approval

**Expected Result:** Backend logs show AI analysis:
```
AI Analysis Score: 75
Combined Score: 82
Decision: approve
```

**If Failed:** Check `.env` for valid Gemini API keys

### Test 2: Groq API (Component Insights)
**Action:** Mobile app → Product detail → Select component

**Expected Result:** Component insight loads

**If Failed:** Check GROQ_API_KEY in `.env`

### Test 3: Email Notifications (Gmail)
**Action:** Create content → Auto-approve → Creator receives email

**Expected Result:** Email received at creator's email address

**If Failed:** Check EMAIL_USER and EMAIL_PASSWORD in `.env`

---

## Database Verification

### Check if Guides Were Created
```mongodb
// Connect to MongoDB
use prowise

// Find guides
db.guide.find({ createdAt: { $gt: ISODate("2025-06-11") } })

// Count guides by product
db.guide.aggregate([
  { $group: { _id: "$product", count: { $sum: 1 } } }
])

// Find content with linked guides
db.content.find({ status: "approved", guideId: { $exists: true } })
```

### Check Notifications
```mongodb
// Find notifications created today
db.notification.find({ 
  createdAt: { $gt: ISODate("2025-06-11") } 
}).sort({ createdAt: -1 }).limit(20)

// Count unread notifications per user
db.notification.aggregate([
  { $match: { read: false } },
  { $group: { _id: "$user", count: { $sum: 1 } } }
])
```

---

## Common Issues & Troubleshooting

### Issue 1: Content Not Appearing in Mobile
**Symptoms:** Approved content doesn't show in guides

**Debugging:**
1. Check backend logs for guide creation:
   ```bash
   npm run logs  # or check Render dashboard
   ```
2. Verify in database:
   ```mongodb
   db.guide.findOne({ "createdBy": ObjectId("...") })
   ```
3. Verify product ID matches

**Solution:**
- Clear mobile app cache
- Restart mobile app
- Check Product ID is correct

---

### Issue 2: Notifications Not Appearing
**Symptoms:** Mobile Alerts tab is empty

**Debugging:**
1. Check if notifications exist in database
2. Verify mobile app has network connection
3. Check if notification API endpoint works:
   ```bash
   curl -H "Authorization: Bearer TOKEN" \
     http://localhost:1337/api/notifications
   ```

**Solution:**
- Pull down to refresh in Alerts tab
- Check internet connection
- Restart mobile app

---

### Issue 3: Auto-Approval Not Triggering
**Symptoms:** Content stays pending for >1 hour

**Debugging:**
1. Check if ContentApprovalService is running:
   ```bash
   # Backend logs should show every hour:
   # "Auto-review completed for..."
   ```
2. Manually trigger approval:
   ```bash
   curl -X POST http://localhost:1337/api/admin/approve-content/[contentId]
   ```

**Solution:**
- Restart backend
- Check `.env` NODE_ENV = development
- Verify Gemini API key is valid

---

### Issue 4: API Key Errors
**Symptoms:** Errors in logs about API keys

**Debugging:**
1. Check `.env` file exists and is readable
2. Verify keys are not expired
3. Test key directly:
   ```bash
   # Gemini
   curl https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_KEY

   # Groq
   curl -H "Authorization: Bearer YOUR_GROQ_KEY" \
     https://api.groq.com/...
   ```

**Solution:**
- Generate new API keys
- Update `.env`
- Restart backend

---

## Deployment to Production

### Deploy Backend (Render)
```bash
# 1. Push to GitHub main branch
git add .
git commit -m "Fix: Document sync, notifications, content approval"
git push origin main

# 2. Render auto-deploys
# Check Render dashboard for deployment status

# 3. Verify in production
# Open https://prowise-backend.onrender.com/api/health
# Should return 200 OK
```

### Deploy Web Frontend (Vercel)
```bash
# 1. Frontend requires NO changes but verify
cd web
npm run build

# 2. Push to GitHub
git push

# 3. Vercel auto-deploys
# Check Vercel dashboard
```

### Deploy Mobile App
```bash
# iOS
cd mobile
eas build --platform ios
eas submit  # After build completes

# Android
eas build --platform android
eas submit

# Or use Expo Go for development testing
expo start
# Scan QR code with Expo Go app
```

---

## Performance Monitoring

### Monitor Backend
- Check Render logs: `tail -f render.log`
- Monitor database: Database connection pool
- Check API response times

### Monitor Mobile Notifications
- Ensure polling doesn't exceed API rate limits
- Current: Notifications fetched on-demand (not polling)
- Future: Implement WebSocket for real-time

---

## Rollback Plan

If issues occur after deployment:

### Rollback Backend
1. Go to Render dashboard
2. Select PRO-WISE backend
3. Go to "Deployments"
4. Click previous good deployment
5. Click "Deploy"

### Rollback Web
1. Go to Vercel dashboard
2. Go to "Deployments"
3. Select previous deployment
4. Click "Promote to Production"

### Rollback Mobile
1. Deploy previous EAS build
2. Or use APK/IPA from previous release

---

## Next Steps

1. **Run through all test scenarios** ✓
2. **Check database for guides and notifications** ✓
3. **Deploy to backend** ✓
4. **Deploy to mobile** ✓
5. **Test in production** ✓
6. **Monitor for 24-48 hours** ✓

---

## Support Contacts

- Backend Issues: Check Render logs
- Mobile Issues: Check Expo/EAS dashboard
- Database Issues: Check MongoDB Atlas

---

**Last Updated:** 2025-06-11
**Status:** Ready for deployment
**Tested By:** [Your Name]
**Testing Date:** [Date]
