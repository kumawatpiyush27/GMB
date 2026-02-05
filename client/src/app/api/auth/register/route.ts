import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Business } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const { email, password, businessName } = await request.json();

        if (!email || !password || !businessName) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const existing = await Business.findOne({ email });
        if (existing) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // Generate a URL-friendly ID
        const newId = businessName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);

        const newBusiness = await Business.create({
            id: newId,
            name: businessName,
            email,
            password: hashedPassword,
            category: 'Uncategorized',
            location: 'Unknown',
            connected: false
        });

        const { password: _, ...bizData } = newBusiness.toObject();

        return NextResponse.json(bizData);
    } catch (e: any) {
        console.error('Registration Error:', e);
        return NextResponse.json({ error: e.message || 'Registration failed' }, { status: 500 });
    }
}
