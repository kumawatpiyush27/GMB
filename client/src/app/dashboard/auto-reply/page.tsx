'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URL } from '@/app/config';

function AutoReplyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [business, setBusiness] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState({
        mode: 'auto-4-5-stars',
        minStars: 4,
        dailyLimit: 20
    });

    useEffect(() => {
        // Get business ID from localStorage
        const storedId = localStorage.getItem('gmb_biz_id');
        if (!storedId) {
            setLoading(false);
            return;
        }

        // Fetch business data
        fetch(`${API_URL}/business/${storedId}`)
            .then(r => r.json())
            .then(data => {
                setBusiness(data);
                if (data.autoReplyConfig) {
                    setConfig(data.autoReplyConfig);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });

        // Check for OAuth success/error
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        if (success) {
            alert('✅ Google My Business connected successfully!');
            window.location.href = '/dashboard/auto-reply';
        }
        if (error) {
            alert(`❌ Connection failed: ${error}`);
        }
    }, [searchParams]);

    const handleConnectGoogle = () => {
        if (!business?._id) return;
        window.location.href = `${API_URL}/auth/google?businessId=${business._id}`;
    };

    const handleSaveConfig = async () => {
        const response = await fetch(`${API_URL}/business/${business._id}/auto-reply-config`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });

        if (response.ok) {
            alert('✅ Configuration saved!');
        } else {
            alert('❌ Failed to save configuration');
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', color: 'white' }}>
                <h2>Loading...</h2>
            </div>
        );
    }

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '40px' }}>
                Auto-Reply Rules
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                {/* Configuration Panel */}
                <div className="glass-panel" style={{ padding: '30px' }}>
                    <h2 style={{ color: 'white', marginBottom: '25px', fontSize: '1.5rem' }}>
                        Configuration
                    </h2>

                    {/* GMB Connection Status */}
                    {!business?.googleAccessToken ? (
                        <div style={{ marginBottom: '30px', padding: '20px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                                <span style={{ fontSize: '2rem' }}>⚠️</span>
                                <div>
                                    <h3 style={{ color: '#fbbf24', margin: 0, fontSize: '1.1rem' }}>Google My Business Not Connected</h3>
                                    <p style={{ color: '#cbd5e1', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
                                        Connect your GMB account to enable auto-reply
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleConnectGoogle}
                                className="btn-primary"
                                style={{ width: '100%', padding: '12px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                            >
                                <img src="https://www.google.com/favicon.ico" style={{ width: '20px', height: '20px' }} />
                                Connect Google My Business
                            </button>
                        </div>
                    ) : (
                        <div style={{ marginBottom: '30px', padding: '20px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '2rem' }}>✅</span>
                                <div>
                                    <h3 style={{ color: '#22c55e', margin: 0, fontSize: '1.1rem' }}>Connected</h3>
                                    <p style={{ color: '#cbd5e1', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
                                        {business.googleLocationName || 'Google My Business'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Automation Mode */}
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ color: '#cbd5e1', display: 'block', marginBottom: '10px', fontSize: '0.95rem' }}>
                            Automation Mode
                        </label>
                        <select
                            value={config.mode}
                            onChange={(e) => setConfig({ ...config, mode: e.target.value })}
                            disabled={!business?.googleAccessToken}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'rgba(30, 41, 59, 0.5)',
                                border: '1px solid rgba(148, 163, 184, 0.3)',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '1rem'
                            }}
                        >
                            <option value="manual">Manual (Preview before posting)</option>
                            <option value="auto-4-5-stars">Fully Automatic (Reply to 4-5 Stars)</option>
                            <option value="auto-all">Fully Automatic (Reply to All)</option>
                        </select>
                    </div>

                    {/* Minimum Stars */}
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ color: '#cbd5e1', display: 'block', marginBottom: '10px', fontSize: '0.95rem' }}>
                            Minimum Stars to Auto-Reply
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="5"
                            value={config.minStars}
                            onChange={(e) => setConfig({ ...config, minStars: parseInt(e.target.value) })}
                            disabled={!business?.googleAccessToken}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'rgba(30, 41, 59, 0.5)',
                                border: '1px solid rgba(148, 163, 184, 0.3)',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    {/* Daily Reply Limit */}
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ color: '#cbd5e1', display: 'block', marginBottom: '10px', fontSize: '0.95rem' }}>
                            Daily Reply Limit
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={config.dailyLimit}
                            onChange={(e) => setConfig({ ...config, dailyLimit: parseInt(e.target.value) })}
                            disabled={!business?.googleAccessToken}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'rgba(30, 41, 59, 0.5)',
                                border: '1px solid rgba(148, 163, 184, 0.3)',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '1rem'
                            }}
                        />
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '8px' }}>
                            Pause after this many replies/day to stay safe.
                        </p>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSaveConfig}
                        disabled={!business?.googleAccessToken}
                        className="btn-primary"
                        style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                    >
                        Save Configuration
                    </button>
                </div>

                {/* Activity Log Panel */}
                <div className="glass-panel" style={{ padding: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                        <h2 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>
                            Activity Log
                        </h2>
                        <button
                            className="btn-secondary"
                            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                        >
                            Refresh
                        </button>
                    </div>

                    <div style={{ color: '#94a3b8', textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📭</div>
                        <p style={{ fontSize: '1.1rem' }}>No automated actions yet.</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>
                            Connect GMB and enable auto-reply to see activity here.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AutoReplyPage() {
    return (
        <Suspense fallback={<div style={{ padding: '40px', color: 'white' }}><h2>Loading...</h2></div>}>
            <AutoReplyContent />
        </Suspense>
    );
}
