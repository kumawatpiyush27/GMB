import { NextRequest, NextResponse } from 'next/server';
import { getBusiness } from '../../../../lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const biz = await getBusiness(id);

    if (!biz) {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json(biz);
}
