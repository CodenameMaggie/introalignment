-- Add Attorney Premium Plan to subscription_plans table

-- Ensure subscription_plans table exists
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB DEFAULT '[]',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Attorney Premium Plan
INSERT INTO subscription_plans (
  name,
  slug,
  description,
  price_monthly,
  price_yearly,
  stripe_price_id_monthly,
  stripe_price_id_yearly,
  features,
  is_featured,
  is_active
) VALUES (
  'Attorney Premium',
  'attorney-premium',
  'For attorneys ready to grow their practice',
  197.00,
  1970.00,
  'price_attorney_premium_monthly', -- Replace with actual Stripe price ID after creation
  'price_attorney_premium_yearly',  -- Replace with actual Stripe price ID after creation
  '[
    "Featured placement in directory",
    "Priority podcast booking",
    "Direct client inquiry routing",
    "Enhanced profile with video & portfolio",
    "Analytics dashboard (views, inquiries)",
    "Full community forum participation",
    "Monthly performance reports",
    "Custom URL for your profile",
    "Remove Free Member badge",
    "Early access to new features"
  ]'::jsonb,
  true,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  is_featured = EXCLUDED.is_featured,
  updated_at = NOW();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

COMMENT ON TABLE subscription_plans IS 'Subscription plans for attorneys and clients';
COMMENT ON COLUMN subscription_plans.slug IS 'URL-friendly identifier for the plan';
COMMENT ON COLUMN subscription_plans.stripe_price_id_monthly IS 'Stripe price ID for monthly billing';
COMMENT ON COLUMN subscription_plans.stripe_price_id_yearly IS 'Stripe price ID for annual billing';
