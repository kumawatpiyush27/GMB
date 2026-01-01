export interface BusinessConfig {
    id: string;
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

// Mock Database
export const businesses: Record<string, BusinessConfig> = {
    'demo-biz': {
        id: 'demo-biz',
        name: "Kernal Kansa Store",
        connected: false,
        placeId: "ChIJxxxxxxx", // Dummy Place ID for demo
        category: "kansa utensil shopping",
        seo_keywords: ["kansa utensils", "handcrafted brass items", "best utensils Ahmedabad"],
        location: "Ahmedabad",
        stats: {
            totalReviews: 124,
            averageRating: 4.8,
            totalPosts: 12,
            lastUpdated: new Date().toISOString()
        }
    },
    'retner-ai': {
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
    }
};

export const updateBusiness = (id: string, data: Partial<BusinessConfig>) => {
    if (businesses[id]) {
        businesses[id] = { ...businesses[id], ...data };
        return businesses[id];
    }
    return null;
};
