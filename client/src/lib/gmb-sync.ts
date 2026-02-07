import { Business, GBPConnection, GBPReview, connectDB } from './db';

export async function syncGMBReviews(businessId: string) {
    await connectDB();

    // 1. Get Business and Connection
    const biz = await Business.findOne({ id: businessId });
    if (!biz || !biz.googleLocationId) {
        throw new Error('Business not connected to a GMB location');
    }

    const connection = await GBPConnection.findOne({ businessId });
    if (!connection || !connection.refreshToken) {
        throw new Error('Google Account not connected');
    }

    // NOTE: Ignore Google Cloud Console UI "API not enabled" errors.
    // Reviews are fetched directly using the Business Profile API (v1).

    // 2. Get Access Token using Refresh Token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: connection.refreshToken,
            grant_type: 'refresh_token'
        })
    });

    const tokens = await tokenRes.json();
    if (tokens.error) {
        throw new Error(`Auth failed: ${tokens.error_description || tokens.error}`);
    }

    const accessToken = tokens.access_token;

    // 3. Fetch Reviews using Business Profile API
    // GET https://businessprofile.googleapis.com/v1/locations/{locationId}/reviews

    // biz.googleLocationId is expected to be "locations/LOC_ID"
    const locationResource = biz.googleLocationId;

    // Ensure we are using the correct resource format
    if (!locationResource.startsWith('locations/')) {
        console.warn(`Warning: googleLocationId ${locationResource} might not be a valid resource name.`);
    }

    console.log(`Fetching reviews for: ${locationResource}`);

    const reviewsUrl = `https://businessprofile.googleapis.com/v1/${locationResource}/reviews?pageSize=50`;

    const reviewsRes = await fetch(reviewsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    // 6. Handle errors explicitly
    if (reviewsRes.status === 401) throw new Error('401 Unauthorized: Token expired or invalid');
    if (reviewsRes.status === 403) throw new Error('403 Forbidden: Missing scope or user not owner/manager');
    if (reviewsRes.status === 404) throw new Error(`404 Not Found: Location ${locationResource} not found`);

    if (!reviewsRes.ok) {
        const errorData = await reviewsRes.json().catch(() => ({}));
        console.error('GMB Review Sync API Error:', errorData);
        throw new Error(`GMB API Error: ${reviewsRes.status} ${errorData.error?.message || reviewsRes.statusText}`);
    }

    const reviewsData = await reviewsRes.json();

    // Handle Empty reviews case
    const gmbReviews = reviewsData.reviews || [];
    console.log(`Fetched ${gmbReviews.length} reviews for ${biz.name}`);
    let savedCount = 0;

    // We use biz.googleLocationId in the local DB for querying
    const dbLocationId = biz.googleLocationId;

    // 4. Upsert into Database (Key: reviewId)
    for (const r of gmbReviews) {
        const starRating = convertGMBRating(r.starRating);

        await GBPReview.findOneAndUpdate(
            { reviewId: r.reviewId },
            {
                locationId: dbLocationId,
                reviewerName: r.reviewer?.displayName || 'Anonymous',
                starRating: starRating,
                comment: r.comment || '',
                createTime: new Date(r.createTime),
                updateTime: new Date(r.updateTime),
                hasReply: !!r.reviewReply,
                replyComment: r.reviewReply?.comment || '',
                repliedAt: r.reviewReply?.updateTime ? new Date(r.reviewReply.updateTime) : undefined
            },
            { upsert: true, new: true }
        );
        savedCount++;
    }

    // 5. Update Business Stats
    // Always fetch ALL reviews for this location for stats
    const allReviews = await GBPReview.find({ locationId: dbLocationId });
    if (allReviews.length > 0) {
        const avg = allReviews.reduce((acc, curr) => acc + curr.starRating, 0) / allReviews.length;

        await Business.updateOne(
            { id: businessId },
            {
                'stats.totalReviews': allReviews.length,
                'stats.averageRating': parseFloat(avg.toFixed(1)),
                'stats.lastUpdated': new Date().toISOString()
            }
        );
    }

    return { count: savedCount };
}

function convertGMBRating(rating: string): number {
    const map: any = { 'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5 };
    return map[rating] || 0;
}
