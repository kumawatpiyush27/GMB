# Auto-Reply System Implementation Guide

## Overview
Automatically respond to Google My Business reviews using AI-generated personalized replies.

## Architecture

```
Google Review Posted
    ↓
GMB API Webhook → Your Server
    ↓
Fetch Review Details
    ↓
Generate AI Response (OpenAI)
    ↓
Post Reply via GMB API
    ↓
Log in Database
```

## Prerequisites

### 1. Google Cloud Console Setup
1. Go to https://console.cloud.google.com/
2. Create a new project (or use existing)
3. Enable **Google My Business API**
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-domain.vercel.app/api/auth/google/callback`
5. Download credentials JSON

### 2. Required Scopes
```
https://www.googleapis.com/auth/business.manage
```

## Implementation

### Step 1: Add Environment Variables
```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/auth/google/callback
```

### Step 2: Create OAuth Flow

**File: `src/app/api/auth/google/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = ['https://www.googleapis.com/auth/business.manage'];

export async function GET(request: NextRequest) {
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        response_type: 'code',
        scope: SCOPES.join(' '),
        access_type: 'offline',
        prompt: 'consent'
    });

    return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}
```

**File: `src/app/api/auth/google/callback/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code'
        })
    });

    const tokens = await tokenResponse.json();

    // Store tokens in database (associated with business)
    // TODO: Save tokens.access_token and tokens.refresh_token

    return NextResponse.redirect('/admin?auth=success');
}
```

### Step 3: Create Review Monitoring Service

**File: `src/app/api/gmb/check-reviews/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Business from '@/lib/models/Business';

export async function POST(request: NextRequest) {
    await connectDB();

    const { businessId } = await request.json();
    const business = await Business.findById(businessId);

    if (!business || !business.googleAccessToken) {
        return NextResponse.json({ error: 'Business not configured' }, { status: 400 });
    }

    // Fetch reviews from GMB API
    const reviewsResponse = await fetch(
        `https://mybusiness.googleapis.com/v4/${business.googleLocationId}/reviews`,
        {
            headers: {
                'Authorization': `Bearer ${business.googleAccessToken}`
            }
        }
    );

    const reviewsData = await reviewsResponse.json();

    // Process new reviews
    for (const review of reviewsData.reviews || []) {
        if (!review.reviewReply && review.starRating) {
            // Generate and post reply
            await generateAndPostReply(business, review);
        }
    }

    return NextResponse.json({ success: true });
}

async function generateAndPostReply(business: any, review: any) {
    // Generate AI response
    const prompt = `
    You are responding to a ${review.starRating}-star Google review for ${business.name}.
    
    Review: "${review.comment}"
    
    Generate a professional, friendly response that:
    - Thanks the customer
    - Addresses their specific feedback
    - ${review.starRating >= 4 ? 'Expresses appreciation' : 'Shows empathy and offers to help'}
    - Is concise (2-3 sentences)
    
    Return only the response text, no quotes or formatting.
    `;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a professional business owner responding to customer reviews.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7
        })
    });

    const aiData = await aiResponse.json();
    const replyText = aiData.choices[0].message.content;

    // Post reply to GMB
    await fetch(
        `https://mybusiness.googleapis.com/v4/${review.name}/reply`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${business.googleAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                comment: replyText
            })
        }
    );

    console.log(`Posted reply to review ${review.reviewId}`);
}
```

### Step 4: Add Cron Job (Vercel)

**File: `vercel.json`**
```json
{
  "crons": [
    {
      "path": "/api/gmb/check-reviews-cron",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

**File: `src/app/api/gmb/check-reviews-cron/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Business from '@/lib/models/Business';

export async function GET(request: NextRequest) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get all active businesses with GMB integration
    const businesses = await Business.find({ 
        isActive: true,
        googleAccessToken: { $exists: true }
    });

    for (const business of businesses) {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/gmb/check-reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessId: business._id })
            });
        } catch (error) {
            console.error(`Failed to check reviews for ${business.name}:`, error);
        }
    }

    return NextResponse.json({ success: true, checked: businesses.length });
}
```

### Step 5: Update Database Schema

Add to `Business` model:
```typescript
googleAccessToken: String,
googleRefreshToken: String,
googleLocationId: String,
autoReplyEnabled: { type: Boolean, default: false }
```

## Admin UI Integration

Add toggle in admin dashboard:
```typescript
<label>
    <input 
        type="checkbox" 
        checked={business.autoReplyEnabled}
        onChange={() => toggleAutoReply(business._id)}
    />
    Enable Auto-Reply
</label>

{!business.googleAccessToken && (
    <a href="/api/auth/google">Connect Google My Business</a>
)}
```

## Testing

1. Connect GMB account via OAuth
2. Enable auto-reply for a business
3. Post a test review on Google
4. Wait for cron job (or trigger manually)
5. Verify reply appears on Google

## Limitations

- GMB API has rate limits (check quota)
- Requires business verification on Google
- Only works for claimed locations
- Replies must follow Google's policies

## Alternative: Manual Trigger

Instead of cron, add a "Check Now" button in admin:
```typescript
<button onClick={() => checkReviews(business._id)}>
    Check for New Reviews
</button>
```

## Cost Estimation

- OpenAI API: ~$0.001 per reply (GPT-4o-mini)
- Vercel Cron: Free (Hobby plan: 1 cron)
- GMB API: Free (within quota)

**Total: ~$0.10 per 100 auto-replies**
