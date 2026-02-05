import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Business, GBPReview, ReplyRule, ReplyLog } from '../../../../lib/db';
import { GoogleBusinessService } from '../../../../lib/google';

// This route should be called by Vercel Cron or manually
export async function GET(request: NextRequest) {
    try {
        // Authenticate Cron Request (Optional: Check header)
        // const authHeader = request.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //     return new Response('Unauthorized', { status: 401 });
        // }

        console.log('Starting Automation Sync...');
        await connectDB();
        await runSyncAndReply();

        return NextResponse.json({ status: 'Sync Completed' });
    } catch (error: any) {
        console.error('Cron Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

const runSyncAndReply = async () => {
    // Iterate over Businesses that have a configured Place ID
    const businesses = await Business.find({ placeId: { $exists: true, $ne: '' } });

    for (const biz of businesses) {
        try {
            console.log(`Processing Business: ${biz.name} (${biz.placeId})`);

            // Initialize Service (API Key based now)
            const service = new GoogleBusinessService(biz.id);
            await service.init();

            // 1. Sync Reviews using Place ID
            const reviews = await service.fetchReviewsByPlaceId(biz.placeId);
            const reviewCount = reviews.length;
            let totalStars = 0;

            for (const r of reviews) {
                // Ensure unique ID since Places API doesn't give one.
                const reviewId = r.reviewId;
                const starRating = convertRating(r.starRating);
                totalStars += starRating;

                // Upsert Review
                const existing = await GBPReview.findOneAndUpdate(
                    { reviewId },
                    {
                        locationId: biz.placeId,
                        reviewerName: r.reviewer?.displayName,
                        starRating: starRating,
                        comment: r.comment,
                        createTime: r.createTime,
                        // Places API doesn't return replies in the Details view efficiently,
                        // so we trust our local state if we already have it.
                        // hasReply: !!r.reviewReply, 
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );

                // 2. Check for Auto-Reply Opportunity (Drafting Mode)
                if (!existing.hasReply && !existing.replyComment) {
                    await processAutoReply(biz.id, 'n/a', biz.placeId, existing);
                }
            }

            // 3. Sync Stats to Main Dashboard
            if (reviewCount > 0) {
                const avgRating = totalStars / reviewCount;
                await Business.findOneAndUpdate(
                    { id: biz.id },
                    {
                        connected: true,
                        'stats.totalReviews': reviewCount,
                        'stats.averageRating': parseFloat(avgRating.toFixed(1)),
                        'stats.lastUpdated': new Date().toISOString()
                    }
                );
            }

        } catch (error) {
            console.error(`Error processing ${biz.id}`, error);
        }
    }
};

async function processAutoReply(businessId: string, accountId: string, locationId: string, review: any) {
    // Check Rules
    const rule = await ReplyRule.findOne({
        businessId,
        enabled: true,
        minStars: { $lte: review.starRating },
        maxStars: { $gte: review.starRating }
    });

    if (!rule || rule.mode !== 'AUTO') return;

    // Check Daily Limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = await ReplyLog.countDocuments({
        businessId,
        timestamp: { $gte: today },
        action: 'AUTO_REPLY_DRAFT',
        status: 'SUCCESS'
    });

    if (count >= rule.dailyLimit) {
        console.log(`Daily limit reached for ${businessId}`);
        return;
    }

    // Generate Text
    const replyText = generateSafeReply(review.starRating, review.reviewerName);

    try {
        // --- DRAFT MODE ONLY ---
        console.log(`Drafting reply for ${review.reviewId}: ${replyText}`);

        // Update DB
        await GBPReview.updateOne(
            { _id: review._id },
            { hasReply: true, replyComment: replyText, repliedAt: new Date() }
        );

        // Log
        await ReplyLog.create({
            businessId,
            reviewId: review.reviewId,
            action: 'AUTO_REPLY_DRAFT',
            status: 'SUCCESS',
            message: 'Drafted: ' + replyText
        });

    } catch (err: any) {
        console.error('Error in auto-reply draft:', err);
    }
}

function convertRating(rating: string | number): number {
    if (typeof rating === 'number') return rating;
    const map: any = { 'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5 };
    return map[rating] || 0;
}

function generateSafeReply(stars: number, name: string): string {
    if (stars >= 4) {
        return `Thank you ${name} for the great rating! We are glad you had a positive experience.`;
    }
    return `Thank you for your feedback ${name}. We strive to improve every day.`;
}
