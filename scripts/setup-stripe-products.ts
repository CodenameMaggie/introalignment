import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function setupStripeProducts() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const supabase = getSupabase();
  console.log('Setting up Stripe products...\n');

  // Get all plans (except free)
  const { data: plans, error: plansError } = await supabase
    .from('subscription_plans')
    .select('*')
    .neq('slug', 'free');

  if (plansError) {
    console.error('Error fetching plans:', plansError);
    return;
  }

  console.log(`Found ${plans?.length || 0} subscription plans\n`);

  for (const plan of plans || []) {
    console.log(`Creating Stripe product for: ${plan.name}`);

    try {
      // Create Stripe product
      const product = await stripe.products.create({
        name: `SovereigntyIntroAlignment ${plan.name}`,
        description: plan.description,
        metadata: {
          plan_id: plan.id,
          plan_slug: plan.slug
        }
      });

      console.log(`  ✓ Created product: ${product.id}`);

      // Create monthly price
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(plan.price_monthly * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        metadata: {
          plan_id: plan.id,
          interval: 'month'
        }
      });

      console.log(`  ✓ Created monthly price: ${monthlyPrice.id} ($${plan.price_monthly}/mo)`);

      // Create yearly price if available
      let yearlyPrice = null;
      if (plan.price_yearly) {
        yearlyPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(plan.price_yearly * 100),
          currency: 'usd',
          recurring: {
            interval: 'year'
          },
          metadata: {
            plan_id: plan.id,
            interval: 'year'
          }
        });

        console.log(`  ✓ Created yearly price: ${yearlyPrice.id} ($${plan.price_yearly}/yr)`);
      }

      // Update database with Stripe IDs
      const { error: updateError } = await supabase
        .from('subscription_plans')
        .update({
          stripe_product_id: product.id,
          stripe_price_id_monthly: monthlyPrice.id,
          stripe_price_id_yearly: yearlyPrice?.id || null
        })
        .eq('id', plan.id);

      if (updateError) {
        console.error(`  ✗ Error updating database:`, updateError);
      } else {
        console.log(`  ✓ Updated database with Stripe IDs\n`);
      }
    } catch (error: any) {
      console.error(`  ✗ Error creating Stripe product for ${plan.name}:`, error.message, '\n');
    }
  }

  // One-time products
  const { data: products, error: productsError } = await supabase
    .from('one_time_products')
    .select('*');

  if (productsError) {
    console.error('Error fetching products:', productsError);
    return;
  }

  console.log(`\nFound ${products?.length || 0} one-time products\n`);

  for (const product of products || []) {
    console.log(`Creating Stripe product for: ${product.name}`);

    try {
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
        metadata: {
          product_id: product.id,
          product_slug: product.slug,
          product_type: product.product_type
        }
      });

      console.log(`  ✓ Created product: ${stripeProduct.id}`);

      const price = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: Math.round(product.price * 100),
        currency: 'usd',
        metadata: {
          product_id: product.id
        }
      });

      console.log(`  ✓ Created price: ${price.id} ($${product.price})`);

      const { error: updateError } = await supabase
        .from('one_time_products')
        .update({
          stripe_product_id: stripeProduct.id,
          stripe_price_id: price.id
        })
        .eq('id', product.id);

      if (updateError) {
        console.error(`  ✗ Error updating database:`, updateError);
      } else {
        console.log(`  ✓ Updated database with Stripe IDs\n`);
      }
    } catch (error: any) {
      console.error(`  ✗ Error creating Stripe product for ${product.name}:`, error.message, '\n');
    }
  }

  console.log('✅ Stripe setup complete!');
}

setupStripeProducts().catch(console.error);
