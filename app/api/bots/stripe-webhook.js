const db = require('../server/db');
const Stripe = require('stripe');
const { withAuth } = require('../lib/api-wrapper');
const {
  sendTrialStartedEmail,
  sendTrialEndingEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCanceledEmail
} = require('../lib/email-sender');

// Initialize Stripe at runtime
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET;
}

// Tier pricing for emails
const TIER_PRICES = {
  FOUNDATIONS: 297,
  GROWTH: 597,
  SCALE: 997,
  ENTERPRISE: 2500
};

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    console.log('[Stripe Webhook] Processing webhook event');

    let event;
    const stripe = getStripe();
    const WEBHOOK_SECRET = getWebhookSecret();

    // Verify webhook signature if Stripe and webhook secret are configured
    if (stripe && WEBHOOK_SECRET) {
      const sig = req.headers['stripe-signature'];

      try {
        // Convert raw buffer to string for signature verification
        const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') :
                       typeof req.body === 'string' ? req.body :
                       JSON.stringify(req.body);

        event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
        console.log('[Stripe Webhook] Signature verified');
      } catch (err) {
        console.error('[Stripe Webhook] Signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      // No signature verification if Stripe not configured (for testing)
      // Handle both raw buffer and parsed JSON
      if (Buffer.isBuffer(req.body)) {
        event = JSON.parse(req.body.toString('utf8'));
      } else if (typeof req.body === 'string') {
        event = JSON.parse(req.body);
      } else {
        event = req.body;
      }
      console.log('[Stripe Webhook] Processing without signature verification (Stripe not configured)');
    }

    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;

      default:
            }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('[Stripe Webhook] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      details: error.message
    });
  }
};

// Handle successful checkout
async function handleCheckoutComplete(session) {
  
  const tenantId = session.metadata?.tenant_id;
  const tier = session.metadata?.tier;

  if (!tenantId || !tier) {
    console.error('[Stripe Webhook] Missing tenant_id or tier in metadata');
    return;
  }

  const { error } = await db
    .from('tenants')
    .update({
      subscription_tier: tier.toUpperCase(),
      subscription_status: 'active',
      subscription_stripe_id: session.subscription,
      updated_at: new Date().toISOString()
    })
    .eq('id', tenantId);

  if (error) {
    console.error('[Stripe Webhook] Error updating tenant:', error);
  } else {
    console.log('[Stripe Webhook] ✅ Updated tenant to', tier);
  }
}

// Handle subscription created
async function handleSubscriptionCreated(subscription) {
  
  // Try to get tenant_id from metadata first, then look up by customer
  let tenantId = subscription.metadata?.tenant_id;

  if (!tenantId) {
    console.log('[Stripe Webhook] No tenant_id in metadata, looking up by customer...');
    const { data: tenant } = await db
      .from('tenants')
      .select('id')
      .eq('subscription_stripe_id', subscription.customer)
      .single();

    tenantId = tenant?.id;
  }

  if (!tenantId) {
    console.error('[Stripe Webhook] Could not find tenant for subscription');
    return;
  }

  // Determine status (trialing or active)
  const status = subscription.status === 'trialing' ? 'trialing' : 'active';

  const { error } = await db
    .from('tenants')
    .update({
      subscription_status: status,
      subscription_stripe_id: subscription.id,
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', tenantId);

  if (error) {
    console.error('[Stripe Webhook] Error updating tenant:', error);
  } else {
      }

  // Send trial started email if trialing
  if (status === 'trialing') {
    try {
      const { data: tenant } = await db
        .from('tenants')
        .select('business_name, subscription_tier')
        .eq('id', tenantId)
        .single();

      const { data: user } = await db
        .from('users')
        .select('email, full_name')
        .eq('tenant_id', tenantId)
        .eq('role', 'saas')
        .single();

      if (user && tenant) {
        // Calculate trial days
        const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
        const trialStart = new Date();
        const trialDays = trialEnd ? Math.ceil((trialEnd - trialStart) / (1000 * 60 * 60 * 24)) : 14;

        await sendTrialStartedEmail({
          email: user.email,
          name: user.full_name || tenant.business_name,
          tier: tenant.subscription_tier || 'FOUNDATIONS',
          trialDays: trialDays
        });
        console.log('[Stripe Webhook] ✅ Trial started email sent to', user.email);
      }
    } catch (emailError) {
      console.error('[Stripe Webhook] Error sending trial started email:', emailError);
      // Don't fail the webhook if email fails
    }
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription) {
  
  const tenantId = subscription.metadata?.tenant_id;

  if (!tenantId) {
    console.error('[Stripe Webhook] Missing tenant_id in metadata');
    return;
  }

  const status = subscription.cancel_at_period_end ? 'cancelled' : subscription.status;

  const { error } = await db
    .from('tenants')
    .update({
      subscription_status: status,
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', tenantId);

  if (error) {
    console.error('[Stripe Webhook] Error updating tenant:', error);
  } else {
    console.log('[Stripe Webhook] ✅ Subscription status updated to', status);
  }
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription) {
  
  const tenantId = subscription.metadata?.tenant_id;

  if (!tenantId) {
    console.error('[Stripe Webhook] Missing tenant_id in metadata');
    return;
  }

  const { error } = await db
    .from('tenants')
    .update({
      subscription_tier: 'FREE',
      subscription_status: 'cancelled',
      subscription_stripe_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', tenantId);

  if (error) {
    console.error('[Stripe Webhook] Error updating tenant:', error);
  } else {
    console.log('[Stripe Webhook] ✅ Subscription cancelled, reverted to FREE');
  }

  // Send subscription canceled email
  try {
    const { data: tenant } = await db
      .from('tenants')
      .select('business_name, subscription_tier')
      .eq('id', tenantId)
      .single();

    const { data: user } = await db
      .from('users')
      .select('email, full_name')
      .eq('tenant_id', tenantId)
      .eq('role', 'saas')
      .single();

    if (user && tenant) {
      // Access until end of current billing period
      const accessUntil = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default 30 days if not set

      await sendSubscriptionCanceledEmail({
        email: user.email,
        name: user.full_name || tenant.business_name,
        tier: tenant.subscription_tier || 'FOUNDATIONS',
        accessUntil: accessUntil
      });
      console.log('[Stripe Webhook] ✅ Subscription canceled email sent to', user.email);
    }
  } catch (emailError) {
    console.error('[Stripe Webhook] Error sending subscription canceled email:', emailError);
    // Don't fail the webhook if email fails
  }
}

// Handle successful payment
async function handleInvoicePaid(invoice) {
  
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    return;
  }

  // Update subscription status to active
  const { error } = await db
    .from('tenants')
    .update({
      subscription_status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('subscription_stripe_id', subscriptionId);

  if (error) {
    console.error('[Stripe Webhook] Error updating tenant:', error);
  } else {
    console.log('[Stripe Webhook] ✅ Payment confirmed');
  }

  // Send payment success email
  try {
    const { data: tenant } = await db
      .from('tenants')
      .select('id, business_name, subscription_tier, subscription_current_period_end')
      .eq('subscription_stripe_id', subscriptionId)
      .single();

    if (tenant) {
      const { data: user } = await db
        .from('users')
        .select('email, full_name')
        .eq('tenant_id', tenant.id)
        .eq('role', 'saas')
        .single();

      if (user) {
        const amount = invoice.amount_paid / 100; // Convert cents to dollars
        const tier = tenant.subscription_tier || 'FOUNDATIONS';

        await sendPaymentSuccessEmail({
          email: user.email,
          name: user.full_name || tenant.business_name,
          tier: tier,
          amount: amount,
          nextBillingDate: tenant.subscription_current_period_end
        });
        console.log('[Stripe Webhook] ✅ Payment success email sent to', user.email);
      }
    }
  } catch (emailError) {
    console.error('[Stripe Webhook] Error sending payment success email:', emailError);
    // Don't fail the webhook if email fails
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice) {
  
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    return;
  }

  // Update subscription status to past_due
  const { error } = await db
    .from('tenants')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('subscription_stripe_id', subscriptionId);

  if (error) {
    console.error('[Stripe Webhook] Error updating tenant:', error);
  } else {
    console.log('[Stripe Webhook] ✅ Marked subscription as past_due');
  }

  // Send payment failed email
  try {
    const { data: tenant } = await db
      .from('tenants')
      .select('id, business_name, subscription_tier')
      .eq('subscription_stripe_id', subscriptionId)
      .single();

    if (tenant) {
      const { data: user } = await db
        .from('users')
        .select('email, full_name')
        .eq('tenant_id', tenant.id)
        .eq('role', 'saas')
        .single();

      if (user) {
        const amount = invoice.amount_due / 100; // Convert cents to dollars
        const tier = tenant.subscription_tier || 'FOUNDATIONS';

        await sendPaymentFailedEmail({
          email: user.email,
          name: user.full_name || tenant.business_name,
          tier: tier,
          amount: amount
        });
        console.log('[Stripe Webhook] ✅ Payment failed email sent to', user.email);
      }
    }
  } catch (emailError) {
    console.error('[Stripe Webhook] Error sending payment failed email:', emailError);
    // Don't fail the webhook if email fails
  }
}

// Handle trial ending soon (3 days before trial ends)
async function handleTrialWillEnd(subscription) {
  
  let tenantId = subscription.metadata?.tenant_id;

  if (!tenantId) {
    console.log('[Stripe Webhook] No tenant_id in metadata, looking up by subscription...');
    const { data: tenant } = await db
      .from('tenants')
      .select('id')
      .eq('subscription_stripe_id', subscription.id)
      .single();

    tenantId = tenant?.id;
  }

  if (!tenantId) {
    console.error('[Stripe Webhook] Could not find tenant for trial ending notification');
    return;
  }

  // Send trial ending email
  try {
    const { data: tenant } = await db
      .from('tenants')
      .select('business_name, subscription_tier')
      .eq('id', tenantId)
      .single();

    const { data: user } = await db
      .from('users')
      .select('email, full_name')
      .eq('tenant_id', tenantId)
      .eq('role', 'saas')
      .single();

    if (user && tenant) {
      // Calculate days remaining
      const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
      const now = new Date();
      const daysRemaining = trialEnd ? Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)) : 3;

      const tier = tenant.subscription_tier || 'FOUNDATIONS';
      const tierPrice = TIER_PRICES[tier] || 297;

      await sendTrialEndingEmail({
        email: user.email,
        name: user.full_name || tenant.business_name,
        tier: tier,
        daysRemaining: daysRemaining,
        tierPrice: tierPrice
      });
      console.log('[Stripe Webhook] ✅ Trial ending email sent to', user.email);
    }
  } catch (emailError) {
    console.error('[Stripe Webhook] Error sending trial ending email:', emailError);
    // Don't fail the webhook if email fails
  }
}

// Export with authentication wrapper
module.exports = withAuth(handler, { publicEndpoint: true });