/**
 * Supabase Client Module
 *
 * Direct connection to Supabase - the Railway migration was abandoned
 * This is the actual working database
 */

const { createClient: createSupabaseClient } = require('@supabase/supabase-js');

/**
 * Create a Supabase client
 */
function createClient(supabaseUrl, supabaseKey) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and key are required');
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
}

module.exports = { createClient };
