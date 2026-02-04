import axios from 'axios';

// We now use an API KEY for Places API (Read-only but instant access)
// And OAuth for Login ONLY (Identity)

export class GoogleBusinessService {
    private businessId: string;
    private apiKey: string;

    constructor(businessId: string) {
        this.businessId = businessId;
        this.apiKey = process.env.GOOGLE_PLACES_API_KEY || ''; // Needs to be added to env
    }

    async init() {
        if (!this.apiKey) {
            console.warn('GOOGLE_PLACES_API_KEY is missing. Reviews cannot be fetched via Places API.');
        }
    }

    // 1. Fetch Accounts (No simplified equivalent in Places API, we skip or rely on Place ID)
    async fetchAccounts() {
        return [{ name: 'accounts/default' }]; // Dummy
    }

    // 2. Fetch Locations (We rely on the USER providing a Place ID now or us finding it via Text Search)
    async fetchLocations(accountId: string) {
        // In the new flow, we might need to search for the business if we don't have a placeId
        // But let's assume the user enters their Place ID or Name in the dashboard.

        // For automation to work without user input, we'd need the old API.
        // With Places API, we essentially fetch specific Place Details.
        return [];
    }

    // 3. Fetch Reviews (Using Places API Details)
    // We need the 'placeId' to fetch reviews.
    async fetchReviewsByPlaceId(placeId: string) {
        if (!this.apiKey || !placeId) return [];

        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,name,rating,user_ratings_total&key=${this.apiKey}`;

        try {
            const res = await axios.get(url);
            const data = (res.data as any).result;

            if (!data || !data.reviews) return [];

            // Map Places API format to our Internal format
            return data.reviews.map((r: any) => ({
                reviewId: r.time.toString() + r.author_name, // Places API doesn't give stable IDs easily, hash timestamp+author
                reviewer: { displayName: r.author_name },
                starRating: convertRatingNum(r.rating),
                comment: r.text,
                createTime: new Date(r.time * 1000).toISOString(),
                reviewReply: null // Places API doesn't return owner replies via Details usually
            }));

        } catch (e) {
            console.error('Error fetching details from Places API:', e);
            return [];
        }
    }

    // Legacy method signature needed for automation loop refactor
    async fetchReviews(accountId: string, locationId: string) {
        // "locationId" here is actually "placeId" in the new context
        return await this.fetchReviewsByPlaceId(locationId);
    }

    // 4. Post Reply
    // NOT SUPPORTED via Places API. We will just LOG that we drafted it.
    async replyToReview(accountId: string, locationId: string, reviewId: string, comment: string) {
        console.log(`[DRAFT ONLY] Would reply to ${reviewId}: ${comment}`);
        // We throw typical "Not Implemented" or just return true so automation marks it as "Drafted"
    }
}

function convertRatingNum(r: number) {
    if (r === 5) return "FIVE";
    if (r === 4) return "FOUR";
    if (r === 3) return "THREE";
    if (r === 2) return "TWO";
    return "ONE";
}
