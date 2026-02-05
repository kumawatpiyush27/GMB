import { NextRequest, NextResponse } from 'next/server';
import { updateBusiness } from '../../../../lib/db';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');
    const shopCode = searchParams.get('shopCode');

    // Dynamic Redirect URI based on current domain
    const REDIRECT_URI = `${request.nextUrl.origin}/api/auth/callback`;

    if (!businessId) {
        return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    // --- SIMULATION MODE (If no Google Client ID) ---
    if (!GOOGLE_CLIENT_ID) {
        console.log('Google Client ID not found. Simulating OAuth flow for:', businessId);
        // ... (existing simulation code logic remains implicit if we don't change lines inside block)
        return NextResponse.redirect(`${request.nextUrl.origin}/dashboard`);
    }

    // --- REAL OAUTH FLOW ---

    // Scopes needed for reading reviews and business info
    const scopes = [
        'https://www.googleapis.com/auth/business.manage',
        'https://www.googleapis.com/auth/userinfo.email'
    ];

    // Encode state safely
    const stateObj = { b: businessId, s: shopCode || undefined };
    const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scopes.join(' ')}&access_type=offline&prompt=consent&state=${state}`;

    return NextResponse.redirect(url);
}
