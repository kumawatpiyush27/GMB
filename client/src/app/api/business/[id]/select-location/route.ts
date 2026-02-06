import { NextRequest, NextResponse } from 'next/server';
import { connectDB, GBPConnection, Business, ReplyRule } from '@/lib/db';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const businessId = params.id;
        const { location, accountName } = await request.json();

        if (!location || !accountName) {
            return NextResponse.json({ error: 'Missing location or account info' }, { status: 400 });
        }

        await connectDB();

        // 1. Update Connection with the specific account ID responsible for this location
        await GBPConnection.findOneAndUpdate(
            { businessId },
            {
                googleAccountId: accountName, // Update to the correct account
            }
        );

        // 2. Initialize Default Rules if not exists
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

        // 3. Update Business Profile
        const placeId = location.metadata?.placeId || '';
        const reviewUrl = placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : '';

        const updateData: any = {
            connected: true,
            placeId: placeId,
            review_url: reviewUrl
        };

        if (location.title) updateData.name = location.title;
        if (location.categories?.[0]?.displayName) updateData.category = location.categories[0].displayName;
        if (location.storeCode) updateData.location = location.storeCode;

        // Also save the Google Location ID specifically
        updateData.googleLocationId = location.name;
        updateData.googleLocationName = location.title;

        await Business.findOneAndUpdate(
            { id: businessId },
            { $set: updateData }
        );

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error selecting location:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
