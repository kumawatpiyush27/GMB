import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Business } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const { businessId, isActive } = await request.json();

        if (!businessId || typeof isActive !== 'boolean') {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const business = await Business.findOne({ id: businessId });
        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        business.isActive = isActive;
        await business.save();

        return NextResponse.json({ success: true, isActive: business.isActive });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
