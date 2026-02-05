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
            
            --- BUSINESS DETAILS ---
            Name: "${businessName}"
            Location: "${location}"
            Category: "${visited_for}"
            ${product_bought ? `Product/Service Purchased: "${product_bought}"` : ''}
            ${seo_keywords?.length ? `Keywords: ${seo_keywords.join(', ')}` : ''}
            ${experience_notes?.length ? `Context/Notes: ${experience_notes.join(', ')}` : ''}

            --- INSTRUCTIONS ---
            1. **Analyze the Business Type**: Based on the Category and Name, decide if this is a:
               - **D2C/E-commerce Brand** (Focus on: website experience, packaging, delivery speed, product quality).
               - **Physical Store/Showroom** (Focus on: ambiance, staff behavior, variety, parking/location).
               - **Corporate/IT Office** (Focus on: professionalism, work culture, delivery, technical expertise).
               - **Service Provider** (Focus on: timeliness, communication, problem-solving).
            
            2. **Generate 5 Distinct 5-Star Reviews**:
               - Write completely unique reviews tailored to the identified Business Type.
               - ALL reviews must be positive (5 stars).
               - STRICTLY FOLLOW these 5 distinct styles:
                 a) **Short & Sweet**: One impactful sentence.
                 b) **Detailed Experience**: 3-4 sentences describing the specific experience/outcome.
                 c) **Enthusiastic**: High energy, uses emojis (e.g. 🚀, ⭐, 🔥).
                 d) **Professional/Appreciative**: Formal tone, focusing on value and reliability.
                 e) **Direct Recommendation**: "Highly recommend because..." style.

            --- OUTPUT FORMAT ---
            Return ONLY a valid, raw JSON object (no markdown, no code blocks) with these exact keys:
            {
                "Short & Sweet": "...",
                "Detailed Experience": "...",
                "Enthusiastic": "...",
                "Professional": "...",
                "Direct Recommendation": "..."
            }
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
