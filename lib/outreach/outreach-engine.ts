import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/forbes-command-center';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class OutreachEngine {
  // Send pending emails
  async processPendingEmails(): Promise<number> {
    // Get enrollments with emails due
    const { data: dueEmails } = await supabase
      .from('sequence_enrollments')
      .select(`
        *,
        lead:leads!inner(*),
        sequence:outreach_sequences!inner(*)
      `)
      .eq('status', 'active')
      .lte('next_email_at', new Date().toISOString())
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
    const { lead, sequence } = enrollment;

    // Skip if no email
    if (!lead.email) {
      await supabase
        .from('sequence_enrollments')
        .update({
          status: 'paused',
          notes: 'No email address'
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

    // Personalize content
    const subject = this.personalize(currentEmail.subject_line, lead);
    const bodyHtml = this.personalize(currentEmail.body_html, lead);
    const bodyText = this.personalize(currentEmail.body_text, lead);

    // Add tracking
    const trackedHtml = this.addTracking(bodyHtml, enrollment.id);

    try {
      // Send via Forbes Command Center
      const result = await sendEmail({
        from: 'IntroAlignment <hello@introalignment.com>',
        to: lead.email,
        subject,
        html: trackedHtml,
        text: bodyText
      });

      if (!result.success) {
        throw new Error(result.error || 'Email send failed');
      }

      // Record send
      await supabase.from('email_sends').insert({
        lead_id: lead.id,
        sequence_id: sequence.id,
        sequence_email_id: currentEmail.id,
        enrollment_id: enrollment.id,
        to_email: lead.email,
        from_email: 'hello@introalignment.com',
        subject,
        body_html: trackedHtml,
        body_text: bodyText,
        provider: 'forbes-command-center',
        provider_message_id: result.messageId,
        status: 'sent',
        sent_at: new Date().toISOString()
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
        // Schedule next email
        updates.next_email_at = new Date(
          Date.now() + nextEmail.delay_days * 86400000
        ).toISOString();
      } else {
        // No more emails - complete
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();
      }

      await supabase
        .from('sequence_enrollments')
        .update(updates)
        .eq('id', enrollment.id);

      // Update lead
      await supabase
        .from('leads')
        .update({
          emails_sent: lead.emails_sent + 1,
          last_contacted_at: new Date().toISOString(),
          status: 'contacted'
        })
        .eq('id', lead.id);

      // Update sequence stats
      await this.updateSequenceStats(sequence.id);

    } catch (error: any) {
      console.error('Email send error:', error);

      // Record failure
      await supabase.from('email_sends').insert({
        lead_id: lead.id,
        sequence_id: sequence.id,
        sequence_email_id: currentEmail.id,
        enrollment_id: enrollment.id,
        to_email: lead.email,
        from_email: 'hello@introalignment.com',
        subject,
        body_html: trackedHtml,
        body_text: bodyText,
        status: 'failed',
        error_message: error.message
      });
    }
  }

  private personalize(template: string, lead: any): string {
    // Extract first name from display_name or username
    const firstName = lead.display_name?.split(' ')[0] ||
                     lead.username?.split(/[_\-\d]/)[0] ||
                     'there';

    return template
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{username\}\}/g, lead.username || '')
      .replace(/\{\{source\}\}/g, lead.source_type || '')
      .replace(/\{\{location\}\}/g, lead.location_mentioned || '')
      .replace(/\{\{trigger_content\}\}/g, this.truncate(lead.trigger_content, 100) || '');
  }

  private truncate(str: string, length: number): string {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
  }

  private addTracking(html: string, enrollmentId: string): string {
    // Add open tracking pixel
    const trackingPixel = `<img src="https://introalignment.vercel.app/api/track/open?eid=${enrollmentId}" width="1" height="1" style="display:none" alt="" />`;

    // Add to end of email (before closing body tag if exists, otherwise append)
    let trackedHtml = html;
    if (html.includes('</body>')) {
      trackedHtml = html.replace('</body>', `${trackingPixel}</body>`);
    } else {
      trackedHtml = html + trackingPixel;
    }

    // Wrap links for click tracking
    return trackedHtml.replace(
      /<a\s+href="([^"]+)"/g,
      (match, url) => {
        const trackedUrl = `https://introalignment.vercel.app/api/track/click?eid=${enrollmentId}&url=${encodeURIComponent(url)}`;
        return `<a href="${trackedUrl}"`;
      }
    );
  }

  private async updateSequenceStats(sequenceId: string): Promise<void> {
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

  // Enroll lead in sequence
  async enrollLead(leadId: string, sequenceId?: string): Promise<void> {
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (!lead) return;

    // Find best sequence if not specified
    if (!sequenceId) {
      const { data: sequences } = await supabase
        .from('outreach_sequences')
        .select('*')
        .eq('is_active', true)
        .lte('target_fit_score_min', lead.fit_score || 0)
        .order('target_fit_score_min', { ascending: false })
        .limit(1);

      if (!sequences?.length) return;
      sequenceId = sequences[0].id;
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('sequence_enrollments')
      .select('id')
      .eq('lead_id', leadId)
      .eq('sequence_id', sequenceId)
      .single();

    if (existing) return; // Already enrolled

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
      lead_id: leadId,
      sequence_id: sequenceId,
      current_step: 0,
      status: 'active',
      next_email_at: new Date(
        Date.now() + (firstEmail.delay_days * 86400000)
      ).toISOString()
    });

    // Update lead
    await supabase
      .from('leads')
      .update({
        outreach_status: 'in_sequence',
        current_sequence_id: sequenceId
      })
      .eq('id', leadId);

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
  }
}
