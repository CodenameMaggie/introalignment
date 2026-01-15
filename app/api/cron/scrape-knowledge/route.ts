import { NextRequest, NextResponse } from 'next/server';
import { DocumentationScraper } from '@/lib/scrapers/documentation-scraper';

// Force dynamic rendering - prevent build-time execution
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET(request: NextRequest) {
  try {
    const scraper = new DocumentationScraper();

    console.log('🆓 Starting FREE Documentation Scraping (No AI Cost)...');

    let totalScraped = 0;
    const results: any[] = [];

    // Dave's Accounting Knowledge from FREE government sources
    console.log('💰 Scraping FREE accounting docs for Dave...');
    const daveCount = await scraper.scrapeFreeResources('dave', 'accounting_finance');
    console.log(`✅ Scraped ${daveCount} accounting documents`);
    totalScraped += daveCount;
    results.push({ bot: 'dave', category: 'accounting_finance', count: daveCount });

    // Jordan's Organization Knowledge from FREE public sources
    console.log('📋 Scraping FREE organization docs for Jordan...');
    const jordanCount = await scraper.scrapeFreeResources('jordan', 'organization_management');
    console.log(`✅ Scraped ${jordanCount} organization documents`);
    totalScraped += jordanCount;
    results.push({ bot: 'jordan', category: 'organization_management', count: jordanCount });

    // Atlas's Legal Knowledge from FREE government sources
    console.log('⚖️ Scraping FREE legal docs for Atlas...');
    const atlasCount = await scraper.scrapeFreeResources('atlas', 'legal_compliance');
    console.log(`✅ Scraped ${atlasCount} legal documents`);
    totalScraped += atlasCount;
    results.push({ bot: 'atlas', category: 'legal_compliance', count: atlasCount });

    console.log('🎉 FREE Documentation Scraping Complete!');
    console.log(`📊 Total Documents Scraped: ${totalScraped}`);
    console.log('💵 Cost: $0.00 (100% FREE)');

    return NextResponse.json({
      success: true,
      message: 'FREE documentation scraping completed',
      totalKnowledgeAdded: totalScraped,
      cost: '$0.00',
      results,
      summary: {
        dave: `${daveCount} accounting docs`,
        jordan: `${jordanCount} organization docs`,
        atlas: `${atlasCount} legal docs`
      }
    });

  } catch (error: any) {
    console.error('❌ Knowledge scraping error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
