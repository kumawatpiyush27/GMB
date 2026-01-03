
import { google } from 'googleapis';
import { GBPConnection, GBPLocation, GBPReview } from '../db';

// OAuth2 Setup
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.CLIENT_URL || 'http://localhost:3000'}/api/auth/callback`
);

export class GoogleBusinessService {
    private client: any;

    constructor(private businessId: string) { }

    async init() {
        const conn = await GBPConnection.findOne({ businessId: this.businessId });
        if (!conn) throw new Error('Business not connected to Google');

        oauth2Client.setCredentials({
            refresh_token: conn.refreshToken
        });

        // Auto refresh logic handled by library
        this.client = google.mybusinessbusinessinformation({ version: 'v1', auth: oauth2Client });
    }

    // 1. Fetch Accounts
    async fetchAccounts() {
        // Need specific API for accounts
        const accountClient = google.mybusinessaccountmanagement({ version: 'v1', auth: oauth2Client });
        const res = await accountClient.accounts.list();
        return res.data.accounts || [];
    }

    // 2. Fetch Locations
    async fetchLocations(accountId: string) {
        // readMask is required for v1
        const readMask = 'name,title,storefrontAddress,phoneNumbers,websiteUri,categories';
        const res = await this.client.accounts.locations.list({
            parent: accountId,
            readMask
        });
        return res.data.locations || [];
    }

    // 3. Fetch Reviews (Legacy v4 API as requested)
    // 3. Fetch Reviews (Legacy v4 API)
    async fetchReviews(accountId: string, locationId: string) {
        const name = `accounts/${accountId}/locations/${locationId}`;
        const url = `https://mybusiness.googleapis.com/v4/${name}/reviews?pageSize=50`;

        try {
            const res = await oauth2Client.request({ url });
            return (res.data as any).reviews || [];
        } catch (e) {
            console.error('Error fetching reviews:', e);
            return [];
        }
    }

    // 4. Post Reply
    async replyToReview(accountId: string, locationId: string, reviewId: string, comment: string) {
        const name = `accounts/${accountId}/locations/${locationId}/reviews/${reviewId}`;
        const url = `https://mybusiness.googleapis.com/v4/${name}/reply`;

        await oauth2Client.request({
            url,
            method: 'PUT',
            data: { comment }
        });
    }
}
