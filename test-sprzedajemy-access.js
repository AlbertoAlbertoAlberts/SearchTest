import { getBrowser } from './lib/browser.js';

const TEST_URLS = [
  {
    name: 'Search - iphone',
    url: 'http://sprzedajemy.pl/szukaj?q=iphone',
    keywords: ['iphone']
  },
  {
    name: 'Category - telefony',
    url: 'http://sprzedajemy.pl/telefony-komorkowe',
    keywords: ['telefon', 'cena']
  },
  {
    name: 'Search - telefon',
    url: 'http://sprzedajemy.pl/szukaj?q=telefon',
    keywords: ['telefon']
  },
  {
    name: 'Search - laptop',
    url: 'http://sprzedajemy.pl/szukaj?q=laptop',
    keywords: ['laptop', 'komputer']
  },
  {
    name: 'Location - warszawa',
    url: 'http://sprzedajemy.pl/szukaj?q=iphone&location=warszawa',
    keywords: ['warszawa', 'iphone']
  },
  {
    name: 'Homepage',
    url: 'http://sprzedajemy.pl/',
    keywords: []
  }
];

// Protection indicators
const PROTECTION_INDICATORS = [
  'Cloudflare',
  'cf-challenge',
  'Turnstile',
  'Just a moment',
  'Checking your browser',
  'Enable JavaScript and cookies',
  'Captcha'
];

// Listing indicators
const LISTING_INDICATORS = [
  'offer-item',
  'listing-item',
  'ogłoszenie',
  'oferta',
  'card',
  'product',
  'zł',
  'PLN'
];

async function testUrl(url, name, keywords, maxRetries = 3) {
  const browser = await getBrowser();
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Testing: ${name}`);
      console.log(`URL: ${url}`);
      console.log(`Attempt: ${attempt}/${maxRetries}`);
      console.log('='.repeat(60));
      
      const page = await browser.newPage();
      
      const response = await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 60000
      });
      
      const html = await page.content();
      const htmlSize = Buffer.byteLength(html, 'utf8');
      
      // Check for protection
      let hasProtection = false;
      let protectionType = null;
      
      for (const indicator of PROTECTION_INDICATORS) {
        if (html.includes(indicator)) {
          hasProtection = true;
          protectionType = indicator;
          break;
        }
      }
      
      // Count listing indicators
      const listingCounts = {};
      for (const indicator of LISTING_INDICATORS) {
        const count = (html.match(new RegExp(indicator, 'gi')) || []).length;
        if (count > 0) {
          listingCounts[indicator] = count;
        }
      }
      
      // Count prices (zł)
      const priceCount = (html.match(/zł/gi) || []).length;
      
      await page.close();
      
      console.log(`\n✓ Response Status: ${response.status()}`);
      console.log(`✓ HTML Size: ${(htmlSize / 1024).toFixed(2)} KB`);
      
      if (hasProtection) {
        console.log(`\n❌ PROTECTION DETECTED: ${protectionType}`);
        console.log('   This page appears to be blocked by anti-bot protection.');
        return { success: false, blocked: true, protectionType, attempt };
      }
      
      console.log(`\n✓ Protection: NONE detected`);
      console.log(`✓ Price indicators (zł): ${priceCount}`);
      
      if (Object.keys(listingCounts).length > 0) {
        console.log('\n✓ Listing indicators found:');
        Object.entries(listingCounts).forEach(([indicator, count]) => {
          console.log(`  - ${indicator}: ${count}`);
        });
      } else {
        console.log('\n⚠ No listing indicators found (page may be empty or use different selectors)');
      }
      
      // Save HTML sample for category page if successful
      if (name.includes('Category') && priceCount > 5) {
        const fs = await import('fs/promises');
        await fs.writeFile(
          'sprzedajemy-search-sample.html',
          html,
          'utf8'
        );
        console.log('\n✓ HTML sample saved: sprzedajemy-search-sample.html');
      }
      
      return {
        success: true,
        blocked: false,
        htmlSize,
        priceCount,
        listingCounts,
        attempt
      };
      
    } catch (error) {
      console.log(`\n❌ Error on attempt ${attempt}/${maxRetries}:`, error.message);
      
      if (attempt < maxRetries) {
        console.log('   Retrying in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log('   Max retries reached.');
        return {
          success: false,
          blocked: false,
          error: error.message,
          attempt
        };
      }
    }
  }
}

async function runTests() {
  console.log('\n🚀 Starting Sprzedajemy.pl Accessibility Tests\n');
  console.log('Testing 6 URL patterns to determine scrapability...\n');
  
  const results = [];
  
  for (const test of TEST_URLS) {
    const result = await testUrl(test.url, test.name, test.keywords);
    results.push({
      name: test.name,
      url: test.url,
      ...result
    });
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  const accessible = results.filter(r => r.success && !r.blocked);
  const blocked = results.filter(r => r.blocked);
  const errors = results.filter(r => !r.success && !r.blocked);
  
  console.log(`\nTotal tests: ${results.length}`);
  console.log(`✓ Accessible: ${accessible.length}`);
  console.log(`❌ Blocked: ${blocked.length}`);
  console.log(`⚠ Errors: ${errors.length}`);
  
  if (accessible.length > 0) {
    console.log('\n✓ ACCESSIBLE PAGES:');
    accessible.forEach(r => {
      console.log(`  - ${r.name}: ${(r.htmlSize / 1024).toFixed(2)} KB, ${r.priceCount} prices`);
    });
  }
  
  if (blocked.length > 0) {
    console.log('\n❌ BLOCKED PAGES:');
    blocked.forEach(r => {
      console.log(`  - ${r.name}: ${r.protectionType}`);
    });
  }
  
  if (errors.length > 0) {
    console.log('\n⚠ ERROR PAGES:');
    errors.forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }
  
  // Verdict
  console.log('\n' + '='.repeat(60));
  if (blocked.length === 0 && accessible.length > 0) {
    console.log('✅ VERDICT: ACCESSIBLE - No protection detected on accessible pages');
    console.log('   Structure analysis needed to determine viability.');
  } else if (blocked.length > 0 && accessible.length === 0) {
    console.log('❌ VERDICT: BLOCKED - Protection detected, not viable for scraping');
  } else if (blocked.length === 0 && accessible.length === 0) {
    console.log('⚠ VERDICT: UNCLEAR - No successful page loads, further investigation needed');
  } else {
    console.log('⚠ VERDICT: PARTIAL - Mixed results, some pages blocked');
  }
  console.log('='.repeat(60) + '\n');
  
  process.exit(0);
}

runTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
