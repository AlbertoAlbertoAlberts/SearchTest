import { getBrowser, fetchWithBrowser, closeBrowser } from './lib/browser.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testUrls = [
  {
    name: 'Basic search - iphone',
    url: 'https://allegrolokalnie.pl/oferty/q/iphone',
    description: 'Basic keyword search'
  },
  {
    name: 'Category - Telefony',
    url: 'https://allegrolokalnie.pl/kategoria/telefony-i-akcesoria/telefony',
    description: 'Phones category'
  },
  {
    name: 'Search - telefon',
    url: 'https://allegrolokalnie.pl/oferty/q/telefon',
    description: 'Polish keyword for phone'
  },
  {
    name: 'Search - laptop',
    url: 'https://allegrolokalnie.pl/oferty/q/laptop',
    description: 'Laptop search'
  },
  {
    name: 'Location - Warszawa',
    url: 'https://allegrolokalnie.pl/oferty/warszawa/q/iphone',
    description: 'Warsaw location filter'
  },
  {
    name: 'Homepage',
    url: 'https://allegrolokalnie.pl/',
    description: 'Main homepage'
  }
];

function checkProtection(html) {
  const indicators = {
    turnstile: html.includes('turnstile') || html.includes('cf-turnstile'),
    cloudflare: html.includes('cf-ray') || html.includes('cloudflare'),
    challenge: html.includes('challenge-platform') || html.includes('jschl'),
    blocked: html.includes('403') && html.includes('Forbidden'),
    captcha: html.includes('captcha') || html.includes('recaptcha')
  };
  return indicators;
}

function countElements(html, selector) {
  const regex = new RegExp(selector, 'g');
  const matches = html.match(regex);
  return matches ? matches.length : 0;
}

async function testUrl(url, name, description) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Testing: ${name}`);
  console.log(`URL: ${url}`);
  console.log(`Description: ${description}`);
  console.log('='.repeat(70));
  
  try {
    const html = await fetchWithBrowser(url, {
      timeout: 30000,
      waitUntil: 'networkidle0'
    });
    
    const protection = checkProtection(html);
    const htmlSize = Buffer.byteLength(html, 'utf8');
    
    // Look for listing indicators
    const listingCount = countElements(html, 'data-testid="listing-item');
    const offerCount = countElements(html, 'class="offer');
    const cardCount = countElements(html, 'class="card');
    const mlCardCount = countElements(html, 'data-ml-card');
    const priceCount = countElements(html, 'zł');
    
    console.log(`\n📊 Response Analysis:`);
    console.log(`   HTML Size: ${(htmlSize / 1024).toFixed(2)} KB`);
    console.log(`   Listing items: ${listingCount}`);
    console.log(`   Offer elements: ${offerCount}`);
    console.log(`   Card elements: ${cardCount}`);
    console.log(`   ML cards: ${mlCardCount}`);
    console.log(`   Price indicators (zł): ${priceCount}`);
    
    console.log(`\n🔒 Protection Check:`);
    console.log(`   Turnstile: ${protection.turnstile ? '❌ DETECTED' : '✅ Not found'}`);
    console.log(`   Cloudflare: ${protection.cloudflare ? '⚠️  Detected' : '✅ Not found'}`);
    console.log(`   Challenge: ${protection.challenge ? '❌ DETECTED' : '✅ Not found'}`);
    console.log(`   Blocked (403): ${protection.blocked ? '❌ BLOCKED' : '✅ Not blocked'}`);
    console.log(`   Captcha: ${protection.captcha ? '❌ DETECTED' : '✅ Not found'}`);
    
    const hasProtection = protection.turnstile || protection.challenge || protection.blocked;
    const hasContent = listingCount > 0 || offerCount > 5 || mlCardCount > 0 || priceCount > 10;
    
    if (hasProtection) {
      console.log(`\n❌ Result: BLOCKED - Protection detected`);
      return { accessible: false, protected: true, html };
    } else if (hasContent) {
      console.log(`\n✅ Result: ACCESSIBLE - Content detected`);
      return { accessible: true, protected: false, html };
    } else {
      console.log(`\n⚠️  Result: UNCLEAR - No protection but limited content`);
      return { accessible: 'unclear', protected: false, html };
    }
    
  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
    return { accessible: false, error: error.message };
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('ALLEGRO LOKALNIE ACCESSIBILITY TEST');
  console.log('Testing Polish local classifieds (owned by Allegro)');
  console.log('='.repeat(70));
  
  const results = [];
  
  for (const test of testUrls) {
    const result = await testUrl(test.url, test.name, test.description);
    results.push({
      name: test.name,
      url: test.url,
      ...result
    });
    
    // Save first successful HTML
    if (result.accessible === true && result.html && results.filter(r => r.accessible === true).length === 1) {
      const filename = 'allegro-search-sample.html';
      await fs.writeFile(path.join(__dirname, filename), result.html);
      console.log(`\n💾 Saved HTML sample: ${filename}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));
  
  const accessible = results.filter(r => r.accessible === true).length;
  const blocked = results.filter(r => r.accessible === false && r.protected).length;
  const errors = results.filter(r => r.error).length;
  const unclear = results.filter(r => r.accessible === 'unclear').length;
  
  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Accessible: ${accessible}`);
  console.log(`❌ Blocked: ${blocked}`);
  console.log(`⚠️  Unclear: ${unclear}`);
  console.log(`💥 Errors: ${errors}`);
  
  console.log('\n📋 Detailed Results:');
  results.forEach((result, index) => {
    const status = result.accessible === true ? '✅' : 
                   result.accessible === 'unclear' ? '⚠️ ' : '❌';
    const reason = result.protected ? '(Protected)' : 
                   result.error ? `(Error: ${result.error})` : '';
    console.log(`   ${index + 1}. ${status} ${result.name} ${reason}`);
  });
  
  console.log('\n' + '='.repeat(70));
  if (accessible > 0) {
    console.log('✅ ALLEGRO LOKALNIE IS ACCESSIBLE!');
    console.log('Recommendation: Proceed with implementation');
  } else if (blocked > accessible) {
    console.log('❌ ALLEGRO LOKALNIE IS BLOCKED');
    console.log('Recommendation: Site protected, not viable for scraping');
  } else {
    console.log('⚠️  ALLEGRO LOKALNIE STATUS UNCLEAR');
    console.log('Recommendation: Further investigation needed');
  }
  console.log('='.repeat(70) + '\n');
  
  await closeBrowser();
}

main().catch(console.error);
