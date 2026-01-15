import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: attorneys, error } = await supabase
      .from('partners')
      .select('*')
      .eq('status', 'approved')
      .eq('partner_type', 'prospect')
      .not('email', 'like', 'pending.%')
      .order('is_premium', { ascending: false })
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching attorneys:', error);
      return NextResponse.json({ attorneys: [] });
    }

    // Add slug if missing (generate from full_name)
    const attorneysWithSlugs = attorneys?.map(attorney => ({
      ...attorney,
      slug: attorney.slug || attorney.full_name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
      is_verified: true, // All approved attorneys are verified by Jordan+Atlas
      is_premium: attorney.partner_type === 'featured_partner' || false
    })) || [];

    return NextResponse.json({ attorneys: attorneysWithSlugs });

  } catch (error: any) {
    console.error('Directory API error:', error);
    return NextResponse.json(
      { error: error.message, attorneys: [] },
      { status: 500 }
    );
  }
}
