import { NextRequest, NextResponse } from 'next/server';
import { getBusiness, connectDB, Business, InteractionLog } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await connectDB();
    const { id } = await params;

    // Log Scan (Analytics)
    // We do this asynchronously without blocking the response too much, or just await it.
    try {
        await Business.updateOne({ id }, { $inc: { 'stats.totalScans': 1 } });
        await InteractionLog.create({
            businessId: id,
            action: 'SCAN',
            userAgent: request.headers.get('user-agent') || 'unknown'
        });
    } catch (e) {
        console.error('Error logging scan:', e);
    }

    const biz = await getBusiness(id);
    if (!biz) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    // Return safe data only
    return NextResponse.json({
        name: biz.name,
        category: biz.category,
        location: biz.location,
        placeId: biz.placeId,
        review_url: biz.review_url,
        keywords: biz.seo_keywords
    });
}
