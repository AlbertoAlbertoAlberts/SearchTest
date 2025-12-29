/**
 * Soov.ee Phase 1 Accessibility Test
 * Testing if Cloudflare can be bypassed with Puppeteer
 */

import puppeteer from 'puppeteer';

async function testSoov() {
  console.log('[Soov.ee] Phase 1: Accessibility Test\n');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Test 1: Homepage
    console.log('Test 1: Homepage accessibility');
    await page.goto('https://www.soov.ee/', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const homeHtml = await page.content();
    console.log(`Homepage size: ${homeHtml.length} bytes`);
    
    if (homeHtml.includes('cf-chl-widget') || homeHtml.includes('cf-turnstile')) {
      console.log('❌ Cloudflare TURNSTILE detected - cannot bypass\n');
      await browser.close();
      return;
    }
    
    if (homeHtml.includes('Just a moment')) {
      console.log('⚠️  Still showing Cloudflare challenge (managed)\n');
    } else {
      console.log('✓ Homepage accessible\n');
    }
    
    // Test 2: Search URL patterns
    console.log('Test 2: Search URL discovery');
    const patterns = [
      'https://www.soov.ee/search?q=iphone',
      'https://www.soov.ee/otsi?q=iphone',
      'https://www.soov.ee/otsing?q=iphone',
      'https://www.soov.ee/kuulutused?q=iphone',
      'https://www.soov.ee/?q=iphone',
    ];

    for (const url of patterns) {
      console.log(`\nTesting: ${url}`);
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const html = await page.content();
        console.log(`  Size: ${html.length} bytes`);
        
        // Check for Turnstile
        if (html.includes('cf-chl-widget') || html.includes('cf-turnstile')) {
          console.log('  ❌ Cloudflare Turnstile - blocked');
          continue;
        }
        
        // Check for challenge still present
        if (html.includes('Just a moment')) {
          console.log('  ⚠️  Still showing Cloudflare challenge');
          continue;
        }
        
        // Check for 404
        if (html.includes('404') || html.includes('ei leitud') || html.includes('not found')) {
          console.log('  ❌ Returns 404');
          continue;
        }
        
        // Check for content
        const hasContent = 
          html.includes('kuulutus') ||
          html.includes('hind') ||
          html.includes('€') ||
          html.toLowerCase().includes('price');
        
        if (hasContent) {
          console.log('  ✓✓✓ WORKING PATTERN - Contains content!');
          
          const fs = await import('fs');
          fs.writeFileSync('soov-search-sample.html', html);
          console.log('  ✓ HTML saved to soov-search-sample.html');
          
          // Get title
          const title = await page.title();
          console.log(`  Page title: "${title}"`);
          break;
        } else {
          console.log('  ⚠️  No obvious content found');
        }
        
      } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`);
      }
    }

    await browser.close();
    console.log('\n[Soov.ee] Test complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (browser) await browser.close();
  }
}

testSoov();
