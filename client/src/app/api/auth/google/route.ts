import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const REDIRECT_URI = `${request.nextUrl.origin}/api/auth/google/callback`;

    // Scopes for GMB and Profile
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/business.manage'
    ].join(' ');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID!,
            redirect_uri: REDIRECT_URI,
            response_type: 'code',
            scope: scopes,
            access_type: 'offline',
            prompt: 'consent'
        }).toString();

    return NextResponse.redirect(authUrl);
}
