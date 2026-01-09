import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Export Qualified Leads for Dan's Email Campaigns
 * GET /api/admin/export-qualified-leads
 */
export async function GET() {
  try {
    const supabase = getAdminClient();

    console.log('🔍 Fetching qualified leads from database...');

    // Get qualified leads ready to email
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('enrichment_status', 'enriched')
      .not('email', 'is', null)
      .gte('email_confidence', 0.4)
      .gte('fit_score', 60)
      .eq('outreach_status', 'pending')
      .order('fit_score', { ascending: false });

    if (error) {
      console.error('❌ Error fetching leads:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No qualified leads found yet. Keep scraping!',
        count: 0
      });
    }

    console.log(`✅ Found ${leads.length} qualified leads ready to email`);

    // Transform data for export
    const qualifiedLeads = leads.map(lead => ({
      id: lead.id,
      username: lead.username || 'unknown',
      email: lead.email,
      email_confidence: lead.email_confidence,
      full_name: lead.full_name,
      fit_score: lead.fit_score,
      interests: lead.interests || [],
      relationship_goal: lead.relationship_goal,
      source_type: lead.source_type,
      source_url: lead.source_url,
      trigger_content: lead.trigger_content?.substring(0, 200) || '',
      created_at: lead.created_at
    }));

    // Create output directory
    const outputDir = path.join(process.cwd(), 'data', 'qualified-leads');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);

    // Export as JSON
    const jsonPath = path.join(outputDir, `qualified-leads-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(qualifiedLeads, null, 2));
    console.log(`📄 Exported JSON: ${jsonPath}`);

    // Export as CSV
    const csvPath = path.join(outputDir, `qualified-leads-${timestamp}.csv`);
    const csvHeader = 'ID,Username,Email,Email Confidence,Full Name,Fit Score,Relationship Goal,Source,Created At\n';
    const csvRows = qualifiedLeads.map(lead =>
      `"${lead.id}","${lead.username}","${lead.email}",${lead.email_confidence},"${lead.full_name || ''}",${lead.fit_score},"${lead.relationship_goal || ''}","${lead.source_type}","${lead.created_at}"`
    ).join('\n');
    fs.writeFileSync(csvPath, csvHeader + csvRows);
    console.log(`📄 Exported CSV: ${csvPath}`);

    // Export latest as copies (for easy access)
    const latestJsonPath = path.join(outputDir, 'latest-qualified-leads.json');
    const latestCsvPath = path.join(outputDir, 'latest-qualified-leads.csv');

    if (fs.existsSync(latestJsonPath)) fs.unlinkSync(latestJsonPath);
    if (fs.existsSync(latestCsvPath)) fs.unlinkSync(latestCsvPath);

    fs.copyFileSync(jsonPath, latestJsonPath);
    fs.copyFileSync(csvPath, latestCsvPath);

    console.log(`📄 Latest exports: latest-qualified-leads.json/csv`);

    // Summary stats
    const avgFitScore = (qualifiedLeads.reduce((sum, l) => sum + l.fit_score, 0) / qualifiedLeads.length).toFixed(1);
    const avgConfidence = (qualifiedLeads.reduce((sum, l) => sum + l.email_confidence, 0) / qualifiedLeads.length).toFixed(2);

    return NextResponse.json({
      success: true,
      count: qualifiedLeads.length,
      files: {
        json: `data/qualified-leads/qualified-leads-${timestamp}.json`,
        csv: `data/qualified-leads/qualified-leads-${timestamp}.csv`,
        latest_json: 'data/qualified-leads/latest-qualified-leads.json',
        latest_csv: 'data/qualified-leads/latest-qualified-leads.csv'
      },
      stats: {
        total_leads: qualifiedLeads.length,
        average_fit_score: parseFloat(avgFitScore),
        average_email_confidence: parseFloat(avgConfidence)
      },
      message: `Exported ${qualifiedLeads.length} qualified leads ready for Dan to email`
    });

  } catch (error: any) {
    console.error('[Export] Error:', error);
    return NextResponse.json({
      error: error.message || 'Export failed'
    }, { status: 500 });
  }
}
