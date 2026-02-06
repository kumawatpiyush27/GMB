@echo off
echo ========================================
echo Adding Google OAuth to Vercel
echo ========================================
echo.

echo Step 1: Opening Vercel Dashboard...
start https://vercel.com/piyushs-projects-79c86bdd/client/settings/environment-variables

echo.
echo ========================================
echo MANUAL STEPS (Do this in browser):
echo ========================================
echo.
echo 1. Click "Add New" button
echo.
echo 2. Add Variable 1:
echo    Name: GOOGLE_CLIENT_ID
echo    Value: [REDACTED_CLIENT_ID]
echo    Environment: Production, Preview
echo    Sensitive: NO
echo    Click "Save"
echo.
echo 3. Add Variable 2:
echo    Name: GOOGLE_CLIENT_SECRET
echo    Value: [REDACTED_CLIENT_SECRET]
echo    Environment: Production, Preview
echo    Sensitive: YES (check this!)
echo    Click "Save"
echo.
echo 4. Add Variable 3:
echo    Name: GOOGLE_REDIRECT_URI
echo    Value: https://client-theta-flame.vercel.app/api/auth/google/callback
echo    Environment: Production, Preview
echo    Sensitive: NO
echo    Click "Save"
echo.
echo ========================================
echo After adding all 3 variables:
echo ========================================
echo.
echo Press any key to deploy to production...
pause

echo.
echo Deploying to Vercel...
vercel --prod

echo.
echo ========================================
echo Done! Test at:
echo https://client-theta-flame.vercel.app/dashboard/auto-reply
echo ========================================
pause
