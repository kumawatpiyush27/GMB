# Google My Business API Setup Guide

## 🚨 Current Error
```
403 Google My Business API has not been used in project 576672735342 before or it is disabled.
```

## ✅ Solution: Enable Required APIs

### Quick Fix (Direct Links)

**Your Project ID:** `576672735342`

Click these links to enable the required APIs:

1. **Google My Business API (v4)** - For Reviews
   ```
   https://console.developers.google.com/apis/api/mybusiness.googleapis.com/overview?project=576672735342
   ```
   Click **"Enable"** button

2. **My Business Account Management API (v1)** - For Accounts
   ```
   https://console.developers.google.com/apis/api/mybusinessaccountmanagement.googleapis.com/overview?project=576672735342
   ```
   Click **"Enable"** button

3. **My Business Business Information API (v1)** - For Locations
   ```
   https://console.developers.google.com/apis/api/mybusinessbusinessinformation.googleapis.com/overview?project=576672735342
   ```
   Click **"Enable"** button

---

## 📋 Manual Steps (Alternative)

### Step 1: Open Google Cloud Console
1. Go to: https://console.cloud.google.com/
2. Make sure you're logged in with the correct Google account

### Step 2: Select Your Project
1. Click on the project dropdown at the top
2. Select project ID: `576672735342`

### Step 3: Navigate to APIs & Services
1. Click on the hamburger menu (☰) on the top left
2. Go to **"APIs & Services"** → **"Library"**

### Step 4: Enable Each API

#### Enable Google My Business API (v4)
1. In the search box, type: `Google My Business API`
2. Click on **"Google My Business API"**
3. Click the **"Enable"** button
4. Wait for confirmation

#### Enable My Business Account Management API (v1)
1. Go back to API Library
2. Search: `My Business Account Management API`
3. Click on it
4. Click **"Enable"**

#### Enable My Business Business Information API (v1)
1. Go back to API Library
2. Search: `My Business Business Information API`
3. Click on it
4. Click **"Enable"**

---

## ⏱️ Wait Time
After enabling the APIs:
- Wait **2-5 minutes** for the changes to propagate
- Then try syncing reviews again

---

## 🔍 Verify APIs are Enabled

1. Go to: https://console.cloud.google.com/apis/dashboard?project=576672735342
2. You should see all three APIs listed under "Enabled APIs"

---

## 🧪 Test After Enabling

1. Wait 5 minutes after enabling all APIs
2. Go to your GMB Review CRM dashboard
3. Click **"Refresh Reviews"** button
4. Check the console logs - you should see:
   ```
   [Sync] Review API Status: 200
   [Sync] Fetched X reviews.
   ```

---

## ❓ Troubleshooting

### If you still get 403 error:
1. Make sure you're using the correct Google account
2. Verify all 3 APIs are enabled
3. Wait a full 5 minutes
4. Clear browser cache and try again

### If you get "Permission Denied":
1. Make sure your Google account has Owner/Editor role on the project
2. Check OAuth consent screen is configured
3. Verify the OAuth scopes include:
   - `https://www.googleapis.com/auth/business.manage`

---

## 📞 Need Help?

If you're still facing issues after enabling the APIs:
1. Check the browser console for detailed error messages
2. Verify your OAuth credentials are correct
3. Make sure the refresh token is still valid

---

**Last Updated:** February 7, 2026
**Project ID:** 576672735342
