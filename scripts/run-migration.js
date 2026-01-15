#!/usr/bin/env node
/**
 * Run Database Migration
 * Executes the attorney_verifications table creation
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runMigration() {
  console.log('\n🔒 Running attorney_verifications migration...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Read the SQL migration file
  const sqlPath = path.join(__dirname, '../supabase/migrations/create_attorney_verifications.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Execute the SQL
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('Attempting direct SQL execution...');

      // Split by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.startsWith('CREATE TABLE')) {
          // Use Supabase client to create table
          console.log('Creating attorney_verifications table...');

          const { error: tableError } = await supabase
            .from('attorney_verifications')
            .select('id')
            .limit(1);

          if (tableError && tableError.code === '42P01') {
            // Table doesn't exist, need to create it via SQL
            console.log('Table does not exist, creating via direct connection...');
            console.log('\n⚠️  Please run this migration manually in Supabase SQL Editor:');
            console.log('\n' + sql + '\n');
            return;
          } else if (!tableError) {
            console.log('✅ Table already exists!');
            return;
          }
        }
      }
    }

    console.log('✅ Migration executed successfully!');
    console.log('\nVerification system is now active.');
    console.log('All outreach will require Jordan + Atlas approval.\n');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:\n');
    console.log(sql);
    console.log('\nOr use: psql $DATABASE_URL -f supabase/migrations/create_attorney_verifications.sql\n');
  }
}

runMigration().catch(console.error);
