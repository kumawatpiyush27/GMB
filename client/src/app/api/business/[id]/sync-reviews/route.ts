import { NextRequest, NextResponse } from 'next/server';
import { syncGMBReviews } from '@/lib/gmb-sync';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const result = await syncGMBReviews(id);
        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        console.error('Error syncing reviews:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
