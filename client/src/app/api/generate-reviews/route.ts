import { NextRequest, NextResponse } from 'next/server';
import { generateReviews } from '@/lib/reviewGenerator';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { businessName, customer_name, visited_for, product_bought, location, seo_keywords, experience_notes } = body;

        const reviews = generateReviews({
            businessName,
            customer_name,
            visited_for,
            product_bought,
            location,
            seo_keywords,
            experience_notes
        });

        return NextResponse.json(reviews);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to generate reviews' }, { status: 500 });
    }
}
