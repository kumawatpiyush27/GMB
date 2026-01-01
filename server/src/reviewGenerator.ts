
interface ReviewInput {
    customer_name?: string;
    visited_for: string;
    product_bought?: string;
    location: string;
    seo_keywords: string[];
    experience_notes: string[];
}

export function generateReviews(input: ReviewInput) {
    const { visited_for, product_bought, location, seo_keywords, experience_notes } = input;

    // Helper to get random item
    const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const pickMany = <T>(arr: T[], count: number): T[] => {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    };

    // Fallbacks
    const product = product_bought || visited_for;
    const keyword = pick(seo_keywords) || location;
    const notes = experience_notes.length > 0 ? experience_notes : ["service achi thi", "experience badhiya tha"];

    // Clean notes (simple heuristic to fit in sentences)
    // We assume notes are short phrases like "staff helpful" -> "staff helpful hai" logic might be needed if they are raw.
    // But user example output shows full sentences constructed from notes.
    // Input: "design looks traditional" -> Output: "design bohot pasand aaya" (Wait, the example transformed it).
    // "weight balanced" -> "Weight balanced hai"

    // Since we can't do full NLP, we will treat notes as fragments that can be appended or slightly wrapped.
    const note1 = notes[0] ? formatNote(notes[0]) : "sab kuch perfect tha";
    const note2 = notes[1] ? formatNote(notes[1]) : "quality bemisaal hai";
    const note3 = notes[2] ? formatNote(notes[2]) : "vibe bahut positive hai";

    // --- SHORT Review (15-25 words) ---
    const shortTemplates = [
        `${product} liya aur ${note1}. ${note2}. ${location} me agar ${keyword} chahiye toh ye best jagah hai.`,
        `${visited_for} ke liye visit kiya. ${note1} aur ${note2}. ${location} me recommended!`,
        `Great experience for ${visited_for}. ${product} quality is amazing. ${note1}. Must visit in ${location}.`
    ];

    // --- MEDIUM Review (35-60 words) ---
    const mediumTemplates = [
        `Aaj ${product} kharida aur maza aa gaya. ${note1} aur ${note2}. ${location} me ${keyword} ke liye isse behtar option nahi milega. ${visited_for} ka decision successful raha.`,
        `Recently visited for ${visited_for}. ${product} ki range dekh kar khushi hui. ${note1}. Staff very cooperative. If you are looking for ${keyword} in ${location}, definitely check this out.`,
        `${product} lene ke liye best jagah. ${note1} aur price bhi reasonable laga. ${note2}. ${location} ke logo ko ${keyword} ke liye yahi aana chahiye. Highly recommended!`
    ];

    // --- LONG Review (80-140 words) ---
    const longTemplates = [
        `${visited_for} ke liye main yaha aaya tha aur experience memorable raha. Maine ${product} liya aur main satisfied hoon. ${note1}. ${note2}. Staff ne bhi bohot acche se guide kiya, specially ${note3}. ${location} me agar aap ${keyword} dhoond rahe hain toh ye place perfect hai. Overall service aur quality dono top notch lage.`,
        `I visited specifically for ${visited_for} and was not disappointed. The ${product} is exactly what I needed. ${note1}, which suggests good attention to detail. Also, ${note2}. It's hard to find such genuine ${keyword} in ${location} these days. Even the ${note3}. I will definitely recommend this place to my friends and family.`,
        `Bahut hi badhiya experience raha ${visited_for} ka. ${product} ki quality dekh kar laga ki sahi jagah aaye hain. ${note1}. ${note2}. Mujhe specially unka vyavahaar accha laga - ${note3}. ${location} mein ${keyword} ke liye main sabko yehi suggest karunga. Clean space, good vibes, and genuine products.`
    ];

    return {
        Short: pick(shortTemplates),
        Medium: pick(mediumTemplates),
        Long: pick(longTemplates)
    };
}

function formatNote(note: string): string {
    // extensive logic could go here to conjugate verbs etc, but for now simple return
    // Maybe capitalize first letter
    return note.charAt(0).toUpperCase() + note.slice(1);
}
