/**
 * IC MARKETPLACE — THE SOVEREIGN TRADE NETWORK
 * =============================================
 * 
 * Whop-model marketplace for IntroConnected members:
 *   - Members list products/services for trade
 *   - Referral credits on every connection
 *   - Sub-accounts per business category
 *   - Transaction tracking + DAVE revenue integration
 * 
 * RUN ON: Forbes Command (5.78.139.9)
 * FILE:   /root/mfs/api/ic-marketplace.js
 * ROUTE:  /api/ic-marketplace
 * DB:     IC Supabase (IC_SUPABASE_URL)
 */

require('dotenv').config({ path: '/root/mfs/.env' });
const { createClient } = require('@supabase/supabase-js');

// IC Supabase — or fall back to MFS with ic_ prefix
const db = process.env.IC_SUPABASE_URL
  ? createClient(process.env.IC_SUPABASE_URL, process.env.IC_SUPABASE_SERVICE_ROLE_KEY)
  : createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TABLE_PREFIX = process.env.IC_SUPABASE_URL ? '' : 'ic_';

// ─── TABLES (create if not exist via Supabase SQL) ───
const TABLES = {
  listings: TABLE_PREFIX + 'marketplace_listings',
  transactions: TABLE_PREFIX + 'marketplace_transactions',
  reviews: TABLE_PREFIX + 'marketplace_reviews',
  referral_credits: TABLE_PREFIX + 'referral_credits',
  categories: TABLE_PREFIX + 'marketplace_categories',
};

// ─── SEED CATEGORIES ───
const CATEGORIES = [
  { slug: 'farm-produce', name: 'Farm Produce', desc: 'Fresh fruits, vegetables, herbs, eggs, dairy', icon: '🌾', businesses: ['SH', 'IC'] },
  { slug: 'artisan-goods', name: 'Artisan Goods', desc: 'Handcrafted items, pottery, woodwork, textiles', icon: '🏺', businesses: ['IC', 'TH'] },
  { slug: 'heritage-seeds', name: 'Heritage Seeds & Plants', desc: 'Heirloom seeds, starter plants, heritage varieties', icon: '🌱', businesses: ['SH', 'IC'] },
  { slug: 'natural-fibers', name: 'Natural Fiber Goods', desc: 'Linen, wool, cotton clothing and textiles', icon: '🧵', businesses: ['FF', 'IC'] },
  { slug: 'preservation', name: 'Preserved Foods', desc: 'Fermented, canned, dried, smoked goods', icon: '🫙', businesses: ['SH', 'IC'] },
  { slug: 'timber-craft', name: 'Timber & Woodcraft', desc: 'Furniture, tools, building materials, timber frames', icon: '🪵', businesses: ['TH', 'IC'] },
  { slug: 'culinary-services', name: 'Culinary Services', desc: 'Private chef, meal prep, catering, cooking classes', icon: '👨‍🍳', businesses: ['YPEC', 'SH'] },
  { slug: 'homestead-services', name: 'Homestead Services', desc: 'Land assessment, building plans, off-grid setup', icon: '🏡', businesses: ['TH', 'IC'] },
  { slug: 'legal-services', name: 'Legal & Trust Services', desc: 'Dynasty trusts, entity architecture, asset protection', icon: '⚖️', businesses: ['IA'] },
  { slug: 'education', name: 'Courses & Education', desc: 'Workshops, mentorship, skill-sharing', icon: '📚', businesses: ['MFS', 'IC', 'SH', 'TH'] },
  { slug: 'livestock', name: 'Heritage Livestock', desc: 'Jersey cows, Hereford cattle, heritage poultry', icon: '🐄', businesses: ['TH', 'IC'] },
  { slug: 'apothecary', name: 'Apothecary & Wellness', desc: 'Herbal remedies, natural soaps, tinctures, salves', icon: '🌿', businesses: ['SH', 'IC'] },
];

// ─── HANDLERS ───

async function listListings(req, res) {
  const { category, member_id, status, page = 1, limit = 20 } = req.query;
  let query = db.from(TABLES.listings).select('*', { count: 'exact' });
  
  if (category) query = query.eq('category', category);
  if (member_id) query = query.eq('member_id', member_id);
  if (status) query = query.eq('status', status);
  else query = query.eq('status', 'active');
  
  query = query.order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  
  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  
  return res.json({
    listings: data,
    total: count,
    page: parseInt(page),
    pages: Math.ceil(count / limit)
  });
}

async function createListing(req, res) {
  const { member_id, title, description, category, price, price_type, images, trade_for } = req.body;
  
  if (!member_id || !title || !category) {
    return res.status(400).json({ error: 'member_id, title, and category required' });
  }
  
  // Validate category
  const validCat = CATEGORIES.find(c => c.slug === category);
  if (!validCat) {
    return res.status(400).json({ error: 'Invalid category', valid: CATEGORIES.map(c => c.slug) });
  }
  
  const listing = {
    member_id,
    title,
    description: description || '',
    category,
    price: price || 0,
    price_type: price_type || 'fixed',  // fixed, negotiable, trade, free
    images: images || [],
    trade_for: trade_for || null,        // What they'll accept in trade
    status: 'active',
    views: 0,
    inquiries: 0,
    connected_businesses: validCat.businesses,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  const { data, error } = await db.from(TABLES.listings).insert(listing).select().single();
  if (error) return res.status(500).json({ error: error.message });
  
  // Cross-sell: if category maps to another business, create lead
  if (validCat.businesses.length > 1) {
    const crossBiz = validCat.businesses.filter(b => b !== 'IC');
    if (crossBiz.length > 0) {
      console.log(`[IC-MARKETPLACE] Cross-sell opportunity: ${title} → ${crossBiz.join(', ')}`);
      // Route to MIRA for cross-business intelligence
      try {
        const mfs = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        await mfs.from('mira_memory').insert({
          type: 'cross_sell',
          source: 'ic_marketplace',
          content: `New IC listing "${title}" in ${category} — opportunity for ${crossBiz.join(', ')}`,
          metadata: { listing_id: data.id, member_id, category, businesses: crossBiz },
          created_at: new Date().toISOString()
        });
      } catch (e) { console.warn('[IC-MARKETPLACE] MIRA log failed:', e.message); }
    }
  }
  
  return res.json({ success: true, listing: data });
}

async function createTransaction(req, res) {
  const { listing_id, buyer_id, seller_id, amount, type, referrer_id } = req.body;
  
  if (!listing_id || !buyer_id || !seller_id) {
    return res.status(400).json({ error: 'listing_id, buyer_id, seller_id required' });
  }
  
  const transaction = {
    listing_id,
    buyer_id,
    seller_id,
    amount: amount || 0,
    type: type || 'purchase',  // purchase, trade, referral
    status: 'pending',        // pending, completed, disputed, cancelled
    referrer_id: referrer_id || null,
    platform_fee: amount ? Math.round(amount * 0.05 * 100) / 100 : 0,  // 5% platform fee
    referral_credit: referrer_id && amount ? Math.round(amount * 0.02 * 100) / 100 : 0,  // 2% referral
    created_at: new Date().toISOString(),
  };
  
  const { data, error } = await db.from(TABLES.transactions).insert(transaction).select().single();
  if (error) return res.status(500).json({ error: error.message });
  
  // Update listing inquiry count
  await db.from(TABLES.listings).update({ 
    inquiries: db.raw ? undefined : 1,  // Increment handled separately
    updated_at: new Date().toISOString() 
  }).eq('id', listing_id);
  
  // Award referral credit
  if (referrer_id && transaction.referral_credit > 0) {
    await db.from(TABLES.referral_credits).insert({
      member_id: referrer_id,
      transaction_id: data.id,
      amount: transaction.referral_credit,
      status: 'pending',
      created_at: new Date().toISOString()
    });
  }
  
  // Log to DAVE for revenue tracking
  try {
    const mfs = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    await mfs.from('mira_memory').insert({
      type: 'revenue',
      source: 'ic_marketplace',
      content: `Transaction: $${amount} (fee: $${transaction.platform_fee}). Buyer: ${buyer_id}, Seller: ${seller_id}`,
      metadata: { transaction_id: data.id, amount, fee: transaction.platform_fee },
      created_at: new Date().toISOString()
    });
  } catch (e) { console.warn('[IC-MARKETPLACE] DAVE log failed:', e.message); }
  
  return res.json({ success: true, transaction: data });
}

async function getMemberDashboard(req, res) {
  const { member_id } = req.query;
  if (!member_id) return res.status(400).json({ error: 'member_id required' });
  
  // Get their listings
  const { data: listings } = await db.from(TABLES.listings)
    .select('*').eq('member_id', member_id).order('created_at', { ascending: false });
  
  // Get their transactions (as buyer or seller)
  const { data: bought } = await db.from(TABLES.transactions)
    .select('*').eq('buyer_id', member_id);
  const { data: sold } = await db.from(TABLES.transactions)
    .select('*').eq('seller_id', member_id);
  
  // Get referral credits
  const { data: credits } = await db.from(TABLES.referral_credits)
    .select('*').eq('member_id', member_id);
  
  const totalCredits = (credits || []).reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalSales = (sold || []).filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.amount || 0), 0);
  
  return res.json({
    member_id,
    listings: listings || [],
    active_listings: (listings || []).filter(l => l.status === 'active').length,
    purchases: bought || [],
    sales: sold || [],
    referral_credits: totalCredits,
    total_sales: totalSales,
    stats: {
      total_listings: (listings || []).length,
      total_transactions: (bought || []).length + (sold || []).length,
      total_views: (listings || []).reduce((sum, l) => sum + (l.views || 0), 0),
    }
  });
}

async function getMarketplaceStats(req, res) {
  const { data: listings } = await db.from(TABLES.listings).select('*', { count: 'exact' });
  const { data: transactions } = await db.from(TABLES.transactions).select('*', { count: 'exact' });
  
  const activeListings = (listings || []).filter(l => l.status === 'active');
  const completedTx = (transactions || []).filter(t => t.status === 'completed');
  const totalVolume = completedTx.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalFees = completedTx.reduce((sum, t) => sum + (t.platform_fee || 0), 0);
  
  // Category breakdown
  const catCounts = {};
  for (const l of activeListings) {
    catCounts[l.category] = (catCounts[l.category] || 0) + 1;
  }
  
  return res.json({
    marketplace: 'IC Sovereign Trade Network',
    stats: {
      total_listings: (listings || []).length,
      active_listings: activeListings.length,
      total_transactions: (transactions || []).length,
      completed_transactions: completedTx.length,
      total_volume: totalVolume,
      platform_revenue: totalFees,
      categories: catCounts,
    },
    categories: CATEGORIES,
    fee_structure: {
      platform_fee: '5%',
      referral_credit: '2% to referrer',
      listing_fee: 'Free for members',
    }
  });
}

async function searchListings(req, res) {
  const { q, category, min_price, max_price, price_type, limit = 20 } = req.query;
  
  let query = db.from(TABLES.listings).select('*').eq('status', 'active');
  
  if (category) query = query.eq('category', category);
  if (price_type) query = query.eq('price_type', price_type);
  if (min_price) query = query.gte('price', parseFloat(min_price));
  if (max_price) query = query.lte('price', parseFloat(max_price));
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  
  query = query.order('created_at', { ascending: false }).limit(parseInt(limit));
  
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  
  return res.json({ results: data, query: q, total: (data || []).length });
}

// ─── SUPABASE TABLE CREATION SQL ───
function getSetupSQL() {
  const prefix = TABLE_PREFIX;
  return `
-- IC MARKETPLACE TABLES
-- Run this in Supabase SQL Editor for IC database

CREATE TABLE IF NOT EXISTS ${prefix}marketplace_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  price_type TEXT DEFAULT 'fixed' CHECK (price_type IN ('fixed','negotiable','trade','free')),
  images JSONB DEFAULT '[]',
  trade_for TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','sold','paused','expired')),
  views INTEGER DEFAULT 0,
  inquiries INTEGER DEFAULT 0,
  connected_businesses TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ${prefix}marketplace_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES ${prefix}marketplace_listings(id),
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  amount DECIMAL(10,2) DEFAULT 0,
  type TEXT DEFAULT 'purchase' CHECK (type IN ('purchase','trade','referral')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','disputed','cancelled')),
  referrer_id UUID,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  referral_credit DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ${prefix}marketplace_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES ${prefix}marketplace_transactions(id),
  reviewer_id UUID NOT NULL,
  reviewed_id UUID NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ${prefix}referral_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL,
  transaction_id UUID,
  amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ${prefix}marketplace_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  businesses TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_listings_category ON ${prefix}marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_member ON ${prefix}marketplace_listings(member_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON ${prefix}marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_tx_buyer ON ${prefix}marketplace_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_tx_seller ON ${prefix}marketplace_transactions(seller_id);

-- Seed categories
INSERT INTO ${prefix}marketplace_categories (slug, name, description, icon, businesses)
VALUES 
  ('farm-produce', 'Farm Produce', 'Fresh fruits, vegetables, herbs, eggs, dairy', '🌾', '{SH,IC}'),
  ('artisan-goods', 'Artisan Goods', 'Handcrafted items, pottery, woodwork, textiles', '🏺', '{IC,TH}'),
  ('heritage-seeds', 'Heritage Seeds & Plants', 'Heirloom seeds, starter plants, heritage varieties', '🌱', '{SH,IC}'),
  ('natural-fibers', 'Natural Fiber Goods', 'Linen, wool, cotton clothing and textiles', '🧵', '{FF,IC}'),
  ('preservation', 'Preserved Foods', 'Fermented, canned, dried, smoked goods', '🫙', '{SH,IC}'),
  ('timber-craft', 'Timber & Woodcraft', 'Furniture, tools, building materials, timber frames', '🪵', '{TH,IC}'),
  ('culinary-services', 'Culinary Services', 'Private chef, meal prep, catering, cooking classes', '👨‍🍳', '{YPEC,SH}'),
  ('homestead-services', 'Homestead Services', 'Land assessment, building plans, off-grid setup', '🏡', '{TH,IC}'),
  ('legal-services', 'Legal & Trust Services', 'Dynasty trusts, entity architecture, asset protection', '⚖️', '{IA}'),
  ('education', 'Courses & Education', 'Workshops, mentorship, skill-sharing', '📚', '{MFS,IC,SH,TH}'),
  ('livestock', 'Heritage Livestock', 'Jersey cows, Hereford cattle, heritage poultry', '🐄', '{TH,IC}'),
  ('apothecary', 'Apothecary & Wellness', 'Herbal remedies, natural soaps, tinctures, salves', '🌿', '{SH,IC}')
ON CONFLICT (slug) DO NOTHING;
`;
}

// ─── ROUTER ───
module.exports = async (req, res) => {
  const action = req.query.action || req.body?.action;
  
  try {
    switch (action) {
      case 'listings':       return await listListings(req, res);
      case 'create-listing': return await createListing(req, res);
      case 'search':         return await searchListings(req, res);
      case 'transaction':    return await createTransaction(req, res);
      case 'dashboard':      return await getMemberDashboard(req, res);
      case 'stats':          return await getMarketplaceStats(req, res);
      case 'categories':     return res.json({ categories: CATEGORIES });
      case 'setup-sql':      return res.json({ sql: getSetupSQL() });
      case 'status':
        return res.json({
          marketplace: 'IC Sovereign Trade Network',
          version: '1.0',
          categories: CATEGORIES.length,
          fee: '5% platform + 2% referral',
          actions: ['listings', 'create-listing', 'search', 'transaction', 'dashboard', 'stats', 'categories', 'setup-sql'],
        });
      default:
        return res.json({
          marketplace: 'IC Sovereign Trade Network',
          description: 'Trade community marketplace for IntroConnected members',
          actions: ['listings', 'create-listing', 'search', 'transaction', 'dashboard', 'stats', 'categories', 'setup-sql', 'status'],
        });
    }
  } catch (e) {
    console.error('[IC-MARKETPLACE] Error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
