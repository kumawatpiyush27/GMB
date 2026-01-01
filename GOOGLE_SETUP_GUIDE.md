# Google Business Profile Integration Setup Guide

To enable real data fetching from Google, you need to set up a project in Google Cloud Console.

### Step 1: Create a Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Create Project**. Name it something like "GMB Review CRM".
3. Click **Create**.

### Step 2: Enable APIs
1. In the sidebar, go to **APIs & Services > Library**.
2. Search for and **Enable** the following APIs:
   - **Google Business Profile API** (might be named "Google My Business API")
   - **Google Business Profile Performance API** (if available) or "My Business Business Information API".
   - **My Business Account Management API**

*Note: Some of these require approval or might be grouped under "Google My Business API". Ensure you have access.*

### Step 3: Create Credentials (OAuth)
1. Go to **APIs & Services > OAuth consent screen**.
   - Choose **External** (unless you have a G-Suite organization).
   - Fill in App Name ("Kernal CRM"), User Support Email, and Developer Contact Email.
   - Click **Save and Continue**.
   - (Optional) Add your own email as a "Test User" so you can login currently.

2. Go to **APIs & Services > Credentials**.
3. Click **Create Credentials > OAuth client ID**.
4. Application Type: **Web application**.
5. Name: "Web Client 1".
6. **Authorized redirect URIs**:
   - For Localhost: `http://localhost:3000/api/auth/callback/google`
   - For Production (Vercel): `https://client-fl9af30g3-piyushs-projects-79c86bdd.vercel.app/api/auth/callback/google` (Use your latest Vercel domain here).
7. Click **Create**.

### Step 4: Save Keys
You will get a **Client ID** and **Client Secret**.
We will need these for the `.env` file or Vercel Environment Variables.

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
