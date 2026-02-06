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

        // --- 1. Save Connection & Tokens (Minimal) ---
        // We fetch accounts later in the selection screen to handle multiple accounts properly
        await connectDB();

        await GBPConnection.findOneAndUpdate(
            { businessId },
            {
                refreshToken: tokens.refresh_token || 'EXISTING_OR_MISSING',
                // We'll update googleAccountId and accountName when they actually select a location
            },
            { upsert: true }
        );

        if (!tokens.refresh_token) {
            console.warn('No refresh_token returned. User might need to re-auth for long-term access.');
        }

        // --- 2. Initialize Default Rules ---
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

        // --- 3. Redirect to Location Selection ---
        return NextResponse.redirect(new URL('/dashboard/select-location', request.url));

    } catch (err: any) {
        console.error('OAuth Error:', err);
        return NextResponse.json({ error: 'Failed to authenticate', details: err.message }, { status: 500 });
    }
}
