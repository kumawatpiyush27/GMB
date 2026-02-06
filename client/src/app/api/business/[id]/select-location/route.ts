import { NextRequest, NextResponse } from 'next/server';
import { connectDB, GBPConnection, Business, ReplyRule } from '@/lib/db';
import { syncGMBReviews } from '@/lib/gmb-sync';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: businessId } = await params;
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

        // Use Address for location display instead of storeCode
        const address = location.storefrontAddress;
        let locationDisplay = '';
        if (address) {
            const city = address.locality || '';
            const state = address.administrativeArea || '';
            locationDisplay = city && state ? `${city}, ${state}` : (city || state || '');
        }

        if (!locationDisplay && location.storeCode) {
            locationDisplay = location.storeCode;
        }

        if (locationDisplay) updateData.location = locationDisplay;
        if (location.storeCode) updateData.storeCode = location.storeCode;

        // Also save the Google Location ID specifically
        updateData.googleLocationId = location.name;
        updateData.googleLocationName = location.title;

        await Business.findOneAndUpdate(
            { id: businessId },
            { $set: updateData }
        );

        // 4. Initial Review Sync (Optional but better for UX)
        try {
            await syncGMBReviews(businessId);
        } catch (e) {
            console.error('Initial sync failed:', e);
            // Don't fail the whole request if sync fails
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error selecting location:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
