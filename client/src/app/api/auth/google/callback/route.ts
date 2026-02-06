import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Business from '@/lib/models/Business';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // businessId
    const error = searchParams.get('error');

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;

    if (error) {
        return NextResponse.redirect(`${baseUrl}/dashboard/auto-reply?error=${error}`);
    }

    if (!code || !state) {
        return NextResponse.redirect(`${baseUrl}/dashboard/auto-reply?error=missing_params`);
    }

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI,
                grant_type: 'authorization_code'
            })
        });

        if (!tokenResponse.ok) {
            throw new Error('Failed to exchange code for tokens');
        }

        const tokens = await tokenResponse.json();

        // Fetch GMB locations
        const locationsResponse = await fetch(
            'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
            {
                headers: {
                    'Authorization': `Bearer ${tokens.access_token}`
                }
            }
        );

        const locationsData = await locationsResponse.json();
        const firstAccount = locationsData.accounts?.[0];

        if (!firstAccount) {
            return NextResponse.redirect(`${baseUrl}/dashboard/auto-reply?error=no_gmb_account`);
        }

        // Fetch locations for this account
        const accountLocations = await fetch(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${firstAccount.name}/locations`,
            {
                headers: {
                    'Authorization': `Bearer ${tokens.access_token}`
                }
            }
        );

        const locData = await accountLocations.json();
        const firstLocation = locData.locations?.[0];

        // Save tokens to database
        await connectDB();
        await Business.findByIdAndUpdate(state, {
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token,
            googleLocationId: firstLocation?.name || '',
            googleLocationName: firstLocation?.title || 'Unknown Location'
        });

        return NextResponse.redirect(`${baseUrl}/dashboard/auto-reply?success=true`);
    } catch (err: any) {
        console.error('OAuth callback error:', err);
        return NextResponse.redirect(`${baseUrl}/dashboard/auto-reply?error=${err.message}`);
    }
}
