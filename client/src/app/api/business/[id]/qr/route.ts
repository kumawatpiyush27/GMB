import { NextRequest, NextResponse } from 'next/server';
import { getBusiness } from '@/lib/db';
import QRCode from 'qrcode';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const biz = await getBusiness(id);
    if (!biz) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    // The URL the QR points to (The Customer App)
    const clientBaseUrl = process.env.CLIENT_URL || request.nextUrl.origin;
    const reviewUrl = `${clientBaseUrl}/r/${id}`;

    try {
        const qrDataUrl = await QRCode.toDataURL(reviewUrl);
        return NextResponse.json({ qrImage: qrDataUrl, url: reviewUrl });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'QR Gen failed' }, { status: 500 });
    }
}
