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
                <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '15px', borderRadius: '8px' }}>
                    {error}
                    {error.includes('auth') && (
                        <button
                            className="btn-primary"
                            style={{ marginTop: '10px', display: 'block' }}
                            onClick={() => router.push('/onboarding')}
                        >
                            Reconnect Google Account
                        </button>
                    )}
                </div>
            )}

            {!loading && !error && locations.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: '50px' }}>
                    <h3 style={{ color: '#94a3b8' }}>No locations found.</h3>
                    <p style={{ color: '#64748b' }}>Please ensure your Google Account has verified business profiles.</p>
                    <button
                        className="btn-secondary"
                        style={{ marginTop: '20px' }}
                        onClick={() => router.push('/dashboard')}
                    >
                        Cancel / Return to Dashboard
                    </button>
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
                            opacity: selecting && selecting !== loc.name ? 0.5 : 1
                        }}
                        onClick={() => !selecting && handleSelect(loc)}
                    >
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>{loc.title}</h3>
                        <p style={{ margin: '0 0 5px 0', color: '#cbd5e1' }}>{loc.storeCode ? `Store Code: ${loc.storeCode}` : 'No Store Code'}</p>
                        <p style={{ margin: '0 0 15px 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                            {loc.metadata?.placeId || 'No Place ID'}
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
                            <button className="btn-primary" disabled={!!selecting}>
                                {selecting === loc.name ? 'Connecting...' : 'Select'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
