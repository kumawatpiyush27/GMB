import { NextRequest, NextResponse } from 'next/server';
import { connectDB, InteractionLog } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectDB();
    const { id } = await params;

    try {
        // Aggregate accurate counts
        const scans = await InteractionLog.countDocuments({ businessId: id, action: 'SCAN' });
        const copies = await InteractionLog.countDocuments({ businessId: id, action: 'COPY_REVIEW' });
        const redirects = await InteractionLog.countDocuments({ businessId: id, action: 'REDIRECT_GOOGLE' });

        return NextResponse.json({
            scans,
            copies,
            redirects
        });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
