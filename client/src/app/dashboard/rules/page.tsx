'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/app/config';

export default function AutomationRules() {
    const [rules, setRules] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load Data
    useEffect(() => {
        const id = localStorage.getItem('gmb_biz_id');
        if (!id) return;

        const fetchData = async () => {
            try {
                // Fetch Logs
                const logRes = await fetch(`${API_URL}/gbp/logs/${id}`);
                const logData = await logRes.json();
                setLogs(Array.isArray(logData) ? logData : []);

                // Fetch Rules
                const ruleRes = await fetch(`${API_URL}/gbp/rules/${id}`);
                const ruleData = await ruleRes.json();
                setRules(ruleData);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const saveRules = async () => {
        const id = localStorage.getItem('gmb_biz_id');
        setSaving(true);
        await fetch(`${API_URL}/gbp/rules/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rules)
        });
        setSaving(false);
        alert('Rules Saved');
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '20px' }}>Auto-Reply Rules</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* Rules Config */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <h2>Configuration</h2>

                    <div style={{ marginBottom: '15px' }}>
                        <label>Automation Mode</label>
                        <select
                            value={rules?.mode || 'MANUAL'}
                            onChange={e => setRules({ ...rules, mode: e.target.value })}
                        >
                            <option value="AUTO">Fully Automatic (Reply to 4-5 Stars)</option>
                            <option value="SUGGEST">Suggest Only (Draft but don't post)</option>
                            <option value="MANUAL">Manual Only (No AI actions)</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label>Minimum Stars to Auto-Reply</label>
                        <input
                            type="number"
                            min="1" max="5"
                            value={rules?.minStars || 4}
                            onChange={e => setRules({ ...rules, minStars: parseInt(e.target.value) })}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label>Daily Reply Limit</label>
                        <input
                            type="number"
                            value={rules?.dailyLimit || 20}
                            onChange={e => setRules({ ...rules, dailyLimit: parseInt(e.target.value) })}
                        />
                        <small style={{ color: '#94a3b8' }}>Pause after this many replies/day to stay safe.</small>
                    </div>

                    <button className="btn-primary" onClick={saveRules} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>

                {/* Logs */}
                <div className="glass-panel" style={{ padding: '20px', maxHeight: '500px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>Activity Log</h2>
                        <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => window.location.reload()}>Refresh</button>
                    </div>

                    {logs.length === 0 ? (
                        <p style={{ color: '#64748b' }}>No automated actions yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {logs.map((log: any) => (
                                <div key={log._id} style={{
                                    padding: '10px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '5px',
                                    borderLeft: `3px solid ${log.status === 'SUCCESS' ? '#4ade80' : '#ef4444'}`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
                                        <span>{log.action}</span>
                                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div style={{ marginTop: '5px', fontSize: '0.9rem' }}>
                                        {log.message}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
