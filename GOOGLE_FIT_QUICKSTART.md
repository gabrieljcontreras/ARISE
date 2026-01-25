# Google Fit Integration - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Get Google OAuth Credentials
1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (name it "ARISE")
3. Go to **APIs & Services** → **Enabled APIs and services**
4. Search and enable:
   - ✅ Google Fit API
   - ✅ Google+ API
5. Go to **Credentials** → **Create OAuth 2.0 Credentials**
   - Type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback`
6. Copy your **Client ID** and **Client Secret**

### Step 2: Update `.env.local`
```bash
cd c:/Users/anura/Documents/Projects/ARISE/Arise
```

Edit `.env.local` and add:
```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### Step 3: Start the App
```bash
npm run dev
```

### Step 4: Test Google Fit
1. Open http://localhost:3000
2. Go to Dashboard → Health Quest
3. Click "Connect Google Fit" button
4. Sign in with your Google account
5. Grant fitness data permissions
6. You'll see health metrics appear in the dashboard!

## 🎯 What's New

### In Health Stats:
- **New "Google Fit Data" Card** (⌚ emoji)
  - Shows your daily steps
  - Shows your sleep hours
  - Shows your heart rate
  - Displays XP earned from activities
  - Button to manually sync data

### XP Rewards:
- 📍 Steps: Earn XP for walking/running
- 😴 Sleep: Earn XP for good sleep
- 🏋️ Workouts: Earn XP for any Google Fit workout

### Sound Effects:
- 🔊 Plays "xp_gain" sound when earning health XP
- 📣 Announces stat changes if significant XP earned

## 📊 Data Synced from Google Fit

| Metric | Frequency | XP Reward |
|--------|-----------|-----------|
| Steps | Daily | Yes |
| Sleep | Daily | Yes |
| Heart Rate | Hourly | Display only |
| Workouts | Real-time | Yes |

## 🔄 How It Works

1. **Connect**: Click button → OAuth flow → Google redirect back
2. **Authorize**: Grant ARISE access to fitness data
3. **Sync**: Automatic sync on page load
4. **Award XP**: Health XP increases based on activity
5. **Display**: Metrics shown in dashboard
6. **Refresh**: Click "Sync Google Fit" to update anytime

## ❓ FAQ

**Q: Does it track my location?**  
A: No, only health metrics (steps, sleep, heart rate, workouts)

**Q: Can I disconnect?**  
A: Yes, will add disconnect button (TODO)

**Q: How often does it sync?**  
A: On page load + manual sync. Background sync coming (TODO)

**Q: Does it work offline?**  
A: No, requires Google Fit API connection

**Q: Which Android/iOS devices are supported?**  
A: Any device that syncs to Google Fit (Wear OS, Fitbit, Apple Health via export, etc.)

## 🐛 Troubleshooting

### "No data available" message
1. Make sure you have Google Fit data on your device/account
2. Click "Sync Google Fit" button to refresh
3. Check that OAuth connection is active

### "Authorization failed"
1. Clear browser cookies: DevTools → Application → Cookies → Delete all
2. Try connecting again
3. Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

### App crashes when clicking "Connect Google Fit"
1. Check browser console (F12) for errors
2. Make sure `NEXTAUTH_URL=http://localhost:3000` in .env.local
3. Restart dev server: `npm run dev`

## 📚 Files Modified/Created

| File | Status | Purpose |
|------|--------|---------|
| `src/lib/googleFit.ts` | ✅ NEW | Google Fit API client |
| `src/app/api/auth/google/callback/route.ts` | ✅ NEW | OAuth handler |
| `src/app/api/google-fit/route.ts` | ✅ NEW | Data aggregation |
| `src/models/User.js` | ✅ UPDATED | Added googleFit fields |
| `src/app/dashboard/page.tsx` | ✅ UPDATED | Added UI & fetch logic |
| `.env.local` | ✅ UPDATED | Added Google Fit config |

## 🎮 Test Data

No test data needed - use your real Google Fit account!

If you don't have Google Fit data:
1. Wear a smartwatch/Fitbit synced to Google Fit
2. Or use Google Fit mobile app to log activities
3. Data will appear in ARISE dashboard after sync

## 📞 Support

For issues or questions:
1. Check `GOOGLE_FIT_INTEGRATION.md` for detailed docs
2. Review error messages in browser console (F12)
3. Check `.env.local` for missing credentials
4. Ensure Google Cloud project has APIs enabled

---

**Next Steps:**
- [ ] Get Google Cloud credentials
- [ ] Add to .env.local
- [ ] Test OAuth flow
- [ ] Connect your Google Fit account
- [ ] Earn health XP! 🎉
