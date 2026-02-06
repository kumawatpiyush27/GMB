import mongoose, { Schema, Document } from 'mongoose';

// --- Interfaces ---

export interface BusinessConfig {
    id: string; // Custom readable ID (like 'demo-biz')
    name: string;
    connected: boolean;
    placeId: string;
    category: string;
    secondary_categories?: string[];
    seo_keywords: string[];
    location: string;
    review_url?: string;
    accessToken?: string;
    refreshToken?: string;
    stats?: {
        totalReviews: number;
        averageRating: number;
        totalPosts: number;
        totalScans: number; // Added
        lastUpdated: string;
    };
    email?: string;
    password?: string;
    isActive?: boolean; // Added for Manual Control
}

export interface IBusinessDocument extends BusinessConfig, Document { }

// --- Mongoose Schema ---

const BusinessSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true }, // Added default true
    connected: { type: Boolean, default: false },
    placeId: { type: String, required: false },
    category: { type: String, required: true },
    secondary_categories: { type: [String], default: [] }, // Added
    seo_keywords: { type: [String], default: [] },
    location: { type: String, required: true },
    review_url: { type: String, required: false },
    accessToken: { type: String, select: false }, // Do not return by default for security
    refreshToken: { type: String, select: false },
    stats: {
        totalReviews: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        totalPosts: { type: Number, default: 0 },
        totalScans: { type: Number, default: 0 }, // Added
        lastUpdated: { type: String, default: new Date().toISOString() }
    },
    email: { type: String, unique: true, sparse: true },
    password: { type: String, select: false },
    // Google OAuth for Auto-Reply
    googleAccessToken: { type: String, select: false },
    googleRefreshToken: { type: String, select: false },
    googleLocationId: { type: String },
    googleLocationName: { type: String },
    storeCode: { type: String },
    autoReplyEnabled: { type: Boolean, default: false },
    autoReplyConfig: {
        mode: { type: String, default: 'manual' }, // 'manual' | 'auto-4-5-stars' | 'auto-all'
        minStars: { type: Number, default: 4 },
        dailyLimit: { type: Number, default: 20 },
        repliedToday: { type: Number, default: 0 },
        lastReplyDate: { type: String }
    }
}, { timestamps: true });

// --- 1. Connection (Auth) ---
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
    refreshToken: { type: String, required: true },
}, { timestamps: true });

// --- 2. Locations ---
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

// --- 3. Reviews ---
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

// --- 4. Automation Rules ---
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

// --- 5. Logs ---
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

// --- 6. Interaction Logs (Analytics) ---
export interface IInteractionLog extends Document {
    businessId: string;
    action: 'SCAN' | 'COPY_REVIEW' | 'REDIRECT_GOOGLE';
    reviewContent?: string; // If they copied a review
    userAgent: string;
    timestamp: Date;
}

const InteractionLogSchema = new Schema({
    businessId: { type: String, required: true, index: true },
    action: { type: String, enum: ['SCAN', 'COPY_REVIEW', 'REDIRECT_GOOGLE'], required: true },
    reviewContent: { type: String },
    userAgent: String,
    timestamp: { type: Date, default: Date.now }
});

// Prevent checking for model existence error in HMR/Serverless
export const Business = mongoose.models.Business || mongoose.model<IBusinessDocument>('Business', BusinessSchema);
export const GBPConnection = mongoose.models.GBPConnection || mongoose.model<IGBPConnection>('GBPConnection', GBPConnectionSchema);
export const GBPLocation = mongoose.models.GBPLocation || mongoose.model<IGBPLocation>('GBPLocation', GBPLocationSchema);
export const GBPReview = mongoose.models.GBPReview || mongoose.model<IGBPReview>('GBPReview', GBPReviewSchema);
export const ReplyRule = mongoose.models.ReplyRule || mongoose.model<IReplyRule>('ReplyRule', ReplyRuleSchema);
export const ReplyLog = mongoose.models.ReplyLog || mongoose.model<IReplyLog>('ReplyLog', ReplyLogSchema);
export const InteractionLog = mongoose.models.InteractionLog || mongoose.model<IInteractionLog>('InteractionLog', InteractionLogSchema);

// --- Database Connection ---

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://Vercel-Admin-GMB:C16IsLEesIREHj9f@gmb.mqodddn.mongodb.net/?retryWrites=true&w=majority";

let isConnected = false;

export const connectDB = async () => {
    if (isConnected) {
        return;
    }

    try {
        if (mongoose.connection.readyState === 1) {
            isConnected = true;
            return;
        }

        await mongoose.connect(MONGODB_URI);
        isConnected = true;
        console.log('MongoDB Connected');

        // Initialize Demo Data if needed
        await initDemoData();
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
};

// --- Helper Functions ---

const initDemoData = async () => {
    try {
        const demoExists = await Business.findOne({ id: 'demo-biz' });
        if (!demoExists) {
            await Business.create({
                id: 'demo-biz',
                name: "Kernal Kansa Store",
                connected: false,
                placeId: "ChIJxxxxxxx",
                category: "kansa utensil shopping",
                seo_keywords: ["kansa utensils", "handcrafted brass items", "best utensils Ahmedabad"],
                location: "Ahmedabad",
                stats: {
                    totalReviews: 124,
                    averageRating: 4.8,
                    totalPosts: 12,
                    lastUpdated: new Date().toISOString()
                }
            });
            console.log('Initialized demo-biz');
        }


    } catch (e) {
        console.error("Error initializing demo data", e);
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
    const updated = await Business.findOneAndUpdate(
        { id },
        { $set: data },
        { new: true }
    ).lean();

    if (!updated) return null;
    const { _id, __v, ...rest } = updated as any;
    return rest as BusinessConfig;
};

export const createBusiness = async (data: BusinessConfig): Promise<BusinessConfig> => {
    await connectDB();
    const created = await Business.create(data);
    const { _id, __v, ...rest } = created.toObject() as any;
    return rest as BusinessConfig;
};
