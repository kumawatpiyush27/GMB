'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/app/config';

export default function ReviewsInbox() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [syncing, setSyncing] = useState(false);

    const fetchReviews = async () => {
        const id = localStorage.getItem('gmb_biz_id');
        if (!id) return;
        setLoading(true);
        try {
            const r = await fetch(`${API_URL}/business/${id}/reviews`);
            const data = await r.json();
            setReviews(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        const id = localStorage.getItem('gmb_biz_id');
        if (!id) return;

        setSyncing(true);
        try {
            const res = await fetch(`${API_URL}/business/${id}/sync-reviews`, { method: 'POST' });
            if (res.ok) {
                await fetchReviews();
            } else {
                const data = await res.json();
                alert(`Sync failed: ${data.error || 'Unknown error'}`);
            }
        } catch (e) {
            alert('Error connecting to sync server');
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    if (loading && reviews.length === 0) return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>Loading Reviews...</div>
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Reviews Inbox</h1>
                <button
                    className="btn-primary"
                    onClick={handleSync}
                    disabled={syncing}
                    style={{ background: syncing ? '#4b5563' : undefined }}
                >
                    {syncing ? '🔄 Syncing...' : '🔄 Refresh Reviews'}
                </button>
            </div>

            {reviews.length === 0 ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📥</div>
                    <h2>No reviews found.</h2>
                    <p>Click the sync button above to fetch reviews from your Google Business Profile.</p>
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
