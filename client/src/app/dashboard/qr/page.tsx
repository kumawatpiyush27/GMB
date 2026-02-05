'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '../../config';

export default function QRGenerator() {
    const [data, setData] = useState<{ qrImage: string, url: string } | null>(null);

    useEffect(() => {
        const storedId = localStorage.getItem('gmb_biz_id');
        if (!storedId) return;

        fetch(`${API_URL}/business/${storedId}/qr`)
            .then(r => r.json())
            .then(setData)
            .catch(console.error);
    }, []);

    return (
        <div className="animate-fade-in">
            <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '20px' }}>QR Code Generator</h1>

            <div className="glass-panel" style={{ padding: '30px', maxWidth: '600px' }}>
                <p style={{ marginBottom: '20px' }}>
                    Print this QR code and place it in your store. Customers can scan it to generate helpful reviews.
                </p>

                {data ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            background: 'white',
                            padding: '20px',
                            borderRadius: '12px',
                            display: 'inline-block',
                            marginBottom: '20px'
                        }}>
                            <img src={data.qrImage} alt="Review QR Code" style={{ width: '200px', height: '200px' }} />
                        </div>

                        <p style={{ fontSize: '0.9rem', color: '#94a3b8', wordBreak: 'break-all' }}>
                            Target: <a href={data.url} target="_blank" style={{ color: '#8b5cf6' }}>{data.url}</a>
                        </p>

                        <button
                            className="btn-primary"
                            style={{ marginTop: '20px' }}
                            onClick={() => {
                                const link = document.createElement('a');
                                link.download = 'review-qr.png';
                                link.href = data.qrImage;
                                link.click();
                            }}
                        >
                            Download QR Code
                        </button>
                    </div>
                ) : (
                    <p>Loading QR Code...</p>
                )}
            </div>
        </div>
    );
}
