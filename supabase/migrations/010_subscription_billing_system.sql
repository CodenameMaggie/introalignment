-- ============================================
-- SUBSCRIPTION & BILLING SYSTEM
-- ============================================

-- Subscription plans
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Plan info
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,

    -- Pricing
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',

    -- Stripe IDs
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),
    stripe_product_id VARCHAR(255),

    -- Features/Limits
    introductions_per_month INT DEFAULT 0,
    can_message BOOLEAN DEFAULT FALSE,
    can_see_compatibility_score BOOLEAN DEFAULT FALSE,
    can_see_detailed_report BOOLEAN DEFAULT FALSE,
    priority_matching BOOLEAN DEFAULT FALSE,
    human_review BOOLEAN DEFAULT FALSE,
    concierge_service BOOLEAN DEFAULT FALSE,

    -- Display
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    badge_text VARCHAR(50),

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    plan_id UUID REFERENCES subscription_plans(id),

    -- Stripe data
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),

    -- Status
    status VARCHAR(50) DEFAULT 'active',

    -- Billing cycle
    billing_interval VARCHAR(20) DEFAULT 'month',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,

    -- Trial
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,

    -- Cancellation
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    cancellation_reason TEXT,

    -- Usage this period
    introductions_used INT DEFAULT 0,
    introductions_remaining INT,

    -- History
    lifetime_value DECIMAL(10,2) DEFAULT 0,
    months_subscribed INT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One-time products (add-ons)
CREATE TABLE one_time_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,

    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    stripe_price_id VARCHAR(255),
    stripe_product_id VARCHAR(255),

    -- What it provides
    product_type VARCHAR(50) NOT NULL,
    quantity INT DEFAULT 1,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase history
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- What was purchased
    purchase_type VARCHAR(50) NOT NULL,
    plan_id UUID REFERENCES subscription_plans(id),
    product_id UUID REFERENCES one_time_products(id),

    -- Stripe data
    stripe_payment_intent_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),

    -- Amount
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Status
    status VARCHAR(50) DEFAULT 'pending',

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment methods
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    stripe_payment_method_id VARCHAR(255) NOT NULL,

    -- Card info (from Stripe)
    card_brand VARCHAR(50),
    card_last4 VARCHAR(4),
    card_exp_month INT,
    card_exp_year INT,

    is_default BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices (synced from Stripe)
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id),

    stripe_invoice_id VARCHAR(255) NOT NULL UNIQUE,

    -- Invoice details
    amount_due DECIMAL(10,2),
    amount_paid DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',

    status VARCHAR(50),

    invoice_pdf_url TEXT,
    hosted_invoice_url TEXT,

    -- Dates
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Introduction credits (can be from subscription or purchase)
CREATE TABLE introduction_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Source
    source_type VARCHAR(50) NOT NULL,
    source_id UUID,

    -- Credits
    credits_added INT NOT NULL,
    credits_used INT DEFAULT 0,
    credits_remaining INT NOT NULL,

    -- Expiration
    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promo codes / Coupons
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(50) NOT NULL UNIQUE,

    -- Discount
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,

    -- Applies to
    applies_to VARCHAR(50) DEFAULT 'all',
    plan_ids JSONB DEFAULT '[]',

    -- Limits
    max_uses INT,
    times_used INT DEFAULT 0,
    max_uses_per_user INT DEFAULT 1,

    -- Validity
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,

    -- Stripe
    stripe_coupon_id VARCHAR(255),

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promo code usage
CREATE TABLE promo_code_uses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_code_id UUID REFERENCES promo_codes(id),
    user_id UUID REFERENCES users(id),

    discount_applied DECIMAL(10,2),

    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_subscriptions_stripe ON user_subscriptions(stripe_subscription_id);
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_credits_user ON introduction_credits(user_id);
CREATE INDEX idx_promo_codes_code ON promo_codes(code);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_time_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE introduction_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;

-- Everyone can view plans and products
CREATE POLICY "Anyone can view active plans"
    ON subscription_plans FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Anyone can view active products"
    ON one_time_products FOR SELECT
    USING (is_active = TRUE);

-- Users can view their own subscription data
CREATE POLICY "Users can view own subscription"
    ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own purchases"
    ON purchases FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own invoices"
    ON invoices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own credits"
    ON introduction_credits FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can do everything (for webhooks)
CREATE POLICY "Service role full access subscriptions"
    ON user_subscriptions FOR ALL
    USING (true);

CREATE POLICY "Service role full access purchases"
    ON purchases FOR ALL
    USING (true);

CREATE POLICY "Service role full access invoices"
    ON invoices FOR ALL
    USING (true);

CREATE POLICY "Service role full access credits"
    ON introduction_credits FOR ALL
    USING (true);

-- Add subscription fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active';
