import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;

  if (!userId) {
    console.error('No user_id in checkout session metadata');
    return;
  }

  if (session.mode === 'subscription') {
    // Subscription checkout - handled by subscription.created webhook
    console.log('Subscription checkout completed');
  } else if (session.mode === 'payment') {
    // One-time purchase
    const productId = session.metadata?.product_id;
    const productType = session.metadata?.product_type;
    const quantity = parseInt(session.metadata?.quantity || '1');

    // Record purchase
    await supabase.from('purchases').insert({
      user_id: userId,
      purchase_type: 'one_time',
      product_id: productId,
      stripe_payment_intent_id: session.payment_intent as string,
      amount: session.amount_total! / 100,
      status: 'completed'
    });

    // Handle product delivery
    if (productType === 'introduction') {
      // Add introduction credits
      await supabase.from('introduction_credits').insert({
        user_id: userId,
        source_type: 'purchase',
        credits_added: quantity,
        credits_remaining: quantity,
        expires_at: new Date(Date.now() + 365 * 86400000).toISOString() // 1 year
      });
    }
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  const planId = subscription.metadata?.plan_id;

  if (!userId) {
    // Try to find user by customer ID
    const { data } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', subscription.customer as string)
      .single();

    if (!data) {
      console.error('Could not find user for subscription');
      return;
    }
  }

  // Get plan details
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single();

  // Map Stripe status
  const statusMap: Record<string, string> = {
    'active': 'active',
    'past_due': 'past_due',
    'canceled': 'canceled',
    'trialing': 'trialing',
    'unpaid': 'past_due',
    'incomplete': 'pending',
    'incomplete_expired': 'canceled',
    'paused': 'paused'
  };

  await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      plan_id: planId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      status: statusMap[subscription.status] || subscription.status,
      billing_interval: subscription.items.data[0]?.price.recurring?.interval || 'month',
      current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      cancel_at_period_end: (subscription as any).cancel_at_period_end || false,
      trial_start: (subscription as any).trial_start
        ? new Date((subscription as any).trial_start * 1000).toISOString()
        : null,
      trial_end: (subscription as any).trial_end
        ? new Date((subscription as any).trial_end * 1000).toISOString()
        : null,
      introductions_remaining: plan?.introductions_per_month === -1
        ? 999
        : plan?.introductions_per_month || 0,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  // Update user's plan reference
  await supabase
    .from('users')
    .update({
      subscription_plan: plan?.slug,
      subscription_status: statusMap[subscription.status] || subscription.status
    })
    .eq('id', userId);
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const { data } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (data) {
    // Get free plan
    const { data: freePlan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('slug', 'free')
      .single();

    await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        plan_id: freePlan?.id,
        canceled_at: new Date().toISOString(),
        introductions_remaining: 0
      })
      .eq('stripe_subscription_id', subscription.id);

    await supabase
      .from('users')
      .update({
        subscription_plan: 'free',
        subscription_status: 'canceled'
      })
      .eq('id', data.user_id);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!(invoice as any).subscription) return;

  const { data: sub } = await supabase
    .from('user_subscriptions')
    .select('*, plan:subscription_plans(*)')
    .eq('stripe_subscription_id', (invoice as any).subscription as string)
    .single();

  if (!sub) return;

  // Record invoice
  await supabase.from('invoices').upsert({
    user_id: sub.user_id,
    subscription_id: sub.id,
    stripe_invoice_id: invoice.id,
    amount_due: invoice.amount_due / 100,
    amount_paid: invoice.amount_paid / 100,
    status: 'paid',
    invoice_pdf_url: invoice.invoice_pdf,
    hosted_invoice_url: invoice.hosted_invoice_url,
    period_start: new Date((invoice as any).period_start * 1000).toISOString(),
    period_end: new Date((invoice as any).period_end * 1000).toISOString(),
    paid_at: new Date().toISOString()
  }, {
    onConflict: 'stripe_invoice_id'
  });

  // Reset monthly introductions
  const introductions = sub.plan?.introductions_per_month === -1
    ? 999
    : sub.plan?.introductions_per_month || 0;

  // Fetch current values
  const { data: currentSub } = await supabase
    .from('user_subscriptions')
    .select('lifetime_value, months_subscribed')
    .eq('id', sub.id)
    .single();

  await supabase
    .from('user_subscriptions')
    .update({
      introductions_used: 0,
      introductions_remaining: introductions,
      lifetime_value: (currentSub?.lifetime_value || 0) + (invoice.amount_paid / 100),
      months_subscribed: (currentSub?.months_subscribed || 0) + 1
    })
    .eq('id', sub.id);

  // Add introduction credits
  await supabase.from('introduction_credits').insert({
    user_id: sub.user_id,
    source_type: 'subscription',
    source_id: sub.id,
    credits_added: introductions,
    credits_remaining: introductions,
    expires_at: new Date((invoice as any).period_end * 1000).toISOString()
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!(invoice as any).subscription) return;

  // Update subscription status
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', (invoice as any).subscription as string)
    .select('user_id')
    .single();

  if (!subscription) {
    console.error('Subscription not found for failed payment');
    return;
  }

  // Get user information
  const { data: user } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', subscription.user_id)
    .single();

  if (!user) {
    console.error('User not found for failed payment');
    return;
  }

  // Get profile for first name
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name')
    .eq('user_id', subscription.user_id)
    .single();

  const firstName = profile?.first_name || user.full_name?.split(' ')[0] || 'there';

  // Send payment failed notification
  const { sendPaymentFailedNotification } = await import('@/lib/email/smtp');
  const emailResult = await sendPaymentFailedNotification({
    email: user.email,
    firstName,
    amount: invoice.amount_due,
    currency: invoice.currency
  });

  if (!emailResult.success) {
    console.error('Failed to send payment failure email:', emailResult.error);
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  // One-time payment success - most handling done in checkout.session.completed
  console.log('Payment succeeded:', paymentIntent.id);
}
