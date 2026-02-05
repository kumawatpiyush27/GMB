'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/app/config';

export default function ReviewsInbox() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const id = localStorage.getItem('gmb_biz_id');
        if (!id) return;

        fetch(`${API_URL}/business/${id}/reviews`)
            .then(r => r.json())
            .then(data => {
                setReviews(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Loading Reviews...</div>;

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '30px' }}>Reviews Inbox</h1>

            {reviews.length === 0 ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    <h2>No reviews fetched yet.</h2>
                    <p>Make sure you have connected your Google Business Profile and the sync job has run.</p>
                    <button
                        className="btn-primary"
                        style={{ marginTop: '20px' }}
                        onClick={() => window.open(`${API_URL}/cron/sync`, '_blank')}
                    >
                        Force Sync Now
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {reviews.map((r) => (
                        <div key={r.reviewId} className="glass-panel" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        fontWeight: 'bold',
                                        color: '#fff',
                                        background: r.starRating >= 4 ? '#4ade80' : r.starRating >= 3 ? '#fbbf24' : '#ef4444',
                                        width: '30px',
                                        height: '30px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {r.starRating}
                                    </div>
                                    <div>
                                        <strong>{r.reviewerName}</strong>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                            {new Date(r.createTime).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    {r.hasReply ? (
                                        <span style={{
                                            background: 'rgba(74, 222, 128, 0.2)',
                                            color: '#4ade80',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem'
                                        }}>Replied</span>
                                    ) : (
                                        <span style={{
                                            background: 'rgba(239, 68, 68, 0.2)',
                                            color: '#ef4444',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem'
                                        }}>Pending</span>
                                    )}
                                </div>
                            </div>

                            <p style={{ lineHeight: '1.5', color: '#cbd5e1' }}>
                                {r.comment || <i>(No comment text)</i>}
                            </p>

                            {r.hasReply && r.replyComment && (
                                <div style={{
                                    marginTop: '15px',
                                    padding: '15px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    borderLeft: '2px solid #60a5fa'
                                }}>
                                    <div style={{ fontSize: '0.8rem', color: '#60a5fa', marginBottom: '5px' }}>
                                        Your Reply ({new Date(r.repliedAt).toLocaleDateString()})
                                    </div>
                                    <div style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                                        {r.replyComment}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
