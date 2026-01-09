/**
 * Export Qualified Leads for Dan's Email Campaigns
 * Exports leads that are ready to be contacted via email
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface QualifiedLead {
  id: string;
  username: string;
  email: string;
  email_confidence: number;
  full_name: string | null;
  fit_score: number;
  interests: string[];
  relationship_goal: string | null;
  source_type: string;
  source_url: string;
  trigger_content: string;
  created_at: string;
}

async function exportQualifiedLeads() {
  console.log('🔍 Fetching qualified leads from database...\n');

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
    process.exit(1);
  }

  if (!leads || leads.length === 0) {
    console.log('⚠️  No qualified leads found. Keep scraping!');
    process.exit(0);
  }

  console.log(`✅ Found ${leads.length} qualified leads ready to email\n`);

  // Transform data for export
  const qualifiedLeads: QualifiedLead[] = leads.map(lead => ({
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

  // Export latest as symlink (for easy access)
  const latestJsonPath = path.join(outputDir, 'latest-qualified-leads.json');
  const latestCsvPath = path.join(outputDir, 'latest-qualified-leads.csv');

  if (fs.existsSync(latestJsonPath)) fs.unlinkSync(latestJsonPath);
  if (fs.existsSync(latestCsvPath)) fs.unlinkSync(latestCsvPath);

  fs.copyFileSync(jsonPath, latestJsonPath);
  fs.copyFileSync(csvPath, latestCsvPath);

  console.log(`📄 Latest exports: latest-qualified-leads.json/csv\n`);

  // Summary stats
  const avgFitScore = (qualifiedLeads.reduce((sum, l) => sum + l.fit_score, 0) / qualifiedLeads.length).toFixed(1);
  const avgConfidence = (qualifiedLeads.reduce((sum, l) => sum + l.email_confidence, 0) / qualifiedLeads.length).toFixed(2);

  console.log('📊 Summary:');
  console.log(`   Total qualified leads: ${qualifiedLeads.length}`);
  console.log(`   Average fit score: ${avgFitScore}`);
  console.log(`   Average email confidence: ${avgConfidence}`);
  console.log(`   Ready to send emails via Dan bot\n`);

  console.log('✅ Export complete!\n');
}

// Run export
exportQualifiedLeads().catch(console.error);
