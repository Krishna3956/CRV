# Payment Integration Guide - Featured Listings

## Overview
This guide covers integrating Stripe for accepting $29 one-time payments for featured MCP tool listings.

## Option 1: Stripe Payment Links (Easiest - 15 minutes) ⚡

### Pros:
- No code changes needed
- Stripe handles everything
- Ready in minutes
- Mobile optimized
- PCI compliant

### Setup:
1. Create a Stripe account at https://stripe.com
2. Go to Products → Create Product
   - Name: "Featured MCP Listing"
   - Price: $29 one-time
3. Create a Payment Link
4. Add success/cancel URLs:
   - Success: `https://trackmcp.com/payment-success?session_id={CHECKOUT_SESSION_ID}`
   - Cancel: `https://trackmcp.com/payment-cancel`

### Implementation:
```typescript
// In SubmitToolDialog.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (wantsFeatured) {
    // Redirect to Stripe Payment Link with metadata
    const paymentUrl = `https://buy.stripe.com/YOUR_PAYMENT_LINK?client_reference_id=${encodeURIComponent(githubUrl)}`;
    window.location.href = paymentUrl;
  } else {
    // Normal free submission
    // ... existing code
  }
};
```

---

## Option 2: Stripe Checkout (Recommended - 1-2 hours) 🎯

### Pros:
- Full control over flow
- Better user experience
- Can customize checkout
- Webhook integration for automation

### Setup:

#### 1. Install Stripe
```bash
npm install stripe @stripe/stripe-js
```

#### 2. Add Environment Variables
```env
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 3. Create API Route for Checkout Session
```typescript
// src/app/api/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(req: NextRequest) {
  try {
    const { githubUrl, repoName } = await req.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Featured MCP Listing',
              description: `Featured listing for ${repoName}`,
            },
            unit_amount: 2900, // $29.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/payment-cancel`,
      metadata: {
        githubUrl,
        repoName,
        type: 'featured_listing',
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

#### 4. Create Webhook Handler
```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Update the tool to featured status in Supabase
    const supabase = createClient();
    const { githubUrl } = session.metadata!;
    
    const { error } = await supabase
      .from('mcp_tools')
      .update({ 
        is_featured: true,
        featured_at: new Date().toISOString(),
        stripe_payment_id: session.payment_intent as string,
      })
      .eq('github_url', githubUrl);

    if (error) {
      console.error('Error updating featured status:', error);
    }
  }

  return NextResponse.json({ received: true });
}
```

#### 5. Update SubmitToolDialog Component
```typescript
// In SubmitToolDialog.tsx
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    if (!validateGithubUrl(githubUrl)) {
      // ... validation error
      return;
    }
  } catch (error: any) {
    // ... banned repo error
    return;
  }

  setIsSubmitting(true);

  try {
    const urlParts = githubUrl.replace(/\/$/, '').split('/');
    const owner = urlParts[urlParts.length - 2];
    const repo = urlParts[urlParts.length - 1];

    const response = await fetchGitHub(`https://api.github.com/repos/${owner}/${repo}`);
    
    if (!response.ok) {
      throw new Error("Repository not found");
    }

    const repoData = await response.json();

    // Insert into database first
    const { error } = await supabase.from("mcp_tools").insert({
      github_url: githubUrl,
      repo_name: repoData.name,
      description: repoData.description || null,
      stars: repoData.stargazers_count || 0,
      language: repoData.language || null,
      topics: repoData.topics || [],
      last_updated: repoData.updated_at || new Date().toISOString(),
      status: wantsFeatured ? "pending_payment" : "pending",
      is_featured: false,
    } as any);

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Already exists",
          description: "This tool has already been submitted",
          variant: "destructive",
        });
      } else {
        throw error;
      }
    } else {
      if (wantsFeatured) {
        // Redirect to Stripe Checkout
        const checkoutResponse = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            githubUrl,
            repoName: repoData.name,
          }),
        });

        const { sessionId } = await checkoutResponse.json();
        const stripe = await stripePromise;
        
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId });
        }
      } else {
        // Free submission
        toast({
          title: "Success!",
          description: "Your MCP tool has been submitted for review",
        });
        setGithubUrl("");
        setOpen(false);
        onSuccess?.();
      }
    }
  } catch (error) {
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to submit tool",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

#### 6. Create Success/Cancel Pages
```typescript
// src/app/payment-success/page.tsx
export default function PaymentSuccess() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">Payment Successful! 🎉</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Your MCP tool will be featured within 24 hours.
      </p>
      <a href="/" className="text-primary hover:underline">
        Return to homepage
      </a>
    </div>
  );
}

// src/app/payment-cancel/page.tsx
export default function PaymentCancel() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">Payment Cancelled</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Your submission was saved. You can upgrade to featured anytime.
      </p>
      <a href="/" className="text-primary hover:underline">
        Return to homepage
      </a>
    </div>
  );
}
```

#### 7. Update Database Schema
```sql
-- Add featured columns to mcp_tools table
ALTER TABLE mcp_tools
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN featured_at TIMESTAMP,
ADD COLUMN stripe_payment_id TEXT;

-- Create index for featured tools
CREATE INDEX idx_featured_tools ON mcp_tools(is_featured, featured_at DESC);
```

---

## Option 3: Lemon Squeezy (Alternative) 🍋

### Pros:
- Handles tax/VAT automatically
- Merchant of record (they handle compliance)
- Similar to Stripe but simpler
- Good for international sales

### Cons:
- Higher fees: 5% + payment processing
- Less flexible than Stripe

---

## Recommended Approach

**For Quick Launch (Today):**
- Use Stripe Payment Links (Option 1)
- Takes 15 minutes
- Get started immediately

**For Better UX (This Week):**
- Implement Stripe Checkout (Option 2)
- Better integration
- Automated featured status updates
- Professional experience

---

## Testing

### Stripe Test Cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Use any future expiry date and any 3-digit CVC

### Test Mode:
1. Use test API keys (pk_test_ and sk_test_)
2. Test the full flow
3. Verify webhook receives events
4. Check database updates correctly

---

## Security Checklist

- ✅ Never expose secret keys in frontend
- ✅ Validate webhook signatures
- ✅ Use HTTPS in production
- ✅ Store payment IDs for reference
- ✅ Handle failed payments gracefully
- ✅ Add rate limiting to API routes

---

## Next Steps

1. **Create Stripe account** (if you don't have one)
2. **Choose implementation** (Payment Links or Checkout)
3. **Test in development** with test keys
4. **Set up webhook** endpoint
5. **Update database schema** to support featured status
6. **Test end-to-end** flow
7. **Go live** with production keys

---

## Cost Breakdown

**Stripe Fees:**
- $29 payment = $29.00
- Stripe fee = $1.14 (2.9% + $0.30)
- You receive = $27.86

**Monthly Volume Examples:**
- 10 featured listings = $278.60
- 50 featured listings = $1,393
- 100 featured listings = $2,786

---

## Support Resources

- Stripe Docs: https://stripe.com/docs
- Stripe Dashboard: https://dashboard.stripe.com
- Webhook Testing: https://stripe.com/docs/webhooks/test
- Next.js + Stripe: https://github.com/vercel/next.js/tree/canary/examples/with-stripe-typescript
