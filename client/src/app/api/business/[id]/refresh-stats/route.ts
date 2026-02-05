import { NextRequest, NextResponse } from 'next/server';
import { getBusiness, updateBusiness, connectDB, Business } from '@/lib/db';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    // We need the token to fetch GMB data, but it's hidden by default (select: false)
    await connectDB();
    const biz = await Business.findOne({ id }).select('+accessToken').lean() as any;

    if (!biz) {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Check for GMB Connection
    if (biz.accessToken) {
        try {
            // 1. Get Accounts
            const accountsRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
                headers: { Authorization: `Bearer ${biz.accessToken}` }
            });
            const accountsData = await accountsRes.json();

            if (accountsData.accounts && accountsData.accounts.length > 0) {
                const accountName = accountsData.accounts[0].name;

                // 2. Get Locations
                const locationsRes = await fetch(
                    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,categories,metadata,profile`,
                    { headers: { Authorization: `Bearer ${biz.accessToken}` } }
                );
                const locationsData = await locationsRes.json();

                if (locationsData.locations && locationsData.locations.length > 0) {
                    const location = locationsData.locations[0];
                    const updates: any = {};

                    if (location.categories?.primaryCategory?.displayName) {
                        updates.category = location.categories.primaryCategory.displayName;
                    }

                    if (location.metadata?.placeId) {
                        updates.placeId = location.metadata.placeId;
                        updates.review_url = `https://search.google.com/local/writereview?placeid=${location.metadata.placeId}`;
                    }

                    if (location.title) updates.name = location.title;

                    await updateBusiness(id, updates);
                }
            }
        } catch (error) {
            console.error('Failed to refresh GMB data', error);
        }
    }

    // Keep simulation for stats for now (Real GMB stats API is separate) or just touch the date
    // Keep simulation for stats for now (Real GMB stats API is separate) or just touch the date
    const newStats = {
        totalReviews: biz.stats?.totalReviews || 0,
        averageRating: biz.stats?.averageRating || 0,
        totalPosts: biz.stats?.totalPosts || 0,
        totalScans: biz.stats?.totalScans || 0, // Added
        lastUpdated: new Date().toISOString()
    };

    const updated = await updateBusiness(id, { stats: newStats });
    return NextResponse.json(updated);
}
