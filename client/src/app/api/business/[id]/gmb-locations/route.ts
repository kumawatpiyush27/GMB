import { NextRequest, NextResponse } from 'next/server';
import { connectDB, GBPConnection, Business } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: businessId } = await params;
        await connectDB();

        // NOTE: We ignore Google Cloud Console UI "API not enabled" errors.
        // The businessprofile.googleapis.com API is used directly.
        // As long as the project has access and the user has permissions, this will work.

        // 1. Get Refresh Token
        const connection = await GBPConnection.findOne({ businessId });
        if (!connection || !connection.refreshToken) {
            return NextResponse.json({ error: 'Google Account not connected', locations: [] }, { status: 400 });
        }

        // 2. Get Access Token (Force Invalidate if needed handled by auth flow, here just refresh)
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                refresh_token: connection.refreshToken,
                grant_type: 'refresh_token'
            })
        });

        const tokens = await tokenRes.json();

        // Handle 401 / Invalid Grant explicitly
        if (tokens.error || !tokens.access_token) {
            console.error('Token Refresh Failed:', tokens);
            return NextResponse.json({ error: 'Auth failed', needReauth: true }, { status: 401 });
        }

        const accessToken = tokens.access_token;

        // 3. Fetch Accounts
        // GET https://businessprofile.googleapis.com/v1/accounts
        const accountsRes = await fetch('https://businessprofile.googleapis.com/v1/accounts?pageSize=20', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (accountsRes.status === 401) return NextResponse.json({ error: 'Token Expired', needReauth: true }, { status: 401 });
        if (accountsRes.status === 403) return NextResponse.json({ error: 'Permission Denied' }, { status: 403 });
        if (!accountsRes.ok) throw new Error(`Accounts fetch failed: ${accountsRes.statusText}`);

        const accountsData = await accountsRes.json();
        if (!accountsData.accounts || accountsData.accounts.length === 0) {
            return NextResponse.json({ locations: [] }); // Valid empty case
        }

        // 4. Fetch Locations for ALL accounts
        // GET https://businessprofile.googleapis.com/v1/accounts/{accountId}/locations
        let allLocations: any[] = [];

        const locationPromises = accountsData.accounts.map(async (account: any) => {
            try {
                // Determine account resource name (e.g. accounts/12345)
                const accountName = account.name;
                if (!accountName) return [];

                // Fetch locations for this account
                // Use readMask to get specific fields if needed, or default
                const locUrl = `https://businessprofile.googleapis.com/v1/${accountName}/locations?readMask=name,title,storeCode,metadata,categories,phoneNumbers,storefrontAddress&pageSize=100`;

                const locRes = await fetch(locUrl, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                if (locRes.status === 403) {
                    console.warn(`Access forbidden for account ${accountName}`);
                    return [];
                }

                if (locRes.status === 404) {
                    console.warn(`Locations endpoint not found for ${accountName}`);
                    return [];
                }

                if (!locRes.ok) {
                    // Log other errors but don't fail entire request
                    console.error(`Error fetching locations for ${accountName}: ${locRes.statusText}`);
                    return [];
                }

                const locData = await locRes.json();
                if (locData.locations) {
                    // Tag each location with its account ID for later reference
                    return locData.locations.map((l: any) => ({ ...l, accountName: accountName }));
                }
                return [];
            } catch (e) {
                console.error(`Error processing account ${account.name}`, e);
                return [];
            }
        });

        const results = await Promise.all(locationPromises);
        results.forEach(locs => {
            allLocations = [...allLocations, ...locs];
        });

        return NextResponse.json({ locations: allLocations, count: allLocations.length });

    } catch (error: any) {
        console.error('Error fetching GMB locations:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
