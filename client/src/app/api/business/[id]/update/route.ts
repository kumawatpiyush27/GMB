import { NextRequest, NextResponse } from 'next/server';
import { updateBusiness } from '@/lib/db';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const data = await request.json();

    // Merge new data with existing
    const updated = await updateBusiness(id, {
        ...data,
        connected: true
    });

    if (!updated) {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
}
