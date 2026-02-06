import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Business } from '@/lib/db';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    const baseUrl = request.nextUrl.origin;

    if (error) {
        return NextResponse.redirect(`${baseUrl}/login?error=${error}`);
    }

    if (!code) {
        return NextResponse.redirect(`${baseUrl}/login?error=no_code`);
    }

    try {
        // 1. Exchange Code for Tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: `${baseUrl}/api/auth/google/callback`,
                grant_type: 'authorization_code'
            })
        });

        const tokens = await tokenRes.json();
        if (tokens.error) throw new Error(tokens.error_description || tokens.error);

        // 2. Get User Info (Email)
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        const userData = await userRes.json();

        if (!userData.email) throw new Error('Could not get email from Google');

        await connectDB();

        // 3. Find or Create Business/User
        let business = await Business.findOne({ email: userData.email });

        if (!business) {
            // Create new business if signup
            const id = userData.email.split('@')[0] + '-' + Math.random().toString(36).slice(2, 5);
            business = await Business.create({
                id,
                name: userData.name || 'New Business',
                email: userData.email,
                connected: false,
                category: 'General',
                location: 'Not Set',
                isActive: true
            });
        }

        // 4. Redirect to Dashboard with success
        // In a real app, you'd set a session cookie here. 
        // For this app's pattern, we'll pass the ID to be set in localStorage.
        const response = NextResponse.redirect(`${baseUrl}/dashboard`);
        // We can't easily wait for localStorage on redirect, so we'll use a middle page or query param
        return NextResponse.redirect(`${baseUrl}/login?login_success=true&biz_id=${business.id}`);

    } catch (err: any) {
        console.error('Google Callback Error:', err);
        return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(err.message)}`);
    }
}
