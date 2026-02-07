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

    // 3. DISCOVERY_PHASE: Verify Location Existence
    // We must strictly follow: Accounts -> Locations -> Reviews
    // This prevents "404 Not Found" by ensuring the location ID is valid for the current user agent.

    // Step A: Fetch all Accounts
    // GET https://businessprofile.googleapis.com/v1/accounts
    const accountsRes = await fetch('https://businessprofile.googleapis.com/v1/accounts', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!accountsRes.ok) {
        if (accountsRes.status === 401) throw new Error('401 Unauthorized: Token expired');
        throw new Error(`Failed to fetch accounts: ${accountsRes.status} ${accountsRes.statusText}`);
    }

    const accountsData = await accountsRes.json();
    const accounts = accountsData.accounts || [];

    if (accounts.length === 0) {
        throw new Error('No Business Profile accounts found for this user.');
    }

    let verifiedLocationName = '';
    const targetLocationId = biz.googleLocationId; // e.g., "locations/123456"

    console.log(`Starting discovery for target: ${targetLocationId} across ${accounts.length} accounts...`);

    // Step B: Iterate Accounts to find the Target Location
    for (const account of accounts) {
        const accountName = account.name; // e.g., "accounts/112233..."

        // Fetch locations for this specific account
        // GET https://businessprofile.googleapis.com/v1/accounts/{accountId}/locations
        // We only need the 'name' field to verify existence
        const locsUrl = `https://businessprofile.googleapis.com/v1/${accountName}/locations?readMask=name&pageSize=100`;

        try {
            const locsRes = await fetch(locsUrl, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (locsRes.status === 403) {
                console.warn(`Skipping account ${accountName}: 403 Forbidden`);
                continue;
            }

            if (!locsRes.ok) {
                console.warn(`Error fetching locations for ${accountName}: ${locsRes.status}`);
                continue;
            }

            const locsData = await locsRes.json();
            const locations = locsData.locations || [];

            // Check if our target location is in this list via strict string matching
            const match = locations.find((l: any) => l.name === targetLocationId);

            if (match) {
                verifiedLocationName = match.name;
                console.log(`✅ Success: Found location ${verifiedLocationName} in account ${accountName}`);
                break; // Found it, stop searching
            }

        } catch (err) {
            console.error(`Error checking account ${accountName}:`, err);
        }
    }

    // Step C: Validate Discovery Result
    if (!verifiedLocationName) {
        // If we checked all accounts and didn't find the location, it's truly inaccessible
        console.error(`❌ Critical: Location ${targetLocationId} not found in any linked account.`);
        throw new Error(`Location not found. Please ensure you are an owner/manager of this location in Google Business Profile.`);
    }

    // 4. Fetch Reviews using VERIFIED Location Name
    // GET https://businessprofile.googleapis.com/v1/locations/{locationId}/reviews
    console.log(`Fetching reviews for verified resource: ${verifiedLocationName}`);

    const reviewsUrl = `https://businessprofile.googleapis.com/v1/${verifiedLocationName}/reviews?pageSize=50`;

    const reviewsRes = await fetch(reviewsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    // Handle Review-specific errors
    if (reviewsRes.status === 404) {
        throw new Error(`404 Not Found: Google API claims location doesn't exist despite verification.`);
    }

    if (!reviewsRes.ok) {
        const errorData = await reviewsRes.json().catch(() => ({}));
        throw new Error(`GMB Review API Error: ${reviewsRes.status} ${errorData.error?.message || reviewsRes.statusText}`);
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
