// Email Templates with Unsubscribe Links

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface TemplateVariables {
  firstName: string;
  specialization?: string;
  state?: string;
  unsubscribeUrl: string;
}

export function getPartnerOutreachTemplate(vars: TemplateVariables): EmailTemplate {
  const { firstName, specialization, state, unsubscribeUrl } = vars;

  return {
    subject: `Partnership Opportunity - IntroAlignment Legal Network`,

    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Cormorant Garamond', Georgia, serif; color: #2d2d2d; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #9a7b4f; }
    .content { padding: 30px 0; }
    .cta { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background: #9a7b4f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
    .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e8e4df; font-size: 12px; color: #6b6b6b; }
    .unsubscribe { margin-top: 20px; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="font-family: 'Cinzel', Georgia, serif; color: #9a7b4f; margin: 0;">IntroAlignment</h1>
      <p style="margin: 5px 0 0 0; color: #6b6b6b;">Legal Architecture for Sovereign Living</p>
    </div>

    <div class="content">
      <p>Hi ${firstName},</p>

      <p>I came across your profile while researching top ${specialization || 'estate planning'} attorneys in ${state || 'your area'}, and I'm impressed by your experience.</p>

      <p>I'm reaching out from <strong>IntroAlignment</strong>, where we're building a network of elite legal professionals specializing in dynasty trusts, asset protection, and sophisticated estate structures for high-net-worth families.</p>

      <p><strong>We're looking for partners who:</strong></p>
      <ul>
        <li>Have deep expertise in estate planning and wealth preservation</li>
        <li>Work with high-net-worth clients</li>
        <li>Are interested in collaborative referral relationships</li>
        <li>Want to share expertise on our podcast: sovereigndesign.it.com</li>
      </ul>

      <p><strong>Benefits:</strong></p>
      <ul>
        <li>Client referrals from our network</li>
        <li>Podcast platform to establish thought leadership</li>
        <li>Collaboration with top-tier attorneys and CPAs</li>
      </ul>

      <div class="cta">
        <a href="https://introalignment.com/partners" class="button">Apply as Partner</a>
      </div>

      <p>Or schedule a brief call to discuss: <a href="https://calendly.com/maggie-maggieforbesstrategies/podcast-call-1" style="color: #9a7b4f;">Book Wednesday Call</a></p>

      <p>Best regards,<br>
      <strong>Maggie Forbes</strong><br>
      IntroAlignment<br>
      <a href="https://introalignment.com" style="color: #9a7b4f;">introalignment.com</a></p>
    </div>

    <div class="footer">
      <p>IntroAlignment<br>
      Legal Architecture for Sovereign Living</p>

      <div class="unsubscribe">
        <p>This is a one-time professional outreach. If you do not wish to receive future communications, you can <a href="${unsubscribeUrl}" style="color: #9a7b4f;">unsubscribe here</a>.</p>
        <p style="margin-top: 10px;">IntroAlignment | Legal Professional Network<br>
        <a href="https://introalignment.com/privacy" style="color: #9a7b4f;">Privacy Policy</a></p>
      </div>
    </div>
  </div>
</body>
</html>
    `,

    text: `
Hi ${firstName},

I came across your profile while researching top ${specialization || 'estate planning'} attorneys in ${state || 'your area'}, and I'm impressed by your experience.

I'm reaching out from IntroAlignment, where we're building a network of elite legal professionals specializing in dynasty trusts, asset protection, and sophisticated estate structures for high-net-worth families.

We're looking for partners who:
- Have deep expertise in estate planning and wealth preservation
- Work with high-net-worth clients
- Are interested in collaborative referral relationships
- Want to share expertise on our podcast: sovereigndesign.it.com

Benefits:
- Client referrals from our network
- Podcast platform to establish thought leadership
- Collaboration with top-tier attorneys and CPAs

Apply as Partner: https://introalignment.com/partners
Or schedule a brief call: https://calendly.com/maggie-maggieforbesstrategies/podcast-call-1

Best regards,
Maggie Forbes
IntroAlignment
https://introalignment.com

---
This is a one-time professional outreach. To unsubscribe from future communications: ${unsubscribeUrl}
IntroAlignment | Legal Professional Network | Privacy Policy: https://introalignment.com/privacy
    `
  };
}

export function getPodcastInvitationTemplate(vars: TemplateVariables): EmailTemplate {
  const { firstName, specialization, unsubscribeUrl } = vars;

  return {
    subject: `Guest Invitation - sovereigndesign.it.com Podcast`,

    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Cormorant Garamond', Georgia, serif; color: #2d2d2d; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #9a7b4f; }
    .content { padding: 30px 0; }
    .cta { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background: #9a7b4f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
    .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e8e4df; font-size: 12px; color: #6b6b6b; }
    .unsubscribe { margin-top: 20px; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="font-family: 'Cinzel', Georgia, serif; color: #9a7b4f; margin: 0;">sovereigndesign.it.com</h1>
      <p style="margin: 5px 0 0 0; color: #6b6b6b;">Legal Architecture Podcast</p>
    </div>

    <div class="content">
      <p>Hi ${firstName},</p>

      <p>I've been following your work in ${specialization || 'estate planning'}, and I think your insights would be valuable for our audience.</p>

      <p>We're hosting the <strong>sovereigndesign.it.com podcast</strong>, focused on legal architecture for generational wealth. Our audience includes:</p>
      <ul>
        <li>High-net-worth individuals</li>
        <li>Family offices</li>
        <li>Other legal and financial professionals</li>
      </ul>

      <p>Would you be interested in joining us for a 45-minute conversation? We'll promote the episode across our network and provide full video/audio distribution.</p>

      <p><strong>We book legal professionals on Wednesdays.</strong></p>

      <div class="cta">
        <a href="https://calendly.com/maggie-maggieforbesstrategies/podcast-call-1" class="button">Schedule Wednesday Session</a>
      </div>

      <p>Looking forward to connecting!</p>

      <p>Best regards,<br>
      <strong>Maggie Forbes</strong><br>
      sovereigndesign.it.com<br>
      <a href="https://introalignment.com" style="color: #9a7b4f;">introalignment.com</a></p>
    </div>

    <div class="footer">
      <p>sovereigndesign.it.com Podcast<br>
      IntroAlignment</p>

      <div class="unsubscribe">
        <p>This is a one-time podcast invitation. To unsubscribe from future communications: <a href="${unsubscribeUrl}" style="color: #9a7b4f;">unsubscribe here</a>.</p>
        <p style="margin-top: 10px;">IntroAlignment | <a href="https://introalignment.com/privacy" style="color: #9a7b4f;">Privacy Policy</a></p>
      </div>
    </div>
  </div>
</body>
</html>
    `,

    text: `
Hi ${firstName},

I've been following your work in ${specialization || 'estate planning'}, and I think your insights would be valuable for our audience.

We're hosting the sovereigndesign.it.com podcast, focused on legal architecture for generational wealth. Our audience includes:
- High-net-worth individuals
- Family offices
- Other legal and financial professionals

Would you be interested in joining us for a 45-minute conversation? We'll promote the episode across our network and provide full video/audio distribution.

We book legal professionals on Wednesdays.

Schedule your Wednesday session: https://calendly.com/maggie-maggieforbesstrategies/podcast-call-1

Looking forward to connecting!

Best regards,
Maggie Forbes
sovereigndesign.it.com
https://introalignment.com

---
To unsubscribe from future communications: ${unsubscribeUrl}
IntroAlignment | Privacy Policy: https://introalignment.com/privacy
    `
  };
}

// Helper function to generate unsubscribe token and URL
export async function generateUnsubscribeUrl(partnerId: string, supabase: any): Promise<string> {
  const token = `${partnerId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Store token in database
  await supabase.from('unsubscribe_tokens').insert([{
    partner_id: partnerId,
    token: token
  }]);

  return `https://introalignment.com/api/unsubscribe?token=${token}`;
}
