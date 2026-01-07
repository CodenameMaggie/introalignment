const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let value = match[2].trim();
    // Remove surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[match[1].trim()] = value;
  }
});

const stripe = new Stripe(envVars.STRIPE_SECRET_KEY);

async function setupStripeProducts() {
  console.log('🚀 Setting up Stripe products...\n');

  const results = {
    subscriptions: [],
    oneTime: []
  };

  try {
    // ============================================
    // SUBSCRIPTION PRODUCTS
    // ============================================

    // 1. Seeker Plan
    console.log('Creating Seeker plan...');
    const seekerProduct = await stripe.products.create({
      name: 'Seeker',
      description: 'Start meeting aligned matches - 2 introductions per month',
      metadata: { plan_slug: 'seeker' }
    });

    const seekerMonthly = await stripe.prices.create({
      product: seekerProduct.id,
      unit_amount: 4900, // $49.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan_slug: 'seeker', billing_period: 'monthly' }
    });

    const seekerYearly = await stripe.prices.create({
      product: seekerProduct.id,
      unit_amount: 47000, // $470.00
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { plan_slug: 'seeker', billing_period: 'yearly' }
    });

    results.subscriptions.push({
      slug: 'seeker',
      name: 'Seeker',
      product_id: seekerProduct.id,
      price_monthly: seekerMonthly.id,
      price_yearly: seekerYearly.id
    });
    console.log('✅ Seeker created\n');

    // 2. Aligned Plan
    console.log('Creating Aligned plan...');
    const alignedProduct = await stripe.products.create({
      name: 'Aligned',
      description: 'Our most popular plan for serious seekers - 5 introductions per month',
      metadata: { plan_slug: 'aligned', is_featured: 'true' }
    });

    const alignedMonthly = await stripe.prices.create({
      product: alignedProduct.id,
      unit_amount: 14900, // $149.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan_slug: 'aligned', billing_period: 'monthly' }
    });

    const alignedYearly = await stripe.prices.create({
      product: alignedProduct.id,
      unit_amount: 143000, // $1,430.00
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { plan_slug: 'aligned', billing_period: 'yearly' }
    });

    results.subscriptions.push({
      slug: 'aligned',
      name: 'Aligned',
      product_id: alignedProduct.id,
      price_monthly: alignedMonthly.id,
      price_yearly: alignedYearly.id
    });
    console.log('✅ Aligned created\n');

    // 3. Founder Plan
    console.log('Creating Founder plan...');
    const founderProduct = await stripe.products.create({
      name: 'Founder',
      description: 'Premium concierge matchmaking experience - Unlimited introductions',
      metadata: { plan_slug: 'founder', is_premium: 'true' }
    });

    const founderMonthly = await stripe.prices.create({
      product: founderProduct.id,
      unit_amount: 49900, // $499.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan_slug: 'founder', billing_period: 'monthly' }
    });

    const founderYearly = await stripe.prices.create({
      product: founderProduct.id,
      unit_amount: 479000, // $4,790.00
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { plan_slug: 'founder', billing_period: 'yearly' }
    });

    results.subscriptions.push({
      slug: 'founder',
      name: 'Founder',
      product_id: founderProduct.id,
      price_monthly: founderMonthly.id,
      price_yearly: founderYearly.id
    });
    console.log('✅ Founder created\n');

    // ============================================
    // ONE-TIME PRODUCTS
    // ============================================

    // 4. Extra Introduction
    console.log('Creating Extra Introduction...');
    const extraIntroProduct = await stripe.products.create({
      name: 'Extra Introduction',
      description: 'One additional introduction to a matched member',
      metadata: { product_slug: 'extra-intro', product_type: 'introduction' }
    });

    const extraIntroPrice = await stripe.prices.create({
      product: extraIntroProduct.id,
      unit_amount: 2900, // $29.00
      currency: 'usd',
      metadata: { product_slug: 'extra-intro' }
    });

    results.oneTime.push({
      slug: 'extra-intro',
      name: 'Extra Introduction',
      product_id: extraIntroProduct.id,
      price_id: extraIntroPrice.id
    });
    console.log('✅ Extra Introduction created\n');

    // 5. 3-Pack Introductions
    console.log('Creating 3-Pack Introductions...');
    const intro3PackProduct = await stripe.products.create({
      name: '3-Pack Introductions',
      description: 'Three additional introductions at a discount',
      metadata: { product_slug: 'intro-3-pack', product_type: 'introduction', quantity: '3' }
    });

    const intro3PackPrice = await stripe.prices.create({
      product: intro3PackProduct.id,
      unit_amount: 6900, // $69.00
      currency: 'usd',
      metadata: { product_slug: 'intro-3-pack' }
    });

    results.oneTime.push({
      slug: 'intro-3-pack',
      name: '3-Pack Introductions',
      product_id: intro3PackProduct.id,
      price_id: intro3PackPrice.id
    });
    console.log('✅ 3-Pack Introductions created\n');

    // 6. Compatibility Deep Dive
    console.log('Creating Compatibility Deep Dive...');
    const compatibilityProduct = await stripe.products.create({
      name: 'Compatibility Deep Dive',
      description: 'Detailed 10-page compatibility analysis for any match',
      metadata: { product_slug: 'compatibility-report', product_type: 'report' }
    });

    const compatibilityPrice = await stripe.prices.create({
      product: compatibilityProduct.id,
      unit_amount: 1900, // $19.00
      currency: 'usd',
      metadata: { product_slug: 'compatibility-report' }
    });

    results.oneTime.push({
      slug: 'compatibility-report',
      name: 'Compatibility Deep Dive',
      product_id: compatibilityProduct.id,
      price_id: compatibilityPrice.id
    });
    console.log('✅ Compatibility Deep Dive created\n');

    // 7. Profile Review
    console.log('Creating Profile Review...');
    const profileReviewProduct = await stripe.products.create({
      name: 'Profile Review',
      description: 'Professional review and optimization of your profile by our team',
      metadata: { product_slug: 'profile-review', product_type: 'review' }
    });

    const profileReviewPrice = await stripe.prices.create({
      product: profileReviewProduct.id,
      unit_amount: 9900, // $99.00
      currency: 'usd',
      metadata: { product_slug: 'profile-review' }
    });

    results.oneTime.push({
      slug: 'profile-review',
      name: 'Profile Review',
      product_id: profileReviewProduct.id,
      price_id: profileReviewPrice.id
    });
    console.log('✅ Profile Review created\n');

    // ============================================
    // OUTPUT RESULTS
    // ============================================

    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL PRODUCTS CREATED SUCCESSFULLY!');
    console.log('='.repeat(60) + '\n');

    console.log('📋 SUBSCRIPTION PLANS:\n');
    results.subscriptions.forEach(plan => {
      console.log(`${plan.name} (${plan.slug}):`);
      console.log(`  Product ID: ${plan.product_id}`);
      console.log(`  Monthly Price ID: ${plan.price_monthly}`);
      console.log(`  Yearly Price ID: ${plan.price_yearly}\n`);
    });

    console.log('📋 ONE-TIME PRODUCTS:\n');
    results.oneTime.forEach(product => {
      console.log(`${product.name} (${product.slug}):`);
      console.log(`  Product ID: ${product.product_id}`);
      console.log(`  Price ID: ${product.price_id}\n`);
    });

    console.log('='.repeat(60));
    console.log('📝 NEXT STEPS:');
    console.log('='.repeat(60));
    console.log('1. Copy the SQL below and run in Supabase SQL Editor');
    console.log('2. Or run: node scripts/update-database-stripe-ids.js\n');

    // Generate SQL
    console.log('-- Update subscription plans with Stripe IDs\n');
    results.subscriptions.forEach(plan => {
      console.log(`UPDATE subscription_plans SET`);
      console.log(`  stripe_product_id = '${plan.product_id}',`);
      console.log(`  stripe_price_id_monthly = '${plan.price_monthly}',`);
      console.log(`  stripe_price_id_yearly = '${plan.price_yearly}'`);
      console.log(`WHERE slug = '${plan.slug}';\n`);
    });

    console.log('-- Update one-time products with Stripe IDs\n');
    results.oneTime.forEach(product => {
      console.log(`UPDATE one_time_products SET`);
      console.log(`  stripe_product_id = '${product.product_id}',`);
      console.log(`  stripe_price_id = '${product.price_id}'`);
      console.log(`WHERE slug = '${product.slug}';\n`);
    });

    // Save results to file for database update script
    fs.writeFileSync(
      'scripts/stripe-product-ids.json',
      JSON.stringify(results, null, 2)
    );
    console.log('✅ Product IDs saved to scripts/stripe-product-ids.json\n');

    return results;

  } catch (error) {
    console.error('❌ Error creating products:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n⚠️  Check your STRIPE_SECRET_KEY in .env.local');
    }
    throw error;
  }
}

// Run the setup
setupStripeProducts()
  .then(() => {
    console.log('✅ Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
