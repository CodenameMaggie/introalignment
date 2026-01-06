/**
 * Annie's Auto-Onboarding
 * Automatically creates client accounts and sends welcome emails
 * when proposals are signed/accepted
 */

const bcrypt = require('bcryptjs');
const { withCronAuth } = require('../lib/api-wrapper');
const { sendEmail } = require('../lib/email-sender');
const { createClient } = require('@supabase/supabase-js');

// Use Supabase service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Generate random password
 */
function generatePassword(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function handler(req, res) {
  const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';

  try {
    console.log('[Annie Onboarding] Starting auto-onboarding...');

    // =====================================================================
    // STEP 1: Find deals with pending onboarding
    // =====================================================================

    const dealsResult = await supabase
      .from('deals')
      .select(`
        id,
        title,
        contact_id,
        stage,
        amount,
        contacts (
          id,
          full_name,
          email,
          company
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('onboarding_status', 'pending')
      .not('contact_id', 'is', null)
      .order('created_at', { ascending: true })
      .limit(10);

    const deals = dealsResult.data || [];

    if (deals.length === 0) {
      console.log('[Annie Onboarding] No deals with pending onboarding');
      return res.json({
        success: true,
        data: { onboarded: 0, message: 'No pending onboarding' }
      });
    }

    console.log(`[Annie Onboarding] Found ${deals.length} deals with pending onboarding`);

    // =====================================================================
    // STEP 2: Process each deal - create account and send welcome email
    // =====================================================================

    const onboarded = [];
    const errors = [];

    for (const deal of deals) {
      try {
        const contact = deal.contacts;

        if (!contact || !contact.email) {
          console.error(`[Annie Onboarding] Deal ${deal.id} has no contact or email`);
          throw new Error('Deal has no contact or email');
        }

        console.log(`[Annie Onboarding] Processing ${contact.full_name} (${contact.email})`);

        // =====================================================================
        // STEP 3: Check if user account already exists
        // =====================================================================

        const existingUserResult = await supabase
          .from('users')
          .select('id, email')
          .eq('tenant_id', tenantId)
          .eq('email', contact.email)
          .limit(1)
          .single();

        let userId;
        let isNewUser = false;
        let temporaryPassword;

        if (existingUserResult.data) {
          // User already exists
          userId = existingUserResult.data.id;
          console.log(`[Annie Onboarding] User account already exists: ${userId}`);
        } else {
          // Create new user account
          temporaryPassword = generatePassword(12);
          const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

          const newUserResult = await supabase
            .from('users')
            .insert({
              tenant_id: tenantId,
              email: contact.email,
              full_name: contact.full_name,
              password_hash: hashedPassword,
              role: 'client',
              subscription_plan: 'premium', // Default for new clients
              subscription_status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('id')
            .single();

          if (newUserResult.error) {
            throw new Error(`Failed to create user: ${newUserResult.error.message}`);
          }

          userId = newUserResult.data.id;
          isNewUser = true;

          console.log(`[Annie Onboarding] Created user account: ${userId}`);
        }

        // =====================================================================
        // STEP 4: Create user_onboarding record
        // =====================================================================

        const onboardingResult = await supabase
          .from('user_onboarding')
          .insert({
            tenant_id: tenantId,
            user_id: userId,
            deal_id: deal.id,
            account_created: true,
            account_created_at: new Date().toISOString(),
            automated_by: 'annie',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (onboardingResult.error) {
          console.error('[Annie Onboarding] Failed to create onboarding record:', onboardingResult.error);
        }

        // =====================================================================
        // STEP 5: Send welcome email with login credentials
        // =====================================================================

        const loginUrl = 'https://growthmanagerpro.com/login';
        const calendlyKickoffLink = process.env.CALENDLY_KICKOFF_LINK || 'https://calendly.com/maggieforbes/kickoff';

        let emailSubject;
        let emailBody;

        if (isNewUser) {
          // New user - send credentials
          emailSubject = `Welcome to Growth Manager Pro! Your account is ready 🎉`;
          emailBody = `
            <h2>Welcome to Growth Manager Pro, ${contact.full_name}!</h2>

            <p>Your account has been created and is ready to use. Here are your login credentials:</p>

            <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a><br/>
              <strong>Email:</strong> ${contact.email}<br/>
              <strong>Temporary Password:</strong> <code style="background: white; padding: 5px;">${temporaryPassword}</code>
            </div>

            <p><strong>⚠️ Please change your password after your first login.</strong></p>

            <h3>Next Steps:</h3>
            <ol>
              <li>Log in to your account using the credentials above</li>
              <li>Complete your profile setup</li>
              <li>Book your kickoff call: <a href="${calendlyKickoffLink}">Schedule Kickoff Call</a></li>
            </ol>

            <p>I'll be with you every step of the way to ensure you get the most out of Growth Manager Pro.</p>

            <p>If you have any questions, just reply to this email!</p>

            <p>Best,<br/>
            Annie (Your AI Assistant)<br/>
            Growth Manager Pro</p>
          `;

          // Update onboarding record
          await supabase
            .from('user_onboarding')
            .update({
              welcome_email_sent: true,
              welcome_email_sent_at: new Date().toISOString(),
              login_credentials_sent: true,
              login_credentials_sent_at: new Date().toISOString(),
              kickoff_link_sent: true,
              kickoff_link_sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', onboardingResult.data.id);

        } else {
          // Existing user - just welcome and kickoff link
          emailSubject = `Your new project is ready in Growth Manager Pro!`;
          emailBody = `
            <h2>Welcome back, ${contact.full_name}!</h2>

            <p>Your new project "<strong>${deal.title}</strong>" has been set up in Growth Manager Pro.</p>

            <p><strong>Log in now:</strong> <a href="${loginUrl}">${loginUrl}</a></p>

            <h3>Next Steps:</h3>
            <ol>
              <li>Review your project details in the dashboard</li>
              <li>Book your kickoff call: <a href="${calendlyKickoffLink}">Schedule Kickoff Call</a></li>
            </ol>

            <p>Looking forward to working with you again!</p>

            <p>Best,<br/>
            Annie (Your AI Assistant)<br/>
            Growth Manager Pro</p>
          `;

          // Update onboarding record
          await supabase
            .from('user_onboarding')
            .update({
              welcome_email_sent: true,
              welcome_email_sent_at: new Date().toISOString(),
              kickoff_link_sent: true,
              kickoff_link_sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', onboardingResult.data.id);
        }

        // Send email
        await sendEmail({
          to: contact.email,
          subject: emailSubject,
          htmlBody: emailBody,
          fromEmail: 'support@growthmanagerpro.com'
        });

        console.log(`[Annie Onboarding] Sent welcome email to ${contact.email}`);

        // =====================================================================
        // STEP 6: Update deal onboarding status
        // =====================================================================

        await supabase
          .from('deals')
          .update({
            onboarding_status: 'in_progress',
            onboarding_started_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', deal.id);

        // =====================================================================
        // STEP 7: Log bot action
        // =====================================================================

        await supabase
          .from('bot_actions_log')
          .insert({
            tenant_id: tenantId,
            bot_name: 'annie',
            action_type: 'client_onboarding',
            action_description: `Onboarded new client: ${contact.full_name} (${contact.email})`,
            status: 'completed',
            related_entity_type: 'user',
            related_entity_id: userId,
            triggered_by: req.query?.triggered_by || req.body?.triggered_by || 'automated',
            metadata: {
              deal_id: deal.id,
              user_id: userId,
              is_new_user: isNewUser,
              welcome_email_sent: true,
              kickoff_link_sent: true
            },
            created_at: new Date().toISOString()
          });

        onboarded.push({
          deal_id: deal.id,
          user_id: userId,
          email: contact.email,
          name: contact.full_name,
          is_new_user: isNewUser,
          welcome_email_sent: true
        });

        console.log(`[Annie Onboarding] ✓ Onboarded ${contact.email}`);

        // Rate limit: 2 seconds between onboardings
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`[Annie Onboarding] Error processing deal ${deal.id}:`, error);

        errors.push({
          deal_id: deal.id,
          contact_email: deal.contacts?.email,
          error: error.message
        });

        // Mark deal as failed (don't retry automatically)
        await supabase
          .from('deals')
          .update({
            onboarding_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', deal.id);
      }
    }

    console.log(`[Annie Onboarding] Onboarded ${onboarded.length} clients, ${errors.length} errors`);

    return res.json({
      success: true,
      data: {
        onboarded: onboarded.length,
        clients: onboarded,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('[Annie Onboarding] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = withCronAuth(handler);
