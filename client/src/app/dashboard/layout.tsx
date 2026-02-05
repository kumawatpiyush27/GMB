'use client';

import Sidebar from '../../components/Sidebar';

export default function CRMLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main style={{ marginLeft: '250px', flex: 1, padding: '40px', minHeight: '100vh' }}>
                {children}
            </main>
        </div>
    );
}
