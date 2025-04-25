// app/api/stripe/portal/route.ts
import { NextResponse } from 'next/server';
import { createPortalSession } from '@/lib/stripe/subscription';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { cookies } from 'next/headers';
import { supabaseService } from '@/lib/supabase/service';

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
      console.log('Unauthorized - returning 401');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Authenticated user ID:', user.id);

    // Use the service client to bypass RLS
    const { data: subscription, error: subscriptionError } = await supabaseService
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('Subscription query result:', { subscription, error: subscriptionError });

    if (subscriptionError) {
      console.error('Subscription query error:', subscriptionError);
      return NextResponse.json(
        { error: 'Error fetching subscription' },
        { status: 500 }
      );
    }

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found for this user' },
        { status: 404 }
      );
    }

    if (!subscription.stripe_customer_id) {
      console.error('No Stripe customer ID found for user:', user.id);
      return NextResponse.json(
        { error: 'No Stripe customer ID found for this user' },
        { status: 404 }
      );
    }

    console.log('Creating portal session with customer ID:', subscription.stripe_customer_id);
    const portalSession = await createPortalSession(subscription.stripe_customer_id);

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
