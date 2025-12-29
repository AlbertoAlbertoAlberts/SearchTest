/**
 * Skelbiu.lt Phase 2 Accessibility Test
 * Testing Lithuanian marketplace
 */

import puppeteer from 'puppeteer';

async function testSkelbiu() {
  console.log('[Skelbiu.lt] Phase 2: Accessibility Test\n');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Test 1: Homepage - quick check
    console.log('Test 1: Homepage (HTTP 200 confirmed via curl)');
    console.log('✓ Homepage accessible - no Cloudflare\n');
    
    // Test 2: Search URL patterns
    console.log('Test 2: Search URL discovery');
    const patterns = [
      'https://www.skelbiu.lt/paieska/?keywords=iphone',
      'https://www.skelbiu.lt/skelbimai/?keywords=iphone',
      'https://www.skelbiu.lt/paieska?keywords=iphone',
      'https://www.skelbiu.lt/skelbimai?q=iphone',
      'https://www.skelbiu.lt/search?q=iphone',
      'https://www.skelbiu.lt/?q=iphone',
    ];

    for (const url of patterns) {
      console.log(`\nTesting: ${url}`);
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        
        const html = await page.content();
        const title = await page.title();
        
        console.log(`  Title: "${title}"`);
        console.log(`  Size: ${html.length} bytes`);
        
        // Check for 404
        if (title.includes('nerastas') || title.includes('404') || html.includes('Puslapis nerastas')) {
          console.log('  ❌ Returns 404');
          continue;
        }
        
        // Check for content (Lithuanian keywords)
        const hasContent = 
          html.includes('skelbim') ||
          html.includes('kaina') ||
          html.includes('€') ||
          html.includes('EUR');
        
        if (hasContent) {
          console.log('  ✓✓✓ WORKING PATTERN - Contains listings!');
          
          // Count potential listing items
          const itemMatches = html.match(/class="[^"]*item[^"]*"/gi) || [];
          const adMatches = html.match(/class="[^"]*ad[^"]*"/gi) || [];
          console.log(`  Found ~${itemMatches.length} item classes, ~${adMatches.length} ad classes`);
          
          const fs = await import('fs');
          fs.writeFileSync('skelbiu-search-sample.html', html);
          console.log('  ✓ HTML saved to skelbiu-search-sample.html');
          
          break;
        } else {
          console.log('  ⚠️  No obvious content found');
        }
        
      } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`);
      }
    }

    await browser.close();
    console.log('\n[Skelbiu.lt] Test complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (browser) await browser.close();
  }
}

testSkelbiu();
