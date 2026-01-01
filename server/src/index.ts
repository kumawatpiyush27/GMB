import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { generateReviews } from './reviewGenerator';
import { businesses, updateBusiness } from './db';
import QRCode from 'qrcode';

const server: FastifyInstance = Fastify({
    logger: true
});

server.register(cors, {
    origin: '*',
    methods: ['GET', 'POST']
});

server.get('/', async (request, reply) => {
    return { status: 'OK', service: 'GMB Review CRM Backend' };
});

// --- CRM Routes ---

// Get Business Status
server.get('/business/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const biz = businesses[id];
    if (!biz) return reply.status(404).send({ error: 'Business not found' });
    return biz;
});

// Update Business Data (Manual Configuration)
server.post<{ Body: Partial<BusinessConfig> }>('/business/:id/update', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body;

    // Merge new data with existing
    const updated = updateBusiness(id, {
        ...data,
        connected: true // Mark as connected if they save details
    });

    if (!updated) return reply.status(404).send({ error: 'Business not found' });
    return updated;
});

// Refresh Stats (Simulated)
server.post('/business/:id/refresh-stats', async (request, reply) => {
    const { id } = request.params as { id: string };
    const biz = businesses[id];
    if (!biz) return reply.status(404).send({ error: 'Business not found' });

    // Simulate fetching new data
    // In real app, call GMB API here
    const newStats = {
        totalReviews: (biz.stats?.totalReviews || 0) + Math.floor(Math.random() * 2),
        averageRating: 4.8,
        totalPosts: (biz.stats?.totalPosts || 0),
        lastUpdated: new Date().toISOString()
    };

    const updated = updateBusiness(id, { stats: newStats });
    return updated;
});

// Generate QR Code
server.get('/business/:id/qr', async (request, reply) => {
    const { id } = request.params as { id: string };
    const biz = businesses[id];
    if (!biz) return reply.status(404).send({ error: 'Business not found' });

    // The URL the QR points to (The Customer App)
    // Assuming Client is at port 3000
    const reviewUrl = `http://localhost:3000/r/${id}`;

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
    const biz = businesses[id];
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

const start = async () => {
    try {
        await server.listen({ port: 3001, host: '0.0.0.0' });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
