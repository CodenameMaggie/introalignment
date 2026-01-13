import { createClient } from '@supabase/supabase-js';
import { sendPodcastInvitation } from '@/lib/email/forbes-command-center';

export class PartnerOutreachEngine {
  private getSupabase() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // Send pending podcast invitations
  async processPendingEmails(): Promise<number> {
    const supabase = this.getSupabase();

    // Get enrollments with emails due (partners in sequences)
    const { data: dueEmails } = await supabase
      .from('sequence_enrollments')
      .select(`
        *,
        partner:partners!inner(*),
        sequence:outreach_sequences!inner(*)
      `)
      .eq('status', 'active')
      .lte('next_email_at', new Date().toISOString())
      .not('partner', 'is', null) // Partners only (not leads)
      .limit(50);

    let sentCount = 0;

    for (const enrollment of dueEmails || []) {
      try {
        await this.sendSequenceEmail(enrollment);
        sentCount++;
      } catch (error) {
        console.error(`Error sending email for enrollment ${enrollment.id}:`, error);
      }
    }

    return sentCount;
  }

  async sendSequenceEmail(enrollment: any): Promise<void> {
    const supabase = this.getSupabase();
    const { partner, sequence } = enrollment;

    // Skip if no email
    if (!partner.email) {
      await supabase
        .from('sequence_enrollments')
        .update({
          status: 'paused',
          notes: 'No email address'
        })
        .eq('id', enrollment.id);
      return;
    }

    // Skip if partner unsubscribed
    if (partner.email_unsubscribed) {
      await supabase
        .from('sequence_enrollments')
        .update({
          status: 'paused',
          notes: 'Partner unsubscribed'
        })
        .eq('id', enrollment.id);
      return;
    }

    // Get the current email to send
    const { data: currentEmail } = await supabase
      .from('sequence_emails')
      .select('*')
      .eq('sequence_id', sequence.id)
      .eq('step_number', enrollment.current_step + 1)
      .eq('is_active', true)
      .single();

    if (!currentEmail) {
      // No more emails in sequence
      await supabase
        .from('sequence_enrollments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', enrollment.id);
      return;
    }

    // For podcast invitations, use the specialized function
    const firstName = partner.first_name || partner.full_name?.split(' ')[0] || 'there';

    try {
      // Send podcast invitation via Forbes Command Center
      const result = await sendPodcastInvitation({
        email: partner.email,
        firstName,
        professionalTitle: partner.professional_title,
        specializations: partner.specializations
      });

      if (!result.success) {
        throw new Error(result.error || 'Email send failed');
      }

      // Record send
      await supabase.from('email_sends').insert({
        partner_id: partner.id, // Use partner_id instead of lead_id
        sequence_id: sequence.id,
        sequence_email_id: currentEmail.id,
        enrollment_id: enrollment.id,
        to_email: partner.email,
        from_email: 'maggie@maggieforbesstrategies.com',
        subject: `Podcast Invitation: Share Your Expertise on sovereigndesign.it.com`,
        body_html: '(podcast invitation template)', // Template is in sendPodcastInvitation()
        body_text: '(podcast invitation template)',
        provider: 'forbes-command-center',
        provider_message_id: result.messageId,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

      // Record in outreach_email_log (for deduplication)
      await supabase.from('outreach_email_log').insert({
        recipient_email: partner.email,
        recipient_type: 'partner',
        recipient_id: partner.id,
        campaign_type: 'podcast_invitation',
        sender_email: 'maggie@maggieforbesstrategies.com',
        status: 'sent',
        sent_at: new Date().toISOString(),
        provider: 'forbes-command-center',
        metadata: {
          partner_name: partner.full_name,
          specializations: partner.specializations,
          source: partner.source,
          automated: true,
          sequence_id: sequence.id
        }
      });

      // Update enrollment
      const nextStep = enrollment.current_step + 1;
      const { data: nextEmail } = await supabase
        .from('sequence_emails')
        .select('*')
        .eq('sequence_id', sequence.id)
        .eq('step_number', nextStep + 1)
        .single();

      const updates: any = {
        current_step: nextStep,
        emails_sent: enrollment.emails_sent + 1
      };

      if (nextEmail) {
        // Schedule next email (follow-up)
        updates.next_email_at = new Date(
          Date.now() + nextEmail.delay_days * 86400000
        ).toISOString();
      } else {
        // No more emails - complete sequence
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();
      }

      await supabase
        .from('sequence_enrollments')
        .update(updates)
        .eq('id', enrollment.id);

      // Update partner
      await supabase
        .from('partners')
        .update({
          podcast_status: 'contacted',
          last_contact_date: new Date().toISOString().split('T')[0],
          partner_type: partner.partner_type === 'prospect' ? 'contacted' : partner.partner_type
        })
        .eq('id', partner.id);

      // Update sequence stats
      await this.updateSequenceStats(sequence.id);

      console.log(`[Partner Outreach] ✅ Podcast invitation sent to ${partner.email}`);

    } catch (error: any) {
      console.error('Email send error:', error);

      // Record failure
      await supabase.from('email_sends').insert({
        partner_id: partner.id,
        sequence_id: sequence.id,
        sequence_email_id: currentEmail.id,
        enrollment_id: enrollment.id,
        to_email: partner.email,
        from_email: 'maggie@maggieforbesstrategies.com',
        subject: `Podcast Invitation: Share Your Expertise on sovereigndesign.it.com`,
        status: 'failed',
        error_message: error.message
      });
    }
  }

  private async updateSequenceStats(sequenceId: string): Promise<void> {
    const supabase = this.getSupabase();

    // Calculate and update sequence stats
    const { data: stats } = await supabase
      .from('email_sends')
      .select('status')
      .eq('sequence_id', sequenceId);

    if (!stats) return;

    const sent = stats.filter((s: any) =>
      s.status !== 'pending' && s.status !== 'failed'
    ).length;

    const opened = stats.filter((s: any) =>
      s.status === 'opened' || s.status === 'clicked'
    ).length;

    const clicked = stats.filter((s: any) =>
      s.status === 'clicked'
    ).length;

    await supabase
      .from('outreach_sequences')
      .update({
        emails_sent: sent,
        emails_opened: opened,
        emails_clicked: clicked,
        open_rate: sent > 0 ? opened / sent : 0,
        click_rate: sent > 0 ? clicked / sent : 0
      })
      .eq('id', sequenceId);
  }

  // Enroll partner in podcast sequence
  async enrollPartner(partnerId: string, sequenceId?: string): Promise<void> {
    const supabase = this.getSupabase();

    const { data: partner } = await supabase
      .from('partners')
      .select('*')
      .eq('id', partnerId)
      .single();

    if (!partner) return;

    // Skip if unsubscribed
    if (partner.email_unsubscribed) {
      console.log(`[Partner Outreach] Skipping ${partner.email} - unsubscribed`);
      return;
    }

    // Calculate fit score (business_builder + expertise)
    const businessBuilderScore =
      (partner.practice_owner ? 3 : 0) +
      (partner.multi_state_practice ? 2 : 0) +
      (partner.content_creator ? 2 : 0) +
      (partner.conference_speaker ? 2 : 0) +
      (partner.actec_fellow ? 1 : 0);

    const expertiseScore =
      (partner.dynasty_trust_specialist ? 3 : 0) +
      (partner.asset_protection_specialist ? 3 : 0) +
      (partner.international_planning ? 2 : 0) +
      (partner.years_experience >= 15 ? 2 : 0);

    const fitScore = businessBuilderScore + expertiseScore;

    // Find best sequence if not specified
    if (!sequenceId) {
      const { data: sequences } = await supabase
        .from('outreach_sequences')
        .select('*')
        .eq('is_active', true)
        .eq('sequence_type', 'podcast_invitation') // Podcast sequences only
        .lte('target_fit_score_min', fitScore)
        .order('target_fit_score_min', { ascending: false })
        .limit(1);

      if (!sequences?.length) {
        console.log(`[Partner Outreach] No sequence found for fit_score ${fitScore}`);
        return;
      }
      sequenceId = sequences[0].id;
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('sequence_enrollments')
      .select('id, status')
      .eq('partner_id', partnerId)
      .eq('sequence_id', sequenceId)
      .single();

    if (existing) {
      console.log(`[Partner Outreach] Already enrolled: ${partner.email} (status: ${existing.status})`);
      return;
    }

    // Get first email delay
    const { data: firstEmail } = await supabase
      .from('sequence_emails')
      .select('delay_days')
      .eq('sequence_id', sequenceId)
      .eq('step_number', 1)
      .single();

    if (!firstEmail) return;

    // Create enrollment
    await supabase.from('sequence_enrollments').insert({
      partner_id: partnerId, // Use partner_id instead of lead_id
      sequence_id: sequenceId,
      current_step: 0,
      status: 'active',
      next_email_at: new Date(
        Date.now() + (firstEmail.delay_days * 86400000)
      ).toISOString()
    });

    // Update partner
    await supabase
      .from('partners')
      .update({
        podcast_status: 'queued', // New status: queued for sending
        current_sequence_id: sequenceId
      })
      .eq('id', partnerId);

    // Update sequence stats
    const { data: seq } = await supabase
      .from('outreach_sequences')
      .select('leads_enrolled')
      .eq('id', sequenceId)
      .single();

    if (seq) {
      await supabase
        .from('outreach_sequences')
        .update({
          leads_enrolled: (seq.leads_enrolled || 0) + 1
        })
        .eq('id', sequenceId);
    }

    console.log(`[Partner Outreach] ✅ Enrolled ${partner.email} in podcast sequence (fit_score: ${fitScore})`);
  }
}
