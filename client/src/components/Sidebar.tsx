import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
    return (
        <aside style={{
            width: '250px',
            background: 'rgba(15, 23, 42, 0.9)',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            height: '100vh',
            padding: '20px',
            position: 'fixed'
        }}>
            <div style={{ marginBottom: '40px', fontWeight: 'bold', fontSize: '1.2rem', color: '#fff' }}>
                GMB SmartReview
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <SidebarLink href="/dashboard" label="GMB Connection" />
                <SidebarLink href="/dashboard/qrcode" label="QR Studio" />
                <SidebarLink href="/dashboard/reviews" label="Reviews Inbox" />
                <SidebarLink href="/" label="Logout / Public" />
            </nav>
        </aside>
    );
}

function SidebarLink({ href, label }: { href: string; label: string }) {
    return (
        <Link href={href} style={{
            color: '#cbd5e1',
            textDecoration: 'none',
            padding: '10px',
            borderRadius: '6px',
            transition: 'background 0.2s',
            display: 'block'
        }}
            className="hover:bg-white/5"
        >
            {label}
        </Link>
    );
}
