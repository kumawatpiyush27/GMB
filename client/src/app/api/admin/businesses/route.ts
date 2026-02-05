import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Business } from '../../../../lib/db';

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const businesses = await Business.find({}, {
            id: 1, name: 1, location: 1, category: 1, connected: 1
        }).lean();

        return NextResponse.json(businesses);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
