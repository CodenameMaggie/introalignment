import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = await createClient();
    const slug = params.slug;
    const { name, email, phone, message } = await request.json();

    // Find the attorney
    let { data: attorney } = await supabase
      .from('partners')
      .select('*')
      .eq('slug', slug)
      .single();

    if (!attorney) {
      // Try by generated slug
      const { data: attorneys } = await supabase
        .from('partners')
        .select('*')
        .eq('status', 'approved');

      attorney = attorneys?.find(a => {
        const generatedSlug = a.full_name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        return generatedSlug === slug;
      }) || null;
    }

    if (!attorney) {
      return NextResponse.json(
        { error: 'Attorney not found' },
        { status: 404 }
      );
    }

    // For premium members, send immediate notification
    if (attorney.partner_type === 'featured_partner' || attorney.is_premium) {
      // Send email notification to attorney
      const FORBES_API = process.env.FORBES_COMMAND_API_URL || 'http://5.78.139.9:3000/api/email-api';
      const FORBES_KEY = process.env.FORBES_COMMAND_API_KEY || 'forbes-command-2026';
      const BUSINESS_CODE = 'IA';

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
    .inquiry-box { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">New Client Inquiry</h1>
    <p style="margin: 10px 0 0 0;">IntroAlignment Directory</p>
  </div>
  <div class="content">
    <p>Hi ${attorney.full_name},</p>

    <p>You've received a new inquiry through your IntroAlignment attorney profile:</p>

    <div class="inquiry-box">
      <p><strong>From:</strong> ${name}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap;">${message}</p>
    </div>

    <p><strong>Recommended Next Steps:</strong></p>
    <ul>
      <li>Respond within 24 hours for best conversion rates</li>
      <li>Reference their specific inquiry in your response</li>
      <li>Offer a complimentary consultation if appropriate</li>
    </ul>

    <p>This inquiry was routed to you as a Premium member of IntroAlignment.</p>

    <p style="margin-top: 40px;">Best regards,<br/>
    <strong>The IntroAlignment Team</strong></p>
  </div>

  <div class="footer">
    <p>IntroAlignment Legal Network | Email: hello@introalignment.com</p>
    <p style="margin-top: 10px; font-size: 11px;">
      Premium member benefit: Priority client inquiry routing<br/>
      <a href="https://introalignment.com/directory/${slug}">View your profile</a>
    </p>
  </div>
</body>
</html>
      `;

      await fetch(FORBES_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          api_key: FORBES_KEY,
          business: BUSINESS_CODE,
          to: attorney.email,
          subject: `New Client Inquiry from ${name}`,
          html,
          from: 'hello@introalignment.com',
          replyTo: email
        })
      });
    }

    // Log the inquiry to database
    await supabase.from('client_inquiries').insert({
      attorney_id: attorney.id,
      client_name: name,
      client_email: email,
      client_phone: phone,
      message: message,
      source: 'directory_profile',
      created_at: new Date().toISOString()
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Inquiry API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
