
interface ReviewInput {
    businessName?: string; // Added
    customer_name?: string;
    visited_for: string;
    product_bought?: string;
    location: string;
    seo_keywords: string[];
    secondary_categories?: string[];
    experience_notes: string[];
}

export function generateReviews(input: ReviewInput) {
    const { businessName, visited_for, product_bought, location, seo_keywords, experience_notes, secondary_categories } = input;

    // Helper to get random item
    const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    // Detect Mode
    const catLower = (visited_for || "").toLowerCase();
    const isProduct = !!product_bought && product_bought.length > 0;
    const isSoftware = catLower.includes('software') || catLower.includes('marketing') || catLower.includes('agency') || catLower.includes('solution') || catLower.includes('development') || catLower.includes('consultant') || catLower.includes('seo') || catLower.includes('design');

    // Core Variables
    const item = isProduct ? product_bought : (visited_for || "service");
    const placeContext = secondary_categories?.[0] || visited_for || "place";
    const kw1 = pick(seo_keywords) || "service";
    const kw2 = pick(seo_keywords.filter(k => k !== kw1)) || "support";
    const bizName = businessName || "They";

    // Defaults based on Mode
    const serviceNotes = ["team was helpful", "service was prompt", "communication was great", "smooth process"];
    const productNotes = ["quality is A1", "price is reasonable", "material is great", "worth the money"];
    const softwareNotes = ["support team is responsive", "easy to integrate", "features are powerful", "improved our workflow", "highly reliable"];

    const workingNotes = experience_notes.length > 0 ? experience_notes : (isProduct ? productNotes : (isSoftware ? softwareNotes : serviceNotes));
    const note = pick(workingNotes);
    const noteFormatted = formatNote(note);

    let reviews = {};

    if (isProduct) {
        // --- PRODUCT FOCUSED REVIEWS ---
        reviews = {
            "Short & Sweet": `I bought ${item} from here. Quality is top-notch and ${noteFormatted}. Best shop in ${location}!`,
            "Value Analysis": `Bought ${item} recently. The build quality is amazing for the price. ${noteFormatted}. Highly recommended if you are in ${location}.`,
            "Enthusiastic": `Wow! Loving my new ${item}. I was looking for the best quality and found it here. ${formatNote(pick(productNotes))}. 5 Stars!`,
            "Detailed": `I was looking for ${item} in ${location} and found this store. Wide variety available. ${noteFormatted}. Staff was also very helpful. Will buy again.`,
            "Direct": `Best place for ${item}. ${noteFormatted}. Value for money product. ⭐⭐⭐⭐⭐`
        };
    } else if (isSoftware) {
        // --- SOFTWARE/B2B REVIEWS (Customized for Retner/Agency) ---
        reviews = {
            "Website + SEO": `${bizName} built our ecommerce website and handled complete SEO. Our website traffic improved significantly and rankings started growing within weeks. Best website development and SEO service in ${location} for ecommerce brands.`,
            "Software + Automation": `We use ${bizName} for WhatsApp marketing automation and customer retention. Their software helped us increase repeat orders and automate follow-ups. Very reliable software company in ${location}.`,
            "Shopify + SEO": `${bizName} worked on our Shopify website development and SEO. They understand ecommerce deeply and helped us improve conversions and organic traffic. Highly recommended ecommerce SEO agency.`,
            "D2C Brand Approach": `${bizName} is a great D2C marketing platform. From website development to WhatsApp automation and SEO, everything was handled professionally. One of the best digital marketing companies for ecommerce.`,
            "Service Experience": `Great experience with this ${visited_for}. ${noteFormatted}. The team provided exactly what we needed to scale. Recommended!`
        };
    } else {
        // --- GENERAL SERVICE REVIEWS ---
        reviews = {
            "Short & Sweet": `Great experience with this ${visited_for}. ${noteFormatted}. Best service in ${location} hands down.`,
            "Staff Appreciation": `Excellent service from this ${visited_for}. The team is very polite and professional. ${noteFormatted}. Best ${kw1} in ${location}.`,
            "Detailed Story": `I was looking for a good ${placeContext} for a long time. Finally found the right one. ${noteFormatted}. The team is very knowledgeable and ${pick(serviceNotes)}. Thank you!`,
            "Professional": `Highly professional service. My experience with this ${visited_for} was totally satisfying. ${noteFormatted}. Recommended for everyone in ${location}.`,
            "Casual": `${visited_for} was amazing! ${noteFormatted}. Great results. Highly recommend them in ${location}.`
        };
    }

    return reviews;
}

function formatNote(note: string): string {
    return note.charAt(0).toUpperCase() + note.slice(1);
}
