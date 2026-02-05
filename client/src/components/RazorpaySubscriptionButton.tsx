'use client';

import { useEffect, useRef } from 'react';

export default function RazorpaySubscriptionButton() {
    const containerRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            // Clear any existing content to prevent duplicates if key changes (though empty dependency array handles mount only)
            containerRef.current.innerHTML = '';

            const script = document.createElement('script');
            script.src = 'https://cdn.razorpay.com/static/widget/subscription-button.js';
            script.setAttribute('data-subscription_button_id', 'pl_SC6NkR9VjLhdWN');
            script.setAttribute('data-button_theme', 'rzp-dark-standard');
            script.async = true;

            containerRef.current.appendChild(script);
        }
    }, []);

    return (
        <form ref={containerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
        </form>
    );
}
