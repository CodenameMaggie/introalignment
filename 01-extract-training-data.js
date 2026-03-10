#!/usr/bin/env node
/**
 * SOVEREIGN ECONOMY — TRAINING DATA EXTRACTOR
 * 
 * Pulls ALL business data from Supabase and formats as instruction-tuning pairs
 * for LoRA fine-tuning of qwen3:8b on the A4000 GPU.
 * 
 * Output: /root/mfs/data/training/sovereign-training-data.jsonl
 * Format: Alpaca-style instruction/input/output JSONL
 * 
 * RUN ON: Forbes Command (5.78.139.9)
 * REQUIRES: Supabase credentials in /root/mfs/.env
 */

require('dotenv').config({ path: '/root/mfs/.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ─── SUPABASE CONNECTIONS ───
const dbs = {
  mfs: createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY),
  ic: process.env.IC_SUPABASE_URL ? createClient(process.env.IC_SUPABASE_URL, process.env.IC_SUPABASE_SERVICE_ROLE_KEY) : null,
  ia: process.env.IA_SUPABASE_URL ? createClient(process.env.IA_SUPABASE_URL, process.env.IA_SUPABASE_SERVICE_ROLE_KEY) : null,
  ff: process.env.FF_SUPABASE_URL ? createClient(process.env.FF_SUPABASE_URL, process.env.FF_SUPABASE_SERVICE_ROLE_KEY) : null,
  ypec: process.env.YPEC_SUPABASE_URL ? createClient(process.env.YPEC_SUPABASE_URL, process.env.YPEC_SUPABASE_SERVICE_ROLE_KEY) : null,
};

const OUTPUT_DIR = '/root/mfs/data/training';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'sovereign-training-data.jsonl');

// ─── HELPERS ───
function alpaca(instruction, input, output) {
  // Format for Unsloth/Alpaca-style training
  const text = input
    ? `<|im_start|>user\n${instruction}\n${input}<|im_end|>\n<|im_start|>assistant\n${output}<|im_end|>`
    : `<|im_start|>user\n${instruction}<|im_end|>\n<|im_start|>assistant\n${output}<|im_end|>`;
  return JSON.stringify({ text }) + '\n';
}

async function fetchAll(db, table) {
  // Bypass 1000-row cap
  let all = [];
  let from = 0;
  const batch = 1000;
  while (true) {
    const { data, error } = await db.from(table).select('*').range(from, from + batch - 1);
    if (error) { console.warn(`  ⚠ ${table}: ${error.message}`); break; }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < batch) break;
    from += batch;
  }
  return all;
}

// ─── DATA SOURCES ───

async function extractHeritageLibrary() {
  console.log('📚 Heritage Library...');
  const rows = await fetchAll(dbs.mfs, 'heritage_library');
  let pairs = '';
  for (const r of rows) {
    if (!r.title || !r.heritage_content) continue;
    const biz = r.business || 'SE';
    pairs += alpaca(
      `What heritage knowledge does The Sovereign Economy have about "${r.title}"?`,
      `Business: ${biz}, Category: ${r.category || 'general'}`,
      r.heritage_content.substring(0, 2000)
    );
    // Reverse Q&A — teach it to recommend heritage sources
    if (r.category) {
      pairs += alpaca(
        `Find heritage sources about ${r.category} for ${biz}.`,
        '',
        `"${r.title}" — ${(r.heritage_content || '').substring(0, 500)}`
      );
    }
  }
  console.log(`  ✅ ${rows.length} heritage entries`);
  return pairs;
}

async function extractLeads() {
  console.log('👥 Leads & Contacts...');
  const rows = await fetchAll(dbs.mfs, 'contacts');
  let pairs = '';
  // Aggregated stats for training
  const bizCounts = {};
  for (const r of rows) {
    const biz = r.business || r.source || 'unknown';
    bizCounts[biz] = (bizCounts[biz] || 0) + 1;
  }
  pairs += alpaca(
    'How many contacts does The Sovereign Economy have?',
    '',
    `The Sovereign Economy has ${rows.length} total contacts. Breakdown: ${Object.entries(bizCounts).map(([k, v]) => `${k}: ${v}`).join(', ')}.`
  );
  // Lead pipeline stats
  const leads = await fetchAll(dbs.mfs, 'leads');
  const statusCounts = {};
  for (const l of leads) {
    const s = l.status || 'unknown';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }
  pairs += alpaca(
    'What is the current lead pipeline status?',
    '',
    `There are ${leads.length} leads in the pipeline. Status breakdown: ${Object.entries(statusCounts).map(([k, v]) => `${k}: ${v}`).join(', ')}.`
  );
  console.log(`  ✅ ${rows.length} contacts, ${leads.length} leads`);
  return pairs;
}

async function extractBotKnowledge() {
  console.log('🤖 Bot Knowledge (brain_knowledge)...');
  const tables = ['brain_knowledge', 'bot_memory', 'ai_conversations', 'mira_memory'];
  let pairs = '';
  let total = 0;
  for (const table of tables) {
    try {
      const rows = await fetchAll(dbs.mfs, table);
      for (const r of rows) {
        const q = r.query || r.question || r.topic || r.key || '';
        const a = r.answer || r.value || r.response || r.content || '';
        if (q && a && typeof a === 'string' && a.length > 20) {
          pairs += alpaca(q, '', typeof a === 'string' ? a.substring(0, 2000) : JSON.stringify(a).substring(0, 2000));
          total++;
        }
      }
      console.log(`  ✅ ${table}: ${rows.length} rows`);
    } catch (e) {
      console.log(`  ⚠ ${table}: ${e.message}`);
    }
  }
  console.log(`  Total Q&A pairs from bot knowledge: ${total}`);
  return pairs;
}

async function extractEmailMetrics() {
  console.log('📧 Email Metrics...');
  try {
    const rows = await fetchAll(dbs.mfs, 'email_sends');
    const total = rows.length;
    const opened = rows.filter(r => r.opened_at || r.opens > 0).length;
    const clicked = rows.filter(r => r.clicked_at || r.clicks > 0).length;
    const openRate = total > 0 ? ((opened / total) * 100).toFixed(1) : 0;
    const clickRate = total > 0 ? ((clicked / total) * 100).toFixed(1) : 0;

    let pairs = '';
    pairs += alpaca(
      'What are our email performance metrics?',
      '',
      `We have sent ${total} emails. Open rate: ${openRate}%. Click rate: ${clickRate}%. ${opened} opened, ${clicked} clicked.`
    );
    console.log(`  ✅ ${total} email records`);
    return pairs;
  } catch (e) {
    console.log(`  ⚠ email_sends: ${e.message}`);
    return '';
  }
}

async function extractICMembers() {
  console.log('🤝 IC Members...');
  if (!dbs.ic) { console.log('  ⚠ IC Supabase not configured'); return ''; }
  try {
    const members = await fetchAll(dbs.ic, 'members');
    const chapters = await fetchAll(dbs.ic, 'chapters').catch(() => []);
    let pairs = '';
    pairs += alpaca(
      'How many IntroConnected members are there?',
      '',
      `IntroConnected has ${members.length} members across ${chapters.length || 12} chapters. Members include farmers, makers, heritage producers, and homesteaders who connect, trade, and refer each other.`
    );
    // Skills/trades for matching
    const trades = {};
    for (const m of members) {
      if (m.trade || m.skill || m.industry) {
        const t = m.trade || m.skill || m.industry;
        trades[t] = (trades[t] || 0) + 1;
      }
    }
    if (Object.keys(trades).length > 0) {
      pairs += alpaca(
        'What trades and skills are represented in IntroConnected?',
        '',
        `IC members represent these trades: ${Object.entries(trades).slice(0, 30).map(([k, v]) => `${k} (${v})`).join(', ')}.`
      );
    }
    console.log(`  ✅ ${members.length} members`);
    return pairs;
  } catch (e) {
    console.log(`  ⚠ IC: ${e.message}`);
    return '';
  }
}

async function extractIAPackages() {
  console.log('⚖️ IA Legal Packages...');
  if (!dbs.ia) { console.log('  ⚠ IA Supabase not configured'); return ''; }
  try {
    const packages = await fetchAll(dbs.ia, 'packages');
    const courses = await fetchAll(dbs.ia, 'courses');
    let pairs = '';
    if (packages.length > 0) {
      pairs += alpaca(
        'What legal architecture packages does IntroAlignment offer?',
        '',
        packages.map(p => `${p.name || p.title}: $${p.price || '?'} — ${(p.description || '').substring(0, 200)}`).join('\n')
      );
    }
    if (courses.length > 0) {
      pairs += alpaca(
        'What courses does IntroAlignment offer?',
        '',
        courses.map(c => `${c.title || c.name}: ${(c.description || '').substring(0, 200)}`).join('\n')
      );
    }
    console.log(`  ✅ ${packages.length} packages, ${courses.length} courses`);
    return pairs;
  } catch (e) {
    console.log(`  ⚠ IA: ${e.message}`);
    return '';
  }
}

async function extractFFProducts() {
  console.log('👗 FF Products...');
  if (!dbs.ff) { console.log('  ⚠ FF Supabase not configured'); return ''; }
  try {
    const products = await fetchAll(dbs.ff, 'products');
    let pairs = '';
    const fabrics = {};
    for (const p of products) {
      const f = p.fabric || p.material || 'unknown';
      fabrics[f] = (fabrics[f] || 0) + 1;
    }
    pairs += alpaca(
      'What products does Frequency & Form carry?',
      '',
      `FF has ${products.length} products. Fabric breakdown: ${Object.entries(fabrics).map(([k, v]) => `${k}: ${v}`).join(', ')}. All natural fibers — linen, wool, organic cotton. No synthetics.`
    );
    // Frequency science knowledge
    pairs += alpaca(
      'What is the frequency science behind Frequency & Form clothing?',
      '',
      'Based on Dr. Heidi Yellen\'s research: Linen vibrates at 5,000 Hz (healing/elevating — 50x human body frequency). Wool and cashmere also at 5,000 Hz. Organic cotton at 100 Hz (harmonizing — matches human body). Synthetics measure 0-15 Hz (depleting — same as diseased tissue). IMPORTANT: Linen and wool should never be worn together — their frequencies cancel to 0.'
    );
    console.log(`  ✅ ${products.length} products`);
    return pairs;
  } catch (e) {
    console.log(`  ⚠ FF: ${e.message}`);
    return '';
  }
}

async function extractSSData() {
  console.log('🎀 SS Sweet Seventeen...');
  try {
    // SS uses MFS Supabase with ss_ prefix
    const apps = await fetchAll(dbs.mfs, 'ss_applications');
    const sponsors = await fetchAll(dbs.mfs, 'ss_sponsors');
    let pairs = '';
    pairs += alpaca(
      'What is the Sweet Seventeen Debutante Ball?',
      '',
      `Sweet Seventeen is an annual values-forward rite of passage for young women, modeled on debutante traditions modernized for today. The inaugural ball is May 1, 2027 at the Fairmont Hotel Vancouver. Team: Elizabeth Burnett (etiquette trainer & co-host), Nargess Tabrizy (event planner & co-host, Fleur de Lis Events). Currently ${apps.length} applications and ${sponsors.length} sponsors.`
    );
    console.log(`  ✅ ${apps.length} applications, ${sponsors.length} sponsors`);
    return pairs;
  } catch (e) {
    console.log(`  ⚠ SS: ${e.message}`);
    return '';
  }
}

// ─── CORE BUSINESS KNOWLEDGE (hardcoded — the ground truth) ───
function coreBusinessKnowledge() {
  console.log('🏛️ Core Business Knowledge...');
  const pairs = [];

  // Each business profile
  const businesses = [
    {
      name: 'MFS - Maggie Forbes Strategies', domain: 'maggieforbesstrategies.com',
      tagline: 'The Sovereign Economy', role: 'Parent holding company + speaking platform',
      revenue: 'Speaking fees $15K-$50K per keynote, workshops $5K-$15K',
      target: 'Conference organizers, podcasters, business events, legacy-minded entrepreneurs'
    },
    {
      name: 'IC - IntroConnected', domain: 'introconnected.com',
      tagline: 'The inevitable connection', role: 'Trade community for modern producers/makers/farmers',
      revenue: 'Membership fees ($97-$197/mo) + transaction fees',
      target: 'Farmers, makers, heritage producers, homesteaders'
    },
    {
      name: 'IA - IntroAlignment', domain: 'introalignment.com',
      tagline: 'Legal Architecture for Sovereign Living', role: 'Dynasty trusts, asset protection, entity architecture',
      revenue: 'Assessment $500, dynasty trust $5K-$15K, asset protection $25K+',
      target: 'High net worth individuals, business owners protecting assets'
    },
    {
      name: 'FF - Frequency & Form', domain: 'frequencyandform.com',
      tagline: 'Dress in Alignment', role: 'Natural fiber clothing backed by frequency science',
      revenue: 'E-commerce + membership tiers ($9.99-$250/mo)',
      target: 'Health-conscious women 35-55 who value quality'
    },
    {
      name: 'SH - Steading Home', domain: 'steadinghome.com',
      tagline: 'Where tradition becomes the future of food', role: 'Heritage recipes, kitchen arts, food preservation',
      revenue: 'Content subscription + e-commerce',
      target: 'From-scratch cooks, health-conscious families'
    },
    {
      name: 'TH - Timber Homestead', domain: 'timberhomestead.com',
      tagline: 'Build the Dream from Scratch', role: 'Traditional carpentry, timber framing, off-grid systems',
      revenue: 'Courses, plans, guides, e-commerce',
      target: 'Off-grid builders, DIY homesteaders'
    },
    {
      name: 'YPEC - Your Private Estate Chef', domain: 'yourprivateestatechef.com',
      tagline: 'By Introduction Only', role: 'National private chef network',
      revenue: 'Placement fees + ongoing service fees',
      target: 'High net worth families seeking estate-level culinary services'
    },
    {
      name: 'SS - Sweet Seventeen', domain: 'sweetseventeendebutante.com',
      tagline: 'A values-forward rite of passage', role: 'Annual debutante ball + etiquette school',
      revenue: 'Event fees + sponsorships + etiquette program enrollment',
      target: 'Families with young women approaching adulthood'
    }
  ];

  for (const b of businesses) {
    pairs.push(alpaca(
      `Tell me about ${b.name}.`,
      '',
      `${b.name} (${b.domain}): "${b.tagline}". ${b.role}. Revenue model: ${b.revenue}. Target: ${b.target}.`
    ));
  }

  // C-Suite
  const csuite = [
    { name: 'MIRA', title: 'CEO', desc: 'Strategic coordination across all 8 businesses. Sees the whole chessboard.' },
    { name: 'HENRY', title: 'COO', desc: 'Operations, health checks, bot management. Steady and methodical.' },
    { name: 'DAVE', title: 'CFO', desc: 'Revenue tracking, finance, payments. Sharp, aggressive, zero waste tolerance.' },
    { name: 'DAN', title: 'CMO', desc: 'Marketing, content, campaigns. Creative, data-driven, heritage enthusiast.' },
    { name: 'JORDAN', title: 'CLO', desc: 'Legal, compliance, contracts. Authoritative, precise, protective.' },
    { name: 'ALEX', title: 'CTO', desc: 'Technical infrastructure. Methodical, reports what is running/broken/changed.' },
    { name: 'ANNIE', title: 'CSO', desc: 'Customer support, tickets. Warm, empathetic, resolves issues.' },
    { name: 'GRACE', title: 'Executive Secretary', desc: 'Seasonal themes, script writing, content scheduling. Sharp, capable, warm but direct.' },
  ];

  for (const c of csuite) {
    pairs.push(alpaca(
      `Who is ${c.name} in The Sovereign Economy?`,
      '',
      `${c.name} is the ${c.title} of The Sovereign Economy. ${c.desc}`
    ));
  }

  // Revenue targets
  pairs.push(alpaca(
    'What are the revenue targets for The Sovereign Economy?',
    '',
    'Year 1: $500K (BUILD AUDIENCE — current phase). Year 2: $2M (PROVE MODEL). Year 3: $10M (SCALE). Year 4: $30M (ACCELERATE). Year 5: $100M per business × 8 = $800M total. MFS speaking is the shortest path to first cash — 10 keynotes at $25K avg = $250K.'
  ));

  // Philosophy
  pairs.push(alpaca(
    'What is the philosophy of The Sovereign Economy?',
    '',
    'The traditions our society abandoned were not primitive — they were sophisticated. We bring them forward, adapt them for modern life, and prove they are the competitive advantage modern families and businesses are missing. This is not nostalgia. This is strategy. Heritage methods produce better food, stronger buildings, healthier clothing, deeper connections, and more resilient wealth.'
  ));

  // Flywheel
  pairs.push(alpaca(
    'How do the 8 businesses connect?',
    '',
    'MFS (speaking/philosophy) feeds IC (connection hub) and IA (legal architecture). IC members discover FF (clothing), SH (kitchen/food), TH (building). SH/TH content features YPEC (chef services). SS (debutante ball) showcases all businesses. Every business feeds the others — the flywheel compounds.'
  ));

  // Content framing rules
  pairs.push(alpaca(
    'How should Sovereign Economy content be framed?',
    '',
    'NEVER position as "going back" or nostalgia. ALWAYS frame as: heritage methods are the competitive advantage modern life is missing. No "great-grandmother" guilt references. No criticism of modern ways — bridge past and present positively. Frame as: what they perfected THEN that works even better NOW. These methods are not old. They are proven.'
  ));

  console.log(`  ✅ ${pairs.length} core knowledge pairs`);
  return pairs.join('');
}

// ─── MAIN ───
async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  SOVEREIGN ECONOMY — TRAINING DATA EXTRACTOR');
  console.log('═══════════════════════════════════════════════');
  console.log('');

  // Create output dir
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let allData = '';

  // Core business knowledge first (ground truth)
  allData += coreBusinessKnowledge();

  // Dynamic data from Supabase
  allData += await extractHeritageLibrary();
  allData += await extractLeads();
  allData += await extractBotKnowledge();
  allData += await extractEmailMetrics();
  allData += await extractICMembers();
  allData += await extractIAPackages();
  allData += await extractFFProducts();
  allData += await extractSSData();

  // Write output
  fs.writeFileSync(OUTPUT_FILE, allData);

  const lines = allData.trim().split('\n').length;
  const sizeMB = (Buffer.byteLength(allData) / 1024 / 1024).toFixed(2);

  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log(`  ✅ TRAINING DATA COMPLETE`);
  console.log(`  📊 ${lines} training pairs`);
  console.log(`  📁 ${sizeMB} MB`);
  console.log(`  📍 ${OUTPUT_FILE}`);
  console.log('═══════════════════════════════════════════════');
  console.log('');
  console.log('NEXT: Transfer this file to the A4000 GPU and run the fine-tuning script.');
  console.log('  scp ' + OUTPUT_FILE + ' root@155.117.43.57:/root/training/');
  console.log('  (Or use: curl to send via API if no SSH)');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
