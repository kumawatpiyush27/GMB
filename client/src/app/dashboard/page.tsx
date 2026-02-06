'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { useRouter } from 'next/navigation';
import TagInput from '@/components/TagInput';

export default function Dashboard() {
    const router = useRouter();
    const [businessId, setBusinessId] = useState<string | null>(null);
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        placeId: '',
        review_url: '',
        location: '',
        category: '',
        secondary_categories: [] as string[],
        seo_keywords: [] as string[]
    });

    const KEYWORD_MAP: Record<string, string[]> = {
        'restaurant': ['Delicious Food', 'Great Service', 'Ambience', 'Friendly Staff', 'Tasty', 'Clean'],
        'cafe': ['Coffee', 'Cozy', 'Wifi', 'Breakfast', 'Pastries'],
        'salon': ['Haircut', 'Professional', 'Clean', 'Stylist', 'Relaxing'],
        'retail': ['Selection', 'Price', 'Helpful Staff', 'Quality'],
        'gym': ['Equipment', 'Trainers', 'Cleanliness', 'Classes', 'Atmosphere'],
        'doctor': ['Professional', 'Caring', 'Diagnosis', 'Waiting Time', 'Staff'],
        'dentist': ['Gentle', 'Professional', 'Clean', 'Pain-free', 'Staff'],
        'hotel': ['Room', 'Service', 'Location', 'Breakfast', 'Comfortable'],
        // Generic fallbacks
        'store': ['Product Quality', 'Service', 'Price', 'Variety'],
        'shop': ['Product Quality', 'Service', 'Price', 'Variety'],
        'service': ['Professional', 'On-time', 'Quality', 'Communication']
    };

    const getSuggestions = (category: string) => {
        const lowerCat = category.toLowerCase();
        for (const key in KEYWORD_MAP) {
            if (lowerCat.includes(key)) return KEYWORD_MAP[key];
        }
        return [];
    };

    const suggestedKeywords = getSuggestions(formData.category).filter(k => !formData.seo_keywords.includes(k));

    const [analytics, setAnalytics] = useState({ scans: 0, copies: 0, redirects: 0 });

    useEffect(() => {
        const storedId = localStorage.getItem('gmb_biz_id');
        if (!storedId) {
            router.push('/onboarding');
            return;
        }
        setBusinessId(storedId);

        // Fetch Business Data
        fetch(`${API_URL}/business/${storedId}`)
            .then(r => r.json())
            .then(data => {
                setStatus(data);
                setFormData({
                    name: data.name,
                    placeId: data.placeId || '',
                    review_url: data.review_url || '',
                    location: data.location,
                    category: data.category,
                    secondary_categories: data.secondary_categories || [],
                    seo_keywords: data.seo_keywords || []
                });
            })
            .catch(() => router.push('/onboarding'));

        // Fetch Analytics
        fetch(`${API_URL}/business/${storedId}/analytics`)
            .then(r => r.json())
            .then(data => setAnalytics(data))
            .catch(e => console.error('Analytics error:', e));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...formData,
        };

        const res = await fetch(`${API_URL}/business/${businessId}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const updated = await res.json();
        setStatus(updated);
        setIsEditing(false);
        setLoading(false);
    };

    if (!status) return <div>Loading...</div>;

    return (
        <div className="animate-fade-in">
            <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '20px' }}>Store Settings</h1>

            {/* Analytics Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>{analytics.scans}</div>
                    <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Total Scans</div>
                </div>
                <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{analytics.copies}</div>
                    <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Reviews Copied</div>
                </div>
                <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>{analytics.redirects}</div>
                    <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Redirects to Google</div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '30px', maxWidth: '800px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ marginTop: 0 }}>Google Business Profile</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-secondary" onClick={() => router.push('/dashboard/rules')}>
                            Auto-Reply Rules
                        </button>
                        <button className="btn-primary" onClick={() => router.push('/dashboard/qrcode')}>
                            QR Studio
                        </button>
                        {!isEditing && (
                            <button className="btn-secondary" onClick={() => setIsEditing(true)}>
                                Edit Details
                            </button>
                        )}
                    </div>
                </div>

                {!isEditing ? (
                    <>
                        <div style={{ margin: '20px 0', fontSize: '1.1rem' }}>
                            Status:
                            <span style={{
                                marginLeft: '10px',
                                color: status.connected ? '#4ade80' : '#ef4444',
                                fontWeight: 'bold'
                            }}>
                                {status.connected ? 'Active' : 'Setup Required'}
                            </span>
                        </div>
                        <div>
                            <p><strong>Store Name:</strong> {status.name}</p>
                            <p><strong>Location:</strong> {status.location}</p>
                            {status.review_url ? (
                                <p><strong>Review Link:</strong> <a href={status.review_url} target="_blank" style={{ color: '#8b5cf6' }}>configured</a></p>
                            ) : (
                                <p><strong>Place ID:</strong> {status.placeId}</p>
                            )}
                            <p><strong>Category:</strong> {status.category}</p>
                            {status.secondary_categories?.length > 0 && (
                                <p><strong>Secondary Cats:</strong> {status.secondary_categories.join(', ')}</p>
                            )}
                            {status.storeCode && (
                                <p><strong>Store/Shop Code:</strong> {status.storeCode}</p>
                            )}
                            <p><strong>Keywords:</strong> {status.seo_keywords?.join(', ')}</p>
                        </div>


                    </>
                ) : (
                    <form onSubmit={handleSave}>
                        <div style={{ marginBottom: '15px' }}>
                            <label>Store Name</label>
                            <input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px' }}>
                            <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Connection Method (Choose one)</h3>

                            <div style={{ marginBottom: '15px' }}>
                                <label>Option A: Direct Review Link (Recommended)</label>
                                <input
                                    placeholder="e.g. https://g.page/r/..."
                                    value={formData.review_url}
                                    onChange={e => setFormData({ ...formData, review_url: e.target.value })}
                                />
                                <small style={{ color: '#94a3b8' }}>Paste the "Review link" you see in Google Search "Get more reviews" popup.</small>
                            </div>

                            <div style={{ textAlign: 'center', margin: '10px 0', color: '#64748b' }}>- OR -</div>

                            <div style={{ marginBottom: '0' }}>
                                <label>Option B: Google Place ID</label>
                                <input
                                    placeholder="ChIJ..."
                                    value={formData.placeId}
                                    onChange={e => setFormData({ ...formData, placeId: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label>Location (City/Area)</label>
                            <input
                                required
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label>Primary Business Category (e.g. Restaurant)</label>
                            <input
                                required
                                placeholder="e.g. Restaurant"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label>Secondary Categories (e.g. Diner, Cafe)</label>
                            <TagInput
                                tags={formData.secondary_categories}
                                onChange={(newTags) => setFormData({ ...formData, secondary_categories: newTags })}
                                placeholder="Type & Enter to add"
                            />
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <label>SEO Keywords (Type & Press Enter)</label>
                            <TagInput
                                tags={formData.seo_keywords}
                                onChange={(newTags) => setFormData({ ...formData, seo_keywords: newTags })}
                                placeholder="e.g. Best Pizza, Italian Food"
                            />
                            {suggestedKeywords.length > 0 && (
                                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', width: '100%' }}>Suggestions (Click to add):</span>
                                    {suggestedKeywords.map(k => (
                                        <button
                                            key={k}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, seo_keywords: [...formData.seo_keywords, k] })}
                                            style={{
                                                background: 'rgba(255,255,255,0.1)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                borderRadius: '20px',
                                                padding: '4px 12px',
                                                color: '#e2e8f0',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem'
                                            }}
                                            className="hover:bg-white/20"
                                        >
                                            + {k}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Saving...' : 'Save & Connect'}
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
            {/* Support Button */}
            <a
                href="https://wa.me/918239061209"
                target="_blank"
                rel="noreferrer"
                title="Contact Support"
                style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    width: '60px',
                    height: '60px',
                    background: '#22c55e',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)',
                    cursor: 'pointer',
                    zIndex: 1000,
                    fontSize: '30px', // simpler than importing an icon for now
                    color: 'white',
                    textDecoration: 'none'
                }}
            >
                💬
            </a>
        </div>
    );
}
