import mongoose, { Schema, Document } from 'mongoose';

// --- EXISTING CONFIG (LEGACY/HYBRID) ---
export interface BusinessConfig {
    id: string; // Custom readable ID (like 'demo-biz')
    name: string;
    connected: boolean;
    placeId: string;
    category: string;
    seo_keywords: string[];
    location: string;
    review_url?: string;
    stats?: {
        totalReviews: number;
        averageRating: number;
        totalPosts: number;
        lastUpdated: string;
    };
}

export interface IBusinessDocument extends BusinessConfig, Document { }

const BusinessSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    connected: { type: Boolean, default: false },
    placeId: { type: String, required: false },
    category: { type: String, required: true },
    seo_keywords: { type: [String], default: [] },
    location: { type: String, required: true },
    review_url: { type: String, required: false },
    stats: {
        totalReviews: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        totalPosts: { type: Number, default: 0 },
        lastUpdated: { type: String, default: new Date().toISOString() }
    }
});

// --- NEW GBP AUTOMATION SCHEMAS ---

// 1. Connection (Auth)
export interface IGBPConnection extends Document {
    businessId: string; // Link to our internal Business ID
    googleAccountId: string;
    accountName: string;
    refreshToken: string; // Encrypted in real app
    createdAt: Date;
    updatedAt: Date;
}

const GBPConnectionSchema = new Schema({
    businessId: { type: String, required: true, unique: true },
    googleAccountId: { type: String },
    accountName: { type: String },
    refreshToken: { type: String, required: true }, // Store efficiently
}, { timestamps: true });

// 2. Locations
export interface IGBPLocation extends Document {
    businessId: string;
    locationId: string; // Google's Loc ID
    accountId: string;  // Google's Acct ID
    name: string;
    address: string;
    phone?: string;
    website?: string;
    categories: string[];
}

const GBPLocationSchema = new Schema({
    businessId: { type: String, required: true },
    locationId: { type: String, required: true, unique: true },
    accountId: { type: String, required: true },
    name: { type: String },
    address: { type: String },
    phone: { type: String },
    website: { type: String },
    categories: [String]
});

// 3. Reviews
export interface IGBPReview extends Document {
    locationId: string;
    reviewId: string;
    reviewerName: string;
    starRating: number;
    comment: string;
    createTime: Date;
    updateTime?: Date;
    hasReply: boolean;
    replyComment?: string;
    repliedAt?: Date;
}

const GBPReviewSchema = new Schema({
    locationId: { type: String, required: true, index: true },
    reviewId: { type: String, required: true, unique: true },
    reviewerName: { type: String },
    starRating: { type: Number, required: true },
    comment: { type: String },
    createTime: { type: Date },
    updateTime: { type: Date },
    hasReply: { type: Boolean, default: false },
    replyComment: { type: String },
    repliedAt: { type: Date }
});

// 4. Automation Rules
export interface IReplyRule extends Document {
    businessId: string;
    locationId: string; // or 'ALL'
    minStars: number;
    maxStars: number;
    mode: 'AUTO' | 'SUGGEST' | 'MANUAL';
    dailyLimit: number;
    enabled: boolean;
}

const ReplyRuleSchema = new Schema({
    businessId: { type: String, required: true },
    locationId: { type: String, default: 'ALL' },
    minStars: { type: Number, required: true },
    maxStars: { type: Number, required: true },
    mode: { type: String, enum: ['AUTO', 'SUGGEST', 'MANUAL'], default: 'MANUAL' },
    dailyLimit: { type: Number, default: 20 },
    enabled: { type: Boolean, default: true }
});

// 5. Logs
export interface IReplyLog extends Document {
    businessId: string;
    reviewId: string;
    action: string;
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    message?: string;
    timestamp: Date;
}

const ReplyLogSchema = new Schema({
    businessId: String,
    reviewId: String,
    action: String,
    status: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});

// --- MODELS ---
export const Business = mongoose.models.Business || mongoose.model<IBusinessDocument>('Business', BusinessSchema);
export const GBPConnection = mongoose.models.GBPConnection || mongoose.model<IGBPConnection>('GBPConnection', GBPConnectionSchema);
export const GBPLocation = mongoose.models.GBPLocation || mongoose.model<IGBPLocation>('GBPLocation', GBPLocationSchema);
export const GBPReview = mongoose.models.GBPReview || mongoose.model<IGBPReview>('GBPReview', GBPReviewSchema);
export const ReplyRule = mongoose.models.ReplyRule || mongoose.model<IReplyRule>('ReplyRule', ReplyRuleSchema);
export const ReplyLog = mongoose.models.ReplyLog || mongoose.model<IReplyLog>('ReplyLog', ReplyLogSchema);

// --- CONNECTION ---
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://Vercel-Admin-GMB:C16IsLEesIREHj9f@gmb.mqodddn.mongodb.net/?retryWrites=true&w=majority";
let isConnected = false;

export const connectDB = async () => {
    if (isConnected) return;
    try {
        await mongoose.connect(MONGODB_URI);
        isConnected = true;
        console.log('MongoDB Connected');
        await initDemoData();
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
};

// --- HELPER FUNCTIONS ---
const initDemoData = async () => {
    const demoExists = await Business.findOne({ id: 'demo-biz' });
    if (!demoExists) {
        await Business.create({
            id: 'demo-biz',
            name: "Kernal Kansa Store",
            connected: false,
            placeId: "ChIJxxxxxxx",
            category: "kansa utensil shopping",
            seo_keywords: ["kansa utensils"],
            location: "Ahmedabad",
            stats: { totalReviews: 124, averageRating: 4.8, totalPosts: 12, lastUpdated: new Date().toISOString() }
        });
        // Default Rule
        await ReplyRule.create({
            businessId: 'demo-biz',
            minStars: 4,
            maxStars: 5,
            mode: 'AUTO',
            dailyLimit: 20,
            enabled: true
        });
        console.log('Initialized demo-biz data');
    }
};

export const getBusiness = async (id: string): Promise<BusinessConfig | null> => {
    await connectDB();
    const doc = await Business.findOne({ id }).lean();
    if (!doc) return null;
    const { _id, __v, ...rest } = doc as any;
    return rest as BusinessConfig;
};

export const updateBusiness = async (id: string, data: Partial<BusinessConfig>): Promise<BusinessConfig | null> => {
    await connectDB();
    const updated = await Business.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean();
    if (!updated) return null;
    const { _id, __v, ...rest } = updated as any;
    return rest as BusinessConfig;
};

export const createBusiness = async (data: BusinessConfig): Promise<BusinessConfig> => {
    await connectDB();
    const newBiz = await Business.create(data);
    const { _id, __v, ...rest } = newBiz.toObject() as any;
    return rest as BusinessConfig;
};
