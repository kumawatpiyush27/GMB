import { NextRequest, NextResponse } from 'next/server';
import { connectDB, InteractionLog } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const { action, reviewContent } = body;

    // Validate Action
    if (!['COPY_REVIEW', 'REDIRECT_GOOGLE'].includes(action)) {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    try {
        await InteractionLog.create({
            businessId: id,
            action,
            reviewContent: reviewContent || '',
            userAgent: request.headers.get('user-agent') || 'unknown'
        });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('Track Error:', e);
        return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
    }
}
