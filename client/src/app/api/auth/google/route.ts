import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = [
    'https://www.googleapis.com/auth/business.manage',
    'https://www.googleapis.com/auth/userinfo.email'
];

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');

    if (!businessId) {
        return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
        response_type: 'code',
        scope: SCOPES.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        state: businessId // Pass businessId to callback
    });

    return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}
