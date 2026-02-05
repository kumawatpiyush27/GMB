import { NextRequest, NextResponse } from 'next/server';
import { connectDB, GBPLocation, GBPReview, getBusiness } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    await connectDB();

    // 1. Find Location ID for this Business
    const location = await GBPLocation.findOne({ businessId: id });

    if (!location) {
        // Fallback: If no synced location (or using Place ID mode without full location sync), 
        // we might check if there are reviews with locationId matching the business's placeId.
        // But for now, let's try to query by locationId OR just return empty if not found.

        // Alternative: Query reviews where locationId is the PlaceID stored in Business?
        // Let's stick to the automation logic: automation saves reviews with locationId = biz.placeId
        // So we should query for that.

        const biz = await getBusiness(id);

        if (biz && biz.placeId) {
            const reviews = await GBPReview.find({ locationId: biz.placeId })
                .sort({ createTime: -1 });
            return NextResponse.json(reviews);
        }

        return NextResponse.json([]);
    }

    // 2. Fetch Reviews
    const reviews = await GBPReview.find({ locationId: location.locationId })
        .sort({ createTime: -1 }); // Newest first
    return NextResponse.json(reviews);
}
