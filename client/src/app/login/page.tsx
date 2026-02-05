'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [blockedUser, setBlockedUser] = useState<any>(null); // For handling inactive accounts
    const [txnId, setTxnId] = useState('');

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

            // Handle Manual Block
            if (res.status === 403 && data.error === 'Account inactive') {
                setBlockedUser(data);
                return;
            }

            if (!res.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            localStorage.setItem('gmb_biz_id', data.id);
            router.push('/dashboard');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyWhatsapp = () => {
        const message = `Hello, I made a payment. Please verify my account.\n\nBusiness: ${blockedUser.name}\nEmail: ${blockedUser.email}\nTxn ID: ${txnId || 'N/A'}`;
        const url = `https://wa.me/918239061209?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    if (blockedUser) {
        return (
            <main style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)'
            }}>
                <div className="glass-panel animate-fade-in" style={{
                    width: '100%', maxWidth: '480px', padding: '40px', margin: '20px', textAlign: 'center'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🚫</div>
                    <h1 className="gradient-text" style={{ fontSize: '1.8rem', marginBottom: '10px' }}>
                        Access Restricted
                    </h1>
                    <p style={{ color: '#ef4444', marginBottom: '20px', fontWeight: 'bold' }}>
                        Your subscription plan has expired.
                    </p>
                    <p style={{ color: '#94a3b8', marginBottom: '30px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        Please ensure your payment is completed to restore access. If you have already paid, please provide the Transaction ID below for manual verification.
                    </p>

                    <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                        <label style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '5px', display: 'block' }}>
                            Transaction ID / Reference No. (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. UPI Ref ID, Order ID"
                            value={txnId}
                            onChange={(e) => setTxnId(e.target.value)}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white'
                            }}
                        />
                    </div>

                    <button
                        onClick={handleVerifyWhatsapp}
                        className="btn-primary"
                        style={{ width: '100%', padding: '14px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#22c55e' }}
                    >
                        <span>Verify Manually on WhatsApp</span>
                    </button>

                    <button
                        onClick={() => window.open('https://wa.me/918239061209', '_blank')}
                        style={{
                            width: '100%', padding: '12px', background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8',
                            cursor: 'pointer'
                        }}
                    >
                        Contact Support
                    </button>

                    <div style={{ marginTop: '25px' }}>
                        <button
                            onClick={() => { setBlockedUser(null); setTxnId(''); }}
                            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                            ← Back to Login
                        </button>
                    </div>
                </div>
            </main>
        );
    }

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
