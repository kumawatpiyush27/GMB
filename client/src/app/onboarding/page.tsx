'use client';

import { useState } from 'react';
import { API_URL } from '../config';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Register, 2: Connect GMB

    // Register Form
    const [form, setForm] = useState({
        id: '',
        name: '',
        category: '',
        location: '',
        shopCode: ''
    });

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Auto-generate ID if empty (simple slug)
            const bizId = form.id || form.name.toLowerCase().replace(/\s+/g, '-');

            const res = await fetch(`${API_URL}/business/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, id: bizId })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Registration failed');
            }

            // Save ID to local storage (simulating login session)
            localStorage.setItem('gmb_biz_id', bizId);

            // Move to Step 2
            setStep(2);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectGMB = () => {
        const storedId = localStorage.getItem('gmb_biz_id');
        if (!storedId) return;

        setLoading(true);
        // Include Shop Code in the login flow if provided
        const shopCode = form.shopCode ? `&shopCode=${encodeURIComponent(form.shopCode)}` : '';
        window.location.href = `${API_URL}/auth/login?businessId=${storedId}${shopCode}`;
    };

    const [isManual, setIsManual] = useState(false);
    const [manualForm, setManualForm] = useState({
        review_url: '',
        placeId: ''
    });

    const handleManualConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const storedId = localStorage.getItem('gmb_biz_id');
        if (!storedId) return;

        try {
            const res = await fetch(`${API_URL}/business/${storedId}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    review_url: manualForm.review_url,
                    placeId: manualForm.placeId || undefined,
                    connected: true // Mark as connected manually
                })
            });

            if (!res.ok) throw new Error('Failed to save details');

            router.push('/dashboard');
        } catch (error) {
            console.error(error);
            alert('Failed to connect. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
        }}>
            <div className="glass-panel animate-fade-in" style={{ padding: '40px', width: '100%', maxWidth: '500px' }}>

                {step === 1 && (
                    <>
                        <h1 className="gradient-text" style={{ textAlign: 'center', marginBottom: '30px' }}>
                            Get Started
                        </h1>
                        <form onSubmit={handleRegister}>
                            <div style={{ marginBottom: '20px' }}>
                                <label>Business Name</label>
                                <input
                                    required
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. My Awesome Cafe"
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label>Category</label>
                                <input
                                    required
                                    value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                    placeholder="e.g. Restaurant, Retail"
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label>Location (City)</label>
                                <input
                                    required
                                    value={form.location}
                                    onChange={e => setForm({ ...form, location: e.target.value })}
                                    placeholder="e.g. Mumbai"
                                />
                            </div>

                            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                                {loading ? 'Creating Account...' : 'Continue'}
                            </button>
                        </form>
                    </>
                )}

                {step === 2 && (
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ marginBottom: '10px' }}>Connect Google Business</h2>

                        {!isManual ? (
                            <>
                                <p style={{ color: '#94a3b8', marginBottom: '30px' }}>
                                    Link your Google Business Profile to auto-fetch reviews and enable smart suggestions.
                                </p>

                                <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                                    <label>Shop Code (Optional)</label>
                                    <input
                                        placeholder="e.g. 12345 (If you have multiple locations)"
                                        value={form.shopCode}
                                        onChange={e => setForm({ ...form, shopCode: e.target.value })}
                                        style={{ marginTop: '5px' }}
                                    />
                                    <small style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                        Enter your Store Code exactly as it appears in Google Business Profile if you want to connect a specific shop.
                                    </small>
                                </div>

                                <div style={{
                                    background: 'white',
                                    color: '#333',
                                    padding: '12px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    marginBottom: '20px',
                                    transition: 'transform 0.2s'
                                }} onClick={handleConnectGMB}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" width="20" alt="G" />
                                    {loading ? 'Connecting...' : 'Continue with Google'}
                                </div>

                                <div style={{ marginBottom: '20px', color: '#64748b' }}>- OR -</div>

                                <button
                                    className="btn-secondary"
                                    onClick={() => setIsManual(true)}
                                    style={{ width: '100%', marginBottom: '10px' }}
                                >
                                    Enter Details Manually
                                </button>

                                <button
                                    className="btn-secondary"
                                    onClick={() => router.push('/dashboard')}
                                    style={{ width: '100%', border: 'none', color: '#64748b' }}
                                >
                                    Skip for now
                                </button>
                            </>
                        ) : (
                            <form onSubmit={handleManualConnect} style={{ textAlign: 'left' }}>
                                <p style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '0.9rem' }}>
                                    If you don't have API access, you can manually enter your Google Maps details.
                                </p>

                                <div style={{ marginBottom: '15px' }}>
                                    <label>Google Review Link</label>
                                    <input
                                        required
                                        placeholder="https://g.page/r/..."
                                        value={manualForm.review_url}
                                        onChange={e => setManualForm({ ...manualForm, review_url: e.target.value })}
                                    />
                                    <small style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                        From Google Search {'>'} "Get more reviews"
                                    </small>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label>Place ID (Optional)</label>
                                    <input
                                        placeholder="ChIJ..."
                                        value={manualForm.placeId}
                                        onChange={e => setManualForm({ ...manualForm, placeId: e.target.value })}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setIsManual(false)} style={{ flex: 1 }}>
                                        Back
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
                                        {loading ? 'Saving...' : 'Connect'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
