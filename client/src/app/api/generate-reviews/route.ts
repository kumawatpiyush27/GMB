import { NextRequest, NextResponse } from 'next/server';
import { generateReviews as generateStaticReviews } from '@/lib/reviewGenerator';

const OPENAI_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { businessName, customer_name, visited_for, product_bought, location, seo_keywords, experience_notes } = body;

        // 1. Try OpenAI Generation (Requires ENV Var)
        try {
            const prompt = `
            You are a local resident and happy customer writing a Google Review for a business.
            
            --- BUSINESS CONTEXT ---
            Name: "${businessName}"
            Location: "${location}"
            Category: "${visited_for}"
            ${product_bought ? `Product/Service: "${product_bought}"` : ''}
            ${seo_keywords?.length ? `Keywords to Integrate: ${seo_keywords.join(', ')}` : ''}
            ${experience_notes?.length ? `Specific Context: ${experience_notes.join(', ')}` : ''}

            --- DEEP ANALYSIS INSTRUCTION ---
            1. **Determine Business Nature**:
               - Is it a **D2C Brand**? (Focus: Packaging, Website UX, Delivery, Quality)
               - Is it a **Local Shop/Showroom**? (Focus: Staff Name, Parking, Crowd, Ambiance, "Hidden Gem")
               - Is it a **Service Agency**? (Focus: ROI, Communication, Deadlines, Trust)
               - Is it a **Corporate Office**? (Focus: Professionalism, Culture, Infrastructure)

            2. **Optimization Strategy (SEO + GEO + AEO)**:
               - **SEO**: Naturally weave in the provided keywords. Don't stuff them.
               - **GEO**: Mention "${location}" explicitly. Mention nearby landmarks or neighborhoods if known (hallucinate plausible local details if needed for realism, e.g., "near the market", "in the city center").
               - **AEO (Answer Engine Optimization)**: Phrase parts of the review to answer questions like "Is ${businessName} good for...?", "Best ${visited_for} in ${location}?".

            3. **Humanization (Crucial)**:
               - Use natural, slightly imperfect language (varied sentence length).
               - Express genuine emotion (relief, excitement, gratitude).
               - Avoid robotic/marketing fluff like "unparalleled excellence" or "top-notch solution". Use "game changer", "lifesaver", "super helpful".

            --- GENERATE 5 REVIEWS ---
            Create 5 completely distinct reviews in these styles:
            1. **The Storyteller**: A detailed paragraph sharing a specific problem and how this business solved it.
            2. **Short & Punchy**: 1-2 impactful sentences. High confidence.
            3. **The Local Expert**: Mentions location/neighborhood context. "Best spot in ${location}..."
            4. **Value-Focused**: Focuses on price/quality ratio. "Worth every penny".
            5. **Appreciative/Personal**: Mentions staff behavior or specific service aspect. "Big thanks to the team..."

            --- OUTPUT ---
            Return ONLY a valid raw JSON object. Keys: "Storyteller", "Short", "Local_Expert", "Value", "Appreciative".
            Values: The review text.
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

        } catch (aiError: any) {
            console.error("AI Generation Failed, falling back to static:", aiError);

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
        }
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to generate reviews' }, { status: 500 });
    }
}
