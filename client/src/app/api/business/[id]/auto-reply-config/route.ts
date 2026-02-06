import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Business from '@/lib/models/Business';
import jwt from 'jsonwebtoken';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const businessId = params.id;

        // Verify ownership
        if (decoded.businessId !== businessId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { mode, minStars, dailyLimit } = body;

        await connectDB();
        await Business.findByIdAndUpdate(businessId, {
            autoReplyConfig: {
                mode,
                minStars,
                dailyLimit,
                repliedToday: 0,
                lastReplyDate: new Date().toISOString().split('T')[0]
            }
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
