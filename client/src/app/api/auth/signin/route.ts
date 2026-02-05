import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Business } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        // We must explicitly select the password as it is excluded by default
        const business = await Business.findOne({ email }).select('+password');

        if (!business) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const matches = await bcrypt.compare(password, business.password || '');
        if (!matches) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const { password: _, ...bizData } = business.toObject();

        return NextResponse.json(bizData);
    } catch (e: any) {
        console.error('Login Error:', e);
        return NextResponse.json({ error: e.message || 'Login failed' }, { status: 500 });
    }
}
