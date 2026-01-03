
import cron from 'node-cron';
import { GoogleBusinessService } from './google';
import { GBPConnection, GBPLocation, GBPReview, ReplyRule, ReplyLog } from '../db';

// Cron Schedule: Every 6 hours
// '0 */6 * * *'
const SCHEDULE = '0 */6 * * *';

export const startAutomationJob = () => {
    console.log('Starting Automation Job Scheduler...');

    cron.schedule(SCHEDULE, async () => {
        console.log('Running Sync Job: ', new Date().toISOString());
        await runSyncAndReply();
    });
};

export const runSyncAndReply = async () => {
    const connections = await GBPConnection.find({});

    for (const conn of connections) {
        try {
            console.log(`Processing Business: ${conn.businessId}`);
            const service = new GoogleBusinessService(conn.businessId);
            await service.init();

            // 1. Get Accounts (Assuming first one for now)
            const accounts = await service.fetchAccounts();
            if (!accounts.length) continue;
            const account = accounts[0];
            const accountId = account.name.split('/')[1]; // name is 'accounts/123'

            // 2. Get Locations
            const locations = await service.fetchLocations(account.name);

            for (const loc of locations) {
                // Upsert Location in DB
                const locationId = loc.name.split('/')[3]; // accounts/x/locations/y
                await GBPLocation.findOneAndUpdate(
                    { locationId },
                    {
                        businessId: conn.businessId,
                        accountId: accountId,
                        name: loc.title,
                        categories: loc.categories?.map((c: any) => c.displayName) || []
                    },
                    { upsert: true }
                );

                // 3. Sync Reviews
                const reviews = await service.fetchReviews(accountId, locationId);

                for (const r of reviews) {
                    const reviewId = r.reviewId;

                    // Upsert Review
                    const existing = await GBPReview.findOneAndUpdate(
                        { reviewId },
                        {
                            locationId,
                            reviewerName: r.reviewer?.displayName,
                            starRating: convertRating(r.starRating),
                            comment: r.comment,
                            createTime: r.createTime,
                            hasReply: !!r.reviewReply,
                            replyComment: r.reviewReply?.comment,
                            repliedAt: r.reviewReply?.updateTime
                        },
                        { upsert: true, new: true }
                    );

                    // 4. Check for Auto-Reply Opportunity
                    if (!existing.hasReply) {
                        await processAutoReply(conn.businessId, accountId, locationId, existing);
                    }
                }
            }

        } catch (error) {
            console.error(`Error processing ${conn.businessId}`, error);
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
        action: 'AUTO_REPLY',
        status: 'SUCCESS'
    });

    if (count >= rule.dailyLimit) {
        console.log(`Daily limit reached for ${businessId}`);
        return;
    }

    // Generate Text (Simple Logic for now, can use LLM later)
    const replyText = generateSafeReply(review.starRating, review.reviewerName);

    // Random Delay (5-15 mins) -> Implementing as immediate for MVP but logging intent
    // In real prod, we would push to a queue with delay.
    // For now, we wait 2 seconds to be polite to API.
    await new Promise(r => setTimeout(r, 2000));

    try {
        const service = new GoogleBusinessService(businessId);
        await service.init();
        await service.replyToReview(accountId, locationId, review.reviewId, replyText);

        // Update DB
        await GBPReview.updateOne({ _id: review._id }, { hasReply: true, replyComment: replyText, repliedAt: new Date() });

        // Log
        await ReplyLog.create({
            businessId,
            reviewId: review.reviewId,
            action: 'AUTO_REPLY',
            status: 'SUCCESS',
            message: 'Replied: ' + replyText
        });

    } catch (err: any) {
        await ReplyLog.create({
            businessId,
            reviewId: review.reviewId,
            action: 'AUTO_REPLY',
            status: 'FAILED',
            message: err.message
        });
    }
}

function convertRating(rating: string): number {
    // Google returns "FIVE" or "FOUR" or "STAR_RATING_UNSPECIFIED"
    const map: any = { 'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5 };
    return map[rating] || 0;
}

function generateSafeReply(stars: number, name: string): string {
    if (stars >= 4) {
        return `Thank you ${name} for the great rating! We are glad you had a positive experience.`;
    }
    return `Thank you for your feedback ${name}. We strive to improve every day.`;
}
