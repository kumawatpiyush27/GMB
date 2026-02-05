import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Business } from '../../../../../lib/db';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await connectDB();

        const res = await Business.deleteOne({ id });

        if (res.deletedCount === 0) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
