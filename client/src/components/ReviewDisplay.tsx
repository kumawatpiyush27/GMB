'use client';

import { useState } from 'react';

interface ReviewResult {
    [key: string]: string;
}

interface Props {
    reviews: ReviewResult;
    placeId?: string;
    reviewUrl?: string;
    businessId: string;
    businessName: string;
    location: string;
}

export default function ReviewDisplay({ reviews, placeId, reviewUrl, businessName, location, businessId }: Props) {
    const [copied, setCopied] = useState<string | null>(null);

    const handleCopyAndRedirect = async (text: string, type: string) => {
        // Track 'COPY_REVIEW' - We do this first (fire & forget style)
        fetch(`/api/public/business/${businessId}/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'COPY_REVIEW', reviewContent: text })
        }).catch(err => console.error(err));

        // 1. Copy
        navigator.clipboard.writeText(text).then(() => {
            setCopied(type);

            // 2. Redirect
            setTimeout(() => {
                setCopied(null);

                // Track 'REDIRECT_GOOGLE'
                fetch(`/api/public/business/${businessId}/track`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'REDIRECT_GOOGLE' })
                }).catch(err => console.error(err));

                if (reviewUrl) {
                    window.location.href = reviewUrl;
                } else if (placeId) {
                    const url = `https://search.google.com/local/writereview?placeid=${placeId}`;
                    window.location.href = url;
                } else {
                    // FALLBACK: Google Search "Write a review" intent
                    const query = `write a review for ${businessName} ${location}`;
                    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                    window.location.href = url;
                }
            }, 2500);
        });
    };

    return (
        <>
            {/* Instruction Modal */}
            {copied && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.85)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', color: 'white', textAlign: 'center', padding: '20px'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }} className="animate-bounce">📋 ✅</div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Review Copied!</h2>
                    <p style={{ fontSize: '1.2rem', color: '#cbd5e1', maxWidth: '400px', marginBottom: '30px' }}>
                        We are redirecting you to Google...<br />
                        <span style={{ color: '#4ade80', fontWeight: 'bold' }}>Just Paste (Ctrl+V) & Submit!</span>
                    </p>
                    <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <style>{`
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
                        .animate-bounce { animation: bounce 2s infinite; }
                    `}</style>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 mt-8 animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {(Object.entries(reviews) as [string, string][]).map(([type, text]) => (
                    <div key={type} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                        <h3 className="gradient-text" style={{ marginTop: 0, marginBottom: '12px', fontSize: '1.25rem' }}>{type} Review</h3>
                        <p style={{ color: '#e2e8f0', lineHeight: '1.6', flex: 1, marginBottom: '20px' }}>{text}</p>
                        <button
                            className="btn-primary"
                            onClick={() => handleCopyAndRedirect(text, type)}
                            style={{ alignSelf: 'stretch', textAlign: 'center' }}
                        >
                            Select & Post
                        </button>
                    </div>
                ))}
            </div>
        </>
    );
}
