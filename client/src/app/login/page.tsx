'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        email: '',
        password: '',
        businessName: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const endpoint = isLogin ? '/api/auth/signin' : '/api/auth/register';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            // Success
            // Store Business ID in localStorage as per current app architecture
            localStorage.setItem('gmb_biz_id', data.id);

            // Redirect to Dashboard (Skipping Onboarding)
            router.push('/dashboard');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)'
        }}>
            <div className="glass-panel animate-fade-in" style={{
                width: '100%',
                maxWidth: '450px',
                padding: '40px',
                margin: '20px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '10px' }}>
                        GMB SmartReview
                    </h1>
                    <p style={{ color: '#94a3b8' }}>
                        Collector by Retner
                    </p>
                </div>

                <div style={{
                    display: 'flex',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '4px',
                    borderRadius: '8px',
                    marginBottom: '24px'
                }}>
                    <button
                        onClick={() => { setIsLogin(true); setError(''); }}
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            background: isLogin ? 'var(--glass-highlight)' : 'transparent',
                            color: isLogin ? 'white' : '#94a3b8',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontWeight: isLogin ? '600' : 'normal'
                        }}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => { setIsLogin(false); setError(''); }}
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            background: !isLogin ? 'var(--glass-highlight)' : 'transparent',
                            color: !isLogin ? 'white' : '#94a3b8',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontWeight: !isLogin ? '600' : 'normal'
                        }}
                    >
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div style={{ marginBottom: '16px' }}>
                            <label>Business Name</label>
                            <input
                                required
                                type="text"
                                placeholder="Your Business Name"
                                value={form.businessName}
                                onChange={e => setForm({ ...form, businessName: e.target.value })}
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        <label>Email Address</label>
                        <input
                            required
                            type="email"
                            placeholder="name@example.com"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label>Password</label>
                        <input
                            required
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                        />
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#fca5a5',
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            fontSize: '0.9rem',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', padding: '14px' }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                    Protected by reCAPTCHA and Subject to the Privacy Policy.
                </div>
            </div>
        </main>
    );
}
