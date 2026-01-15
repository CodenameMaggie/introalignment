import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = await createClient();
    const slug = params.slug;

    // First try to find by slug
    let { data: attorney, error } = await supabase
      .from('partners')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'approved')
      .single();

    // If not found by slug, try to find by generating slug from full_name
    if (error || !attorney) {
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

    // Enhance attorney data
    const enhancedAttorney = {
      ...attorney,
      slug: attorney.slug || attorney.full_name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
      is_verified: true,
      is_premium: attorney.partner_type === 'featured_partner' || false
    };

    return NextResponse.json({ attorney: enhancedAttorney });

  } catch (error: any) {
    console.error('Attorney profile API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
