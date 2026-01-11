/**
 * Populate Bot Knowledge Bases
 * Run with: npx ts-node scripts/populate-bot-knowledge.ts
 */

import { KnowledgeScraper } from '../lib/knowledge/knowledge-scraper';

async function populateKnowledge() {
  const scraper = new KnowledgeScraper();

  console.log('🚀 Starting Knowledge Base Population...\n');

  // Dave's Accounting & Finance Knowledge
  console.log('📊 Populating Dave (Accounting) Knowledge Base...');
  const daveKnowledge = await scraper.scrapeAndStore('dave', 'accounting_finance', [
    {
      name: 'accounting_finance',
      url: 'https://www.irs.gov/businesses',
      category: 'accounting_finance',
      type: 'regulation',
      authority: 'high'
    },
    {
      name: 'business_structures',
      url: 'https://www.sba.gov/business-guide',
      category: 'accounting_finance',
      type: 'guideline',
      authority: 'high'
    }
  ]);
  console.log(`✅ Stored ${daveKnowledge} knowledge items for Dave\n`);

  // Jordan's Organization & Management Knowledge
  console.log('📋 Populating Jordan (Organization) Knowledge Base...');
  const jordanKnowledge = await scraper.scrapeAndStore('jordan', 'organization_management', [
    {
      name: 'organization_management',
      url: 'https://www.pmi.org/learning/library',
      category: 'organization_management',
      type: 'best_practice',
      authority: 'high'
    },
    {
      name: 'crm_systems',
      url: 'https://www.salesforce.com/resources/articles/crm-best-practices',
      category: 'organization_management',
      type: 'best_practice',
      authority: 'medium'
    }
  ]);
  console.log(`✅ Stored ${jordanKnowledge} knowledge items for Jordan\n`);

  // Atlas's General Knowledge Base (for sharing across all bots)
  console.log('🗺️ Populating Atlas (Central Knowledge) Base...');
  const atlasKnowledge = await scraper.scrapeAndStore('atlas', 'legal_compliance', [
    {
      name: 'legal_compliance',
      url: 'https://www.ftc.gov/business-guidance',
      category: 'legal_compliance',
      type: 'regulation',
      authority: 'high'
    }
  ]);
  console.log(`✅ Stored ${atlasKnowledge} knowledge items for Atlas\n`);

  // Store some initial memories for coordination
  console.log('🧠 Creating Initial Bot Memories...');

  await scraper.storeMemory(
    'jordan',
    'procedure',
    'When coordinating multiple bots',
    'Always consult Dave for financial questions, Dan for dating advice, Annie for relationship support, and Atlas for general knowledge lookups'
  );

  await scraper.storeMemory(
    'dave',
    'rule',
    'Financial record keeping',
    'Maintain detailed records of all client transactions, subscriptions, and refunds for at least 7 years per IRS requirements'
  );

  await scraper.storeMemory(
    'atlas',
    'fact',
    'Bot specializations',
    'Henry=Lead Conversion, Dan=Dating/Singles, Annie=Relationships/Grief, Dave=Accounting/Finance, Jordan=Organization/Coordination, Atlas=Knowledge/Content'
  );

  console.log('✅ Initial memories created\n');

  console.log('🎉 Knowledge Base Population Complete!');
  console.log('\nSummary:');
  console.log(`- Dave (Accounting): ${daveKnowledge} items`);
  console.log(`- Jordan (Organization): ${jordanKnowledge} items`);
  console.log(`- Atlas (Knowledge Base): ${atlasKnowledge} items`);
  console.log(`- Total: ${daveKnowledge + jordanKnowledge + atlasKnowledge} knowledge items`);
}

populateKnowledge()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
