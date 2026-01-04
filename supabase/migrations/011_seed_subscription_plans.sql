-- ============================================
-- SEED SUBSCRIPTION PLANS & PRODUCTS
-- ============================================

-- Insert subscription plans
INSERT INTO subscription_plans (
    name, slug, description,
    price_monthly, price_yearly,
    introductions_per_month, can_message, can_see_compatibility_score,
    can_see_detailed_report, priority_matching, human_review, concierge_service,
    is_featured, display_order, badge_text
) VALUES

('Free', 'free',
'Build your profile and explore the platform',
0, 0,
0, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE,
FALSE, 1, NULL),

('Seeker', 'seeker',
'Start meeting aligned matches',
49.00, 470.00,
2, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE,
FALSE, 2, NULL),

('Aligned', 'aligned',
'Our most popular plan for serious seekers',
149.00, 1430.00,
5, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE,
TRUE, 3, 'Most Popular'),

('Founder', 'founder',
'Premium concierge matchmaking experience',
499.00, 4790.00,
-1, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE,
FALSE, 4, 'Premium');

-- Insert one-time products
INSERT INTO one_time_products (name, slug, description, price, product_type, quantity) VALUES

('Extra Introduction', 'extra-intro',
'One additional introduction to a matched member',
29.00, 'introduction', 1),

('3-Pack Introductions', 'intro-3-pack',
'Three additional introductions at a discount',
69.00, 'introduction', 3),

('Compatibility Deep Dive', 'compatibility-report',
'Detailed 10-page compatibility analysis for any match',
19.00, 'report', 1),

('Profile Review', 'profile-review',
'Professional review and optimization of your profile by our team',
99.00, 'review', 1);
