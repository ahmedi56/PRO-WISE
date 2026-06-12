# Expo EAS Build Prompt - PRO-WISE Mobile App

## 🔧 Fixes Implemented

### Fix #1: YouTube URL Detection (Score Recognition)
**Problem**: YouTube URLs weren't counted as media → content got rejected  
**Solution**: Backend now extracts video IDs and validates them  
**Location**: `backend/api/services/ContentApprovalService.js` + `backend/api/controllers/ContentController.js`

**What happens**:
- When you submit content with YouTube URL: `https://youtube.com/watch?v=dQw4w9WgXcQ`
- Backend extracts the video ID: `dQw4w9WgXcQ`
- AI scoring adds 8 points for media ✅
- Content scores higher → auto-approval possible

---

### Fix #2: PDF Document Validation
**Problem**: PDFs uploaded weren't recognized as valid media  
**Solution**: Added `validateFileUrl()` function to check PDF/doc extensions  
**Location**: `backend/api/services/ContentApprovalService.js`

**What happens**:
- Upload PDF: `https://drive.google.com/file/d/abc123/view`
- System validates URL contains `.pdf` or Google Drive link
- AI scoring adds 4 points for media ✅
- Content scores higher

---

### Fix #3: Step Quality Checking
**Problem**: Guides with poorly written steps weren't penalized  
**Solution**: Added `validateSteps()` to measure step quality & depth  
**Location**: `backend/api/services/ContentApprovalService.js`

**What happens**:
- Guide with 5 steps, each has title + 50+ char description
- System awards 10 pts base + 10 pts quality bonus = 20 pts ✅
- Guide with 3 short steps = only 5 pts
- Better quality = higher approval chance

---

### Fix #4: FAQ Skip Approval
**Problem**: Customer questions required approval before showing to technicians  
**Solution**: FAQ questions go directly to `open` status (skip approval queue)  
**Location**: `backend/api/controllers/ContentController.js`

**What happens**:
- Customer asks FAQ in mobile app
- Status = `open` (NOT `pending`)
- Technician sees it immediately in dashboard ✅
- Technician answers → auto-approved

---

### Fix #5: Flexible Media Scoring
**Problem**: All-or-nothing media check (no points if any media missing)  
**Solution**: Flexible scoring - images (8) + video (8) + PDF (4)  
**Location**: `backend/api/services/ContentApprovalService.js`

**What happens**:
- Content with ONLY video: 8 points ✅
- Content with video + PDF: 12 points ✅
- Content with images + video + PDF: 20 points ✅
- Content with nothing: 0 points ❌

---

## ✅ Deployment Instructions

### Step 1: Deploy Backend (Auto)
The fixes are already in production on Render:
```
- Commit: 4253d3b (YouTube + PDF detection)
- Commit: 7d94a7f (Step quality checking)
- Commit: 44f72c0 (FAQ bypass)
```

**Verify deployment**:
```bash
# Check if backend is running
curl https://prowise-backend.onrender.com/api/health

# Should return: { "status": "ok" }
```

---

### Step 2: Build Mobile App (EAS)
From `mobile/` directory:

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Or both
eas build --platform all
```

**Wait for**: ~10-15 minutes per platform

---

### Step 3: Test Each Fix

#### Test #1: YouTube URL Detection
1. Open Vercel admin → Create Guide
2. Fill: Title, Description, Product
3. Type YouTube URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
4. Click AI Preview
5. **Expected**: Should see "YouTube video" in media section ✅

#### Test #2: PDF Document
1. In same form, add PDF URL: `https://drive.google.com/file/d/abc123/view`
2. Click AI Preview
3. **Expected**: Should see "PDF/document" in media section ✅

#### Test #3: Step Quality
1. Create Guide with 3 steps
2. Each step needs: Title + Description (50+ characters)
3. Add reference image to step 1
4. Click AI Preview
5. **Expected**: Should see "Strong step quality" and points awarded ✅

#### Test #4: FAQ Skip Approval
1. Open mobile app
2. Go to Product → Ask Question (FAQ)
3. Type question: "How do I reset password?"
4. Submit
5. **Expected**: Question appears immediately in technician dashboard (no approval wait) ✅
6. Technician answers → shows to all users instantly ✅

#### Test #5: Flexible Scoring
1. Create 2 guides:
   - Guide A: Title + Description + YouTube URL only
   - Guide B: Title + Description only
2. Compare AI scores
3. **Expected**: Guide A scores higher than Guide B ✅

---

## 🚀 Post-Build Checklist

- [ ] iOS build completes successfully
- [ ] Android build completes successfully
- [ ] Test YouTube URL detection
- [ ] Test PDF validation
- [ ] Test guide step quality
- [ ] Test FAQ instant visibility
- [ ] Verify notifications appear
- [ ] Check content sync to mobile

---

## 📊 Monitoring

**Watch these logs on Render**:
```
[ContentApprovalService] Auto-review completed for [id]: approve (Score: 87)
[ContentController] Video ID extracted: dQw4w9WgXcQ
[ContentApprovalService] PDF validated: true
```

If you see these → Everything working ✅

---

## Build Commands

```bash
# From mobile/ directory

# Build for iOS (simulator or device)
eas build --platform ios

# Build for Android
eas build --platform android

# Build for both platforms
eas build --platform all
```

## Changes Included in This Build

✅ **Notifications System**
- New NotificationsScreen.tsx with full UI
- notificationService.ts API client  
- MainTabNavigator updated with Alerts tab
- Real-time notification fetching with pagination
- Mark as read / delete notifications

✅ **Content Approval Enhancements**
- YouTube URL detection and scoring
- PDF/document file validation
- Enhanced step quality checking for guides
- Flexible media scoring (images + video + PDF)

✅ **FAQ Workflow**
- Customer FAQ questions skip approval
- Go directly to "open" status
- Technicians can answer immediately

✅ **Backend Integration**
- Proper videoId extraction from YouTube URLs
- Complete document sync: Content → Guide → Mobile
- Step quality metrics in AI analysis
- PDF URL validation

## Pre-Build Checklist

- [ ] Ensure `.env` is configured in mobile/ directory:
  ```
  API_URL=https://prowise-backend.onrender.com/api
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=<your-id>
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<your-id>
  ```

- [ ] Verify Render backend is running (deployment status check)
- [ ] Check all dependencies installed: `npm install` from mobile/

## Build Credentials

- iOS: Apple Developer Account required
- Android: Google Play Console account required
- Both: EAS Account (free tier available)

## Post-Build

1. **Test on iOS:**
   ```bash
   eas build:list  # Find build ID
   eas build:view <build-id>  # Download simulator build
   ```

2. **Test on Android:**
   ```bash
   eas build:list
   eas build:view <build-id>  # Download APK for testing
   ```

3. **Submit to App Stores:**
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

## Rollout Testing

1. **Notifications Tab**: Approve content in admin panel → Check "Alerts" tab in mobile
2. **Document Sync**: Create guide with YouTube URL → Should appear in Product's GUIDES tab
3. **Step Display**: Verify steps render with proper formatting and images
4. **FAQ**: Create FAQ from mobile → Should appear instantly without approval

## Issues & Troubleshooting

- **Build fails**: Run `eas build --platform ios --local` for local debugging
- **Notifications not showing**: Check API_URL is correct and backend is running
- **Guide not syncing**: Verify content approval score ≥ 85 for auto-approval
- **Video not embedding**: Check videoId extraction working in backend logs

---

**Last Updated**: 2026-06-11  
**Commits Included**:
- 4253d3b: Fix AI approval scoring
- 7d94a7f: PDF validation & step quality
- 44f72c0: FAQ bypass approval
