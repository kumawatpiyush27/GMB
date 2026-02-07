import { Business, GBPConnection, GBPReview, connectDB } from './db';

// --- Interfaces for Type Safety ---
interface GmbAccount {
    name: string; // "accounts/..."
    accountName: string; // Display name
    type: string; // PERSONAL, LOCATION_GROUP, ORGANIZATION
    role: string; // PRIMARY_OWNER, OWNER, MANAGER, SITE_MANAGER
    state: { status: string };
}

interface GmbLocation {
    name: string; // "locations/..."
    title: string;
    metadata?: {
        placeId?: string;
        verificationState?: string; // VERIFIED, UNVERIFIED, PENDING
    };
}

/**
 * Syncs Google Business Profile reviews for a given business.
 * Strictly enforces Account -> Location -> Review hierarchy to prevent 404s.
 */
export async function syncGMBReviews(businessId: string) {
    await connectDB();

    // 1. Load Business & Connection Context
    const biz = await Business.findOne({ id: businessId });
    if (!biz || !biz.googleLocationId) throw new Error('Business not connected to a GMB location');

    const connection = await GBPConnection.findOne({ businessId });
    if (!connection || !connection.refreshToken) throw new Error('Google Account not connected');

    // 2. Refresh Access Token (Store validation happens in discovery)
    const accessToken = await getAccessToken(connection.refreshToken);

    // 3. DISCOVERY PHASE: Validate Ownership & Location Existence
    console.log(`[Sync] Discovery started for Business: ${biz.name} (Target: ${biz.googleLocationId})`);

    const accounts = await fetchAccounts(accessToken);
    if (accounts.length === 0) throw new Error('No Google Business Profile accounts found.');

    let verifiedResourceName = '';
    let ownerAccessConfirmed = false;
    let discoveredAccountName = ''; // Track which account owns this location

    // Iterate accounts to find the one that owns this location
    for (const account of accounts) {
        console.log(`[Sync] Checking Account: ${account.name} (Role: ${account.role})`);

        // Check if our target location exists in this account's graph
        try {
            // Fetch locations for this specific VALID account
            const locations = await fetchLocations(accessToken, account.name);

            // Check if our target location exists in this list
            const match = locations.find(l => l.name === biz.googleLocationId);

            if (match) {
                console.log(`[Sync] ✅ Success: Location found in account ${account.name} (User Role: ${account.role})`);
                verifiedResourceName = match.name;
                discoveredAccountName = account.name; // Save the account that owns this location
                ownerAccessConfirmed = true; // We accept whatever role Google allowed us to list
                break; // Stop discovery, we found it
            }
        } catch (err: any) {
            console.error(`[Sync] Error checking locations for ${account.name}:`, err.message);
        }
    }

    if (!verifiedResourceName) {
        throw new Error(`Location ${biz.googleLocationId} not found in any linked PRO account.`);
    }

    // 4. FETCH PHASE: Get Reviews from Validated Location
    // We strictly use the v1 Business Profile API.
    // The previous v4 fallback caused a 403 (API Not Enabled), confirming we must fix the v1 404 root cause.

    // Root Cause Analysis for v1 404:
    // If a location exists in the account list but returns 404 for reviews, it is usually:
    // 1. NOT VERIFIED
    // 2. SUSPENDED
    // 3. PENDING VERIFICATION

    // Let's re-fetch the specific location details to check its status before fetching reviews
    // This helps us give a precise error message instead of a generic 404
    let locationDetails: any = null;
    let finalAccountName = discoveredAccountName; // Start with the account we found during discovery

    // Re-find the account to get the full location details (metadata)
    for (const account of accounts) {
        try {
            // We need 'metadata' to check verification details
            const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,metadata&pageSize=100`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
            const data = await res.json();
            const match = (data.locations || []).find((l: any) => l.name === verifiedResourceName);

            if (match) {
                locationDetails = match;
                finalAccountName = account.name;
                break;
            }
        } catch (e) { }
    }

    if (locationDetails) {
        // Log details to debug why metadata might be missing or what the state is
        console.log(`[Sync] Location Details Found:`, JSON.stringify(locationDetails, null, 2));
        const state = locationDetails.metadata?.verificationState;
        console.log(`[Sync] Reported Verification State: ${state}`);
        // We will NOT block here anymore, as the UI shows "Verified" even if API implies otherwise
    } else {
        console.warn(`[Sync] Could not retreive full location details for metadata check.`);
    }

    // Validate we have the account name before proceeding
    if (!finalAccountName) {
        throw new Error(`Failed to determine account name for location ${verifiedResourceName}`);
    }

    console.log(`[Sync] Fetching reviews for verified resource: ${verifiedResourceName}`);
    console.log(`[Sync] Using account: ${finalAccountName}`);

    // CRITICAL FIX: Business Profile API v1 requires account context in the path
    // Incorrect: https://businessprofile.googleapis.com/v1/locations/{locationId}/reviews
    // Correct: https://businessprofile.googleapis.com/v1/{accountName}/locations/{locationId}/reviews

    // Extract location ID from the full resource name (e.g., "locations/12345" -> "12345")
    const locationId = verifiedResourceName.split('/').pop();

    // Build the correct URL with account context
    const reviewsUrl = `https://businessprofile.googleapis.com/v1/${finalAccountName}/locations/${locationId}/reviews?pageSize=50`;
    console.log(`[Sync] Review URL: ${reviewsUrl}`);

    const reviewsRes = await fetch(reviewsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log(`[Sync] Review API Status: ${reviewsRes.status}`);

    // Handle Review-specific errors
    if (reviewsRes.status === 404) {
        const errBody = await reviewsRes.text();
        console.error(`[Sync] 404 Response Body:`, errBody);
        throw new Error(`404 Not Found: Reviews endpoint unavailable. URL: ${reviewsUrl}. Body: ${errBody}`);
    }

    if (!reviewsRes.ok) {
        const err = await reviewsRes.json().catch(() => ({}));
        throw new Error(`Review API Error: ${reviewsRes.status} ${err.error?.message || reviewsRes.statusText}`);
    }

    const reviewsData = await reviewsRes.json();
    const gmbReviews = reviewsData.reviews || [];

    console.log(`[Sync] Fetched ${gmbReviews.length} reviews.`);

    // 5. DATABASE UPDATE PHASE
    let savedCount = 0;
    const dbLocationId = biz.googleLocationId;

    for (const r of gmbReviews) {
        await GBPReview.findOneAndUpdate(
            { reviewId: r.reviewId },
            {
                locationId: dbLocationId,
                reviewerName: r.reviewer?.displayName || 'Anonymous',
                starRating: convertGMBRating(r.starRating),
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

    // Update Aggregates
    await updateBusinessStats(businessId, dbLocationId);

    return { count: savedCount };
}

// --- HELPER FUNCTIONS ---

async function getAccessToken(refreshToken: string): Promise<string> {
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
        })
    });

    const data = await res.json();
    if (data.error) throw new Error(`Token Refresh Failed: ${data.error_description || data.error}`);
    return data.access_token;
}

async function fetchAccounts(accessToken: string): Promise<GmbAccount[]> {
    // GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts
    const res = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
        if (res.status === 401) throw new Error('401 Unauthorized: Refresh token invalid?');
        throw new Error(`Accounts API Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data.accounts || [];
}

async function fetchLocations(accessToken: string, accountName: string): Promise<GmbLocation[]> {
    // GET https://mybusinessbusinessinformation.googleapis.com/v1/{accountName}/locations
    // We only need the name to verify existence and metadata for status
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,metadata&pageSize=100`;

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
        // Warning only, don't crash whole sync if one account fails
        console.warn(`[Sync] Location fetch failed for ${accountName}: ${res.status}`);
        return [];
    }

    const data = await res.json();
    return data.locations || [];
}

async function updateBusinessStats(businessId: string, locationId: string) {
    const allReviews = await GBPReview.find({ locationId });
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
}

function convertGMBRating(rating: string): number {
    const map: any = { 'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5 };
    return map[rating] || 0;
}
