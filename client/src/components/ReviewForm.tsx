'use client';

import { useState } from 'react';

interface ReviewInput {
    customer_name: string;
    visited_for: string;
    product_bought: string;
    location: string;
    seo_keywords: string;
    experience_notes: string;
}

interface Props {
    onSubmit: (data: any) => void;
    loading: boolean;
}

export default function ReviewForm({ onSubmit, loading }: Props) {
    const [formData, setFormData] = useState<ReviewInput>({
        customer_name: '',
        visited_for: '',
        product_bought: '',
        location: '',
        seo_keywords: '',
        experience_notes: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Convert comma separated lists to arrays
        const formattedData = {
            ...formData,
            seo_keywords: formData.seo_keywords.split(',').map(s => s.trim()).filter(Boolean),
            experience_notes: formData.experience_notes.split(',').map(s => s.trim()).filter(Boolean)
        };
        onSubmit(formattedData);
    };

    return (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                    <label>Full Name (Optional)</label>
                    <input
                        name="customer_name"
                        placeholder="John Doe"
                        value={formData.customer_name}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>Visited For *</label>
                    <input
                        required
                        name="visited_for"
                        placeholder="e.g. Dinner, Shopping"
                        value={formData.visited_for}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>Product/Service Bought</label>
                    <input
                        name="product_bought"
                        placeholder="e.g. Pasta, T-Shirt"
                        value={formData.product_bought}
                        onChange={handleChange}
                    />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                    <label>Location *</label>
                    <input
                        required
                        name="location"
                        placeholder="e.g. Ahmedabad"
                        value={formData.location}
                        onChange={handleChange}
                    />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                    <label>SEO Keywords (comma separated)</label>
                    <input
                        name="seo_keywords"
                        placeholder="best food, fresh ingredients, affordable"
                        value={formData.seo_keywords}
                        onChange={handleChange}
                    />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                    <label>Experience Notes (comma separated)</label>
                    <textarea
                        name="experience_notes"
                        placeholder="staff helpful, good vibes, quick service"
                        rows={3}
                        value={formData.experience_notes}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', maxWidth: '300px' }}>
                    {loading ? 'Generating...' : 'Generate Review Suggestions'}
                </button>
            </div>
        </form>
    );
}
