// app/api/stripe/checkout/route.ts
import { createCheckoutSession } from '@/lib/stripe/subscription';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    // Get the authorization header
    const headersList = await headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }
    
    const accessToken = authorization.split('Bearer ')[1];
    
    // Create Supabase client
    const supabase = await createClient(cookies());
    
    // Verify the token and get the user
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { priceId } = await req.json();
    
    const checkoutSession = await createCheckoutSession(
      user.id,
      priceId,
      user.email!
    );
    
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
