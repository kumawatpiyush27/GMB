import { NextRequest, NextResponse } from 'next/server';
import { generateReviews as generateStaticReviews } from '@/lib/reviewGenerator';

const OPENAI_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { businessName, customer_name, visited_for, product_bought, location, seo_keywords, experience_notes } = body;

        // 1. Try OpenAI Generation
        try {
            const prompt = `
            You are a happy customer writing a Google Review for a business.
            Business Name: "${businessName}"
            Location: "${location}"
            Category/Service: "${visited_for}"
            ${product_bought ? `Product Bought: "${product_bought}"` : ''}
            ${seo_keywords?.length ? `Keywords to naturally include: ${seo_keywords.join(', ')}` : ''}
            ${experience_notes?.length ? `Specific Context: ${experience_notes.join(', ')}` : ''}

            Task: Generate 5 completely unique, distinct, and human-sounding 5-star reviews.
            The reviews should vary in length and tone.
            
            Styles required:
            1. Short & Sweet (One sentence)
            2. Detailed Experience (2-3 sentences)
            3. Enthusiastic/Excited (Uses emojis)
            4. Professional/Formal
            5. Grateful/Appreciative

            Return ONLY a valid JSON object where keys are the style names above and values are the review text provided.
            Do not include any markdown formatting or code blocks. Just the raw JSON.
            `;

            const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENAI_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini", // Cost effective and fast
                    messages: [
                        { role: "system", content: "You are a helpful AI that generates authentic customer reviews." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.9, // High creativity for uniqueness
                    response_format: { type: "json_object" }
                })
            });

            if (!aiRes.ok) throw new Error(`OpenAI API Error: ${aiRes.statusText}`);

            const aiData = await aiRes.json();
            const content = aiData.choices[0].message.content;
            const parsedReviews = JSON.parse(content);

            return NextResponse.json(parsedReviews);

        } catch (aiError) {
            console.error("AI Generation Failed, falling back to static:", aiError);
            // Fallthrough to static
        }

        // 2. Fallback: Static Generation
        const reviews = generateStaticReviews({
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
