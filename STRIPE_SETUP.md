# Stripe Setup Guide

## ⚠️ IMPORTANT: Development vs Production Keys

Your `.env.local` file currently contains **LIVE Stripe keys**. This is dangerous for development because:
- You could accidentally charge real customers
- Test transactions will fail
- Errors could affect real payment data

## Quick Fix: Switch to Test Mode

### 1. Get Your Stripe Test Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Make sure you're in **Test Mode** (toggle in top right should say "Viewing test data")
3. Copy your test keys:
   - **Publishable key**: Starts with `pk_test_`
   - **Secret key**: Starts with `sk_test_`

### 2. Get Your Test Webhook Secret

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click on your webhook endpoint (or create one pointing to `http://localhost:3000/api/webhooks/stripe`)
3. Click "Reveal" under "Signing secret"
4. Copy the secret (starts with `whsec_`)

### 3. Update Your `.env.local`

Replace the LIVE keys with TEST keys:

```bash
# Stripe Payment Configuration (TEST MODE)
STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_TEST_KEY_HERE"
STRIPE_SECRET_KEY="sk_test_YOUR_TEST_SECRET_HERE"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_TEST_WEBHOOK_SECRET"
```

## Testing Payments

With test mode enabled, you can use these test card numbers:

### Successful Payments
```
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

### Test Specific Scenarios
```
# Requires authentication
Card: 4000 0027 6000 3184

# Declined card
Card: 4000 0000 0000 0002

# Insufficient funds
Card: 4000 0000 0000 9995
```

See [Stripe Testing](https://stripe.com/docs/testing) for more test cards.

## Production Setup

### When You're Ready to Go Live:

1. **Switch to Live Mode** in Stripe Dashboard
2. **Get Live Keys** from [Live API Keys](https://dashboard.stripe.com/apikeys)
3. **Set up Live Webhook** pointing to your production URL:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```
4. **Update Production Environment Variables**:
   ```bash
   STRIPE_PUBLISHABLE_KEY="pk_live_..."
   STRIPE_SECRET_KEY="sk_live_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."  # From live webhook
   ```

## Webhook Events to Listen For

Your app currently handles these Stripe webhooks:

- `checkout.session.completed` - Checkout completed
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription canceled
- `invoice.paid` - Invoice payment succeeded
- `invoice.payment_failed` - Invoice payment failed (sends email)
- `payment_intent.succeeded` - One-time payment succeeded

## Stripe Dashboard Quick Links

### Test Mode
- [API Keys](https://dashboard.stripe.com/test/apikeys)
- [Webhooks](https://dashboard.stripe.com/test/webhooks)
- [Customers](https://dashboard.stripe.com/test/customers)
- [Subscriptions](https://dashboard.stripe.com/test/subscriptions)
- [Products](https://dashboard.stripe.com/test/products)

### Live Mode
- [API Keys](https://dashboard.stripe.com/apikeys)
- [Webhooks](https://dashboard.stripe.com/webhooks)
- [Customers](https://dashboard.stripe.com/customers)
- [Subscriptions](https://dashboard.stripe.com/subscriptions)
- [Products](https://dashboard.stripe.com/products)

## Security Best Practices

1. **Never commit API keys** to git (already in `.gitignore`)
2. **Use test keys** for all development
3. **Rotate keys** if accidentally exposed
4. **Use webhook secrets** to verify webhook authenticity
5. **Monitor Stripe logs** for suspicious activity

## Troubleshooting

### Webhook not working locally?
Use the [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Getting "Invalid API Key" errors?
- Check you're using the right mode (test vs live)
- Ensure keys match the Stripe dashboard mode
- Verify no extra spaces in `.env.local`

### Payment succeeded but subscription not created?
- Check webhook endpoint is configured correctly
- Verify webhook secret matches
- Check application logs for errors

## Need Help?

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com/)
- [Stripe Discord](https://stripe.com/go/developer-chat)
