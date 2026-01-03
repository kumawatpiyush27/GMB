import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { generateReviews } from './reviewGenerator';
import { getBusiness, updateBusiness, createBusiness, BusinessConfig, connectDB } from './db';
import { startAutomationJob } from './services/automation';
import QRCode from 'qrcode';

const server: FastifyInstance = Fastify({
    logger: true
});

server.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS']
});

// Start Cron
startAutomationJob();

server.get('/', async (request, reply) => {
    return { status: 'OK', service: 'GMB Review CRM Backend' };
});

// --- Onboarding / Auth Routes ---

// Register New Business
server.post<{ Body: BusinessConfig }>('/business/register', async (request, reply) => {
    const data = request.body;
    try {
        // Init default stats
        const newBiz = await createBusiness({
            ...data,
            connected: false,
            placeId: '',
            seo_keywords: [],
            stats: {
                totalReviews: 0,
                averageRating: 0,
                totalPosts: 0,
                lastUpdated: new Date().toISOString()
            }
        });
        return newBiz;
    } catch (err: any) {
        request.log.error(err);
        if (err.code === 11000) {
            return reply.status(409).send({ error: 'Business ID already exists. Try a different name.' });
        }
        return reply.status(500).send({ error: 'Registration failed' });
    }
});

// OAuth Login (Simulated for MVP)
server.get<{ Querystring: { businessId: string } }>('/auth/login', async (request, reply) => {
    const { businessId } = request.query;
    if (!businessId) return reply.status(400).send({ error: 'Missing businessId' });

    // Simulate GMB Fetching
    const mockGmbData = {
        connected: true,
        placeId: `ChIJ${Math.random().toString(36).substring(7)}`, // Fake Place ID
        review_url: `https://search.google.com/local/writereview?placeid=ChIJ${Math.random().toString(36).substring(7)}`,
        stats: {
            totalReviews: Math.floor(Math.random() * 100) + 10,
            averageRating: 4.5 + Math.random() * 0.5,
            totalPosts: Math.floor(Math.random() * 20),
            lastUpdated: new Date().toISOString()
        }
    };

    await updateBusiness(businessId, mockGmbData);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    return reply.redirect(`${clientUrl}/dashboard`);
});

// --- CRM Routes ---

// Get Business Status
server.get('/business/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const biz = await getBusiness(id);
    if (!biz) return reply.status(404).send({ error: 'Business not found' });
    return biz;
});

// Update Business Data (Manual Configuration)
server.post<{ Body: Partial<BusinessConfig> }>('/business/:id/update', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body;

    // Merge new data with existing
    const updated = await updateBusiness(id, {
        ...data,
        connected: true // Mark as connected if they save details
    });

    if (!updated) return reply.status(404).send({ error: 'Business not found' });
    return updated;
});

// Refresh Stats (Simulated)
server.post('/business/:id/refresh-stats', async (request, reply) => {
    const { id } = request.params as { id: string };
    const biz = await getBusiness(id);
    if (!biz) return reply.status(404).send({ error: 'Business not found' });

    // Simulate fetching new data
    // In real app, call GMB API here
    const newStats = {
        totalReviews: (biz.stats?.totalReviews || 0) + Math.floor(Math.random() * 2),
        averageRating: 4.8,
        totalPosts: (biz.stats?.totalPosts || 0),
        lastUpdated: new Date().toISOString()
    };

    const updated = await updateBusiness(id, { stats: newStats });
    return updated;
});

// Generate QR Code
server.get('/business/:id/qr', async (request, reply) => {
    const { id } = request.params as { id: string };
    const biz = await getBusiness(id);
    if (!biz) return reply.status(404).send({ error: 'Business not found' });

    // The URL the QR points to (The Customer App)
    // Use env var for production client URL
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const reviewUrl = `${clientBaseUrl}/r/${id}`;

    try {
        const qrDataUrl = await QRCode.toDataURL(reviewUrl);
        return { qrImage: qrDataUrl, url: reviewUrl };
    } catch (err) {
        request.log.error(err);
        return reply.status(500).send({ error: 'QR Gen failed' });
    }
});

// --- Public / Customer Routes ---

// Get Public Business Context (for Review Page)
server.get('/public/business/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const biz = await getBusiness(id);
    if (!biz) return reply.status(404).send({ error: 'Business not found' });
    // Return safe data only
    return {
        name: biz.name,
        category: biz.category,
        location: biz.location,
        placeId: biz.placeId,
        review_url: biz.review_url,
        keywords: biz.seo_keywords
    };
});

interface GenerateReviewBody {
    customer_name?: string;
    visited_for: string; // If empty, use business category
    product_bought?: string;
    location: string;
    seo_keywords: string[];
    experience_notes: string[];
}

server.post<{ Body: GenerateReviewBody }>('/generate-reviews', async (request, reply) => {
    const { customer_name, visited_for, product_bought, location, seo_keywords, experience_notes } = request.body;

    try {
        const reviews = generateReviews({
            customer_name,
            visited_for,
            product_bought,
            location,
            seo_keywords,
            experience_notes
        });
        return reviews;
    } catch (err) {
        request.log.error(err);
        reply.status(500).send({ error: 'Failed to generate reviews' });
    }
});

// --- GBP Automation Routes ---

import { GBPConnection, ReplyRule, ReplyLog } from './db';
import { google } from 'googleapis';

// 1. Connect (Exchange Code for Token)
server.post<{ Body: { businessId: string, code: string, redirectUri: string } }>('/gbp/connect', async (req, reply) => {
    const { businessId, code, redirectUri } = req.body;

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
    );

    try {
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.refresh_token) {
            // Note: refresh_token is only returned on the FIRST consent. 
            // User might need to revoke access to test again.
            // For now we proceed if we have access_token, but automation needs refresh_token.
            req.log.warn('No refresh_token returned. Automation might fail after 1 hour.');
        }

        // Save Connection
        await GBPConnection.findOneAndUpdate(
            { businessId },
            {
                refreshToken: tokens.refresh_token || 'EXISTING_OR_MISSING', // In prod handle this better
                googleAccountId: 'PENDING_FETCH', // will be updated by sync job
            },
            { upsert: true }
        );

        // Initialize Default Rules
        await ReplyRule.findOneAndUpdate(
            { businessId },
            {
                minStars: 4,
                maxStars: 5,
                mode: 'AUTO',
                dailyLimit: 20
            },
            { upsert: true }
        );

        return { success: true };
    } catch (err: any) {
        req.log.error(err);
        reply.status(500).send({ error: 'Auth Exchange Failed' });
    }
});

// 2. Get Rules
server.get<{ Params: { businessId: string } }>('/gbp/rules/:businessId', async (req, reply) => {
    const { businessId } = req.params;
    const rule = await ReplyRule.findOne({ businessId });
    return rule || { mode: 'MANUAL' }; // Default
});

// 3. Update Rules
server.post<{ Params: { businessId: string }, Body: any }>('/gbp/rules/:businessId', async (req, reply) => {
    const { businessId } = req.params;
    const rule = await ReplyRule.findOneAndUpdate(
        { businessId } as any,
        req.body,
        { upsert: true, new: true }
    );
    return rule;
});

// 4. Get Logs
server.get<{ Params: { businessId: string } }>('/gbp/logs/:businessId', async (req, reply) => {
    const { businessId } = req.params;
    // Return last 50 logs
    return await ReplyLog.find({ businessId }).sort({ timestamp: -1 }).limit(50);
});

// 5. Cron Trigger (For Vercel/External Jobs)
server.get('/cron/sync', async (req, reply) => {
    // In production, verify a secret header like:
    // if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) return reply.status(401).send('Unauthorized');

    req.log.info('Starting Sync via HTTP Trigger');

    // Run async (don't await if you want to return fast, but Vercel might kill it. 
    // Safer to await for Serverless, ensuring execution finishes before response)

    // Import dynamically to avoid circular deps if any, or just use the imported function
    const { runSyncAndReply } = require('./services/automation');
    await runSyncAndReply();

    return { status: 'Sync Completed' };
});

export default server;


