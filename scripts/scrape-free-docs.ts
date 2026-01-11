/**
 * Free Documentation Scraper - NO AI DEPENDENCY
 * Scrapes public government and free resources
 * Run with: npx ts-node scripts/scrape-free-docs.ts
 */

import { DocumentationScraper } from '../lib/scrapers/documentation-scraper.js';

async function scrapeFreeDocumentation() {
  const scraper = new DocumentationScraper();

  console.log('🆓 Starting FREE Documentation Scraping (No AI Cost)...\n');

  let totalScraped = 0;

  // Dave's Accounting Knowledge from FREE government sources
  console.log('💰 Scraping FREE accounting docs for Dave...');
  const daveCount = await scraper.scrapeFreeResources('dave', 'accounting_finance');
  console.log(`✅ Scraped ${daveCount} accounting documents\n`);
  totalScraped += daveCount;

  // Jordan's Organization Knowledge from FREE public sources
  console.log('📋 Scraping FREE organization docs for Jordan...');
  const jordanCount = await scraper.scrapeFreeResources('jordan', 'organization_management');
  console.log(`✅ Scraped ${jordanCount} organization documents\n`);
  totalScraped += jordanCount;

  // Atlas's Legal Knowledge from FREE government sources
  console.log('⚖️ Scraping FREE legal docs for Atlas...');
  const atlasCount = await scraper.scrapeFreeResources('atlas', 'legal_compliance');
  console.log(`✅ Scraped ${atlasCount} legal documents\n`);
  totalScraped += atlasCount;

  console.log('🎉 FREE Documentation Scraping Complete!');
  console.log(`\n📊 Total Documents Scraped: ${totalScraped}`);
  console.log('💵 Cost: $0.00 (100% FREE)');
  console.log('\nKnowledge Base Summary:');
  console.log(`- Dave (Accountant): ${daveCount} docs`);
  console.log(`- Jordan (Organizer): ${jordanCount} docs`);
  console.log(`- Atlas (Knowledge Base): ${atlasCount} docs`);
}

scrapeFreeDocumentation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
