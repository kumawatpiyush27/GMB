import mongoose, { Schema, Document } from 'mongoose';

// --- Interfaces ---

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

// --- Mongoose Schema ---

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

// Prevent checking for model existence error in HMR/Serverless
export const Business = mongoose.models.Business || mongoose.model<IBusinessDocument>('Business', BusinessSchema);

// --- Database Connection ---

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://Vercel-Admin-GMB:C16IsLEesIREHj9f@gmb.mqodddn.mongodb.net/?retryWrites=true&w=majority";

let isConnected = false;

export const connectDB = async () => {
    if (isConnected) {
        return;
    }

    try {
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

    const retnerExists = await Business.findOne({ id: 'retner-ai' });
    if (!retnerExists) {
        await Business.create({
            id: 'retner-ai',
            name: "Retner.ai",
            connected: true,
            placeId: "PLACE_ID_RETNER_AI", // Replace with actual Place ID
            category: "AI Automation Agency",
            seo_keywords: ["AI automation", "business process automation", "chatbot development", "AI consulting"],
            location: "India",
            stats: {
                totalReviews: 0,
                averageRating: 0.0,
                totalPosts: 0,
                lastUpdated: new Date().toISOString()
            }
        });
        console.log('Initialized retner-ai');
    }
};

export const getBusiness = async (id: string): Promise<BusinessConfig | null> => {
    await connectDB();
    const doc = await Business.findOne({ id }).lean();
    if (!doc) return null;

    // Transform _id to string if needed, or just return the interface properties
    // casting to unknown first to avoid TS issues with Document methods vs Interface
    const { _id, __v, ...rest } = doc as any;
    return rest as BusinessConfig;
};

export const updateBusiness = async (id: string, data: Partial<BusinessConfig>): Promise<BusinessConfig | null> => {
    await connectDB();
    const updated = await Business.findOneAndUpdate(
        { id },
        { $set: data },
        { new: true } // Return updated document
    ).lean();

    if (!updated) return null;
    const { _id, __v, ...rest } = updated as any;
    return rest as BusinessConfig;
};
