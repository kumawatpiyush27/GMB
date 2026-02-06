import { NextRequest, NextResponse } from 'next/server';
import { connectDB, GBPLocation, GBPReview, getBusiness } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    await connectDB();

    // 1. Get Business Data
    const biz = await getBusiness(id);
    if (!biz) {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // 2. Fetch Reviews by Google Location ID (GMB API) or Place ID (Places API)
    const queryId = biz.googleLocationId || biz.placeId;

    if (!queryId) {
        return NextResponse.json([]);
    }

    // 3. Fetch Reviews
    const reviews = await GBPReview.find({
        $or: [
            { locationId: queryId },
            { locationId: biz.placeId }
        ]
    }).sort({ createTime: -1 });

    return NextResponse.json(reviews);
}
