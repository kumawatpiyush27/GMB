'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '../../config';

export default function SelectLocation() {
    const router = useRouter();
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selecting, setSelecting] = useState('');

    useEffect(() => {
        const businessId = localStorage.getItem('gmb_biz_id');
        if (!businessId) {
            router.push('/onboarding');
            return;
        }

        fetch(`${API_URL}/business/${businessId}/gmb-locations`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setLocations(data.locations || []);
                }
            })
            .catch(err => setError('Failed to load locations'))
            .finally(() => setLoading(false));
    }, []);

    const handleSelect = async (location: any) => {
        const businessId = localStorage.getItem('gmb_biz_id');
        if (!businessId) return;

        setSelecting(location.name); // Using location resource name as ID

        try {
            const res = await fetch(`${API_URL}/business/${businessId}/select-location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location: location,
                    accountName: location.accountName
                })
            });

            if (res.ok) {
                router.push('/dashboard');
            } else {
                alert('Failed to connect location');
            }
        } catch (e) {
            alert('Error connecting location');
        } finally {
            setSelecting('');
        }
    };

    return (
        <div className="animate-fade-in">
            <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '10px', color: '#ec4899' }}>Select GMB Location</h1>
            <p style={{ color: '#94a3b8', marginBottom: '30px' }}>
                Found {locations.length} locations linked to your account. Select the one you want to manage.
            </p>

            {loading && <div>Loading locations...</div>}

            {error && (
                <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                    {error}
                    <button
                        className="btn-primary"
                        style={{ marginTop: '10px', display: 'block' }}
                        onClick={() => window.location.href = '/api/auth/google'}
                    >
                        Try Reconnecting Google Account
                    </button>
                </div>
            )}

            {!loading && !error && (
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => window.location.href = '/api/auth/google'}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#94a3b8',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        🔄 Switch Google Account
                    </button>
                </div>
            )}

            {!loading && !error && locations.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: '50px' }}>
                    <h3 style={{ color: '#94a3b8' }}>No locations found.</h3>
                    <p style={{ color: '#64748b' }}>Please ensure your Google Account has verified business profiles.</p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                        <button
                            className="btn-primary"
                            onClick={() => window.location.href = '/api/auth/google'}
                        >
                            Connect Different Account
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={() => router.push('/dashboard')}
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
            }}>
                {locations.map(loc => (
                    <div
                        key={loc.name}
                        className="glass-panel"
                        style={{
                            padding: '20px',
                            cursor: 'pointer',
                            border: selecting === loc.name ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
                            transition: 'all 0.2s',
                            opacity: selecting && selecting !== loc.name ? 0.5 : 1,
                            position: 'relative'
                        }}
                        onClick={() => !selecting && handleSelect(loc)}
                    >
                        {loc.accountName && (
                            <div style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                fontSize: '0.7rem',
                                color: '#94a3b8',
                                background: 'rgba(255,255,255,0.05)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                {loc.accountName.split('/').pop()}
                            </div>
                        )}
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', paddingRight: '60px' }}>{loc.title}</h3>
                        <p style={{ margin: '0 0 5px 0', color: '#cbd5e1', fontSize: '0.9rem' }}>{loc.storeCode ? `Store Code: ${loc.storeCode}` : 'No Store Code'}</p>
                        <p style={{ margin: '0 0 15px 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                            Place ID: {loc.metadata?.placeId || 'Not linked'}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{
                                background: loc.metadata?.verificationState === 'VERIFIED' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                                color: loc.metadata?.verificationState === 'VERIFIED' ? '#4ade80' : '#ef4444',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '0.8rem'
                            }}>
                                {loc.metadata?.verificationState || 'Unverified'}
                            </span>
                            <button className="btn-primary" disabled={!!selecting} style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                                {selecting === loc.name ? 'Connecting...' : 'Select'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
