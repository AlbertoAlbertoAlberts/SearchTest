import { getBrowser, fetchWithBrowser, closeBrowser } from './lib/browser.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test URLs for Huuto.net
const testUrls = [
  {
    name: 'Basic search - iphone',
    url: 'https://www.huuto.net/haku?words=iphone',
    description: 'Basic keyword search'
  },
  {
    name: 'Category - Matkapuhelimet (Mobile phones)',
    url: 'https://www.huuto.net/kohteet/matkapuhelimet/1',
    description: 'Mobile phones category'
  },
  {
    name: 'Search - puhelin',
    url: 'https://www.huuto.net/haku?words=puhelin',
    description: 'Finnish keyword for phone'
  },
  {
    name: 'Search - kannettava',
    url: 'https://www.huuto.net/haku?words=kannettava',
    description: 'Finnish keyword for laptop'
  },
  {
    name: 'Category - Tietokoneet',
    url: 'https://www.huuto.net/kohteet/tietokoneet/3',
    description: 'Computers category'
  },
  {
    name: 'Homepage',
    url: 'https://www.huuto.net/',
    description: 'Main homepage'
  }
];

// Check for Cloudflare/Turnstile indicators
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

// Count specific elements
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
    
    // Look for auction/listing indicators
    const auctionCount = countElements(html, 'class="auction');
    const itemCount = countElements(html, 'class="item');
    const listingCount = countElements(html, 'data-item');
    const huutoCount = countElements(html, 'huuto-'); // Huuto specific classes
    
    console.log(`\n📊 Response Analysis:`);
    console.log(`   HTML Size: ${(htmlSize / 1024).toFixed(2)} KB`);
    console.log(`   Auction elements: ${auctionCount}`);
    console.log(`   Item elements: ${itemCount}`);
    console.log(`   Listing data attributes: ${listingCount}`);
    console.log(`   Huuto-specific classes: ${huutoCount}`);
    
    console.log(`\n🔒 Protection Check:`);
    console.log(`   Turnstile: ${protection.turnstile ? '❌ DETECTED' : '✅ Not found'}`);
    console.log(`   Cloudflare: ${protection.cloudflare ? '⚠️  Detected' : '✅ Not found'}`);
    console.log(`   Challenge: ${protection.challenge ? '❌ DETECTED' : '✅ Not found'}`);
    console.log(`   Blocked (403): ${protection.blocked ? '❌ BLOCKED' : '✅ Not blocked'}`);
    console.log(`   Captcha: ${protection.captcha ? '❌ DETECTED' : '✅ Not found'}`);
    
    const hasProtection = protection.turnstile || protection.challenge || protection.blocked || protection.captcha;
    const hasContent = auctionCount > 0 || itemCount > 10 || listingCount > 0 || huutoCount > 5;
    
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
  console.log('HUUTO.NET ACCESSIBILITY TEST');
  console.log('Testing Finnish auction marketplace');
  console.log('='.repeat(70));
  
  const results = [];
  
  for (const test of testUrls) {
    const result = await testUrl(test.url, test.name, test.description);
    results.push({
      name: test.name,
      url: test.url,
      ...result
    });
    
    // Save first successful HTML for analysis
    if (result.accessible === true && result.html && results.filter(r => r.accessible === true).length === 1) {
      const filename = 'huuto-search-sample.html';
      await fs.writeFile(path.join(__dirname, filename), result.html);
      console.log(`\n💾 Saved HTML sample: ${filename}`);
    }
    
    // Small delay between requests
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
  
  // Final verdict
  console.log('\n' + '='.repeat(70));
  if (accessible > 0) {
    console.log('✅ HUUTO.NET IS ACCESSIBLE!');
    console.log('Recommendation: Proceed with implementation');
  } else if (blocked > accessible) {
    console.log('❌ HUUTO.NET IS BLOCKED');
    console.log('Recommendation: Site protected, not viable for scraping');
  } else {
    console.log('⚠️  HUUTO.NET STATUS UNCLEAR');
    console.log('Recommendation: Further investigation needed');
  }
  console.log('='.repeat(70) + '\n');
  
  await closeBrowser();
}

main().catch(console.error);
