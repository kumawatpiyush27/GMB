# Google OAuth Setup Guide

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: `GMB Review CRM`
4. Click "Create"

## Step 2: Enable APIs

1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search and enable these APIs:
   - **Google My Business API**
   - **My Business Business Information API**
   - **My Business Account Management API**

## Step 3: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **OAuth client ID**
3. If prompted, configure OAuth consent screen:
   - User Type: **External**
   - App name: `GMB Review CRM`
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `https://www.googleapis.com/auth/business.manage`
   - Test users: Add your Gmail (for testing)
   - Click **Save and Continue**

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: `GMB Review CRM Web Client`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (for local testing)
     - `https://client-theta-flame.vercel.app/api/auth/google/callback` (for production)
   - Click **Create**

5. **Download JSON** or copy:
   - Client ID
   - Client Secret

## Step 4: Add Environment Variables

### Local Development (.env.local)
```bash
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### Vercel Production
```bash
vercel env add GOOGLE_CLIENT_ID
# Paste your client ID

vercel env add GOOGLE_CLIENT_SECRET
# Paste your client secret (mark as sensitive)

vercel env add GOOGLE_REDIRECT_URI
# Enter: https://client-theta-flame.vercel.app/api/auth/google/callback
```

## Step 5: Test OAuth Flow

1. Start local dev server: `npm run dev`
2. Go to `http://localhost:3000/dashboard/auto-reply`
3. Click **"Connect Google My Business"**
4. Sign in with your Google account
5. Grant permissions
6. You should be redirected back with success message

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Make sure redirect URI in Google Console matches exactly
- Check that GMB API is enabled

### "redirect_uri_mismatch"
- Verify `GOOGLE_REDIRECT_URI` environment variable
- Ensure it's added to authorized redirect URIs in Google Console

### "invalid_client"
- Double-check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Make sure there are no extra spaces

## Security Notes

- ✅ Never commit `.env.local` to git
- ✅ Mark `GOOGLE_CLIENT_SECRET` as sensitive in Vercel
- ✅ Tokens are stored with `select: false` in database
- ✅ Consider encrypting tokens before storing (future enhancement)
