'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/app/config';
import QRCode from 'qrcode';

// Print Styles
const printStyles = `
    @media print {
        body {
            background-color: white !important;
            background-image: none !important;
        }
        body * {
            visibility: hidden;
        }
        .printable-area, .printable-area * {
            visibility: visible;
        }
        .printable-area { 
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 350px !important;
            height: auto !important;
            margin: 0 !important;
            z-index: 9999;
            /* Ensure background colors of the card print */
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        /* Optional: Hide browser headers/footers if supported, though user settings override */
        @page {
            margin: 0;
            size: auto;
        }
    }
`;

export default function QRProPage() {
    const router = useRouter();
    const [status, setStatus] = useState<any>(null);
    const [qrValue, setQrValue] = useState('');
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedId = localStorage.getItem('gmb_biz_id');
        if (!storedId) {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const res = await fetch(`${API_URL}/business/${storedId}`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setStatus(data);

                // Generate QR Code
                // Using window.location.origin to get current domain
                const url = `${window.location.origin}/r/${storedId}`;
                setQrValue(url);
                const dataUrl = await QRCode.toDataURL(url, {
                    width: 400,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    }
                });
                setQrDataUrl(dataUrl);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    if (loading) return <div className="p-10 text-center text-white">Loading Studio...</div>;
    if (!status) return null;

    return (
        <div className="animate-fade-in" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <button
                onClick={() => router.back()}
                style={{ marginBottom: '20px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
                ← Back to Dashboard
            </button>

            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '40px',
                alignItems: 'flex-start'
            }}>
                {/* Left Column: Stats & Controls */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>QR Studio</h1>
                    <p style={{ color: '#cbd5e1', marginBottom: '30px' }}>
                        Share this QR code with your customers to collect reviews instantly.
                    </p>

                    {/* Stats */}
                    <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            background: 'rgba(139, 92, 246, 0.2)',
                            width: '60px',
                            height: '60px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem'
                        }}>
                            📊
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Total Scans/Visits</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{status.stats?.totalScans || 0}</div>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '20px' }}>
                        <h3 style={{ marginTop: 0 }}>Smart Link</h3>
                        <div style={{
                            background: 'rgba(0,0,0,0.3)',
                            padding: '10px',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            color: '#60a5fa',
                            wordBreak: 'break-all',
                            marginBottom: '15px'
                        }}>
                            {qrValue}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => navigator.clipboard.writeText(qrValue)}>
                                Copy Link
                            </button>
                            <button className="btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>
                                Print Card
                            </button>
                        </div>
                        <style>{printStyles}</style>
                    </div>
                </div>

                {/* Right Column: The Premium Card Preview */}
                <div style={{ flex: 1, minWidth: '350px', display: 'flex', justifyContent: 'center' }}>
                    <div
                        id="qr-card"
                        className="printable-area"
                        style={{
                            width: '350px',
                            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                            borderRadius: '24px',
                            padding: '30px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Decorative background blobs */}
                        <div style={{
                            position: 'absolute',
                            top: '-50px',
                            left: '-50px',
                            width: '150px',
                            height: '150px',
                            background: 'rgba(139, 92, 246, 0.15)',
                            borderRadius: '50%',
                            filter: 'blur(40px)'
                        }} />
                        <div style={{
                            position: 'absolute',
                            bottom: '-50px',
                            right: '-50px',
                            width: '150px',
                            height: '150px',
                            background: 'rgba(236, 72, 153, 0.15)',
                            borderRadius: '50%',
                            filter: 'blur(40px)'
                        }} />

                        <h2 style={{
                            fontSize: '2.2rem',
                            margin: '0 0 20px 0',
                            color: '#fff',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            fontFamily: 'Impact, sans-serif' // Punchy font for "SCAN HERE" vibe
                        }}>
                            Scan Me
                        </h2>

                        <div style={{
                            background: 'white',
                            padding: '15px',
                            borderRadius: '16px',
                            display: 'inline-block',
                            marginBottom: '20px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                        }}>
                            {qrDataUrl && (
                                <img src={qrDataUrl} alt="QR Code" style={{ width: '200px', height: '200px', display: 'block' }} />
                            )}
                        </div>

                        <h3 style={{ color: 'white', margin: '0 0 5px 0', fontSize: '1.2rem' }}>
                            {status.name}
                        </h3>
                        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
                            Review us on Google
                        </p>

                        <div style={{
                            marginTop: '25px',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            paddingTop: '15px',
                            fontSize: '0.7rem',
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            GMB SmartReview Collector
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
