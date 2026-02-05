'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { API_URL } from '@/app/config';
import ReviewDisplay from '@/components/ReviewDisplay';

export default function CustomerReviewPage() {
    const params = useParams();
    // Ensure id is a string (handle array case if next returns it, though usually standard dynamic route returns string)
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const [biz, setBiz] = useState<any>(null);
    const [reviews, setReviews] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        // 1. Fetch Business Context
        fetch(`${API_URL}/public/business/${id}`)
            .then(r => {
                if (!r.ok) throw new Error('Business not found');
                return r.json();
            })
            .then(data => {
                setBiz(data);
                // 2. Auto-generate reviews based on context
                // We will do a default generation immediately for "frictionless" experience as requested.
                // Or we could ask for input. The prompt says "Page opens with [Options]".
                // So we generate immediately using business context.
                return fetch(`${API_URL}/generate-reviews`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        businessName: data.name,
                        visited_for: data.category, // default to category
                        location: data.location,
                        seo_keywords: data.keywords,
                        experience_notes: [] // empty for generic positive
                    })
                });
            })
            .then(r => r.json())
            .then(setReviews)
            .catch(err => {
                console.error(err);
                setBiz({ error: true });
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div style={{ padding: '40px', color: 'white', textAlign: 'center' }}>
                <h2>Loading your experience...</h2>
            </div>
        );
    }

    if (!biz || biz.error) {
        return (
            <div style={{ padding: '40px', color: 'white', textAlign: 'center' }}>
                <h2>Business not found or invalid QR.</h2>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <header style={{ textAlign: 'center', marginBottom: '40px' }} className="animate-fade-in">
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
                    {biz.name}
                </h1>
                <p style={{ color: '#cbd5e1' }}>
                    Welcome to Retner Reviews! Please select a review to share your experience.
                </p>
            </header>

            {reviews && (
                <ReviewDisplay
                    reviews={reviews}
                    placeId={biz.placeId}
                    reviewUrl={biz.review_url}
                    businessName={biz.name}
                    location={biz.location}
                    businessId={id as string}
                />
            )}

            <div style={{ marginTop: '40px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                Powered by GMB SmartReview
            </div>
        </div>
    );
}
