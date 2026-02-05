import { NextRequest, NextResponse } from 'next/server';
import { updateBusiness, connectDB, Business, GBPConnection, ReplyRule } from '@/lib/db';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export async function GET(request: NextRequest) {
    // Dynamic Redirect URI based on current domain - MUST match the one sent in login
    const REDIRECT_URI = `${request.nextUrl.origin}/api/auth/callback`;

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This contains businessId
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.json({ error }, { status: 400 });
    }

    if (!code || !state) {
        return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    // Decode state
    let businessId: string;
    let shopCode: string | undefined;

    try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
        businessId = decoded.b;
        shopCode = decoded.s;
    } catch {
        // Fallback for legacy calls or plain ID
        businessId = state;
    }

    try {
        // Exchange Code for Tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID!,
                client_secret: GOOGLE_CLIENT_SECRET!,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            })
        });

        const tokens = await tokenRes.json();

        if (tokens.error) {
            throw new Error(tokens.error_description || tokens.error);
        }

        // --- 1. Fetch Account Info ---
        await connectDB();

        const accountsRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        const accountsData = await accountsRes.json();

        const account = accountsData.accounts?.find((a: any) => a.type !== 'PERSONAL') || accountsData.accounts?.[0];
        if (!account) throw new Error('No Google Business Profile account found.');

        const googleAccountId = account.name; // accounts/{id}

        // --- 2. Fetch Locations ---
        const locationsRes = await fetch(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${googleAccountId}/locations?readMask=name,title,storeCode,metadata,profile,categories,phoneNumbers`,
            { headers: { Authorization: `Bearer ${tokens.access_token}` } }
        );
        const locationsData = await locationsRes.json();
        const locations = locationsData.locations || [];

        // Select Location Logic
        let selectedLocation = null;

        if (shopCode) {
            // Priority 1: Match Shop/Store Code exactly
            selectedLocation = locations.find((l: any) => l.storeCode === shopCode);
            if (selectedLocation) {
                console.log(`Connected via Shop Code match: ${shopCode}`);
            } else {
                console.warn(`Shop Code '${shopCode}' not found among ${locations.length} locations. Falling back to default.`);
            }
        }

        // Priority 2: Verified Location
        if (!selectedLocation) {
            selectedLocation = locations.find((l: any) => l.metadata?.verificationState === 'VERIFIED');
        }

        // Priority 3: Fallback to first
        if (!selectedLocation && locations.length > 0) {
            selectedLocation = locations[0];
        }

        // --- 3. Save Connection & Tokens ---
        // We use the specialized GBPConnection model for this
        await GBPConnection.findOneAndUpdate(
            { businessId },
            {
                refreshToken: tokens.refresh_token || 'EXISTING_OR_MISSING',
                googleAccountId: googleAccountId,
                accountName: account.accountName
            },
            { upsert: true }
        );

        if (!tokens.refresh_token) {
            console.warn('No refresh_token returned. User might need to re-auth for long-term access.');
        }

        // --- 4. Initialize Default Rules ---
        await ReplyRule.findOneAndUpdate(
            { businessId },
            {
                minStars: 4,
                maxStars: 5,
                mode: 'AUTO',
                dailyLimit: 20
            },
            { upsert: true }
        );

        // --- 5. Update Business Profile ---
        const updateData: any = {
            connected: true,
            accessToken: tokens.access_token // Store short-lived token for immediate use
        };

        if (selectedLocation) {
            const placeId = selectedLocation.metadata?.placeId || '';
            const reviewUrl = placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : '';

            // Update identifying info if found
            updateData.placeId = placeId;
            updateData.review_url = reviewUrl;

            if (selectedLocation.title) updateData.name = selectedLocation.title;
            if (selectedLocation.categories?.[0]?.displayName) updateData.category = selectedLocation.categories[0].displayName;
            if (selectedLocation.storeCode) updateData.location = selectedLocation.storeCode;
        }

        await Business.findOneAndUpdate(
            { id: businessId },
            { $set: updateData }
        );

        // Redirect back to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));

    } catch (err: any) {
        console.error('OAuth Error:', err);
        return NextResponse.json({ error: 'Failed to authenticate', details: err.message }, { status: 500 });
    }
}
