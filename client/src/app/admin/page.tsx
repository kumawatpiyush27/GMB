'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const router = useRouter();
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Simple client-side auth for demo purposes
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'admin123') {
            setIsAuthenticated(true);
            fetchBusinesses();
        } else {
            alert('Invalid Password');
        }
    };

    const fetchBusinesses = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/businesses`);
            const data = await res.json();
            setBusinesses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;

        try {
            const res = await fetch(`${API_URL}/admin/business/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setBusinesses(prev => prev.filter(b => b.id !== id));
            } else {
                alert('Failed to delete');
            }
        } catch (error) {
            alert('Error deleting');
        }
    };

    const handleLoginAs = (id: string) => {
        localStorage.setItem('gmb_biz_id', id);
        router.push('/dashboard');
    };

    if (!isAuthenticated) {
        return (
            <div style={{
                height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center',
                background: '#0f172a', color: 'white'
            }}>
                <form onSubmit={handleLogin} className="glass-panel" style={{ padding: '40px' }}>
                    <h2 style={{ marginBottom: '20px' }}>Admin Login</h2>
                    <input
                        type="password"
                        placeholder="Enter Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{ marginBottom: '20px', width: '100%', padding: '10px' }}
                    />
                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>Login</button>
                </form>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px' }} className="animate-fade-in">
            <h1 className="gradient-text">Store Administration</h1>

            <div className="glass-panel" style={{ marginTop: '30px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2>All Stores ({businesses.length})</h2>
                    <button onClick={fetchBusinesses} className="btn-secondary" style={{ fontSize: '0.9rem' }}>Refresh</button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #334155' }}>
                            <th style={{ padding: '10px' }}>ID</th>
                            <th style={{ padding: '10px' }}>Name</th>
                            <th style={{ padding: '10px' }}>Location</th>
                            <th style={{ padding: '10px' }}>Status</th>
                            <th style={{ padding: '10px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {businesses.map(biz => (
                            <tr key={biz.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '10px', fontFamily: 'monospace', color: '#94a3b8' }}>{biz.id}</td>
                                <td style={{ padding: '10px', fontWeight: 'bold' }}>{biz.name}</td>
                                <td style={{ padding: '10px' }}>{biz.location}</td>
                                <td style={{ padding: '10px' }}>
                                    <span style={{
                                        color: biz.connected ? '#4ade80' : '#facc15',
                                        fontSize: '0.8rem',
                                        border: `1px solid ${biz.connected ? '#4ade80' : '#facc15'}`,
                                        padding: '2px 6px',
                                        borderRadius: '4px'
                                    }}>
                                        {biz.connected ? 'Connected' : 'Pending'}
                                    </span>
                                </td>
                                <td style={{ padding: '10px', display: 'flex', gap: '10px' }}>
                                    <button
                                        className="btn-secondary"
                                        style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                                        onClick={() => handleLoginAs(biz.id)}
                                    >
                                        Manage
                                    </button>
                                    <button
                                        style={{
                                            background: '#ef4444', color: 'white', border: 'none',
                                            padding: '5px 10px', borderRadius: '5px', cursor: 'pointer',
                                            fontSize: '0.8rem'
                                        }}
                                        onClick={() => handleDelete(biz.id, biz.name)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {businesses.length === 0 && !loading && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No stores found.</div>
                )}
            </div>
        </div>
    );
}
