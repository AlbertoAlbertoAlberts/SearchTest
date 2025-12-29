import { getBrowser, closeBrowser } from './lib/browser.js';
import fs from 'fs';

/**
 * Phase 3: Test accessibility of Vinted.lt
 * Purpose: Verify if Vinted.lt is accessible and determine search URL patterns
 */

async function testVintedAccess() {
  console.log('=== PHASE 3: VINTED.LT ACCESSIBILITY TEST ===\n');

  let browser;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Test 1: Homepage (already confirmed accessible via curl)
    console.log('Test 1: Homepage (skipping - already confirmed HTTP 200 via curl)\n');

    // Test 2-7: Different search URL patterns
    const searchTests = [
      {
        name: 'Catalog search',
        url: 'https://www.vinted.lt/catalog?search_text=iphone'
      },
      {
        name: 'Search query param',
        url: 'https://www.vinted.lt/search?q=iphone'
      },
      {
        name: 'Items path with search',
        url: 'https://www.vinted.lt/items?search_text=iphone'
      },
      {
        name: 'English catalog search',
        url: 'https://www.vinted.lt/en/catalog?search_text=iphone'
      },
      {
        name: 'Category-based search',
        url: 'https://www.vinted.lt/catalog?search_text=telefonas'
      },
      {
        name: 'Lithuanian electronics term',
        url: 'https://www.vinted.lt/catalog?search_text=elektronika'
      }
    ];

    for (const test of searchTests) {
      console.log(`Test: ${test.name}`);
      console.log(`URL: ${test.url}`);

      try {
        const response = await page.goto(test.url, {
          waitUntil: 'networkidle0',
          timeout: 30000
        });

        const status = response.status();
        const html = await page.content();

        console.log(`Status: ${status}`);
        console.log(`Page title: ${await page.title()}`);
        console.log(`HTML size: ${html.length} bytes`);

        // Check for key content indicators
        const hasListings = html.includes('data-testid="feed-item"') || 
                           html.includes('item-box') ||
                           html.includes('catalog-item');
        const hasCloudflare = html.includes('cf-challenge') || 
                             html.includes('challenge-platform');
        const hasTurnstile = html.includes('turnstile') || 
                            html.includes('cf-turnstile');

        console.log('Content indicators:');
        console.log(`- Has listings: ${hasListings ? '✅' : '❌'}`);
        console.log(`- Cloudflare challenge: ${hasCloudflare ? '⚠️ YES' : '✅ NO'}`);
        console.log(`- Turnstile: ${hasTurnstile ? '⚠️ YES' : '✅ NO'}`);

        // Look for specific text patterns
        const textPatterns = ['€', 'kaina', 'prekių ženklas', 'būklė'];
        const foundPatterns = textPatterns.filter(pattern => 
          html.toLowerCase().includes(pattern.toLowerCase())
        );
        console.log(`- Found patterns: ${foundPatterns.join(', ') || 'none'}`);

        // Save HTML for first successful search
        if (status === 200 && hasListings && test.name === 'Catalog search') {
          const filename = 'vinted-search-sample.html';
          fs.writeFileSync(filename, html);
          console.log(`✅ Sample HTML saved to ${filename}`);
        }

        console.log('');

      } catch (error) {
        console.error(`❌ Error: ${error.message}\n`);
      }
    }

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await closeBrowser();
  }
}

testVintedAccess().catch(console.error);
