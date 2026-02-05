import { NextRequest, NextResponse } from 'next/server';
import { createBusiness } from '../../../../lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.id || !body.name || !body.category || !body.location) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newBiz = await createBusiness({
            ...body,
            connected: false,
            seo_keywords: body.seo_keywords || [],
            stats: {
                totalReviews: 0,
                averageRating: 0.0,
                totalPosts: 0,
                lastUpdated: new Date().toISOString()
            }
        });

        return NextResponse.json(newBiz);
    } catch (err: any) {
        if (err.code === 11000) {
            return NextResponse.json({ error: 'Business ID already exists' }, { status: 409 });
        }
        console.error(err);
        return NextResponse.json({ error: 'Failed to register business' }, { status: 500 });
    }
}
