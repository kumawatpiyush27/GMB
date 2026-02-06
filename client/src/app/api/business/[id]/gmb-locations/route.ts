import { NextRequest, NextResponse } from 'next/server';
import { connectDB, GBPConnection, Business } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: businessId } = await params;
        await connectDB();

        // 1. Get Refresh Token
        const connection = await GBPConnection.findOne({ businessId });
        if (!connection || !connection.refreshToken) {
            return NextResponse.json({ error: 'Google Account not connected', locations: [] }, { status: 400 });
        }

        // 2. Get Access Token
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
        if (tokens.error) {
            // Need re-auth
            return NextResponse.json({ error: 'Auth failed', needReauth: true }, { status: 401 });
        }

        const accessToken = tokens.access_token;

        // 3. List Accounts
        const accountsRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const accountsData = await accountsRes.json();

        if (!accountsData.accounts || accountsData.accounts.length === 0) {
            return NextResponse.json({ locations: [] });
        }

        // 4. Fetch Locations for ALL accounts
        let allLocations: any[] = [];

        // Parallel fetch for all accounts
        const locationPromises = accountsData.accounts.map(async (account: any) => {
            try {
                const locRes = await fetch(
                    `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,storeCode,metadata,profile,categories,phoneNumbers&pageSize=100`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                const locData = await locRes.json();
                if (locData.locations) {
                    // Tag each location with its account ID for later reference
                    return locData.locations.map((l: any) => ({ ...l, accountName: account.name }));
                }
                return [];
            } catch (e) {
                console.error(`Error fetching locations for ${account.name}`, e);
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
