# Google My Business API v4 - 403 Error Solution

## 🚨 Problem

The Google My Business API v4 (`mybusiness.googleapis.com`) returns a 403 error:
```
Google My Business API has not been used in project 576672735342 before or it is disabled.
```

## 🔍 Root Cause

The `mybusiness.googleapis.com` API is **deprecated** and **cannot be enabled** through the Google Cloud Console. When you try to access it in the API Library, it shows an error:

```
"There are errors with loading mybusiness.googleapis.com"
```

This API is in a transitional state where:
- ✅ It still works for existing projects that had it enabled before deprecation
- ❌ New projects cannot enable it through the console
- ❌ It's not fully deprecated (no official end date announced)
- ❌ Google hasn't fully migrated reviews to the v1 APIs yet

## ✅ Solutions

### **Option 1: Contact Google Cloud Support (Recommended)**

Since the API cannot be enabled through the console, you need to request access:

1. **Open a Support Case:**
   - Go to: https://console.cloud.google.com/support
   - Click "Create Case"
   - Select "Technical Support"

2. **Request Details:**
   ```
   Subject: Enable mybusiness.googleapis.com API for Project 576672735342
   
   Description:
   I need to enable the Google My Business API (mybusiness.googleapis.com) 
   for my project ID: 576672735342
   
   The API cannot be enabled through the Cloud Console API Library as it 
   shows an error when loading. I need this API to fetch reviews from 
   Google Business Profile locations.
   
   Please enable this API for my project or provide guidance on the 
   recommended alternative for fetching reviews programmatically.
   ```

3. **Wait for Response:**
   - Google Support typically responds within 24-48 hours
   - They may enable the API manually or provide an alternative solution

---

### **Option 2: Use Google Places API (Alternative)**

While waiting for support, you can use the **Google Places API** to fetch reviews:

#### **Step 1: Enable Places API**
```
https://console.cloud.google.com/apis/library/places-backend.googleapis.com?project=576672735342
```

#### **Step 2: Get Place ID**
You need to convert your Google Business Profile location to a Place ID.

#### **Step 3: Fetch Reviews**
Use the Places API endpoint:
```
GET https://places.googleapis.com/v1/places/{PLACE_ID}
?fields=reviews&key=YOUR_API_KEY
```

**Limitations:**
- Places API only returns the **5 most helpful reviews**
- You need a Place ID (not the same as location ID)
- Requires an API key (different from OAuth)

---

### **Option 3: Wait for Google's Migration (Not Recommended)**

Google is slowly migrating features from v4 to v1 APIs, but reviews migration timeline is unclear.

**Current Status:**
- ✅ Account Management - Migrated to v1
- ✅ Business Information - Migrated to v1
- ❌ **Reviews - Still on v4** (no migration date announced)

---

## 📋 What We've Already Tried

1. ✅ Enabled "My Business Account Management API"
2. ✅ Enabled "My Business Business Information API"
3. ✅ Correct OAuth scope (`business.manage`)
4. ✅ Fresh OAuth token (re-authenticated)
5. ✅ Correct v4 endpoint format
6. ❌ Cannot enable `mybusiness.googleapis.com` (console error)

---

## 🎯 Recommended Action Plan

### **Immediate (Today):**
1. **Contact Google Cloud Support** (Option 1 above)
2. **Document your use case** - explain you need reviews API for your CRM

### **Short-term (While Waiting):**
1. Consider using **Google Places API** for limited review access
2. Or wait for support response (24-48 hours)

### **Long-term:**
1. Monitor Google's API deprecation schedule
2. Plan migration when reviews API moves to v1

---

## 📞 Support Links

- **Google Cloud Support:** https://console.cloud.google.com/support
- **API Status Dashboard:** https://status.cloud.google.com/
- **Business Profile API Docs:** https://developers.google.com/my-business/reference/rest
- **Places API Docs:** https://developers.google.com/maps/documentation/places/web-service/reviews

---

## 💡 Why This Happened

Google is in the middle of migrating from "Google My Business API" to "Google Business Profile APIs". The migration is incomplete:

| Feature | Old API (v4) | New API (v1) | Status |
|---------|--------------|--------------|--------|
| Accounts | mybusiness.googleapis.com | mybusinessaccountmanagement | ✅ Migrated |
| Locations | mybusiness.googleapis.com | mybusinessbusinessinformation | ✅ Migrated |
| **Reviews** | **mybusiness.googleapis.com** | **Not available yet** | ❌ **Stuck in v4** |
| Performance | mybusiness.googleapis.com | businessprofileperformance | ✅ Migrated |

The reviews endpoint is the last major feature still on v4, creating this exact problem you're facing.

---

**Last Updated:** February 8, 2026  
**Project ID:** 576672735342  
**Issue:** Cannot enable mybusiness.googleapis.com API
