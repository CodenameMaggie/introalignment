#!/usr/bin/env node

/**
 * Create Admin User
 *
 * Creates a Supabase auth user and sets admin role
 * Email: maggie@maggieforbesstrategies.com
 * Password: Success@2026!
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cxiazrciueruvvsxaxcz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aWF6cmNpdWVydXZ2c3hheGN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU0Mjg2NywiZXhwIjoyMDgzMTE4ODY3fQ.r3L64ZLdokiRU_bn_J_F1IuX8R11Q72bN5LYmSsjSn4';

const ADMIN_EMAIL = 'maggie@maggieforbesstrategies.com';
const ADMIN_PASSWORD = 'Success@2026!';
const ADMIN_NAME = 'Maggie Forbes';

async function createAdminUser() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('👤 CREATING ADMIN USER');
  console.log('═══════════════════════════════════════════════════════\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Check if user already exists
    console.log(`Checking if ${ADMIN_EMAIL} already exists...`);

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === ADMIN_EMAIL);

    let authUserId;

    if (existingUser) {
      console.log(`✅ Auth user already exists (ID: ${existingUser.id})`);
      authUserId = existingUser.id;

      // Update password
      console.log('Updating password...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: ADMIN_PASSWORD }
      );

      if (updateError) {
        console.error('❌ Error updating password:', updateError.message);
      } else {
        console.log('✅ Password updated successfully');
      }
    } else {
      // Create auth user
      console.log('Creating Supabase auth user...');
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: ADMIN_NAME
        }
      });

      if (authError) {
        console.error('❌ Error creating auth user:', authError.message);
        process.exit(1);
      }

      console.log(`✅ Auth user created (ID: ${authData.user.id})`);
      authUserId = authData.user.id;
    }

    // Check if user record exists
    const { data: existingUserRecord } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUserId)
      .single();

    if (existingUserRecord) {
      console.log(`✅ User record already exists`);

      // Update to admin role
      console.log('Setting admin role...');
      const { error: updateError } = await supabase
        .from('users')
        .update({
          role: 'admin',
          status: 'active'
        })
        .eq('id', authUserId);

      if (updateError) {
        console.error('❌ Error updating user role:', updateError.message);
      } else {
        console.log('✅ Admin role set successfully');
      }
    } else {
      // Create user record with admin role
      console.log('Creating user record with admin role...');
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          email: ADMIN_EMAIL,
          full_name: ADMIN_NAME,
          role: 'admin',
          status: 'active',
          subscription_tier: 'elite',
          verified: true,
          verification_level: 'email'
        });

      if (userError) {
        console.error('❌ Error creating user record:', userError.message);
      } else {
        console.log('✅ User record created with admin role');
      }
    }

    // Verify admin user
    const { data: adminUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', ADMIN_EMAIL)
      .single();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ ADMIN USER SETUP COMPLETE');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log(`Name: ${ADMIN_NAME}`);
    console.log(`Role: ${adminUser?.role || 'N/A'}`);
    console.log(`Status: ${adminUser?.status || 'N/A'}`);
    console.log(`Tier: ${adminUser?.subscription_tier || 'N/A'}`);
    console.log('\n🔐 You can now login at: https://introalignment.com/login');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();
