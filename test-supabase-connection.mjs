/**
 * SovereigntyIntroAlignment - Supabase Connection Test
 */

import { readFileSync } from 'fs';

// Read .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function testConnection() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  INTROALIGNMENT - SUPABASE CONNECTION TEST');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`Project URL: ${SUPABASE_URL}\n`);

  const results = {
    connection: false,
    auth: false,
    anonKeyValid: false,
    serviceKeyValid: false,
    tables: [],
    users: null,
    leads: null,
    errors: []
  };

  // Test 1: Basic connection
  console.log('Test 1: Basic Connection...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });
    results.connection = response.status === 401 || response.status === 200;
    console.log(`  ${results.connection ? '✓' : '✗'} Connection: ${response.status === 401 ? 'Project exists (401 expected)' : response.status}\n`);
  } catch (err) {
    results.errors.push(`Connection: ${err.message}`);
    console.log(`  ✗ Connection failed: ${err.message}\n`);
  }

  // Test 2: Auth endpoint
  console.log('Test 2: Auth Endpoint...');
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: {
        'apikey': ANON_KEY
      }
    });
    results.auth = response.ok;
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✓ Auth settings accessible`);
      console.log(`    External providers: ${Object.keys(data.external || {}).join(', ') || 'none'}\n`);
    } else {
      console.log(`  ✗ Auth check failed: ${response.status}\n`);
    }
  } catch (err) {
    results.errors.push(`Auth: ${err.message}`);
    console.log(`  ✗ Auth failed: ${err.message}\n`);
  }

  // Test 3: Anon key - Check users table
  console.log('Test 3: Anon Key - Users Table...');
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/users?select=count`,
      {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Prefer': 'count=exact'
        }
      }
    );

    if (response.ok) {
      results.anonKeyValid = true;
      const contentRange = response.headers.get('content-range');
      const count = contentRange ? contentRange.split('/')[1] : 'unknown';
      console.log(`  ✓ Anon key valid`);
      console.log(`    Users count: ${count}\n`);
    } else {
      const error = await response.json();
      console.log(`  ✗ Anon key failed: ${error.message || response.status}\n`);
    }
  } catch (err) {
    results.errors.push(`Anon key: ${err.message}`);
    console.log(`  ✗ Anon key test failed: ${err.message}\n`);
  }

  // Test 4: Service key - Lead sources table
  console.log('Test 4: Service Key - Lead Sources Table...');
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/lead_sources?select=source_name,source_type,is_active`,
      {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`
        }
      }
    );

    if (response.ok) {
      results.serviceKeyValid = true;
      const sources = await response.json();
      console.log(`  ✓ Service key valid`);
      console.log(`    Lead sources: ${sources.length} found`);
      if (sources.length > 0) {
        sources.forEach(s => {
          console.log(`      - ${s.source_name} (${s.source_type}) ${s.is_active ? '✓ active' : '✗ inactive'}`);
        });
      }
      console.log('');
    } else {
      const error = await response.json();
      console.log(`  ✗ Service key failed: ${error.message || response.status}\n`);
    }
  } catch (err) {
    results.errors.push(`Service key: ${err.message}`);
    console.log(`  ✗ Service key test failed: ${err.message}\n`);
  }

  // Test 5: Check leads count
  console.log('Test 5: Leads Count...');
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/leads?select=count`,
      {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Prefer': 'count=exact'
        }
      }
    );

    if (response.ok) {
      const contentRange = response.headers.get('content-range');
      const count = contentRange ? contentRange.split('/')[1] : 'unknown';
      results.leads = count;
      console.log(`  ✓ Leads table accessible`);
      console.log(`    Total leads: ${count}\n`);
    } else {
      const error = await response.json();
      console.log(`  ✗ Leads check failed: ${error.message || response.status}\n`);
    }
  } catch (err) {
    console.log(`  ✗ Leads check failed: ${err.message}\n`);
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  const allPassed = results.connection && results.auth && results.anonKeyValid && results.serviceKeyValid;

  if (allPassed) {
    console.log('  ✓ ALL TESTS PASSED - Supabase is fully connected!\n');
  } else {
    console.log('  ✗ SOME TESTS FAILED:\n');
    if (!results.connection) console.log('    - Connection failed');
    if (!results.auth) console.log('    - Auth endpoint failed');
    if (!results.anonKeyValid) console.log('    - Anon key invalid');
    if (!results.serviceKeyValid) console.log('    - Service key invalid');
    console.log('');

    if (results.errors.length > 0) {
      console.log('  Errors:');
      results.errors.forEach(e => console.log(`    - ${e}`));
      console.log('');
    }

    console.log('  Solution: Update API keys in .env.local');
    console.log('  https://supabase.com/dashboard/project/cxiazrciueruvvsxaxcz/settings/api\n');
  }

  return results;
}

// Run test
testConnection()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
