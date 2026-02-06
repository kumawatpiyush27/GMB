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

    // 3. Construct Correct Resource Name for GMB v4 Review API
    // biz.googleLocationId is usually "locations/LOC_ID"
    // connection.googleAccountId is usually "accounts/ACC_ID"
    // API expects: "accounts/ACC_ID/locations/LOC_ID"

    let resourcePath = biz.googleLocationId;
    if (connection.googleAccountId && !resourcePath.includes('accounts/')) {
        resourcePath = `${connection.googleAccountId}/${biz.googleLocationId}`;
    }

    console.log(`Fetching reviews for resource: ${resourcePath}`);

    const reviewsUrl = `https://mybusiness.googleapis.com/v4/${resourcePath}/reviews`;

    const reviewsRes = await fetch(reviewsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    const reviewsData = await reviewsRes.json();

    if (reviewsData.error) {
        console.error('GMB Review Sync API Error:', reviewsData.error);
        throw new Error(`GMB API Error: ${reviewsData.error.message}`);
    }

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
